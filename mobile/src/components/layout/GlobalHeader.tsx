import React, { useState } from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ChevronDown,
  Moon,
  Radio,
  ShieldCheck,
  Sun,
  UserCheck,
} from "lucide-react-native";
import { haptics } from "@/lib/haptics";
import { getPalette } from "@/lib/theme";
import { useSession } from "@/hooks/useSession";
import { useAppStore } from "@/store/app-store";

function shortRoleLabel(role?: string): string {
  switch (role) {
    case "IT_ADMIN":
      return "IT";
    case "FINOPS_AUDITOR":
      return "FIN";
    case "EMPLOYEE":
    default:
      return "EMP";
  }
}

export function GlobalHeader() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compactPhone = width < 390;

  const themeMode = useAppStore((s) => s.themeMode);
  const sseConnected = useAppStore((s) => s.sseConnected);
  const toggleThemeMode = useAppStore((s) => s.toggleThemeMode);
  const setPersonaSheetOpen = useAppStore((s) => s.setPersonaSheetOpen);
  const setTelemetryDrawerOpen = useAppStore((s) => s.setTelemetryDrawerOpen);

  const [pressedId, setPressedId] = useState<"sse" | "theme" | "persona" | null>(
    null
  );

  const { session } = useSession();
  const palette = getPalette(themeMode);

  const roleCode = shortRoleLabel(session?.role);

  return (
    <View
      style={{
        paddingTop: Math.max(insets.top, 8) + 4,
        paddingBottom: 10,
        paddingHorizontal: compactPhone ? 12 : 14,
        backgroundColor: palette.card,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: compactPhone ? 6 : 8,
      }}
    >
      {/* Left Brand Cluster */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: compactPhone ? 7 : 8,
          flex: 1,
          minWidth: 0,
        }}
      >
        <View
          style={{
            width: compactPhone ? 32 : 34,
            height: compactPhone ? 32 : 34,
            borderRadius: 10,
            backgroundColor: palette.primary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ShieldCheck size={compactPhone ? 18 : 19} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text
              numberOfLines={1}
              style={{
                color: palette.foreground,
                fontSize: compactPhone ? 15 : 16,
                fontWeight: "800",
                letterSpacing: -0.3,
              }}
            >
              KioskDrop
            </Text>
            {!compactPhone ? (
              <View
                style={{
                  backgroundColor:
                    themeMode === "dark"
                      ? "rgba(59, 130, 246, 0.16)"
                      : "rgba(37, 99, 235, 0.10)",
                  borderColor:
                    themeMode === "dark"
                      ? "rgba(59, 130, 246, 0.4)"
                      : "rgba(37, 99, 235, 0.28)",
                  borderWidth: 1,
                  paddingHorizontal: 6,
                  paddingVertical: 1,
                  borderRadius: 6,
                }}
              >
                <Text
                  style={{
                    color: palette.primaryText,
                    fontSize: 9,
                    fontWeight: "800",
                    letterSpacing: 0.7,
                  }}
                >
                  ENT
                </Text>
              </View>
            ) : null}
          </View>
          <Text
            numberOfLines={1}
            style={{
              color: palette.mutedForeground,
              fontSize: 10,
              fontWeight: "500",
            }}
          >
            {compactPhone ? "Enterprise AV" : "Zero-Trust AV Logistics"}
          </Text>
        </View>
      </View>

      {/* Right Control Cluster */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: compactPhone ? 5 : 6,
          flexShrink: 0,
        }}
      >
        {/* LIVE / SYNC SSE Drawer Trigger */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Telemetry stream ${sseConnected ? "live" : "syncing"}. Open event log`}
          onPressIn={() => setPressedId("sse")}
          onPressOut={() => setPressedId(null)}
          onPress={() => {
            void haptics.tap();
            setTelemetryDrawerOpen(true);
          }}
          style={{
            minHeight: 44,
            minWidth: 44,
            paddingHorizontal: compactPhone ? 8 : 10,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: sseConnected
              ? themeMode === "dark"
                ? "rgba(16, 185, 129, 0.45)"
                : "rgba(5, 150, 105, 0.35)"
              : themeMode === "dark"
              ? "rgba(245, 158, 11, 0.45)"
              : "rgba(217, 119, 6, 0.35)",
            backgroundColor: sseConnected
              ? palette.emeraldSoft
              : palette.amberSoft,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            opacity: pressedId === "sse" ? 0.78 : 1,
          }}
        >
          <Radio
            size={12}
            color={sseConnected ? palette.emerald : palette.amber}
          />
          <Text
            numberOfLines={1}
            style={{
              color: sseConnected ? palette.emerald : palette.amber,
              fontSize: 11,
              fontWeight: "800",
              letterSpacing: 0.5,
            }}
          >
            {sseConnected ? "LIVE" : "SYNC"}
          </Text>
        </Pressable>

        {/* Theme Switcher */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Switch to ${themeMode === "dark" ? "light" : "dark"} theme`}
          onPressIn={() => setPressedId("theme")}
          onPressOut={() => setPressedId(null)}
          onPress={() => {
            void haptics.selection();
            toggleThemeMode();
          }}
          style={{
            minWidth: 44,
            minHeight: 44,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: palette.border,
            backgroundColor: palette.muted,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressedId === "theme" ? 0.78 : 1,
          }}
        >
          {themeMode === "dark" ? (
            <Sun size={17} color={palette.amber} />
          ) : (
            <Moon size={17} color={palette.primary} />
          )}
        </Pressable>

        {/* Persona & Server Sheet Trigger */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Active role ${session?.role ?? "EMPLOYEE"}. Open persona and server settings`}
          onPressIn={() => setPressedId("persona")}
          onPressOut={() => setPressedId(null)}
          onPress={() => {
            void haptics.tap();
            setPersonaSheetOpen(true);
          }}
          style={{
            minHeight: 44,
            minWidth: 44,
            paddingHorizontal: compactPhone ? 8 : 10,
            borderRadius: 12,
            borderWidth: 1,
            borderColor:
              themeMode === "dark"
                ? "rgba(59, 130, 246, 0.42)"
                : "rgba(37, 99, 235, 0.30)",
            backgroundColor:
              themeMode === "dark"
                ? "rgba(59, 130, 246, 0.14)"
                : "rgba(37, 99, 235, 0.08)",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            opacity: pressedId === "persona" ? 0.78 : 1,
          }}
        >
          <UserCheck size={14} color={palette.primaryText} />
          <Text
            numberOfLines={1}
            style={{
              color: palette.primaryText,
              fontSize: 12,
              fontWeight: "800",
            }}
          >
            {roleCode}
          </Text>
          <ChevronDown size={13} color={palette.primaryText} />
        </Pressable>
      </View>
    </View>
  );
}
