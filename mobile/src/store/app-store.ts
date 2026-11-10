import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ThemeMode } from "@/lib/theme";
import { normalizeApiBaseUrl } from "@/lib/env";
import type { TelemetryEvent } from "@/types/domain";

const MAX_TELEMETRY_EVENTS = 50;

interface AppState {
  themeMode: ThemeMode;
  apiBaseUrlOverride: string | null;
  sseConnected: boolean;
  sseError: string | null;
  lastEventId: string | null;
  telemetryEvents: TelemetryEvent[];
  personaSheetOpen: boolean;
  telemetryDrawerOpen: boolean;

  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;
  setApiBaseUrlOverride: (url: string | null) => boolean;
  setSseState: (connected: boolean, error?: string | null) => void;
  setLastEventId: (id: string | null) => void;
  prependTelemetryEvent: (event: TelemetryEvent) => void;
  clearTelemetryEvents: () => void;
  setPersonaSheetOpen: (open: boolean) => void;
  setTelemetryDrawerOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      themeMode: "dark",
      apiBaseUrlOverride: null,
      sseConnected: false,
      sseError: null,
      lastEventId: null,
      telemetryEvents: [],
      personaSheetOpen: false,
      telemetryDrawerOpen: false,

      setThemeMode: (mode) => set({ themeMode: mode }),

      toggleThemeMode: () =>
        set((state) => ({
          themeMode: state.themeMode === "dark" ? "light" : "dark",
        })),

      setApiBaseUrlOverride: (rawUrl) => {
        if (!rawUrl || !rawUrl.trim()) {
          set({ apiBaseUrlOverride: null });
          return true;
        }
        const normalized = normalizeApiBaseUrl(rawUrl);
        if (!normalized) return false;
        set({ apiBaseUrlOverride: normalized });
        return true;
      },

      setSseState: (connected, error = null) =>
        set({ sseConnected: connected, sseError: error }),

      setLastEventId: (id) => set({ lastEventId: id }),

      prependTelemetryEvent: (event) =>
        set((state) => {
          const deduped = state.telemetryEvents.filter((e) => e.id !== event.id);
          return {
            telemetryEvents: [event, ...deduped].slice(0, MAX_TELEMETRY_EVENTS),
            lastEventId: event.id,
          };
        }),

      clearTelemetryEvents: () => set({ telemetryEvents: [] }),

      setPersonaSheetOpen: (open) => set({ personaSheetOpen: open }),

      setTelemetryDrawerOpen: (open) => set({ telemetryDrawerOpen: open }),
    }),
    {
      name: "@kioskdrop/app-preferences",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        themeMode: state.themeMode,
        apiBaseUrlOverride: state.apiBaseUrlOverride,
      }),
    }
  )
);

