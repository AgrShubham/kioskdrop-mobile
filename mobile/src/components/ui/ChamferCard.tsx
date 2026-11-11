import React from "react";
import { View, type ViewProps } from "react-native";
import { getPalette } from "@/lib/theme";
import { useAppStore } from "@/store/app-store";

interface ChamferCardProps extends ViewProps {
  tone?: "default" | "sapphire" | "emerald" | "amber" | "crimson" | "sky";
  padded?: boolean;
  elevated?: boolean;
  children: React.ReactNode;
}

export function ChamferCard({
  tone = "default",
  padded = true,
  elevated = false,
  style,
  children,
  ...rest
}: ChamferCardProps) {
  const themeMode = useAppStore((s) => s.themeMode);
  const palette = getPalette(themeMode);

  const toneBorderMap: Record<NonNullable<ChamferCardProps["tone"]>, string> = {
    default: palette.border,
    sapphire:
      themeMode === "dark"
        ? "rgba(59, 130, 246, 0.24)"
        : "rgba(37, 99, 235, 0.16)",
    emerald:
      themeMode === "dark"
        ? "rgba(16, 185, 129, 0.24)"
        : "rgba(5, 150, 105, 0.18)",
    amber:
      themeMode === "dark"
        ? "rgba(245, 158, 11, 0.30)"
        : "rgba(217, 119, 6, 0.22)",
    crimson:
      themeMode === "dark"
        ? "rgba(244, 63, 94, 0.34)"
        : "rgba(225, 29, 72, 0.25)",
    sky:
      themeMode === "dark"
        ? "rgba(56, 189, 248, 0.24)"
        : "rgba(2, 132, 199, 0.18)",
  };

  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: elevated ? palette.surfaceElevated : palette.card,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: toneBorderMap[tone],
          borderTopColor:
            tone === "default" && themeMode === "dark"
              ? palette.topChamfer
              : toneBorderMap[tone],
          padding: padded ? 16 : 0,
          shadowColor: themeMode === "dark" ? "#000000" : "#0F172A",
          shadowOffset: { width: 0, height: themeMode === "dark" ? 4 : 2 },
          shadowOpacity: themeMode === "dark" ? 0.22 : 0.04,
          shadowRadius: themeMode === "dark" ? 12 : 8,
          elevation: themeMode === "dark" ? 2 : 1,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

