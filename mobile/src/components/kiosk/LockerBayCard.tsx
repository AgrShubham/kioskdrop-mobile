import React from "react";
import { Platform, Pressable, Text, View } from "react-native";
import {
  CornerDownLeft,
  Lock,
  ShieldAlert,
  Unlock,
  Zap,
} from "lucide-react-native";
import { getBayLedVisual, getPalette } from "@/lib/theme";
import { useAppStore } from "@/store/app-store";
import type { LockerCompartment } from "@/types/domain";

interface LockerBayCardProps {
  compartment: LockerCompartment;
  columns: number;
  highlighted?: boolean;
  busy?: boolean;
  onTakeDevice: (compartmentNumber: number) => void;
  onSimulateBadUsb: (compartmentNumber: number) => void;
  onOpenReturnModal: (compartment: LockerCompartment) => void;
}

export function LockerBayCard({
  compartment,
  columns,
  highlighted = false,
  busy = false,
  onTakeDevice,
  onSimulateBadUsb,
  onOpenReturnModal,
}: LockerBayCardProps) {
  const themeMode = useAppStore((s) => s.themeMode);
  const palette = getPalette(themeMode);
  const visual = getBayLedVisual(compartment.status, palette);

  const widthPercent =
    columns === 2 ? "48.4%" : columns === 3 ? "31.8%" : "23.6%";

  const activeTicket = compartment.tickets[0] ?? null;
  const isAttentionState =
    highlighted ||
    compartment.status === "DOOR_OPEN_AWAITING_REMOVAL" ||
    compartment.status === "RESERVED_FOR_PICKUP" ||
    compartment.status === "MAINTENANCE_QUARANTINE";

  return (
    <View
      style={{
        width: widthPercent,
        minWidth: 136,
        flexGrow: 1,
        backgroundColor:
          compartment.status === "MAINTENANCE_QUARANTINE"
            ? palette.destructiveSoft
            : compartment.status === "DOOR_OPEN_AWAITING_REMOVAL"
            ? palette.skySoft
            : palette.card,
        borderRadius: 16,
        borderWidth: highlighted ? 1.5 : 1,
        borderColor: highlighted ? palette.sky : visual.borderColor,
        padding: 12,
        gap: 7,
        overflow: "hidden",
      }}
    >
      {/* Top Status Strip */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 4,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              backgroundColor: visual.ledColor,
            }}
          />
          <Text
            style={{
              color: palette.foreground,
              fontSize: 13,
              fontWeight: "800",
              fontVariant: ["tabular-nums"],
            }}
          >
            Bay {String(compartment.compartmentNumber).padStart(2, "0")}
          </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Text
            style={{
              color: visual.ledColor,
              fontSize: 10,
              fontWeight: "800",
            }}
          >
            {visual.shortLabel}
          </Text>
          {compartment.solenoidLocked ? (
            <Lock size={11} color={palette.mutedForeground} />
          ) : (
            <Unlock size={11} color={palette.sky} />
          )}
        </View>
      </View>

      {/* Asset Summary */}
      <View style={{ gap: 2, minHeight: 38 }}>
        <Text
          numberOfLines={2}
          style={{
            color: palette.foreground,
            fontSize: 12,
            fontWeight: "700",
            lineHeight: 16,
          }}
        >
          {compartment.asset?.sku?.name ?? "Empty Bay"}
        </Text>
        {compartment.asset ? (
          <Text
            numberOfLines={1}
            style={{
              color: palette.mutedForeground,
              fontSize: 10,
              fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
            }}
          >
            {compartment.asset.serialNumber}
          </Text>
        ) : null}
        {activeTicket ? (
          <Text
            numberOfLines={1}
            style={{ color: palette.amber, fontSize: 10, fontWeight: "700" }}
          >
            {activeTicket.itsmExternalId} · {activeTicket.user.name}
          </Text>
        ) : null}
      </View>

      {/* Subtle Sensor Status Line */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 6,
          borderTopWidth: 1,
          borderTopColor: isAttentionState
            ? visual.borderColor
            : palette.border,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <View
              style={{
                width: 5,
                height: 5,
                borderRadius: 999,
                backgroundColor: compartment.irSensorBreakBeam
                  ? palette.emerald
                  : palette.mutedForeground,
              }}
            />
            <Text
              style={{
                color: palette.mutedForeground,
                fontSize: 10,
                fontWeight: "600",
              }}
            >
              {compartment.irSensorBreakBeam ? "IR Seated" : "IR Clear"}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <View
              style={{
                width: 5,
                height: 5,
                borderRadius: 999,
                backgroundColor: compartment.chargingConnected
                  ? palette.sky
                  : palette.destructive,
              }}
            />
            <Text
              style={{
                color: compartment.chargingConnected
                  ? palette.mutedForeground
                  : palette.destructive,
                fontSize: 10,
                fontWeight: "600",
              }}
            >
              {compartment.chargingConnected ? "5V" : "No 5V"}
            </Text>
          </View>
        </View>
      </View>

      {/* Contextual Sensor / Actuator Actions */}
      {compartment.status === "DOOR_OPEN_AWAITING_REMOVAL" ? (
        <View style={{ gap: 6, marginTop: 2 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Take Device IR Break on Bay ${compartment.compartmentNumber}`}
            disabled={busy}
            onPress={() => onTakeDevice(compartment.compartmentNumber)}
            style={{
              minHeight: 44,
              borderRadius: 11,
              backgroundColor: palette.sky,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              paddingHorizontal: 8,
            }}
          >
            <Zap size={13} color="#0F172A" />
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.82}
              style={{
                color: "#0F172A",
                fontSize: 11,
                fontWeight: "800",
                flexShrink: 1,
              }}
            >
              Take Device (IR Break)
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Simulate Foreign BadUSB in Bay ${compartment.compartmentNumber}`}
            disabled={busy}
            onPress={() => onSimulateBadUsb(compartment.compartmentNumber)}
            style={{
              minHeight: 44,
              borderRadius: 11,
              backgroundColor: palette.card,
              borderWidth: 1,
              borderColor: palette.destructive,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              paddingHorizontal: 8,
            }}
          >
            <ShieldAlert size={13} color={palette.destructive} />
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.82}
              style={{
                color: palette.destructive,
                fontSize: 11,
                fontWeight: "800",
                flexShrink: 1,
              }}
            >
              Simulate Foreign BadUSB
            </Text>
          </Pressable>
        </View>
      ) : null}

      {compartment.status === "CHECKED_OUT" ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Return and plug in device to Bay ${compartment.compartmentNumber}`}
          disabled={busy}
          onPress={() => onOpenReturnModal(compartment)}
          style={{
            minHeight: 44,
            borderRadius: 11,
            backgroundColor: palette.primary,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            paddingHorizontal: 8,
            marginTop: 2,
          }}
        >
          <CornerDownLeft size={13} color="#FFFFFF" />
          <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "800" }}>
            Return & Plug In
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
