import Head from 'next/head';
import Link from 'next/link';

export default function ServerError() {
  return (
    <>
      <Head><title>Algo deu errado — Kaetano Antigo</title><meta name="robots" content="noindex"/></Head>
      <section className="max-w-2xl mx-auto px-6 py-24 text-center">
        <h1 className="font-display text-6xl font-light text-black mb-6">Ops…</h1>
        <div className="section-divider"/>
        <p className="text-sm font-light text-site-text2 leading-relaxed mb-10">Algo deu errado do nosso lado. Tente recarregar a página em instantes.</p>
        <Link href="/" className="btn-primary">Voltar ao início</Link>
      </section>
    </>
  );
}
