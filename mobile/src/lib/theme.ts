import type { CompartmentStatusType } from "@/types/domain";

export type ThemeMode = "dark" | "light";

export interface ThemePalette {
  mode: ThemeMode;
  background: string;
  card: string;
  surfaceElevated: string;
  border: string;
  borderStrong: string;
  topChamfer: string;
  muted: string;
  accent: string;
  foreground: string;
  mutedForeground: string;
  primary: string;
  primaryText: string;
  primarySoft: string;
  emerald: string;
  emeraldSoft: string;
  amber: string;
  amberSoft: string;
  sky: string;
  skySoft: string;
  cyan: string;
  destructive: string;
  destructiveSoft: string;
  indigo: string;
  indigoSoft: string;
  heroGradient: readonly [string, string, string];
}

export const DARK_PALETTE: ThemePalette = {
  mode: "dark",
  background: "#070A10",
  card: "#0F1521",
  surfaceElevated: "#151E2E",
  border: "rgba(148, 163, 184, 0.14)",
  borderStrong: "rgba(148, 163, 184, 0.24)",
  topChamfer: "rgba(255, 255, 255, 0.08)",
  muted: "#172030",
  accent: "#1C273B",
  foreground: "#F8FAFC",
  mutedForeground: "#8B9BB4",
  primary: "#2563EB",
  primaryText: "#60A5FA",
  primarySoft: "rgba(59, 130, 246, 0.13)",
  emerald: "#10B981",
  emeraldSoft: "rgba(16, 185, 129, 0.13)",
  amber: "#F59E0B",
  amberSoft: "rgba(245, 158, 11, 0.13)",
  sky: "#38BDF8",
  skySoft: "rgba(56, 189, 248, 0.13)",
  cyan: "#06B6D4",
  destructive: "#F43F5E",
  destructiveSoft: "rgba(244, 63, 94, 0.13)",
  indigo: "#818CF8",
  indigoSoft: "rgba(129, 140, 248, 0.14)",
  heroGradient: ["#1D4ED8", "#2563EB", "#0284C7"],
};

export const LIGHT_PALETTE: ThemePalette = {
  mode: "light",
  background: "#F3F5F9",
  card: "#FFFFFF",
  surfaceElevated: "#F8FAFC",
  border: "rgba(15, 23, 42, 0.08)",
  borderStrong: "rgba(15, 23, 42, 0.16)",
  topChamfer: "rgba(255, 255, 255, 0.90)",
  muted: "#EEF2F7",
  accent: "#E2E8F0",
  foreground: "#0B1220",
  mutedForeground: "#5B677A",
  primary: "#2563EB",
  primaryText: "#1D4ED8",
  primarySoft: "rgba(37, 99, 235, 0.09)",
  emerald: "#059669",
  emeraldSoft: "rgba(5, 150, 105, 0.09)",
  amber: "#D97706",
  amberSoft: "rgba(217, 119, 6, 0.10)",
  sky: "#0284C7",
  skySoft: "rgba(2, 132, 199, 0.09)",
  cyan: "#0891B2",
  destructive: "#E11D48",
  destructiveSoft: "rgba(225, 29, 72, 0.09)",
  indigo: "#6366F1",
  indigoSoft: "rgba(99, 102, 241, 0.10)",
  heroGradient: ["#1E40AF", "#2563EB", "#0284C7"],
};

export function getPalette(mode: ThemeMode): ThemePalette {
  return mode === "dark" ? DARK_PALETTE : LIGHT_PALETTE;
}

export interface BayLedVisual {
  label: string;
  shortLabel: string;
  ledColor: string;
  borderColor: string;
  backgroundColor: string;
  badgeVariant: "emerald" | "amber" | "sky" | "crimson" | "slate" | "sapphire";
}

export function getBayLedVisual(
  status: CompartmentStatusType,
  palette: ThemePalette
): BayLedVisual {
  switch (status) {
    case "STOCKED_AVAILABLE":
      return {
        label: "Stocked & Available",
        shortLabel: "Stocked",
        ledColor: palette.emerald,
        borderColor: palette.border,
        backgroundColor: palette.emeraldSoft,
        badgeVariant: "emerald",
      };
    case "RESERVED_FOR_PICKUP":
      return {
        label: "Reserved for Pickup",
        shortLabel: "Reserved",
        ledColor: palette.amber,
        borderColor: palette.mode === "dark" ? "rgba(245, 158, 11, 0.42)" : "rgba(217, 119, 6, 0.35)",
        backgroundColor: palette.amberSoft,
        badgeVariant: "amber",
      };
    case "DOOR_OPEN_AWAITING_REMOVAL":
      return {
        label: "Unlocked · Door Open",
        shortLabel: "Unlocked",
        ledColor: palette.sky,
        borderColor: palette.mode === "dark" ? "rgba(56, 189, 248, 0.58)" : "rgba(2, 132, 199, 0.50)",
        backgroundColor: palette.skySoft,
        badgeVariant: "sky",
      };
    case "CHECKED_OUT":
      return {
        label: "Checked Out",
        shortLabel: "Checked Out",
        ledColor: palette.primaryText,
        borderColor: palette.mode === "dark" ? "rgba(59, 130, 246, 0.34)" : "rgba(37, 99, 235, 0.25)",
        backgroundColor: palette.primarySoft,
        badgeVariant: "sapphire",
      };
    case "MAINTENANCE_QUARANTINE":
      return {
        label: "Quarantined Alarm",
        shortLabel: "Quarantine",
        ledColor: palette.destructive,
        borderColor: palette.mode === "dark" ? "rgba(244, 63, 94, 0.58)" : "rgba(225, 29, 72, 0.45)",
        backgroundColor: palette.destructiveSoft,
        badgeVariant: "crimson",
      };
    case "EMPTY":
    default:
      return {
        label: "Empty Bay",
        shortLabel: "Empty",
        ledColor: palette.mutedForeground,
        borderColor: palette.border,
        backgroundColor: palette.muted,
        badgeVariant: "slate",
      };
  }
}

