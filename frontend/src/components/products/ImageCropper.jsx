import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { ZoomIn, ZoomOut, Check, X, RotateCcw } from 'lucide-react';
import CroppedImage from '@/components/products/CroppedImage';

const MIN_ZOOM = 0.4;   // 40%  — afasta: a foto fica menor que o quadro, sobra espaço preto em volta
const MAX_ZOOM = 4;     // 400% — aproxima
const clampZoom = z => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(z * 100) / 100));

function Preview({ aspect, label, imageUrl, area, width }) {
  return (
    <div className="mx-auto" style={{ width }}>
      <p className="text-white/40 text-xs mb-1.5 text-center">{label}</p>
      <div className="relative bg-black overflow-hidden border border-white/20" style={{ aspectRatio: aspect }}>
        <CroppedImage src={imageUrl} crop={area}/>
      </div>
    </div>
  );
}

export default function ImageCropper({ imageUrl, onSave, onCancel, aspect = 16 / 9, label = 'destaque da home' }) {
  const [crop,        setCrop]        = useState({ x: 0, y: 0 });
  const [zoom,        setZoom]        = useState(1);
  const [croppedArea, setCroppedArea] = useState(null);
  const [saving,      setSaving]      = useState(false);

  const onCropComplete = useCallback(area => setCroppedArea(area), []);
  const reset = () => { setZoom(1); setCrop({ x: 0, y: 0 }); };

  const handleSave = async () => {
    if (!croppedArea) return;
    setSaving(true);
    try { await onSave(croppedArea); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col" role="dialog" aria-modal="true" aria-label="Recortar imagem">
      <div className="flex items-center justify-between px-5 py-3 bg-black border-b border-white/10 flex-shrink-0">
        <div>
          <p className="text-white text-sm font-medium">Ajustar enquadramento</p>
          <p className="text-white/40 text-xs mt-0.5">
            Arraste a foto e use o zoom (de {Math.round(MIN_ZOOM * 100)}% a {MAX_ZOOM * 100}%) para enquadrar — como vai aparecer no <span className="text-white/60">{label}</span>
          </p>
        </div>
        <button onClick={onCancel} className="text-white/60 hover:text-white p-1 ml-4 flex-shrink-0" aria-label="Fechar"><X size={20}/></button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="relative flex-1">
          <Cropper
            image={imageUrl} crop={crop} zoom={zoom} aspect={aspect}
            minZoom={MIN_ZOOM} maxZoom={MAX_ZOOM}
            restrictPosition={false}   /* permite afastar: a foto pode ficar menor que o quadro */
            zoomSpeed={0.5}
            onCropChange={setCrop} onZoomChange={z => setZoom(clampZoom(z))} onCropComplete={onCropComplete}
            showGrid style={{ containerStyle: { background: '#111' } }}
          />
        </div>

        <div className="w-56 bg-zinc-950 border-l border-white/10 flex flex-col p-4 gap-5 flex-shrink-0 overflow-y-auto">
          <p className="text-white/50 text-xs tracking-widest uppercase text-center font-medium pt-1">Preview</p>
          <Preview aspect="16 / 9" width="100%" label="Computador (tela inicial)" imageUrl={imageUrl} area={croppedArea}/>
          <Preview aspect="9 / 16" width="55%"  label="Celular (tela inicial)"    imageUrl={imageUrl} area={croppedArea}/>
          {!croppedArea && <p className="text-white/20 text-xs text-center leading-relaxed">Arraste a imagem para ver o preview</p>}
        </div>
      </div>

      <div className="bg-black border-t border-white/10 px-5 py-4 flex-shrink-0">
        <div className="flex items-center gap-3 mb-4 max-w-lg mx-auto">
          <button onClick={() => setZoom(z => clampZoom(z - 0.1))} disabled={zoom <= MIN_ZOOM} className="text-white/70 hover:text-white p-1 disabled:opacity-30" aria-label="Afastar (diminuir zoom)"><ZoomOut size={18}/></button>
          <input type="range" min={MIN_ZOOM} max={MAX_ZOOM} step={0.05} value={zoom}
            onChange={e => setZoom(clampZoom(Number(e.target.value)))} className="flex-1 accent-white" aria-label="Nível de zoom"/>
          <button onClick={() => setZoom(z => clampZoom(z + 0.1))} disabled={zoom >= MAX_ZOOM} className="text-white/70 hover:text-white p-1 disabled:opacity-30" aria-label="Aproximar (aumentar zoom)"><ZoomIn size={18}/></button>
          <span className="text-white/60 text-xs w-12 text-right tabular-nums" aria-live="polite">{Math.round(zoom * 100)}%</span>
          <button onClick={reset} className="text-white/70 hover:text-white p-1" aria-label="Voltar a 100% e centralizar" title="Voltar a 100% e centralizar"><RotateCcw size={15}/></button>
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={onCancel} className="border border-white/30 text-white px-6 py-2 text-xs tracking-widest uppercase hover:bg-white/10 transition-all">Cancelar</button>
          <button onClick={handleSave} disabled={saving || !croppedArea}
            className="bg-white text-black px-8 py-2 text-xs tracking-widest uppercase hover:bg-white/90 transition-all disabled:opacity-40 flex items-center gap-2 font-medium">
            <Check size={13}/>{saving ? 'Salvando...' : 'Salvar Enquadramento'}
          </button>
        </div>
      </div>
    </div>
  );
}
