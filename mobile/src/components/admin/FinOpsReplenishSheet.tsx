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
            maxHeight: "90%",
            paddingHorizontal: 18,
            paddingTop: 16,
            paddingBottom: 26,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
              gap: 8,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                flex: 1,
              }}
            >
              <ShoppingCart size={18} color={palette.primaryText} />
              <Text
                style={{
                  color: palette.foreground,
                  fontSize: 17,
                  fontWeight: "800",
                  flex: 1,
                }}
              >
                Authorize B2B Replenishment PO
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close PO authorization sheet"
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

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* SKU Selector */}
            <Text
              style={{
                color: palette.mutedForeground,
                fontSize: 11,
                fontWeight: "700",
                marginBottom: 6,
              }}
            >
              HARDWARE SKU TO REPLENISH
            </Text>
            <View style={{ gap: 6, marginBottom: 14 }}>
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
                      padding: 10,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: selected ? palette.primary : palette.border,
                      backgroundColor: selected
                        ? themeMode === "dark"
                          ? "rgba(59, 130, 246, 0.16)"
                          : "rgba(37, 99, 235, 0.10)"
                        : palette.muted,
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: palette.foreground,
                        fontSize: 12,
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
                marginBottom: 6,
              }}
            >
              QUANTITY (1 - 20 UNITS)
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                marginBottom: 14,
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
                  borderRadius: 10,
                  backgroundColor: palette.muted,
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
                  borderRadius: 10,
                  backgroundColor: palette.muted,
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
                marginBottom: 6,
              }}
            >
              PROCUREMENT CHANNEL
            </Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
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
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: active ? palette.primary : palette.border,
                      backgroundColor: active ? palette.accent : palette.muted,
                      alignItems: "center",
                      justifyContent: "center",
                      paddingHorizontal: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: active ? palette.primaryText : palette.foreground,
                        fontSize: 11,
                        fontWeight: "800",
                      }}
                    >
                      {m}
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
                marginBottom: 6,
              }}
            >
              CORPORATE CARD / MCC 5045
            </Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
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
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: active ? palette.primary : palette.border,
                      backgroundColor: active ? palette.accent : palette.muted,
                      alignItems: "center",
                      justifyContent: "center",
                      paddingHorizontal: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: active ? palette.primaryText : palette.foreground,
                        fontSize: 11,
                        fontWeight: "800",
                      }}
                    >
                      {card === "ZAGGLE_CARD" ? "ZAGGLE CARD" : "HAPPAY PETTY CASH"}
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
                marginBottom: 6,
              }}
            >
              ERP RECONCILIATION TARGET
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
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
                        paddingHorizontal: 12,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: active ? palette.primary : palette.border,
                        backgroundColor: active ? palette.accent : palette.muted,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: active ? palette.primaryText : palette.foreground,
                          fontSize: 11,
                          fontWeight: "800",
                        }}
                      >
                        {erp}
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
              <Text
                style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "800" }}
              >
                {submitting ? "Reconciling..." : "Authorize PO & Sync ERP"}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

