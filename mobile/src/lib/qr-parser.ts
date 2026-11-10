export interface RoomLookupCandidate {
  id?: string;
  name: string;
  qrCodeSlug: string;
}

const TRUSTED_WEB_HOSTS = new Set([
  "kioskdrop-enterprise.vercel.app",
  "localhost",
  "127.0.0.1",
  "10.0.2.2",
]);

function isTrustedWebHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (TRUSTED_WEB_HOSTS.has(lower)) return true;
  if (lower.endsWith(".vercel.app") && lower.includes("kioskdrop")) return true;
  if (
    /^192\.168\.\d{1,3}\.\d{1,3}$/.test(lower) ||
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(lower) ||
    /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(lower)
  ) {
    return true;
  }
  return false;
}

function matchRoomCandidate(
  candidate: string | undefined | null,
  rooms: RoomLookupCandidate[]
): string | null {
  if (!candidate || typeof candidate !== "string") return null;
  const trimmed = candidate.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  if (rooms.length > 0) {
    const exactMatch = rooms.find(
      (r) =>
        r.qrCodeSlug.toLowerCase() === lower ||
        r.name.toLowerCase() === lower ||
        (r.id && r.id.toLowerCase() === lower)
    );
    return exactMatch ? exactMatch.qrCodeSlug : null;
  }

  // Fallback when room directory has not hydrated yet: allow clean room slugs only
  if (/^[A-Za-z0-9][A-Za-z0-9-_]{1,63}$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}

/**
 * Resolves a QR payload (deep link, trusted web URL, JSON object, or raw room slug/name)
 * into a canonical MeetingRoom qrCodeSlug, or null if malicious / unmatched.
 */
export function parseRoomQrPayload(
  raw: string,
  rooms: RoomLookupCandidate[] = []
): string | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // 1. JSON payload e.g. {"room":"Innovation-Lab-4A"} or {"qrCodeSlug":"Boardroom-4B"}
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown>;
      const candidate =
        (typeof parsed.qrCodeSlug === "string" && parsed.qrCodeSlug) ||
        (typeof parsed.room === "string" && parsed.room) ||
        (typeof parsed.roomSlug === "string" && parsed.roomSlug) ||
        (typeof parsed.slug === "string" && parsed.slug) ||
        null;
      return matchRoomCandidate(candidate, rooms);
    } catch {
      return null;
    }
  }

  // 2. URL / Deep link payloads (kioskdrop://request?room=... or https://.../request?room=...)
  if (trimmed.includes("://")) {
    try {
      const url = new URL(trimmed);
      const protocol = url.protocol.toLowerCase();

      if (protocol === "kioskdrop:") {
        const targetRoute = `${url.hostname}${url.pathname}`.toLowerCase();
        if (targetRoute !== "request" && !targetRoute.startsWith("request/")) {
          return null;
        }
        const roomParam =
          url.searchParams.get("room") || url.searchParams.get("qrCodeSlug");
        return matchRoomCandidate(roomParam, rooms);
      }

      if (protocol === "http:" || protocol === "https:") {
        if (!isTrustedWebHost(url.hostname)) {
          return null;
        }
        if (!url.pathname.toLowerCase().includes("request")) {
          return null;
        }
        const roomParam =
          url.searchParams.get("room") || url.searchParams.get("qrCodeSlug");
        return matchRoomCandidate(roomParam, rooms);
      }

      return null;
    } catch {
      return null;
    }
  }

  // 3. Reject obvious path-traversal or untrusted raw schemes (e.g. "javascript:", "evil.com/phish")
  if (
    trimmed.includes("/") ||
    trimmed.includes("\\") ||
    trimmed.includes(":") ||
    trimmed.includes("?")
  ) {
    return null;
  }

  // 4. Raw room slug or name ("townhall-2a" -> "Townhall-2A")
  return matchRoomCandidate(trimmed, rooms);
}

/**
 * Accepts string or Expo Router array search param, strips non-digits, and caps to 6 digits.
 */
export function sanitizePin(raw?: string | string[] | null): string {
  const first = Array.isArray(raw) ? raw[0] : raw;
  if (!first || typeof first !== "string") return "";
  return first.replace(/\D/g, "").slice(0, 6);
}

