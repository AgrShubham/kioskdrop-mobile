import React from "react";
import { Text, View } from "react-native";
import { StatusBadge, type BadgeVariant } from "@/components/ui/StatusBadge";
import { getPalette } from "@/lib/theme";
import { useAppStore } from "@/store/app-store";

interface ScreenHeaderProps {
  badge?: string;
  badgeVariant?: BadgeVariant;
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
}

export function ScreenHeader({
  badge,
  badgeVariant = "sapphire",
  title,
  subtitle,
  rightSlot,
}: ScreenHeaderProps) {
  const themeMode = useAppStore((s) => s.themeMode);
  const palette = getPalette(themeMode);

  return (
    <View style={{ marginBottom: 14, gap: 6 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <View style={{ flex: 1, minWidth: 180, gap: 4 }}>
          {badge ? (
            <StatusBadge label={badge} variant={badgeVariant} compact />
          ) : null}
          <Text
            style={{
              color: palette.foreground,
              fontSize: 22,
              fontWeight: "800",
              letterSpacing: -0.4,
            }}
          >
            {title}
          </Text>
        </View>
        {rightSlot ? <View>{rightSlot}</View> : null}
      </View>
      {subtitle ? (
        <Text
          style={{
            color: palette.mutedForeground,
            fontSize: 13,
            lineHeight: 19,
          }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

