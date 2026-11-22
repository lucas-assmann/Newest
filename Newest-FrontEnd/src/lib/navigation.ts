/** Leva para o login recarregando a página (limpa o cache do React Query). */
export function redirectToLogin() {
  if (typeof window === "undefined") return;
  if (window.location.pathname === "/login") return;
  window.location.href = "/login";
}
