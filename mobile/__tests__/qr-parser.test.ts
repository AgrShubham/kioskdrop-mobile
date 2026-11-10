import { parseRoomQrPayload, sanitizePin } from "@/lib/qr-parser";

const SEEDED_ROOMS = [
  { name: "Executive Boardroom 4B", qrCodeSlug: "Boardroom-4B" },
  { name: "Innovation Lab 4A", qrCodeSlug: "Innovation-Lab-4A" },
  { name: "Townhall Auditorium 2A", qrCodeSlug: "Townhall-2A" },
  { name: "Client Pitch Suite 3C", qrCodeSlug: "Client-Pitch-3C" },
];

describe("qr-parser utilities", () => {
  it("resolves kioskdrop:// custom scheme room deep links", () => {
    expect(
      parseRoomQrPayload(
        "kioskdrop://request?room=Boardroom-4B&floor=4",
        SEEDED_ROOMS
      )
    ).toBe("Boardroom-4B");
  });

  it("resolves trusted web HTTPS request links", () => {
    expect(
      parseRoomQrPayload(
        "https://kioskdrop-enterprise.vercel.app/request?room=Client-Pitch-3C",
        SEEDED_ROOMS
      )
    ).toBe("Client-Pitch-3C");
  });

  it("resolves JSON-encoded room payloads", () => {
    expect(
      parseRoomQrPayload('{"room":"Innovation-Lab-4A"}', SEEDED_ROOMS)
    ).toBe("Innovation-Lab-4A");
  });

  it("supports case-insensitive slug and full-room-name matching", () => {
    expect(parseRoomQrPayload("townhall-2a", SEEDED_ROOMS)).toBe("Townhall-2A");
    expect(parseRoomQrPayload("  Executive Boardroom 4B ", SEEDED_ROOMS)).toBe(
      "Boardroom-4B"
    );
  });

  it("rejects untrusted hosts, unknown slugs, and malicious URLs", () => {
    expect(
      parseRoomQrPayload("https://evil.example/phish", SEEDED_ROOMS)
    ).toBeNull();
    expect(
      parseRoomQrPayload(
        "https://evil.example/request?room=Boardroom-4B",
        SEEDED_ROOMS
      )
    ).toBeNull();
    expect(parseRoomQrPayload("javascript:alert(1)", SEEDED_ROOMS)).toBeNull();
    expect(parseRoomQrPayload("NonExistent-Room-9Z", SEEDED_ROOMS)).toBeNull();
  });

  it("sanitizes deep-link PIN strings to max 6 numeric digits", () => {
    expect(sanitizePin("48a9-2199")).toBe("489219");
    expect(sanitizePin(["12-34-56-78"])).toBe("123456");
    expect(sanitizePin("******")).toBe("");
    expect(sanitizePin(undefined)).toBe("");
  });
});

