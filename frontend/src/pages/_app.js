
import '@/styles/globals.css';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import Script from 'next/script';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import WhatsAppButton from '@/components/layout/WhatsAppButton';
import PageTracker from '@/components/analytics/PageTracker';

// Carregado sob demanda: apenas o admin utiliza esta biblioteca
const Toaster = dynamic(
  () => import('react-hot-toast').then(m => m.Toaster),
  { ssr: false }
);

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const isAdmin = router.pathname.startsWith('/admin');

  return (
    <>
     

      {/* Avisos utilizados apenas no painel administrativo */}
      {isAdmin && (
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#000',
              color: '#fff',
              fontFamily: 'Montserrat,sans-serif',
              fontSize: '12px',
              letterSpacing: '0.05em'
            }
          }}
        />
      )}

      {!isAdmin && <PageTracker />}
      {!isAdmin && <Header />}

      <main
        id="main-content"
        className={!isAdmin ? 'pt-36 md:pt-44' : ''}
        role="main"
      >
        <Component {...pageProps} />
      </main>

      {!isAdmin && <Footer />}
      {!isAdmin && <WhatsAppButton />}
    </>
  );
}
