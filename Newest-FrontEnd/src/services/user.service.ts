import { User } from "@/types/user.types";
import { api } from "./api";

export const getMyProfile = async (): Promise<User> => {
  const { data } = await api.get("/user/me");
  return data;
};

export const getMyInformations = async (): Promise<User> => {
  const { data } = await api.get("/user/me");
  return data;
};

/** Atualiza nome, bio e email. A senha tem endpoint próprio: changeMyPassword. */
export const updateMyProfile = async ({
  name,
  bio,
  email,
}: {
  name?: string;
  bio?: string;
  email?: string;
}) => {
  const { data: response } = await api.patch("/user/me", { name, bio, email });
  return response;
};

export const changeMyPassword = async (data: {
  currentPassword: string;
  newPassword: string;
}) => {
  const { data: response } = await api.patch("/user/me/password", data);
  return response;
};

export const searchUsers = async (query: string) => {
  const { data } = await api.get("/user/search", {
    params: { q: query },
  });
  return data;
};

export const getUserById = async (id: string) => {
  const { data } = await api.get(`/user/${id}`);
  return data;
};

export const uploadAvatar = async (avatarUrl: string): Promise<void> => {
  await api.patch("/user/me", { avatar: avatarUrl });
};

export const deleteMyAccount = async () => {
  const { data } = await api.delete("/user/me");
  return data;
};
