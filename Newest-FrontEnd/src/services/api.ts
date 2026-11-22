import axios, { AxiosError } from "axios";
import { redirectToLogin } from "@/lib/navigation";
import { getAcessToken, logout } from "./auth.service";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
});

// Lê o token a cada requisição (antes ficava fixo no momento em que o módulo carregava).
api.interceptors.request.use((config) => {
  const token = getAcessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Token vencido ou inválido: sai da conta e volta para o login.
// O 401 do próprio login (senha errada) é tratado pela tela de login.
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const isLoginRequest = error.config?.url?.includes("auth/login");
    if (error.response?.status === 401 && !isLoginRequest && getAcessToken()) {
      logout();
      redirectToLogin();
    }
    return Promise.reject(error);
  },
);
