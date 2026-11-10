import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { ShieldAlert, UserCheck } from "lucide-react-native";
import { ChamferCard } from "@/components/ui/ChamferCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useSession } from "@/hooks/useSession";
import { haptics } from "@/lib/haptics";
import { getPalette } from "@/lib/theme";
import { useAppStore } from "@/store/app-store";

interface RbacBannerProps {
  requiredLabel?: string;
  onlyItAdmin?: boolean;
}

export function RbacBanner({
  requiredLabel = "IT_ADMIN or FINOPS_AUDITOR",
  onlyItAdmin = false,
}: RbacBannerProps) {
  const themeMode = useAppStore((s) => s.themeMode);
  const palette = getPalette(themeMode);
  const { session, switchRole, isSwitchingRole } = useSession();

  return (
    <ChamferCard tone="amber" style={{ gap: 10 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 6,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <ShieldAlert size={18} color={palette.amber} />
          <Text
            style={{
              color: palette.foreground,
              fontSize: 15,
              fontWeight: "800",
            }}
          >
            Role Access Restricted ({session?.role ?? "EMPLOYEE"})
          </Text>
        </View>
        <StatusBadge label="403 RBAC ENFORCED" variant="amber" compact />
      </View>

      <Text
        style={{
          color: palette.mutedForeground,
          fontSize: 12,
          lineHeight: 18,
        }}
      >
        Your current session ({session?.name ?? "Aarav Sharma"}) does not hold{" "}
        {requiredLabel} privileges required for this module. Landed Cost previews remain open; switch persona below to unlock protected admin telemetry.
      </Text>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <Pressable
          testID="rbac-switch-it-admin"
          accessibilityRole="button"
          accessibilityLabel="Switch role to IT Admin Priya Patel"
          disabled={isSwitchingRole}
          onPress={() => {
            void haptics.tap();
            void switchRole({ role: "IT_ADMIN" });
          }}
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
            paddingHorizontal: 12,
            opacity: isSwitchingRole ? 0.65 : 1,
          }}
        >
          {isSwitchingRole ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <UserCheck size={15} color="#FFFFFF" />
          )}
          <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "800" }}>
            Switch to IT Admin (Priya)
          </Text>
        </Pressable>

        {!onlyItAdmin ? (
          <Pressable
            testID="rbac-switch-finops"
            accessibilityRole="button"
            accessibilityLabel="Switch role to FinOps Auditor Vikram Malhotra"
            disabled={isSwitchingRole}
            onPress={() => {
              void haptics.tap();
              void switchRole({ role: "FINOPS_AUDITOR" });
            }}
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
              paddingHorizontal: 12,
              opacity: isSwitchingRole ? 0.65 : 1,
            }}
          >
            <UserCheck size={15} color={palette.foreground} />
            <Text
              style={{
                color: palette.foreground,
                fontSize: 12,
                fontWeight: "700",
              }}
            >
              Switch to FinOps (Vikram)
            </Text>
          </Pressable>
        ) : null}
      </View>
    </ChamferCard>
  );
}

