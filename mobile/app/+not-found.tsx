import React from "react";
import { Pressable, Text, View } from "react-native";
import { Link } from "expo-router";
import { AlertTriangle, ArrowLeft } from "lucide-react-native";
import { ChamferCard } from "@/components/ui/ChamferCard";
import { getPalette } from "@/lib/theme";
import { useAppStore } from "@/store/app-store";

export default function NotFoundScreen() {
  const themeMode = useAppStore((s) => s.themeMode);
  const palette = getPalette(themeMode);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: palette.background,
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <ChamferCard tone="amber" style={{ width: "100%", maxWidth: 420, gap: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <AlertTriangle size={22} color={palette.amber} />
          <Text
            style={{
              color: palette.foreground,
              fontSize: 18,
              fontWeight: "800",
            }}
          >
            Route or Deep Link Not Found
          </Text>
        </View>
        <Text
          style={{
            color: palette.mutedForeground,
            fontSize: 13,
            lineHeight: 19,
          }}
        >
          The requested KioskDrop URI could not be matched to a hub screen. Use a valid room QR link or return to the enterprise home gateway.
        </Text>
        <Link href="/(tabs)" asChild>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Return to Home Gateway"
            style={{
              minHeight: 48,
              borderRadius: 12,
              backgroundColor: palette.primary,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <ArrowLeft size={16} color="#FFFFFF" />
            <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "700" }}>
              Return to Home Gateway
            </Text>
          </Pressable>
        </Link>
      </ChamferCard>
    </View>
  );
}

