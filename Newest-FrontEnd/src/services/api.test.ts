import { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/navigation", () => ({ redirectToLogin: vi.fn() }));

import { redirectToLogin } from "@/lib/navigation";
import { api } from "./api";

/** Troca a ida à rede por uma resposta falsa e guarda a requisição enviada. */
function fakeServer(status = 200) {
  const sent: InternalAxiosRequestConfig[] = [];
  api.defaults.adapter = async (config) => {
    sent.push(config);
    const response = {
      status,
      statusText: "",
      data: {},
      headers: {},
      config,
    } as AxiosResponse;
    if (status >= 400) {
      throw new AxiosError("erro", String(status), config, null, response);
    }
    return response;
  };
  return sent;
}

describe("api (axios)", () => {
  beforeEach(() => vi.mocked(redirectToLogin).mockClear());

  it("manda o token salvo no momento da requisição", async () => {
    const sent = fakeServer();
    localStorage.setItem("token", "abc");

    await api.get("/posts");

    expect(sent[0].headers.Authorization).toBe("Bearer abc");
  });

  it("sem token não manda o header Authorization", async () => {
    const sent = fakeServer();

    await api.get("/posts");

    expect(sent[0].headers.Authorization).toBeUndefined();
  });

  it("em 401 com token salvo, apaga o token e manda para o login", async () => {
    fakeServer(401);
    localStorage.setItem("token", "vencido");

    await expect(api.get("/posts")).rejects.toBeInstanceOf(AxiosError);

    expect(localStorage.getItem("token")).toBeNull();
    expect(redirectToLogin).toHaveBeenCalledOnce();
  });

  it("401 no próprio login (senha errada) não redireciona", async () => {
    fakeServer(401);

    await expect(
      api.post("auth/login", { email: "a", password: "b" }),
    ).rejects.toBeInstanceOf(AxiosError);

    expect(redirectToLogin).not.toHaveBeenCalled();
  });

  it("outros erros (ex.: 409) não deslogam", async () => {
    fakeServer(409);
    localStorage.setItem("token", "abc");

    await expect(api.patch("/user/me", {})).rejects.toBeInstanceOf(AxiosError);

    expect(localStorage.getItem("token")).toBe("abc");
    expect(redirectToLogin).not.toHaveBeenCalled();
  });
});
