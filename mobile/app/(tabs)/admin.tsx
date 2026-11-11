import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  PackageCheck,
  Plus,
  Send,
  ShieldCheck,
  Thermometer,
  Webhook,
} from "lucide-react-native";
import { AssetRegistrySection } from "@/components/admin/AssetRegistrySection";
import {
  FinOpsReplenishSheet,
  type FinOpsReplenishPayload,
} from "@/components/admin/FinOpsReplenishSheet";
import { LandedCostCalculator } from "@/components/admin/LandedCostCalculator";
import { ProcurementBarChart } from "@/components/admin/ProcurementBarChart";
import { RbacBanner } from "@/components/admin/RbacBanner";
import {
  ReceptionScanModal,
  type ReceptionScanPayload,
} from "@/components/admin/ReceptionScanModal";
import { WebhookInspectorModal } from "@/components/admin/WebhookInspectorModal";
import { ChamferCard } from "@/components/ui/ChamferCard";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { QUERY_KEYS, useSession } from "@/hooks/useSession";
import { ApiClientError, kioskApi } from "@/lib/api";
import {
  formatEnumLabel,
  formatLockerHubLabel,
  formatPaiseToINR,
  formatShortTimestamp,
} from "@/lib/format";
import { haptics } from "@/lib/haptics";
import { getPalette } from "@/lib/theme";
import { useAppStore } from "@/store/app-store";
import type { PurchaseOrder, WebhookEvent } from "@/types/domain";

type AdminModule = "compliance" | "finops" | "analytics" | "webhooks";

const MODULES: Array<{
  id: AdminModule;
  label: string;
  renderIcon: (color: string) => React.ReactNode;
}> = [
  {
    id: "compliance",
    label: "Duty & USB",
    renderIcon: (color) => <ShieldCheck size={14} color={color} />,
  },
  {
    id: "finops",
    label: "FinOps & PO",
    renderIcon: (color) => <CreditCard size={14} color={color} />,
  },
  {
    id: "analytics",
    label: "Analytics",
    renderIcon: (color) => <BarChart3 size={14} color={color} />,
  },
  {
    id: "webhooks",
    label: "Webhooks",
    renderIcon: (color) => <Webhook size={14} color={color} />,
  },
];

