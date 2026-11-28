import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getLocalOrders } from '@/services/orderStorage';
import { productApi } from '@/services/productApi';
import type { Cart } from '@/types/product';

export function useOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Cart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const reload = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    if (!user) {
      setOrders([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [localOrders, remoteOrders] = await Promise.all([
        getLocalOrders(user.id),
        user.isLocal ? Promise.resolve([]) : productApi.getUserCart(user.id).then((response) => response.carts),
      ]);
      if (requestId === requestIdRef.current) setOrders([...localOrders, ...remoteOrders]);
    } catch (caught) {
      if (requestId === requestIdRef.current) {
        setError(caught instanceof Error ? caught.message : 'Could not load orders.');
      }
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void reload();
    return () => {
      requestIdRef.current += 1;
    };
  }, [reload]);

  return { orders, loading, error, reload };
}
