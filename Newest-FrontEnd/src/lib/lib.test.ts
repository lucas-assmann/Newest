import { AxiosError, AxiosResponse } from "axios";
import { describe, expect, it, vi } from "vitest";
import { getAvatarUrl } from "./avatar";
import { getErrorMessage } from "./errors";
import { formatCount, formatDate, formatDateLong, formatPostCount } from "./format";
import { notificationText } from "./notifications";

describe("getAvatarUrl", () => {
  it("usa a URL do Cloudinary como está", () => {
    const url = "https://res.cloudinary.com/x/image/upload/a.jpg";
    expect(getAvatarUrl(url)).toBe(url);
  });

  it("sem avatar (ou caminho antigo /uploads, que não existe mais) usa a foto padrão", () => {
    expect(getAvatarUrl(null)).toBe("/profilePicture.png");
    expect(getAvatarUrl(undefined)).toBe("/profilePicture.png");
    expect(getAvatarUrl("/uploads/avatars/x.jpg")).toBe("/profilePicture.png");
  });

  it("nunca aponta para localhost:3000 (antes ia fixo no código)", () => {
    expect(getAvatarUrl("/uploads/a.jpg")).not.toContain("localhost");
  });
});

describe("getErrorMessage", () => {
  const axiosError = (data: unknown) =>
    new AxiosError("x", "400", undefined, null, { data } as AxiosResponse);

  it("usa a mensagem da API", () => {
    expect(getErrorMessage(axiosError({ message: "Email já está em uso" }), "falhou")).toBe(
      "Email já está em uso",
    );
  });

  it("junta listas de mensagens de validação", () => {
    expect(getErrorMessage(axiosError({ message: ["a", "b"] }), "falhou")).toBe("a, b");
  });

  it("sem mensagem útil, usa o texto padrão", () => {
    expect(getErrorMessage(new Error("boom"), "falhou")).toBe("falhou");
    expect(getErrorMessage(axiosError({}), "falhou")).toBe("falhou");
  });
});

describe("format", () => {
  it("formatDate: relativo para datas recentes", () => {
    vi.setSystemTime(new Date("2026-11-22T12:00:00Z"));
    expect(formatDate("2026-11-22T11:30:00Z")).toBe("Agora há pouco");
    expect(formatDate("2026-11-22T09:00:00Z")).toBe("Há 3 horas");
    expect(formatDate("2026-11-20T12:00:00Z")).toBe("Há 2 dias");
    vi.useRealTimers();
  });

  it("formatDateLong: mês com maiúscula", () => {
    expect(formatDateLong("2026-03-15T12:00:00Z")).toBe("15 de Março de 2026");
    expect(formatDateLong(undefined)).toBe("Data não disponível");
  });

  it("formatCount e formatPostCount", () => {
    expect(formatCount(999)).toBe("999");
    expect(formatCount(1500)).toBe("1.5k");
    expect(formatCount(2_000_000)).toBe("2.0M");
    expect(formatPostCount(0)).toBe("0 posts");
    expect(formatPostCount(1)).toBe("1 post");
    expect(formatPostCount(1200)).toBe("1.2k posts");
  });
});

describe("notificationText", () => {
  it("tem texto certo para cada tipo — inclusive menção (antes saía 'comentou')", () => {
    expect(notificationText("LIKE")).toBe("curtiu seu post");
    expect(notificationText("COMMENT")).toBe("comentou no seu post");
    expect(notificationText("MENTION")).toBe("mencionou você");
  });
});
