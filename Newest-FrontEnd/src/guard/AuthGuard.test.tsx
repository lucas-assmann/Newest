import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthGuard } from "./AuthGuard";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, push: vi.fn() }) }));

function renderGuard() {
  return render(
    <AuthProvider>
      <AuthGuard>
        <p>conteúdo protegido</p>
      </AuthGuard>
    </AuthProvider>,
  );
}

describe("AuthGuard", () => {
  beforeEach(() => replace.mockClear());

  it("sem token, manda para o login e não mostra o conteúdo", async () => {
    renderGuard();

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(screen.queryByText("conteúdo protegido")).not.toBeInTheDocument();
  });

  it("com token, mostra o conteúdo", async () => {
    localStorage.setItem("token", "abc");
    renderGuard();

    expect(await screen.findByText("conteúdo protegido")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
