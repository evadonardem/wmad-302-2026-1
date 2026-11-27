import { useCallback, useEffect, useRef, useState } from 'react';

type Status = 'loading' | 'ready' | 'loadingMore' | 'refreshing' | 'error';

interface PageResult<T> {
  items: T[];
  total: number;
}

export function useInfiniteList<T>(
  fetchPage: (skip: number, limit: number) => Promise<PageResult<T>>,
  limit: number = 20
) {
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);
  const itemsRef = useRef<T[]>([]);
  const totalRef = useRef(0);
  const requestIdRef = useRef(0);
  const loadingRef = useRef(false);

  const load = useCallback(
    async (replace: boolean) => {
      if (!replace && (loadingRef.current || itemsRef.current.length >= totalRef.current)) return;

      loadingRef.current = true;
      const requestId = ++requestIdRef.current;
      setStatus(replace ? (itemsRef.current.length === 0 ? 'loading' : 'refreshing') : 'loadingMore');
      setError(null);

      try {
        const skip = replace ? 0 : itemsRef.current.length;
        const result = await fetchPage(skip, limit);
        if (requestId !== requestIdRef.current) return;
        const nextItems = replace ? result.items : [...itemsRef.current, ...result.items];
        itemsRef.current = nextItems;
        totalRef.current = result.total;
        setItems(nextItems);
        setTotal(result.total);
        setStatus('ready');
      } catch (caught) {
        if (requestId === requestIdRef.current) {
          setError(caught instanceof Error ? caught.message : 'Could not load items.');
          setStatus('error');
        }
      } finally {
        if (requestId === requestIdRef.current) loadingRef.current = false;
      }
    },
    [fetchPage, limit]
  );

  useEffect(() => {
    void load(true);
  }, [load]);

  const reload = useCallback(() => load(true), [load]);
  const refresh = useCallback(() => load(true), [load]);
  const loadMore = useCallback(() => load(false), [load]);

  return {
    items,
    status,
    error,
    hasMore: items.length < total,
    reload,
    refresh,
    loadMore,
  };
}
