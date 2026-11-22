import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Path, Rect, Defs, LinearGradient, Stop } from "react-native-svg";
import { getPalette, ThemeMode } from "@/lib/theme";
import { useAppStore } from "@/store/app-store";

export interface KioskDropLogoProps {
  size?: number;
  variant?: "icon" | "full";
  accent?: "brand" | "monochrome";
  themeMode?: ThemeMode;
  color?: string;
}

export function KioskDropLogo({
  size = 24,
  variant = "icon",
  accent = "brand",
  themeMode: explicitTheme,
  color,
}: KioskDropLogoProps) {
  const storeTheme = useAppStore((s) => s.themeMode);
  const themeMode = explicitTheme ?? storeTheme;
  const palette = getPalette(themeMode);

  const isMonochrome = accent === "monochrome";
  const stemColor = color ?? (themeMode === "dark" ? "#FFFFFF" : "#0F172A");
  const chevColor = isMonochrome ? stemColor : "url(#kd-rn-cyan)";

  const iconSvg = (
    <Svg
      viewBox="0 0 1000 1000"
      width={size}
      height={size}
      style={{ overflow: "visible" }}
    >
      <Defs>
        <LinearGradient id="kd-rn-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#38BDF8" />
          <Stop offset="100%" stopColor="#2563EB" />
        </LinearGradient>
      </Defs>
      {/* K Element */}
      <Path
        d="M 155,323 L 224,323 L 224,475 L 376,323 L 472,323 L 298,497 L 298,503 L 472,677 L 376,677 L 224,525 L 224,677 L 155,677 Z"
        fill={stemColor}
      />
      {/* Middle Bar */}
      <Rect
        x={500}
        y={323}
        width={69}
        height={354}
        fill={stemColor}
      />
      {/* Chevron */}
      <Path
        d="M 597,323 L 688,323 L 845,500 L 688,677 L 597,677 L 754,500 Z"
        fill={chevColor}
      />
    </Svg>
  );

  if (variant === "full") {
    return (
      <View style={styles.fullContainer}>
        {iconSvg}
        <View style={styles.textRow}>
          <Text
            style={[
              styles.brandText,
              { color: themeMode === "dark" ? "#FFFFFF" : "#0F172A", fontSize: size * 0.72 },
            ]}
          >
            Kiosk<Text style={{ color: palette.primaryText }}>Drop</Text>
          </Text>
          <View
            style={[
              styles.badgeContainer,
              {
                backgroundColor: palette.primarySoft,
                borderColor: palette.borderStrong,
              },
            ]}
          >
            <Text style={[styles.badgeText, { color: palette.primaryText }]}>
              ENTERPRISE
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return iconSvg;
}

const styles = StyleSheet.create({
  fullContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  textRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  brandText: {
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  badgeContainer: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
});

