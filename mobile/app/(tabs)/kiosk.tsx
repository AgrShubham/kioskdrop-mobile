import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as LocalAuthentication from "expo-local-authentication";
import { useLocalSearchParams } from "expo-router";
import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Fingerprint,
  Nfc,
  RefreshCw,
  Thermometer,
} from "lucide-react-native";
import { LockerBayCard } from "@/components/kiosk/LockerBayCard";
import { NumericKeypad } from "@/components/kiosk/NumericKeypad";
import {
  ReturnInspectionModal,
  type ReturnInspectionPayload,
} from "@/components/kiosk/ReturnInspectionModal";
import { ChamferCard } from "@/components/ui/ChamferCard";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { BADUSB_SIMULATION_VECTOR } from "@/constants/presets";
import { QUERY_KEYS, useSession } from "@/hooks/useSession";
import { ApiClientError, kioskApi } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { formatLockerHubLabel } from "@/lib/format";
import { sanitizePin } from "@/lib/qr-parser";
import { getPalette } from "@/lib/theme";
import { useAppStore } from "@/store/app-store";
import type { LockerCompartment } from "@/types/domain";

function formatKioskAuthError(err: unknown): string {
  if (err instanceof ApiClientError) {
    if (err.status === 423 || err.code === "LOCKER_LOCKED_OUT") {
      return err.message;
    }
    if (err.message.includes("undefined attempt")) {
      return "Invalid credentials. Security lockout activated for 15 minutes (5 failed attempts).";
    }
    return err.message;
  }
  return err instanceof Error
    ? err.message
    : "Smart locker unlock failed. Verify credentials and hub status.";
}

