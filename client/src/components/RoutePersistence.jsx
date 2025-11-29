import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function RoutePersistence() {
  const location = useLocation();
  const navigate = useNavigate();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      const stored = window.localStorage.getItem('lastPath');
      if (stored && stored !== location.pathname + location.search + location.hash) {
        navigate(stored, { replace: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const path = location.pathname + location.search + location.hash;
    if (!path.startsWith('/login')) {
      window.localStorage.setItem('lastPath', path);
    }
  }, [location]);

  return null;
}
