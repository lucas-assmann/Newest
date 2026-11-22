import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { cloudinaryUrl } from 'src/common/cloudinary-url.schema';

export const CreatePostSchema = z.object({
  title: z.string().max(100, 'Título pode ter no máximo 100 caracteres'),
  content: z
    .string()
    .min(1, 'Conteúdo é obrigatório')
    .max(500, 'Conteúdo pode ter no máximo 500 caracteres'),
  images: z
    .array(cloudinaryUrl('Imagem inválida'))
    .max(3, 'Máximo de 3 imagens por post')
    .optional(),
});

export class CreatePostDto extends createZodDto(CreatePostSchema) {}
