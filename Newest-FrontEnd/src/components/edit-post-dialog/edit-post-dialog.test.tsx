import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { queryKeys } from "@/lib/query-keys";
import { fakeApi, renderWithQuery } from "@/test-utils/render";
import { PostDTO } from "@/types/Post.types";
import { EditPostDialog } from ".";

const post: PostDTO = {
  id: "p1",
  title: "Título antigo",
  content: "Texto antigo",
  images: [],
  createdAt: "2026-11-22T00:00:00Z",
  isLiked: false,
  likes: 0,
  comments: 0,
  author: { id: "a", name: "ana", avatar: null },
};

describe("EditPostDialog", () => {
  it("abre com o título e o texto atuais", () => {
    fakeApi(() => ({ data: [] }));
    renderWithQuery(<EditPostDialog post={post} open onClose={() => {}} />);

    expect(screen.getByLabelText("Título")).toHaveValue("Título antigo");
    expect(screen.getByPlaceholderText("Conteúdo do post")).toHaveValue("Texto antigo");
  });

  it("salva com PATCH /posts/:id, atualiza as listas e fecha", async () => {
    const sent = fakeApi(() => ({ data: { ...post, title: "Novo" } }));
    const onClose = vi.fn();
    const { client } = renderWithQuery(<EditPostDialog post={post} open onClose={onClose} />);
    client.setQueryData(queryKeys.posts.feed, { pages: [], pageParams: [] });

    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Novo" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    const patch = sent.find((c) => c.method === "patch")!;
    expect(patch.url).toBe("/posts/p1");
    expect(JSON.parse(patch.data)).toEqual({ title: "Novo", content: "Texto antigo" });
    expect(client.getQueryState(queryKeys.posts.feed)?.isInvalidated).toBe(true);
  });

  it("não deixa salvar sem título", async () => {
    const sent = fakeApi(() => ({ data: [] }));
    renderWithQuery(<EditPostDialog post={post} open onClose={() => {}} />);

    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText("Título é obrigatório")).toBeInTheDocument();
    expect(sent.some((c) => c.method === "patch")).toBe(false);
  });

  it("mostra o motivo quando a API recusa (ex.: post de outra pessoa)", async () => {
    fakeApi((c) =>
      c.method === "patch"
        ? { status: 403, data: { message: "Você não tem permissão para editar este post" } }
        : { data: [] },
    );
    renderWithQuery(<EditPostDialog post={post} open onClose={() => {}} />);

    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(
      await screen.findByText("Você não tem permissão para editar este post"),
    ).toBeInTheDocument();
  });
});
