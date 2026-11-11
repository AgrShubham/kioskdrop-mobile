import { z } from "zod";
import {
  analyticsResponseSchema,
  apiErrorPayloadSchema,
  complianceGetResponseSchema,
  complianceToggleResponseSchema,
  diagnoseReserveResponseSchema,
  finopsCreateResponseSchema,
  finopsGetResponseSchema,
  inboundWebhookTriggerResponseSchema,
  kioskForeignDeviceResponseSchema,
  kioskRemoveAssetResponseSchema,
  kioskReturnAssetResponseSchema,
  kioskUnlockResponseSchema,
  landedCostResponseSchema,
  lockersResponseSchema,
  receptionScanResponseSchema,
  roomsResponseSchema,
  sessionCurrentResponseSchema,
  switchRoleResponseSchema,
  webhookReplayResponseSchema,
  webhooksGetResponseSchema,
} from "@/schemas/api";
import type { UserRole } from "@/types/domain";
import { resolveApiBaseUrl } from "@/lib/env";
import { getStoredSessionToken } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";

const DEFAULT_TIMEOUT_MS = 12_000;

export class NetworkConnectionError extends Error {
  public readonly baseUrl: string;
  public readonly causeError?: unknown;

  constructor(message: string, baseUrl: string, causeError?: unknown) {
    super(message);
    this.name = "NetworkConnectionError";
    this.baseUrl = baseUrl;
    this.causeError = causeError;
  }
}

export class ApiClientError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;
  public readonly requestId?: string;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: unknown,
    requestId?: string
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}

export function generateIdempotencyKey(): string {
  return `idemp_mob_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function getActiveApiBaseUrl(): string {
  const overrideUrl = useAppStore.getState().apiBaseUrlOverride;
  return resolveApiBaseUrl({ overrideUrl });
}

interface RequestOptions<T> {
  path: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  schema?: z.ZodType<T>;
  baseUrl?: string;
  timeoutMs?: number;
}

export async function apiRequest<T>({
  path,
  method = "GET",
  body,
  headers = {},
  schema,
  baseUrl,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: RequestOptions<T>): Promise<T> {
  const resolvedBase = baseUrl ?? getActiveApiBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${resolvedBase}${normalizedPath}`;

  const token = await getStoredSessionToken();
  const requestHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };

  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    const isTimeout =
      err instanceof Error && err.name === "AbortError";
    throw new NetworkConnectionError(
      isTimeout
        ? `Server request timed out (${timeoutMs / 1000}s) reaching ${resolvedBase}`
        : `Unable to reach KioskDrop API at ${resolvedBase}. Verify server & LAN/emulator address.`,
      resolvedBase,
      err
    );
  } finally {
    clearTimeout(timerId);
  }

  let jsonPayload: unknown = null;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      jsonPayload = await response.json();
    } catch {
      jsonPayload = null;
    }
  } else {
    try {
      const text = await response.text();
      jsonPayload = text ? JSON.parse(text) : null;
    } catch {
      jsonPayload = null;
    }
  }

  if (!response.ok) {
    const parsedErr = apiErrorPayloadSchema.safeParse(jsonPayload);
    if (parsedErr.success) {
      throw new ApiClientError(
        response.status,
        parsedErr.data.error.code,
        parsedErr.data.error.message,
        parsedErr.data.error.details,
        parsedErr.data.requestId
      );
    }

    throw new ApiClientError(
      response.status,
      `HTTP_${response.status}`,
      `Backend returned HTTP ${response.status} for ${normalizedPath}`,
      jsonPayload
    );
  }

  if (schema) {
    const validated = schema.safeParse(jsonPayload);
    if (!validated.success) {
      throw new ApiClientError(
        response.status,
        "SCHEMA_MISMATCH",
        `Unexpected response payload from ${normalizedPath}: ${validated.error.issues[0]?.message ?? "invalid shape"}`,
        validated.error.issues
      );
    }
    return validated.data;
  }

  return jsonPayload as T;
}

export interface PingResult {
  ok: boolean;
  latencyMs: number;
  roomCount: number;
  error?: string;
}

export async function pingServerLatency(baseUrl?: string): Promise<PingResult> {
  const startedAt = Date.now();
  try {
    const data = await apiRequest({
      path: "/api/rooms",
      method: "GET",
      schema: roomsResponseSchema,
      baseUrl,
      timeoutMs: 8_000,
    });
    return {
      ok: true,
      latencyMs: Math.max(1, Date.now() - startedAt),
      roomCount: data.rooms.length,
    };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Math.max(1, Date.now() - startedAt),
      roomCount: 0,
      error: err instanceof Error ? err.message : "Ping failed",
    };
  }
}

