import React, { useEffect, useRef, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Clock,
  Copy,
  KeyRound,
  RefreshCw,
} from "lucide-react-native";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { QUERY_KEYS } from "@/hooks/useSession";
import { formatCountdown } from "@/lib/format";
import { haptics } from "@/lib/haptics";
import { getPalette } from "@/lib/theme";
import { useAppStore } from "@/store/app-store";
import type { DiagnoseReserveResult } from "@/types/domain";

interface PinPassCardProps {
  reservation: DiagnoseReserveResult;
  onOpenKiosk: (params: {
    locker: string;
    bay: string;
    pin?: string;
  }) => void;
  onReserveAgain: () => void;
}

export function PinPassCard({
  reservation,
  onOpenKiosk,
  onReserveAgain,
}: PinPassCardProps) {
  const queryClient = useQueryClient();
  const themeMode = useAppStore((s) => s.themeMode);
  const palette = getPalette(themeMode);

  const [countdown, setCountdown] = useState(() =>
    formatCountdown(reservation.expiresAt)
  );
  const [copied, setCopied] = useState(false);
  const invalidatedOnExpireRef = useRef(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isMaskedPin = !/^\d{6}$/.test(reservation.accessPin);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    invalidatedOnExpireRef.current = false;
    setCountdown(formatCountdown(reservation.expiresAt));

    const timer = setInterval(() => {
      const next = formatCountdown(reservation.expiresAt);
      setCountdown(next);
      if (next.isExpired && !invalidatedOnExpireRef.current) {
        invalidatedOnExpireRef.current = true;
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lockers });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [reservation.expiresAt, reservation.ticketId, queryClient]);

  const handleCopyPin = async () => {
    if (isMaskedPin || countdown.isExpired) return;
    await Clipboard.setStringAsync(reservation.accessPin);
    await haptics.success();
    setCopied(true);
    if (copyTimerRef.current) {
      clearTimeout(copyTimerRef.current);
    }
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenKiosk = () => {
    void haptics.tap();
    onOpenKiosk({
      locker: reservation.locker.id,
      bay: String(reservation.locker.compartmentNumber),
      ...(isMaskedPin ? {} : { pin: reservation.accessPin }),
    });
  };

  const accentColor = countdown.isExpired
    ? palette.destructive
    : isMaskedPin
    ? palette.amber
    : palette.emerald;

  return (
    <View
      style={{
        backgroundColor: palette.card,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: countdown.isExpired
          ? "rgba(244, 63, 94, 0.35)"
          : "rgba(16, 185, 129, 0.30)",
        overflow: "hidden",
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: themeMode === "dark" ? 0.3 : 0.08,
        shadowRadius: 14,
        elevation: 4,
      }}
    >
      {/* Top Pass Header Band */}
      <View
        style={{
          backgroundColor: countdown.isExpired
            ? palette.destructiveSoft
            : palette.emeraldSoft,
          paddingHorizontal: 16,
          paddingVertical: 12,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              backgroundColor: accentColor,
            }}
          />
          <Text
            style={{
              color: accentColor,
              fontSize: 12,
              fontWeight: "800",
              letterSpacing: 0.4,
            }}
          >
            {countdown.isExpired ? "RESERVATION EXPIRED" : "LOCKER PASS ACTIVE"}
          </Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            backgroundColor: palette.card,
            borderRadius: 999,
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}
        >
          <Clock
            size={12}
            color={countdown.isExpired ? palette.destructive : palette.amber}
          />
          <Text
            style={{
              color: countdown.isExpired ? palette.destructive : palette.amber,
              fontSize: 11,
              fontWeight: "800",
              fontVariant: ["tabular-nums"],
            }}
          >
            {countdown.isExpired ? "EXPIRED" : `TTL ${countdown.label}`}
          </Text>
        </View>
      </View>

      {/* Main Bay & Equipment Section */}
      <View style={{ padding: 16, gap: 10 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 8,
          }}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Text
              style={{
                color: palette.foreground,
                fontSize: 15,
                fontWeight: "800",
              }}
            >
              {reservation.locker.name} · BAY #{reservation.locker.compartmentNumber}
            </Text>
            <Text
              style={{
                color: palette.primaryText,
                fontSize: 13,
                fontWeight: "700",
              }}
            >
              {reservation.allocatedAsset.skuName}
            </Text>
          </View>
          <StatusBadge label={reservation.itsmTicketNumber} variant="sapphire" compact />
        </View>

        <Text
          style={{
            color: palette.mutedForeground,
            fontSize: 11,
            fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
          }}
        >
          S/N {reservation.allocatedAsset.serialNumber} · VID{" "}
          {reservation.allocatedAsset.usbVendorId} / PID{" "}
          {reservation.allocatedAsset.usbProductId}
        </Text>
      </View>

      {/* Perforated Ticket Divider */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginHorizontal: -8,
          marginVertical: 2,
        }}
      >
        <View
          style={{
            width: 16,
            height: 16,
            borderRadius: 999,
            backgroundColor: palette.background,
          }}
        />
        <View
          style={{
            flex: 1,
            height: 1,
            borderStyle: "dashed",
            borderBottomWidth: 1,
            borderBottomColor: palette.borderStrong,
          }}
        />
        <View
          style={{
            width: 16,
            height: 16,
            borderRadius: 999,
            backgroundColor: palette.background,
          }}
        />
      </View>

      {/* PIN Display & Actions */}
      <View style={{ padding: 16, gap: 12 }}>
        {isMaskedPin ? (
          <View
            style={{
              backgroundColor: palette.amberSoft,
              borderRadius: 14,
              padding: 13,
              gap: 6,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <AlertTriangle size={15} color={palette.amber} />
              <Text style={{ color: palette.amber, fontSize: 12, fontWeight: "800" }}>
                Duplicate Reservation Replay (PIN Masked)
              </Text>
            </View>
            <Text style={{ color: palette.foreground, fontSize: 12, lineHeight: 17 }}>
              Your previous reservation was safely replayed without generating a duplicate ticket. Unlock Bay #{reservation.locker.compartmentNumber} using Corporate RFID or OS Biometrics in the Kiosk tab.
            </Text>
          </View>
        ) : (
          <View
            style={{
              backgroundColor: palette.surfaceElevated,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: palette.border,
              padding: 16,
              alignItems: "center",
              gap: 10,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <KeyRound size={13} color={palette.sky} />
              <Text
                style={{
                  color: palette.mutedForeground,
                  fontSize: 10,
                  fontWeight: "800",
                  letterSpacing: 1.2,
                }}
              >
                ONE-TIME PICKUP PIN
              </Text>
            </View>

            <Text
              selectable
              style={{
                color: countdown.isExpired ? palette.mutedForeground : palette.sky,
                fontSize: 34,
                fontWeight: "800",
                letterSpacing: 9,
                fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
              }}
            >
              {reservation.accessPin}
            </Text>
          </View>
        )}

        <View style={{ flexDirection: "row", gap: 10 }}>
          {!isMaskedPin ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Copy 6-digit pickup PIN"
              accessibilityState={{ disabled: countdown.isExpired }}
              disabled={countdown.isExpired}
              onPress={() => void handleCopyPin()}
              style={{
                minHeight: 48,
                paddingHorizontal: 16,
                borderRadius: 13,
                backgroundColor: copied ? palette.emeraldSoft : palette.muted,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                opacity: countdown.isExpired ? 0.5 : 1,
              }}
            >
              {copied ? (
                <Check size={15} color={palette.emerald} />
              ) : (
                <Copy size={15} color={palette.foreground} />
              )}
              <Text
                style={{
                  color: copied ? palette.emerald : palette.foreground,
                  fontSize: 13,
                  fontWeight: "700",
                }}
              >
                {copied ? "Copied" : "Copy PIN"}
              </Text>
            </Pressable>
          ) : null}

          {countdown.isExpired ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reserve a new hardware unit"
              onPress={onReserveAgain}
              style={{
                flex: 1,
                minHeight: 48,
                borderRadius: 13,
                backgroundColor: palette.primary,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <RefreshCw size={15} color="#FFFFFF" />
              <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "800" }}>
                Reserve Again
              </Text>
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open Bay ${reservation.locker.compartmentNumber} in Locker Kiosk`}
              onPress={handleOpenKiosk}
              style={{
                flex: 1,
                minHeight: 48,
                borderRadius: 13,
                backgroundColor: palette.emerald,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "800" }}>
                Open in Locker Kiosk
              </Text>
              <ArrowRight size={16} color="#FFFFFF" />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}
