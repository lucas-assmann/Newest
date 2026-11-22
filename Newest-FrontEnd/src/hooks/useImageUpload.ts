import { useState } from "react";

const MAX_SIZE = 5 * 1024 * 1024;

/** Devolve a mensagem de erro, ou null se o arquivo puder ser enviado. */
export function validateImageFile(file: File): string | null {
  if (!file.type.startsWith("image/")) return "Por favor, selecione apenas imagens";
  if (file.size > MAX_SIZE) return "Cada imagem deve ter no máximo 5MB";
  return null;
}

/**
 * Envia imagens direto do navegador para o Cloudinary (upload "unsigned").
 * Antes havia uma cópia disto em cada tela, com a conta fixa no código.
 */
export function useImageUpload() {
  // Contador: com várias imagens em paralelo, só "termina" quando todas terminarem.
  const [pending, setPending] = useState(0);

  async function uploadImage(file: File): Promise<string> {
    const invalid = validateImageFile(file);
    if (invalid) throw new Error(invalid);

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "newest";

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", preset);

    setPending((n) => n + 1);
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const data = (await res.json().catch(() => ({}))) as { secure_url?: string };
      if (!res.ok || !data.secure_url) {
        throw new Error("Não foi possível enviar a imagem. Tente novamente.");
      }
      return data.secure_url;
    } finally {
      setPending((n) => n - 1);
    }
  }

  /** Envia várias e devolve as URLs na mesma ordem. */
  function uploadImages(files: File[]): Promise<string[]> {
    return Promise.all(files.map(uploadImage));
  }

  return { uploadImage, uploadImages, uploading: pending > 0 };
}
