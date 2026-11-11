/**
 * Deterministic Currency, Statutory Customs Duty Preview & Countdown Utilities.
 * Strictly preserves integer paise arithmetic — never sums IEEE-754 floats before rounding.
 */

export function groupIndianDigits(integerStr: string): string {
  if (integerStr.length <= 3) return integerStr;
  const lastThree = integerStr.slice(-3);
  const leading = integerStr.slice(0, -3);
  const groupedLeading = leading.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${groupedLeading},${lastThree}`;
}

/**
 * Formats integer paise into deterministic Indian Rupee string (e.g., 100000 -> "₹1,000.00").
 * Uses deterministic manual Indian comma grouping (`##,##,###.00`) to stay identical across
 * Android Hermes, iOS JSC/Hermes, Web, and Jest without relying on optional ICU locale tables.
 */
export function formatPaiseToINR(paise: number): string {
  const safePaise = Number.isFinite(paise) ? Math.round(paise) : 0;
  const isNegative = safePaise < 0;
  const absPaise = Math.abs(safePaise);

  const wholeRupees = Math.floor(absPaise / 100);
  const fractionalPaise = absPaise % 100;

  const groupedRupees = groupIndianDigits(String(wholeRupees));
  const paiseStr = String(fractionalPaise).padStart(2, "0");

  return `${isNegative ? "-" : ""}₹${groupedRupees}.${paiseStr}`;
}

/**
 * Formats chart Y-axis ticks cleanly (e.g. 42000 -> "₹42k", 0 -> "₹0").
 */
export function formatCompactINR(inrAmount: number): string {
  const safe = Number.isFinite(inrAmount) ? inrAmount : 0;
  if (safe === 0) return "₹0";
  const isNegative = safe < 0;
  const abs = Math.abs(safe);

  if (abs >= 1000) {
    const kVal = abs / 1000;
    const formatted =
      abs % 1000 === 0 || abs >= 10000
        ? String(Math.round(kVal))
        : Number(kVal.toFixed(1)).toString();
    return `${isNegative ? "-" : ""}₹${formatted}k`;
  }

  return `${isNegative ? "-" : ""}₹${Math.round(abs)}`;
}

export interface CountdownState {
  label: string;
  isExpired: boolean;
  remainingSeconds: number;
}

/**
 * Computes zero-padded MM:SS pickup TTL countdown or "EXPIRED".
 */
export function formatCountdown(
  expiresAtIso: string,
  nowMs: number = Date.now()
): CountdownState {
  const targetMs = Date.parse(expiresAtIso);
  if (!Number.isFinite(targetMs)) {
    return { label: "EXPIRED", isExpired: true, remainingSeconds: 0 };
  }

  const diffMs = targetMs - nowMs;
  if (diffMs <= 0) {
    return { label: "EXPIRED", isExpired: true, remainingSeconds: 0 };
  }

  const remainingSeconds = Math.floor(diffMs / 1000);
  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  return {
    label: `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`,
    isExpired: false,
    remainingSeconds,
  };
}

export interface LandedCostPreviewInput {
  cifAmountPaise: number;
  bcdBp?: number;
  swsBp?: number;
  igstBp?: number;
  procurementMode?: "DIRECT_IMPORT" | "DOMESTIC_WHOLESALE";
}

export interface LandedCostPreviewBreakdown {
  cifAmountPaise: number;
  assessableValuePaise: number;
  bcdPaise: number;
  swsPaise: number;
  igstPaise: number;
  totalDutiesPaise: number;
  totalLandedCostPaise: number;
  effectiveCostNetOfItcPaise: number;
  procurementMode: "DIRECT_IMPORT" | "DOMESTIC_WHOLESALE";
  effectiveDutyRatePercent: number;
}

/**
 * Pure client-side preview matching backend ADR D6 integer-paise round-half-up arithmetic.
 */
export function calculateLandedCostPreview(
  input: LandedCostPreviewInput
): LandedCostPreviewBreakdown {
  const {
    cifAmountPaise,
    bcdBp = 2000,
    swsBp = 1000,
    igstBp = 1800,
    procurementMode = "DIRECT_IMPORT",
  } = input;

  if (cifAmountPaise < 0) {
    throw new Error("CIF amount cannot be negative");
  }

  if (procurementMode === "DOMESTIC_WHOLESALE") {
    const gstPaise = Math.round(cifAmountPaise * (igstBp / 10000));
    const rate =
      cifAmountPaise > 0
        ? parseFloat(((gstPaise / cifAmountPaise) * 100).toFixed(2))
        : 0;
    return {
      cifAmountPaise,
      assessableValuePaise: cifAmountPaise,
      bcdPaise: 0,
      swsPaise: 0,
      igstPaise: gstPaise,
      totalDutiesPaise: gstPaise,
      totalLandedCostPaise: cifAmountPaise + gstPaise,
      effectiveCostNetOfItcPaise: cifAmountPaise,
      procurementMode: "DOMESTIC_WHOLESALE",
      effectiveDutyRatePercent: rate,
    };
  }

  const assessableValuePaise = Math.round(cifAmountPaise * 1.01);
  const bcdPaise = Math.round(assessableValuePaise * (bcdBp / 10000));
  const swsPaise = Math.round(bcdPaise * (swsBp / 10000));
  const igstPaise = Math.round(
    (assessableValuePaise + bcdPaise + swsPaise) * (igstBp / 10000)
  );
  const totalDutiesPaise = bcdPaise + swsPaise + igstPaise;
  const totalLandedCostPaise = cifAmountPaise + totalDutiesPaise;
  const effectiveCostNetOfItcPaise = cifAmountPaise + bcdPaise + swsPaise;
  const effectiveDutyRatePercent =
    cifAmountPaise > 0
      ? parseFloat(((totalDutiesPaise / cifAmountPaise) * 100).toFixed(2))
      : 0;

  return {
    cifAmountPaise,
    assessableValuePaise,
    bcdPaise,
    swsPaise,
    igstPaise,
    totalDutiesPaise,
    totalLandedCostPaise,
    effectiveCostNetOfItcPaise,
    procurementMode: "DIRECT_IMPORT",
    effectiveDutyRatePercent,
  };
}

export function formatShortTimestamp(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

/**
 * Formats Smart Locker Hub names without duplicating leading "Floor N" prefixes
 * (e.g., (4, "Floor 4 Boardroom Hub") -> "Floor 4 Boardroom Hub").
 */
export function formatLockerHubLabel(
  floor: number,
  name: string,
  style: "Floor" | "FL" | "Arrow" = "Floor",
  sourceFloor?: number
): string {
  const trimmed = name.trim();
  const floorPrefixRegex = new RegExp(
    `^(?:floor|fl)\\s*${floor}\\s*[:\\-–]?\\s*`,
    "i"
  );
  const suffix = trimmed.replace(floorPrefixRegex, "").trim();
  const canonical = suffix ? `Floor ${floor} ${suffix}` : `Floor ${floor} Hub`;

  if (style === "Arrow" && typeof sourceFloor === "number") {
    return `Floor ${sourceFloor} -> ${canonical}`;
  }
  if (style === "FL") {
    return `FL ${floor}: ${suffix || trimmed}`;
  }
  return canonical;
}

const ENUM_DISPLAY_MAP: Record<string, string> = {
  IT_ADMIN: "IT Admin",
  FINOPS_AUDITOR: "FinOps Auditor",
  EMPLOYEE: "Employee",
  "4K_LED_WALL": "4K LED Wall",
  DUAL_MONITOR: "Dual Display",
  SINGLE_DISPLAY: "Single Display",
  PROJECTOR: "Projector",
  BYOD_LEGACY: "BYOD / Wireless",
  TEAMS_ROOM: "Teams Room",
  ZOOM_ROOM: "Zoom Room",
  HYBRID_MTR: "MTR Hybrid",
  P1_CRITICAL: "P1 Critical",
  P2_HIGH: "P2 High",
  P3_STANDARD: "P3 Standard",
  DIRECT_IMPORT: "Direct Import",
  DOMESTIC_WHOLESALE: "Domestic Wholesale",
  PENDING_RECEPTION: "Pending Intake",
  INSPECTED_STOCKED: "Stocked",
  ZAGGLE_CARD: "Zaggle Corp Card",
  HAPPAY_PETTY_CASH: "Happay Petty Cash",
  SAP_S4HANA: "SAP S/4HANA",
  ORACLE_NETSUITE: "Oracle NetSuite",
  ZOHO_BOOKS: "Zoho Books",
  SYNCED: "Synced",
  PENDING: "Pending",
  FAILED: "Failed",
  STOCKED_AVAILABLE: "In Locker",
  RESERVED_FOR_PICKUP: "Reserved",
  DOOR_OPEN_AWAITING_REMOVAL: "Door Open",
  CHECKED_OUT: "Checked Out",
  MAINTENANCE_QUARANTINE: "Quarantined",
  QUARANTINED: "Quarantined",
  AVAILABLE: "Available",
  IN_LOCKER: "In Locker",
  HEALTHY: "Healthy",
  DAMAGED: "Damaged",
  NEEDS_INSPECTION: "Needs Check",
  SERVICENOW: "ServiceNow",
  ZENDESK: "Zendesk",
  INBOUND: "Inbound",
  OUTBOUND: "Outbound",
  SUCCESS: "Delivered",
  REPLAYED: "Replayed",
};

/**
 * Converts backend screaming snake-case enums into concise, readable UI labels.
 */
export function formatEnumLabel(value?: string | null): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (ENUM_DISPLAY_MAP[trimmed]) return ENUM_DISPLAY_MAP[trimmed];
  return trimmed
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatRoleLabel(role?: string | null): string {
  return formatEnumLabel(role || "EMPLOYEE");
}


