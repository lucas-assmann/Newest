import { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { describe, expect, it } from "vitest";
import { api } from "./api";
import * as postService from "./post.service";
import * as userService from "./user.service";

describe("posts de um usuário", () => {
  it("getUserPosts usa a rota única GET /posts/user/:id", async () => {
    const sent: InternalAxiosRequestConfig[] = [];
    api.defaults.adapter = async (config) => {
      sent.push(config);
      return { status: 200, statusText: "", data: [], headers: {}, config } as AxiosResponse;
    };

    await postService.getUserPosts("u1");

    expect(sent[0].url).toBe("/posts/user/u1");
  });

  it("a rota duplicada /user/:id/posts saiu do user.service", () => {
    expect("getPostByUserId" in userService).toBe(false);
  });
});
