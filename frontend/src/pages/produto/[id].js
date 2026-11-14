import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import ImageLightbox from '@/components/products/ImageLightbox';
import { productsAPI, getImageUrl, getThumbUrl, thumbFallback, getWhatsAppLink } from '@/lib/api';

export default function ProductPage() {
  const router = useRouter();
  const { id } = router.query;
  const [product,  setProduct]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [active,   setActive]   = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    productsAPI.get(id)
      .then(r => setProduct(r.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const images = product?.images?.length > 0 ? product.images : [{ filename: null }];
  const total  = images.length;

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="aspect-[4/5] bg-site-border"/>
        <div className="space-y-4 pt-8">
          <div className="h-4 bg-site-border w-1/4"/>
          <div className="h-8 bg-site-bg2 w-3/4"/>
        </div>
      </div>
    </div>
  );

  if (notFound || !product) return (
    <div className="text-center py-32">
      <h1 className="font-display text-3xl font-light text-black mb-6">Peça não encontrada</h1>
      <Link href="/acervo-colecao" className="btn-outline">Ver Acervo</Link>
    </div>
  );

  const currentImg = getImageUrl(images[active]?.filename);

  return (
    <>
      <Head>
        <title>{product.name} — Kaetano Antigo</title>
        <meta name="description" content={product.description || product.name}/>
      </Head>

      {lightbox && (
        <ImageLightbox src={currentImg} alt={product.name} total={total}
          onPrev={() => setActive(i => (i - 1 + total) % total)}
          onNext={() => setActive(i => (i + 1) % total)}
          onClose={() => setLightbox(false)}/>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-xs text-site-text3 font-medium">
            <li><Link href="/" className="hover:text-black">Início</Link></li>
            <li>›</li>
            <li><Link href={`/acervo-colecao?categoria=${encodeURIComponent(product.category)}`} className="hover:text-black">{product.category}</Link></li>
            <li>›</li>
            <li className="text-black">{product.name}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">

          {/* Galeria */}
          <div>
            <div
              className="relative aspect-[4/5] bg-site-bg2 overflow-hidden mb-3 cursor-zoom-in group border border-site-border"
              onClick={() => setLightbox(true)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentImg}
                alt={`${product.name} — foto ${active+1} de ${total}`}
                className="w-full h-full object-cover"
                onError={e => { e.currentTarget.src = '/images/placeholder.svg'; }}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-all">
                <ZoomIn size={28} className="text-white opacity-0 group-hover:opacity-70 transition-opacity"/>
              </div>
              {total > 1 && (
                <>
                  <button onClick={e => { e.stopPropagation(); setActive(i=>(i-1+total)%total); }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 transition-all"><ChevronLeft size={18}/></button>
                  <button onClick={e => { e.stopPropagation(); setActive(i=>(i+1)%total); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 transition-all"><ChevronRight size={18}/></button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_,i) => (
                      <button key={i} onClick={e => { e.stopPropagation(); setActive(i); }}
                        className={`h-1 rounded-full transition-all ${i===active?'w-5 bg-black':'w-2 bg-black/30'}`}/>
                    ))}
                  </div>
                </>
              )}
            </div>
            <p className="text-xs text-site-text3 text-center mb-3 font-light">Clique para ampliar</p>

            {/* Miniaturas */}
            {total > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setActive(i)}
                    className={`flex-shrink-0 w-16 h-16 relative border-2 overflow-hidden transition-all ${i===active?'border-black':'border-transparent hover:border-site-border'}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={getThumbUrl(img.filename)} alt={`Miniatura ${i+1}`}
                      loading="lazy" decoding="async"
                      className="w-full h-full object-cover"
                      onError={e => thumbFallback(e, img.filename)}/>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Informações */}
          <div className="flex flex-col">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-xs tracking-widest uppercase text-site-text2 border border-site-border px-3 py-1 font-medium">{product.category}</span>
              {product.decade && (
                <span className="text-xs tracking-widest uppercase text-white bg-black px-3 py-1 font-medium">Década de {product.decade}</span>
              )}
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-light text-black leading-tight mb-4">{product.name}</h1>
            <div className="w-10 h-px bg-black mb-6"/>
            {product.price && (
              <p className="font-display text-2xl text-black mb-6 font-light">
                {new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(product.price)}
              </p>
            )}
            {product.description && (
              <div className="mb-8">
                <h2 className="label-field">Descrição</h2>
                <p className="font-light text-site-text2 leading-relaxed text-sm">{product.description}</p>
              </div>
            )}
            {product.quantity > 1 && (
              <p className="text-sm text-site-text2 mb-6 font-medium">{product.quantity} unidades disponíveis</p>
            )}
            <a href={getWhatsAppLink(product.name)} target="_blank" rel="noopener noreferrer"
              className="btn-primary mb-4 text-xs justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
              Tenho Interesse — WhatsApp
            </a>
            <Link href="/acervo-colecao" className="flex items-center gap-2 text-xs tracking-widest uppercase font-medium text-site-text2 hover:text-black transition-colors mt-2">
              <ArrowLeft size={13}/> Voltar ao Acervo
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
