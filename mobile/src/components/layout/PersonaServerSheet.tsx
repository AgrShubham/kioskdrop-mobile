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
import {
  CheckCircle2,
  RotateCcw,
  Server,
  Shield,
  UserCheck,
  Wifi,
  X,
} from "lucide-react-native";
import { API_URL_PRESETS } from "@/constants/presets";
import { useSession } from "@/hooks/useSession";
import {
  getActiveApiBaseUrl,
  pingServerLatency,
  type PingResult,
} from "@/lib/api";
import { normalizeApiBaseUrl } from "@/lib/env";
import { haptics } from "@/lib/haptics";
import { getPalette } from "@/lib/theme";
import { useAppStore } from "@/store/app-store";
import type { UserRole } from "@/types/domain";
import { StatusBadge } from "@/components/ui/StatusBadge";

const DEFAULT_PERSONAS: Array<{
  role: UserRole;
  name: string;
  department: string;
  rfidBadgeId: string;
  badgeText: string;
}> = [
  {
    role: "EMPLOYEE",
    name: "Aarav Sharma",
    department: "Sales & Strategic Accounts",
    rfidBadgeId: "RFID-EMP-8821",
    badgeText: "Standard Request & Locker Pickup",
  },
  {
    role: "IT_ADMIN",
    name: "Priya Patel",
    department: "Enterprise Infrastructure & AV Ops",
    rfidBadgeId: "RFID-IT-0042",
    badgeText: "Full Zero-Trust, FinOps & Webhook Control",
  },
  {
    role: "FINOPS_AUDITOR",
    name: "Vikram Malhotra",
    department: "Corporate Procurement & FinOps",
    rfidBadgeId: "RFID-FIN-1109",
    badgeText: "Read-Only Audit, Duty & Analytics View",
  },
];

