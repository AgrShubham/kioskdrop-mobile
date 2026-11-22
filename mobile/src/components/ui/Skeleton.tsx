import React, { useEffect, useState } from "react";
import { View, StyleSheet, Animated, Easing, DimensionValue } from "react-native";
import { getPalette, ThemeMode } from "@/lib/theme";
import { useAppStore } from "@/store/app-store";

export interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: object;
  themeMode?: ThemeMode;
}

export function SkeletonBox({
  width = "100%",
  height = 20,
  borderRadius = 8,
  style,
  themeMode: explicitTheme,
}: SkeletonProps) {
  const storeTheme = useAppStore((s) => s.themeMode);
  const themeMode = explicitTheme ?? storeTheme;
  const palette = getPalette(themeMode);

  const [shimmer] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.75],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor:
            themeMode === "dark"
              ? "rgba(148, 163, 184, 0.12)"
              : "rgba(15, 23, 42, 0.08)",
          opacity,
        },
        style,
      ]}
    />
  );
}

export function StatCardSkeleton({ themeMode }: { themeMode?: ThemeMode }) {
  const storeTheme = useAppStore((s) => s.themeMode);
  const mode = themeMode ?? storeTheme;
  const palette = getPalette(mode);

  return (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: palette.card,
          borderColor: palette.border,
        },
      ]}
    >
      <View style={styles.rowBetween}>
        <SkeletonBox width={70} height={12} themeMode={mode} />
        <SkeletonBox width={24} height={24} borderRadius={12} themeMode={mode} />
      </View>
      <View style={{ marginTop: 12 }}>
        <SkeletonBox width={45} height={28} borderRadius={6} themeMode={mode} />
      </View>
      <View style={{ marginTop: 8 }}>
        <SkeletonBox width={90} height={10} themeMode={mode} />
      </View>
    </View>
  );
}

export function LockerBaySkeleton({ themeMode }: { themeMode?: ThemeMode }) {
  const storeTheme = useAppStore((s) => s.themeMode);
  const mode = themeMode ?? storeTheme;
  const palette = getPalette(mode);

  return (
    <View
      style={[
        styles.lockerCard,
        {
          backgroundColor: palette.card,
          borderColor: palette.border,
        },
      ]}
    >
      <View style={styles.rowBetween}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <SkeletonBox width={32} height={32} borderRadius={8} themeMode={mode} />
          <View style={{ gap: 4 }}>
            <SkeletonBox width={90} height={14} themeMode={mode} />
            <SkeletonBox width={60} height={10} themeMode={mode} />
          </View>
        </View>
        <SkeletonBox width={65} height={22} borderRadius={11} themeMode={mode} />
      </View>
      <View style={{ marginTop: 14, gap: 6 }}>
        <SkeletonBox width="100%" height={12} themeMode={mode} />
        <SkeletonBox width="70%" height={12} themeMode={mode} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    minWidth: 150,
  },
  lockerCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});

