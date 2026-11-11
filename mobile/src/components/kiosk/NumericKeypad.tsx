import React, { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { haptics } from "@/lib/haptics";
import { getPalette } from "@/lib/theme";
import { useAppStore } from "@/store/app-store";

interface NumericKeypadProps {
  pin: string;
  unlockDisabled: boolean;
  submitting?: boolean;
  onDigit: (digit: string) => void;
  onClear: () => void;
  onSubmit: () => void;
}

const KEY_ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["CLEAR", "0", "ENTER"],
] as const;

export function NumericKeypad({
  pin,
  unlockDisabled,
  submitting = false,
  onDigit,
  onClear,
  onSubmit,
}: NumericKeypadProps) {
  const themeMode = useAppStore((s) => s.themeMode);
  const palette = getPalette(themeMode);
  const [pressedKey, setPressedKey] = useState<string | null>(null);

  const slots = Array.from({ length: 6 }, (_, i) => pin[i] ?? "");

  return (
    <View style={{ gap: 14 }}>
      {/* 6-Slot Sleek PIN Indicator */}
      <View
        accessibilityLabel={`Entered PIN digits: ${pin.length} of 6`}
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        {slots.map((char, index) => {
          const filled = char.length > 0;
          const isCurrentCursor = !filled && index === pin.length;
          return (
            <View
              key={index}
              style={{
                flex: 1,
                height: 52,
                borderRadius: 14,
                borderWidth: isCurrentCursor ? 1.5 : 1,
                borderColor: filled
                  ? palette.sky
                  : isCurrentCursor
                  ? palette.primary
                  : palette.border,
                backgroundColor: filled
                  ? palette.skySoft
                  : palette.surfaceElevated,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: filled ? palette.sky : palette.mutedForeground,
                  fontSize: 22,
                  fontWeight: "800",
                  fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
                }}
              >
                {filled ? char : "•"}
              </Text>
            </View>
          );
        })}
      </View>

      {/* 3x4 Tactile Keypad Grid (>= 52pt height) */}
      <View style={{ gap: 9 }}>
        {KEY_ROWS.map((row, rowIndex) => (
          <View key={rowIndex} style={{ flexDirection: "row", gap: 9 }}>
            {row.map((key) => {
              const isClear = key === "CLEAR";
              const isEnter = key === "ENTER";
              const isDisabled = isEnter && (unlockDisabled || submitting);

              const bg = isEnter
                ? palette.primary
                : isClear
                ? palette.muted
                : palette.surfaceElevated;
              const border = isEnter ? palette.primary : palette.border;
              const textColor = isEnter
                ? "#FFFFFF"
                : isClear
                ? palette.mutedForeground
                : palette.foreground;

              return (
                <Pressable
                  key={key}
                  testID={`keypad-key-${key}`}
                  accessibilityRole="button"
                  accessibilityLabel={
                    isClear
                      ? "Clear PIN"
                      : isEnter
                      ? "Enter PIN to unlock bay"
                      : `Digit ${key}`
                  }
                  accessibilityState={{ disabled: isDisabled }}
                  disabled={isDisabled}
                  onPressIn={() => setPressedKey(key)}
                  onPressOut={() => setPressedKey(null)}
                  onPress={() => {
                    void haptics.tap();
                    if (isClear) {
                      onClear();
                    } else if (isEnter) {
                      onSubmit();
                    } else {
                      onDigit(key);
                    }
                  }}
                  style={{
                    flex: 1,
                    minHeight: 54,
                    borderRadius: 15,
                    borderWidth: 1,
                    borderColor: border,
                    backgroundColor: bg,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: isDisabled ? 0.42 : pressedKey === key ? 0.72 : 1,
                    transform: [{ scale: pressedKey === key ? 0.97 : 1 }],
                  }}
                >
                  <Text
                    style={{
                      color: textColor,
                      fontSize: isClear || isEnter ? 12 : 20,
                      fontWeight: "800",
                      letterSpacing: isClear || isEnter ? 0.7 : 0,
                    }}
                  >
                    {isEnter && submitting ? "..." : key}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}
