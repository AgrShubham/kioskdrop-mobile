import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useMutation } from "@tanstack/react-query";
import { Calculator } from "lucide-react-native";
import { ChamferCard } from "@/components/ui/ChamferCard";
import { HSN_CODE_PRESETS } from "@/constants/presets";
import { kioskApi } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { getPalette } from "@/lib/theme";
import { useAppStore } from "@/store/app-store";
import type { LandedCostResponse } from "@/types/domain";

export function LandedCostCalculator() {
  const themeMode = useAppStore((s) => s.themeMode);
  const palette = getPalette(themeMode);

  const [cifInput, setCifInput] = useState("1000");
  const [selectedHsn, setSelectedHsn] = useState<string>(HSN_CODE_PRESETS[0].code);
  const [mode, setMode] = useState<"DIRECT_IMPORT" | "DOMESTIC_WHOLESALE">(
    "DIRECT_IMPORT"
  );
  const [inputError, setInputError] = useState<string | null>(null);
  const [result, setResult] = useState<LandedCostResponse | null>(null);

  const calcMutation = useMutation({
    mutationFn: async () => {
      const numericCif = Number(cifInput.replace(/,/g, "").trim());
      if (!Number.isFinite(numericCif) || numericCif <= 0) {
        throw new Error("Enter a positive CIF / Wholesale value in INR.");
      }
      setInputError(null);
      return kioskApi.computeLandedCost({
        cifAmountINR: numericCif,
        hsnCode: selectedHsn,
        procurementMode: mode,
      });
    },
    onSuccess: async (data) => {
      await haptics.success();
      setResult(data);
    },
    onError: async (err) => {
      await haptics.error();
      setInputError(
        err instanceof Error ? err.message : "Unable to calculate landed cost."
      );
    },
  });

  return (
    <ChamferCard style={{ gap: 14 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: palette.primarySoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Calculator size={17} color={palette.primaryText} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: palette.foreground,
              fontSize: 15,
              fontWeight: "800",
              letterSpacing: -0.2,
            }}
          >
            Customs Duty & Landed Cost
          </Text>
          <Text style={{ color: palette.mutedForeground, fontSize: 12 }}>
            Integer-paise Indian tariff engine (net of ITC)
          </Text>
        </View>
      </View>

      {/* CIF Value Input */}
      <View style={{ gap: 6 }}>
        <Text
          style={{
            color: palette.mutedForeground,
            fontSize: 11,
            fontWeight: "700",
          }}
        >
          CIF / Base Procurement Value
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            minHeight: 46,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: inputError ? palette.destructive : palette.border,
            backgroundColor: palette.surfaceElevated,
            paddingHorizontal: 12,
            gap: 6,
          }}
        >
          <Text
            style={{
              color: palette.mutedForeground,
              fontSize: 15,
              fontWeight: "800",
            }}
          >
            ₹
          </Text>
          <TextInput
            testID="landed-cost-cif-input"
            value={cifInput}
            onChangeText={(txt) => {
              setCifInput(txt);
              if (inputError) setInputError(null);
            }}
            keyboardType="numeric"
            placeholder="1000"
            placeholderTextColor={palette.mutedForeground}
            accessibilityLabel="CIF Amount in INR"
            style={{
              flex: 1,
              color: palette.foreground,
              fontSize: 15,
              fontWeight: "700",
              fontVariant: ["tabular-nums"],
              paddingVertical: 10,
            }}
          />
          <Text
            style={{
              color: palette.mutedForeground,
              fontSize: 11,
              fontWeight: "700",
            }}
          >
            INR
          </Text>
        </View>
      </View>

      {/* HSN Preset Chips */}
      <View style={{ gap: 6 }}>
        <Text
          style={{
            color: palette.mutedForeground,
            fontSize: 11,
            fontWeight: "700",
          }}
        >
          HSN Customs Classification
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {HSN_CODE_PRESETS.map((hsn) => {
            const active = selectedHsn === hsn.code;
            return (
              <Pressable
                key={hsn.code}
                accessibilityRole="button"
                accessibilityLabel={`Select HSN ${hsn.code} ${hsn.label}`}
                accessibilityState={{ selected: active }}
                onPress={() => {
                  void haptics.selection();
                  setSelectedHsn(hsn.code);
                }}
                style={{
                  minHeight: 44,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 11,
                  borderWidth: 1,
                  borderColor: active ? palette.primary : palette.border,
                  backgroundColor: active
                    ? palette.primarySoft
                    : palette.surfaceElevated,
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: active ? palette.primaryText : palette.foreground,
                    fontSize: 12,
                    fontWeight: "800",
                    fontVariant: ["tabular-nums"],
                  }}
                >
                  {hsn.code}
                </Text>
                <Text style={{ color: palette.mutedForeground, fontSize: 10.5 }}>
                  {hsn.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Joined Segmented Mode Toggle */}
      <View
        style={{
          flexDirection: "row",
          backgroundColor: palette.muted,
          borderRadius: 12,
          padding: 3,
          gap: 3,
        }}
      >
        {(["DIRECT_IMPORT", "DOMESTIC_WHOLESALE"] as const).map((item) => {
          const active = mode === item;
          return (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityLabel={`Set procurement mode to ${item}`}
              accessibilityState={{ selected: active }}
              onPress={() => {
                void haptics.selection();
                setMode(item);
              }}
              style={{
                flex: 1,
                minHeight: 42,
                borderRadius: 9,
                backgroundColor: active ? palette.card : "transparent",
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 8,
                shadowColor: active ? "#000000" : "transparent",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: active ? (themeMode === "dark" ? 0.25 : 0.08) : 0,
                shadowRadius: 3,
                elevation: active ? 2 : 0,
              }}
            >
              <Text
                style={{
                  color: active ? palette.foreground : palette.mutedForeground,
                  fontSize: 12,
                  fontWeight: active ? "800" : "600",
                }}
              >
                {item === "DIRECT_IMPORT" ? "Direct Import" : "Domestic Wholesale"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {inputError ? (
        <Text style={{ color: palette.destructive, fontSize: 12, fontWeight: "700" }}>
          {inputError}
        </Text>
      ) : null}

      <Pressable
        testID="compute-landed-cost-button"
        accessibilityRole="button"
        accessibilityLabel="Compute Landed Cost"
        disabled={calcMutation.isPending}
        onPress={() => calcMutation.mutate()}
        style={{
          minHeight: 48,
          borderRadius: 13,
          backgroundColor: palette.primary,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {calcMutation.isPending ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : null}
        <Text style={{ color: "#FFFFFF", fontSize: 13.5, fontWeight: "800" }}>
          Compute Landed Cost
        </Text>
      </Pressable>

      {/* Duty Stack Receipt */}
      {result ? (
        <View
          testID="landed-cost-result"
          style={{
            backgroundColor: palette.surfaceElevated,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: palette.border,
            padding: 14,
            gap: 8,
          }}
        >
          <Row label="CIF Value" value={result.formatted.cifINR} palette={palette} />
          <Row
            label="Assessable Value (Va = CIF × 1.01)"
            value={result.formatted.assessableValueINR}
            palette={palette}
          />
          <Row
            label={`Basic Customs Duty (${result.rates.bcdPercent})`}
            value={result.formatted.bcdINR}
            palette={palette}
          />
          <Row
            label={`Social Welfare Surcharge (${result.rates.swsPercent})`}
            value={result.formatted.swsINR}
            palette={palette}
          />
          <Row
            label={`IGST (${result.rates.igstPercent})`}
            value={result.formatted.igstINR}
            palette={palette}
          />

          <View
            style={{
              height: 1,
              backgroundColor: palette.border,
              marginVertical: 2,
            }}
          />

          <Row
            label={`Total Duties (${result.effectiveDutyRatePercent.toFixed(2)}%)`}
            value={result.formatted.totalDutiesINR}
            palette={palette}
            bold
          />
          <Row
            label="Total Landed Cost"
            value={result.formatted.totalLandedCostINR}
            palette={palette}
            bold
          />

          <View
            style={{
              marginTop: 4,
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 11,
              backgroundColor: palette.emeraldSoft,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ color: palette.emerald, fontSize: 12, fontWeight: "800" }}>
              Effective Net of ITC
            </Text>
            <Text
              style={{
                color: palette.emerald,
                fontSize: 15,
                fontWeight: "800",
                fontVariant: ["tabular-nums"],
              }}
            >
              {result.formatted.netCostAfterItcINR}
            </Text>
          </View>
        </View>
      ) : null}
    </ChamferCard>
  );
}

function Row({
  label,
  value,
  palette,
  bold = false,
}: {
  label: string;
  value: string;
  palette: ReturnType<typeof getPalette>;
  bold?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8,
      }}
    >
      <Text
        style={{
          color: bold ? palette.foreground : palette.mutedForeground,
          fontSize: 12.5,
          fontWeight: bold ? "800" : "500",
          flex: 1,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          color: palette.foreground,
          fontSize: 12.5,
          fontWeight: bold ? "800" : "700",
          fontVariant: ["tabular-nums"],
        }}
      >
        {value}
      </Text>
    </View>
  );
}
