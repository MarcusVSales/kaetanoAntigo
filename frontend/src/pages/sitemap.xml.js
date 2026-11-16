
const SITE_URL = 'https://kaetanoantigo.com.br';

const STATIC_PAGES = [
  '/',
  '/acervo-colecao',
  '/nossa-historia',
  '/restauro',
  '/contato',
  '/vendidos',
];

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateSitemap(products) {
  const staticUrls = STATIC_PAGES.map(path => (
    `<url><loc>${escapeXml(SITE_URL + path)}</loc></url>`
  ));

  const productUrls = products
    .filter(product => product.id != null)
    .map(product => (
      `<url><loc>${escapeXml(
        `${SITE_URL}/produto/${encodeURIComponent(product.id)}`
      )}</loc></url>`
    ));

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticUrls, ...productUrls].join('\n')}
</urlset>`;
}

export async function getServerSideProps({ res }) {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    'https://api.kaetanoantigo.com.br';

  let products = [];

  try {
    const response = await fetch(`${apiUrl}/api/products`);

    if (!response.ok) {
      throw new Error(`API retornou ${response.status}`);
    }

    const data = await response.json();
    products = Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('[Sitemap] Erro ao buscar produtos:', error);
  }

  const sitemap = generateSitemap(products);

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader(
    'Cache-Control',
    'public, s-maxage=3600, stale-while-revalidate=600'
  );
  res.write(sitemap);
  res.end();

  return { props: {} };
}

export default function Sitemap() {
  return null;
}
