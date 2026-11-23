import { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { describe, expect, it } from "vitest";
import { api } from "./api";
import * as commentService from "./comment.service";
import * as notificationService from "./notification.service";
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

  it("a próxima página manda ?cursor= e a primeira vai sem", async () => {
    const sent: InternalAxiosRequestConfig[] = [];
    api.defaults.adapter = async (config) => {
      sent.push(config);
      return {
        status: 200,
        statusText: "",
        data: { items: [], nextCursor: null },
        headers: {},
        config,
      } as AxiosResponse;
    };

    await postService.getPosts();
    await postService.getPosts("abc");
    await commentService.getCommentsByPostId("p1", "c1");
    await notificationService.getNotifications("n1");

    expect(sent[0].params).toBeUndefined();
    expect(sent[1]).toMatchObject({ url: "/posts", params: { cursor: "abc" } });
    expect(sent[2]).toMatchObject({ url: "/comment/post/p1", params: { cursor: "c1" } });
    expect(sent[3]).toMatchObject({ url: "/notification", params: { cursor: "n1" } });
  });

  it("a rota duplicada /user/:id/posts saiu do user.service", () => {
    expect("getPostByUserId" in userService).toBe(false);
  });
});
