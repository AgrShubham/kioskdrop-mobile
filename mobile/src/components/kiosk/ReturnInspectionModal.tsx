import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  AlertTriangle,
  BatteryCharging,
  CheckCircle2,
  ShieldAlert,
  X,
} from "lucide-react-native";
import { BADUSB_SIMULATION_VECTOR } from "@/constants/presets";
import { haptics } from "@/lib/haptics";
import { getPalette } from "@/lib/theme";
import { useAppStore } from "@/store/app-store";
import type { LockerCompartment } from "@/types/domain";
import { StatusBadge } from "@/components/ui/StatusBadge";

export interface ReturnInspectionPayload {
  lockerId: string;
  compartmentNumber: number;
  assetSerialNumber: string;
  usbVendorId: string;
  usbProductId: string;
  chargingConnected: boolean;
}

interface ReturnInspectionModalProps {
  compartment: LockerCompartment | null;
  lockerId: string;
  submitting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSubmit: (payload: ReturnInspectionPayload) => void;
}

export function ReturnInspectionModal({
  compartment,
  lockerId,
  submitting,
  errorMessage,
  onClose,
  onSubmit,
}: ReturnInspectionModalProps) {
  const themeMode = useAppStore((s) => s.themeMode);
  const palette = getPalette(themeMode);

  const expectedSerial = compartment?.asset?.serialNumber ?? "";
  const expectedVid = compartment?.asset?.usbVendorId ?? "0x046D";
  const expectedPid = compartment?.asset?.usbProductId ?? "0xC53E";

  const [serialNumber, setSerialNumber] = useState(expectedSerial);
  const [usbVendorId, setUsbVendorId] = useState(expectedVid);
  const [usbProductId, setUsbProductId] = useState(expectedPid);
  const [chargingConnected, setChargingConnected] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState<
    "HEALTHY" | "FAULT_5V" | "COUNTERFEIT"
  >("HEALTHY");

  useEffect(() => {
    if (compartment) {
      setSerialNumber(compartment.asset?.serialNumber ?? "");
      setUsbVendorId(compartment.asset?.usbVendorId ?? "0x046D");
      setUsbProductId(compartment.asset?.usbProductId ?? "0xC53E");
      setChargingConnected(true);
      setSelectedPreset("HEALTHY");
    }
  }, [compartment]);

  const applyPreset = (preset: "HEALTHY" | "FAULT_5V" | "COUNTERFEIT") => {
    void haptics.selection();
    setSelectedPreset(preset);
    if (preset === "HEALTHY") {
      setSerialNumber(expectedSerial);
      setUsbVendorId(expectedVid);
      setUsbProductId(expectedPid);
      setChargingConnected(true);
    } else if (preset === "FAULT_5V") {
      setSerialNumber(expectedSerial);
      setUsbVendorId(expectedVid);
      setUsbProductId(expectedPid);
      setChargingConnected(false);
    } else {
      setSerialNumber(BADUSB_SIMULATION_VECTOR.counterfeitSerial);
      setUsbVendorId(BADUSB_SIMULATION_VECTOR.foreignVendorId);
      setUsbProductId(BADUSB_SIMULATION_VECTOR.foreignProductId);
      setChargingConnected(true);
    }
  };

  if (!compartment) return null;

  return (
    <Modal
      visible={Boolean(compartment)}
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
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <View>
              <StatusBadge
                label={`BAY #${compartment.compartmentNumber} RETURN SENSOR CHECK`}
                variant="sapphire"
                compact
              />
              <Text
                style={{
                  color: palette.foreground,
                  fontSize: 17,
                  fontWeight: "800",
                  marginTop: 4,
                }}
              >
                Zero-Trust Return Inspection
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close return inspection modal"
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
            {/* Scenario Quick-Fill Presets */}
            <Text
              style={{
                color: palette.mutedForeground,
                fontSize: 11,
                fontWeight: "700",
                letterSpacing: 0.7,
                marginBottom: 8,
              }}
            >
              TEST VECTOR / HARDWARE SENSOR PRESETS
            </Text>

            <View style={{ gap: 8, marginBottom: 14 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Apply Healthy OEM Return preset"
                onPress={() => applyPreset("HEALTHY")}
                style={{
                  minHeight: 46,
                  padding: 10,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor:
                    selectedPreset === "HEALTHY"
                      ? palette.emerald
                      : palette.border,
                  backgroundColor:
                    selectedPreset === "HEALTHY"
                      ? palette.emeraldSoft
                      : palette.muted,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <CheckCircle2 size={16} color={palette.emerald} />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: palette.foreground,
                      fontSize: 13,
                      fontWeight: "700",
                    }}
                  >
                    Healthy OEM Return
                  </Text>
                  <Text style={{ color: palette.mutedForeground, fontSize: 11 }}>
                    Matching S/N + VID/PID + 5V/3A continuity -&gt; STOCKED_AVAILABLE
                  </Text>
                </View>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Apply Defective 5V Charging Fault preset"
                onPress={() => applyPreset("FAULT_5V")}
                style={{
                  minHeight: 46,
                  padding: 10,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor:
                    selectedPreset === "FAULT_5V"
                      ? palette.amber
                      : palette.border,
                  backgroundColor:
                    selectedPreset === "FAULT_5V"
                      ? palette.amberSoft
                      : palette.muted,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <BatteryCharging size={16} color={palette.amber} />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: palette.foreground,
                      fontSize: 13,
                      fontWeight: "700",
                    }}
                  >
                    Defective 5V/3A Fault
                  </Text>
                  <Text style={{ color: palette.mutedForeground, fontSize: 11 }}>
                    Closes ticket cleanly, quarantines bay for IT inspection
                  </Text>
                </View>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Apply Counterfeit or BadUSB Swap attack preset"
                onPress={() => applyPreset("COUNTERFEIT")}
                style={{
                  minHeight: 46,
                  padding: 10,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor:
                    selectedPreset === "COUNTERFEIT"
                      ? palette.destructive
                      : palette.border,
                  backgroundColor:
                    selectedPreset === "COUNTERFEIT"
                      ? palette.destructiveSoft
                      : palette.muted,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <ShieldAlert size={16} color={palette.destructive} />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: palette.foreground,
                      fontSize: 13,
                      fontWeight: "700",
                    }}
                  >
                    Counterfeit / BadUSB Swap
                  </Text>
                  <Text style={{ color: palette.mutedForeground, fontSize: 11 }}>
                    SN-FAKE-USB-999 · 0x16C0/0x05DF -&gt; Triggers 409 Alarm
                  </Text>
                </View>
              </Pressable>
            </View>

            {/* Form Inputs */}
            <View style={{ gap: 10, marginBottom: 14 }}>
              <View style={{ gap: 4 }}>
                <Text
                  style={{
                    color: palette.mutedForeground,
                    fontSize: 11,
                    fontWeight: "700",
                  }}
                >
                  Plugged Asset Serial Number
                </Text>
                <TextInput
                  value={serialNumber}
                  onChangeText={setSerialNumber}
                  autoCapitalize="characters"
                  placeholder="SN-..."
                  placeholderTextColor={palette.mutedForeground}
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

              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text
                    style={{
                      color: palette.mutedForeground,
                      fontSize: 11,
                      fontWeight: "700",
                    }}
                  >
                    USB Vendor ID (VID)
                  </Text>
                  <TextInput
                    value={usbVendorId}
                    onChangeText={setUsbVendorId}
                    placeholder="0x046D"
                    placeholderTextColor={palette.mutedForeground}
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
                    USB Product ID (PID)
                  </Text>
                  <TextInput
                    value={usbProductId}
                    onChangeText={setUsbProductId}
                    placeholder="0xC53E"
                    placeholderTextColor={palette.mutedForeground}
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

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: palette.muted,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: palette.border,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: palette.foreground,
                      fontSize: 13,
                      fontWeight: "700",
                    }}
                  >
                    5V/3A Pogo-Pin Charging Continuity
                  </Text>
                  <Text style={{ color: palette.mutedForeground, fontSize: 11 }}>
                    Disable to simulate charging continuity fault
                  </Text>
                </View>
                <Switch
                  value={chargingConnected}
                  onValueChange={(val) => {
                    void haptics.selection();
                    setChargingConnected(val);
                  }}
                  trackColor={{ false: palette.destructive, true: palette.emerald }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            {errorMessage ? (
              <View
                style={{
                  marginBottom: 12,
                  backgroundColor: palette.destructiveSoft,
                  borderColor: palette.destructive,
                  borderWidth: 1,
                  borderRadius: 12,
                  padding: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <AlertTriangle size={16} color={palette.destructive} />
                <Text
                  style={{
                    color: palette.destructive,
                    fontSize: 12,
                    fontWeight: "700",
                    flex: 1,
                  }}
                >
                  {errorMessage}
                </Text>
              </View>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Verify Hardware Descriptor and Close Return"
              disabled={submitting || !serialNumber.trim()}
              onPress={() =>
                onSubmit({
                  lockerId,
                  compartmentNumber: compartment.compartmentNumber,
                  assetSerialNumber: serialNumber.trim(),
                  usbVendorId: usbVendorId.trim(),
                  usbProductId: usbProductId.trim(),
                  chargingConnected,
                })
              }
              style={{
                minHeight: 50,
                borderRadius: 14,
                backgroundColor:
                  selectedPreset === "COUNTERFEIT"
                    ? palette.destructive
                    : palette.primary,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                opacity: submitting || !serialNumber.trim() ? 0.65 : 1,
              }}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : null}
              <Text
                style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "800" }}
              >
                {submitting
                  ? "Verifying USB Descriptor..."
                  : "Verify Descriptor & Complete Return"}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

