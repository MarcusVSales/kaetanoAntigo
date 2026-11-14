// Lista oficial de categorias (a ordem aqui é a ordem exibida no site).
const CATEGORIES = [
  'Cadeiras',
  'Poltronas e Sofás',
  'Mesas',
  'Buffets e Aparadores',
  'Armários e Estantes',
  'Cômodas e Gaveteiros',
  'Escrivaninhas e Penteadeiras',
  'Móveis de Quarto',
  'Decoração e Iluminação',
];

// Nomes antigos → novos. Usado na migração do banco e para links/favoritos antigos
// (ex.: /acervo-colecao?categoria=Buffet continua funcionando).
const LEGACY = {
  'Buffet': 'Buffets e Aparadores',
  'Armários': 'Armários e Estantes',
  'Criado-mudo': 'Móveis de Quarto',
  'Cama': 'Móveis de Quarto',
  'Luminárias': 'Decoração e Iluminação',
  'Quadros': 'Decoração e Iluminação',
};

// Devolve o nome oficial, ou null se a categoria não existe
function normalizeCategory(c) {
  const v = (c ?? '').toString().trim();
  if (CATEGORIES.includes(v)) return v;
  return LEGACY[v] || null;
}

module.exports = { CATEGORIES, LEGACY, normalizeCategory };
