import { AxiosError, AxiosHeaders, AxiosResponse } from "axios";
import { describe, expect, it } from "vitest";
import { loginErrorFor } from ".";

function apiError(status: number, message?: string) {
  const config = { headers: new AxiosHeaders() };
  const response = { status, data: { message }, headers: {}, config, statusText: "" } as AxiosResponse;
  return new AxiosError("erro", String(status), config, null, response);
}

describe("mensagem de erro do login", () => {
  it("senha errada (401) → dados incorretos", () => {
    expect(loginErrorFor(apiError(401)).title).toBe("Dados incorretos");
  });

  it("muitas tentativas (429) → avisa para esperar, com a mensagem do servidor", () => {
    expect(loginErrorFor(apiError(429, "Muitas tentativas. Aguarde um minuto e tente de novo."))).toEqual({
      title: "Muitas tentativas",
      description: "Muitas tentativas. Aguarde um minuto e tente de novo.",
    });
  });

  it("429 sem mensagem usa o texto padrão", () => {
    expect(loginErrorFor(apiError(429)).description).toBe("Aguarde um minuto e tente de novo.");
  });
});
