import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Validates and normalizes an HTTP/HTTPS API base URL, stripping trailing slashes.
 * Returns null if invalid or unsupported protocol.
 */
export function normalizeApiBaseUrl(raw?: string | null): string | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed || /\s/.test(trimmed)) return null;

  try {
    const parsed = new URL(trimmed);
    const protocol = parsed.protocol.toLowerCase();
    if (protocol !== "http:" && protocol !== "https:") {
      return null;
    }
    if (!parsed.hostname) {
      return null;
    }
    // Reconstruct clean base without trailing slash
    const path = parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/+$/, "");
    return `${parsed.origin}${path}`.replace(/\/+$/, "");
  } catch {
    return null;
  }
}

export function extractLanApiUrlFromHostUri(hostUri?: string | null): string | null {
  if (!hostUri || typeof hostUri !== "string") return null;
  const clean = hostUri.trim();
  if (!clean) return null;

  // Strip port (e.g. "192.168.1.42:8081" -> "192.168.1.42")
  const hostOnly = clean.split(":")[0]?.trim();
  if (!hostOnly) return null;

  // Skip tunnel relay hostnames where backend isn't reachable directly on port 3000
  if (hostOnly.endsWith(".exp.direct") || hostOnly.endsWith(".ngrok.io") || hostOnly.endsWith(".ngrok-free.app")) {
    return null;
  }

  // Only auto-use real LAN IPv4 or mDNS .local hosts (let localhost fall back to platform default 10.0.2.2 vs localhost)
  const isIpv4 = /^\d{1,3}(\.\d{1,3}){3}$/.test(hostOnly);
  const isLocalMdns = hostOnly.endsWith(".local");
  if ((isIpv4 && hostOnly !== "127.0.0.1") || isLocalMdns) {
    return `http://${hostOnly}:3000`;
  }

  return null;
}

export interface ResolveApiBaseUrlParams {
  overrideUrl?: string | null;
  envUrl?: string | null;
  hostUri?: string | null;
  platformOS?: string;
}

/**
 * 4-Tier Server URL Resolution Precedence:
 * 1. Validated user override (Persisted in Zustand / AsyncStorage)
 * 2. EXPO_PUBLIC_API_URL build/env variable
 * 3. Expo Go LAN hostUri IP auto-detection (e.g. "192.168.1.42:8081" -> "http://192.168.1.42:3000")
 * 4. Platform default: Android Emulator "http://10.0.2.2:3000" else "http://localhost:3000"
 */
export function resolveApiBaseUrl(params: ResolveApiBaseUrlParams = {}): string {
  const override = normalizeApiBaseUrl(params.overrideUrl);
  if (override) return override;

  const envUrlSource =
    params.envUrl !== undefined ? params.envUrl : process.env.EXPO_PUBLIC_API_URL;
  const envUrl = normalizeApiBaseUrl(envUrlSource);
  if (envUrl) return envUrl;

  const hostUriSource =
    params.hostUri !== undefined
      ? params.hostUri
      : Constants.expoConfig?.hostUri ?? null;
  const lanUrl = extractLanApiUrlFromHostUri(hostUriSource);
  if (lanUrl) return lanUrl;

  const os = params.platformOS ?? Platform.OS;
  return os === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";
}

