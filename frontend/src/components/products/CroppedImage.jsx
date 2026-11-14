import { useEffect, useRef, useState } from 'react';

// Mostra a foto exatamente como foi enquadrada no editor de recorte (posição E zoom).
// crop = { x, y, width, height } em % da foto. Com zoom abaixo de 100% a região passa de 100%
// e sobra espaço em volta (o fundo da área aparece). Sem crop: foto cobrindo a área, centralizada.
// Ocupa 100% do elemento pai (o pai precisa ser "relative" ou "absolute" e ter tamanho).
export default function CroppedImage({ src, crop, alt = '', onError, imgProps = {} }) {
  const box = useRef(null);
  const img = useRef(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [nat, setNat] = useState(null);

  useEffect(() => {
    const el = box.current; if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure); ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => { // foto já em cache pode carregar antes do onLoad ser ligado
    setNat(null);
    const el = img.current;
    if (el && el.complete && el.naturalWidth) setNat({ w: el.naturalWidth, h: el.naturalHeight });
  }, [src]);

  const valid = crop && [crop.x, crop.y, crop.width, crop.height].every(Number.isFinite) && crop.width > 0 && crop.height > 0;
  let style;
  if (!valid) {
    style = { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' };
  } else if (nat && size.w && size.h) {
    // escala que faz a região enquadrada cobrir a área (como "cover", mas sobre a região)
    const s = Math.max(size.w / (crop.width / 100 * nat.w), size.h / (crop.height / 100 * nat.h));
    const cx = (crop.x + crop.width / 2) / 100 * nat.w;
    const cy = (crop.y + crop.height / 2) / 100 * nat.h;
    style = { position: 'absolute', maxWidth: 'none', width: nat.w * s, height: nat.h * s, left: size.w / 2 - cx * s, top: size.h / 2 - cy * s };
  } else {
    style = { position: 'absolute', visibility: 'hidden' };
  }

  return (
    <div ref={box} className="absolute inset-0 overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={img} src={src} alt={alt} decoding="async" style={style}
        onLoad={e => setNat({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
        onError={onError} {...imgProps}/>
    </div>
  );
}
