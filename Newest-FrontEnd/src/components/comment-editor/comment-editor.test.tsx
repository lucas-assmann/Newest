import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { queryKeys } from "@/lib/query-keys";
import { fakeApi, renderWithQuery } from "@/test-utils/render";
import { CommentDTO } from "@/types/Comment.types";
import { CommentEditor } from ".";

const comment: CommentDTO = {
  id: "c1",
  content: "Texto antigo",
  postId: "p1",
  authorId: "a",
  createdAt: "2026-11-22T00:00:00Z",
  author: { id: "a", name: "ana", avatar: null },
};

const textarea = () => screen.getByPlaceholderText("Edite seu comentário...");

describe("CommentEditor", () => {
  it("começa com o texto atual e o Salvar desligado até mudar algo", () => {
    fakeApi(() => ({ data: [] }));
    renderWithQuery(<CommentEditor comment={comment} onDone={() => {}} />);

    expect(textarea()).toHaveValue("Texto antigo");
    expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled();
  });

  it("salva com PATCH /comment/:id, atualiza os comentários do post e fecha", async () => {
    const sent = fakeApi(() => ({ data: { ...comment, content: "Novo" } }));
    const onDone = vi.fn();
    const { client } = renderWithQuery(<CommentEditor comment={comment} onDone={onDone} />);
    client.setQueryData(queryKeys.comments("p1"), { pages: [], pageParams: [] });

    fireEvent.change(textarea(), { target: { value: "Novo" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    const patch = sent.find((c) => c.method === "patch")!;
    expect(patch.url).toBe("/comment/c1");
    expect(JSON.parse(patch.data)).toEqual({ content: "Novo" });
    expect(client.getQueryState(queryKeys.comments("p1"))?.isInvalidated).toBe(true);
  });

  it("não envia comentário vazio", () => {
    const sent = fakeApi(() => ({ data: [] }));
    renderWithQuery(<CommentEditor comment={comment} onDone={() => {}} />);

    fireEvent.change(textarea(), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(screen.getByText("Comentário é obrigatório")).toBeInTheDocument();
    expect(sent.some((c) => c.method === "patch")).toBe(false);
  });

  it("Cancelar fecha sem salvar", () => {
    const sent = fakeApi(() => ({ data: [] }));
    const onDone = vi.fn();
    renderWithQuery(<CommentEditor comment={comment} onDone={onDone} />);

    fireEvent.change(textarea(), { target: { value: "Mudei" } });
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onDone).toHaveBeenCalled();
    expect(sent.some((c) => c.method === "patch")).toBe(false);
  });
});
