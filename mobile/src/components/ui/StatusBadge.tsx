import React from "react";
import { Text, View } from "react-native";
import { getPalette } from "@/lib/theme";
import { useAppStore } from "@/store/app-store";

export type BadgeVariant =
  | "sapphire"
  | "emerald"
  | "amber"
  | "sky"
  | "crimson"
  | "slate";

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  dotColor?: string;
  compact?: boolean;
}

export function StatusBadge({
  label,
  variant = "slate",
  dotColor,
  compact = false,
}: StatusBadgeProps) {
  const themeMode = useAppStore((s) => s.themeMode);
  const palette = getPalette(themeMode);

  const stylesByVariant: Record<
    BadgeVariant,
    { bg: string; border: string; text: string }
  > = {
    sapphire: {
      bg:
        themeMode === "dark"
          ? "rgba(59, 130, 246, 0.16)"
          : "rgba(37, 99, 235, 0.10)",
      border:
        themeMode === "dark"
          ? "rgba(59, 130, 246, 0.42)"
          : "rgba(37, 99, 235, 0.30)",
      text: themeMode === "dark" ? "#93C5FD" : "#1D4ED8",
    },
    emerald: {
      bg: palette.emeraldSoft,
      border:
        themeMode === "dark"
          ? "rgba(16, 185, 129, 0.45)"
          : "rgba(5, 150, 105, 0.32)",
      text: themeMode === "dark" ? "#34D399" : "#047857",
    },
    amber: {
      bg: palette.amberSoft,
      border:
        themeMode === "dark"
          ? "rgba(245, 158, 11, 0.45)"
          : "rgba(217, 119, 6, 0.32)",
      text: themeMode === "dark" ? "#FBBF24" : "#B45309",
    },
    sky: {
      bg: palette.skySoft,
      border:
        themeMode === "dark"
          ? "rgba(56, 189, 248, 0.45)"
          : "rgba(2, 132, 199, 0.32)",
      text: themeMode === "dark" ? "#38BDF8" : "#0369A1",
    },
    crimson: {
      bg: palette.destructiveSoft,
      border:
        themeMode === "dark"
          ? "rgba(239, 68, 68, 0.50)"
          : "rgba(220, 38, 38, 0.35)",
      text: themeMode === "dark" ? "#FCA5A5" : "#B91C1C",
    },
    slate: {
      bg: palette.muted,
      border: palette.border,
      text: palette.mutedForeground,
    },
  };

  const current = stylesByVariant[variant];

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        backgroundColor: current.bg,
        borderColor: current.border,
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: compact ? 8 : 10,
        paddingVertical: compact ? 3 : 4,
        gap: 5,
      }}
    >
      {dotColor ? (
        <View
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            backgroundColor: dotColor,
          }}
        />
      ) : null}
      <Text
        numberOfLines={1}
        style={{
          color: current.text,
          fontSize: compact ? 10 : 11,
          fontWeight: "700",
          letterSpacing: 0.4,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

