import { BadRequestException, ConflictException } from '@nestjs/common';
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

      await expect(
        service.update('1', { name: 'ana' }),
      ).rejects.toBeInstanceOf(ConflictException);
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
