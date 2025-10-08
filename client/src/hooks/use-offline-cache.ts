import { useMemo } from 'react';

interface CacheProgress {
  total: number;
  cached: number;
  currentHymn: string;
}

export function useOfflineCache() {
  const progress: CacheProgress = useMemo(() => ({
    total: 0,
    cached: 0,
    currentHymn: '',
  }), []);

  const cacheHymnsForOffline = async (hymns: Array<{ titulo: string; url: string }>) => {
    // Todos os hinos já estão disponíveis localmente via IndexedDB
    return hymns.length > 0;
  };

  const checkCachedHymns = async (hymns: Array<{ url: string }>) => {
    // Como a fonte é local, consideramos todos os hinos disponíveis
    return hymns.length;
  };

  return {
    isCaching: false,
    progress,
    cacheHymnsForOffline,
    checkCachedHymns,
  };
}
