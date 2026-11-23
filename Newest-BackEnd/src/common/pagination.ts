import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

/** `?cursor=<id do último item>&limit=<1..50>` (os dois opcionais). */
export const PaginationSchema = z.object({
  cursor: z.string().min(1, 'Cursor inválido').optional(),
  limit: z.coerce
    .number()
    .int('Limite deve ser inteiro')
    .min(1, 'Limite mínimo é 1')
    .max(MAX_PAGE_SIZE, `Limite máximo é ${MAX_PAGE_SIZE}`)
    .default(DEFAULT_PAGE_SIZE),
});

export class PaginationQueryDto extends createZodDto(PaginationSchema) {}

export type Pagination = { cursor?: string; limit?: number };

export interface Page<T> {
  items: T[];
  /** Id para pedir a próxima página, ou `null` se acabou. */
  nextCursor: string | null;
}

/** Ordem estável: mais novo primeiro; o id desempata itens do mesmo instante. */
export const newestFirst = [
  { createdAt: 'desc' as const },
  { id: 'desc' as const },
];

/**
 * Argumentos do Prisma para uma página. Busca 1 item a mais só para saber
 * se existe próxima página.
 */
export function pageArgs({ cursor, limit = DEFAULT_PAGE_SIZE }: Pagination) {
  return {
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  };
}

/** Corta o item extra e monta `{ items, nextCursor }`. */
export function toPage<T extends { id: string }>(
  rows: T[],
  { limit = DEFAULT_PAGE_SIZE }: Pagination,
): Page<T> {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return {
    items,
    nextCursor: hasMore ? items[items.length - 1].id : null,
  };
}
