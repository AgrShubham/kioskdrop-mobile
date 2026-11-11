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
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  ChevronRight,
  Cpu,
  Lock,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Smartphone,
} from "lucide-react-native";
import { ChamferCard } from "@/components/ui/ChamferCard";
import { QUERY_KEYS, useSession } from "@/hooks/useSession";
import { kioskApi } from "@/lib/api";
import { formatLockerHubLabel, formatRoleLabel } from "@/lib/format";
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

  const fullName = session?.name ?? "Aarav Sharma";
  const roleLabel = formatRoleLabel(session?.role ?? "EMPLOYEE");
  const [pressedQuickRow, setPressedQuickRow] = React.useState<
    "kiosk" | "admin" | null
  >(null);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 14 }}
      refreshControl={
        <RefreshControl
          refreshing={lockersQuery.isRefetching}
          onRefresh={() => void lockersQuery.refetch()}
          tintColor={palette.primaryText}
        />
      }
    >
      {/* Compact Persona Greeting Row */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text
            style={{
              color: palette.primaryText,
              fontSize: 10,
              fontWeight: "800",
              letterSpacing: 1.1,
              textTransform: "uppercase",
            }}
          >
            {roleLabel} · {session?.rfidBadgeId ?? "RFID-EMP-8821"}
          </Text>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{
              color: palette.foreground,
              fontSize: 23,
              fontWeight: "800",
              letterSpacing: -0.6,
            }}
          >
            Hello, {fullName.split(" ")[0]}
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
            justifyContent: "center",
          }}
        >
          <View
            style={{
              height: 36,
              paddingHorizontal: 12,
              borderRadius: 999,
              backgroundColor: palette.card,
              borderWidth: 1,
              borderColor: palette.border,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                color: palette.foreground,
                fontSize: 12,
                fontWeight: "700",
              }}
            >
              Switch Role
            </Text>
          </View>
        </Pressable>
      </View>

      {/* Hero Dispatch Action Card */}
      <LinearGradient
        colors={palette.heroGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 20,
          padding: 18,
          gap: 14,
          shadowColor: "#1D4ED8",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: themeMode === "dark" ? 0.35 : 0.22,
          shadowRadius: 16,
          elevation: 5,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 13,
              backgroundColor: "rgba(255, 255, 255, 0.18)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Smartphone size={21} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 18,
                fontWeight: "800",
                letterSpacing: -0.3,
              }}
            >
              Rapid-Drop AV Dispatch
            </Text>
            <Text
              style={{
                color: "rgba(255, 255, 255, 0.84)",
                fontSize: 12,
                lineHeight: 17,
                marginTop: 2,
              }}
            >
              Scan a conference room tag or diagnose issues for an instant pickup PIN.
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open camera scanner to scan meeting room QR tag"
            onPress={() => {
              void haptics.tap();
              router.push("/scanner");
            }}
            style={{
              minHeight: 46,
              flex: 1.15,
              borderRadius: 13,
              backgroundColor: "#FFFFFF",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              paddingHorizontal: 14,
            }}
          >
            <QrCode size={16} color="#0F172A" />
            <Text style={{ color: "#0F172A", fontSize: 13, fontWeight: "800" }}>
              Scan Room QR
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
              borderRadius: 13,
              backgroundColor: "rgba(255, 255, 255, 0.16)",
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.25)",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              paddingHorizontal: 12,
            }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700" }}>
              Select Room
            </Text>
            <ArrowRight size={15} color="#FFFFFF" />
          </Pressable>
        </View>
      </LinearGradient>

      {/* Fleet Telemetry Bento Card */}
      <ChamferCard style={{ gap: 12 }}>
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
              letterSpacing: -0.2,
            }}
          >
            Locker Fleet Snapshot
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View
              style={{
                width: 7,
                height: 7,
                borderRadius: 999,
                backgroundColor: sseConnected ? palette.emerald : palette.amber,
              }}
            />
            <Text
              style={{
                color: palette.mutedForeground,
                fontSize: 11,
                fontWeight: "600",
              }}
            >
              {sseConnected ? "Live Sync" : "Polling"}
            </Text>
          </View>
        </View>

        {lockersQuery.isLoading ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              paddingVertical: 10,
            }}
          >
            <ActivityIndicator size="small" color={palette.primaryText} />
            <Text style={{ color: palette.mutedForeground, fontSize: 12 }}>
              Syncing live hub telemetry...
            </Text>
          </View>
        ) : lockersQuery.isError ? (
          <View
            style={{
              backgroundColor: palette.destructiveSoft,
              borderRadius: 14,
              padding: 12,
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
              Unable to reach hub telemetry. Check server URL.
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
          <>
            {/* 4-Column Metric Grid */}
            <View
              style={{
                flexDirection: "row",
                backgroundColor: palette.surfaceElevated,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: palette.border,
                paddingVertical: 12,
              }}
            >
              <StatColumn
                label="Total"
                value={totalBays}
                color={palette.foreground}
                palette={palette}
              />
              <StatDivider palette={palette} />
              <StatColumn
                label="Ready"
                value={availableBays}
                color={palette.emerald}
                dotColor={palette.emerald}
                palette={palette}
              />
              <StatDivider palette={palette} />
              <StatColumn
                label="Reserved"
                value={reservedBays}
                color={palette.amber}
                dotColor={palette.amber}
                palette={palette}
              />
              <StatDivider palette={palette} />
              <StatColumn
                label="In Use"
                value={checkedOutBays}
                color={palette.primaryText}
                dotColor={palette.primaryText}
                palette={palette}
              />
            </View>

            {quarantinedBays > 0 ? (
              <View
                style={{
                  backgroundColor: palette.destructiveSoft,
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <AlertTriangle size={14} color={palette.destructive} />
                <Text
                  style={{
                    color: palette.destructive,
                    fontSize: 12,
                    fontWeight: "700",
                  }}
                >
                  {quarantinedBays} Bay{quarantinedBays > 1 ? "s" : ""} Quarantined — Inspection Required
                </Text>
              </View>
            ) : null}

            {/* Hub Online Footer List */}
            {lockers.length > 0 ? (
              <View style={{ gap: 6 }}>
                {lockers.map((locker) => {
                  const resCount = locker.compartments.filter(
                    (c) => c.status === "RESERVED_FOR_PICKUP"
                  ).length;
                  return (
                    <View
                      key={locker.id}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingVertical: 2,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                          flex: 1,
                        }}
                      >
                        <View
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: 999,
                            backgroundColor: locker.onlineStatus
                              ? palette.emerald
                              : palette.destructive,
                          }}
                        />
                        <Text
                          numberOfLines={1}
                          style={{
                            color: palette.foreground,
                            fontSize: 12,
                            fontWeight: "600",
                            flex: 1,
                          }}
                        >
                          {formatLockerHubLabel(locker.floor, locker.name)}
                        </Text>
                      </View>
                      <Text
                        style={{
                          color: resCount > 0 ? palette.amber : palette.mutedForeground,
                          fontSize: 11,
                          fontWeight: "700",
                        }}
                      >
                        {locker.onlineStatus ? "Online" : "Offline"}
                        {resCount > 0 ? ` · ${resCount} Reserved` : ""}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : null}
          </>
        )}
      </ChamferCard>

      {/* Quick Actions Navigation List */}
      <View
        style={{
          flexDirection: isTablet ? "row" : "column",
          gap: 12,
        }}
      >
        <ChamferCard
          padded={false}
          style={{
            overflow: "hidden",
            ...(isTablet ? { flex: 1 } : {}),
          }}
        >
          {/* Smart Locker Kiosk Row */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open Smart Locker Kiosk Terminal"
            onPressIn={() => setPressedQuickRow("kiosk")}
            onPressOut={() => setPressedQuickRow(null)}
            onPress={() => {
              void haptics.tap();
              router.push("/(tabs)/kiosk");
            }}
            style={{
              minHeight: 72,
              paddingHorizontal: 16,
              paddingVertical: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              backgroundColor:
                pressedQuickRow === "kiosk" ? palette.muted : "transparent",
            }}
          >
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 13,
                backgroundColor: palette.emeraldSoft,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Cpu size={20} color={palette.emerald} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text
                style={{
                  color: palette.foreground,
                  fontSize: 15,
                  fontWeight: "800",
                }}
              >
                IoT Locker Terminal
              </Text>
              <Text
                numberOfLines={1}
                style={{ color: palette.mutedForeground, fontSize: 12 }}
              >
                PIN, RFID & Biometric unlock · Return sensors
              </Text>
            </View>
            <ChevronRight size={18} color={palette.mutedForeground} />
          </Pressable>

          <View
            style={{
              height: 1,
              backgroundColor: palette.border,
              marginLeft: 70,
            }}
          />

          {/* ITAM & FinOps Command Row */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open ITAM and FinOps Command Center"
            onPressIn={() => setPressedQuickRow("admin")}
            onPressOut={() => setPressedQuickRow(null)}
            onPress={() => {
              void haptics.tap();
              router.push("/(tabs)/admin");
            }}
            style={{
              minHeight: 72,
              paddingHorizontal: 16,
              paddingVertical: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              backgroundColor:
                pressedQuickRow === "admin" ? palette.muted : "transparent",
            }}
          >
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 13,
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
            <View style={{ flex: 1, gap: 2 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text
                  style={{
                    color: palette.foreground,
                    fontSize: 15,
                    fontWeight: "800",
                  }}
                >
                  Command Center
                </Text>
                {!isPrivilegedRole ? (
                  <Lock size={12} color={palette.amber} />
                ) : (
                  <ShieldCheck size={13} color={palette.emerald} />
                )}
              </View>
              <Text
                numberOfLines={1}
                style={{ color: palette.mutedForeground, fontSize: 12 }}
              >
                {isPrivilegedRole
                  ? "USB Zero-Trust, Customs Duty, POs & Webhooks"
                  : "Duty estimator open · Switch role for admin tools"}
              </Text>
            </View>
            <ChevronRight size={18} color={palette.mutedForeground} />
          </Pressable>
        </ChamferCard>
      </View>
    </ScrollView>
  );
}

function StatColumn({
  label,
  value,
  color,
  dotColor,
  palette,
}: {
  label: string;
  value: number;
  color: string;
  dotColor?: string;
  palette: ReturnType<typeof getPalette>;
}) {
  return (
    <View style={{ flex: 1, alignItems: "center", gap: 3 }}>
      <Text
        style={{
          color,
          fontSize: 20,
          fontWeight: "800",
          fontVariant: ["tabular-nums"],
        }}
      >
        {value}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        {dotColor ? (
          <View
            style={{
              width: 5,
              height: 5,
              borderRadius: 999,
              backgroundColor: dotColor,
            }}
          />
        ) : null}
        <Text
          style={{
            color: palette.mutedForeground,
            fontSize: 11,
            fontWeight: "600",
          }}
        >
          {label}
        </Text>
      </View>
    </View>
  );
}

function StatDivider({ palette }: { palette: ReturnType<typeof getPalette> }) {
  return (
    <View
      style={{
        width: 1,
        backgroundColor: palette.border,
        marginVertical: 4,
      }}
    />
  );
}
