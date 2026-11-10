import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  AlertTriangle,
  Compass,
  QrCode,
  RefreshCw,
  Zap,
} from "lucide-react-native";
import { PinPassCard } from "@/components/request/PinPassCard";
import { SymptomCard } from "@/components/request/SymptomCard";
import { ChamferCard } from "@/components/ui/ChamferCard";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DIAGNOSTIC_SYMPTOMS, type SymptomOption } from "@/constants/symptoms";
import { QUERY_KEYS } from "@/hooks/useSession";
import { generateIdempotencyKey, kioskApi } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { getPalette } from "@/lib/theme";
import { useAppStore } from "@/store/app-store";
import type { DiagnoseReserveResult } from "@/types/domain";

export default function RapidDropRequestScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useLocalSearchParams<{ room?: string | string[] }>();

  const themeMode = useAppStore((s) => s.themeMode);
  const palette = getPalette(themeMode);

  const [selectedRoomSlug, setSelectedRoomSlug] = useState<string>("");
  const [selectedSymptomCode, setSelectedSymptomCode] =
    useState<SymptomOption["code"]>("SYMPTOM_NO_DISPLAY_BYOD");
  const [portDamaged, setPortDamaged] = useState(false);
  const [reservationResult, setReservationResult] =
    useState<DiagnoseReserveResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const roomsQuery = useQuery({
    queryKey: QUERY_KEYS.rooms,
    queryFn: () => kioskApi.getRooms(),
    staleTime: 60_000,
  });

  const lockersQuery = useQuery({
    queryKey: QUERY_KEYS.lockers,
    queryFn: () => kioskApi.getLockers(),
    staleTime: 15_000,
  });

  const rooms = useMemo(() => roomsQuery.data?.rooms ?? [], [roomsQuery.data]);
  const lockers = useMemo(
    () => lockersQuery.data?.lockers ?? [],
    [lockersQuery.data]
  );
  const lastAppliedRoomParamRef = useRef<string | null>(null);

  // Sync ?room= once per incoming QR/deep-link param change
  useEffect(() => {
    const paramRoomRaw = Array.isArray(searchParams.room)
      ? searchParams.room[0]
      : searchParams.room;

    if (
      paramRoomRaw &&
      rooms.length > 0 &&
      lastAppliedRoomParamRef.current !== paramRoomRaw
    ) {
      const matched = rooms.find(
        (r) =>
          r.qrCodeSlug.toLowerCase() === paramRoomRaw.trim().toLowerCase() ||
          r.name.toLowerCase() === paramRoomRaw.trim().toLowerCase()
      );
      if (matched) {
        lastAppliedRoomParamRef.current = paramRoomRaw;
        setSelectedRoomSlug(matched.qrCodeSlug);
        return;
      }
    }

    if (!selectedRoomSlug && rooms.length > 0) {
      setSelectedRoomSlug(rooms[0].qrCodeSlug);
    }
  }, [searchParams.room, rooms, selectedRoomSlug]);

  const selectedRoom = useMemo(
    () =>
      rooms.find((r) => r.qrCodeSlug === selectedRoomSlug) ?? rooms[0] ?? null,
    [rooms, selectedRoomSlug]
  );

  const selectedSymptom = useMemo(
    () =>
      DIAGNOSTIC_SYMPTOMS.find((s) => s.code === selectedSymptomCode) ??
      DIAGNOSTIC_SYMPTOMS[0],
    [selectedSymptomCode]
  );

  // Determine nearest hub proximity hint (Floor 3 -> Floor 4 Hub)
  const nearestHubHint = useMemo(() => {
    if (!selectedRoom) return null;
    if (lockers.length === 0) {
      return selectedRoom.floor === 3
        ? "Nearest Hub Routing: Floor 3 -> Floor 4 Boardroom Hub"
        : null;
    }

    const sameFloorLocker = lockers.find((l) => l.floor === selectedRoom.floor);
    if (sameFloorLocker) return null;

    const nearest = [...lockers].sort(
      (a, b) =>
        Math.abs(a.floor - selectedRoom.floor) -
        Math.abs(b.floor - selectedRoom.floor)
    )[0];

    if (!nearest) return null;
    return `Nearest Hub Routing: Floor ${selectedRoom.floor} -> Floor ${nearest.floor} ${nearest.name}`;
  }, [selectedRoom, lockers]);

  const previewSkuName = useMemo(() => {
    if (selectedSymptom.code === "SYMPTOM_NO_DISPLAY_BYOD" && portDamaged) {
      return (
        selectedSymptom.portDamagedOverrideSkuName ??
        "Barco CS-400W 4K Wireless HDMI Kit"
      );
    }
    if (
      selectedSymptom.code === "SYMPTOM_VIDEO_WALL_BLACKOUT" &&
      selectedRoom?.displayType !== "4K_LED_WALL"
    ) {
      return (
        selectedSymptom.fallbackSkuName ?? selectedSymptom.defaultSkuName
      );
    }
    return selectedSymptom.defaultSkuName;
  }, [selectedSymptom, portDamaged, selectedRoom]);

  const reserveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRoom) {
        throw new Error("Select a meeting room before reserving hardware.");
      }
      setSubmitError(null);
      const idempotencyKey = generateIdempotencyKey();
      return kioskApi.diagnoseAndReserve(
        {
          meetingRoomId: selectedRoom.id,
          qrCodeSlug: selectedRoom.qrCodeSlug,
          symptomCode: selectedSymptomCode,
          portDamaged:
            selectedSymptomCode === "SYMPTOM_NO_DISPLAY_BYOD"
              ? portDamaged
              : false,
        },
        idempotencyKey
      );
    },
    onSuccess: async (data) => {
      await haptics.success();
      setReservationResult({
        ticketId: data.ticketId,
        itsmTicketNumber: data.itsmTicketNumber,
        locker: data.locker,
        allocatedAsset: data.allocatedAsset,
        accessPin: data.accessPin,
        expiresAt: data.expiresAt,
      });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lockers });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.analytics });
    },
    onError: async (err) => {
      await haptics.error();
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Unable to complete diagnostic reservation."
      );
    },
  });

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 14 }}
    >
      <ScreenHeader
        badge="RAPID-DROP PORTAL"
        badgeVariant="sapphire"
        title="AV Diagnostic Triage"
        subtitle="Scan a meeting room plaque or select a conference suite to dispatch certified Zero-Trust AV spares."
        rightSlot={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Scan Meeting Room QR Code"
            onPress={() => {
              void haptics.tap();
              router.push("/scanner");
            }}
            style={{
              minHeight: 44,
              paddingHorizontal: 12,
              borderRadius: 12,
              backgroundColor: palette.primary,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            <QrCode size={16} color="#FFFFFF" />
            <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "800" }}>
              Scan Room QR
            </Text>
          </Pressable>
        }
      />

      {/* Step 1: Conference Room Context */}
      <ChamferCard style={{ gap: 10 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text
            style={{
              color: palette.foreground,
              fontSize: 14,
              fontWeight: "800",
            }}
          >
            1. Conference Room Context
          </Text>
          {roomsQuery.isError ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retry loading meeting rooms"
              onPress={() => void roomsQuery.refetch()}
              style={{
                minHeight: 44,
                paddingHorizontal: 10,
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
              }}
            >
              <RefreshCw size={13} color={palette.destructive} />
              <Text
                style={{
                  color: palette.destructive,
                  fontSize: 12,
                  fontWeight: "700",
                }}
              >
                Retry
              </Text>
            </Pressable>
          ) : null}
        </View>

        {roomsQuery.isLoading ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <ActivityIndicator size="small" color={palette.primaryText} />
            <Text style={{ color: palette.mutedForeground, fontSize: 12 }}>
              Loading enterprise conference suites...
            </Text>
          </View>
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {rooms.map((room) => {
              const active = selectedRoom?.qrCodeSlug === room.qrCodeSlug;
              return (
                <Pressable
                  key={room.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Select meeting room ${room.name}`}
                  accessibilityState={{ selected: active }}
                  onPress={() => {
                    void haptics.selection();
                    setSelectedRoomSlug(room.qrCodeSlug);
                    setSubmitError(null);
                  }}
                  style={{
                    minHeight: 44,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: active ? palette.primary : palette.border,
                    backgroundColor: active
                      ? themeMode === "dark"
                        ? "rgba(59, 130, 246, 0.16)"
                        : "rgba(37, 99, 235, 0.10)"
                      : palette.muted,
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      color: active ? palette.primaryText : palette.foreground,
                      fontSize: 12,
                      fontWeight: "700",
                    }}
                  >
                    {room.qrCodeSlug}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {selectedRoom ? (
          <View
            style={{
              backgroundColor: palette.muted,
              borderRadius: 12,
              padding: 10,
              borderWidth: 1,
              borderColor: palette.border,
              gap: 4,
            }}
          >
            <Text
              style={{
                color: palette.foreground,
                fontSize: 13,
                fontWeight: "800",
              }}
            >
              {selectedRoom.name}
            </Text>
            <Text style={{ color: palette.mutedForeground, fontSize: 11 }}>
              Floor {selectedRoom.floor} · {selectedRoom.displayType} ·{" "}
              {selectedRoom.roomSystem} · {selectedRoom.qrCodeSlug}
            </Text>
          </View>
        ) : null}

        {nearestHubHint ? (
          <View
            style={{
              backgroundColor:
                themeMode === "dark"
                  ? "rgba(59, 130, 246, 0.14)"
                  : "rgba(37, 99, 235, 0.08)",
              borderColor: palette.primary,
              borderWidth: 1,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 9,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Compass size={15} color={palette.primaryText} />
            <Text
              style={{
                color: palette.primaryText,
                fontSize: 12,
                fontWeight: "700",
                flex: 1,
              }}
            >
              {nearestHubHint}
            </Text>
          </View>
        ) : null}
      </ChamferCard>

      {/* Step 2: 5 AV Failure Symptom Cards */}
      <View style={{ gap: 10 }}>
        <Text
          style={{
            color: palette.foreground,
            fontSize: 14,
            fontWeight: "800",
          }}
        >
          2. Report Meeting Room Symptom
        </Text>

        {DIAGNOSTIC_SYMPTOMS.map((symptom) => {
          const preview =
            symptom.code === "SYMPTOM_NO_DISPLAY_BYOD" && portDamaged
              ? symptom.portDamagedOverrideSkuName ?? symptom.defaultSkuName
              : symptom.code === "SYMPTOM_VIDEO_WALL_BLACKOUT" &&
                selectedRoom?.displayType !== "4K_LED_WALL"
              ? symptom.fallbackSkuName ?? symptom.defaultSkuName
              : symptom.defaultSkuName;

          return (
            <SymptomCard
              key={symptom.code}
              symptom={symptom}
              selected={selectedSymptomCode === symptom.code}
              previewSkuName={preview}
              onSelect={() => {
                void haptics.selection();
                setSelectedSymptomCode(symptom.code);
                if (symptom.code !== "SYMPTOM_NO_DISPLAY_BYOD") {
                  setPortDamaged(false);
                }
                setSubmitError(null);
              }}
            />
          );
        })}

        {selectedSymptomCode === "SYMPTOM_NO_DISPLAY_BYOD" ? (
          <ChamferCard tone="amber" style={{ gap: 8 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <Text
                  style={{
                    color: palette.foreground,
                    fontSize: 13,
                    fontWeight: "700",
                  }}
                >
                  Laptop USB-C port physically loose/damaged
                </Text>
                <Text style={{ color: palette.mutedForeground, fontSize: 11 }}>
                  Bypass physical port with 4K Wireless HDMI Kit
                </Text>
              </View>
              <Switch
                testID="port-damaged-switch"
                accessibilityLabel="Laptop USB-C port physically loose or damaged"
                value={portDamaged}
                onValueChange={(val) => {
                  void haptics.selection();
                  setPortDamaged(val);
                }}
                trackColor={{ false: palette.border, true: palette.amber }}
                thumbColor="#FFFFFF"
              />
            </View>
          </ChamferCard>
        ) : null}
      </View>

      {/* Live Diagnostic Preview */}
      <ChamferCard tone="sky" style={{ gap: 8 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 6,
          }}
        >
          <StatusBadge label="DIAGNOSTIC PREVIEW" variant="sky" compact />
          <Text style={{ color: palette.mutedForeground, fontSize: 11, fontWeight: "700" }}>
            ServiceNow INC auto-ticket + 10m TTL
          </Text>
        </View>
        <Text
          style={{
            color: palette.foreground,
            fontSize: 14,
            fontWeight: "800",
          }}
        >
          {previewSkuName}
        </Text>
      </ChamferCard>

      {submitError ? (
        <View
          style={{
            backgroundColor: palette.destructiveSoft,
            borderColor: palette.destructive,
            borderWidth: 1,
            borderRadius: 12,
            padding: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <AlertTriangle size={16} color={palette.destructive} />
          <Text
            style={{
              color: palette.destructive,
              fontSize: 12,
              fontWeight: "700",
              flex: 1,
            }}
          >
            {submitError}
          </Text>
        </View>
      ) : null}

      {/* Reserve CTA */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Diagnose and Reserve Hardware"
        accessibilityState={{
          disabled: reserveMutation.isPending || !selectedRoom,
        }}
        disabled={reserveMutation.isPending || !selectedRoom}
        onPress={() => reserveMutation.mutate()}
        style={{
          minHeight: 52,
          borderRadius: 14,
          backgroundColor: palette.primary,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          opacity: reserveMutation.isPending || !selectedRoom ? 0.65 : 1,
        }}
      >
        {reserveMutation.isPending ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Zap size={18} color="#FFFFFF" />
        )}
        <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "800" }}>
          {reserveMutation.isPending
            ? "Reserving Smart Bay..."
            : "Diagnose & Reserve Hardware"}
        </Text>
      </Pressable>

      {/* Active Digital Pickup Pass */}
      {reservationResult ? (
        <PinPassCard
          reservation={reservationResult}
          onOpenKiosk={(params) => {
            router.push({
              pathname: "/(tabs)/kiosk",
              params,
            });
          }}
          onReserveAgain={() => {
            setReservationResult(null);
            reserveMutation.mutate();
          }}
        />
      ) : null}
    </ScrollView>
  );
}
