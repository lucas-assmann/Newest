import { createZodDto } from 'nestjs-zod';
import { CreateCommentSchema } from './create-comment.dto';

/** Edição de comentário: só o texto, com as mesmas regras da criação. */
export const UpdateCommentSchema = CreateCommentSchema.pick({ content: true });

export class UpdateCommentDto extends createZodDto(UpdateCommentSchema) {}
