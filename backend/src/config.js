// Lê e valida as variáveis de ambiente UMA vez. Nenhum segredo tem valor padrão:
// se faltar algo importante, o servidor recusa subir em vez de rodar inseguro.
require('dotenv').config();

const isProd = process.env.NODE_ENV === 'production';
const problems = [];

const JWT_SECRET = process.env.JWT_SECRET || '';
if (JWT_SECRET.length < 32) {
  problems.push('JWT_SECRET ausente ou curto demais (mínimo 32 caracteres). Gere com: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
}

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || ''; // só é validada ao CRIAR o admin (services/bootstrap.js)

const frontendUrls = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',').map(s => s.trim().replace(/\/$/, '')).filter(Boolean);

if (isProd && frontendUrls.some(u => u.startsWith('http://localhost'))) {
  problems.push('FRONTEND_URL aponta para localhost em produção.');
}

if (problems.length) {
  console.error('\n❌ Configuração insegura/incompleta (backend/.env):');
  problems.forEach(p => console.error('   • ' + p));
  console.error('\nAjuste o arquivo backend/.env (modelo em backend/.env.example).\n');
  process.exit(1);
}

module.exports = {
  isProd,
  port: Number(process.env.PORT) || 3001,
  jwtSecret: JWT_SECRET,
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: ADMIN_PASSWORD,
  adminEmail: (process.env.ADMIN_EMAIL || '').trim().toLowerCase(),
  frontendUrls,
  resetTtlMinutes: Number(process.env.RESET_TTL_MINUTES) || 30,
  maxFailedLogins: Number(process.env.MAX_FAILED_LOGINS) || 5,
  lockMinutes: Number(process.env.LOCK_MINUTES) || 15,
  tzOffsetHours: Number(process.env.ANALYTICS_TZ_OFFSET_HOURS ?? -3), // Brasília
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || process.env.SMTP_USER || '',
  },
};
