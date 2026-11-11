import React, { useRef, useState } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
} from "expo-camera";
import { useRouter } from "expo-router";
import {
  AlertTriangle,
  ChevronRight,
  Flashlight,
  MapPin,
  Settings,
  X,
} from "lucide-react-native";
import { ChamferCard } from "@/components/ui/ChamferCard";
import { QUERY_KEYS } from "@/hooks/useSession";
import { kioskApi } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { parseRoomQrPayload } from "@/lib/qr-parser";
import { getPalette } from "@/lib/theme";
import { useAppStore } from "@/store/app-store";

const FALLBACK_ROOMS = [
  { name: "Executive Boardroom 4B", floor: 4, qrCodeSlug: "Boardroom-4B" },
  { name: "Innovation Lab 4A", floor: 4, qrCodeSlug: "Innovation-Lab-4A" },
  { name: "Townhall Auditorium 2A", floor: 2, qrCodeSlug: "Townhall-2A" },
  { name: "Client Pitch Suite 3C", floor: 3, qrCodeSlug: "Client-Pitch-3C" },
];

export default function QrScannerModalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const themeMode = useAppStore((s) => s.themeMode);
  const palette = getPalette(themeMode);

  const [permission, requestPermission] = useCameraPermissions();
  const [torchOn, setTorchOn] = useState(false);
  const [scanFeedback, setScanFeedback] = useState<string | null>(null);
  const [showManualPicker, setShowManualPicker] = useState(false);

  const isHandlingScanRef = useRef(false);

  const roomsQuery = useQuery({
    queryKey: QUERY_KEYS.rooms,
    queryFn: () => kioskApi.getRooms(),
    staleTime: 60_000,
  });

  const roomList = roomsQuery.data?.rooms ?? FALLBACK_ROOMS;

  const navigateWithRoom = (slug: string) => {
    router.replace({
      pathname: "/(tabs)/request",
      params: { room: slug },
    });
  };

  const handleBarcodeScanned = ({ data }: BarcodeScanningResult) => {
    if (isHandlingScanRef.current) return;
    isHandlingScanRef.current = true;

    const matchedSlug = parseRoomQrPayload(data, roomList);
    if (matchedSlug) {
      setScanFeedback(null);
      void haptics.success();
      navigateWithRoom(matchedSlug);
      return;
    }

    void haptics.warning();
    setScanFeedback(
      "Unrecognized QR tag. Scan a KioskDrop room tag or choose a room manually."
    );
    setTimeout(() => {
      isHandlingScanRef.current = false;
    }, 1800);
  };

  const renderManualRoomPicker = (subtitle: string) => (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.background }}
      contentContainerStyle={{
        padding: 20,
        paddingTop: Math.max(insets.top, 16) + 12,
        gap: 14,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View>
          <Text
            style={{
              color: palette.primaryText,
              fontSize: 11,
              fontWeight: "700",
              letterSpacing: 0.9,
              textTransform: "uppercase",
            }}
          >
            Room Selection
          </Text>
          <Text
            style={{
              color: palette.foreground,
              fontSize: 21,
              fontWeight: "800",
              letterSpacing: -0.4,
            }}
          >
            Choose Meeting Room
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close room scanner"
          onPress={() => router.back()}
          style={{
            minWidth: 44,
            minHeight: 44,
            alignItems: "center",
            justifyContent: "center",
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
            <X size={16} color={palette.foreground} />
          </View>
        </Pressable>
      </View>

      <ChamferCard tone="amber" style={{ gap: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <AlertTriangle size={18} color={palette.amber} />
          <Text
            style={{
              flex: 1,
              color: palette.foreground,
              fontSize: 14.5,
              fontWeight: "800",
            }}
          >
            Manual Room Lookup
          </Text>
        </View>
        <Text
          style={{
            color: palette.mutedForeground,
            fontSize: 12.5,
            lineHeight: 18,
          }}
        >
          {subtitle}
        </Text>

        {!permission?.granted ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 2 }}>
            {permission?.canAskAgain !== false ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Grant camera permission"
                onPress={() => void requestPermission()}
                style={{
                  minHeight: 44,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  backgroundColor: palette.primary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700" }}>
                  Allow Camera Access
                </Text>
              </Pressable>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open device settings to enable camera permission"
              onPress={() => void Linking.openSettings()}
              style={{
                minHeight: 44,
                paddingHorizontal: 14,
                borderRadius: 12,
                backgroundColor: palette.surfaceElevated,
                borderWidth: 1,
                borderColor: palette.borderStrong,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Settings size={15} color={palette.foreground} />
              <Text
                style={{
                  color: palette.foreground,
                  fontSize: 13,
                  fontWeight: "700",
                }}
              >
                Open Settings
              </Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Return to live camera QR scanner"
            onPress={() => setShowManualPicker(false)}
            style={{
              minHeight: 44,
              alignSelf: "flex-start",
              paddingHorizontal: 12,
              borderRadius: 10,
              backgroundColor: palette.surfaceElevated,
              justifyContent: "center",
            }}
          >
            <Text style={{ color: palette.primaryText, fontSize: 12.5, fontWeight: "700" }}>
              Back to Camera View
            </Text>
          </Pressable>
        )}
      </ChamferCard>

      <Text
        style={{
          color: palette.mutedForeground,
          fontSize: 11,
          fontWeight: "700",
          letterSpacing: 0.7,
          marginTop: 4,
        }}
      >
        SELECT MEETING ROOM DIRECTLY
      </Text>

      <View
        style={{
          backgroundColor: palette.card,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: palette.border,
          overflow: "hidden",
        }}
      >
        {roomList.map((room, idx) => (
          <Pressable
            key={room.qrCodeSlug}
            accessibilityRole="button"
            accessibilityLabel={`Select ${room.name} on Floor ${room.floor}`}
            onPress={() => {
              void haptics.success();
              navigateWithRoom(room.qrCodeSlug);
            }}
            style={{
              minHeight: 62,
              paddingHorizontal: 14,
              paddingVertical: 12,
              borderBottomWidth: idx < roomList.length - 1 ? 1 : 0,
              borderBottomColor: palette.border,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 11,
                  backgroundColor: palette.primarySoft,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MapPin size={17} color={palette.primaryText} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: palette.foreground,
                    fontSize: 14,
                    fontWeight: "700",
                  }}
                >
                  {room.name}
                </Text>
                <Text style={{ color: palette.mutedForeground, fontSize: 11.5 }}>
                  Floor {room.floor} · {room.qrCodeSlug}
                </Text>
              </View>
            </View>
            <ChevronRight size={17} color={palette.mutedForeground} />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );

  if (!permission || !permission.granted || showManualPicker) {
    const fallbackMessage = !permission
      ? "Checking device camera authorization for room QR scanning."
      : !permission.granted
      ? "Camera permission is currently disabled. Grant access in OS Settings or select your conference room below."
      : "Choose your meeting room tag manually to open Rapid-Drop Triage.";
    return renderManualRoomPicker(fallbackMessage);
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torchOn}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={handleBarcodeScanned}
      />

      {/* Overlay Chrome */}
      <View
        style={{
          flex: 1,
          justifyContent: "space-between",
          paddingTop: Math.max(insets.top, 16) + 8,
          paddingBottom: Math.max(insets.bottom, 18) + 8,
          paddingHorizontal: 18,
          backgroundColor: "rgba(7, 10, 16, 0.36)",
        }}
      >
        {/* Top Bar */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={torchOn ? "Turn flashlight off" : "Turn flashlight on"}
            onPress={() => {
              void haptics.selection();
              setTorchOn((prev) => !prev);
            }}
            style={{
              minHeight: 44,
              minWidth: 44,
              paddingHorizontal: 14,
              borderRadius: 999,
              backgroundColor: torchOn
                ? "rgba(37, 99, 235, 0.88)"
                : "rgba(15, 21, 33, 0.78)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.20)",
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Flashlight size={15} color="#FFFFFF" />
            <Text style={{ color: "#FFFFFF", fontSize: 12.5, fontWeight: "700" }}>
              {torchOn ? "Torch On" : "Torch"}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close QR scanner"
            onPress={() => router.back()}
            style={{
              minWidth: 44,
              minHeight: 44,
              borderRadius: 999,
              backgroundColor: "rgba(15, 21, 33, 0.78)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.20)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={18} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Crisp Corner Brackets Reticule */}
        <View style={{ alignItems: "center", gap: 18 }}>
          <View
            style={{
              width: 244,
              height: 244,
              position: "relative",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {/* 4 Corner Brackets */}
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: 34,
                height: 34,
                borderTopWidth: 3.5,
                borderLeftWidth: 3.5,
                borderTopLeftRadius: 16,
                borderColor: "#60A5FA",
              }}
            />
            <View
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: 34,
                height: 34,
                borderTopWidth: 3.5,
                borderRightWidth: 3.5,
                borderTopRightRadius: 16,
                borderColor: "#60A5FA",
              }}
            />
            <View
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: 34,
                height: 34,
                borderBottomWidth: 3.5,
                borderLeftWidth: 3.5,
                borderBottomLeftRadius: 16,
                borderColor: "#60A5FA",
              }}
            />
            <View
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 34,
                height: 34,
                borderBottomWidth: 3.5,
                borderRightWidth: 3.5,
                borderBottomRightRadius: 16,
                borderColor: "#60A5FA",
              }}
            />
          </View>

          <View
            style={{
              backgroundColor: "rgba(15, 21, 33, 0.75)",
              borderRadius: 999,
              paddingHorizontal: 14,
              paddingVertical: 7,
            }}
          >
            <Text
              style={{
                color: "rgba(248, 250, 252, 0.92)",
                fontSize: 12,
                fontWeight: "600",
                textAlign: "center",
              }}
            >
              Point camera at a meeting room QR plaque
            </Text>
          </View>

          {scanFeedback ? (
            <View
              style={{
                backgroundColor: "rgba(225, 29, 72, 0.92)",
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 12,
                  fontWeight: "700",
                  textAlign: "center",
                }}
              >
                {scanFeedback}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Bottom Manual Fallback Trigger */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Enter room manually instead of scanning QR"
          onPress={() => {
            void haptics.tap();
            setShowManualPicker(true);
          }}
          style={{
            minHeight: 48,
            borderRadius: 999,
            backgroundColor: "rgba(15, 21, 33, 0.85)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.20)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#F8FAFC", fontSize: 13.5, fontWeight: "700" }}>
            Enter Room Manually
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
