import React from "react";
import { Text, View } from "react-native";
import { type BadgeVariant } from "@/components/ui/StatusBadge";
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

  const eyebrowColor: Record<BadgeVariant, string> = {
    sapphire: palette.primaryText,
    emerald: palette.emerald,
    amber: palette.amber,
    sky: palette.sky,
    crimson: palette.destructive,
    slate: palette.mutedForeground,
  };

  return (
    <View style={{ marginBottom: 4, gap: 4 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <View style={{ flex: 1, minWidth: 180, gap: 2 }}>
          {badge ? (
            <Text
              numberOfLines={1}
              style={{
                color: eyebrowColor[badgeVariant],
                fontSize: 10,
                fontWeight: "800",
                letterSpacing: 1.1,
                textTransform: "uppercase",
              }}
            >
              {badge}
            </Text>
          ) : null}
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{
              color: palette.foreground,
              fontSize: 23,
              fontWeight: "800",
              letterSpacing: -0.6,
            }}
          >
            {title}
          </Text>
        </View>
        {rightSlot ? <View style={{ flexShrink: 0 }}>{rightSlot}</View> : null}
      </View>
      {subtitle ? (
        <Text
          style={{
            color: palette.mutedForeground,
            fontSize: 13,
            lineHeight: 18,
          }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

