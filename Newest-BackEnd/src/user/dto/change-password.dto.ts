import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Informe a senha atual'),
  newPassword: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

export class ChangePasswordDto extends createZodDto(ChangePasswordSchema) {}