export function PersonaServerSheet() {
  const open = useAppStore((s) => s.personaSheetOpen);
  const setOpen = useAppStore((s) => s.setPersonaSheetOpen);
  const themeMode = useAppStore((s) => s.themeMode);
  const apiBaseUrlOverride = useAppStore((s) => s.apiBaseUrlOverride);
  const setApiBaseUrlOverride = useAppStore((s) => s.setApiBaseUrlOverride);

  const palette = getPalette(themeMode);
  const { session, availableUsers, switchRole, isSwitchingRole } = useSession();

  const [urlDraft, setUrlDraft] = useState<string>(getActiveApiBaseUrl());
  const [urlError, setUrlError] = useState<string | null>(null);
  const [roleFeedback, setRoleFeedback] = useState<string | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [pingLoading, setPingLoading] = useState(false);
  const [pingResult, setPingResult] = useState<PingResult | null>(null);

  useEffect(() => {
    if (open) {
      setUrlDraft(apiBaseUrlOverride ?? getActiveApiBaseUrl());
      setUrlError(null);
      setRoleError(null);
      setRoleFeedback(null);
    }
  }, [open, apiBaseUrlOverride]);

  const handleSelectRole = async (role: UserRole) => {
    setRoleError(null);
    setRoleFeedback(null);
    try {
      const res = await switchRole({ role });
      setRoleFeedback(res.message);
    } catch (err) {
      setRoleError(
        err instanceof Error
          ? err.message
          : "Unable to switch role. Verify backend server connection."
      );
    }
  };

  const handleSaveCustomUrl = () => {
    const normalized = normalizeApiBaseUrl(urlDraft);
    if (!normalized) {
      void haptics.error();
      setUrlError("Enter a valid http:// or https:// URL without spaces.");
      return;
    }
    setApiBaseUrlOverride(normalized);
    setUrlDraft(normalized);
    setUrlError(null);
    setPingResult(null);
    void haptics.success();
  };

  const handleResetUrl = () => {
    setApiBaseUrlOverride(null);
    const resolved = getActiveApiBaseUrl();
    setUrlDraft(resolved);
    setUrlError(null);
    setPingResult(null);
    void haptics.selection();
  };

  const handleApplyPreset = (presetUrl: string) => {
    setApiBaseUrlOverride(presetUrl);
    setUrlDraft(presetUrl);
    setUrlError(null);
    setPingResult(null);
    void haptics.selection();
  };

  const handlePing = async () => {
    const target = normalizeApiBaseUrl(urlDraft) ?? getActiveApiBaseUrl();
    setPingLoading(true);
    setPingResult(null);
    const result = await pingServerLatency(target);
    setPingLoading(false);
    setPingResult(result);
    if (result.ok) {
      void haptics.success();
    } else {
      void haptics.error();
    }
  };

  return (
    <Modal
      visible={open}
      animationType="slide"
      transparent
      onRequestClose={() => setOpen(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(2, 6, 23, 0.72)",
        }}
      >
        <View
          style={{
            backgroundColor: palette.card,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            borderWidth: 1,
            borderColor: palette.border,
            maxHeight: "88%",
            paddingHorizontal: 18,
            paddingTop: 16,
            paddingBottom: 24,
          }}
        >
          {/* Header Row */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Shield size={18} color={palette.primaryText} />
              <Text
                style={{
                  color: palette.foreground,
                  fontSize: 17,
                  fontWeight: "800",
                }}
              >
                Persona & API Connection
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close persona and server settings"
              onPress={() => setOpen(false)}
              style={{
                minWidth: 44,
                minHeight: 44,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 12,
                backgroundColor: palette.muted,
              }}
            >
              <X size={18} color={palette.foreground} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Section 1: Demo Persona Switcher */}
            <Text
              style={{
                color: palette.mutedForeground,
                fontSize: 11,
                fontWeight: "700",
                letterSpacing: 0.8,
                marginBottom: 8,
              }}
            >
              ACTIVE IDENTITY (BEARER + SECURE STORE)
            </Text>

            <View style={{ gap: 8, marginBottom: 14 }}>
              {DEFAULT_PERSONAS.map((persona) => {
                const matchedUser = availableUsers.find(
                  (u) => u.role === persona.role
                );
                const displayName = matchedUser?.name ?? persona.name;
                const displayDept =
                  matchedUser?.department ?? persona.department;
                const displayRfid =
                  matchedUser?.rfidBadgeId ?? persona.rfidBadgeId;
                const isActive = (session?.role ?? "EMPLOYEE") === persona.role;

                return (
                  <Pressable
                    key={persona.role}
                    accessibilityRole="button"
                    accessibilityLabel={`Switch persona to ${displayName}, ${persona.role}`}
                    accessibilityState={{ selected: isActive, disabled: isSwitchingRole }}
                    disabled={isSwitchingRole}
                    onPress={() => void handleSelectRole(persona.role)}
                    style={{
                      minHeight: 56,
                      borderRadius: 14,
                      padding: 12,
                      borderWidth: 1,
                      borderColor: isActive ? palette.primary : palette.border,
                      backgroundColor: isActive
                        ? themeMode === "dark"
                          ? "rgba(59, 130, 246, 0.14)"
                          : "rgba(37, 99, 235, 0.08)"
                        : palette.muted,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                    }}
                  >
                    <View style={{ flex: 1, gap: 3 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                          flexWrap: "wrap",
                        }}
                      >
                        <UserCheck
                          size={14}
                          color={
                            isActive
                              ? palette.primaryText
                              : palette.mutedForeground
                          }
                        />
                        <Text
                          style={{
                            color: palette.foreground,
                            fontSize: 14,
                            fontWeight: "700",
                          }}
                        >
                          {displayName}
                        </Text>
                        <StatusBadge
                          label={persona.role}
                          variant={
                            persona.role === "IT_ADMIN"
                              ? "emerald"
                              : persona.role === "FINOPS_AUDITOR"
                              ? "amber"
                              : "sapphire"
                          }
                          compact
                        />
                      </View>
                      <Text
                        style={{
                          color: palette.mutedForeground,
                          fontSize: 11,
                        }}
                      >
                        {displayDept} · {displayRfid}
                      </Text>
                    </View>
                    {isActive ? (
                      <CheckCircle2 size={18} color={palette.primaryText} />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            {roleFeedback ? (
              <View
                style={{
                  backgroundColor: palette.emeraldSoft,
                  borderRadius: 12,
                  padding: 10,
                  marginBottom: 14,
                  borderWidth: 1,
                  borderColor: palette.emerald,
                }}
              >
                <Text style={{ color: palette.emerald, fontSize: 12, fontWeight: "600" }}>
                  {roleFeedback}
                </Text>
              </View>
            ) : null}

            {roleError ? (
              <View
                style={{
                  backgroundColor: palette.destructiveSoft,
                  borderRadius: 12,
                  padding: 10,
                  marginBottom: 14,
                  borderWidth: 1,
                  borderColor: palette.destructive,
                }}
              >
                <Text
                  style={{
                    color: palette.destructive,
                    fontSize: 12,
                    fontWeight: "600",
                  }}
                >
                  {roleError}
                </Text>
              </View>
            ) : null}

            {/* Section 2: Server URL Resolver */}
            <Text
              style={{
                color: palette.mutedForeground,
                fontSize: 11,
                fontWeight: "700",
                letterSpacing: 0.8,
                marginBottom: 8,
                marginTop: 4,
              }}
            >
              NEXT.JS API SERVER TARGET
            </Text>

            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 10,
              }}
            >
              {API_URL_PRESETS.map((preset) => {
                const selected = getActiveApiBaseUrl() === preset.url;
                return (
                  <Pressable
                    key={preset.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Select server preset ${preset.label}`}
                    onPress={() => handleApplyPreset(preset.url)}
                    style={{
                      minHeight: 44,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: selected ? palette.primary : palette.border,
                      backgroundColor: selected ? palette.accent : palette.muted,
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: palette.foreground,
                        fontSize: 12,
                        fontWeight: "700",
                      }}
                    >
                      {preset.label}
                    </Text>
                    <Text
                      style={{
                        color: palette.mutedForeground,
                        fontSize: 10,
                      }}
                    >
                      {preset.url}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: urlError ? palette.destructive : palette.border,
                borderRadius: 12,
                backgroundColor: palette.background,
                paddingHorizontal: 12,
                minHeight: 48,
                gap: 8,
              }}
            >
              <Server size={16} color={palette.mutedForeground} />
              <TextInput
                value={urlDraft}
                onChangeText={(txt) => {
                  setUrlDraft(txt);
                  if (urlError) setUrlError(null);
                }}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                placeholder="http://192.168.1.42:3000"
                placeholderTextColor={palette.mutedForeground}
                accessibilityLabel="Custom API base URL"
                style={{
                  flex: 1,
                  color: palette.foreground,
                  fontSize: 13,
                  paddingVertical: 10,
                }}
              />
            </View>

            {urlError ? (
              <Text
                style={{
                  color: palette.destructive,
                  fontSize: 11,
                  marginTop: 6,
                }}
              >
                {urlError}
              </Text>
            ) : null}

            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 10,
              }}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Save API base URL"
                onPress={handleSaveCustomUrl}
                style={{
                  minHeight: 44,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  backgroundColor: palette.primary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700" }}>
                  Save URL
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Reset API URL to auto-detected default"
                onPress={handleResetUrl}
                style={{
                  minHeight: 44,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: palette.muted,
                  borderWidth: 1,
                  borderColor: palette.border,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <RotateCcw size={14} color={palette.foreground} />
                <Text
                  style={{
                    color: palette.foreground,
                    fontSize: 13,
                    fontWeight: "600",
                  }}
                >
                  Auto Detect
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Test ping latency to backend API"
                disabled={pingLoading}
                onPress={() => void handlePing()}
                style={{
                  minHeight: 44,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  backgroundColor: palette.emeraldSoft,
                  borderWidth: 1,
                  borderColor: palette.emerald,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {pingLoading ? (
                  <ActivityIndicator size="small" color={palette.emerald} />
                ) : (
                  <Wifi size={14} color={palette.emerald} />
                )}
                <Text
                  style={{
                    color: palette.emerald,
                    fontSize: 13,
                    fontWeight: "700",
                  }}
                >
                  Test Ping
                </Text>
              </Pressable>
            </View>

            {pingResult ? (
              <View
                style={{
                  marginTop: 12,
                  padding: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: pingResult.ok
                    ? palette.emerald
                    : palette.destructive,
                  backgroundColor: pingResult.ok
                    ? palette.emeraldSoft
                    : palette.destructiveSoft,
                }}
              >
                <Text
                  style={{
                    color: pingResult.ok
                      ? palette.emerald
                      : palette.destructive,
                    fontSize: 12,
                    fontWeight: "700",
                  }}
                >
                  {pingResult.ok
                    ? `Connected • ${pingResult.latencyMs}ms • ${pingResult.roomCount} rooms loaded`
                    : `Unreachable (${pingResult.latencyMs}ms): ${pingResult.error}`}
                </Text>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

