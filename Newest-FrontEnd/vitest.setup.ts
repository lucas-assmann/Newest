import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  // Desmonta o que cada teste renderizou (sem `globals`, não é automático).
  cleanup();
  localStorage.clear();
});
