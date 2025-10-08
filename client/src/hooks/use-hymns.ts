import { useCallback, useEffect, useState } from 'react';
import type { OfflineHymn } from '@/lib/offline-db';
import { getHymnsByOrgan } from '@/lib/offline-db';

export interface OfflineHymnResult extends OfflineHymn {}

export function useHymns(organKey: string) {
  const [hymns, setHymns] = useState<OfflineHymnResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadHymns = useCallback(async () => {
    if (!organKey) {
      setHymns([]);
      return;
    }

    setIsLoading(true);
    try {
      const data = await getHymnsByOrgan(organKey);
      setHymns(data);
      setError(null);
    } catch (err) {
      console.error('Erro ao carregar hinos locais:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [organKey]);

  useEffect(() => {
    loadHymns();
  }, [loadHymns]);

  useEffect(() => {
    const handleChange = (event: Event) => {
      const detail = (event as CustomEvent).detail as { organKey?: string } | undefined;
      if (!detail?.organKey || detail.organKey === organKey) {
        loadHymns();
      }
    };

    window.addEventListener('hymn-db-changed', handleChange);
    return () => {
      window.removeEventListener('hymn-db-changed', handleChange);
    };
  }, [organKey, loadHymns]);

  return {
    hymns,
    isLoading,
    error,
    isOnline: false,
    hasOfflineData: true,
    refetch: loadHymns,
  };
}

export function useHymnByIndex(organKey: string, hymnIndex: number) {
  const { hymns, isLoading, error, isOnline } = useHymns(organKey);

  const hymn = hymns[hymnIndex] || null;

  return {
    hymn,
    isLoading,
    error,
    isOnline,
  };
}