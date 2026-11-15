import Head from 'next/head';
import Image from 'next/image';
export default function NossaHistoria(){
  return(<>
    <Head><title>Nossa História — Kaetano Antigo</title></Head>
    <section className="text-center font-size py-14 bg-site-bg2 border-b border-site-border"><h1 className="section-title font-Montserrat">Nossa História</h1><div className="section-divider"/></section>
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <div>
          <h2 className="font-display text-3xl md:text-4xl font-light text-black mb-6 leading-tight">Do clássico ao modernista, uma curadoria feita por quem vive antiguidades há mais de <br/>
          <em className="italic"> quatro décadas.</em></h2>
          <div className="w-10 h-px bg-black mb-8"/>
          <div className="space-y-5 font-light text-site-text2 leading-relaxed text-sm">
            <p>A Kaetano Antigo é uma empresa familiar formada por Caetano, Luciene, Kelly e Kelvin. Nosso nome homenageia o pai, restaurador   e curador das peças, com o “K” dos filhos, que cuidam da parte comercial e digital.<br></br><br></br>
            Nossa história começa com Caetano, que entrou no universo das antiguidades aos 17 anos e soma mais de quatro décadas de experiência em restauração. Em 2010, abrimos a Arte Móveis, dedicada ao mobiliário clássico. Em 2022, nasceu a Kaetano Antigo, com um olhar voltado ao design modernista brasileiro     dos anos 1950, 1960 e 1970.<br></br><br></br>
            Trabalhamos com compra, venda, restauração e locação de móveis, luminárias e objetos de decoração. Nossa seleção reúne peças modernistas e clássicas que já fizeram parte de filmes, séries, novelas e projetos de arquitetura e cenografia.<br></br><br></br>
            Estamos em Santa Cecília, São Paulo, com o Minhocão como cenário de muitas das nossas fotos, feitas na própria calçada da loja. Um jeito espontâneo de apresentar móveis com história e personalidade. Fazemos entregas na cidade e envios para outros estados.</p>
           
          </div>
        </div>
          <div className="relative sticky top-24 self-start">
          <div className="relative aspect-[3/4] overflow-hidden bg-site-bg2 border border-site-border">
          <Image src="/images/kaetanohistoria.jpg" alt="Foto de Kaetano" fill className="object-cover" sizes="(max-width:1000px) 100vw,50vw"/>
        </div>
          <div className="absolute -bottom-3 -left-3 w-20 h-20 border border-black/20 -z-10" aria-hidden="true"/>
       </div>
      <div className="absolute -bottom-3 -left-3 w-20 h-20 border border-black/20 -z-10" aria-hidden="true"/>
    </div>
  </div>

  </>);
}
