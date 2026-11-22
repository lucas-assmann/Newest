import { parseCorsOrigins, validateEnv } from './env';

const base = { DATABASE_URL: 'postgresql://x', JWT_SECRET: 's' };

describe('validateEnv', () => {
  it('falha ao subir se faltar DATABASE_URL ou JWT_SECRET, dizendo qual', () => {
    expect(() => validateEnv({ JWT_SECRET: 's' })).toThrow(/DATABASE_URL/);
    expect(() => validateEnv({ DATABASE_URL: 'x' })).toThrow(/JWT_SECRET/);
  });

  it('aceita o mínimo e põe PORT 3000 por padrão', () => {
    expect(validateEnv(base)).toMatchObject({ ...base, PORT: 3000 });
  });

  it('mantém as outras variáveis (ex.: SIGHTENGINE_*)', () => {
    expect(validateEnv({ ...base, SIGHTENGINE_USER: 'u' })).toHaveProperty(
      'SIGHTENGINE_USER',
      'u',
    );
  });
});

describe('parseCorsOrigins', () => {
  it('lê a lista separada por vírgula, ignorando espaços', () => {
    expect(parseCorsOrigins('https://a.com, http://localhost:8080 ')).toEqual([
      'https://a.com',
      'http://localhost:8080',
    ]);
  });

  it('sem CORS_ORIGINS, usa as origens de antes (para não quebrar o deploy)', () => {
    expect(parseCorsOrigins(undefined)).toEqual(
      expect.arrayContaining([
        'https://newest-app.vercel.app',
        'http://localhost:8080',
      ]),
    );
  });
});
