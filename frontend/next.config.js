/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: 'X-Frame-Options',        value: 'DENY' },                       // ninguém consegue embutir o site/admin em outro site (clickjacking)
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy',        value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',     value: 'camera=(), microphone=(), geolocation=(), payment=()' },
];

const nextConfig = {
  poweredByHeader: false,
  compress: true,
  images: { unoptimized: true }, // as fotos já são reduzidas pelo backend no upload
  env: {
    NEXT_PUBLIC_API_URL:  process.env.NEXT_PUBLIC_API_URL  || 'http://localhost:3001',
    NEXT_PUBLIC_WHATSAPP: process.env.NEXT_PUBLIC_WHATSAPP || '5511965713610',
  },
  // Endereços antigos continuam funcionando (e o Google/links salvos migram sozinhos)
  async redirects() {
    return [
      { source: '/minha-historia', destination: '/nossa-historia', permanent: true },
      { source: '/colecao',        destination: '/acervo-colecao', permanent: true },
      { source: '/acervo',         destination: '/acervo-colecao', permanent: true },
    ];
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      { source: '/admin/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }, { key: 'Cache-Control', value: 'no-store' }] },
    ];
  },
};
module.exports = nextConfig;
