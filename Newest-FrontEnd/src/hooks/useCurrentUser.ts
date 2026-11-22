import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { getMyProfile } from "@/services/user.service";

/** Usuário logado. Uma só chave de cache (antes eram "myProfile" e "myUser"). */
export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: getMyProfile,
  });
}
