// Uso opcional: "npm run db:init" cria o banco e, SE ele estiver vazio, 3 peças de exemplo.
// (o servidor já cria/migra as tabelas sozinho ao iniciar)
const { initDb, getDb, flush } = require('./connection');
const { ensureSchema, migrateCategories } = require('./schema');

async function main() {
  await initDb();
  ensureSchema();
  migrateCategories();
  const db = getDb();
  const total = db.prepare('SELECT COUNT(*) AS c FROM products').get().c;
  if (total === 0) {
    const samples = [
      ['p1','Buffet Jacarandá Anos 50','Buffet em jacarandá nobre. Pés palito, três gavetas e duas portas.','Buffets e Aparadores',4800,1,'1950'],
      ['p2','Cadeiras Pé Palito Anos 60 (Par)','Par de cadeiras em imbuia. Assento verde musgo original.','Cadeiras',1900,2,'1960'],
      ['p3','Mesa de Centro Retrô','Tampo em fórmica verde e base cromada.','Mesas',1200,1,'1960'],
    ];
    for (const s of samples) {
      db.prepare('INSERT INTO products (id,name,description,category,price,quantity,decade,featured) VALUES (?,?,?,?,?,?,?,0)').run(...s);
    }
    console.log('📦 Banco vazio: 3 peças de exemplo inseridas.');
  } else {
    console.log(`📦 Banco já tem ${total} peça(s) — nada foi adicionado.`);
  }
  flush();
  console.log('✅ Banco pronto.');
}
main().catch(e => { console.error('❌', e.message); process.exit(1); });
