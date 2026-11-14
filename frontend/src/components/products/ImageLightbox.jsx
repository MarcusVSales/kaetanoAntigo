import { useState, useEffect, useRef } from 'react';
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

const MIN = 0.5, MAX = 4, STEP = 0.25;
const clamp = z => Math.min(MAX, Math.max(MIN, Math.round(z * 100) / 100));

// Foto em tela cheia para o cliente: zoom de 50% a 400% (aproxima E afasta),
// arrastar para mover, roda do mouse e teclado (+ / - / 0 / setas / Esc).
export default function ImageLightbox({ src, alt, total = 1, onPrev, onNext, onClose }) {
  const [zoom, setZoom] = useState(1);
  const [pos, setPos]   = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState(false);
  const start = useRef(null);

  const reset = () => { setZoom(1); setPos({ x: 0, y: 0 }); };
  useEffect(reset, [src]);                       // trocou de foto → volta ao normal

  useEffect(() => {                              // trava a rolagem da página por trás
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const key = e => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft' && total > 1) onPrev?.();
      else if (e.key === 'ArrowRight' && total > 1) onNext?.();
      else if (e.key === '+' || e.key === '=') setZoom(z => clamp(z + STEP));
      else if (e.key === '-' || e.key === '_') setZoom(z => clamp(z - STEP));
      else if (e.key === '0') reset();
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onClose, onPrev, onNext, total]);

  const down = e => { e.currentTarget.setPointerCapture(e.pointerId); start.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }; setDrag(true); };
  const move = e => { if (start.current) setPos({ x: e.clientX - start.current.x, y: e.clientY - start.current.y }); };
  const up   = () => { start.current = null; setDrag(false); };
  const wheel = e => setZoom(z => clamp(z + (e.deltaY < 0 ? 0.15 : -0.15)));

  const ctl = 'text-white p-2 disabled:opacity-30 hover:bg-white/10 transition-colors';
  return (
    <div className="fixed inset-0 z-[100] bg-black" role="dialog" aria-modal="true" aria-label={`Foto ampliada: ${alt}`} onWheel={wheel}>
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} draggable={false}
          onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
          onError={e => { e.currentTarget.src = '/images/placeholder.svg'; }}
          style={{
            transform: `translate(${pos.x}px, ${pos.y}px) scale(${zoom})`, transformOrigin: 'center',
            transition: drag ? 'none' : 'transform .15s', maxWidth: '90vw', maxHeight: '82vh', objectFit: 'contain',
            cursor: drag ? 'grabbing' : 'grab', touchAction: 'none', userSelect: 'none', display: 'block',
          }}/>
      </div>

      <button onClick={onClose} aria-label="Fechar" className="absolute top-4 right-4 text-white/70 hover:text-white p-2"><X size={26}/></button>

      {total > 1 && (<>
        <button onClick={onPrev} aria-label="Foto anterior" className="absolute left-3 top-1/2 -translate-y-1/2 text-white border border-white/20 p-3 hover:bg-white/10"><ChevronLeft size={22}/></button>
        <button onClick={onNext} aria-label="Próxima foto" className="absolute right-3 top-1/2 -translate-y-1/2 text-white border border-white/20 p-3 hover:bg-white/10"><ChevronRight size={22}/></button>
      </>)}

      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white/10 backdrop-blur px-3 py-1.5 rounded-full">
        <button onClick={() => setZoom(z => clamp(z - STEP))} disabled={zoom <= MIN} aria-label="Diminuir zoom" className={ctl}><ZoomOut size={16}/></button>
        <span className="text-white text-xs w-12 text-center tabular-nums" aria-live="polite">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(z => clamp(z + STEP))} disabled={zoom >= MAX} aria-label="Aumentar zoom" className={ctl}><ZoomIn size={16}/></button>
        <button onClick={reset} aria-label="Voltar ao tamanho normal" title="Tamanho normal" className={ctl}><RotateCcw size={14}/></button>
      </div>
    </div>
  );
}
