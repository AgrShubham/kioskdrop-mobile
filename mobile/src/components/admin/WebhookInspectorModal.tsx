import React from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { RefreshCw, X } from "lucide-react-native";
import { formatEnumLabel, formatShortTimestamp } from "@/lib/format";
import { getPalette } from "@/lib/theme";
import { useAppStore } from "@/store/app-store";
import type { WebhookEvent } from "@/types/domain";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface WebhookInspectorModalProps {
  event: WebhookEvent | null;
  replaying: boolean;
  onClose: () => void;
  onReplay: (webhookEventId: string) => void;
}

export function WebhookInspectorModal({
  event,
  replaying,
  onClose,
  onReplay,
}: WebhookInspectorModalProps) {
  const themeMode = useAppStore((s) => s.themeMode);
  const palette = getPalette(themeMode);

  if (!event) return null;

  let formattedPayload = event.payload;
  try {
    formattedPayload = JSON.stringify(JSON.parse(event.payload), null, 2);
  } catch {
    // Keep raw payload text
  }

  return (
    <Modal
      visible={Boolean(event)}
      animationType="slide"
      transparent
      onRequestClose={onClose}
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
            borderTopLeftRadius: 26,
            borderTopRightRadius: 26,
            borderWidth: 1,
            borderBottomWidth: 0,
            borderColor: palette.border,
            maxHeight: "86%",
            paddingHorizontal: 18,
            paddingTop: 10,
            paddingBottom: 26,
            gap: 12,
          }}
        >
          {/* Grabber Handle */}
          <View style={{ alignItems: "center" }}>
            <View
              style={{
                width: 38,
                height: 4,
                borderRadius: 999,
                backgroundColor: palette.borderStrong,
              }}
            />
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingBottom: 12,
              borderBottomWidth: 1,
              borderBottomColor: palette.border,
              gap: 8,
            }}
          >
            <View style={{ gap: 5, flex: 1 }}>
              <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                <StatusBadge
                  label={formatEnumLabel(event.source)}
                  variant="sapphire"
                  compact
                />
                <StatusBadge
                  label={event.signatureValid ? "HMAC Valid" : "HMAC Invalid"}
                  variant={event.signatureValid ? "emerald" : "crimson"}
                  compact
                />
              </View>
              <Text
                style={{
                  color: palette.foreground,
                  fontSize: 16,
                  fontWeight: "800",
                  letterSpacing: -0.2,
                }}
              >
                {event.externalEventId ?? event.id}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close webhook payload inspector"
              onPress={onClose}
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

          <Text style={{ color: palette.mutedForeground, fontSize: 12 }}>
            {formatEnumLabel(event.direction)} · {formatEnumLabel(event.status)} ·{" "}
            {event.latencyMs}ms · {formatShortTimestamp(event.createdAt)}
          </Text>

          <ScrollView
            style={{
              backgroundColor: palette.surfaceElevated,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: palette.border,
              padding: 12,
              maxHeight: 280,
            }}
          >
            <Text
              selectable
              style={{
                color: palette.foreground,
                fontSize: 11.5,
                lineHeight: 16,
                fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
              }}
            >
              {formattedPayload}
            </Text>
          </ScrollView>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Replay Webhook Event"
            disabled={replaying}
            onPress={() => onReplay(event.id)}
            style={{
              minHeight: 48,
              borderRadius: 13,
              backgroundColor: palette.primary,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              opacity: replaying ? 0.65 : 1,
            }}
          >
            {replaying ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <RefreshCw size={15} color="#FFFFFF" />
            )}
            <Text style={{ color: "#FFFFFF", fontSize: 13.5, fontWeight: "800" }}>
              {replaying ? "Replaying..." : "Replay Webhook Event"}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
