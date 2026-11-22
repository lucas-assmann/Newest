"use client";

import { createContext, ReactNode, useState } from "react";
import { api } from "../services/api";
import { getAcessToken, logout as removeAccessToken } from "../services/auth.service";

interface AuthContextData {
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string, bio?: string, avatarUrl?: string | null) => Promise<void>;
}

export const AuthContext = createContext<AuthContextData>(
  {} as AuthContextData
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const token = getAcessToken();
    return !!token;
  });

  async function signIn(email: string, password: string) {
    const response = await api.post("auth/login", { email, password });

    const { accessToken } = response.data;

    localStorage.setItem("token", accessToken);

    setIsAuthenticated(true);

    window.location.href = "/home";
  }

  async function register(name: string, email: string, password: string, bio?: string, avatarUrl?: string | null) {
    await api.post("user", {
      name,
      email,
      password,
      ...(bio && { bio }),
      ...(avatarUrl && { avatar: avatarUrl }),
    });
  }

  async function logout() {
    removeAccessToken();

    setIsAuthenticated(false);

    window.location.href = "/login";
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, signIn, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}