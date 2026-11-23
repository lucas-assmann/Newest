import {
  DEFAULT_PAGE_SIZE,
  PaginationSchema,
  pageArgs,
  toPage,
} from './pagination';

const rows = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ id: `id${i + 1}` }));

describe('paginação', () => {
  describe('PaginationSchema', () => {
    it('sem nada usa o limite padrão', () => {
      expect(PaginationSchema.parse({})).toEqual({ limit: DEFAULT_PAGE_SIZE });
    });

    it('converte o limite que chega como texto na query', () => {
      expect(PaginationSchema.parse({ limit: '5', cursor: 'abc' })).toEqual({
        limit: 5,
        cursor: 'abc',
      });
    });

    it.each(['0', '51', '2.5', 'abc'])('recusa limite %s', (limit) => {
      expect(PaginationSchema.safeParse({ limit }).success).toBe(false);
    });

    it('recusa cursor vazio', () => {
      expect(PaginationSchema.safeParse({ cursor: '' }).success).toBe(false);
    });
  });

  describe('pageArgs', () => {
    it('primeira página: pede um a mais, sem cursor', () => {
      expect(pageArgs({ limit: 10 })).toEqual({ take: 11 });
    });

    it('com cursor: começa depois do item do cursor', () => {
      expect(pageArgs({ limit: 10, cursor: 'x' })).toEqual({
        take: 11,
        cursor: { id: 'x' },
        skip: 1,
      });
    });
  });

  describe('toPage', () => {
    it('veio o item extra: corta e aponta o cursor para o último da página', () => {
      expect(toPage(rows(4), { limit: 3 })).toEqual({
        items: rows(3),
        nextCursor: 'id3',
      });
    });

    it('não veio o extra: acabou (nextCursor null)', () => {
      expect(toPage(rows(3), { limit: 3 })).toEqual({
        items: rows(3),
        nextCursor: null,
      });
    });

    it('lista vazia', () => {
      expect(toPage([], { limit: 3 })).toEqual({ items: [], nextCursor: null });
    });
  });
});
