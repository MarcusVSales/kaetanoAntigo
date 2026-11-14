import { Html, Head, Main, NextScript } from 'next/document';
export default function Document() {
  return (
    <Html lang="pt-BR">
      <Head>
        <meta charSet="utf-8"/>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,300;0,400;0,500;0,700;1,300&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,400&display=swap" rel="stylesheet"/>
      </Head>
      <body>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-black focus:text-white focus:px-4 focus:py-2 focus:text-xs">Pular para o conteúdo</a>
        <Main/><NextScript/>
      </body>
    </Html>
  );
}
