import type { CompartmentStatusType } from "@/types/domain";

export type ThemeMode = "dark" | "light";

export interface ThemePalette {
  mode: ThemeMode;
  background: string;
  card: string;
  border: string;
  topChamfer: string;
  muted: string;
  accent: string;
  foreground: string;
  mutedForeground: string;
  primary: string;
  primaryText: string;
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
}

export const DARK_PALETTE: ThemePalette = {
  mode: "dark",
  background: "#0B0F17",
  card: "#121927",
  border: "#212C3D",
  topChamfer: "rgba(255, 255, 255, 0.10)",
  muted: "#192233",
  accent: "#1D273B",
  foreground: "#F1F5F9",
  mutedForeground: "#94A3B8",
  primary: "#3B82F6",
  primaryText: "#60A5FA",
  emerald: "#10B981",
  emeraldSoft: "rgba(16, 185, 129, 0.14)",
  amber: "#F59E0B",
  amberSoft: "rgba(245, 158, 11, 0.14)",
  sky: "#38BDF8",
  skySoft: "rgba(56, 189, 248, 0.14)",
  cyan: "#06B6D4",
  destructive: "#EF4444",
  destructiveSoft: "rgba(239, 68, 68, 0.12)",
  indigo: "#818CF8",
};

export const LIGHT_PALETTE: ThemePalette = {
  mode: "light",
  background: "#F8FAFC",
  card: "#FFFFFF",
  border: "#E2E8F0",
  topChamfer: "rgba(255, 255, 255, 0.85)",
  muted: "#F1F5F9",
  accent: "#E2E8F0",
  foreground: "#0F172A",
  mutedForeground: "#64748B",
  primary: "#2563EB",
  primaryText: "#2563EB",
  emerald: "#059669",
  emeraldSoft: "rgba(5, 150, 105, 0.10)",
  amber: "#D97706",
  amberSoft: "rgba(217, 119, 6, 0.10)",
  sky: "#0284C7",
  skySoft: "rgba(2, 132, 199, 0.10)",
  cyan: "#0891B2",
  destructive: "#DC2626",
  destructiveSoft: "rgba(220, 38, 38, 0.10)",
  indigo: "#6366F1",
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
  badgeVariant: "emerald" | "amber" | "sky" | "crimson" | "slate";
}

export function getBayLedVisual(
  status: CompartmentStatusType,
  palette: ThemePalette
): BayLedVisual {
  switch (status) {
    case "STOCKED_AVAILABLE":
      return {
        label: "Stocked & Available",
        shortLabel: "STOCKED",
        ledColor: palette.emerald,
        borderColor: palette.mode === "dark" ? "rgba(16, 185, 129, 0.35)" : "rgba(5, 150, 105, 0.30)",
        backgroundColor: palette.emeraldSoft,
        badgeVariant: "emerald",
      };
    case "RESERVED_FOR_PICKUP":
      return {
        label: "Reserved for Pickup",
        shortLabel: "RESERVED",
        ledColor: palette.amber,
        borderColor: palette.mode === "dark" ? "rgba(245, 158, 11, 0.45)" : "rgba(217, 119, 6, 0.40)",
        backgroundColor: palette.amberSoft,
        badgeVariant: "amber",
      };
    case "DOOR_OPEN_AWAITING_REMOVAL":
      return {
        label: "Unlocked · Door Open",
        shortLabel: "UNLOCKED",
        ledColor: palette.sky,
        borderColor: palette.mode === "dark" ? "rgba(56, 189, 248, 0.65)" : "rgba(2, 132, 199, 0.55)",
        backgroundColor: palette.skySoft,
        badgeVariant: "sky",
      };
    case "CHECKED_OUT":
      return {
        label: "Checked Out",
        shortLabel: "OUT",
        ledColor: palette.primary,
        borderColor: palette.mode === "dark" ? "rgba(59, 130, 246, 0.38)" : "rgba(37, 99, 235, 0.32)",
        backgroundColor: palette.mode === "dark" ? "rgba(59, 130, 246, 0.12)" : "rgba(37, 99, 235, 0.08)",
        badgeVariant: "slate",
      };
    case "MAINTENANCE_QUARANTINE":
      return {
        label: "Quarantined Alarm",
        shortLabel: "QUARANTINE",
        ledColor: palette.destructive,
        borderColor: palette.mode === "dark" ? "rgba(239, 68, 68, 0.65)" : "rgba(220, 38, 38, 0.55)",
        backgroundColor: palette.destructiveSoft,
        badgeVariant: "crimson",
      };
    case "EMPTY":
    default:
      return {
        label: "Empty Bay",
        shortLabel: "EMPTY",
        ledColor: palette.mutedForeground,
        borderColor: palette.border,
        backgroundColor: palette.muted,
        badgeVariant: "slate",
      };
  }
}

