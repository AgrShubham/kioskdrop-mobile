import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import EventSource from "react-native-sse";
import { getActiveApiBaseUrl } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { getStoredSessionToken } from "@/lib/storage";
import { telemetryEventSchema } from "@/schemas/api";
import { useAppStore } from "@/store/app-store";
import type { TelemetryEventType } from "@/types/domain";
import { QUERY_KEYS } from "@/hooks/useSession";

const TELEMETRY_EVENT_TYPES: TelemetryEventType[] = [
  "LOCKER_RESERVED",
  "DOOR_UNLOCKED",
  "ASSET_REMOVED",
  "ASSET_RETURNED",
  "SECURITY_MISMATCH_ALARM",
  "TICKET_EXPIRED",
  "TICKET_OVERDUE",
  "INVENTORY_RESTOCKED",
];

const INITIAL_BACKOFF_MS = 2000;
const MAX_BACKOFF_MS = 15000;

export function useTelemetrySSE(sessionIdentityKey?: string) {
  const queryClient = useQueryClient();
  const apiBaseUrlOverride = useAppStore((s) => s.apiBaseUrlOverride);
  const setSseState = useAppStore((s) => s.setSseState);
  const setLastEventId = useAppStore((s) => s.setLastEventId);
  const prependTelemetryEvent = useAppStore((s) => s.prependTelemetryEvent);

  const eventSourceRef = useRef<EventSource<TelemetryEventType> | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastEventIdRef = useRef<string | null>(
    useAppStore.getState().lastEventId
  );
  const backoffMsRef = useRef<number>(INITIAL_BACKOFF_MS);
  const isMountedRef = useRef<boolean>(true);
  const appStateRef = useRef<string>(AppState.currentState ?? "active");

  useEffect(() => {
    isMountedRef.current = true;

    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const teardownConnection = () => {
      clearReconnectTimer();
      if (eventSourceRef.current) {
        try {
          eventSourceRef.current.close();
        } catch {
          // Ignore close errors
        }
        eventSourceRef.current = null;
      }
    };

    const scheduleReconnect = () => {
      clearReconnectTimer();
      if (!isMountedRef.current) return;
      if (
        appStateRef.current === "background" ||
        appStateRef.current === "inactive"
      ) {
        return;
      }

      const delay = backoffMsRef.current;
      backoffMsRef.current = Math.min(MAX_BACKOFF_MS, delay * 2);
      reconnectTimerRef.current = setTimeout(() => {
        void connect();
      }, delay);
    };

    const connect = async () => {
      teardownConnection();
      if (!isMountedRef.current) return;
      if (
        appStateRef.current === "background" ||
        appStateRef.current === "inactive"
      ) {
        return;
      }

      const baseUrl = getActiveApiBaseUrl();
      const token = await getStoredSessionToken();
      if (!isMountedRef.current) return;

      const headers: Record<string, string> = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(lastEventIdRef.current
          ? { "Last-Event-ID": lastEventIdRef.current }
          : {}),
      };

      try {
        const es = new EventSource<TelemetryEventType>(
          `${baseUrl}/api/telemetry/stream`,
          {
            headers,
            pollingInterval: 0,
            lineEndingCharacter: "\n",
          }
        );

        eventSourceRef.current = es;

        es.addEventListener("open", () => {
          if (!isMountedRef.current) return;
          backoffMsRef.current = INITIAL_BACKOFF_MS;
          setSseState(true, null);
        });

        es.addEventListener("error", (err) => {
          if (!isMountedRef.current) return;
          const message =
            "message" in err && err.message
              ? err.message
              : "Telemetry stream interrupted";
          setSseState(false, message);
          teardownConnection();
          scheduleReconnect();
        });

        for (const eventType of TELEMETRY_EVENT_TYPES) {
          es.addEventListener(eventType, (evt) => {
            if (!isMountedRef.current) return;
            if (!evt.data) return;

            try {
              const rawJson: unknown = JSON.parse(evt.data);
              const parsed = telemetryEventSchema.safeParse(rawJson);
              if (!parsed.success) return;

              const telemetryEvent = parsed.data;
              lastEventIdRef.current = evt.lastEventId || telemetryEvent.id;
              setLastEventId(lastEventIdRef.current);
              prependTelemetryEvent(telemetryEvent);

              if (telemetryEvent.type === "SECURITY_MISMATCH_ALARM") {
                void haptics.error();
              }

              void queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.lockers,
              });
              void queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.analytics,
              });
              void queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.compliance,
              });
              void queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.finops,
              });
            } catch {
              // Ignore malformed event frame
            }
          });
        }
      } catch (err) {
        setSseState(
          false,
          err instanceof Error ? err.message : "Failed to initialize SSE"
        );
        scheduleReconnect();
      }
    };

    void connect();

    const appStateSubscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        const prevState = appStateRef.current;
        appStateRef.current = nextState;

        if (nextState === "background" || nextState === "inactive") {
          setSseState(false, "App backgrounded");
          teardownConnection();
          return;
        }

        if (
          nextState === "active" &&
          (prevState === "background" || prevState === "inactive")
        ) {
          backoffMsRef.current = INITIAL_BACKOFF_MS;
          void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lockers });
          void connect();
        }
      }
    );

    return () => {
      isMountedRef.current = false;
      appStateSubscription.remove();
      teardownConnection();
    };
  }, [
    apiBaseUrlOverride,
    sessionIdentityKey,
    queryClient,
    setLastEventId,
    setSseState,
    prependTelemetryEvent,
  ]);
}
