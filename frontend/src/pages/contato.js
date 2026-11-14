import Head from 'next/head';
import { Instagram } from 'lucide-react';
export default function Contato(){
  const num=process.env.NEXT_PUBLIC_WHATSAPP||'5511965713610';
  const wa=`https://wa.me/${num}?text=${encodeURIComponent('Olá! Gostaria de saber mais sobre as peças disponíveis.')}`;
  return(<>
    <Head><title>Contato — Kaetano Antigo</title></Head>
    <section className="text-center py-14 bg-site-bg2 border-b border-site-border"><h1 className="section-title">Contato</h1><div className="section-divider"/></section>
    <div className="max-w-2xl mx-auto px-10 sm:px-6 py-20">
      <p className="font-display text-xl font-light text-center text-black mb-4 italic">Encontre a peça ideal para o seu ambiente. Fale conosco:</p>
      <p className="text-site-text2 text-sm font-light text-center leading-relaxed mb-14">Entre em contato pelo WhatsApp e conheça nosso acervo no Instagram.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a href={wa} target="_blank" rel="noopener noreferrer" className="block p-8 border border-black text-center hover:bg-black hover:text-white transition-all group">
          <div className="w-12 h-12 border border-black group-hover:border-white rounded-full flex items-center justify-center mx-auto mb-4 transition-all">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
          </div>
          <h2 className="text-xs tracking-widest uppercase font-medium mb-1">WhatsApp</h2>
          <p className="text-xs text-site-text3 group-hover:text-white/70">+55 11 96571-3610</p>
        </a>
        <a href="https://instagram.com/kaetanoantigo" target="_blank" rel="noopener noreferrer" className="block p-8 border border-black text-center hover:bg-black hover:text-white transition-all group">
          <div className="w-12 h-12 border border-black group-hover:border-white rounded-full flex items-center justify-center mx-auto mb-4 transition-all"><Instagram size={20}/></div>
          <h2 className="text-xs tracking-widest uppercase font-medium mb-1">Instagram</h2>
          <p className="text-xs text-site-text3 group-hover:text-white/70">@kaetanoantigo</p>
        </a>
      </div>
      <div className="border-t border-site-border mt-14 pt-12 text-center">
        <h3 className="text-xs tracking-[0.3em] uppercase text-site-text3 mb-4 font-medium">Atendimento</h3>
        <p className="text-sm font-light text-site-text2 leading-relaxed">Segunda a sexta: 9h às 17h<br/>Sábado: 9h às 15h<br/><span className="text-site-text3">Domingos e feriados: fechado<br></br><br></br><br></br>Endereço I: Avenida São João, 1983 - Santa Cecília, São Paulo - SP <br></br>Endereço II: Avenida São João, 2115 - Santa Cecília, São Paulo - SP  </span></p>
      </div>
    </div>
  </>);
}
