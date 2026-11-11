import React, { useState } from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ChevronDown,
  Moon,
  ShieldCheck,
  Sun,
} from "lucide-react-native";
import { formatRoleLabel } from "@/lib/format";
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
  const activeName = session?.name ?? "Aarav Sharma";
  const activeRoleFriendly = formatRoleLabel(session?.role ?? "EMPLOYEE");

  return (
    <View
      style={{
        paddingTop: Math.max(insets.top, 8) + 4,
        paddingBottom: 10,
        paddingHorizontal: compactPhone ? 14 : 16,
        backgroundColor: palette.background,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
      }}
    >
      {/* Left Brand Cluster */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          flex: 1,
          minWidth: 0,
        }}
      >
        <LinearGradient
          colors={palette.heroGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 34,
            height: 34,
            borderRadius: 11,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ShieldCheck size={18} color="#FFFFFF" strokeWidth={2.3} />
        </LinearGradient>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            numberOfLines={1}
            style={{
              color: palette.foreground,
              fontSize: 16,
              fontWeight: "800",
              letterSpacing: -0.4,
            }}
          >
            KioskDrop
          </Text>
          <Text
            numberOfLines={1}
            style={{
              color: palette.mutedForeground,
              fontSize: 11,
              fontWeight: "500",
            }}
          >
            {compactPhone ? activeRoleFriendly : `${activeName} · ${activeRoleFriendly}`}
          </Text>
        </View>
      </View>

      {/* Right Control Cluster — >=44pt hit zones wrapping sleek low-chrome pills */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
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
            alignItems: "center",
            justifyContent: "center",
            opacity: pressedId === "sse" ? 0.72 : 1,
          }}
        >
          <View
            style={{
              height: 32,
              paddingHorizontal: 10,
              borderRadius: 999,
              backgroundColor: sseConnected
                ? palette.emeraldSoft
                : palette.amberSoft,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            <View
              style={{
                width: 7,
                height: 7,
                borderRadius: 999,
                backgroundColor: sseConnected ? palette.emerald : palette.amber,
              }}
            />
            <Text
              numberOfLines={1}
              style={{
                color: sseConnected ? palette.emerald : palette.amber,
                fontSize: 11,
                fontWeight: "800",
                letterSpacing: 0.3,
              }}
            >
              {sseConnected ? "LIVE" : "SYNC"}
            </Text>
          </View>
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
            alignItems: "center",
            justifyContent: "center",
            opacity: pressedId === "theme" ? 0.72 : 1,
          }}
        >
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
            {themeMode === "dark" ? (
              <Sun size={16} color={palette.amber} />
            ) : (
              <Moon size={16} color={palette.primaryText} />
            )}
          </View>
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
            alignItems: "center",
            justifyContent: "center",
            opacity: pressedId === "persona" ? 0.72 : 1,
          }}
        >
          <View
            style={{
              height: 32,
              paddingHorizontal: 10,
              borderRadius: 999,
              backgroundColor: palette.primarySoft,
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
            }}
          >
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
          </View>
        </Pressable>
      </View>
    </View>
  );
}
