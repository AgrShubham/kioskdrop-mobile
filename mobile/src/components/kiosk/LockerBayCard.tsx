import React from "react";
import { Pressable, Text, View } from "react-native";
import {
  BatteryCharging,
  CornerDownLeft,
  Lock,
  Radio,
  ShieldAlert,
  Unlock,
  Zap,
} from "lucide-react-native";
import { StatusBadge } from "@/components/ui/StatusBadge";
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
    columns === 2 ? "48.5%" : columns === 3 ? "31.8%" : "23.6%";

  const activeTicket = compartment.tickets[0] ?? null;

  return (
    <View
      style={{
        width: widthPercent,
        minWidth: 136,
        flexGrow: 1,
        backgroundColor: palette.card,
        borderRadius: 14,
        borderWidth: highlighted ? 2 : 1,
        borderColor: highlighted ? palette.sky : visual.borderColor,
        padding: 10,
        gap: 8,
      }}
    >
      {/* Top Bay Number & LED Indicator */}
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
              width: 9,
              height: 9,
              borderRadius: 999,
              backgroundColor: visual.ledColor,
            }}
          />
          <Text
            style={{
              color: palette.foreground,
              fontSize: 13,
              fontWeight: "800",
            }}
          >
            Bay #{compartment.compartmentNumber}
          </Text>
        </View>
        {compartment.solenoidLocked ? (
          <Lock size={13} color={palette.mutedForeground} />
        ) : (
          <Unlock size={13} color={palette.sky} />
        )}
      </View>

      <StatusBadge
        label={visual.shortLabel}
        variant={visual.badgeVariant}
        dotColor={visual.ledColor}
        compact
      />

      {/* Asset Summary */}
      <View style={{ gap: 2, minHeight: 34 }}>
        <Text
          numberOfLines={2}
          style={{
            color: palette.foreground,
            fontSize: 11,
            fontWeight: "700",
            lineHeight: 15,
          }}
        >
          {compartment.asset?.sku?.name ?? "Unassigned / Empty"}
        </Text>
        {compartment.asset ? (
          <Text
            numberOfLines={1}
            style={{ color: palette.mutedForeground, fontSize: 10 }}
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

      {/* Hardware Telemetry Mini-Bar */}
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 6,
          paddingTop: 4,
          borderTopWidth: 1,
          borderTopColor: palette.border,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
          <Radio
            size={10}
            color={
              compartment.irSensorBreakBeam
                ? palette.emerald
                : palette.mutedForeground
            }
          />
          <Text
            style={{
              color: compartment.irSensorBreakBeam
                ? palette.emerald
                : palette.mutedForeground,
              fontSize: 9,
              fontWeight: "700",
            }}
          >
            {compartment.irSensorBreakBeam ? "IR:IN" : "IR:OUT"}
          </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
          <BatteryCharging
            size={10}
            color={
              compartment.chargingConnected
                ? palette.sky
                : palette.destructive
            }
          />
          <Text
            style={{
              color: compartment.chargingConnected
                ? palette.sky
                : palette.destructive,
              fontSize: 9,
              fontWeight: "700",
            }}
          >
            {compartment.chargingConnected ? "5V:OK" : "5V:NO"}
          </Text>
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
              borderRadius: 10,
              backgroundColor: palette.sky,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              paddingHorizontal: 8,
            }}
          >
            <Zap size={13} color="#0F172A" />
            <Text style={{ color: "#0F172A", fontSize: 11, fontWeight: "800" }}>
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
              borderRadius: 10,
              backgroundColor: palette.destructiveSoft,
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
              style={{
                color: palette.destructive,
                fontSize: 11,
                fontWeight: "800",
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
            borderRadius: 10,
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

