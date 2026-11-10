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
            height: 66 + insets.bottom,
            paddingTop: 4,
            paddingBottom: Math.max(insets.bottom, 6),
          },
          tabBarIconStyle: {
            height: 24,
            marginBottom: 2,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            lineHeight: 14,
            fontWeight: "700",
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
            tabBarIcon: ({ color }) => <ShieldCheck size={20} color={color} />,
          }}
        />
        <Tabs.Screen
          name="request"
          options={{
            title: "Drop",
            tabBarAccessibilityLabel: "Rapid-Drop AV Request tab",
            tabBarIcon: ({ color }) => <Smartphone size={20} color={color} />,
          }}
        />
        <Tabs.Screen
          name="kiosk"
          options={{
            title: "Kiosk",
            tabBarAccessibilityLabel: "Smart Locker Kiosk tab",
            tabBarIcon: ({ color }) => <Cpu size={20} color={color} />,
          }}
        />
        <Tabs.Screen
          name="admin"
          options={{
            title: "Command",
            tabBarAccessibilityLabel: "Enterprise Admin Command tab",
            tabBarIcon: ({ color }) => <BarChart3 size={20} color={color} />,
          }}
        />
      </Tabs>

      <PersonaServerSheet />
      <TelemetryDrawerModal />
    </View>
  );
}
