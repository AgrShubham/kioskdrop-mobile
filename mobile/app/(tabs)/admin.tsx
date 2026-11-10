import React, { useState } from "react";
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
  CheckCircle2,
  PackageCheck,
  Plus,
  RefreshCw,
  Send,
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
import { formatPaiseToINR, formatShortTimestamp } from "@/lib/format";
import { haptics } from "@/lib/haptics";
import { getPalette } from "@/lib/theme";
import { useAppStore } from "@/store/app-store";
import type { PurchaseOrder, WebhookEvent } from "@/types/domain";

type AdminModule = "compliance" | "finops" | "analytics" | "webhooks";

const MODULES: Array<{ id: AdminModule; label: string }> = [
  { id: "compliance", label: "Zero-Trust & Duty" },
  { id: "finops", label: "FinOps & POs" },
  { id: "analytics", label: "Analytics & Hubs" },
  { id: "webhooks", label: "ITSM Webhooks" },
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
          badge="ENTERPRISE COMMAND CENTER"
          badgeVariant="sky"
          title="ITAM, FinOps & Telemetry"
          subtitle="Zero-Trust USB HID controls, statutory Indian duty stack, PO reception intake, savings analytics, and ITSM webhooks."
        />

        {/* Scrollable 4-Module Segmented Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
        >
          {MODULES.map((mod) => {
            const active = activeModule === mod.id;
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
                  minHeight: 44,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: active ? palette.primary : palette.border,
                  backgroundColor: active ? palette.primary : palette.card,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: active ? "#FFFFFF" : palette.foreground,
                    fontSize: 12,
                    fontWeight: "800",
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
              borderColor:
                actionBanner.kind === "success"
                  ? palette.emerald
                  : palette.destructive,
              borderWidth: 1,
              borderRadius: 12,
              padding: 12,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
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
                fontSize: 12,
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
              <RbacBanner requiredLabel="IT_ADMIN or FINOPS_AUDITOR" />
            ) : null}

            <LandedCostCalculator />

            {canViewAudit && complianceQuery.isLoading ? (
              <ChamferCard style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <ActivityIndicator size="small" color={palette.primaryText} />
                <Text style={{ color: palette.mutedForeground, fontSize: 12 }}>
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
            <RbacBanner requiredLabel="IT_ADMIN or FINOPS_AUDITOR" />
          ) : finopsQuery.isLoading ? (
            <ChamferCard style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <ActivityIndicator size="small" color={palette.primaryText} />
              <Text style={{ color: palette.mutedForeground, fontSize: 12 }}>
                Loading corporate card transactions & PO ledger...
              </Text>
            </ChamferCard>
          ) : finopsQuery.isError ? (
            <ChamferCard tone="crimson" style={{ gap: 10 }}>
              <Text style={{ color: palette.destructive, fontSize: 13, fontWeight: "700" }}>
                Failed to load FinOps ledger.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => void finopsQuery.refetch()}
                style={{
                  minHeight: 44,
                  borderRadius: 10,
                  backgroundColor: palette.destructive,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "800" }}>
                  Retry
                </Text>
              </Pressable>
            </ChamferCard>
          ) : finopsQuery.data ? (
            <View style={{ gap: 12 }}>
              {/* KPI Metrics Strip */}
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                <KpiTile
                  title="WHOLESALE SAVINGS"
                  value={formatPaiseToINR(finopsQuery.data.totalSavingsPaise)}
                  accentColor={palette.emerald}
                  palette={palette}
                />
                <KpiTile
                  title="MONTHLY CARD LIMIT"
                  value="₹1,00,000.00"
                  accentColor={palette.sky}
                  palette={palette}
                />
                <KpiTile
                  title="ERP RECONCILED"
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
                  borderRadius: 12,
                  backgroundColor: palette.primary,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  opacity: isItAdmin ? 1 : 0.5,
                }}
              >
                <Plus size={17} color="#FFFFFF" />
                <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "800" }}>
                  {isItAdmin
                    ? "Authorize B2B Replenishment"
                    : "IT_ADMIN Required to Authorize POs"}
                </Text>
              </Pressable>

              {/* Purchase Orders + Reception Intake */}
              <Text
                style={{
                  color: palette.foreground,
                  fontSize: 15,
                  fontWeight: "800",
                }}
              >
                Purchase Orders & Reception Intake (
                {finopsQuery.data.purchaseOrders.length})
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
                        {po.poNumber}
                      </Text>
                      <StatusBadge
                        label={po.status}
                        variant={isPending ? "amber" : "emerald"}
                        compact
                      />
                    </View>
                    <Text style={{ color: palette.mutedForeground, fontSize: 12 }}>
                      {po.vendorName} · {po.procurementMode}
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
                          fontSize: 13,
                          fontWeight: "800",
                        }}
                      >
                        Total: {formatPaiseToINR(po.totalAmountPaise)}
                      </Text>
                      <Text style={{ color: palette.mutedForeground, fontSize: 11 }}>
                        Duty: {formatPaiseToINR(po.landedDutyPaise)}
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
                          borderRadius: 10,
                          backgroundColor: palette.emeraldSoft,
                          borderWidth: 1,
                          borderColor: palette.emerald,
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                        }}
                      >
                        <PackageCheck size={15} color={palette.emerald} />
                        <Text
                          style={{
                            color: palette.emerald,
                            fontSize: 12,
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

              {/* FinOps Card & ERP Ledger */}
              <Text
                style={{
                  color: palette.foreground,
                  fontSize: 15,
                  fontWeight: "800",
                  marginTop: 4,
                }}
              >
                CGST Rule 46 Corporate Card Ledger (
                {finopsQuery.data.transactions.length})
              </Text>

              {finopsQuery.data.transactions.map((txn) => (
                <ChamferCard key={txn.id} style={{ gap: 6 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 6,
                    }}
                  >
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      <StatusBadge label={txn.provider} variant="sapphire" compact />
                      <StatusBadge label={`MCC ${txn.mccCode}`} variant="slate" compact />
                    </View>
                    <StatusBadge
                      label={`${txn.erpSyncTarget} · ${txn.erpSyncStatus}`}
                      variant="emerald"
                      compact
                    />
                  </View>

                  <Text
                    style={{
                      color: palette.foreground,
                      fontSize: 13,
                      fontWeight: "800",
                    }}
                  >
                    {txn.itemsSummary}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: palette.mutedForeground, fontSize: 11 }}>
                      GST Inv: {txn.gstInvoiceNumber}
                    </Text>
                    <Text
                      style={{
                        color: palette.emerald,
                        fontSize: 14,
                        fontWeight: "800",
                      }}
                    >
                      {formatPaiseToINR(txn.amountPaise)}
                    </Text>
                  </View>
                </ChamferCard>
              ))}
            </View>
          ) : null
        ) : null}

        {/* MODULE 3: ANALYTICS & HUBS */}
        {activeModule === "analytics" ? (
          !canViewAudit || isForbiddenError(analyticsQuery.error) ? (
            <RbacBanner requiredLabel="IT_ADMIN or FINOPS_AUDITOR" />
          ) : analyticsQuery.isLoading ? (
            <ChamferCard style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <ActivityIndicator size="small" color={palette.primaryText} />
              <Text style={{ color: palette.mutedForeground, fontSize: 12 }}>
                Computing 14-day shrinkage anomalies & floor telemetry...
              </Text>
            </ChamferCard>
          ) : analyticsQuery.data ? (
            <View style={{ gap: 12 }}>
              {/* Financial Summary */}
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                <KpiTile
                  title="INCIDENTS RESOLVED"
                  value={String(
                    analyticsQuery.data.financialSummary.totalIncidentsResolved
                  )}
                  accentColor={palette.primaryText}
                  palette={palette}
                />
                <KpiTile
                  title="RETAIL AVOIDED"
                  value={formatPaiseToINR(
                    analyticsQuery.data.financialSummary.totalRetailAvoidedPaise
                  )}
                  accentColor={palette.sky}
                  palette={palette}
                />
                <KpiTile
                  title="NET SAVINGS"
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
                }}
              >
                14-Day Unreturned Shrinkage Anomalies
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
                    No rooms exceed the &gt;= 4 unreturned adapter threshold in the 14-day window.
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
                        label={`${alert.unreturnedCount14Days} UNRETURNED (14D)`}
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
                }}
              >
                Floor Hub Occupancy & Thermal Health
              </Text>
              {analyticsQuery.data.floorMetrics.map((metric) => (
                <ChamferCard key={metric.lockerId} style={{ gap: 8 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text
                      style={{
                        color: palette.foreground,
                        fontSize: 14,
                        fontWeight: "800",
                      }}
                    >
                      Floor {metric.floor}: {metric.lockerName}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Thermometer size={13} color={palette.sky} />
                      <Text style={{ color: palette.sky, fontSize: 12, fontWeight: "700" }}>
                        {(metric.temperatureC ?? 22.5).toFixed(1)}°C
                      </Text>
                    </View>
                  </View>

                  <View
                    style={{
                      height: 8,
                      borderRadius: 999,
                      backgroundColor: palette.muted,
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        width: `${Math.min(100, Math.max(0, metric.occupancyRatePercent))}%`,
                        height: "100%",
                        backgroundColor: palette.primary,
                      }}
                    />
                  </View>

                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    <StatusBadge
                      label={`${metric.occupiedBays}/${metric.totalBays} IN BAY (${metric.occupancyRatePercent}%)`}
                      variant="emerald"
                      compact
                    />
                    <StatusBadge
                      label={`${metric.checkedOutBays} OUT`}
                      variant="sapphire"
                      compact
                    />
                    {metric.quarantinedBays > 0 ? (
                      <StatusBadge
                        label={`${metric.quarantinedBays} QUARANTINED`}
                        variant="crimson"
                        compact
                      />
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
            <RbacBanner requiredLabel="IT_ADMIN" onlyItAdmin />
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
                  <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "800" }}>
                    + Mock ServiceNow
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
                    backgroundColor: palette.muted,
                    borderWidth: 1,
                    borderColor: palette.border,
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
                      fontSize: 12,
                      fontWeight: "800",
                    }}
                  >
                    + Mock Zendesk
                  </Text>
                </Pressable>
              </View>

              {webhooksQuery.isLoading ? (
                <ChamferCard style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <ActivityIndicator size="small" color={palette.primaryText} />
                  <Text style={{ color: palette.mutedForeground, fontSize: 12 }}>
                    Loading ITSM webhook audit stream...
                  </Text>
                </ChamferCard>
              ) : webhooksQuery.data?.events ? (
                <View style={{ gap: 10 }}>
                  {webhooksQuery.data.events.map((evt) => (
                    <Pressable
                      key={evt.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Inspect webhook event ${evt.externalEventId ?? evt.id}`}
                      onPress={() => {
                        void haptics.tap();
                        setInspectedWebhook(evt);
                      }}
                    >
                      <ChamferCard style={{ gap: 6 }}>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: 6,
                          }}
                        >
                          <View style={{ flexDirection: "row", gap: 6 }}>
                            <StatusBadge label={evt.source} variant="sapphire" compact />
                            <StatusBadge label={evt.direction} variant="slate" compact />
                            <StatusBadge
                              label={evt.status}
                              variant={
                                evt.status === "SUCCESS" || evt.status === "REPLAYED"
                                  ? "emerald"
                                  : "crimson"
                              }
                              compact
                            />
                          </View>
                          <StatusBadge
                            label={evt.signatureValid ? "HMAC VALID" : "INVALID"}
                            variant={evt.signatureValid ? "emerald" : "crimson"}
                            compact
                          />
                        </View>
                        <Text
                          style={{
                            color: palette.foreground,
                            fontSize: 13,
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
                          <Text style={{ color: palette.mutedForeground, fontSize: 11 }}>
                            Latency: {evt.latencyMs}ms · Tap to inspect JSON
                          </Text>
                          <Text style={{ color: palette.mutedForeground, fontSize: 11 }}>
                            {formatShortTimestamp(evt.createdAt)}
                          </Text>
                        </View>
                      </ChamferCard>
                    </Pressable>
                  ))}
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
        minWidth: 105,
        backgroundColor: palette.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: palette.border,
        padding: 12,
        gap: 4,
      }}
    >
      <Text
        numberOfLines={1}
        style={{
          color: palette.mutedForeground,
          fontSize: 10,
          fontWeight: "800",
          letterSpacing: 0.6,
        }}
      >
        {title}
      </Text>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{
          color: accentColor,
          fontSize: 16,
          fontWeight: "800",
        }}
      >
        {value}
      </Text>
    </View>
  );
}
