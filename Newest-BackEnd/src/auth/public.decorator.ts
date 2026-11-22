import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Libera a rota sem token. Todas as outras exigem login (guard global). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
