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
    { bg: string; text: string }
  > = {
    sapphire: {
      bg: palette.primarySoft,
      text: themeMode === "dark" ? "#93C5FD" : "#1D4ED8",
    },
    emerald: {
      bg: palette.emeraldSoft,
      text: themeMode === "dark" ? "#34D399" : "#047857",
    },
    amber: {
      bg: palette.amberSoft,
      text: themeMode === "dark" ? "#FBBF24" : "#B45309",
    },
    sky: {
      bg: palette.skySoft,
      text: themeMode === "dark" ? "#38BDF8" : "#0369A1",
    },
    crimson: {
      bg: palette.destructiveSoft,
      text: themeMode === "dark" ? "#FDA4AF" : "#BE123C",
    },
    slate: {
      bg: palette.muted,
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
          letterSpacing: 0.25,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

