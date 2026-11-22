import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { cloudinaryUrl } from 'src/common/cloudinary-url.schema';

// A senha não é alterada aqui: use PATCH /user/me/password (exige a senha atual).
export const UpdateUserSchema = z.object({
  name: z
    .string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(30, 'Nome pode ter no máximo 30 caracteres')
    .optional(),
  email: z.string().email('Email inválido').optional(),
  bio: z.string().max(200, 'Bio pode ter no máximo 200 caracteres').optional(),
  avatar: cloudinaryUrl('Avatar inválido').optional(),
});

export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}