export const kioskApi = {
  getSessionCurrent: () =>
    apiRequest({
      path: "/api/session/current",
      schema: sessionCurrentResponseSchema,
    }),

  switchRole: (payload: { role?: UserRole; userId?: string }) =>
    apiRequest({
      path: "/api/session/role",
      method: "POST",
      body: payload,
      schema: switchRoleResponseSchema,
    }),

  getRooms: () =>
    apiRequest({
      path: "/api/rooms",
      schema: roomsResponseSchema,
    }),

  getLockers: () =>
    apiRequest({
      path: "/api/lockers",
      schema: lockersResponseSchema,
    }),

  diagnoseAndReserve: (
    payload: {
      meetingRoomId?: string;
      qrCodeSlug?: string;
      symptomCode: string;
      portDamaged?: boolean;
      preferredSkuId?: string | null;
    },
    idempotencyKey: string
  ) =>
    apiRequest({
      path: "/api/diagnose-and-reserve",
      method: "POST",
      body: payload,
      headers: { "idempotency-key": idempotencyKey },
      schema: diagnoseReserveResponseSchema,
    }),

  authenticateAndUnlock: (payload: {
    lockerId: string;
    authMethod: "PIN" | "RFID" | "BIOMETRIC";
    credentialValue: string;
  }) =>
    apiRequest({
      path: "/api/kiosk/authenticate-and-unlock",
      method: "POST",
      body: payload,
      schema: kioskUnlockResponseSchema,
    }),

  removeAsset: (payload: { lockerId: string; compartmentNumber: number }) =>
    apiRequest({
      path: "/api/kiosk/remove-asset",
      method: "POST",
      body: payload,
      schema: kioskRemoveAssetResponseSchema,
    }),

  returnAsset: (payload: {
    lockerId: string;
    compartmentNumber: number;
    assetSerialNumber: string;
    usbVendorId: string;
    usbProductId: string;
    chargingConnected: boolean;
  }) =>
    apiRequest({
      path: "/api/kiosk/return-asset",
      method: "POST",
      body: payload,
      schema: kioskReturnAssetResponseSchema,
    }),

  reportForeignDevice: (payload: {
    lockerId: string;
    compartmentNumber: number;
    foreignVendorId?: string;
    foreignProductId?: string;
    simulatedAttackVector?: string;
  }) =>
    apiRequest({
      path: "/api/kiosk/report-foreign-device",
      method: "POST",
      body: payload,
      schema: kioskForeignDeviceResponseSchema,
    }),

  getCompliance: () =>
    apiRequest({
      path: "/api/admin/compliance",
      schema: complianceGetResponseSchema,
    }),

  toggleWhitelist: (payload: { assetId: string; hidWhitelisted: boolean }) =>
    apiRequest({
      path: "/api/admin/compliance",
      method: "POST",
      body: payload,
      schema: complianceToggleResponseSchema,
    }),

  computeLandedCost: (payload: {
    cifAmountINR: number;
    hsnCode: string;
    procurementMode: "DIRECT_IMPORT" | "DOMESTIC_WHOLESALE";
  }) =>
    apiRequest({
      path: "/api/admin/compliance/landed-cost",
      method: "POST",
      body: payload,
      schema: landedCostResponseSchema,
    }),

  getFinops: () =>
    apiRequest({
      path: "/api/admin/finops",
      schema: finopsGetResponseSchema,
    }),

  createFinopsReplenishment: (payload: {
    skuId: string;
    quantity: number;
    procurementMode: "DIRECT_IMPORT" | "DOMESTIC_WHOLESALE";
    cardProvider: "ZAGGLE_CARD" | "HAPPAY_PETTY_CASH";
    erpTarget: "SAP_S4HANA" | "ORACLE_NETSUITE" | "ZOHO_BOOKS";
    vendorName?: string;
  }) =>
    apiRequest({
      path: "/api/admin/finops",
      method: "POST",
      body: payload,
      schema: finopsCreateResponseSchema,
    }),

  scanReceptionAsset: (payload: {
    purchaseOrderId: string;
    skuId: string;
    serialNumber: string;
    usbVendorId: string;
    usbProductId: string;
    targetLockerId: string;
    targetCompartmentNumber: number;
  }) =>
    apiRequest({
      path: "/api/admin/reception/scan",
      method: "POST",
      body: payload,
      schema: receptionScanResponseSchema,
    }),

  getAnalytics: () =>
    apiRequest({
      path: "/api/admin/analytics",
      schema: analyticsResponseSchema,
    }),

  getWebhooks: () =>
    apiRequest({
      path: "/api/admin/webhooks",
      schema: webhooksGetResponseSchema,
    }),

  replayWebhook: (payload: { webhookEventId: string }) =>
    apiRequest({
      path: "/api/admin/webhooks",
      method: "POST",
      body: payload,
      schema: webhookReplayResponseSchema,
    }),

  triggerMockServiceNowWebhook: () =>
    apiRequest({
      path: "/api/webhooks/servicenow",
      method: "POST",
      body: {
        event: "incident.updated",
        sys_id: `inc_mob_${Date.now()}`,
        priority: "1",
      },
      headers: {
        "x-servicenow-signature": "valid_mobile_demo_signature",
      },
      schema: inboundWebhookTriggerResponseSchema,
    }),

  triggerMockZendeskWebhook: () =>
    apiRequest({
      path: "/api/webhooks/zendesk",
      method: "POST",
      body: {
        event: "ticket.solved",
        id: `zd_mob_${Date.now()}`,
      },
      schema: inboundWebhookTriggerResponseSchema,
    }),
};

