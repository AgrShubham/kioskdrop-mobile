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
import { formatShortTimestamp } from "@/lib/format";
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
          backgroundColor: "rgba(2, 6, 23, 0.74)",
        }}
      >
        <View
          style={{
            backgroundColor: palette.card,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            borderWidth: 1,
            borderColor: palette.border,
            maxHeight: "86%",
            paddingHorizontal: 18,
            paddingTop: 16,
            paddingBottom: 26,
            gap: 12,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ gap: 4 }}>
              <View style={{ flexDirection: "row", gap: 6 }}>
                <StatusBadge label={event.source} variant="sapphire" compact />
                <StatusBadge
                  label={event.signatureValid ? "HMAC VALID" : "HMAC INVALID"}
                  variant={event.signatureValid ? "emerald" : "crimson"}
                  compact
                />
              </View>
              <Text
                style={{
                  color: palette.foreground,
                  fontSize: 16,
                  fontWeight: "800",
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
                borderRadius: 12,
                backgroundColor: palette.muted,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={18} color={palette.foreground} />
            </Pressable>
          </View>

          <Text style={{ color: palette.mutedForeground, fontSize: 12 }}>
            {event.direction} · {event.status} · {event.latencyMs}ms ·{" "}
            {formatShortTimestamp(event.createdAt)}
          </Text>

          <ScrollView
            style={{
              backgroundColor: palette.background,
              borderRadius: 12,
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
                fontSize: 11,
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
              borderRadius: 12,
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
            <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "800" }}>
              {replaying ? "Replaying..." : "Replay Webhook Event"}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

