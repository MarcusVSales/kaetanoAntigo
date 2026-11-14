import Head from 'next/head';
export default function Restauro(){
  const wa=`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP||'5511965713610'}?text=${encodeURIComponent('Olá! Gostaria de solicitar um orçamento de restauro.')}`;
  return(<>
    <Head><title>Restauro — Kaetano Antigo</title></Head>
    <section className="text-center py-14 bg-site-bg2 border-b border-site-border"><h1 className="section-title">Restauro</h1><div className="section-divider"/><p className="text-site-text3 text-sm font-light mt-3">Cuidados com a sua peça e orçamentos</p></section>
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20 space-y-16">
      <div><h2 className="font-display text-2xl font-light text-black mb-2">Política de Restauro</h2><div className="w-8 h-px bg-black mb-8"/>
        <div className="space-y-4 text-sm text-site-text2 font-light leading-relaxed">
          <p> Nossas peças são avaliadas individualmente e, quando necessário, passam por processos
              de restauração realizados com respeito às características originais do móvel.
              Nosso trabalho é especializado em estrutura, acabamento em madeira, buscando preservar
              autencididade, a história e a qualidade de cada peça.

              Não realizamos serviços de palha, tapeçaria, estofamento, vidraçaria, espelhos ou
              outros acabamentos especializados. Quando presentes, esses elementos podem permanecer
              em seu estado original.

              Por serem móveis antigos, marcas naturais do tempo podem permanecer visíveis e fazem parte
              do charme e da originalidade de cada peça.
            </p>
        </div>
      </div>
      <div><h2 className="font-display text-2xl font-light text-black mb-2">Cuidados com Móveis Antigos</h2><div className="w-8 h-px bg-black mb-8"/>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[{title:'Limpeza',text:'Nada de alvejantes, álcool ou produtos abrasivos! Para limpar, use um pano macio levemente umedecido com óleo de peroba ou lustra-móveis próprio para madeira.'},{title:'Umidade',text:'Nunca use panos molhados na estrutura ou no tampo. A umidade pode causar manchas permanentes e danificar o acabamento.'},{title:'Sol Direto',text:' Evite locais expostos diretamente ao sol e à chuva. Essas condições podem comprometer a madeira e alterar sua cor.'},{title:'Dicas extras',text:'Não coloque panelas ou objetos quentes diretamente sobre a superfície. Sempre use protetores térmicos para evitar manchas e danos. Peças dos anos 50 e 60, com pés mais finos, são mais delicadas. Evite subir nelas ou arrastá-las enquanto estão sendo usadas, para não comprometer a estrutura.'}].map(c=>(
            <div key={c.title} className="border border-site-border p-6"><h3 className="font-medium text-black text-sm tracking-wider uppercase mb-3">{c.title}</h3><p className="text-site-text2 text-sm font-light leading-relaxed">{c.text}</p></div>
          ))}
        </div>
      </div>
      <div className="bg-black text-white p-10 text-center">
        <h2 className="font-display text-3xl font-light tracking-wider mb-4">Solicite um Orçamento</h2>
        <p className="text-white/60 text-sm font-light mb-8 max-w-md mx-auto leading-relaxed">Tem uma peça para restaurar? <br></br>Fale conosco pelo WhatsApp e solicite um orçamento.</p>
        <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-outline-white">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
          Pedir Orçamento pelo WhatsApp
        </a>
      </div>
    </div>
  </>);
}
