import { ChangePasswordSchema } from './change-password.dto';
import { CreateUserSchema } from './create-user.dto';
import { UpdateUserSchema } from './update-user.dto';

const cloudinaryUrl =
  'https://res.cloudinary.com/demo/image/upload/v1/avatar.jpg';

describe('schemas de usuário', () => {
  it('UpdateUserSchema descarta o campo password (troca só pelo endpoint próprio)', () => {
    const result = UpdateUserSchema.parse({ name: 'ana', password: '123456' });
    expect(result).not.toHaveProperty('password');
  });

  it.each([
    ['UpdateUserSchema', UpdateUserSchema, {}],
    [
      'CreateUserSchema',
      CreateUserSchema,
      { name: 'ana', email: 'a@a.com', password: '123456' },
    ],
  ])('%s aceita avatar do Cloudinary e recusa outros', (_, schema, base) => {
    expect(schema.safeParse({ ...base, avatar: cloudinaryUrl }).success).toBe(
      true,
    );
    expect(
      schema.safeParse({ ...base, avatar: 'https://site-qualquer.com/x.jpg' })
        .success,
    ).toBe(false);
    expect(schema.safeParse({ ...base, avatar: 'javascript:alert(1)' }).success).toBe(
      false,
    );
  });

  it('ChangePasswordSchema exige senha atual e nova com 6+ caracteres', () => {
    expect(
      ChangePasswordSchema.safeParse({ newPassword: '123456' }).success,
    ).toBe(false);
    expect(
      ChangePasswordSchema.safeParse({
        currentPassword: 'a',
        newPassword: '123',
      }).success,
    ).toBe(false);
    expect(
      ChangePasswordSchema.safeParse({
        currentPassword: 'a',
        newPassword: '123456',
      }).success,
    ).toBe(true);
  });
});
