// Ambiente do teste de limite de tentativas: igual ao test-env, mas com
// limite 2. Precisa ser importado ANTES do AppModule.
import './test-env';

process.env.AUTH_RATE_LIMIT = '2';
