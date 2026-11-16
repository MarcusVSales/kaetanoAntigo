const config = require('./config'); // valida o .env; encerra se algo crítico faltar
const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const compression = require('compression');
const rateLimit   = require('express-rate-limit');
const path        = require('path');
const { testConnection } = require('./database/mysql');
const { ensureMySqlSchema } = require('./database/mysql-schema');
const db = require('./database/db');
const { ensureAdmin }  = require('./services/bootstrap');

const app = express();
app.disable('x-powered-by');
// Atrás de Nginx/Render/Railway o IP real vem no cabeçalho. Sem isso, o limite de
// tentativas contaria o IP do proxy e bloquearia TODO MUNDO junto.
app.set('trust proxy', process.env.TRUST_PROXY ? Number(process.env.TRUST_PROXY) : (config.isProd ? 1 : false));

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' }, contentSecurityPolicy: false }));
app.use(compression()); // respostas JSON ~70% menores

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || config.frontendUrls.includes(origin)) return cb(null, true);
    const err = new Error('Origem não autorizada'); err.status = 403; cb(err);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '200kb' })); // JSON é pequeno; as fotos vão por multipart
app.use(express.urlencoded({ extended: false, limit: '200kb' }));

const limiter = (windowMin, max, message, extra = {}) => rateLimit({
  windowMs: windowMin * 60 * 1000, max, standardHeaders: true, legacyHeaders: false, message: { error: message }, ...extra,
});
app.use('/api/', limiter(15, 300, 'Muitas requisições. Tente novamente em alguns minutos.'));
app.use('/api/auth/login', limiter(15, 10, 'Muitas tentativas de login deste endereço. Aguarde 15 minutos.', { skipSuccessfulRequests: true }));
app.use('/api/auth/forgot-password', limiter(60, 5, 'Muitos pedidos de recuperação. Tente novamente mais tarde.'));
app.use('/api/auth/reset-password', limiter(60, 10, 'Muitas tentativas. Tente novamente mais tarde.'));
app.use('/api/analytics/collect', limiter(5, 300, 'Limite excedido.'));

// Nomes de arquivo são UUIDs imutáveis → o navegador pode guardar por 1 ano (carregamento instantâneo na 2ª visita)
app.get('/uploads/:filename', async (req, res, next) => {
  try {
    if (!/^[a-f0-9-]{36}(?:-sm)?\.webp$|^[a-f0-9-]{36}\.(?:jpg|jpeg|png)$/i.test(req.params.filename)) return res.sendStatus(404);
    const file = await db.get('SELECT content_type, content FROM image_files WHERE filename=?', [req.params.filename]);
    if (!file) return res.sendStatus(404);
    res.set('Content-Type', file.content_type);
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.set('X-Content-Type-Options', 'nosniff');
    res.send(file.content);
  } catch (e) { next(e); }
});

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

(async () => {
  await testConnection();
  await ensureMySqlSchema();
  await ensureAdmin();

  app.use('/api/auth',      require('./routes/auth'));
  app.use('/api/products',  require('./routes/products'));
  const analytics = require('./routes/analytics');
  app.use('/api/analytics', analytics);
  analytics.purgeOld().catch(console.error); setInterval(() => analytics.purgeOld().catch(console.error), 24 * 3600 * 1000).unref();

  app.use('/api', (req, res) => res.status(404).json({ error: 'Rota não encontrada' }));
  app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
    const status = err.status || (err.code === 'LIMIT_FILE_SIZE' ? 413 : err.name === 'MulterError' ? 400 : 500);
    if (status >= 500) console.error('[ERROR]', err.message);
    res.status(status).json({ error: status >= 500 && config.isProd ? 'Erro interno no servidor' : err.message });
  });

  app.listen(config.port, () => {
    console.log(`\n🪑  API → http://localhost:${config.port}   (${config.isProd ? 'produção' : 'desenvolvimento'})`);
    console.log('🔒  Helmet · rate limit · bloqueio de login · sessões revogáveis ativos\n');
  });
})().catch(e => { console.error('❌', e); process.exit(1); });
