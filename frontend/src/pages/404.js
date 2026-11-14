import Head from 'next/head';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const WA = process.env.NEXT_PUBLIC_WHATSAPP || '5511965713610';

export default function NotFound() {
  return (
    <>
      <Head>
        <title>Página não encontrada — Kaetano Antigo</title>
        <meta name="robots" content="noindex"/>
      </Head>
      <section className="max-w-3xl mx-auto px-6 py-24 text-center">
        <p className="text-xs tracking-[0.5em] uppercase text-site-text3 font-medium mb-6">Erro 404</p>
        <h1 className="font-display text-7xl md:text-9xl font-light text-black leading-none mb-6">404</h1>
        <div className="section-divider"/>
        <h2 className="font-display text-2xl md:text-3xl font-light text-black mb-4">Esta peça não está por aqui</h2>
        <p className="text-sm font-light text-site-text2 leading-relaxed max-w-md mx-auto mb-10">
          O endereço que você abriu não existe ou foi movido. Mas o acervo continua cheio de histórias para descobrir.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-14">
          <Link href="/" className="btn-primary">Voltar ao início</Link>
          <Link href="/acervo-colecao" className="btn-outline">Ver o acervo <ArrowRight size={14}/></Link>
        </div>
        <nav aria-label="Páginas principais" className="border-t border-site-border pt-8">
          <p className="text-xs tracking-widest uppercase text-site-text3 font-medium mb-4">Ou vá direto para</p>
          <ul className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-xs tracking-widest uppercase font-medium">
            {[['/vendidos','Vendidos'],['/restauro','Restauro'],['/nossa-historia','Nossa História'],['/contato','Contato']].map(([h,l]) => (
              <li key={h}><Link href={h} className="text-site-text2 hover:text-black transition-colors">{l}</Link></li>
            ))}
          </ul>
          <p className="text-xs text-site-text3 font-light mt-8">
            Procurando uma peça específica?{' '}
            <a href={`https://wa.me/${WA}?text=${encodeURIComponent('Olá! Não encontrei uma peça no site e gostaria de ajuda.')}`} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-black">Fale conosco pelo WhatsApp</a>.
          </p>
        </nav>
      </section>
    </>
  );
}
