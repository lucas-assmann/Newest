import { describe, expect, it } from "vitest";
import { cursorPagination, cursorParams, pageItems } from "./pagination";

describe("paginação", () => {
  it("pageItems junta as páginas na ordem", () => {
    const data = {
      pages: [
        { items: [{ id: "1" }, { id: "2" }], nextCursor: "2" },
        { items: [{ id: "3" }], nextCursor: null },
      ],
      pageParams: [undefined, "2"],
    };
    expect(pageItems(data).map((x) => x.id)).toEqual(["1", "2", "3"]);
  });

  it("pageItems sem dados ainda devolve lista vazia", () => {
    expect(pageItems(undefined)).toEqual([]);
  });

  it("próxima página usa o nextCursor; null vira fim (undefined)", () => {
    expect(cursorPagination.getNextPageParam({ items: [], nextCursor: "abc" })).toBe("abc");
    expect(cursorPagination.getNextPageParam({ items: [], nextCursor: null })).toBeUndefined();
  });

  it("cursorParams só manda ?cursor= quando existe", () => {
    expect(cursorParams()).toBeUndefined();
    expect(cursorParams("abc")).toEqual({ params: { cursor: "abc" } });
  });
});
