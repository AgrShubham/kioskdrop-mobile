import React from "react";
import { Pressable, Text, View } from "react-native";
import { Sparkles } from "lucide-react-native";
import type { SymptomOption } from "@/constants/symptoms";
import { formatEnumLabel } from "@/lib/format";
import { getPalette } from "@/lib/theme";
import { useAppStore } from "@/store/app-store";

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

  const urgencyColor =
    symptom.urgency === "P1_CRITICAL"
      ? palette.destructive
      : symptom.urgency === "P2_HIGH"
      ? palette.amber
      : palette.primaryText;

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={`${symptom.title}. ${symptom.description}`}
      accessibilityState={{ selected }}
      onPress={onSelect}
      style={{
        minHeight: 54,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: selected ? palette.primary : palette.border,
        backgroundColor: selected ? palette.primarySoft : palette.card,
        paddingHorizontal: 14,
        paddingVertical: 13,
        gap: 8,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        {/* Custom Radio Indicator */}
        <View
          style={{
            width: 18,
            height: 18,
            borderRadius: 999,
            borderWidth: selected ? 5 : 1.5,
            borderColor: selected ? palette.primary : palette.borderStrong,
            backgroundColor: selected ? "#FFFFFF" : "transparent",
          }}
        />

        <Text
          numberOfLines={2}
          style={{
            color: palette.foreground,
            fontSize: 14,
            fontWeight: selected ? "800" : "700",
            flex: 1,
            lineHeight: 19,
          }}
        >
          {symptom.title}
        </Text>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            paddingLeft: 4,
          }}
        >
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              backgroundColor: urgencyColor,
            }}
          />
          <Text
            style={{
              color: urgencyColor,
              fontSize: 11,
              fontWeight: "700",
            }}
          >
            {formatEnumLabel(symptom.urgency)}
          </Text>
        </View>
      </View>

      {/* Progressive Disclosure Details when Selected */}
      {selected ? (
        <View style={{ paddingLeft: 28, gap: 8 }}>
          <Text
            style={{
              color: palette.mutedForeground,
              fontSize: 12,
              lineHeight: 17,
            }}
          >
            {symptom.description}
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              alignSelf: "flex-start",
              backgroundColor: palette.emeraldSoft,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 10,
            }}
          >
            <Sparkles size={12} color={palette.emerald} />
            <Text
              numberOfLines={2}
              style={{
                color: palette.emerald,
                fontSize: 11,
                fontWeight: "700",
                flexShrink: 1,
              }}
            >
              {previewSkuName}
            </Text>
          </View>
        </View>
      ) : null}
    </Pressable>
  );
}
