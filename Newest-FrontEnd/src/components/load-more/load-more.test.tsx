import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LoadMore } from ".";

describe("LoadMore", () => {
  it("sem próxima página não mostra nada", () => {
    const { container } = render(
      <LoadMore hasNextPage={false} isFetchingNextPage={false} onLoadMore={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("o botão carrega a próxima página (sem repassar o evento do clique)", () => {
    const onLoadMore = vi.fn();
    render(<LoadMore hasNextPage isFetchingNextPage={false} onLoadMore={onLoadMore} />);

    fireEvent.click(screen.getByRole("button", { name: "Carregar mais" }));

    expect(onLoadMore).toHaveBeenCalledWith();
  });

  it("enquanto carrega mostra o indicador no lugar do botão", () => {
    render(<LoadMore hasNextPage isFetchingNextPage onLoadMore={vi.fn()} />);

    expect(screen.getByLabelText("Carregando mais")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("carrega sozinho quando o fim da lista aparece na tela", () => {
    let trigger: (entries: Partial<IntersectionObserverEntry>[]) => void = () => {};
    const disconnect = vi.fn();
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(cb: typeof trigger) {
          trigger = cb;
        }
        observe() {}
        disconnect = disconnect;
      },
    );
    const onLoadMore = vi.fn();
    const { unmount } = render(
      <LoadMore hasNextPage isFetchingNextPage={false} onLoadMore={onLoadMore} />,
    );

    trigger([{ isIntersecting: false }]);
    expect(onLoadMore).not.toHaveBeenCalled();
    trigger([{ isIntersecting: true }]);
    expect(onLoadMore).toHaveBeenCalledTimes(1);

    unmount();
    expect(disconnect).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
