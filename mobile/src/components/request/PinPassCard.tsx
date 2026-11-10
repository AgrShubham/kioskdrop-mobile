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
import { ChamferCard } from "@/components/ui/ChamferCard";
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

  return (
    <ChamferCard
      tone={countdown.isExpired ? "crimson" : isMaskedPin ? "amber" : "emerald"}
      style={{ gap: 12 }}
    >
      {/* Top Status & Countdown */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <StatusBadge
          label={countdown.isExpired ? "RESERVATION EXPIRED" : "LOCKER RESERVED"}
          variant={countdown.isExpired ? "crimson" : "emerald"}
          dotColor={countdown.isExpired ? palette.destructive : palette.emerald}
        />

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            backgroundColor: countdown.isExpired
              ? palette.destructiveSoft
              : palette.amberSoft,
            borderRadius: 999,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderWidth: 1,
            borderColor: countdown.isExpired
              ? palette.destructive
              : palette.amber,
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
            }}
          >
            {countdown.isExpired ? "EXPIRED — Reserve Again" : `TTL ${countdown.label}`}
          </Text>
        </View>
      </View>

      {/* Metadata Row */}
      <View
        style={{
          backgroundColor: palette.muted,
          borderRadius: 12,
          padding: 12,
          borderWidth: 1,
          borderColor: palette.border,
          gap: 4,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 6,
          }}
        >
          <Text style={{ color: palette.foreground, fontSize: 13, fontWeight: "800" }}>
            {reservation.locker.name} · BAY #{reservation.locker.compartmentNumber}
          </Text>
          <StatusBadge label={reservation.itsmTicketNumber} variant="sapphire" compact />
        </View>
        <Text style={{ color: palette.primaryText, fontSize: 12, fontWeight: "700" }}>
          {reservation.allocatedAsset.skuName}
        </Text>
        <Text style={{ color: palette.mutedForeground, fontSize: 11 }}>
          S/N {reservation.allocatedAsset.serialNumber} · VID{" "}
          {reservation.allocatedAsset.usbVendorId} / PID{" "}
          {reservation.allocatedAsset.usbProductId}
        </Text>
      </View>

      {/* Masked Replay Guard OR Glowing 6-Digit PIN Pass */}
      {isMaskedPin ? (
        <View
          style={{
            backgroundColor: palette.amberSoft,
            borderColor: palette.amber,
            borderWidth: 1,
            borderRadius: 12,
            padding: 12,
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
            backgroundColor: palette.background,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: palette.border,
            padding: 14,
            alignItems: "center",
            gap: 10,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <KeyRound size={14} color={palette.sky} />
            <Text
              style={{
                color: palette.mutedForeground,
                fontSize: 11,
                fontWeight: "700",
                letterSpacing: 1,
              }}
            >
              ONE-TIME PICKUP PIN
            </Text>
          </View>

          <Text
            selectable
            style={{
              color: countdown.isExpired ? palette.mutedForeground : palette.sky,
              fontSize: 32,
              fontWeight: "800",
              letterSpacing: 8,
              fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
            }}
          >
            {reservation.accessPin}
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Copy 6-digit pickup PIN"
            accessibilityState={{ disabled: countdown.isExpired }}
            disabled={countdown.isExpired}
            onPress={() => void handleCopyPin()}
            style={{
              minHeight: 44,
              paddingHorizontal: 16,
              borderRadius: 10,
              backgroundColor: copied ? palette.emeraldSoft : palette.muted,
              borderWidth: 1,
              borderColor: copied ? palette.emerald : palette.border,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              opacity: countdown.isExpired ? 0.5 : 1,
            }}
          >
            {copied ? (
              <Check size={14} color={palette.emerald} />
            ) : (
              <Copy size={14} color={palette.foreground} />
            )}
            <Text
              style={{
                color: copied ? palette.emerald : palette.foreground,
                fontSize: 12,
                fontWeight: "700",
              }}
            >
              {copied ? "Copied ✓" : "Copy PIN"}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Primary Action CTA */}
      {countdown.isExpired ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reserve a new hardware unit"
          onPress={onReserveAgain}
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
          <RefreshCw size={16} color="#FFFFFF" />
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
            minHeight: 48,
            borderRadius: 12,
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
    </ChamferCard>
  );
}
