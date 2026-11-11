import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Lock, Search, ShieldCheck, ShieldOff, X } from "lucide-react-native";
import { ChamferCard } from "@/components/ui/ChamferCard";
import { formatEnumLabel } from "@/lib/format";
import { haptics } from "@/lib/haptics";
import { getPalette } from "@/lib/theme";
import { useAppStore } from "@/store/app-store";
import type { AssetItem, UserRole } from "@/types/domain";

interface AssetRegistrySectionProps {
  assets: AssetItem[];
  role: UserRole;
  togglingAssetId: string | null;
  onToggleWhitelist: (assetId: string, nextValue: boolean) => void;
}

type AssetFilter = "ALL" | "WHITELISTED" | "BLOCKED" | "QUARANTINED";

const FILTER_OPTIONS: Array<{ id: AssetFilter; label: string }> = [
  { id: "ALL", label: "All" },
  { id: "WHITELISTED", label: "Whitelisted" },
  { id: "BLOCKED", label: "Blocked" },
  { id: "QUARANTINED", label: "Quarantined" },
];

export function AssetRegistrySection({
  assets,
  role,
  togglingAssetId,
  onToggleWhitelist,
}: AssetRegistrySectionProps) {
  const themeMode = useAppStore((s) => s.themeMode);
  const palette = getPalette(themeMode);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<AssetFilter>("ALL");

  const canModifyPolicy = role === "IT_ADMIN";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return assets.filter((asset) => {
      if (filter === "WHITELISTED" && !asset.hidWhitelisted) return false;
      if (filter === "BLOCKED" && asset.hidWhitelisted) return false;
      if (
        filter === "QUARANTINED" &&
        asset.availability !== "QUARANTINED" &&
        asset.condition !== "DAMAGED" &&
        asset.condition !== "NEEDS_INSPECTION"
      ) {
        return false;
      }

      if (!q) return true;
      return (
        asset.serialNumber.toLowerCase().includes(q) ||
        (asset.sku?.name.toLowerCase().includes(q) ?? false) ||
        asset.usbVendorId.toLowerCase().includes(q) ||
        asset.usbProductId.toLowerCase().includes(q)
      );
    });
  }, [assets, filter, query]);

  return (
    <View style={{ gap: 10 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          marginTop: 2,
        }}
      >
        <Text
          style={{
            color: palette.foreground,
            fontSize: 15,
            fontWeight: "800",
            letterSpacing: -0.2,
            flex: 1,
          }}
        >
          Zero-Trust USB Registry ({filtered.length})
        </Text>
        {!canModifyPolicy ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Lock size={12} color={palette.amber} />
            <Text style={{ color: palette.amber, fontSize: 11, fontWeight: "700" }}>
              IT Admin to toggle
            </Text>
          </View>
        ) : null}
      </View>

      {/* Search Input */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          minHeight: 46,
          borderRadius: 13,
          borderWidth: 1,
          borderColor: palette.border,
          backgroundColor: palette.card,
          paddingLeft: 12,
          paddingRight: 6,
          gap: 8,
        }}
      >
        <Search size={16} color={palette.mutedForeground} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search serial, SKU, USB VID/PID..."
          placeholderTextColor={palette.mutedForeground}
          accessibilityLabel="Search asset registry"
          style={{
            flex: 1,
            color: palette.foreground,
            fontSize: 13,
            paddingVertical: 10,
          }}
        />
        {query.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear search query"
            onPress={() => setQuery("")}
            style={{
              minWidth: 36,
              minHeight: 36,
              borderRadius: 999,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={15} color={palette.mutedForeground} />
          </Pressable>
        ) : null}
      </View>

      {/* Horizontal Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 7 }}
      >
        {FILTER_OPTIONS.map((item) => {
          const active = filter === item.id;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={`Filter assets by ${item.label}`}
              accessibilityState={{ selected: active }}
              onPress={() => {
                void haptics.selection();
                setFilter(item.id);
              }}
              style={{
                minHeight: 40,
                paddingHorizontal: 14,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: active ? palette.primary : palette.border,
                backgroundColor: active ? palette.primarySoft : palette.card,
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: active ? palette.primaryText : palette.mutedForeground,
                  fontSize: 12,
                  fontWeight: active ? "800" : "600",
                }}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Clean Asset Cards */}
      {filtered.map((asset) => {
        const isQuarantined =
          asset.availability === "QUARANTINED" || asset.condition !== "HEALTHY";
        const busy = togglingAssetId === asset.id;

        const complianceCert = asset.sku?.wpcEtaCertNumber
          ? `WPC ${asset.sku.wpcEtaCertNumber}`
          : asset.sku?.bisCrsNumber
          ? `BIS ${asset.sku.bisCrsNumber}`
          : "Cabled";

        return (
          <ChamferCard
            key={asset.id}
            tone={!asset.hidWhitelisted || isQuarantined ? "crimson" : "default"}
            style={{ gap: 8 }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <View style={{ flex: 1, minWidth: 140, gap: 2 }}>
                <Text
                  style={{
                    color: palette.foreground,
                    fontSize: 14,
                    fontWeight: "800",
                    letterSpacing: -0.2,
                  }}
                >
                  {asset.serialNumber}
                </Text>
                <Text
                  numberOfLines={1}
                  style={{
                    color: palette.mutedForeground,
                    fontSize: 12,
                    fontWeight: "600",
                  }}
                >
                  {asset.sku?.name ?? asset.skuId}
                </Text>
              </View>

              <Pressable
                testID={`hid-toggle-${asset.id}`}
                accessibilityRole="button"
                accessibilityLabel={`HID whitelist status for ${asset.serialNumber}: ${
                  asset.hidWhitelisted ? "WHITELISTED" : "BLOCKED"
                }`}
                accessibilityState={{
                  disabled: !canModifyPolicy || busy,
                  checked: asset.hidWhitelisted,
                }}
                disabled={!canModifyPolicy || busy}
                onPress={() => {
                  void haptics.tap();
                  onToggleWhitelist(asset.id, !asset.hidWhitelisted);
                }}
                style={{
                  minHeight: 44,
                  paddingHorizontal: 12,
                  borderRadius: 11,
                  backgroundColor: asset.hidWhitelisted
                    ? palette.emeraldSoft
                    : palette.destructiveSoft,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  opacity: canModifyPolicy && !busy ? 1 : 0.6,
                }}
              >
                {asset.hidWhitelisted ? (
                  <ShieldCheck size={14} color={palette.emerald} />
                ) : (
                  <ShieldOff size={14} color={palette.destructive} />
                )}
                <Text
                  style={{
                    color: asset.hidWhitelisted
                      ? palette.emerald
                      : palette.destructive,
                    fontSize: 11.5,
                    fontWeight: "800",
                  }}
                >
                  {asset.hidWhitelisted ? "Whitelisted" : "Blocked"}
                </Text>
              </Pressable>
            </View>

            {/* Concise Single Metadata Row */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 6,
                paddingTop: 2,
              }}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  backgroundColor: isQuarantined
                    ? palette.amber
                    : palette.emerald,
                }}
              />
              <Text
                style={{
                  color: isQuarantined ? palette.amber : palette.emerald,
                  fontSize: 11.5,
                  fontWeight: "700",
                }}
              >
                {formatEnumLabel(asset.condition)} ·{" "}
                {formatEnumLabel(asset.availability)}
              </Text>
              <Text style={{ color: palette.mutedForeground, fontSize: 11.5 }}>
                · USB {asset.usbVendorId}:{asset.usbProductId} · {complianceCert}
              </Text>
            </View>

            <Text style={{ color: palette.mutedForeground, fontSize: 11 }}>
              {asset.compartment?.locker
                ? `${asset.compartment.locker.name} · Bay #${asset.compartment.compartmentNumber} (${formatEnumLabel(asset.compartment.status)})`
                : "Outside locker · In transit or unassigned"}
            </Text>
          </ChamferCard>
        );
      })}
    </View>
  );
}
