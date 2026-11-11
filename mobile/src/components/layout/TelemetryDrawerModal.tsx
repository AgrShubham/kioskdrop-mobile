import React from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Radio, Trash2, X } from "lucide-react-native";
import { getActiveApiBaseUrl } from "@/lib/api";
import { formatEnumLabel, formatShortTimestamp } from "@/lib/format";
import { haptics } from "@/lib/haptics";
import { getPalette } from "@/lib/theme";
import { useAppStore } from "@/store/app-store";
import type { TelemetryEventType } from "@/types/domain";
import { StatusBadge, type BadgeVariant } from "@/components/ui/StatusBadge";

function badgeVariantForEvent(type: TelemetryEventType): BadgeVariant {
  switch (type) {
    case "SECURITY_MISMATCH_ALARM":
      return "crimson";
    case "LOCKER_RESERVED":
    case "TICKET_EXPIRED":
    case "TICKET_OVERDUE":
      return "amber";
    case "DOOR_UNLOCKED":
      return "sky";
    case "ASSET_REMOVED":
    case "ASSET_RETURNED":
    case "INVENTORY_RESTOCKED":
    default:
      return "emerald";
  }
}

export function TelemetryDrawerModal() {
  const open = useAppStore((s) => s.telemetryDrawerOpen);
  const setOpen = useAppStore((s) => s.setTelemetryDrawerOpen);
  const themeMode = useAppStore((s) => s.themeMode);
  const sseConnected = useAppStore((s) => s.sseConnected);
  const sseError = useAppStore((s) => s.sseError);
  const telemetryEvents = useAppStore((s) => s.telemetryEvents);
  const clearTelemetryEvents = useAppStore((s) => s.clearTelemetryEvents);

  const palette = getPalette(themeMode);

  return (
    <Modal
      visible={open}
      animationType="slide"
      transparent
      onRequestClose={() => setOpen(false)}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(2, 6, 23, 0.72)",
        }}
      >
        <View
          style={{
            backgroundColor: palette.card,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            borderTopWidth: 1,
            borderColor: palette.borderStrong,
            maxHeight: "86%",
            paddingHorizontal: 18,
            paddingTop: 10,
            paddingBottom: 24,
          }}
        >
          {/* Sheet Grabber */}
          <View
            style={{
              width: 38,
              height: 4,
              borderRadius: 999,
              backgroundColor: palette.borderStrong,
              alignSelf: "center",
              marginBottom: 12,
            }}
          />
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
              gap: 8,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  backgroundColor: sseConnected ? palette.emeraldSoft : palette.amberSoft,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Radio
                  size={17}
                  color={sseConnected ? palette.emerald : palette.amber}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: palette.foreground,
                    fontSize: 16,
                    fontWeight: "800",
                    letterSpacing: -0.3,
                  }}
                >
                  Live Telemetry Feed
                </Text>
                <Text
                  numberOfLines={1}
                  style={{ color: palette.mutedForeground, fontSize: 11 }}
                >
                  {getActiveApiBaseUrl()}/api/telemetry/stream
                </Text>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear telemetry event log"
              onPress={() => {
                void haptics.selection();
                clearTelemetryEvents();
              }}
              style={{
                minWidth: 44,
                minHeight: 44,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  backgroundColor: palette.muted,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Trash2 size={15} color={palette.mutedForeground} />
              </View>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close telemetry event log"
              onPress={() => setOpen(false)}
              style={{
                minWidth: 44,
                minHeight: 44,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
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

          {/* Status Strip */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: palette.surfaceElevated,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: palette.border,
              paddingHorizontal: 12,
              paddingVertical: 8,
              marginBottom: 12,
            }}
          >
            <StatusBadge
              label={sseConnected ? "Connected" : "Reconnecting"}
              variant={sseConnected ? "emerald" : "amber"}
              dotColor={sseConnected ? palette.emerald : palette.amber}
              compact
            />
            <Text style={{ color: palette.mutedForeground, fontSize: 11, fontWeight: "700" }}>
              {telemetryEvents.length} / 50 events
            </Text>
          </View>

          {sseError && !sseConnected ? (
            <Text
              style={{
                color: palette.amber,
                fontSize: 11,
                marginBottom: 10,
              }}
            >
              {sseError}
            </Text>
          ) : null}

          <ScrollView showsVerticalScrollIndicator={false}>
            {telemetryEvents.length === 0 ? (
              <View
                style={{
                  paddingVertical: 32,
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Text
                  style={{
                    color: palette.foreground,
                    fontSize: 14,
                    fontWeight: "700",
                  }}
                >
                  Awaiting Hardware & Locker Events
                </Text>
                <Text
                  style={{
                    color: palette.mutedForeground,
                    fontSize: 12,
                    textAlign: "center",
                    lineHeight: 18,
                  }}
                >
                  Reserve an adapter, unlock a smart bay, trigger BadUSB alarm, or authorize a PO to see live SSE frames stream here.
                </Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {telemetryEvents.map((evt) => (
                  <View
                    key={evt.id}
                    style={{
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: palette.border,
                      backgroundColor: palette.background,
                      padding: 12,
                      gap: 6,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <StatusBadge
                        label={formatEnumLabel(evt.type)}
                        variant={badgeVariantForEvent(evt.type)}
                        compact
                      />
                      <Text
                        style={{
                          color: palette.mutedForeground,
                          fontSize: 11,
                          fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
                        }}
                      >
                        {formatShortTimestamp(evt.ts)}
                      </Text>
                    </View>

                    <Text
                      selectable
                      style={{
                        color: palette.mutedForeground,
                        fontSize: 11,
                        fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
                      }}
                    >
                      {JSON.stringify(evt.payload, null, 2)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
