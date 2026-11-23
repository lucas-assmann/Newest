import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { createPrismaMock, PrismaMock } from 'src/test-utils/prisma-mock';
import { UserService } from './user.service';

describe('UserService', () => {
  let prisma: PrismaMock;
  let service: UserService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new UserService(prisma);
  });

  describe('dados públicos', () => {
    it('não tem mais o findAll (vazava o hash da senha de todos)', () => {
      expect((service as any).findAll).toBeUndefined();
    });

    it('findOne não devolve email nem senha', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: '1',
        name: 'ana',
        _count: { posts: 2 },
      } as any);

      await service.findOne('1');

      const select = prisma.user.findUnique.mock.calls[0][0].select!;
      expect(select).not.toHaveProperty('email');
      expect(select).not.toHaveProperty('password');
    });

    it('searchUsers busca só pelo nome e não devolve email nem senha', async () => {
      prisma.user.findMany.mockResolvedValue([]);

      await service.searchUsers('ana');

      const args = prisma.user.findMany.mock.calls[0][0]!;
      expect(JSON.stringify(args.where)).not.toContain('email');
      expect(args.select).not.toHaveProperty('email');
      expect(args.select).not.toHaveProperty('password');
    });
  });

  describe('conflitos de cadastro', () => {
    it('create com email em uso lança ConflictException (409, não 401)', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({ id: 'x' } as any);

      await expect(
        service.create({ name: 'ana', email: 'a@a.com', password: '123456' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('update com nome em uso lança ConflictException', async () => {
      prisma.user.findFirst.mockResolvedValueOnce({ id: 'outro' } as any);

      await expect(service.update('1', { name: 'ana' })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('changePassword', () => {
    it('recusa quando a senha atual está errada', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: '1',
        password: await bcrypt.hash('certa', 4),
      } as any);

      await expect(
        service.changePassword('1', {
          currentPassword: 'errada',
          newPassword: 'nova123',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('troca a senha guardando o hash da nova', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: '1',
        password: await bcrypt.hash('certa', 4),
      } as any);

      await service.changePassword('1', {
        currentPassword: 'certa',
        newPassword: 'nova123',
      });

      const data = prisma.user.update.mock.calls[0][0].data as {
        password: string;
      };
      expect(data.password).not.toBe('nova123');
      expect(await bcrypt.compare('nova123', data.password)).toBe(true);
    });
  });
});

describe('UserService (cobertura)', () => {
  let prisma: PrismaMock;
  let service: UserService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new UserService(prisma);
  });

  it('create com nome em uso → 409', async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce(null) // email livre
      .mockResolvedValueOnce({ id: 'x' } as any); // nome em uso
    await expect(
      service.create({ name: 'ana', email: 'a@a.com', password: '123456' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('create guarda o hash da senha, nunca a senha', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ id: '1' } as any);

    await service.create({ name: 'ana', email: 'a@a.com', password: '123456' });

    const data = prisma.user.create.mock.calls[0][0].data;
    expect(data.password).not.toBe('123456');
    expect(await bcrypt.compare('123456', data.password)).toBe(true);
    expect(prisma.user.create.mock.calls[0][0].select).not.toHaveProperty(
      'password',
    );
  });

  it('findById junta o total de posts', async () => {
    prisma.post.count.mockResolvedValue(3);
    prisma.user.findUnique.mockResolvedValue({ id: '1', name: 'ana' } as any);
    await expect(service.findById('1')).resolves.toMatchObject({
      id: '1',
      totalPosts: 3,
    });
  });

  it('findById de conta que não existe mais → 401 (front sai da conta)', async () => {
    prisma.post.count.mockResolvedValue(0);
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.findById('sumiu')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('update com email em uso por outra pessoa → 409', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 'outro' } as any);
    await expect(
      service.update('1', { email: 'b@b.com' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.user.findFirst.mock.calls[0][0]!.where).toEqual({
      email: 'b@b.com',
      NOT: { id: '1' },
    });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('update sem conflito grava e não devolve a senha', async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.user.update.mockResolvedValue({ id: '1' } as any);

    await service.update('1', { name: 'nova', bio: 'oi' });

    const args = prisma.user.update.mock.calls[0][0];
    expect(args.where).toEqual({ id: '1' });
    expect(args.data).toEqual({ name: 'nova', bio: 'oi' });
    expect(args.select).not.toHaveProperty('password');
  });

  it('changePassword de usuário inexistente → 404', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(
      service.changePassword('x', { currentPassword: 'a', newPassword: 'b' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('findOne de usuário inexistente → 404', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.findOne('x')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('searchUsers devolve o total de posts e limita a 10', async () => {
    prisma.user.findMany.mockResolvedValue([
      { id: '1', name: 'ana', avatar: null, bio: null, _count: { posts: 4 } },
    ] as any);
    await expect(service.searchUsers('an')).resolves.toEqual([
      { id: '1', name: 'ana', avatar: null, bio: null, totalPosts: 4 },
    ]);
    expect(prisma.user.findMany.mock.calls[0][0]!.take).toBe(10);
  });

  it('remove apaga só a própria conta', async () => {
    await expect(service.remove('1')).resolves.toEqual({
      message: 'Conta removida',
    });
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: '1' } });
  });
});
