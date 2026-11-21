import { useEffect, useState } from 'react';

/** Returns `serverDefault` until mounted so server and first client render match, then the live value. */
export function useMediaQuery(query: string, serverDefault: boolean): boolean {
  const [matches, setMatches] = useState(serverDefault);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, [query]);
  return matches;
}
