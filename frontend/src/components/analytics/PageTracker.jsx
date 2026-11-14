import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { trackView, endView } from '@/lib/analytics';

// Registra cada página visitada (sem renderizar nada na tela).
export default function PageTracker() {
  const router = useRouter();
  useEffect(() => {
    const onRoute = url => trackView(url);
    trackView(router.asPath);
    router.events.on('routeChangeComplete', onRoute);
    return () => { router.events.off('routeChangeComplete', onRoute); endView(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
