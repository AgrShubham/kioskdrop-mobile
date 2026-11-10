import React from "react";
import { View, type ViewProps } from "react-native";
import { getPalette } from "@/lib/theme";
import { useAppStore } from "@/store/app-store";

interface ChamferCardProps extends ViewProps {
  tone?: "default" | "sapphire" | "emerald" | "amber" | "crimson" | "sky";
  padded?: boolean;
  children: React.ReactNode;
}

export function ChamferCard({
  tone = "default",
  padded = true,
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
        ? "rgba(59, 130, 246, 0.45)"
        : "rgba(37, 99, 235, 0.35)",
    emerald:
      themeMode === "dark"
        ? "rgba(16, 185, 129, 0.45)"
        : "rgba(5, 150, 105, 0.35)",
    amber:
      themeMode === "dark"
        ? "rgba(245, 158, 11, 0.48)"
        : "rgba(217, 119, 6, 0.38)",
    crimson:
      themeMode === "dark"
        ? "rgba(239, 68, 68, 0.55)"
        : "rgba(220, 38, 38, 0.45)",
    sky:
      themeMode === "dark"
        ? "rgba(56, 189, 248, 0.45)"
        : "rgba(2, 132, 199, 0.35)",
  };

  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: palette.card,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: toneBorderMap[tone],
          borderTopColor:
            tone === "default" ? palette.topChamfer : toneBorderMap[tone],
          padding: padded ? 16 : 0,
          shadowColor: themeMode === "dark" ? "#000000" : "#0F172A",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: themeMode === "dark" ? 0.32 : 0.06,
          shadowRadius: 10,
          elevation: themeMode === "dark" ? 4 : 2,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

