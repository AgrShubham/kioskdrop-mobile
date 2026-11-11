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
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera";
import { useRouter } from "expo-router";
import {
  AlertTriangle,
  Flashlight,
  MapPin,
  Settings,
  X,
} from "lucide-react-native";
import { ChamferCard } from "@/components/ui/ChamferCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
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
        <StatusBadge label="CAMERA FALLBACK" variant="amber" />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close room scanner"
          onPress={() => router.back()}
          style={{
            minWidth: 44,
            minHeight: 44,
            borderRadius: 12,
            backgroundColor: palette.muted,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={18} color={palette.foreground} />
        </Pressable>
      </View>

      <ChamferCard tone="amber" style={{ gap: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <AlertTriangle size={20} color={palette.amber} />
          <Text
            style={{
              flex: 1,
              color: palette.foreground,
              fontSize: 16,
              fontWeight: "800",
            }}
          >
            Room Camera Unavailable / Manual Select
          </Text>
        </View>
        <Text
          style={{
            color: palette.mutedForeground,
            fontSize: 13,
            lineHeight: 19,
          }}
        >
          {subtitle}
        </Text>

        {!permission?.granted ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
            {permission?.canAskAgain !== false ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Grant camera permission"
                onPress={() => void requestPermission()}
                style={{
                  minHeight: 46,
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
                minHeight: 46,
                paddingHorizontal: 14,
                borderRadius: 12,
                backgroundColor: palette.muted,
                borderWidth: 1,
                borderColor: palette.border,
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
              backgroundColor: palette.muted,
              justifyContent: "center",
            }}
          >
            <Text style={{ color: palette.primaryText, fontSize: 12, fontWeight: "700" }}>
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
          letterSpacing: 0.8,
          marginTop: 4,
        }}
      >
        SELECT MEETING ROOM DIRECTLY
      </Text>

      <View style={{ gap: 10 }}>
        {roomList.map((room) => (
          <Pressable
            key={room.qrCodeSlug}
            accessibilityRole="button"
            accessibilityLabel={`Select ${room.name} on Floor ${room.floor}`}
            onPress={() => {
              void haptics.success();
              navigateWithRoom(room.qrCodeSlug);
            }}
            style={{
              minHeight: 56,
              padding: 14,
              borderRadius: 14,
              backgroundColor: palette.card,
              borderWidth: 1,
              borderColor: palette.border,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <MapPin size={17} color={palette.primaryText} />
              <View>
                <Text
                  style={{
                    color: palette.foreground,
                    fontSize: 14,
                    fontWeight: "700",
                  }}
                >
                  {room.name}
                </Text>
                <Text style={{ color: palette.mutedForeground, fontSize: 11 }}>
                  Floor {room.floor} · {room.qrCodeSlug}
                </Text>
              </View>
            </View>
            <StatusBadge label="OPEN TRIAGE" variant="sapphire" compact />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );

  if (!permission || !permission.granted || showManualPicker) {
    const fallbackMessage = !permission
      ? "Checking device camera authorization for room QR scanning."
      : !permission.granted
      ? "Camera permission is currently disabled. Grant camera permission in OS Settings or select your conference room manually below."
      : "Choose your meeting room tag manually to route straight into Rapid-Drop Triage.";
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
          backgroundColor: "rgba(11, 15, 23, 0.35)",
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
              paddingHorizontal: 12,
              borderRadius: 12,
              backgroundColor: torchOn
                ? "rgba(59, 130, 246, 0.85)"
                : "rgba(18, 25, 39, 0.85)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.22)",
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Flashlight size={16} color="#FFFFFF" />
            <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "700" }}>
              {torchOn ? "Torch ON" : "Torch"}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close QR scanner"
            onPress={() => router.back()}
            style={{
              minWidth: 44,
              minHeight: 44,
              borderRadius: 12,
              backgroundColor: "rgba(18, 25, 39, 0.85)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.22)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={18} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Sapphire Corner Reticule */}
        <View style={{ alignItems: "center", gap: 16 }}>
          <View
            style={{
              width: 240,
              height: 240,
              borderRadius: 24,
              borderWidth: 2,
              borderColor: "rgba(59, 130, 246, 0.85)",
              backgroundColor: "rgba(59, 130, 246, 0.06)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: "rgba(241, 245, 249, 0.85)",
                fontSize: 12,
                fontWeight: "700",
                textAlign: "center",
                paddingHorizontal: 20,
              }}
            >
              Align Meeting Room QR Tag Inside Frame
            </Text>
          </View>

          {scanFeedback ? (
            <View
              style={{
                backgroundColor: "rgba(220, 38, 38, 0.90)",
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
            borderRadius: 14,
            backgroundColor: "rgba(18, 25, 39, 0.90)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.22)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#F1F5F9", fontSize: 13, fontWeight: "700" }}>
            Enter Room Manually
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
