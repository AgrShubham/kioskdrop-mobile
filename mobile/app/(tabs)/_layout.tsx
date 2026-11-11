import React from "react";
import { View } from "react-native";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BarChart3, Cpu, ShieldCheck, Smartphone } from "lucide-react-native";
import { GlobalHeader } from "@/components/layout/GlobalHeader";
import { PersonaServerSheet } from "@/components/layout/PersonaServerSheet";
import { TelemetryDrawerModal } from "@/components/layout/TelemetryDrawerModal";
import { getPalette } from "@/lib/theme";
import { useAppStore } from "@/store/app-store";

export default function TabsLayout() {
  const themeMode = useAppStore((s) => s.themeMode);
  const palette = getPalette(themeMode);
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <GlobalHeader />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: palette.primaryText,
          tabBarInactiveTintColor: palette.mutedForeground,
          tabBarStyle: {
            backgroundColor: palette.card,
            borderTopColor: palette.border,
            borderTopWidth: 1,
            height: 64 + insets.bottom,
            paddingTop: 6,
            paddingBottom: Math.max(insets.bottom, 6),
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarIconStyle: {
            height: 28,
            marginBottom: 1,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            lineHeight: 14,
            fontWeight: "700",
            letterSpacing: 0.15,
          },
          tabBarItemStyle: {
            minHeight: 44,
            justifyContent: "center",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarAccessibilityLabel: "Home Gateway tab",
            tabBarIcon: ({ color, focused }) => (
              <View
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 4,
                  borderRadius: 999,
                  backgroundColor: focused ? palette.primarySoft : "transparent",
                }}
              >
                <ShieldCheck
                  size={19}
                  color={color}
                  strokeWidth={focused ? 2.3 : 1.8}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="request"
          options={{
            title: "Drop",
            tabBarAccessibilityLabel: "Rapid-Drop AV Request tab",
            tabBarIcon: ({ color, focused }) => (
              <View
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 4,
                  borderRadius: 999,
                  backgroundColor: focused ? palette.primarySoft : "transparent",
                }}
              >
                <Smartphone
                  size={19}
                  color={color}
                  strokeWidth={focused ? 2.3 : 1.8}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="kiosk"
          options={{
            title: "Kiosk",
            tabBarAccessibilityLabel: "Smart Locker Kiosk tab",
            tabBarIcon: ({ color, focused }) => (
              <View
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 4,
                  borderRadius: 999,
                  backgroundColor: focused ? palette.primarySoft : "transparent",
                }}
              >
                <Cpu
                  size={19}
                  color={color}
                  strokeWidth={focused ? 2.3 : 1.8}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="admin"
          options={{
            title: "Command",
            tabBarAccessibilityLabel: "Enterprise Admin Command tab",
            tabBarIcon: ({ color, focused }) => (
              <View
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 4,
                  borderRadius: 999,
                  backgroundColor: focused ? palette.primarySoft : "transparent",
                }}
              >
                <BarChart3
                  size={19}
                  color={color}
                  strokeWidth={focused ? 2.3 : 1.8}
                />
              </View>
            ),
          }}
        />
      </Tabs>

      <PersonaServerSheet />
      <TelemetryDrawerModal />
    </View>
  );
}
