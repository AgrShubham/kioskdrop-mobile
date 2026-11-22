import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as LocalAuthentication from "expo-local-authentication";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Eye,
  EyeOff,
  Fingerprint,
  Lock,
  Mail,
  Moon,
  Radio,
  Server,
  ShieldCheck,
  Sun,
  UserCheck,
  Wifi,
} from "lucide-react-native";
import { KioskDropLogo } from "@/components/ui/KioskDropLogo";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useSession } from "@/hooks/useSession";
import { getActiveApiBaseUrl, pingServerLatency, type PingResult } from "@/lib/api";
import { formatRoleLabel } from "@/lib/format";
import { haptics } from "@/lib/haptics";
import { getPalette } from "@/lib/theme";
import { useAppStore } from "@/store/app-store";
import type { UserRole } from "@/types/domain";

type LoginTab = "credentials" | "demo" | "rfid";

interface DemoPersona {
  role: UserRole;
  name: string;
  email: string;
  department: string;
  rfidBadgeId: string;
  badgeTone: "sapphire" | "emerald" | "amber";
  roleDescription: string;
}

const DEMO_PERSONAS: DemoPersona[] = [
  {
    role: "EMPLOYEE",
    name: "Aarav Sharma",
    email: "aarav.sharma@enterprise.corp",
    department: "Sales & Strategic Accounts",
    rfidBadgeId: "RFID-EMP-8821",
    badgeTone: "sapphire",
    roleDescription: "Rapid AV Request, QR Scanning & Locker Pickup",
  },
  {
    role: "IT_ADMIN",
    name: "Priya Patel",
    email: "priya.patel@enterprise.corp",
    department: "Enterprise Infrastructure & AV Ops",
    rfidBadgeId: "RFID-IT-0042",
    badgeTone: "emerald",
    roleDescription: "Full Superuser: USB Zero-Trust, POs & Webhooks",
  },
  {
    role: "FINOPS_AUDITOR",
    name: "Vikram Malhotra",
    email: "vikram.malhotra@enterprise.corp",
    department: "Corporate Procurement & FinOps",
    rfidBadgeId: "RFID-FIN-1109",
    badgeTone: "amber",
    roleDescription: "Read-Only Indian Customs Duty & Card Audits",
  },
];

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compactPhone = width < 380;

  const themeMode = useAppStore((s) => s.themeMode);
  const toggleThemeMode = useAppStore((s) => s.toggleThemeMode);
  const setPersonaSheetOpen = useAppStore((s) => s.setPersonaSheetOpen);
  const palette = getPalette(themeMode);

  const { login, isLoggingIn } = useSession();

  const [activeTab, setActiveTab] = useState<LoginTab>("credentials");
  const [email, setEmail] = useState("aarav.sharma@enterprise.corp");
  const [password, setPassword] = useState("kiosk2026");
  const [showPassword, setShowPassword] = useState(false);
  const [rfidInput, setRfidInput] = useState("RFID-EMP-8821");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Biometric capability state
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState("Biometric Unlock");

  // Ping check
  const [pingLoading, setPingLoading] = useState(false);
  const [pingResult, setPingResult] = useState<PingResult | null>(null);

  useEffect(() => {
    async function checkBiometrics() {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (hasHardware && isEnrolled) {
          setBiometricAvailable(true);
          const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
          if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            setBiometricLabel("Face ID Quick Unlock");
          } else {
            setBiometricLabel("Fingerprint Quick Unlock");
          }
        }
      } catch {
        // Biometrics unavailable or unsupported
      }
    }
    void checkBiometrics();
  }, []);

  const handleCredentialsLogin = async () => {
    setErrorMessage(null);
    if (!email.trim()) {
      void haptics.error();
      setErrorMessage("Please enter your corporate email address.");
      return;
    }
    try {
      await login({
        email: email.trim(),
        password: password.trim() || "kiosk2026",
      });
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Authentication failed. Check credentials or server connection."
      );
    }
  };

  const handleDemoPersonaLogin = async (persona: DemoPersona) => {
    setErrorMessage(null);
    try {
      await login({
        email: persona.email,
        role: persona.role,
      });
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Failed to authenticate with demo persona."
      );
    }
  };

  const handleRfidLogin = async () => {
    setErrorMessage(null);
    if (!rfidInput.trim()) {
      void haptics.error();
      setErrorMessage("Enter an RFID badge number (e.g. RFID-EMP-8821).");
      return;
    }
    try {
      await login({
        rfidBadgeId: rfidInput.trim(),
      });
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "RFID badge not recognized in enterprise directory."
      );
    }
  };

  const handleBiometricAuth = async () => {
    setErrorMessage(null);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to access KioskDrop Enterprise",
        fallbackLabel: "Use Password",
        cancelLabel: "Cancel",
      });
      if (result.success) {
        // Authenticate as active pre-enrolled user (defaulting to Aarav Sharma)
        await login({ email: "aarav.sharma@enterprise.corp" });
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Biometric authentication failed."
      );
    }
  };

  const handleTestPing = async () => {
    setPingLoading(true);
    setPingResult(null);
    const result = await pingServerLatency();
    setPingLoading(false);
    setPingResult(result);
    if (result.ok) {
      void haptics.success();
    } else {
      void haptics.error();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: palette.background }}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 14) + 8,
          paddingBottom: Math.max(insets.bottom, 16) + 24,
          paddingHorizontal: compactPhone ? 16 : 20,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top Low-Chrome Navigation Bar */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          {/* Target Host Indicator */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Configure server host target"
            onPress={() => {
              void haptics.tap();
              setPersonaSheetOpen(true);
            }}
            style={{
              height: 34,
              paddingHorizontal: 12,
              borderRadius: 999,
              backgroundColor: palette.card,
              borderWidth: 1,
              borderColor: palette.border,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Server size={14} color={palette.mutedForeground} />
            <Text
              numberOfLines={1}
              style={{
                color: palette.foreground,
                fontSize: 11.5,
                fontWeight: "700",
                maxWidth: 160,
              }}
            >
              {getActiveApiBaseUrl().replace(/^https?:\/\//, "")}
            </Text>
          </Pressable>

          {/* Theme & Ping Controls */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Pressable
              testID="login-ping-button"
              accessibilityRole="button"
              disabled={pingLoading}
              onPress={() => void handleTestPing()}
              style={{
                width: 36,
                height: 36,
                borderRadius: 999,
                backgroundColor: pingResult?.ok ? palette.emeraldSoft : palette.card,
                borderWidth: 1,
                borderColor: pingResult?.ok ? palette.emerald : palette.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {pingLoading ? (
                <ActivityIndicator size="small" color={palette.primaryText} />
              ) : (
                <Wifi
                  size={16}
                  color={pingResult?.ok ? palette.emerald : palette.mutedForeground}
                />
              )}
            </Pressable>

            <Pressable
              testID="login-theme-button"
              accessibilityRole="button"
              onPress={() => {
                void haptics.selection();
                toggleThemeMode();
              }}
              style={{
                width: 36,
                height: 36,
                borderRadius: 999,
                backgroundColor: palette.card,
                borderWidth: 1,
                borderColor: palette.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {themeMode === "dark" ? (
                <Sun size={16} color={palette.amber} />
              ) : (
                <Moon size={16} color={palette.primaryText} />
              )}
            </Pressable>
          </View>
        </View>

        {/* Brand Header Cluster */}
        <View style={{ alignItems: "center", marginBottom: 24, marginTop: 4 }}>
          <View
            style={{
              width: 68,
              height: 68,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: themeMode === "dark" ? "#0F1521" : "#FFFFFF",
              borderWidth: 1.5,
              borderColor: palette.borderStrong,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.18,
              shadowRadius: 10,
              elevation: 4,
              marginBottom: 14,
            }}
          >
            <KioskDropLogo size={36} variant="icon" />
          </View>

          <Text
            style={{
              color: palette.foreground,
              fontSize: 26,
              fontWeight: "900",
              letterSpacing: -0.6,
              marginBottom: 4,
            }}
          >
            KioskDrop
          </Text>

          <Text
            style={{
              color: palette.mutedForeground,
              fontSize: 13,
              fontWeight: "500",
              textAlign: "center",
              letterSpacing: 0.1,
            }}
          >
            Zero-Trust Hardware Access & Fleet Gateway
          </Text>
        </View>

        {/* Tab Selector Strip (Credentials | Quick Demo | RFID Tap) */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: palette.card,
            borderRadius: 14,
            padding: 4,
            borderWidth: 1,
            borderColor: palette.border,
            marginBottom: 20,
          }}
        >
          <Pressable
            testID="login-tab-credentials"
            accessibilityRole="tab"
            accessibilityLabel="Corporate Credentials tab"
            accessibilityState={{ selected: activeTab === "credentials" }}
            onPress={() => {
              void haptics.selection();
              setActiveTab("credentials");
              setErrorMessage(null);
            }}
            style={{
              flex: 1,
              minHeight: 38,
              borderRadius: 10,
              backgroundColor:
                activeTab === "credentials" ? palette.primary : "transparent",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 5,
            }}
          >
            <Mail
              size={14}
              color={activeTab === "credentials" ? "#FFFFFF" : palette.mutedForeground}
            />
            <Text
              style={{
                color: activeTab === "credentials" ? "#FFFFFF" : palette.foreground,
                fontSize: 12,
                fontWeight: activeTab === "credentials" ? "800" : "600",
              }}
            >
              Credentials
            </Text>
          </Pressable>

          <Pressable
            testID="login-tab-demo"
            accessibilityRole="tab"
            accessibilityLabel="Quick Demo Switcher tab"
            accessibilityState={{ selected: activeTab === "demo" }}
            onPress={() => {
              void haptics.selection();
              setActiveTab("demo");
              setErrorMessage(null);
            }}
            style={{
              flex: 1,
              minHeight: 38,
              borderRadius: 10,
              backgroundColor:
                activeTab === "demo" ? palette.primary : "transparent",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 5,
            }}
          >
            <UserCheck
              size={14}
              color={activeTab === "demo" ? "#FFFFFF" : palette.mutedForeground}
            />
            <Text
              style={{
                color: activeTab === "demo" ? "#FFFFFF" : palette.foreground,
                fontSize: 12,
                fontWeight: activeTab === "demo" ? "800" : "600",
              }}
            >
              Quick Demo
            </Text>
          </Pressable>

          <Pressable
            testID="login-tab-rfid"
            accessibilityRole="tab"
            accessibilityLabel="RFID Badge Tap tab"
            accessibilityState={{ selected: activeTab === "rfid" }}
            onPress={() => {
              void haptics.selection();
              setActiveTab("rfid");
              setErrorMessage(null);
            }}
            style={{
              flex: 1,
              minHeight: 38,
              borderRadius: 10,
              backgroundColor:
                activeTab === "rfid" ? palette.primary : "transparent",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 5,
            }}
          >
            <Radio
              size={14}
              color={activeTab === "rfid" ? "#FFFFFF" : palette.mutedForeground}
            />
            <Text
              style={{
                color: activeTab === "rfid" ? "#FFFFFF" : palette.foreground,
                fontSize: 12,
                fontWeight: activeTab === "rfid" ? "800" : "600",
              }}
            >
              RFID Tap
            </Text>
          </Pressable>
        </View>

        {/* Error Banner */}
        {errorMessage ? (
          <View
            style={{
              backgroundColor: palette.destructiveSoft,
              borderRadius: 12,
              padding: 12,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: palette.destructive,
              flexDirection: "row",
              alignItems: "center",
              gap: 9,
            }}
          >
            <AlertTriangle size={16} color={palette.destructive} />
            <Text
              style={{
                color: palette.destructive,
                fontSize: 12.5,
                fontWeight: "600",
                flex: 1,
              }}
            >
              {errorMessage}
            </Text>
          </View>
        ) : null}

        {/* Ping Result Banner */}
        {pingResult ? (
          <View
            style={{
              backgroundColor: pingResult.ok
                ? palette.emeraldSoft
                : palette.destructiveSoft,
              borderRadius: 12,
              padding: 10,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: pingResult.ok
                ? palette.emerald
                : palette.destructive,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            {pingResult.ok ? (
              <CheckCircle2 size={15} color={palette.emerald} />
            ) : (
              <AlertTriangle size={15} color={palette.destructive} />
            )}
            <Text
              style={{
                color: pingResult.ok ? palette.emerald : palette.destructive,
                fontSize: 12,
                fontWeight: "700",
                flex: 1,
              }}
            >
              {pingResult.ok
                ? `API Server Live • ${pingResult.latencyMs}ms latency • ${pingResult.roomCount} rooms synced`
                : `API Unreachable (${pingResult.latencyMs}ms): ${pingResult.error}`}
            </Text>
          </View>
        ) : null}

        {/* TAB 1: CORPORATE CREDENTIALS */}
        {activeTab === "credentials" ? (
          <View style={{ gap: 14 }}>
            {/* Corporate Email Field */}
            <View style={{ gap: 6 }}>
              <Text
                style={{
                  color: palette.mutedForeground,
                  fontSize: 11.5,
                  fontWeight: "700",
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                }}
              >
                Corporate Email Address
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: palette.card,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: palette.border,
                  paddingHorizontal: 14,
                  minHeight: 52,
                  gap: 10,
                }}
              >
                <Mail size={18} color={palette.mutedForeground} />
                <TextInput
                  testID="login-email-input"
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  placeholder="name@enterprise.corp"
                  placeholderTextColor={palette.mutedForeground}
                  accessibilityLabel="Corporate email address"
                  style={{
                    flex: 1,
                    color: palette.foreground,
                    fontSize: 14,
                    paddingVertical: 12,
                  }}
                />
              </View>
            </View>

            {/* Enterprise Access PIN / Password */}
            <View style={{ gap: 6 }}>
              <Text
                style={{
                  color: palette.mutedForeground,
                  fontSize: 11.5,
                  fontWeight: "700",
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                }}
              >
                Access Password or Master PIN
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: palette.card,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: palette.border,
                  paddingHorizontal: 14,
                  minHeight: 52,
                  gap: 10,
                }}
              >
                <Lock size={18} color={palette.mutedForeground} />
                <TextInput
                  testID="login-password-input"
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="Enter corporate password"
                  placeholderTextColor={palette.mutedForeground}
                  accessibilityLabel="Corporate password"
                  style={{
                    flex: 1,
                    color: palette.foreground,
                    fontSize: 14,
                    paddingVertical: 12,
                  }}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                  onPress={() => setShowPassword(!showPassword)}
                  style={{
                    minWidth: 40,
                    minHeight: 40,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {showPassword ? (
                    <EyeOff size={18} color={palette.mutedForeground} />
                  ) : (
                    <Eye size={18} color={palette.mutedForeground} />
                  )}
                </Pressable>
              </View>
            </View>

            {/* Primary Authenticate Button */}
            <Pressable
              testID="login-submit-button"
              accessibilityRole="button"
              accessibilityLabel="Authenticate with corporate credentials"
              disabled={isLoggingIn}
              onPress={() => void handleCredentialsLogin()}
              style={{
                minHeight: 52,
                borderRadius: 14,
                backgroundColor: palette.primary,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginTop: 6,
                shadowColor: palette.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.28,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              {isLoggingIn ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <ShieldCheck size={18} color="#FFFFFF" />
                  <Text style={{ color: "#FFFFFF", fontSize: 14.5, fontWeight: "800" }}>
                    Authenticate & Access
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        ) : null}

        {/* TAB 2: QUICK DEMO PERSONAS */}
        {activeTab === "demo" ? (
          <View style={{ gap: 10 }}>
            <Text
              style={{
                color: palette.mutedForeground,
                fontSize: 11.5,
                fontWeight: "700",
                letterSpacing: 0.5,
                marginBottom: 2,
                textTransform: "uppercase",
              }}
            >
              Choose Test Persona (1-Tap Login)
            </Text>

            {DEMO_PERSONAS.map((persona) => (
              <Pressable
                key={persona.role}
                testID={`demo-persona-${persona.role}`}
                accessibilityRole="button"
                accessibilityLabel={`Authenticate as ${persona.name}, ${persona.role}`}
                disabled={isLoggingIn}
                onPress={() => void handleDemoPersonaLogin(persona)}
                style={{
                  minHeight: 64,
                  borderRadius: 16,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: palette.border,
                  backgroundColor: palette.card,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <View style={{ flex: 1, gap: 4 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <Text
                      style={{
                        color: palette.foreground,
                        fontSize: 14.5,
                        fontWeight: "800",
                      }}
                    >
                      {persona.name}
                    </Text>
                    <StatusBadge
                      label={formatRoleLabel(persona.role)}
                      variant={persona.badgeTone}
                      compact
                    />
                  </View>
                  <Text
                    style={{
                      color: palette.mutedForeground,
                      fontSize: 11.5,
                    }}
                  >
                    {persona.department} · {persona.rfidBadgeId}
                  </Text>
                  <Text
                    style={{
                      color: palette.primaryText,
                      fontSize: 11,
                      fontWeight: "600",
                      marginTop: 2,
                    }}
                  >
                    {persona.roleDescription}
                  </Text>
                </View>

                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 999,
                    backgroundColor: palette.muted,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ArrowRight size={16} color={palette.foreground} />
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}

        {/* TAB 3: RFID BADGE TAP */}
        {activeTab === "rfid" ? (
          <View style={{ gap: 14 }}>
            <View
              style={{
                borderRadius: 20,
                borderWidth: 1.5,
                borderColor: palette.borderStrong,
                backgroundColor: palette.card,
                padding: 20,
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 999,
                  backgroundColor: palette.primarySoft,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Radio size={28} color={palette.primaryText} />
              </View>
              <Text
                style={{
                  color: palette.foreground,
                  fontSize: 16,
                  fontWeight: "800",
                }}
              >
                Corporate RFID / NFC Badge Reader
              </Text>
              <Text
                style={{
                  color: palette.mutedForeground,
                  fontSize: 12,
                  textAlign: "center",
                  lineHeight: 17,
                }}
              >
                Enter or tap your encrypted corporate badge ID to authenticate.
              </Text>

              <View
                style={{
                  width: "100%",
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: palette.surfaceElevated,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: palette.border,
                  paddingHorizontal: 12,
                  minHeight: 48,
                  gap: 8,
                  marginTop: 4,
                }}
              >
                <CreditCard size={16} color={palette.mutedForeground} />
                <TextInput
                  testID="login-rfid-input"
                  value={rfidInput}
                  onChangeText={(val) => {
                    setRfidInput(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  placeholder="RFID-EMP-8821"
                  placeholderTextColor={palette.mutedForeground}
                  accessibilityLabel="RFID Badge ID"
                  style={{
                    flex: 1,
                    color: palette.foreground,
                    fontSize: 13.5,
                    fontVariant: ["tabular-nums"],
                    paddingVertical: 10,
                  }}
                />
              </View>

              <Pressable
                testID="login-rfid-submit-button"
                accessibilityRole="button"
                accessibilityLabel="Authenticate with RFID Badge"
                disabled={isLoggingIn}
                onPress={() => void handleRfidLogin()}
                style={{
                  width: "100%",
                  minHeight: 48,
                  borderRadius: 12,
                  backgroundColor: palette.primary,
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: 8,
                }}
              >
                {isLoggingIn ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Radio size={16} color="#FFFFFF" />
                    <Text style={{ color: "#FFFFFF", fontSize: 13.5, fontWeight: "800" }}>
                      Tap / Verify Badge
                    </Text>
                  </>
                )}
              </Pressable>
            </View>

            {/* Quick RFID Presets */}
            <View style={{ flexDirection: "row", gap: 8 }}>
              {["RFID-EMP-8821", "RFID-IT-0042", "RFID-FIN-1109"].map((preset) => (
                <Pressable
                  key={preset}
                  accessibilityRole="button"
                  accessibilityLabel={`Use RFID preset ${preset}`}
                  onPress={() => {
                    void haptics.selection();
                    setRfidInput(preset);
                  }}
                  style={{
                    flex: 1,
                    minHeight: 38,
                    borderRadius: 10,
                    backgroundColor: palette.card,
                    borderWidth: 1,
                    borderColor:
                      rfidInput === preset ? palette.primary : palette.border,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      color:
                        rfidInput === preset
                          ? palette.primaryText
                          : palette.mutedForeground,
                      fontSize: 11,
                      fontWeight: "700",
                    }}
                  >
                    {preset.replace("RFID-", "")}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {/* Biometric Quick Unlock (When Hardware Supported) */}
        {biometricAvailable ? (
          <View style={{ marginTop: 20 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                marginBottom: 14,
              }}
            >
              <View style={{ flex: 1, height: 1, backgroundColor: palette.border }} />
              <Text
                style={{
                  color: palette.mutedForeground,
                  fontSize: 11,
                  fontWeight: "700",
                  letterSpacing: 0.6,
                }}
              >
                OR BIOMETRIC UNLOCK
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: palette.border }} />
            </View>

            <Pressable
              testID="login-biometric-button"
              accessibilityRole="button"
              onPress={() => void handleBiometricAuth()}
              style={{
                minHeight: 50,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: palette.borderStrong,
                backgroundColor: palette.card,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 9,
              }}
            >
              <Fingerprint size={19} color={palette.primaryText} />
              <Text
                style={{
                  color: palette.foreground,
                  fontSize: 13.5,
                  fontWeight: "800",
                }}
              >
                {biometricLabel}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* Footer Security Notice */}
        <View style={{ marginTop: 32, alignItems: "center", gap: 4 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <ShieldCheck size={13} color={palette.emerald} />
            <Text
              style={{
                color: palette.mutedForeground,
                fontSize: 11,
                fontWeight: "600",
              }}
            >
              HMAC-SHA256 Encrypted Session Token
            </Text>
          </View>
          <Text
            style={{
              color: palette.mutedForeground,
              fontSize: 10.5,
              textAlign: "center",
            }}
          >
            Session is stored securely in hardware Keystore / SecureStore.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
