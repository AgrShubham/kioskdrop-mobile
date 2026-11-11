import "../global.css";
import React, { useEffect, useState } from "react";
import { Appearance, Platform, View } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NavigationBar } from "expo-navigation-bar";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useSession } from "@/hooks/useSession";
import { useTelemetrySSE } from "@/hooks/useTelemetrySSE";
import { getPalette } from "@/lib/theme";
import { useAppStore } from "@/store/app-store";

function AppShellContent() {
  const themeMode = useAppStore((s) => s.themeMode);
  const palette = getPalette(themeMode);
  const { session } = useSession();

  useTelemetrySSE(session ? `${session.role}:${session.userId}` : "guest");

  useEffect(() => {
    if (Platform.OS === "web") return;
    try {
      Appearance.setColorScheme?.(themeMode);
    } catch {
      // Ignore on runtimes where overriding system color scheme is unsupported
    }
    void SystemUI.setBackgroundColorAsync(palette.card).catch(() => {});
  }, [themeMode, palette.card]);

  return (
    <View
      className={themeMode === "dark" ? "dark flex-1" : "flex-1"}
      style={{ flex: 1, backgroundColor: palette.background }}
    >
      <StatusBar style={themeMode === "dark" ? "light" : "dark"} />
      {Platform.OS === "android" ? (
        <NavigationBar style={themeMode === "dark" ? "light" : "dark"} />
      ) : null}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="scanner"
          options={{
            presentation: "modal",
            headerShown: false,
          }}
        />
        <Stack.Screen name="+not-found" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10_000,
            retry: 1,
          },
        },
      })
  );

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AppShellContent />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
