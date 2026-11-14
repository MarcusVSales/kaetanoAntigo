import Link from 'next/link';
import { getThumbUrl, thumbFallback } from '@/lib/api';

export default function ProductCard({ product, index = 0 }) {
  const imgUrl = getThumbUrl(product.primary_image);
  return (
    <article className="group animate-fade-in-up" style={{ animationDelay:`${index*60}ms`, animationFillMode:'both' }}>
      <Link href={`/produto/${product.id}`} className="block">
        <div className="relative overflow-hidden bg-site-bg2 aspect-[3/4]">
          {/* Usa img nativo para evitar restrições do Next/Image em localhost */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgUrl}
            alt={`Foto de ${product.name}`}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={e => thumbFallback(e, product.primary_image)}
            loading={index < 4 ? 'eager' : 'lazy'}
            decoding="async"
          />
          {product.decade && (
            <span className="absolute top-3 left-3 bg-black text-white text-xs px-2 py-1 font-medium tracking-wider">
              {product.decade}s
            </span>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300"/>
        </div>
        <div className="py-4">
          <p className="text-xs tracking-widest uppercase text-site-text3 mb-1 font-medium">{product.category}</p>
          <h2 className="font-display text-lg font-light text-black group-hover:text-zinc-600 transition-colors leading-snug">{product.name}</h2>
          {product.price && (
            <p className="text-sm text-black font-medium mt-2">
              {new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(product.price)}
            </p>
          )}
          <div className="w-8 h-px bg-black mt-3 transition-all duration-300 group-hover:w-16"/>
        </div>
      </Link>
    </article>
  );
}
