import { describe, expect, it } from "vitest";
import { UpdateProfileSchema } from "./settings.schema";

const base = { name: "ana", email: "ana@a.com", bio: "" };

describe("UpdateProfileSchema", () => {
  it("sem trocar a senha, não exige a senha atual", () => {
    expect(UpdateProfileSchema.safeParse(base).success).toBe(true);
  });

  it("para trocar a senha, exige a senha atual", () => {
    const result = UpdateProfileSchema.safeParse({
      ...base,
      password: "nova123",
      confirmPassword: "nova123",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["currentPassword"]);
  });

  it("com senha atual e confirmação certas, passa", () => {
    expect(
      UpdateProfileSchema.safeParse({
        ...base,
        currentPassword: "antiga",
        password: "nova123",
        confirmPassword: "nova123",
      }).success,
    ).toBe(true);
  });
});
