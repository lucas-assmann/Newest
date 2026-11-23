import { assertNotProduction } from './e2e-guard';

const prod =
  'postgresql://u:p@ep-prod-123-pooler.us-east-1.aws.neon.tech/neondb';
const dev = 'postgresql://u:p@ep-dev-456-pooler.us-east-1.aws.neon.tech/neondb';

describe('trava dos testes e2e', () => {
  it('libera um banco diferente do de produção', () => {
    expect(assertNotProduction(dev, prod)).toBe(dev);
  });

  it('recusa o banco de produção', () => {
    expect(() => assertNotProduction(prod, prod)).toThrow(/produção/);
  });

  it('recusa produção mesmo pela URL sem "-pooler" ou com outra senha', () => {
    const direct =
      'postgresql://x:y@ep-prod-123.us-east-1.aws.neon.tech/neondb';
    expect(() => assertNotProduction(direct, prod)).toThrow(/produção/);
  });

  it('sem banco configurado, explica o que falta', () => {
    expect(() => assertNotProduction(undefined, prod)).toThrow(
      /E2E_DATABASE_URL/,
    );
  });

  it('sem .env de produção (ex.: GitHub Actions), libera', () => {
    expect(assertNotProduction(dev, undefined)).toBe(dev);
  });
});
