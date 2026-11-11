import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { ShieldAlert, UserCheck } from "lucide-react-native";
import { ChamferCard } from "@/components/ui/ChamferCard";
import { useSession } from "@/hooks/useSession";
import { formatRoleLabel } from "@/lib/format";
import { haptics } from "@/lib/haptics";
import { getPalette } from "@/lib/theme";
import { useAppStore } from "@/store/app-store";

interface RbacBannerProps {
  requiredLabel?: string;
  onlyItAdmin?: boolean;
}

export function RbacBanner({
  requiredLabel = "IT Admin or FinOps Auditor",
  onlyItAdmin = false,
}: RbacBannerProps) {
  const themeMode = useAppStore((s) => s.themeMode);
  const palette = getPalette(themeMode);
  const { session, switchRole, isSwitchingRole } = useSession();

  const activeRoleText = formatRoleLabel(session?.role ?? "EMPLOYEE");

  return (
    <ChamferCard tone="amber" style={{ gap: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            backgroundColor: palette.amberSoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ShieldAlert size={18} color={palette.amber} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text
            style={{
              color: palette.foreground,
              fontSize: 15,
              fontWeight: "800",
              letterSpacing: -0.2,
            }}
          >
            Admin Access Required
          </Text>
          <Text
            style={{
              color: palette.amber,
              fontSize: 11,
              fontWeight: "700",
            }}
          >
            Signed in as {session?.name ?? "Aarav Sharma"} · {activeRoleText}
          </Text>
        </View>
      </View>

      <Text
        style={{
          color: palette.mutedForeground,
          fontSize: 12.5,
          lineHeight: 18,
        }}
      >
        This module requires {requiredLabel} privileges. Landed Cost previews stay unlocked below—switch roles to inspect live audit records.
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
          <Text style={{ color: "#FFFFFF", fontSize: 12.5, fontWeight: "800" }}>
            Use IT Admin (Priya)
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
              backgroundColor: palette.surfaceElevated,
              borderWidth: 1,
              borderColor: palette.borderStrong,
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
                fontSize: 12.5,
                fontWeight: "700",
              }}
            >
              Use FinOps (Vikram)
            </Text>
          </Pressable>
        ) : null}
      </View>
    </ChamferCard>
  );
}
