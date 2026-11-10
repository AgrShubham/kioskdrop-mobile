import React from "react";
import { Pressable, Text, View } from "react-native";
import type { SymptomOption } from "@/constants/symptoms";
import { getPalette } from "@/lib/theme";
import { useAppStore } from "@/store/app-store";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface SymptomCardProps {
  symptom: SymptomOption;
  selected: boolean;
  previewSkuName: string;
  onSelect: () => void;
}

export function SymptomCard({
  symptom,
  selected,
  previewSkuName,
  onSelect,
}: SymptomCardProps) {
  const themeMode = useAppStore((s) => s.themeMode);
  const palette = getPalette(themeMode);

  const urgencyVariant =
    symptom.urgency === "P1_CRITICAL"
      ? "crimson"
      : symptom.urgency === "P2_HIGH"
      ? "amber"
      : "sapphire";

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={`${symptom.title}. ${symptom.description}`}
      accessibilityState={{ selected }}
      onPress={onSelect}
      style={{
        minHeight: 74,
        borderRadius: 14,
        borderWidth: selected ? 1.5 : 1,
        borderColor: selected ? palette.primary : palette.border,
        backgroundColor: selected
          ? themeMode === "dark"
            ? "rgba(59, 130, 246, 0.14)"
            : "rgba(37, 99, 235, 0.08)"
          : palette.card,
        padding: 13,
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
        <Text
          style={{
            color: palette.foreground,
            fontSize: 14,
            fontWeight: "800",
            flex: 1,
          }}
        >
          {symptom.title}
        </Text>
        <StatusBadge label={symptom.urgency} variant={urgencyVariant} compact />
      </View>

      <Text
        style={{
          color: palette.mutedForeground,
          fontSize: 12,
          lineHeight: 17,
        }}
      >
        {symptom.description}
      </Text>

      <Text
        style={{
          color: selected ? palette.primaryText : palette.emerald,
          fontSize: 11,
          fontWeight: "700",
        }}
      >
        Recommended Kit: {previewSkuName}
      </Text>
    </Pressable>
  );
}

