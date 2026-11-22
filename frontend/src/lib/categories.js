// Lista única de categorias do site (filtros, menu e cadastro do admin usam esta lista).
// Ao mudar nomes aqui, mude também backend/src/constants/categories.js.
export const CATEGORIES = [
  'Cadeiras',
  'Poltronas e Sofás',
  'Mesas',
  'Mesinhas',
  'Buffets e Aparadores',
  'Armários e Estantes',
  'Cômodas e Gaveteiros',
  'Escrivaninhas e Penteadeiras',
  'Móveis de Quarto',
  'Decoração e Iluminação',
];

// Nomes antigos → novos (links/favoritos antigos como ?categoria=Buffet continuam funcionando)
const LEGACY = {
  'Buffet': 'Buffets e Aparadores',
  'Armários': 'Armários e Estantes',
  'Criado-mudo': 'Móveis de Quarto',
  'Cama': 'Móveis de Quarto',
  'Luminárias': 'Decoração e Iluminação',
  'Quadros': 'Decoração e Iluminação',
};
export const normalizeCategory = c => (!c ? null : CATEGORIES.includes(c) ? c : (LEGACY[c] || c));
