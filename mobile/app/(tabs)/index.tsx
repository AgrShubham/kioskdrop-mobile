import React from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
  ArrowRight,
  BarChart3,
  Cpu,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  UserCheck,
} from "lucide-react-native";
import { ChamferCard } from "@/components/ui/ChamferCard";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { QUERY_KEYS, useSession } from "@/hooks/useSession";
import { kioskApi } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { getPalette } from "@/lib/theme";
import { useAppStore } from "@/store/app-store";

export default function HomeGatewayScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const themeMode = useAppStore((s) => s.themeMode);
  const sseConnected = useAppStore((s) => s.sseConnected);
  const setPersonaSheetOpen = useAppStore((s) => s.setPersonaSheetOpen);
  const palette = getPalette(themeMode);

  const { session } = useSession();

  const lockersQuery = useQuery({
    queryKey: QUERY_KEYS.lockers,
    queryFn: () => kioskApi.getLockers(),
    staleTime: 10_000,
  });

  const lockers = lockersQuery.data?.lockers ?? [];
  const allCompartments = lockers.flatMap((l) => l.compartments);
  const totalBays = allCompartments.length;
  const availableBays = allCompartments.filter(
    (c) => c.status === "STOCKED_AVAILABLE"
  ).length;
  const reservedBays = allCompartments.filter(
    (c) =>
      c.status === "RESERVED_FOR_PICKUP" ||
      c.status === "DOOR_OPEN_AWAITING_REMOVAL"
  ).length;
  const checkedOutBays = allCompartments.filter(
    (c) => c.status === "CHECKED_OUT"
  ).length;
  const quarantinedBays = allCompartments.filter(
    (c) => c.status === "MAINTENANCE_QUARANTINE"
  ).length;

  const isPrivilegedRole =
    session?.role === "IT_ADMIN" || session?.role === "FINOPS_AUDITOR";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 36, gap: 14 }}
      refreshControl={
        <RefreshControl
          refreshing={lockersQuery.isRefetching}
          onRefresh={() => void lockersQuery.refetch()}
          tintColor={palette.primaryText}
        />
      }
    >
      <ScreenHeader
        badge="ZERO-TRUST AV MICRO-LOGISTICS"
        badgeVariant="sapphire"
        title="KioskDrop Enterprise Command"
        subtitle="Rapid meeting-room hardware triage, solenoid locker unlock, and B2B duty telemetry synchronized over Bearer auth & live SSE."
      />

      {/* Active Persona Status Banner */}
      <ChamferCard tone="default" style={{ gap: 10 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
            <UserCheck size={16} color={palette.primaryText} />
            <Text
              style={{
                color: palette.foreground,
                fontSize: 13,
                fontWeight: "700",
                flexShrink: 1,
              }}
            >
              Signed in as {session?.name ?? "Aarav Sharma"} ·{" "}
              {session?.role ?? "EMPLOYEE"}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Change active persona or backend server"
            onPress={() => {
              void haptics.tap();
              setPersonaSheetOpen(true);
            }}
            style={{
              minHeight: 44,
              paddingHorizontal: 12,
              borderRadius: 10,
              backgroundColor: palette.muted,
              borderWidth: 1,
              borderColor: palette.border,
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                color: palette.primaryText,
                fontSize: 12,
                fontWeight: "700",
              }}
            >
              Switch Role / API
            </Text>
          </Pressable>
        </View>

        {/* Live Telemetry Rollup */}
        {lockersQuery.isLoading ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 }}>
            <ActivityIndicator size="small" color={palette.primaryText} />
            <Text style={{ color: palette.mutedForeground, fontSize: 12 }}>
              Syncing live hub telemetry across 24 bays...
            </Text>
          </View>
        ) : lockersQuery.isError ? (
          <View
            style={{
              backgroundColor: palette.destructiveSoft,
              borderColor: palette.destructive,
              borderWidth: 1,
              borderRadius: 12,
              padding: 10,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <Text
              style={{
                color: palette.destructive,
                fontSize: 12,
                fontWeight: "600",
                flex: 1,
              }}
            >
              Unable to reach hub telemetry. Check server IP or network.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retry fetching locker telemetry"
              onPress={() => void lockersQuery.refetch()}
              style={{
                minHeight: 44,
                paddingHorizontal: 12,
                borderRadius: 10,
                backgroundColor: palette.card,
                borderWidth: 1,
                borderColor: palette.destructive,
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
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
          </View>
        ) : (
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 6,
            }}
          >
            <StatusBadge label={`${totalBays} TOTAL BAYS`} variant="slate" compact />
            <StatusBadge
              label={`${availableBays} AVAILABLE`}
              variant="emerald"
              dotColor={palette.emerald}
              compact
            />
            <StatusBadge
              label={`${reservedBays} RESERVED`}
              variant="amber"
              dotColor={palette.amber}
              compact
            />
            <StatusBadge
              label={`${checkedOutBays} CHECKED OUT`}
              variant="sapphire"
              compact
            />
            {quarantinedBays > 0 ? (
              <StatusBadge
                label={`${quarantinedBays} QUARANTINED`}
                variant="crimson"
                dotColor={palette.destructive}
                compact
              />
            ) : null}
          </View>
        )}
      </ChamferCard>

      {/* Quick Navigation Cards */}
      <View
        style={{
          flexDirection: isTablet ? "row" : "column",
          flexWrap: isTablet ? "wrap" : "nowrap",
          gap: 12,
        }}
      >
        {/* Card 1: Rapid-Drop Room QR & Triage */}
        <ChamferCard
          tone="sapphire"
          style={{
            gap: 12,
            ...(isTablet ? { flexBasis: "48%", flexGrow: 1 } : {}),
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 11,
                  backgroundColor:
                    themeMode === "dark"
                      ? "rgba(59, 130, 246, 0.16)"
                      : "rgba(37, 99, 235, 0.10)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Smartphone size={20} color={palette.primaryText} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: palette.foreground,
                    fontSize: 16,
                    fontWeight: "800",
                  }}
                >
                  Rapid-Drop Room QR & Triage
                </Text>
                <Text style={{ color: palette.mutedForeground, fontSize: 12 }}>
                  Under-90s AV symptom diagnosis & OTP dispatch
                </Text>
              </View>
            </View>
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open camera scanner to scan meeting room QR tag"
              onPress={() => {
                void haptics.tap();
                router.push("/scanner");
              }}
              style={{
                minHeight: 46,
                flex: 1,
                minWidth: 130,
                borderRadius: 12,
                backgroundColor: palette.primary,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                paddingHorizontal: 14,
              }}
            >
              <QrCode size={16} color="#FFFFFF" />
              <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700" }}>
                Scan QR
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Select meeting room and triage manually"
              onPress={() => {
                void haptics.tap();
                router.push("/(tabs)/request");
              }}
              style={{
                minHeight: 46,
                flex: 1,
                minWidth: 130,
                borderRadius: 12,
                backgroundColor: palette.muted,
                borderWidth: 1,
                borderColor: palette.border,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                paddingHorizontal: 14,
              }}
            >
              <Text
                style={{
                  color: palette.foreground,
                  fontSize: 13,
                  fontWeight: "700",
                }}
              >
                Select Room
              </Text>
              <ArrowRight size={15} color={palette.foreground} />
            </Pressable>
          </View>
        </ChamferCard>

        {/* Card 2: IoT Floor Locker Kiosk */}
        <ChamferCard
          tone="emerald"
          style={{
            gap: 12,
            ...(isTablet ? { flexBasis: "48%", flexGrow: 1 } : {}),
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                backgroundColor: palette.emeraldSoft,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Cpu size={20} color={palette.emerald} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: palette.foreground,
                  fontSize: 16,
                  fontWeight: "800",
                }}
              >
                IoT Floor Locker Kiosk
              </Text>
              <Text style={{ color: palette.mutedForeground, fontSize: 12 }}>
                PIN, RFID & Biometric unlock · IR removal · Return sensors
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {lockers.length > 0 ? (
              lockers.map((locker) => {
                const reservedCount = locker.compartments.filter(
                  (c) => c.status === "RESERVED_FOR_PICKUP"
                ).length;
                return (
                  <StatusBadge
                    key={locker.id}
                    label={`FL ${locker.floor} ${locker.onlineStatus ? "ONLINE" : "OFFLINE"} · ${reservedCount} RES`}
                    variant={locker.onlineStatus ? "emerald" : "crimson"}
                    dotColor={
                      locker.onlineStatus ? palette.emerald : palette.destructive
                    }
                    compact
                  />
                );
              })
            ) : (
              <StatusBadge
                label={sseConnected ? "SSE TELEMETRY ARMED" : "HUB TELEMETRY"}
                variant={sseConnected ? "emerald" : "amber"}
                compact
              />
            )}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open Smart Locker Kiosk Terminal"
            onPress={() => {
              void haptics.tap();
              router.push("/(tabs)/kiosk");
            }}
            style={{
              minHeight: 46,
              borderRadius: 12,
              backgroundColor: palette.emeraldSoft,
              borderWidth: 1,
              borderColor: palette.emerald,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Text
              style={{ color: palette.emerald, fontSize: 13, fontWeight: "800" }}
            >
              Launch Locker Kiosk
            </Text>
            <ArrowRight size={15} color={palette.emerald} />
          </Pressable>
        </ChamferCard>

        {/* Card 3: ITAM & FinOps Command Center */}
        <ChamferCard
          tone={isPrivilegedRole ? "sky" : "amber"}
          style={{
            gap: 12,
            ...(isTablet ? { flexBasis: "100%", flexGrow: 1 } : {}),
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                backgroundColor: isPrivilegedRole
                  ? palette.skySoft
                  : palette.amberSoft,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BarChart3
                size={20}
                color={isPrivilegedRole ? palette.sky : palette.amber}
              />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={{
                  color: palette.foreground,
                  fontSize: 16,
                  fontWeight: "800",
                }}
              >
                ITAM & FinOps Command Center
              </Text>
              <Text style={{ color: palette.mutedForeground, fontSize: 12 }}>
                USB HID Zero-Trust, Customs Duty Calculator, PO Intake & Analytics
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            <StatusBadge
              label={
                isPrivilegedRole
                  ? `UNLOCKED (${session?.role})`
                  : "VIEW RESTRICTED (SWITCH PERSONA)"
              }
              variant={isPrivilegedRole ? "emerald" : "amber"}
              compact
            />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open ITAM and FinOps Command Center"
            onPress={() => {
              void haptics.tap();
              router.push("/(tabs)/admin");
            }}
            style={{
              minHeight: 46,
              borderRadius: 12,
              backgroundColor: palette.muted,
              borderWidth: 1,
              borderColor: palette.border,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <ShieldCheck size={16} color={palette.foreground} />
            <Text
              style={{
                color: palette.foreground,
                fontSize: 13,
                fontWeight: "700",
              }}
            >
              Open Command Center
            </Text>
            <ArrowRight size={15} color={palette.foreground} />
          </Pressable>
        </ChamferCard>
      </View>
    </ScrollView>
  );
}