export default function SmartLockerKioskScreen() {
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{
    locker?: string | string[];
    bay?: string | string[];
    pin?: string | string[];
  }>();

  const columns = width >= 900 ? 4 : width >= 600 ? 3 : 2;
  const isTabletSplit = width >= 768;

  const themeMode = useAppStore((s) => s.themeMode);
  const palette = getPalette(themeMode);
  const { session } = useSession();

  const [selectedLockerId, setSelectedLockerId] = useState<string>("");
  const [highlightedBay, setHighlightedBay] = useState<number | null>(null);
  const [pin, setPin] = useState<string>("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [returnModalCompartment, setReturnModalCompartment] =
    useState<LockerCompartment | null>(null);
  const [returnError, setReturnError] = useState<string | null>(null);

  const lockersQuery = useQuery({
    queryKey: QUERY_KEYS.lockers,
    queryFn: () => kioskApi.getLockers(),
    staleTime: 8_000,
  });

  const lockers = useMemo(
    () => lockersQuery.data?.lockers ?? [],
    [lockersQuery.data]
  );
  const lastSyncedParamKeyRef = useRef<string>("");

  // Sync ?locker=, ?bay=, ?pin= once per incoming deep-link signature
  useEffect(() => {
    const paramLocker = Array.isArray(params.locker)
      ? params.locker[0]
      : params.locker;
    const paramBay = Array.isArray(params.bay) ? params.bay[0] : params.bay;
    const cleanedPin = sanitizePin(params.pin);

    if (!selectedLockerId && lockers.length > 0 && !paramLocker) {
      setSelectedLockerId(lockers[0].id);
    }

    const signature = `${paramLocker ?? ""}|${paramBay ?? ""}|${cleanedPin}`;
    if (!signature || signature === "||" || lastSyncedParamKeyRef.current === signature) {
      return;
    }

    if (paramLocker && lockers.some((l) => l.id === paramLocker)) {
      setSelectedLockerId(paramLocker);
    } else if (!selectedLockerId && lockers.length > 0) {
      setSelectedLockerId(lockers[0].id);
    }

    if (paramBay) {
      const bayNum = Number(paramBay);
      if (Number.isInteger(bayNum) && bayNum > 0) {
        setHighlightedBay(bayNum);
      }
    }

    if (cleanedPin) {
      setPin(cleanedPin);
      setAuthError(null);
    }

    if (lockers.length > 0 || !paramLocker) {
      lastSyncedParamKeyRef.current = signature;
    }
  }, [params.locker, params.bay, params.pin, lockers, selectedLockerId]);

  const activeLocker = useMemo(
    () => lockers.find((l) => l.id === selectedLockerId) ?? lockers[0] ?? null,
    [lockers, selectedLockerId]
  );

  // f894343 Guard: keep unlock controls disabled while lockers are loading or unreachable
  const isControllerUnavailable =
    lockersQuery.isLoading || lockersQuery.isError || !activeLocker;

  const unlockMutation = useMutation({
    mutationFn: async (input: {
      authMethod: "PIN" | "RFID" | "BIOMETRIC";
      credentialValue: string;
    }) => {
      if (!activeLocker) {
        throw new Error("Smart locker controller is offline.");
      }
      setAuthError(null);
      setAuthSuccess(null);
      return kioskApi.authenticateAndUnlock({
        lockerId: activeLocker.id,
        authMethod: input.authMethod,
        credentialValue: input.credentialValue,
      });
    },
    onSuccess: async (data) => {
      await haptics.success();
      setHighlightedBay(data.unlockedCompartment);
      setPin("");
      setAuthSuccess(
        `Bay #${data.unlockedCompartment} Unlocked · ${data.skuName} (${data.assetSerialNumber})`
      );
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lockers });
    },
    onError: async (err) => {
      await haptics.error();
      setAuthError(formatKioskAuthError(err));
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (compartmentNumber: number) => {
      if (!activeLocker) throw new Error("No active locker");
      return kioskApi.removeAsset({
        lockerId: activeLocker.id,
        compartmentNumber,
      });
    },
    onSuccess: async (data) => {
      await haptics.success();
      setAuthError(null);
      setAuthSuccess(data.message);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lockers });
    },
    onError: async (err) => {
      await haptics.error();
      setAuthError(err instanceof Error ? err.message : "IR removal update failed");
    },
  });

  const foreignDeviceMutation = useMutation({
    mutationFn: async (compartmentNumber: number) => {
      if (!activeLocker) throw new Error("No active locker");
      return kioskApi.reportForeignDevice({
        lockerId: activeLocker.id,
        compartmentNumber,
        foreignVendorId: BADUSB_SIMULATION_VECTOR.foreignVendorId,
        foreignProductId: BADUSB_SIMULATION_VECTOR.foreignProductId,
        simulatedAttackVector: BADUSB_SIMULATION_VECTOR.simulatedAttackVector,
      });
    },
    onSuccess: async (data) => {
      await haptics.error();
      setAuthSuccess(null);
      setAuthError(`${data.incidentCode}: ${data.message}`);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lockers });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.compliance });
    },
    onError: async (err) => {
      await haptics.error();
      setAuthError(
        err instanceof Error ? err.message : "BadUSB simulation trigger failed"
      );
    },
  });

  const returnMutation = useMutation({
    mutationFn: async (payload: ReturnInspectionPayload) => {
      setReturnError(null);
      return kioskApi.returnAsset(payload);
    },
    onSuccess: async (data) => {
      await haptics.success();
      setReturnModalCompartment(null);
      setAuthError(null);
      setAuthSuccess(data.message);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lockers });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.compliance });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.analytics });
    },
    onError: async (err) => {
      await haptics.error();
      const message =
        err instanceof Error
          ? err.message
          : "Security alarm: Hardware descriptor verification failed.";
      setReturnError(message);
      setAuthError(message);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lockers });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.compliance });
    },
  });

  const handleDigit = (digit: string) => {
    setAuthError(null);
    setPin((prev) => (prev.length >= 6 ? prev : `${prev}${digit}`));
  };

  const handleClear = () => {
    setAuthError(null);
    setPin("");
  };

  const handlePinSubmit = () => {
    if (isControllerUnavailable) return;
    if (!/^\d{6}$/.test(pin)) {
      void haptics.warning();
      setAuthError("Please enter a valid 6-digit PIN.");
      return;
    }
    unlockMutation.mutate({ authMethod: "PIN", credentialValue: pin });
  };

  const handleRfidTap = () => {
    if (isControllerUnavailable) return;
    const badgeId = session?.rfidBadgeId ?? "RFID-EMP-8821";
    unlockMutation.mutate({ authMethod: "RFID", credentialValue: badgeId });
  };

  const handleBiometricUnlock = async () => {
    if (isControllerUnavailable) return;
    setAuthError(null);
    setAuthSuccess(null);

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        await haptics.warning();
        setAuthError(
          "No biometrics enrolled on this device — use 6-digit PIN or Corporate RFID"
        );
        return;
      }

      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authorize Smart Locker Solenoid Unlock",
        fallbackLabel: "Use Locker PIN",
      });

      if (!authResult.success) {
        await haptics.warning();
        setAuthError("Biometric authentication cancelled or did not match.");
        return;
      }

      unlockMutation.mutate({
        authMethod: "BIOMETRIC",
        credentialValue: "BIO-TMPL",
      });
    } catch (err) {
      await haptics.error();
      setAuthError(
        err instanceof Error
          ? err.message
          : "Biometric hardware check failed. Use PIN or RFID."
      );
    }
  };

  const rfidLabel = `Tap RFID Badge (${session?.rfidBadgeId ?? "RFID-EMP-8821"})`;

  const keypadSection = (
    <ChamferCard tone="default" style={{ gap: 12, flex: isTabletSplit ? 1 : undefined }}>
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
            fontSize: 15,
            fontWeight: "800",
          }}
        >
          Multi-Factor Terminal Unlock
        </Text>
        <StatusBadge
          label={activeLocker ? `FL ${activeLocker.floor} PINPAD` : "STANDBY"}
          variant="sky"
          compact
        />
      </View>

      {authError ? (
        <View
          testID="kiosk-auth-error-banner"
          style={{
            backgroundColor: palette.destructiveSoft,
            borderColor: palette.destructive,
            borderWidth: 1,
            borderRadius: 12,
            padding: 10,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <AlertTriangle size={15} color={palette.destructive} />
          <Text
            style={{
              color: palette.destructive,
              fontSize: 12,
              fontWeight: "700",
              flex: 1,
            }}
          >
            {authError}
          </Text>
        </View>
      ) : null}

      {authSuccess ? (
        <View
          testID="kiosk-auth-success-banner"
          style={{
            backgroundColor: palette.emeraldSoft,
            borderColor: palette.emerald,
            borderWidth: 1,
            borderRadius: 12,
            padding: 10,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <CheckCircle2 size={15} color={palette.emerald} />
          <Text
            style={{
              color: palette.emerald,
              fontSize: 12,
              fontWeight: "700",
              flex: 1,
            }}
          >
            {authSuccess}
          </Text>
        </View>
      ) : null}

      <NumericKeypad
        pin={pin}
        unlockDisabled={isControllerUnavailable}
        submitting={unlockMutation.isPending}
        onDigit={handleDigit}
        onClear={handleClear}
        onSubmit={handlePinSubmit}
      />

      {/* Alternative RFID & OS Biometrics */}
      <View style={{ gap: 8, marginTop: 2 }}>
        <Pressable
          testID="kiosk-rfid-button"
          accessibilityRole="button"
          accessibilityLabel={rfidLabel}
          accessibilityState={{
            disabled: isControllerUnavailable || unlockMutation.isPending,
          }}
          disabled={isControllerUnavailable || unlockMutation.isPending}
          onPress={handleRfidTap}
          style={{
            minHeight: 48,
            borderRadius: 12,
            backgroundColor: palette.muted,
            borderWidth: 1,
            borderColor: palette.border,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            opacity: isControllerUnavailable || unlockMutation.isPending ? 0.45 : 1,
          }}
        >
          <Nfc size={17} color={palette.sky} />
          <Text
            style={{
              color: palette.foreground,
              fontSize: 13,
              fontWeight: "700",
            }}
          >
            {rfidLabel}
          </Text>
        </Pressable>

        <Pressable
          testID="kiosk-biometric-button"
          accessibilityRole="button"
          accessibilityLabel="Biometric Unlock using Face ID or Touch ID"
          accessibilityState={{
            disabled: isControllerUnavailable || unlockMutation.isPending,
          }}
          disabled={isControllerUnavailable || unlockMutation.isPending}
          onPress={() => void handleBiometricUnlock()}
          style={{
            minHeight: 48,
            borderRadius: 12,
            backgroundColor: palette.emeraldSoft,
            borderWidth: 1,
            borderColor: palette.emerald,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            opacity: isControllerUnavailable || unlockMutation.isPending ? 0.45 : 1,
          }}
        >
          <Fingerprint size={18} color={palette.emerald} />
          <Text
            style={{
              color: palette.emerald,
              fontSize: 13,
              fontWeight: "800",
            }}
          >
            Biometric Unlock (Face / Touch)
          </Text>
        </Pressable>
      </View>
    </ChamferCard>
  );

  const bayGridSection = (
    <View style={{ gap: 12, flex: isTabletSplit ? 1.35 : undefined }}>
      {lockersQuery.isLoading ? (
        <ChamferCard style={{ gap: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <ActivityIndicator size="small" color={palette.primaryText} />
            <Text
              style={{
                color: palette.foreground,
                fontSize: 13,
                fontWeight: "700",
              }}
            >
              Connecting to Smart Locker IoT Controller...
            </Text>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <View
                key={idx}
                style={{
                  width: columns === 2 ? "48%" : "31%",
                  height: 92,
                  borderRadius: 12,
                  backgroundColor: palette.muted,
                  borderWidth: 1,
                  borderColor: palette.border,
                }}
              />
            ))}
          </View>
        </ChamferCard>
      ) : lockersQuery.isError ? (
        <ChamferCard tone="crimson" style={{ gap: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <AlertTriangle size={18} color={palette.destructive} />
            <Text
              style={{
                color: palette.destructive,
                fontSize: 15,
                fontWeight: "800",
              }}
            >
              Smart Locker Hub Offline / Unreachable
            </Text>
          </View>
          <Text style={{ color: palette.mutedForeground, fontSize: 12, lineHeight: 18 }}>
            {lockersQuery.error instanceof Error
              ? lockersQuery.error.message
              : "Failed to synchronize compartment states from controller."}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retry Connection to Smart Locker Hub"
            onPress={() => void lockersQuery.refetch()}
            style={{
              minHeight: 46,
              borderRadius: 12,
              backgroundColor: palette.destructive,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <RefreshCw size={15} color="#FFFFFF" />
            <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "800" }}>
              Retry Connection
            </Text>
          </Pressable>
        </ChamferCard>
      ) : activeLocker ? (
        <View style={{ gap: 10 }}>
          {/* Hub Telemetry Strip */}
          <ChamferCard style={{ gap: 8 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 6,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
                <Cpu size={15} color={palette.primaryText} />
                <Text
                  style={{
                    color: palette.foreground,
                    fontSize: 14,
                    fontWeight: "800",
                    flexShrink: 1,
                  }}
                >
                  {formatLockerHubLabel(activeLocker.floor, activeLocker.name)}
                </Text>
              </View>
              <StatusBadge
                label={activeLocker.onlineStatus ? "ONLINE" : "OFFLINE"}
                variant={activeLocker.onlineStatus ? "emerald" : "crimson"}
                dotColor={
                  activeLocker.onlineStatus ? palette.emerald : palette.destructive
                }
                compact
              />
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <Text style={{ color: palette.mutedForeground, fontSize: 12 }}>
                {activeLocker.locationNote}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Thermometer size={13} color={palette.sky} />
                <Text style={{ color: palette.sky, fontSize: 12, fontWeight: "700" }}>
                  {(activeLocker.temperatureC ?? 22.5).toFixed(1)}°C
                </Text>
              </View>
            </View>
          </ChamferCard>

          {/* Responsive 12-Bay Matrix */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            {activeLocker.compartments.map((comp) => (
              <LockerBayCard
                key={comp.id}
                compartment={comp}
                columns={columns}
                highlighted={highlightedBay === comp.compartmentNumber}
                busy={
                  removeMutation.isPending ||
                  foreignDeviceMutation.isPending ||
                  returnMutation.isPending
                }
                onTakeDevice={(bayNum) => removeMutation.mutate(bayNum)}
                onSimulateBadUsb={(bayNum) =>
                  foreignDeviceMutation.mutate(bayNum)
                }
                onOpenReturnModal={(compartment) => {
                  setReturnError(null);
                  setReturnModalCompartment(compartment);
                }}
              />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 14 }}
        refreshControl={
          <RefreshControl
            refreshing={lockersQuery.isRefetching}
            onRefresh={() => void lockersQuery.refetch()}
            tintColor={palette.primaryText}
          />
        }
      >
        <ScreenHeader
          badge="SMART LOCKER TERMINAL"
          badgeVariant="emerald"
          title="IoT Solenoid Kiosk"
          subtitle="Enter 6-digit pickup OTP, tap Corporate RFID, or authenticate via Face ID / Touch ID to unlock your bay."
        />

        {/* Hub Switcher Tabs */}
        {lockers.length > 0 ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {lockers.map((locker) => {
              const selected = activeLocker?.id === locker.id;
              return (
                <Pressable
                  key={locker.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Switch to ${locker.name} on Floor ${locker.floor}`}
                  accessibilityState={{ selected }}
                  onPress={() => {
                    void haptics.selection();
                    setSelectedLockerId(locker.id);
                    setAuthError(null);
                    setAuthSuccess(null);
                  }}
                  style={{
                    minHeight: 44,
                    paddingHorizontal: 14,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: selected ? palette.primary : palette.border,
                    backgroundColor: selected
                      ? themeMode === "dark"
                        ? "rgba(59, 130, 246, 0.16)"
                        : "rgba(37, 99, 235, 0.10)"
                      : palette.card,
                    justifyContent: "center",
                  }}
                >
                    <Text
                      style={{
                        color: selected ? palette.primaryText : palette.foreground,
                        fontSize: 13,
                        fontWeight: "700",
                      }}
                    >
                      {formatLockerHubLabel(locker.floor, locker.name)}
                    </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {/* Phone Stack vs Tablet 2-Pane Split */}
        {isTabletSplit ? (
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 14 }}>
            {bayGridSection}
            {keypadSection}
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            {bayGridSection}
            {keypadSection}
          </View>
        )}
      </ScrollView>

      <ReturnInspectionModal
        compartment={returnModalCompartment}
        lockerId={activeLocker?.id ?? ""}
        submitting={returnMutation.isPending}
        errorMessage={returnError}
        onClose={() => setReturnModalCompartment(null)}
        onSubmit={(payload) => returnMutation.mutate(payload)}
      />
    </View>
  );
}
