import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { queryKeys } from "@/lib/query-keys";
import { fakeApi, renderWithQuery } from "@/test-utils/render";
import { NewPostDialog } from ".";

describe("NewPostDialog", () => {
  it("valida antes de enviar (título e conteúdo obrigatórios)", async () => {
    const sent = fakeApi();
    renderWithQuery(<NewPostDialog open onClose={() => {}} />);

    fireEvent.click(screen.getByRole("button", { name: "Postar" }));

    expect(await screen.findByText("Título é obrigatório")).toBeInTheDocument();
    expect(screen.getByText("Conteúdo é obrigatório")).toBeInTheDocument();
    expect(sent).toHaveLength(0);
  });

  it("cria o post, atualiza as listas e fecha", async () => {
    const sent = fakeApi(() => ({ status: 201, data: { id: "p9" } }));
    const onClose = vi.fn();
    const { client } = renderWithQuery(<NewPostDialog open onClose={onClose} />);
    client.setQueryData(queryKeys.posts.feed, []);

    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Olá" } });
    fireEvent.change(screen.getByPlaceholderText("Conteúdo do post"), {
      target: { value: "Primeiro post" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Postar" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    const post = sent.find((c) => c.url === "/posts")!;
    expect(JSON.parse(post.data)).toEqual({ title: "Olá", content: "Primeiro post", images: [] });
    expect(client.getQueryState(queryKeys.posts.feed)?.isInvalidated).toBe(true);
  });

  it("mostra o motivo quando a API recusa (ex.: imagem imprópria)", async () => {
    fakeApi((c) =>
      c.url === "/posts"
        ? { status: 400, data: { message: "Uma ou mais imagens contêm conteúdo não permitido" } }
        : { data: [] },
    );
    renderWithQuery(<NewPostDialog open onClose={() => {}} />);

    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Olá" } });
    fireEvent.change(screen.getByPlaceholderText("Conteúdo do post"), {
      target: { value: "x" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Postar" }));

    expect(
      await screen.findByText("Uma ou mais imagens contêm conteúdo não permitido"),
    ).toBeInTheDocument();
  });
});
