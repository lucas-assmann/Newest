import { isAxiosError } from "axios";

/** Mensagem de erro vinda da API (NestJS), ou o texto padrão. */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError<{ message?: unknown }>(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message) return message;
    if (Array.isArray(message) && message.length > 0) return message.join(", ");
  }
  return fallback;
}
