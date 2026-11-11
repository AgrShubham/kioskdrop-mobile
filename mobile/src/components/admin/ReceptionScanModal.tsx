import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { PackageCheck, ScanLine, X } from "lucide-react-native";
import { formatLockerHubLabel } from "@/lib/format";
import { haptics } from "@/lib/haptics";
import { getPalette } from "@/lib/theme";
import { useAppStore } from "@/store/app-store";
import type { PurchaseOrder, SmartLocker } from "@/types/domain";
import { StatusBadge } from "@/components/ui/StatusBadge";

export interface ReceptionScanPayload {
  purchaseOrderId: string;
  skuId: string;
  serialNumber: string;
  usbVendorId: string;
  usbProductId: string;
  targetLockerId: string;
  targetCompartmentNumber: number;
}

interface ReceptionScanModalProps {
  purchaseOrder: PurchaseOrder | null;
  lockers: SmartLocker[];
  submitting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSubmit: (payload: ReceptionScanPayload) => void;
}

export function ReceptionScanModal({
  purchaseOrder,
  lockers,
  submitting,
  errorMessage,
  onClose,
  onSubmit,
}: ReceptionScanModalProps) {
  const themeMode = useAppStore((s) => s.themeMode);
  const palette = getPalette(themeMode);

  const firstItem = purchaseOrder?.items?.[0];
  const [serialNumber, setSerialNumber] = useState("");
  const [usbVendorId, setUsbVendorId] = useState("0x046D");
  const [usbProductId, setUsbProductId] = useState("0xC53E");
  const [targetLockerId, setTargetLockerId] = useState(lockers[0]?.id ?? "lkr_floor4");
  const [targetBay, setTargetBay] = useState<number>(12);

  useEffect(() => {
    if (purchaseOrder) {
      setSerialNumber(`SN-INT-${Date.now().toString().slice(-6)}`);
      setUsbVendorId("0x046D");
      setUsbProductId("0xC53E");
      const firstEmptyBay = lockers
        .flatMap((l) => l.compartments)
        .find((c) => c.status === "EMPTY");
      if (firstEmptyBay) {
        setTargetLockerId(firstEmptyBay.lockerId);
        setTargetBay(firstEmptyBay.compartmentNumber);
      } else if (lockers[0]) {
        setTargetLockerId(lockers[0].id);
        setTargetBay(12);
      }
    }
  }, [purchaseOrder, lockers]);

  if (!purchaseOrder || !firstItem) return null;

  const activeLocker = lockers.find((l) => l.id === targetLockerId) ?? lockers[0];

  return (
    <Modal
      visible={Boolean(purchaseOrder)}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
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
            <View style={{ flex: 1 }}>
              <StatusBadge label={purchaseOrder.poNumber} variant="amber" compact />
              <Text
                style={{
                  color: palette.foreground,
                  fontSize: 17,
                  fontWeight: "800",
                  marginTop: 4,
                }}
              >
                PO Reception Scan & Locker Intake
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close PO reception intake modal"
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
            <Text
              style={{
                color: palette.primaryText,
                fontSize: 13,
                fontWeight: "700",
                marginBottom: 12,
              }}
            >
              Intake SKU: {firstItem.sku?.name ?? firstItem.skuId}
            </Text>

            {/* Serial Input */}
            <View style={{ gap: 4, marginBottom: 12 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: palette.mutedForeground,
                    fontSize: 11,
                    fontWeight: "700",
                  }}
                >
                  Serialized Unit Tag (min 3 chars)
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Generate scanned barcode serial"
                  onPress={() => {
                    void haptics.selection();
                    setSerialNumber(`SN-INT-${Date.now().toString().slice(-6)}`);
                  }}
                  style={{
                    minHeight: 36,
                    paddingHorizontal: 8,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <ScanLine size={13} color={palette.primaryText} />
                  <Text
                    style={{
                      color: palette.primaryText,
                      fontSize: 11,
                      fontWeight: "700",
                    }}
                  >
                    Simulate Scan
                  </Text>
                </Pressable>
              </View>
              <TextInput
                value={serialNumber}
                onChangeText={setSerialNumber}
                autoCapitalize="characters"
                style={{
                  minHeight: 46,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: palette.border,
                  backgroundColor: palette.background,
                  color: palette.foreground,
                  paddingHorizontal: 12,
                  fontSize: 13,
                }}
              />
            </View>

            {/* USB VID/PID */}
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text
                  style={{
                    color: palette.mutedForeground,
                    fontSize: 11,
                    fontWeight: "700",
                  }}
                >
                  USB VID
                </Text>
                <TextInput
                  value={usbVendorId}
                  onChangeText={setUsbVendorId}
                  style={{
                    minHeight: 46,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: palette.border,
                    backgroundColor: palette.background,
                    color: palette.foreground,
                    paddingHorizontal: 12,
                    fontSize: 13,
                  }}
                />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text
                  style={{
                    color: palette.mutedForeground,
                    fontSize: 11,
                    fontWeight: "700",
                  }}
                >
                  USB PID
                </Text>
                <TextInput
                  value={usbProductId}
                  onChangeText={setUsbProductId}
                  style={{
                    minHeight: 46,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: palette.border,
                    backgroundColor: palette.background,
                    color: palette.foreground,
                    paddingHorizontal: 12,
                    fontSize: 13,
                  }}
                />
              </View>
            </View>

            {/* Target Locker */}
            <Text
              style={{
                color: palette.mutedForeground,
                fontSize: 11,
                fontWeight: "700",
                marginBottom: 6,
              }}
            >
              TARGET SMART LOCKER
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              {lockers.map((lkr) => {
                const active = lkr.id === targetLockerId;
                return (
                  <Pressable
                    key={lkr.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => {
                      void haptics.selection();
                      setTargetLockerId(lkr.id);
                    }}
                    style={{
                      minHeight: 44,
                      paddingHorizontal: 12,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: active ? palette.primary : palette.border,
                      backgroundColor: active ? palette.accent : palette.muted,
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
                      {formatLockerHubLabel(lkr.floor, lkr.name, "FL")}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Target Bay 1-12 */}
            <Text
              style={{
                color: palette.mutedForeground,
                fontSize: 11,
                fontWeight: "700",
                marginBottom: 6,
              }}
            >
              TARGET BAY NUMBER (1 - 12)
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
              {Array.from({ length: 12 }, (_, idx) => idx + 1).map((num) => {
                const comp = activeLocker?.compartments.find(
                  (c) => c.compartmentNumber === num
                );
                const isEmpty = comp?.status === "EMPTY";
                const active = targetBay === num;
                return (
                  <Pressable
                    key={num}
                    accessibilityRole="button"
                    accessibilityLabel={`Bay ${num}${isEmpty ? " Empty" : ""}`}
                    accessibilityState={{ selected: active }}
                    onPress={() => {
                      void haptics.selection();
                      setTargetBay(num);
                    }}
                    style={{
                      minWidth: 48,
                      minHeight: 44,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: active
                        ? palette.primary
                        : isEmpty
                        ? palette.emerald
                        : palette.border,
                      backgroundColor: active
                        ? palette.primary
                        : isEmpty
                        ? palette.emeraldSoft
                        : palette.muted,
                      alignItems: "center",
                      justifyContent: "center",
                      paddingHorizontal: 6,
                    }}
                  >
                    <Text
                      style={{
                        color: active
                          ? "#FFFFFF"
                          : isEmpty
                          ? palette.emerald
                          : palette.foreground,
                        fontSize: 12,
                        fontWeight: "800",
                      }}
                    >
                      #{num}
                    </Text>
                  </Pressable>
                );
              })}
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
              accessibilityLabel="Confirm Hardware Inspection and Stock Bay"
              disabled={submitting || serialNumber.trim().length < 3}
              onPress={() =>
                onSubmit({
                  purchaseOrderId: purchaseOrder.id,
                  skuId: firstItem.skuId,
                  serialNumber: serialNumber.trim(),
                  usbVendorId: usbVendorId.trim(),
                  usbProductId: usbProductId.trim(),
                  targetLockerId,
                  targetCompartmentNumber: targetBay,
                })
              }
              style={{
                minHeight: 50,
                borderRadius: 14,
                backgroundColor: palette.emerald,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                opacity:
                  submitting || serialNumber.trim().length < 3 ? 0.65 : 1,
              }}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <PackageCheck size={17} color="#FFFFFF" />
              )}
              <Text
                style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "800" }}
              >
                {submitting ? "Stocking Smart Bay..." : "Inspect & Stock Bay"}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

