"use client";

import { useRouter } from "next/navigation";
import { useContext, useEffect } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import { useIsClient } from "@/hooks/useIsClient";
import { getAccessToken } from "@/services/auth.service";

/** Usado uma vez só, no layout das telas logadas. Sem token → /login. */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useContext(AuthContext);
  const router = useRouter();
  // O token fica no localStorage, que só existe no navegador.
  const isClient = useIsClient();

  const allowed = isClient && isAuthenticated && !!getAccessToken();

  useEffect(() => {
    if (isClient && !allowed) router.replace("/login");
  }, [isClient, allowed, router]);

  if (!allowed) return null;
  return <>{children}</>;
}
