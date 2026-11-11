import React, { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Lock, Search, ShieldCheck, ShieldOff } from "lucide-react-native";
import { ChamferCard } from "@/components/ui/ChamferCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
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
        }}
      >
        <Text
          style={{
            color: palette.foreground,
            fontSize: 15,
            fontWeight: "800",
            flex: 1,
          }}
        >
          Zero-Trust USB Asset Registry ({filtered.length})
        </Text>
        {!canModifyPolicy ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Lock size={12} color={palette.amber} />
            <Text style={{ color: palette.amber, fontSize: 11, fontWeight: "700" }}>
              IT_ADMIN to toggle
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
          borderRadius: 12,
          borderWidth: 1,
          borderColor: palette.border,
          backgroundColor: palette.card,
          paddingHorizontal: 12,
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
          }}
        />
      </View>

      {/* Filter Pills */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        {(["ALL", "WHITELISTED", "BLOCKED", "QUARANTINED"] as const).map(
          (item) => {
            const active = filter === item;
            return (
              <Pressable
                key={item}
                accessibilityRole="button"
                accessibilityLabel={`Filter assets by ${item}`}
                accessibilityState={{ selected: active }}
                onPress={() => {
                  void haptics.selection();
                  setFilter(item);
                }}
                style={{
                  minHeight: 44,
                  paddingHorizontal: 12,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: active ? palette.primary : palette.border,
                  backgroundColor: active
                    ? themeMode === "dark"
                      ? "rgba(59, 130, 246, 0.16)"
                      : "rgba(37, 99, 235, 0.10)"
                    : palette.card,
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
                  {item}
                </Text>
              </Pressable>
            );
          }
        )}
      </View>

      {/* Responsive Asset Cards (No HTML Tables) */}
      {filtered.map((asset) => {
        const isQuarantined =
          asset.availability === "QUARANTINED" || asset.condition !== "HEALTHY";
        const busy = togglingAssetId === asset.id;

        return (
          <ChamferCard
            key={asset.id}
            tone={
              !asset.hidWhitelisted || isQuarantined ? "crimson" : "default"
            }
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
              <View style={{ flex: 1, minWidth: 160 }}>
                <Text
                  style={{
                    color: palette.foreground,
                    fontSize: 14,
                    fontWeight: "800",
                  }}
                >
                  {asset.serialNumber}
                </Text>
                <Text
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
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: asset.hidWhitelisted
                    ? palette.emerald
                    : palette.destructive,
                  backgroundColor: asset.hidWhitelisted
                    ? palette.emeraldSoft
                    : palette.destructiveSoft,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                  opacity: canModifyPolicy && !busy ? 1 : 0.55,
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
                    fontSize: 11,
                    fontWeight: "800",
                  }}
                >
                  {asset.hidWhitelisted ? "WHITELISTED" : "BLOCKED"}
                </Text>
              </Pressable>
            </View>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              <StatusBadge
                label={`USB ${asset.usbVendorId}:${asset.usbProductId}`}
                variant="slate"
                compact
              />
              <StatusBadge
                label={`${asset.condition} · ${asset.availability}`}
                variant={isQuarantined ? "amber" : "emerald"}
                compact
              />
              {asset.sku?.wpcEtaCertNumber ? (
                <StatusBadge
                  label={`WPC ${asset.sku.wpcEtaCertNumber}`}
                  variant="sky"
                  compact
                />
              ) : null}
              {asset.sku?.bisCrsNumber ? (
                <StatusBadge
                  label={`BIS ${asset.sku.bisCrsNumber}`}
                  variant="sapphire"
                  compact
                />
              ) : !asset.sku?.wpcEtaCertNumber ? (
                <StatusBadge label="Cabled" variant="slate" compact />
              ) : null}
            </View>

            {asset.compartment?.locker ? (
              <Text style={{ color: palette.mutedForeground, fontSize: 11 }}>
                Location: {asset.compartment.locker.name} · Bay #
                {asset.compartment.compartmentNumber} ({asset.compartment.status})
              </Text>
            ) : (
              <Text style={{ color: palette.mutedForeground, fontSize: 11 }}>
                Location: Outside Locker / Transit
              </Text>
            )}
          </ChamferCard>
        );
      })}
    </View>
  );
}

