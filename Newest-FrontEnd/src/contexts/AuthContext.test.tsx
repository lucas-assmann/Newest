import { act, renderHook } from "@testing-library/react";
import { AxiosResponse } from "axios";
import { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import { AuthProvider } from "./AuthContext";

describe("AuthContext.signIn", () => {
  it("guarda o accessToken devolvido pela API (antes 'acessToken')", async () => {
    api.defaults.adapter = async (config) =>
      ({
        status: 200,
        statusText: "",
        headers: {},
        config,
        data: { accessToken: "token-novo" },
      }) as AxiosResponse;
    // signIn navega para /home; no teste só registramos a tentativa.
    vi.spyOn(console, "error").mockImplementation(() => {});

    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(() => result.current.signIn("ana@a.com", "senha123"));

    expect(localStorage.getItem("token")).toBe("token-novo");
    expect(result.current.isAuthenticated).toBe(true);
  });
});
