import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { productsAPI, getImageUrl } from '@/lib/api';
import ProductCard from '@/components/products/ProductCard';
import CroppedImage from '@/components/products/CroppedImage';

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [recent,   setRecent]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [heroBg,   setHeroBg]   = useState(0);
  const timer = useRef(null);

  useEffect(() => {
    // Uma única requisição (antes eram duas, repetindo os mesmos dados)
    productsAPI.list()
      .then(({ data }) => {
        setFeatured(data.filter(p => p.featured && p.primary_image).slice(0, 7));
        setRecent(data.slice(0, 8));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (featured.length < 2) return;
    timer.current = setInterval(() => setHeroBg(p => (p + 1) % featured.length), 4500);
    return () => clearInterval(timer.current);
  }, [featured]);

  const prev = () => { clearInterval(timer.current); setHeroBg(p => (p - 1 + featured.length) % featured.length); };
  const next = () => { clearInterval(timer.current); setHeroBg(p => (p + 1) % featured.length); };

  const Skel = () => (
    <div className="animate-pulse">
      <div className="aspect-[3/4] bg-site-border mb-4"/>
      <div className="h-3 bg-site-bg2 w-1/3 mb-2"/>
      <div className="h-5 bg-site-border w-3/4"/>
    </div>
  );

  return (
    <>
      <Head>
        
  
<Head>
  <title>Kaetano Antigo | Antiquário e Móveis Antigos em São Paulo</title>

  <meta
    name="description"
    content="Conheça a Kaetano Antigo, antiquário em São Paulo. Explore nosso acervo de móveis clássicos e modernistas e encontre mobiliário com história.."
  />

  <meta
    name="robots"
    content="index, follow"
  />

  <link
    rel="canonical"
    href="https://kaetanoantigo.com.br/"
  />

  <meta
    property="og:type"
    content="website"
  />

  <meta
    property="og:title"
    content="Kaetano Antigo | Antiquário em São Paulo"
  />

  <meta
    property="og:description"
    content="Móveis clássicos e modernistas selecionados para ambientes com personalidade."
  />

  <meta
    property="og:url"
    content="https://kaetanoantigo.com.br/"
  />

  <meta
    property="og:locale"
    content="pt_BR"
  />

  <meta
    property="og:site_name"
    content="Kaetano Antigo"
  />
</Head>


      </Head>

      {/* Hero com imagens de fundo */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-black" aria-label="Banner">
        {featured.map((p, i) => {
          // Enquadramento salvo no editor de recorte (posição E zoom, inclusive abaixo de 100%)
          const crop = (p.hero_crop || p.primary_crop) ? (() => {
          try {
            return JSON.parse(p.hero_crop || p.primary_crop);
          } catch {
            return null;
          }
          })()
          : null;
          // Só a foto atual e as vizinhas são baixadas; as outras esperam a vez (menos dados no 1º carregamento)
          const near = i === heroBg || i === (heroBg + 1) % featured.length || i === (heroBg - 1 + featured.length) % featured.length;

          return (
            <div
              key={p.id}
              className={`absolute inset-0 transition-opacity duration-1000 ${i === heroBg ? 'opacity-60' : 'opacity-0'}`}
              aria-hidden="true"
            >
              {near && (
                <CroppedImage
                src={getImageUrl(p.hero_image || p.primary_image)}
                  crop={crop}
                  imgProps={{ fetchPriority: i === 0 ? 'high' : 'auto' }}
                  onError={e => { e.currentTarget.style.display = 'none'; }}
                />
              )}
            </div>
          );
        })}
        <div className="absolute inset-0 bg-black/30" aria-hidden="true"/>

        {featured.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 z-10 border border-white/30 text-white p-3 hover:bg-white/10 transition-all" aria-label="Anterior">
              <ChevronLeft size={20}/>
            </button>
            <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 z-10 border border-white/30 text-white p-3 hover:bg-white/10 transition-all" aria-label="Próxima">
              <ChevronRight size={20}/>
            </button>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {featured.map((_, i) => (
                <button key={i} onClick={() => { clearInterval(timer.current); setHeroBg(i); }}
                  className={`h-px transition-all ${i === heroBg ? 'w-8 bg-white' : 'w-4 bg-white/40'}`}
                  aria-label={`Destaque ${i + 1}`}/>
              ))}
            </div>
          </>
        )}

        <div className="relative z-10 text-center px-6 py-20 max-w-3xl mx-auto">
          <p className="text-white/50 text-xs tracking-[0.5em] uppercase mb-6 font-medium">Curadoria Especial</p>
          <h1 className="italic font-display text-5xl md:text-7xl font-light text-white tracking-wider leading-none mb-6">
            Mobiliário com<br/><em className="italic text-white/75">História</em>
          </h1>
          <p className="font-light text-white/55 text-base mb-10 max-w-md mx-auto leading-relaxed">
            Uma seleção de móveis para compor <br></br>ambientes com personalidade
          </p>
          <Link href="/acervo-colecao" className="btn-outline-white">
            Ver Acervo <ArrowRight size={14}/>
          </Link>
        </div>
      </section>

      {/* Destaques */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20" aria-labelledby="dest-h">
        <div className="text-center mb-12">
          <h2 id="dest-h" className="section-title">Peças em Destaque</h2>
          <div className="section-divider"/>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading
            ? Array.from({length:4}).map((_,i) => <Skel key={i}/>)
            : featured.map((p,i) => <ProductCard key={p.id} product={p} index={i}/>)}
        </div>
        <div className="text-center mt-12">
          <Link href="/acervo-colecao" className="btn-outline">Ver Acervo Completo</Link>
        </div>
      </section>

      {/* Últimas peças */}
      <section className="bg-site-bg2 py-20" aria-labelledby="rec-h">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 id="rec-h" className="section-title">Últimas Peças</h2>
            <div className="section-divider"/>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading
              ? Array.from({length:8}).map((_,i) => <Skel key={i}/>)
              : recent.map((p,i) => <ProductCard key={p.id} product={p} index={i}/>)}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-black py-20 text-center">
        <div className="max-w-xl mx-auto px-6">
          <h2 className="font-display text-3xl font-light text-white tracking-wider mb-4">Encontrou algo especial?</h2>
          <p className="font-light text-white/55 mb-8 text-sm leading-relaxed">
            Nosso acervo vai além do site. Entre em contato para descobrir outras peças disponíveis.
          </p>
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP}?text=${encodeURIComponent('Olá! Gostaria de saber mais sobre as peças disponíveis.')}`}
            target="_blank" rel="noopener noreferrer"
            className="btn-outline-white"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
            Falar pelo WhatsApp
          </a>
        </div>
      </section>
    </>
  );
}
