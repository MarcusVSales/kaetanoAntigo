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
            <p>Somos uma empresa familiar formada por Caetano, Luciene, Kelly e Kelvin. O nome da loja é uma homenagem ao nosso pai, Caetano, restaurador e curador das peças. O “K” foi uma ideia dos filhos, Kelly e Kelvin, que hoje cuidam da parte comercial e digital do antiquário.<br/><br/>A história começou muito antes da Kaetano Antigo existir. Aos 17 anos, Caetano iniciou sua trajetória no universo das antiguidades. Aprendeu o ofício da restauração e, ao longo de mais de quatro décadas, trabalhou em empresas e antiquários reconhecidos, como a Fábrica de Móveis Brasil, Novo Rumo, Lixão Comércio de Móveis e a tradicional Casa Velha. Essa vivência permitiu aperfeiçoar técnicas de restauração e marcenaria que hoje são cada vez mais raras.<br/><br/>Em 2010, incentivado por Luciene, nasceu o primeiro antiquário da família, a Arte Móveis, com foco em mobiliário clássico. Já em 2022, surgiu a Kaetano Antigo, trazendo um olhar voltado ao design modernista brasileiro, especialmente peças das décadas de 1950, 1960 e 1970.<br/><br/>
            Hoje trabalhamos com compra, venda, restauração e locação de mobiliário antigo, além de luminárias, quadros e objetos de decoração. Embora nosso maior foco seja o mobiliário modernista, também selecionamos peças clássicas que fazem parte da nossa história e continuam encantando colecionadores, arquitetos e apaixonados por design.<br/><br/>
            Ao longo dos anos, nossas peças já estiveram presentes em produções da Netflix, filmes como Hebe e a série Senna, além de novelas da Globo e do SBT, peças de teatro e diversos projetos de arquitetura e cenografia. O Caetano também participou do programa do arquiteto Maurício Arruda, compartilhando um pouco do seu trabalho de restauração.<br/><br/>
            E tem uma curiosidade que quem acompanha a gente nas redes já conhece: nossas fotos não são feitas em estúdio. Grande parte delas acontece na calçada da loja, tendo o Minhocão como cenário. É um jeito espontâneo e verdadeiro de mostrar cada peça exatamente como ela é.<br/><br/>
            Estamos em São Paulo e realizamos entregas pela cidade, além de envios para outros estados. Se tiver interesse em alguma peça, entre em contato com a gente. Será um prazer ajudar você a encontrar um móvel cheio de personalidade e história para o seu espaço.  </p>
           
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
