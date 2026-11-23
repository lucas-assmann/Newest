import { createZodDto } from 'nestjs-zod';
import { CreatePostSchema } from './create-post.dto';

/** Edição de post: só título e texto (imagens não mudam: passariam de novo pela moderação). */
export const UpdatePostSchema = CreatePostSchema.pick({
  title: true,
  content: true,
})
  .partial()
  .refine((data) => data.title !== undefined || data.content !== undefined, {
    message: 'Informe o título ou o conteúdo',
  });

export class UpdatePostDto extends createZodDto(UpdatePostSchema) {}
