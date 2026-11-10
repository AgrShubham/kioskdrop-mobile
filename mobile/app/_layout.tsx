import "../global.css";
import React, { useState } from "react";
import { View } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
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

  return (
    <View
      className={themeMode === "dark" ? "dark flex-1" : "flex-1"}
      style={{ flex: 1, backgroundColor: palette.background }}
    >
      <StatusBar style={themeMode === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
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
