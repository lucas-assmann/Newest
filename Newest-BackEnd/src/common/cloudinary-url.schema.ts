import { z } from 'zod';

/**
 * Só aceita imagens hospedadas no Cloudinary (onde o front faz o upload).
 * Impede salvar links para sites quaisquer ou esquemas como `javascript:`.
 */
export const cloudinaryUrl = (message = 'A imagem precisa ser do Cloudinary') =>
  z
    .string()
    .url(message)
    .regex(/^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//, message);
