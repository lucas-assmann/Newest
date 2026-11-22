import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useImageUpload, validateImageFile } from "./useImageUpload";

const file = (type: string, size: number) =>
  new File([new Uint8Array(size)], "x", { type });

describe("validateImageFile", () => {
  it("aceita imagem até 5MB", () => {
    expect(validateImageFile(file("image/png", 1000))).toBeNull();
  });

  it("recusa o que não é imagem e o que passa de 5MB", () => {
    expect(validateImageFile(file("application/pdf", 10))).toMatch(/imagens/);
    expect(validateImageFile(file("image/jpeg", 5 * 1024 * 1024 + 1))).toMatch(/5MB/);
  });
});

describe("useImageUpload", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("envia para a conta do Cloudinary do env (antes era fixa no código)", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", "minha-conta");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ secure_url: "https://res.cloudinary.com/minha-conta/a.png" })),
    );
    const { result } = renderHook(() => useImageUpload());

    let url = "";
    await act(async () => {
      url = await result.current.uploadImage(file("image/png", 10));
    });

    expect(url).toBe("https://res.cloudinary.com/minha-conta/a.png");
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://api.cloudinary.com/v1_1/minha-conta/image/upload",
    );
    expect(result.current.uploading).toBe(false);
  });

  it("se o Cloudinary falhar, lança erro (antes devolvia undefined) e solta o 'enviando'", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", "minha-conta");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 400 }));
    const { result } = renderHook(() => useImageUpload());

    await act(async () => {
      await expect(result.current.uploadImage(file("image/png", 10))).rejects.toThrow(
        /enviar a imagem/,
      );
    });
    expect(result.current.uploading).toBe(false);
  });

  it("recusa arquivo inválido sem chamar a rede", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const { result } = renderHook(() => useImageUpload());

    await act(async () => {
      await expect(result.current.uploadImage(file("text/plain", 10))).rejects.toThrow();
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
