-- Notification.type deixa de ser texto livre e vira enum (LIKE, COMMENT, MENTION).
-- SQL escrito à mão: o gerado pelo Prisma apagaria a coluna e os dados.
-- Converte os valores antigos ('like', 'comment', 'mention') sem perder nada;
-- qualquer outro valor faz a migration falhar (em 22/11/2026 produção só tinha esses três).

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('LIKE', 'COMMENT', 'MENTION');

-- AlterTable
ALTER TABLE "Notification"
  ALTER COLUMN "type" TYPE "NotificationType" USING (upper("type")::"NotificationType");
