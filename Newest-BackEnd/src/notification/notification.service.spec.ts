import { NotificationType } from '@prisma/client';
import { createPrismaMock, PrismaMock } from 'src/test-utils/prisma-mock';
import { NotificationService, extractMentions } from './notification.service';

describe('extractMentions', () => {
  it('pega os @nomes sem repetir', () => {
    expect(extractMentions('oi @ana e @bia, @ana de novo')).toEqual([
      'ana',
      'bia',
    ]);
  });

  it('sem menção devolve lista vazia', () => {
    expect(extractMentions('sem ninguém aqui')).toEqual([]);
  });
});

describe('NotificationService', () => {
  let prisma: PrismaMock;
  let service: NotificationService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new NotificationService(prisma);
  });

  describe('notifyMentions', () => {
    it('avisa os mencionados (menos o próprio autor) de uma vez só', async () => {
      prisma.user.findMany.mockResolvedValue([
        { id: 'ana' },
        { id: 'bia' },
      ] as any);

      await service.notifyMentions('oi @ana @bia', 'eu', 'p1');

      expect(prisma.user.findMany.mock.calls[0][0]!.where).toEqual({
        name: { in: ['ana', 'bia'] },
        NOT: { id: 'eu' },
      });
      expect(prisma.notification.createMany).toHaveBeenCalledWith({
        data: [
          { userId: 'ana', actorId: 'eu', type: 'MENTION', postId: 'p1' },
          { userId: 'bia', actorId: 'eu', type: 'MENTION', postId: 'p1' },
        ],
      });
    });

    it('texto sem menção não consulta o banco', async () => {
      await service.notifyMentions('nada', 'eu', 'p1');

      expect(prisma.user.findMany).not.toHaveBeenCalled();
      expect(prisma.notification.createMany).not.toHaveBeenCalled();
    });

    it('menção a nome que não existe não cria notificação', async () => {
      prisma.user.findMany.mockResolvedValue([]);

      await service.notifyMentions('@fantasma', 'eu', 'p1');

      expect(prisma.notification.createMany).not.toHaveBeenCalled();
    });
  });

  it('getUnreadCount ignora notificações do próprio usuário (igual à lista)', async () => {
    prisma.notification.count.mockResolvedValue(2);

    await service.getUnreadCount('u1');

    expect(prisma.notification.count).toHaveBeenCalledWith({
      where: { userId: 'u1', read: false, NOT: { actorId: 'u1' } },
    });
  });
});

describe('NotificationType', () => {
  it('tem só os três tipos que o front conhece (contrato com a API)', () => {
    expect(Object.values(NotificationType)).toEqual([
      'LIKE',
      'COMMENT',
      'MENTION',
    ]);
  });
});