export default function AdminCommandCenterScreen() {
  const queryClient = useQueryClient();
  const themeMode = useAppStore((s) => s.themeMode);
  const palette = getPalette(themeMode);

  const { session } = useSession();
  const role = session?.role ?? "EMPLOYEE";
  const canViewAudit = role === "IT_ADMIN" || role === "FINOPS_AUDITOR";
  const isItAdmin = role === "IT_ADMIN";

  const [activeModule, setActiveModule] = useState<AdminModule>("compliance");
  const [actionBanner, setActionBanner] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);
  const [togglingAssetId, setTogglingAssetId] = useState<string | null>(null);
  const [replenishSheetOpen, setReplenishSheetOpen] = useState(false);
  const [replenishError, setReplenishError] = useState<string | null>(null);
  const [receptionPo, setReceptionPo] = useState<PurchaseOrder | null>(null);
  const [receptionError, setReceptionError] = useState<string | null>(null);
  const [inspectedWebhook, setInspectedWebhook] =
    useState<WebhookEvent | null>(null);

  useEffect(() => {
    setActionBanner(null);
  }, [role]);

  const lockersQuery = useQuery({
    queryKey: QUERY_KEYS.lockers,
    queryFn: () => kioskApi.getLockers(),
    staleTime: 15_000,
  });

  const complianceQuery = useQuery({
    queryKey: [...QUERY_KEYS.compliance, role],
    queryFn: () => kioskApi.getCompliance(),
    enabled: canViewAudit,
    staleTime: 15_000,
    retry: false,
  });

  const finopsQuery = useQuery({
    queryKey: [...QUERY_KEYS.finops, role],
    queryFn: () => kioskApi.getFinops(),
    enabled: canViewAudit,
    staleTime: 15_000,
    retry: false,
  });

  const analyticsQuery = useQuery({
    queryKey: [...QUERY_KEYS.analytics, role],
    queryFn: () => kioskApi.getAnalytics(),
    enabled: canViewAudit,
    staleTime: 15_000,
    retry: false,
  });

  const webhooksQuery = useQuery({
    queryKey: [...QUERY_KEYS.webhooks, role],
    queryFn: () => kioskApi.getWebhooks(),
    enabled: isItAdmin,
    staleTime: 10_000,
    retry: false,
  });

  const toggleWhitelistMutation = useMutation({
    mutationFn: async (input: { assetId: string; hidWhitelisted: boolean }) => {
      setTogglingAssetId(input.assetId);
      return kioskApi.toggleWhitelist(input);
    },
    onSuccess: async (data) => {
      await haptics.success();
      setActionBanner({ kind: "success", text: data.message });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.compliance });
    },
    onError: async (err) => {
      await haptics.error();
      setActionBanner({
        kind: "error",
        text: err instanceof Error ? err.message : "Failed to update whitelist.",
      });
    },
    onSettled: () => {
      setTogglingAssetId(null);
    },
  });

  const replenishMutation = useMutation({
    mutationFn: async (payload: FinOpsReplenishPayload) => {
      setReplenishError(null);
      return kioskApi.createFinopsReplenishment({
        ...payload,
        vendorName:
          payload.procurementMode === "DOMESTIC_WHOLESALE"
            ? "Ingram Micro India B2B Authorized"
            : "B2B Wholesale AV International",
      });
    },
    onSuccess: async (data) => {
      await haptics.success();
      setReplenishSheetOpen(false);
      setActionBanner({
        kind: "success",
        text: `${data.message} Invoice ${data.transaction.gstInvoiceNumber} (${formatPaiseToINR(data.transaction.amountPaise)})`,
      });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.finops });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.analytics });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lockers });
    },
    onError: async (err) => {
      await haptics.error();
      setReplenishError(
        err instanceof Error ? err.message : "Failed to authorize PO."
      );
    },
  });

  const receptionMutation = useMutation({
    mutationFn: async (payload: ReceptionScanPayload) => {
      setReceptionError(null);
      return kioskApi.scanReceptionAsset(payload);
    },
    onSuccess: async (data) => {
      await haptics.success();
      setReceptionPo(null);
      setActionBanner({ kind: "success", text: data.message });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.finops });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.compliance });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lockers });
    },
    onError: async (err) => {
      await haptics.error();
      setReceptionError(
        err instanceof Error
          ? err.message
          : "Reception intake failed. Verify serial uniqueness and bay."
      );
    },
  });

  const triggerServiceNowMutation = useMutation({
    mutationFn: () => kioskApi.triggerMockServiceNowWebhook(),
    onSuccess: async (data) => {
      await haptics.success();
      setActionBanner({
        kind: "success",
        text: `Inbound ServiceNow webhook logged: ${data.externalEventId}`,
      });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.webhooks });
    },
    onError: async (err) => {
      await haptics.error();
      setActionBanner({
        kind: "error",
        text: err instanceof Error ? err.message : "ServiceNow simulation failed.",
      });
    },
  });

  const triggerZendeskMutation = useMutation({
    mutationFn: () => kioskApi.triggerMockZendeskWebhook(),
    onSuccess: async (data) => {
      await haptics.success();
      setActionBanner({
        kind: "success",
        text: `Inbound Zendesk webhook logged: ${data.externalEventId}`,
      });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.webhooks });
    },
    onError: async (err) => {
      await haptics.error();
      setActionBanner({
        kind: "error",
        text: err instanceof Error ? err.message : "Zendesk simulation failed.",
      });
    },
  });

  const replayWebhookMutation = useMutation({
    mutationFn: (webhookEventId: string) =>
      kioskApi.replayWebhook({ webhookEventId }),
    onSuccess: async (data) => {
      await haptics.success();
      setInspectedWebhook(null);
      setActionBanner({ kind: "success", text: data.message });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.webhooks });
    },
    onError: async (err) => {
      await haptics.error();
      setActionBanner({
        kind: "error",
        text: err instanceof Error ? err.message : "Webhook replay failed.",
      });
    },
  });

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({
      queryKey:
        activeModule === "compliance"
          ? QUERY_KEYS.compliance
          : activeModule === "finops"
          ? QUERY_KEYS.finops
          : activeModule === "analytics"
          ? QUERY_KEYS.analytics
          : QUERY_KEYS.webhooks,
    });
  };

  const isForbiddenError = (err: unknown) =>
    err instanceof ApiClientError && err.status === 403;

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 42, gap: 14 }}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => void handleRefresh()}
            tintColor={palette.primaryText}
          />
        }
      >
        <ScreenHeader
          title="Command Center"
          subtitle="USB zero-trust policy, customs duty, FinOps POs, and telemetry."
        />

        {/* Sleek Horizontal Segmented Module Strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
        >
          {MODULES.map((mod) => {
            const active = activeModule === mod.id;
            const iconColor = active ? "#FFFFFF" : palette.mutedForeground;
            return (
              <Pressable
                key={mod.id}
                accessibilityRole="tab"
                accessibilityLabel={mod.label}
                accessibilityState={{ selected: active }}
                onPress={() => {
                  void haptics.selection();
                  setActiveModule(mod.id);
                  setActionBanner(null);
                }}
                style={{
                  minHeight: 42,
                  paddingHorizontal: 14,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: active ? palette.primary : palette.border,
                  backgroundColor: active ? palette.primary : palette.card,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                {mod.renderIcon(iconColor)}
                <Text
                  style={{
                    color: active ? "#FFFFFF" : palette.foreground,
                    fontSize: 12.5,
                    fontWeight: active ? "800" : "600",
                  }}
                >
                  {mod.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {actionBanner ? (
          <View
            style={{
              backgroundColor:
                actionBanner.kind === "success"
                  ? palette.emeraldSoft
                  : palette.destructiveSoft,
              borderRadius: 14,
              padding: 12,
              flexDirection: "row",
              alignItems: "center",
              gap: 9,
            }}
          >
            {actionBanner.kind === "success" ? (
              <CheckCircle2 size={16} color={palette.emerald} />
            ) : (
              <AlertTriangle size={16} color={palette.destructive} />
            )}
            <Text
              style={{
                color:
                  actionBanner.kind === "success"
                    ? palette.emerald
                    : palette.destructive,
                fontSize: 12.5,
                fontWeight: "700",
                flex: 1,
              }}
            >
              {actionBanner.text}
            </Text>
          </View>
        ) : null}

        {/* MODULE 1: ZERO-TRUST & DUTY */}
        {activeModule === "compliance" ? (
          <View style={{ gap: 14 }}>
            {!canViewAudit || isForbiddenError(complianceQuery.error) ? (
              <RbacBanner requiredLabel="IT Admin or FinOps Auditor" />
            ) : null}

            <LandedCostCalculator />

            {canViewAudit && complianceQuery.isLoading ? (
              <ChamferCard style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <ActivityIndicator size="small" color={palette.primaryText} />
                <Text style={{ color: palette.mutedForeground, fontSize: 12.5 }}>
                  Loading Zero-Trust USB asset registry...
                </Text>
              </ChamferCard>
            ) : complianceQuery.data?.assets ? (
              <AssetRegistrySection
                assets={complianceQuery.data.assets}
                role={role}
                togglingAssetId={togglingAssetId}
                onToggleWhitelist={(assetId, nextValue) =>
                  toggleWhitelistMutation.mutate({
                    assetId,
                    hidWhitelisted: nextValue,
                  })
                }
              />
            ) : null}
          </View>
        ) : null}

        {/* MODULE 2: FINOPS & POs */}
        {activeModule === "finops" ? (
          !canViewAudit || isForbiddenError(finopsQuery.error) ? (
            <RbacBanner requiredLabel="IT Admin or FinOps Auditor" />
          ) : finopsQuery.isLoading ? (
            <ChamferCard style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <ActivityIndicator size="small" color={palette.primaryText} />
              <Text style={{ color: palette.mutedForeground, fontSize: 12.5 }}>
                Loading corporate card transactions & PO ledger...
              </Text>
            </ChamferCard>
          ) : finopsQuery.isError ? (
            <ChamferCard tone="crimson" style={{ gap: 10 }}>
              <Text style={{ color: palette.destructive, fontSize: 13.5, fontWeight: "700" }}>
                Failed to load FinOps ledger.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => void finopsQuery.refetch()}
                style={{
                  minHeight: 44,
                  borderRadius: 12,
                  backgroundColor: palette.destructive,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#FFFFFF", fontSize: 12.5, fontWeight: "800" }}>
                  Retry
                </Text>
              </Pressable>
            </ChamferCard>
          ) : finopsQuery.data ? (
            <View style={{ gap: 12 }}>
              {/* KPI Metrics Strip */}
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                <KpiTile
                  title="Wholesale Saved"
                  value={formatPaiseToINR(finopsQuery.data.totalSavingsPaise)}
                  accentColor={palette.emerald}
                  palette={palette}
                />
                <KpiTile
                  title="Card Limit"
                  value="₹1,00,000.00"
                  accentColor={palette.sky}
                  palette={palette}
                />
                <KpiTile
                  title="ERP Synced"
                  value="100%"
                  accentColor={palette.primaryText}
                  palette={palette}
                />
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Authorize B2B Replenishment PO"
                disabled={!isItAdmin}
                onPress={() => {
                  void haptics.tap();
                  setReplenishError(null);
                  setReplenishSheetOpen(true);
                }}
                style={{
                  minHeight: 48,
                  borderRadius: 14,
                  backgroundColor: palette.primary,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  opacity: isItAdmin ? 1 : 0.5,
                }}
              >
                <Plus size={17} color="#FFFFFF" />
                <Text style={{ color: "#FFFFFF", fontSize: 13.5, fontWeight: "800" }}>
                  {isItAdmin
                    ? "Authorize B2B Replenishment"
                    : "IT Admin Required for POs"}
                </Text>
              </Pressable>

              {/* Purchase Orders + Reception Intake */}
              <Text
                style={{
                  color: palette.foreground,
                  fontSize: 15,
                  fontWeight: "800",
                  letterSpacing: -0.2,
                  marginTop: 2,
                }}
              >
                Purchase Orders ({finopsQuery.data.purchaseOrders.length})
              </Text>

              {finopsQuery.data.purchaseOrders.map((po) => {
                const isPending = po.status === "PENDING_RECEPTION";
                return (
                  <ChamferCard
                    key={po.id}
                    tone={isPending ? "amber" : "default"}
                    style={{ gap: 8 }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <Text
                        style={{
                          color: palette.foreground,
                          fontSize: 14.5,
                          fontWeight: "800",
                          letterSpacing: -0.2,
                        }}
                      >
                        {po.poNumber}
                      </Text>
                      <StatusBadge
                        label={formatEnumLabel(po.status)}
                        variant={isPending ? "amber" : "emerald"}
                        compact
                      />
                    </View>
                    <Text style={{ color: palette.mutedForeground, fontSize: 12 }}>
                      {po.vendorName} · {formatEnumLabel(po.procurementMode)}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: palette.foreground,
                          fontSize: 13.5,
                          fontWeight: "800",
                          fontVariant: ["tabular-nums"],
                        }}
                      >
                        Total {formatPaiseToINR(po.totalAmountPaise)}
                      </Text>
                      <Text
                        style={{
                          color: palette.mutedForeground,
                          fontSize: 11.5,
                          fontVariant: ["tabular-nums"],
                        }}
                      >
                        Duty {formatPaiseToINR(po.landedDutyPaise)}
                      </Text>
                    </View>

                    {isPending && isItAdmin ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Scan and stock hardware for ${po.poNumber}`}
                        onPress={() => {
                          void haptics.tap();
                          setReceptionError(null);
                          setReceptionPo(po);
                        }}
                        style={{
                          minHeight: 44,
                          borderRadius: 12,
                          backgroundColor: palette.emeraldSoft,
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          marginTop: 2,
                        }}
                      >
                        <PackageCheck size={15} color={palette.emerald} />
                        <Text
                          style={{
                            color: palette.emerald,
                            fontSize: 12.5,
                            fontWeight: "800",
                          }}
                        >
                          Scan & Stock Hardware
                        </Text>
                      </Pressable>
                    ) : null}
                  </ChamferCard>
                );
              })}

              {/* Brex/Ramp-style Corporate Card & ERP Ledger */}
              <Text
                style={{
                  color: palette.foreground,
                  fontSize: 15,
                  fontWeight: "800",
                  letterSpacing: -0.2,
                  marginTop: 4,
                }}
              >
                CGST Rule 46 Card Ledger ({finopsQuery.data.transactions.length})
              </Text>

              {finopsQuery.data.transactions.map((txn) => (
                <ChamferCard key={txn.id} style={{ gap: 8 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 10,
                    }}
                  >
                    <Text
                      style={{
                        color: palette.foreground,
                        fontSize: 13.5,
                        fontWeight: "800",
                        flex: 1,
                      }}
                    >
                      {txn.itemsSummary}
                    </Text>
                    <Text
                      style={{
                        color: palette.emerald,
                        fontSize: 14,
                        fontWeight: "800",
                        fontVariant: ["tabular-nums"],
                      }}
                    >
                      {formatPaiseToINR(txn.amountPaise)}
                    </Text>
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 6,
                    }}
                  >
                    <Text style={{ color: palette.mutedForeground, fontSize: 11.5 }}>
                      {formatEnumLabel(txn.provider)} · MCC {txn.mccCode} · Inv{" "}
                      {txn.gstInvoiceNumber}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                      <View
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 999,
                          backgroundColor: palette.emerald,
                        }}
                      />
                      <Text
                        style={{
                          color: palette.emerald,
                          fontSize: 11,
                          fontWeight: "700",
                        }}
                      >
                        {formatEnumLabel(txn.erpSyncTarget)}{" "}
                        {formatEnumLabel(txn.erpSyncStatus)}
                      </Text>
                    </View>
                  </View>
                </ChamferCard>
              ))}
            </View>
          ) : null
        ) : null}

        {/* MODULE 3: ANALYTICS & HUBS */}
        {activeModule === "analytics" ? (
          !canViewAudit || isForbiddenError(analyticsQuery.error) ? (
            <RbacBanner requiredLabel="IT Admin or FinOps Auditor" />
          ) : analyticsQuery.isLoading ? (
            <ChamferCard style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <ActivityIndicator size="small" color={palette.primaryText} />
              <Text style={{ color: palette.mutedForeground, fontSize: 12.5 }}>
                Computing 14-day shrinkage anomalies & floor telemetry...
              </Text>
            </ChamferCard>
          ) : analyticsQuery.data ? (
            <View style={{ gap: 12 }}>
              {/* Financial Summary */}
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                <KpiTile
                  title="Resolved"
                  value={String(
                    analyticsQuery.data.financialSummary.totalIncidentsResolved
                  )}
                  accentColor={palette.primaryText}
                  palette={palette}
                />
                <KpiTile
                  title="Retail Avoided"
                  value={formatPaiseToINR(
                    analyticsQuery.data.financialSummary.totalRetailAvoidedPaise
                  )}
                  accentColor={palette.sky}
                  palette={palette}
                />
                <KpiTile
                  title="Net Savings"
                  value={formatPaiseToINR(
                    analyticsQuery.data.financialSummary.netSavingsPaise
                  )}
                  accentColor={palette.emerald}
                  palette={palette}
                />
              </View>

              {/* 14-Day Room Anomalies */}
              <Text
                style={{
                  color: palette.foreground,
                  fontSize: 15,
                  fontWeight: "800",
                  letterSpacing: -0.2,
                  marginTop: 2,
                }}
              >
                14-Day Shrinkage Anomalies
              </Text>
              {analyticsQuery.data.anomalyAlerts.length === 0 ? (
                <ChamferCard tone="emerald">
                  <Text
                    style={{
                      color: palette.emerald,
                      fontSize: 13,
                      fontWeight: "700",
                    }}
                  >
                    All meeting rooms remain within threshold (&lt; 4 unreturned adapters in 14d).
                  </Text>
                </ChamferCard>
              ) : (
                analyticsQuery.data.anomalyAlerts.map((alert) => (
                  <ChamferCard key={alert.roomId} tone="crimson" style={{ gap: 6 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 6,
                      }}
                    >
                      <Text
                        style={{
                          color: palette.foreground,
                          fontSize: 14,
                          fontWeight: "800",
                        }}
                      >
                        {alert.roomName} (Floor {alert.floor})
                      </Text>
                      <StatusBadge
                        label={`${alert.unreturnedCount14Days} Unreturned (14d)`}
                        variant="crimson"
                        compact
                      />
                    </View>
                    <Text
                      style={{
                        color: palette.mutedForeground,
                        fontSize: 12,
                        lineHeight: 17,
                      }}
                    >
                      {alert.recommendation}
                    </Text>
                  </ChamferCard>
                ))
              )}

              {/* Floor Occupancy Health */}
              <Text
                style={{
                  color: palette.foreground,
                  fontSize: 15,
                  fontWeight: "800",
                  letterSpacing: -0.2,
                  marginTop: 2,
                }}
              >
                Hub Occupancy & Thermal Health
              </Text>
              {analyticsQuery.data.floorMetrics.map((metric) => (
                <ChamferCard key={metric.lockerId} style={{ gap: 9 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: palette.foreground,
                        fontSize: 14,
                        fontWeight: "800",
                        flex: 1,
                      }}
                    >
                      {formatLockerHubLabel(metric.floor, metric.lockerName)}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Thermometer size={13} color={palette.sky} />
                      <Text
                        style={{
                          color: palette.sky,
                          fontSize: 12,
                          fontWeight: "700",
                          fontVariant: ["tabular-nums"],
                        }}
                      >
                        {(metric.temperatureC ?? 22.5).toFixed(1)}°C
                      </Text>
                    </View>
                  </View>

                  <View
                    style={{
                      height: 6,
                      borderRadius: 999,
                      backgroundColor: palette.muted,
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(0, metric.occupancyRatePercent)
                        )}%`,
                        height: "100%",
                        borderRadius: 999,
                        backgroundColor: palette.primary,
                      }}
                    />
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 6,
                    }}
                  >
                    <Text
                      style={{
                        color: palette.mutedForeground,
                        fontSize: 12,
                        fontWeight: "600",
                        fontVariant: ["tabular-nums"],
                      }}
                    >
                      {metric.occupiedBays}/{metric.totalBays} in bay (
                      {metric.occupancyRatePercent}%) · {metric.checkedOutBays} checked out
                    </Text>
                    {metric.quarantinedBays > 0 ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <View
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 999,
                            backgroundColor: palette.destructive,
                          }}
                        />
                        <Text
                          style={{
                            color: palette.destructive,
                            fontSize: 11.5,
                            fontWeight: "700",
                          }}
                        >
                          {metric.quarantinedBays} Quarantined
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </ChamferCard>
              ))}

              <ProcurementBarChart
                trends={analyticsQuery.data.consumptionTrends}
              />
            </View>
          ) : null
        ) : null}

        {/* MODULE 4: ITSM WEBHOOKS */}
        {activeModule === "webhooks" ? (
          !isItAdmin || isForbiddenError(webhooksQuery.error) ? (
            <RbacBanner requiredLabel="IT Admin" onlyItAdmin />
          ) : (
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Trigger Mock ServiceNow Webhook Event"
                  disabled={triggerServiceNowMutation.isPending}
                  onPress={() => triggerServiceNowMutation.mutate()}
                  style={{
                    minHeight: 46,
                    flex: 1,
                    minWidth: 145,
                    borderRadius: 12,
                    backgroundColor: palette.primary,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    paddingHorizontal: 10,
                  }}
                >
                  <Send size={14} color="#FFFFFF" />
                  <Text style={{ color: "#FFFFFF", fontSize: 12.5, fontWeight: "800" }}>
                    Simulate ServiceNow
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Trigger Mock Zendesk Webhook Event"
                  disabled={triggerZendeskMutation.isPending}
                  onPress={() => triggerZendeskMutation.mutate()}
                  style={{
                    minHeight: 46,
                    flex: 1,
                    minWidth: 145,
                    borderRadius: 12,
                    backgroundColor: palette.card,
                    borderWidth: 1,
                    borderColor: palette.borderStrong,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    paddingHorizontal: 10,
                  }}
                >
                  <Webhook size={14} color={palette.foreground} />
                  <Text
                    style={{
                      color: palette.foreground,
                      fontSize: 12.5,
                      fontWeight: "700",
                    }}
                  >
                    Simulate Zendesk
                  </Text>
                </Pressable>
              </View>

              {webhooksQuery.isLoading ? (
                <ChamferCard style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <ActivityIndicator size="small" color={palette.primaryText} />
                  <Text style={{ color: palette.mutedForeground, fontSize: 12.5 }}>
                    Loading ITSM webhook audit stream...
                  </Text>
                </ChamferCard>
              ) : webhooksQuery.data?.events ? (
                <View style={{ gap: 9 }}>
                  {webhooksQuery.data.events.map((evt) => {
                    const delivered =
                      evt.status === "SUCCESS" || evt.status === "REPLAYED";
                    return (
                      <Pressable
                        key={evt.id}
                        accessibilityRole="button"
                        accessibilityLabel={`Inspect webhook event ${evt.externalEventId ?? evt.id}`}
                        onPress={() => {
                          void haptics.tap();
                          setInspectedWebhook(evt);
                        }}
                      >
                        <ChamferCard style={{ gap: 7 }}>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 8,
                            }}
                          >
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <StatusBadge
                                label={formatEnumLabel(evt.source)}
                                variant="sapphire"
                                compact
                              />
                              <View
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                <View
                                  style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: 999,
                                    backgroundColor: delivered
                                      ? palette.emerald
                                      : palette.destructive,
                                  }}
                                />
                                <Text
                                  style={{
                                    color: delivered
                                      ? palette.emerald
                                      : palette.destructive,
                                    fontSize: 11.5,
                                    fontWeight: "700",
                                  }}
                                >
                                  {formatEnumLabel(evt.status)}
                                </Text>
                              </View>
                            </View>

                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <Text
                                style={{
                                  color: evt.signatureValid
                                    ? palette.emerald
                                    : palette.destructive,
                                  fontSize: 11,
                                  fontWeight: "700",
                                }}
                              >
                                {evt.signatureValid ? "HMAC Valid" : "Invalid Sig"}
                              </Text>
                              <ChevronRight
                                size={15}
                                color={palette.mutedForeground}
                              />
                            </View>
                          </View>

                          <Text
                            style={{
                              color: palette.foreground,
                              fontSize: 13.5,
                              fontWeight: "800",
                            }}
                          >
                            {evt.externalEventId ?? evt.id}
                          </Text>

                          <View
                            style={{
                              flexDirection: "row",
                              justifyContent: "space-between",
                            }}
                          >
                            <Text
                              style={{ color: palette.mutedForeground, fontSize: 11 }}
                            >
                              {formatEnumLabel(evt.direction)} · {evt.latencyMs}ms · Tap to inspect
                            </Text>
                            <Text
                              style={{
                                color: palette.mutedForeground,
                                fontSize: 11,
                                fontVariant: ["tabular-nums"],
                              }}
                            >
                              {formatShortTimestamp(evt.createdAt)}
                            </Text>
                          </View>
                        </ChamferCard>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
            </View>
          )
        ) : null}
      </ScrollView>

      <FinOpsReplenishSheet
        visible={replenishSheetOpen}
        skus={finopsQuery.data?.skus ?? []}
        submitting={replenishMutation.isPending}
        errorMessage={replenishError}
        onClose={() => setReplenishSheetOpen(false)}
        onSubmit={(payload) => replenishMutation.mutate(payload)}
      />

      <ReceptionScanModal
        purchaseOrder={receptionPo}
        lockers={lockersQuery.data?.lockers ?? []}
        submitting={receptionMutation.isPending}
        errorMessage={receptionError}
        onClose={() => setReceptionPo(null)}
        onSubmit={(payload) => receptionMutation.mutate(payload)}
      />

      <WebhookInspectorModal
        event={inspectedWebhook}
        replaying={replayWebhookMutation.isPending}
        onClose={() => setInspectedWebhook(null)}
        onReplay={(id) => replayWebhookMutation.mutate(id)}
      />
    </View>
  );
}

function KpiTile({
  title,
  value,
  accentColor,
  palette,
}: {
  title: string;
  value: string;
  accentColor: string;
  palette: ReturnType<typeof getPalette>;
}) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: 104,
        backgroundColor: palette.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: palette.border,
        paddingHorizontal: 12,
        paddingVertical: 13,
        justifyContent: "space-between",
        gap: 6,
      }}
    >
      <Text
        numberOfLines={2}
        style={{
          color: palette.mutedForeground,
          fontSize: 11,
          lineHeight: 14,
          fontWeight: "700",
        }}
      >
        {title}
      </Text>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{
          color: accentColor,
          fontSize: 17,
          fontWeight: "800",
          letterSpacing: -0.3,
          fontVariant: ["tabular-nums"],
        }}
      >
        {value}
      </Text>
    </View>
  );
}
