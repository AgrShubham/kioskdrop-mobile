import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { kioskApi } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { setStoredSessionToken } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";
import type { UserRole } from "@/types/domain";

export const QUERY_KEYS = {
  session: ["session", "current"] as const,
  rooms: ["rooms"] as const,
  lockers: ["lockers"] as const,
  compliance: ["admin", "compliance"] as const,
  finops: ["admin", "finops"] as const,
  analytics: ["admin", "analytics"] as const,
  webhooks: ["admin", "webhooks"] as const,
};

export function useSession() {
  const queryClient = useQueryClient();
  const apiBaseUrlOverride = useAppStore((s) => s.apiBaseUrlOverride);

  const sessionQuery = useQuery({
    queryKey: [...QUERY_KEYS.session, apiBaseUrlOverride ?? "auto"],
    queryFn: () => kioskApi.getSessionCurrent(),
    staleTime: 30_000,
    retry: 1,
  });

  const switchRoleMutation = useMutation({
    mutationFn: async (payload: { role?: UserRole; userId?: string }) => {
      const result = await kioskApi.switchRole(payload);
      await setStoredSessionToken(result.token);
      return result;
    },
    onSuccess: async (result) => {
      await haptics.success();
      queryClient.setQueryData(
        [...QUERY_KEYS.session, apiBaseUrlOverride ?? "auto"],
        (
          prev:
            | Awaited<ReturnType<typeof kioskApi.getSessionCurrent>>
            | undefined
        ) =>
          prev
            ? { ...prev, session: result.session }
            : { success: true, session: result.session, availableUsers: [] }
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.session }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lockers }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.rooms }),
        queryClient.removeQueries({ queryKey: QUERY_KEYS.compliance }),
        queryClient.removeQueries({ queryKey: QUERY_KEYS.finops }),
        queryClient.removeQueries({ queryKey: QUERY_KEYS.analytics }),
        queryClient.removeQueries({ queryKey: QUERY_KEYS.webhooks }),
      ]);
    },
    onError: async () => {
      await haptics.error();
    },
  });

  return {
    session: sessionQuery.data?.session ?? null,
    availableUsers: sessionQuery.data?.availableUsers ?? [],
    isLoading: sessionQuery.isLoading,
    isError: sessionQuery.isError,
    error: sessionQuery.error,
    refetch: sessionQuery.refetch,
    switchRole: switchRoleMutation.mutateAsync,
    isSwitchingRole: switchRoleMutation.isPending,
    switchRoleError: switchRoleMutation.error,
  };
}

