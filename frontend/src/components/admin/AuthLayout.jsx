import Head from 'next/head';
import Link from 'next/link';

// Moldura das telas de login / recuperação de senha. O logo leva ao site.
export default function AuthLayout({ title, children, footer }) {
  return (
    <>
      <Head><title>{title} — Kaetano Antigo</title><meta name="robots" content="noindex,nofollow"/></Head>
      <div className="min-h-screen bg-black flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <Link href="/" className="block text-center mb-10" aria-label="Kaetano Antigo — voltar ao site" title="Voltar ao site">
            <span className="block font-bold text-2xl tracking-[0.35em] text-white uppercase">Kaetano</span>
            <span className="block font-light italic text-xs tracking-[0.5em] text-white/40 uppercase mt-1">Antigo — Admin</span>
          </Link>
          <div className="bg-white p-8">{children}</div>
          <div className="mt-6 text-center text-xs text-white/50 space-y-2">
            {footer}
            <p><Link href="/" className="hover:text-white underline underline-offset-4">← Voltar ao site</Link></p>
          </div>
        </div>
      </div>
    </>
  );
}
