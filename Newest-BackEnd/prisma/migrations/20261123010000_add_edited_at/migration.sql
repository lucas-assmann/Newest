-- Data da última edição de post e comentário (null = nunca editado).
-- Só adiciona colunas vazias: nenhum dado existente muda.

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "editedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "editedAt" TIMESTAMP(3);

