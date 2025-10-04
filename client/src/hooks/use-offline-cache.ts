import { useState, useCallback } from 'react';

interface CacheProgress {
  total: number;
  cached: number;
  currentHymn: string;
}

export function useOfflineCache() {
  const [isCaching, setIsCaching] = useState(false);
  const [progress, setProgress] = useState<CacheProgress>({ total: 0, cached: 0, currentHymn: '' });

  const cacheHymnsForOffline = useCallback(async (hymns: Array<{ titulo: string; url: string }>) => {
    setIsCaching(true);
    setProgress({ total: hymns.length, cached: 0, currentHymn: '' });

    try {
      if (!('caches' in window)) {
        throw new Error('Cache API não disponível');
      }

      const cache = await caches.open('audio-files-belem-play-v1');

      for (let i = 0; i < hymns.length; i++) {
        const hymn = hymns[i];
        setProgress({ total: hymns.length, cached: i, currentHymn: hymn.titulo });

        if (hymn.url && hymn.url.trim() !== '') {
          try {
            const response = await fetch(hymn.url, {
              mode: 'cors',
              credentials: 'omit'
            });

            if (response.ok) {
              await cache.put(hymn.url, response);
              console.log(`[Cache] Hino "${hymn.titulo}" baixado com sucesso`);
            }
          } catch (error) {
            console.warn(`[Cache] Erro ao baixar hino "${hymn.titulo}":`, error);
          }
        }
      }

      setProgress({ total: hymns.length, cached: hymns.length, currentHymn: '' });
      
      setTimeout(() => {
        setIsCaching(false);
      }, 1000);

      return true;
    } catch (error) {
      console.error('[Cache] Erro ao fazer cache dos hinos:', error);
      setIsCaching(false);
      return false;
    }
  }, []);

  const checkCachedHymns = useCallback(async (hymns: Array<{ url: string }>) => {
    try {
      if (!('caches' in window)) {
        return 0;
      }

      const cache = await caches.open('audio-files-belem-play-v1');
      let cachedCount = 0;

      for (const hymn of hymns) {
        if (hymn.url && hymn.url.trim() !== '') {
          const cached = await cache.match(hymn.url);
          if (cached) {
            cachedCount++;
          }
        }
      }

      return cachedCount;
    } catch (error) {
      console.error('[Cache] Erro ao verificar hinos em cache:', error);
      return 0;
    }
  }, []);

  return {
    isCaching,
    progress,
    cacheHymnsForOffline,
    checkCachedHymns
  };
}
