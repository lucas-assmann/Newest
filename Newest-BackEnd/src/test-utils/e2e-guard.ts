/** Host do banco, ignorando o "-pooler" do Neon (mesmo banco, outra porta de entrada). */
function dbHost(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).hostname.replace('-pooler', '');
  } catch {
    return undefined;
  }
}

/**
 * Trava dos testes e2e: recusa rodar se o banco escolhido for o de produção
 * (o do .env). Não conecta em nada; só compara as URLs.
 */
export function assertNotProduction(
  e2eUrl: string | undefined,
  productionUrl: string | undefined,
): string {
  if (!e2eUrl) {
    throw new Error(
      'Testes e2e precisam de um banco: defina E2E_DATABASE_URL ou crie o .env.development.local',
    );
  }
  const prod = dbHost(productionUrl);
  if (prod && dbHost(e2eUrl) === prod) {
    throw new Error(
      'Os testes e2e apontam para o banco do .env (produção). Abortado para não tocar nos dados reais.',
    );
  }
  return e2eUrl;
}
