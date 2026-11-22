const TOKEN_KEY = "token";

export function logout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function saveAccessToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}
