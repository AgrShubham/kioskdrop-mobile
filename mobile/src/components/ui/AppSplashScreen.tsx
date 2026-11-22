import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Animated,
  Easing,
  Platform,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { KioskDropLogo } from "./KioskDropLogo";
import { haptics } from "@/lib/haptics";

export interface AppSplashScreenProps {
  onFinish?: () => void;
  minDurationMs?: number;
}

const BOOT_LOGS = [
  "Initializing Zero-Trust Security Enclave...",
  "Syncing Smart Locker SSE Bus...",
  "Authorizing Bay Solenoid Matrix...",
  "Enterprise Fleet Online.",
];

export function AppSplashScreen({
  onFinish,
  minDurationMs = 1750,
}: AppSplashScreenProps) {
  const { width, height } = useWindowDimensions();

  // Animation values
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [logoScaleAnim] = useState(() => new Animated.Value(0.82));
  const [pulseAnim] = useState(() => new Animated.Value(0));
  const [chevronFlashAnim] = useState(() => new Animated.Value(0));
  const [textTranslateY] = useState(() => new Animated.Value(18));
  const [textFadeAnim] = useState(() => new Animated.Value(0));
  const [progressAnim] = useState(() => new Animated.Value(0));
  const [exitFadeAnim] = useState(() => new Animated.Value(1));
  const [exitZoomAnim] = useState(() => new Animated.Value(1));

  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const isDismissing = useRef(false);

  const triggerDismiss = (fast = false) => {
    if (isDismissing.current) return;
    isDismissing.current = true;
    haptics.tap().catch(() => {});

    Animated.parallel([
      Animated.timing(exitFadeAnim, {
        toValue: 0,
        duration: fast ? 150 : 380,
        useNativeDriver: true,
        easing: Easing.in(Easing.cubic),
      }),
      Animated.timing(exitZoomAnim, {
        toValue: fast ? 1.15 : 1.32,
        duration: fast ? 150 : 380,
        useNativeDriver: true,
        easing: Easing.in(Easing.cubic),
      }),
    ]).start(() => {
      onFinish?.();
    });
  };

  useEffect(() => {
    // 1. Stage 1: Elastic Logo Entrance (0 - 500ms)
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 480,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(logoScaleAnim, {
        toValue: 1,
        duration: 620,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.4)),
      }),
    ]).start();

    // 2. Stage 2: Chevron Drop Flash & Haptic Trigger (at 380ms)
    const hapticTimer = setTimeout(() => {
      haptics.selection().catch(() => {});
      Animated.sequence([
        Animated.timing(chevronFlashAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }),
        Animated.timing(chevronFlashAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
          easing: Easing.in(Easing.quad),
        }),
      ]).start();
    }, 380);

    // 3. Stage 3: Staggered Brand Lockup Reveal (at 450ms)
    const textTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(textFadeAnim, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 480,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
      ]).start();
    }, 450);

    // 4. Continuous Ambient Pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.quad),
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1100,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.quad),
        }),
      ])
    ).start();

    // 5. Progress Bar Fill
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: minDurationMs - 350,
      useNativeDriver: false,
      easing: Easing.inOut(Easing.cubic),
    }).start();

    // 6. Stepped Diagnostics Stream
    const stepInterval = (minDurationMs - 400) / BOOT_LOGS.length;
    const intervalId = setInterval(() => {
      setActiveStepIndex((prev) => {
        if (prev < BOOT_LOGS.length - 1) return prev + 1;
        return prev;
      });
    }, stepInterval);

    // 7. Stage 4: Cinematic Zoom-Through Exit
    const exitTimer = setTimeout(() => {
      triggerDismiss(false);
    }, minDurationMs);

    return () => {
      clearTimeout(hapticTimer);
      clearTimeout(textTimer);
      clearTimeout(exitTimer);
      clearInterval(intervalId);
    };
  }, [minDurationMs]);

  const haloScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.25],
  });

  const haloOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.12, 0.28],
  });

  const progressBarWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <Pressable
      onPress={() => triggerDismiss(true)}
      style={StyleSheet.absoluteFill}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.container,
          {
            opacity: exitFadeAnim,
            transform: [{ scale: exitZoomAnim }],
          },
        ]}
      >
        {/* Background Ambient Radial Glow */}
        <View style={styles.ambientGlowContainer}>
          <Animated.View
            style={[
              styles.haloRing,
              {
                transform: [{ scale: haloScale }],
                opacity: haloOpacity,
              },
            ]}
          />
          <View style={styles.coreGlow} />
        </View>

        {/* Main Kinetic Center Stage */}
        <Animated.View
          style={[
            styles.contentBox,
            {
              opacity: fadeAnim,
              transform: [{ scale: logoScaleAnim }],
            },
          ]}
        >
          {/* Glowing Emblem Core */}
          <View style={styles.logoWrapper}>
            <LinearGradient
              colors={["#0F172A", "#0B0F19"]}
              style={styles.logoCard}
            >
              <KioskDropLogo size={78} variant="icon" themeMode="dark" />
            </LinearGradient>
          </View>

          {/* Staggered Identity Elements */}
          <Animated.View
            style={{
              opacity: textFadeAnim,
              transform: [{ translateY: textTranslateY }],
              alignItems: "center",
            }}
          >
            {/* Wordmark */}
            <View style={styles.titleRow}>
              <Text style={styles.brandTitle}>
                Kiosk<Text style={styles.brandTitleAccent}>Drop</Text>
              </Text>
            </View>

            {/* Enterprise Hardware Badge */}
            <View style={styles.badge}>
              <View style={styles.statusDot} />
              <Text style={styles.badgeText}>ENTERPRISE SMART LOCKER</Text>
            </View>

            {/* Subsystem Boot Stream */}
            <View style={styles.logContainer}>
              <Text style={styles.logText}>
                {BOOT_LOGS[activeStepIndex]}
              </Text>
            </View>

            {/* Indeterminate Shimmer Progress Track */}
            <View style={styles.progressTrack}>
              <Animated.View
                style={[styles.progressBar, { width: progressBarWidth }]}
              >
                <LinearGradient
                  colors={["#2563EB", "#38BDF8", "#06B6D4"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            </View>
          </Animated.View>
        </Animated.View>

        {/* Footer Zero-Trust Indicator */}
        <Animated.View style={[styles.footer, { opacity: textFadeAnim }]}>
          <Text style={styles.footerText}>
            AV / IT Zero-Trust Automated Dispatch Platform
          </Text>
          <Text style={styles.footerSub}>
            Tap anywhere to skip • v1.0.1 BLE & SSE
          </Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#070A10",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  ambientGlowContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  haloRing: {
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "#2563EB",
  },
  coreGlow: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#06B6D4",
    opacity: 0.18,
  },
  contentBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  logoWrapper: {
    marginBottom: 20,
    shadowColor: "#38BDF8",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  logoCard: {
    width: 130,
    height: 130,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(56, 189, 248, 0.28)",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -1,
  },
  brandTitleAccent: {
    color: "#38BDF8",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 20,
    backgroundColor: "rgba(37, 99, 235, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.25)",
    marginBottom: 22,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#60A5FA",
    letterSpacing: 1.2,
  },
  logContainer: {
    minHeight: 20,
    marginBottom: 12,
  },
  logText: {
    fontSize: 12,
    color: "#94A3B8",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    letterSpacing: 0.2,
  },
  progressTrack: {
    width: 190,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 2,
  },
  footer: {
    position: "absolute",
    bottom: 40,
    alignItems: "center",
    gap: 4,
  },
  footerText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
  },
  footerSub: {
    fontSize: 10,
    color: "#475569",
    fontWeight: "500",
  },
});
