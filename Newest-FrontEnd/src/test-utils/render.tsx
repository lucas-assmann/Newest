import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, renderHook } from "@testing-library/react";
import { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { ReactElement, ReactNode } from "react";
import { api } from "@/services/api";

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function wrapperFor(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

export function renderWithQuery(ui: ReactElement, client = createTestQueryClient()) {
  return { client, ...render(ui, { wrapper: wrapperFor(client) }) };
}

export function renderHookWithQuery<T>(hook: () => T, client = createTestQueryClient()) {
  return { client, ...renderHook(hook, { wrapper: wrapperFor(client) }) };
}

type Handler = (config: InternalAxiosRequestConfig) => { status?: number; data?: unknown };

/** Troca a rede do axios por respostas falsas e guarda o que foi enviado. */
export function fakeApi(handler: Handler = () => ({ data: {} })) {
  const sent: InternalAxiosRequestConfig[] = [];
  api.defaults.adapter = async (config) => {
    sent.push(config);
    const { status = 200, data = {} } = handler(config);
    const response = { status, statusText: "", data, headers: {}, config } as AxiosResponse;
    if (status >= 400) {
      const { AxiosError } = await import("axios");
      throw new AxiosError("erro", String(status), config, null, response);
    }
    return response;
  };
  return sent;
}
