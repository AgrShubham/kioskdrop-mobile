import {
  calculateLandedCostPreview,
  formatCompactINR,
  formatCountdown,
  formatLockerHubLabel,
  formatPaiseToINR,
} from "@/lib/format";
import { normalizeApiBaseUrl, resolveApiBaseUrl } from "@/lib/env";

describe("format utilities", () => {
  it("formats integer paise into deterministic Indian Rupee strings", () => {
    expect(formatPaiseToINR(100000)).toBe("₹1,000.00");
    expect(formatPaiseToINR(1509586)).toBe("₹15,095.86");
    expect(formatPaiseToINR(10000000)).toBe("₹1,00,000.00");
    expect(formatPaiseToINR(0)).toBe("₹0.00");
    expect(formatPaiseToINR(-100000)).toBe("-₹1,000.00");
  });

  it("formats compact INR labels for chart Y-axis ticks", () => {
    expect(formatCompactINR(42000)).toBe("₹42k");
    expect(formatCompactINR(0)).toBe("₹0");
    expect(formatCompactINR(850)).toBe("₹850");
  });

  it("matches Statutory Indian Customs Duty Golden Test Vector A (₹1,000.00 CIF)", () => {
    const vectorA = calculateLandedCostPreview({
      cifAmountPaise: 100000,
      procurementMode: "DIRECT_IMPORT",
    });

    expect(vectorA.assessableValuePaise).toBe(101000);
    expect(vectorA.bcdPaise).toBe(20200);
    expect(vectorA.swsPaise).toBe(2020);
    expect(vectorA.igstPaise).toBe(22180);
    expect(vectorA.totalDutiesPaise).toBe(44400);
    expect(formatPaiseToINR(vectorA.totalDutiesPaise)).toBe("₹444.00");
    expect(vectorA.effectiveDutyRatePercent).toBe(44.4);
    expect(vectorA.effectiveCostNetOfItcPaise).toBe(122220);
    expect(formatPaiseToINR(vectorA.effectiveCostNetOfItcPaise)).toBe("₹1,222.20");
  });

  it("matches Statutory Indian Customs Duty Golden Test Vector B (₹34,000.00 CIF)", () => {
    const vectorB = calculateLandedCostPreview({
      cifAmountPaise: 3400000,
      procurementMode: "DIRECT_IMPORT",
    });

    expect(vectorB.assessableValuePaise).toBe(3434000);
    expect(vectorB.bcdPaise).toBe(686800);
    expect(vectorB.swsPaise).toBe(68680);
    expect(vectorB.igstPaise).toBe(754106);
    expect(vectorB.totalDutiesPaise).toBe(1509586);
    expect(formatPaiseToINR(vectorB.totalDutiesPaise)).toBe("₹15,095.86");
  });

  it("formats pickup TTL countdowns and marks expired timestamps cleanly", () => {
    const now = Date.parse("2026-11-10T12:00:00.000Z");
    const active = formatCountdown("2026-11-10T12:09:42.000Z", now);
    expect(active).toEqual({
      label: "09:42",
      isExpired: false,
      remainingSeconds: 582,
    });

    const expired = formatCountdown("2026-11-10T11:59:59.000Z", now);
    expect(expired).toEqual({
      label: "EXPIRED",
      isExpired: true,
      remainingSeconds: 0,
    });
  });

  it("formats locker hub labels without duplicating Floor N prefixes", () => {
    expect(formatLockerHubLabel(4, "Floor 4 Boardroom Hub")).toBe(
      "Floor 4 Boardroom Hub"
    );
    expect(formatLockerHubLabel(2, "Floor 2 Townhall Hub")).toBe(
      "Floor 2 Townhall Hub"
    );
    expect(formatLockerHubLabel(4, "Floor 4 Boardroom Hub", "FL")).toBe(
      "FL 4: Boardroom Hub"
    );
    expect(formatLockerHubLabel(4, "Floor 4 Boardroom Hub", "Arrow", 3)).toBe(
      "Floor 3 -> Floor 4 Boardroom Hub"
    );
    expect(formatLockerHubLabel(1, "Lobby Annex")).toBe("Floor 1 Lobby Annex");
  });
});

describe("API URL normalization & 4-tier env resolution", () => {
  it("normalizes valid HTTP/HTTPS URLs and rejects malformed or unsafe values", () => {
    expect(normalizeApiBaseUrl("http://192.168.1.10:3000/")).toBe(
      "http://192.168.1.10:3000"
    );
    expect(normalizeApiBaseUrl("  https://kioskdrop-enterprise.vercel.app/// ")).toBe(
      "https://kioskdrop-enterprise.vercel.app"
    );
    expect(normalizeApiBaseUrl("")).toBeNull();
    expect(normalizeApiBaseUrl("ftp://192.168.1.10:3000")).toBeNull();
    expect(normalizeApiBaseUrl("not a valid url")).toBeNull();
  });

  it("follows override -> env -> Expo hostUri -> Android/iOS default precedence", () => {
    expect(
      resolveApiBaseUrl({
        overrideUrl: "http://192.168.0.50:3000/",
        envUrl: "http://env.example:3000",
        hostUri: "192.168.1.42:8081",
        platformOS: "android",
      })
    ).toBe("http://192.168.0.50:3000");

    expect(
      resolveApiBaseUrl({
        overrideUrl: null,
        envUrl: "https://kioskdrop-enterprise.vercel.app/",
        hostUri: "192.168.1.42:8081",
        platformOS: "android",
      })
    ).toBe("https://kioskdrop-enterprise.vercel.app");

    expect(
      resolveApiBaseUrl({
        overrideUrl: null,
        envUrl: "",
        hostUri: "192.168.1.42:8081",
        platformOS: "ios",
      })
    ).toBe("http://192.168.1.42:3000");

    expect(
      resolveApiBaseUrl({
        overrideUrl: null,
        envUrl: null,
        hostUri: null,
        platformOS: "android",
      })
    ).toBe("http://10.0.2.2:3000");

    expect(
      resolveApiBaseUrl({
        overrideUrl: null,
        envUrl: null,
        hostUri: null,
        platformOS: "ios",
      })
    ).toBe("http://localhost:3000");
  });
});

