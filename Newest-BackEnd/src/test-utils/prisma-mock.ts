import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { PrismaService } from 'src/prisma.service';

export type PrismaMock = DeepMockProxy<PrismaService>;

/** Prisma falso para testar services sem tocar no banco. */
export function createPrismaMock(): PrismaMock {
  return mockDeep<PrismaService>();
}
