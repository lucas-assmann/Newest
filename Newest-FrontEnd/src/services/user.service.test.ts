import { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { describe, expect, it } from "vitest";
import { api } from "./api";
import * as userService from "./user.service";

describe("user.service", () => {
  it("changeMyPassword usa o endpoint próprio com a senha atual", async () => {
    const sent: InternalAxiosRequestConfig[] = [];
    api.defaults.adapter = async (config) => {
      sent.push(config);
      return { status: 200, statusText: "", data: {}, headers: {}, config } as AxiosResponse;
    };

    await userService.changeMyPassword({
      currentPassword: "antiga",
      newPassword: "nova123",
    });

    expect(sent[0].method).toBe("patch");
    expect(sent[0].url).toBe("/user/me/password");
    expect(JSON.parse(sent[0].data)).toEqual({
      currentPassword: "antiga",
      newPassword: "nova123",
    });
  });

  it("updateMyProfile só envia nome, bio e email (nunca a senha)", async () => {
    const sent: InternalAxiosRequestConfig[] = [];
    api.defaults.adapter = async (config) => {
      sent.push(config);
      return { status: 200, statusText: "", data: {}, headers: {}, config } as AxiosResponse;
    };

    await userService.updateMyProfile({
      name: "ana",
      bio: "oi",
      password: "123456",
    } as Parameters<typeof userService.updateMyProfile>[0]);

    expect(JSON.parse(sent[0].data)).toEqual({ name: "ana", bio: "oi" });
  });

  it("não exporta mais getAllUsers (a rota foi removida)", () => {
    expect("getAllUsers" in userService).toBe(false);
  });
});
