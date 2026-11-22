import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { X } from "lucide-react-native";
import { KioskDropLogo } from "./KioskDropLogo";
import { getPalette, ThemeMode } from "@/lib/theme";
import { useAppStore } from "@/store/app-store";
import { haptics } from "@/lib/haptics";

export interface LoadingScreenProps {
  visible: boolean;
  title?: string;
  message?: string;
  subsystem?: string;
  themeMode?: ThemeMode;
  onCancel?: () => void;
  cancelLabel?: string;
}

export function LoadingScreen({
  visible,
  title = "Connecting to Smart Locker...",
  message = "Securing end-to-end hardware communication channel",
  subsystem = "IOT_SOLENOID_DISPATCH",
  themeMode: explicitTheme,
  onCancel,
  cancelLabel = "Cancel Operation",
}: LoadingScreenProps) {
  const storeTheme = useAppStore((s) => s.themeMode);
  const themeMode = explicitTheme ?? storeTheme;
  const palette = getPalette(themeMode);

  // Pulse & spin animations
  const [pulseAnim] = useState(() => new Animated.Value(0));
  const [spinAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!visible) return;

    // Continuous pulse
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
          easing: Easing.in(Easing.quad),
        }),
      ])
    );

    // Continuous spin for indicator ring
    const spinLoop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 2200,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    );

    pulseLoop.start();
    spinLoop.start();

    return () => {
      pulseLoop.stop();
      spinLoop.stop();
    };
  }, [visible, pulseAnim, spinAnim]);

  if (!visible) return null;

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const radarScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.4],
  });

  const radarOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.05],
  });

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
    >
      <View
        style={[
          styles.overlay,
          {
            backgroundColor:
              themeMode === "dark"
                ? "rgba(7, 10, 16, 0.94)"
                : "rgba(243, 245, 249, 0.94)",
          },
        ]}
      >
        <View style={styles.card}>
          {/* Animated Center Radar & Logo */}
          <View style={styles.beaconContainer}>
            {/* Outer expanding pulse ring */}
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  transform: [{ scale: radarScale }],
                  opacity: radarOpacity,
                  borderColor: palette.sky,
                },
              ]}
            />

            {/* Rotating Cyber Accent Ring */}
            <Animated.View
              style={[
                styles.spinRing,
                {
                  transform: [{ rotate: spin }],
                  borderColor: palette.borderStrong,
                  borderTopColor: palette.sky,
                },
              ]}
            />

            {/* Logo Emblem Core */}
            <View
              style={[
                styles.coreEmblem,
                {
                  backgroundColor: palette.card,
                  borderColor: palette.borderStrong,
                },
              ]}
            >
              <KioskDropLogo size={42} variant="icon" themeMode={themeMode} />
            </View>
          </View>

          {/* Subsystem Code Pill */}
          <View
            style={[
              styles.subsystemPill,
              {
                backgroundColor: palette.primarySoft,
                borderColor: palette.borderStrong,
              },
            ]}
          >
            <View style={styles.greenDot} />
            <Text style={[styles.subsystemText, { color: palette.primaryText }]}>
              {subsystem}
            </Text>
          </View>

          {/* Title & Message */}
          <Text
            style={[
              styles.title,
              { color: palette.foreground },
            ]}
          >
            {title}
          </Text>

          <Text
            style={[
              styles.message,
              { color: palette.mutedForeground },
            ]}
          >
            {message}
          </Text>

          {/* Optional Cancel Action */}
          {onCancel ? (
            <Pressable
              onPress={() => {
                haptics.tap();
                onCancel();
              }}
              style={({ pressed }) => [
                styles.cancelButton,
                {
                  borderColor: palette.border,
                  backgroundColor: pressed ? palette.muted : "transparent",
                },
              ]}
            >
              <X size={15} color={palette.mutedForeground} />
              <Text style={[styles.cancelText, { color: palette.mutedForeground }]}>
                {cancelLabel}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  beaconContainer: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  pulseRing: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
  },
  spinRing: {
    position: "absolute",
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 2,
    borderStyle: "dashed",
  },
  coreEmblem: {
    width: 80,
    height: 80,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  subsystemPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  subsystemText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    marginBottom: 26,
    paddingHorizontal: 8,
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  cancelText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
