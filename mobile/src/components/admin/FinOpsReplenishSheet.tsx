import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Minus, Plus, ShoppingCart, X } from "lucide-react-native";
import { formatEnumLabel } from "@/lib/format";
import { haptics } from "@/lib/haptics";
import { getPalette } from "@/lib/theme";
import { useAppStore } from "@/store/app-store";
import type { HardwareSKU } from "@/types/domain";
import { StatusBadge } from "@/components/ui/StatusBadge";

export interface FinOpsReplenishPayload {
  skuId: string;
  quantity: number;
  procurementMode: "DIRECT_IMPORT" | "DOMESTIC_WHOLESALE";
  cardProvider: "ZAGGLE_CARD" | "HAPPAY_PETTY_CASH";
  erpTarget: "SAP_S4HANA" | "ORACLE_NETSUITE" | "ZOHO_BOOKS";
}

interface FinOpsReplenishSheetProps {
  visible: boolean;
  skus: HardwareSKU[];
  submitting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSubmit: (payload: FinOpsReplenishPayload) => void;
}

export function FinOpsReplenishSheet({
  visible,
  skus,
  submitting,
  errorMessage,
  onClose,
  onSubmit,
}: FinOpsReplenishSheetProps) {
  const themeMode = useAppStore((s) => s.themeMode);
  const palette = getPalette(themeMode);

  const [skuId, setSkuId] = useState(skus[0]?.id ?? "");
  const [quantity, setQuantity] = useState(5);
  const [procurementMode, setProcurementMode] = useState<
    "DIRECT_IMPORT" | "DOMESTIC_WHOLESALE"
  >("DIRECT_IMPORT");
  const [cardProvider, setCardProvider] = useState<
    "ZAGGLE_CARD" | "HAPPAY_PETTY_CASH"
  >("ZAGGLE_CARD");
  const [erpTarget, setErpTarget] = useState<
    "SAP_S4HANA" | "ORACLE_NETSUITE" | "ZOHO_BOOKS"
  >("SAP_S4HANA");

  useEffect(() => {
    if (visible && !skuId && skus.length > 0) {
      setSkuId(skus[0].id);
    }
  }, [visible, skuId, skus]);

  return (
    <Modal
      visible={visible}
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
            maxHeight: "90%",
            paddingHorizontal: 18,
            paddingTop: 10,
            paddingBottom: 26,
          }}
        >
          {/* Grabber Handle */}
          <View style={{ alignItems: "center", paddingBottom: 10 }}>
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
              marginBottom: 14,
              borderBottomWidth: 1,
              borderBottomColor: palette.border,
              gap: 8,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                flex: 1,
              }}
            >
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  backgroundColor: palette.primarySoft,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ShoppingCart size={16} color={palette.primaryText} />
              </View>
              <Text
                style={{
                  color: palette.foreground,
                  fontSize: 16.5,
                  fontWeight: "800",
                  letterSpacing: -0.2,
                  flex: 1,
                }}
              >
                Authorize B2B Replenishment
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close PO authorization sheet"
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

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* SKU Selector */}
            <Text
              style={{
                color: palette.mutedForeground,
                fontSize: 11,
                fontWeight: "700",
                letterSpacing: 0.6,
                marginBottom: 8,
              }}
            >
              HARDWARE SKU TO REPLENISH
            </Text>
            <View style={{ gap: 7, marginBottom: 16 }}>
              {skus.map((sku) => {
                const selected = sku.id === skuId;
                return (
                  <Pressable
                    key={sku.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Select SKU ${sku.name}`}
                    accessibilityState={{ selected }}
                    onPress={() => {
                      void haptics.selection();
                      setSkuId(sku.id);
                    }}
                    style={{
                      minHeight: 46,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderRadius: 13,
                      borderWidth: 1,
                      borderColor: selected ? palette.primary : palette.border,
                      backgroundColor: selected
                        ? palette.primarySoft
                        : palette.surfaceElevated,
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: palette.foreground,
                        fontSize: 12.5,
                        fontWeight: "700",
                        flex: 1,
                      }}
                    >
                      {sku.name}
                    </Text>
                    <StatusBadge label={sku.brand} variant="slate" compact />
                  </Pressable>
                );
              })}
            </View>

            {/* Quantity Stepper */}
            <Text
              style={{
                color: palette.mutedForeground,
                fontSize: 11,
                fontWeight: "700",
                letterSpacing: 0.6,
                marginBottom: 8,
              }}
            >
              QUANTITY (1–20 UNITS)
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Decrease quantity"
                onPress={() => {
                  void haptics.selection();
                  setQuantity((q) => Math.max(1, q - 1));
                }}
                style={{
                  minWidth: 44,
                  minHeight: 44,
                  borderRadius: 12,
                  backgroundColor: palette.surfaceElevated,
                  borderWidth: 1,
                  borderColor: palette.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Minus size={16} color={palette.foreground} />
              </Pressable>
              <Text
                style={{
                  color: palette.foreground,
                  fontSize: 18,
                  fontWeight: "800",
                  fontVariant: ["tabular-nums"],
                  minWidth: 36,
                  textAlign: "center",
                }}
              >
                {quantity}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Increase quantity"
                onPress={() => {
                  void haptics.selection();
                  setQuantity((q) => Math.min(20, q + 1));
                }}
                style={{
                  minWidth: 44,
                  minHeight: 44,
                  borderRadius: 12,
                  backgroundColor: palette.surfaceElevated,
                  borderWidth: 1,
                  borderColor: palette.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Plus size={16} color={palette.foreground} />
              </Pressable>
            </View>

            {/* Procurement Mode */}
            <Text
              style={{
                color: palette.mutedForeground,
                fontSize: 11,
                fontWeight: "700",
                letterSpacing: 0.6,
                marginBottom: 8,
              }}
            >
              PROCUREMENT CHANNEL
            </Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
              {(["DIRECT_IMPORT", "DOMESTIC_WHOLESALE"] as const).map((m) => {
                const active = procurementMode === m;
                return (
                  <Pressable
                    key={m}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => {
                      void haptics.selection();
                      setProcurementMode(m);
                    }}
                    style={{
                      flex: 1,
                      minHeight: 44,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: active ? palette.primary : palette.border,
                      backgroundColor: active
                        ? palette.primarySoft
                        : palette.surfaceElevated,
                      alignItems: "center",
                      justifyContent: "center",
                      paddingHorizontal: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: active ? palette.primaryText : palette.foreground,
                        fontSize: 12,
                        fontWeight: "700",
                      }}
                    >
                      {formatEnumLabel(m)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Card Provider */}
            <Text
              style={{
                color: palette.mutedForeground,
                fontSize: 11,
                fontWeight: "700",
                letterSpacing: 0.6,
                marginBottom: 8,
              }}
            >
              CORPORATE CARD (MCC 5045)
            </Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
              {(["ZAGGLE_CARD", "HAPPAY_PETTY_CASH"] as const).map((card) => {
                const active = cardProvider === card;
                return (
                  <Pressable
                    key={card}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => {
                      void haptics.selection();
                      setCardProvider(card);
                    }}
                    style={{
                      flex: 1,
                      minHeight: 44,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: active ? palette.primary : palette.border,
                      backgroundColor: active
                        ? palette.primarySoft
                        : palette.surfaceElevated,
                      alignItems: "center",
                      justifyContent: "center",
                      paddingHorizontal: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: active ? palette.primaryText : palette.foreground,
                        fontSize: 12,
                        fontWeight: "700",
                      }}
                    >
                      {formatEnumLabel(card)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* ERP Target */}
            <Text
              style={{
                color: palette.mutedForeground,
                fontSize: 11,
                fontWeight: "700",
                letterSpacing: 0.6,
                marginBottom: 8,
              }}
            >
              ERP RECONCILIATION TARGET
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
              {(["SAP_S4HANA", "ORACLE_NETSUITE", "ZOHO_BOOKS"] as const).map(
                (erp) => {
                  const active = erpTarget === erp;
                  return (
                    <Pressable
                      key={erp}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      onPress={() => {
                        void haptics.selection();
                        setErpTarget(erp);
                      }}
                      style={{
                        minHeight: 44,
                        paddingHorizontal: 13,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: active ? palette.primary : palette.border,
                        backgroundColor: active
                          ? palette.primarySoft
                          : palette.surfaceElevated,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: active ? palette.primaryText : palette.foreground,
                          fontSize: 12,
                          fontWeight: "700",
                        }}
                      >
                        {formatEnumLabel(erp)}
                      </Text>
                    </Pressable>
                  );
                }
              )}
            </View>

            {errorMessage ? (
              <Text
                style={{
                  color: palette.destructive,
                  fontSize: 12,
                  fontWeight: "700",
                  marginBottom: 10,
                }}
              >
                {errorMessage}
              </Text>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Submit Purchase Order and Sync ERP"
              disabled={submitting || !skuId}
              onPress={() =>
                onSubmit({
                  skuId,
                  quantity,
                  procurementMode,
                  cardProvider,
                  erpTarget,
                })
              }
              style={{
                minHeight: 50,
                borderRadius: 14,
                backgroundColor: palette.primary,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                opacity: submitting || !skuId ? 0.65 : 1,
              }}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : null}
              <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "800" }}>
                {submitting ? "Reconciling..." : "Authorize PO & Sync ERP"}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
