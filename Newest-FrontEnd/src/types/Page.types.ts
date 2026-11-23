/** Uma página de uma lista paginada por cursor (feed, comentários, notificações). */
export interface Page<T> {
  items: T[];
  /** Passar como `?cursor=` para buscar a próxima página; `null` = acabou. */
  nextCursor: string | null;
}
