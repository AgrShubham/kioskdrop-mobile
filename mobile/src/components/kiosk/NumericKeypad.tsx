import React from "react";
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

  const slots = Array.from({ length: 6 }, (_, i) => pin[i] ?? "");

  return (
    <View style={{ gap: 12 }}>
      {/* 6-Slot Backlit PIN Indicator */}
      <View
        accessibilityLabel={`Entered PIN digits: ${pin.length} of 6`}
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          gap: 6,
        }}
      >
        {slots.map((char, index) => {
          const filled = char.length > 0;
          return (
            <View
              key={index}
              style={{
                flex: 1,
                height: 48,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: filled ? palette.sky : palette.border,
                backgroundColor: filled
                  ? themeMode === "dark"
                    ? "rgba(56, 189, 248, 0.14)"
                    : "rgba(2, 132, 199, 0.08)"
                  : palette.background,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: filled ? palette.sky : palette.mutedForeground,
                  fontSize: 20,
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

      {/* 3x4 Backlit Keypad Grid (>= 48pt target height) */}
      <View style={{ gap: 8 }}>
        {KEY_ROWS.map((row, rowIndex) => (
          <View key={rowIndex} style={{ flexDirection: "row", gap: 8 }}>
            {row.map((key) => {
              const isClear = key === "CLEAR";
              const isEnter = key === "ENTER";
              const isDisabled = isEnter && (unlockDisabled || submitting);

              const bg = isEnter
                ? palette.primary
                : isClear
                ? palette.muted
                : palette.card;
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
                  style={({ pressed }) => ({
                    flex: 1,
                    minHeight: 50,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: border,
                    backgroundColor: bg,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: isDisabled ? 0.45 : pressed ? 0.78 : 1,
                  })}
                >
                  <Text
                    style={{
                      color: textColor,
                      fontSize: isClear || isEnter ? 13 : 19,
                      fontWeight: "800",
                      letterSpacing: isClear || isEnter ? 0.5 : 0,
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

