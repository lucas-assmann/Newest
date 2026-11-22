// Variáveis falsas para os testes que sobem o app inteiro.
// Precisa ser importado ANTES do AppModule (o ConfigModule valida ao carregar).
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://teste:teste@localhost:5432/teste';
process.env.JWT_SECRET = 'segredo-de-teste';
process.env.CORS_ORIGINS = 'http://localhost:8080';
