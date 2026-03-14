import { useState, useEffect } from 'react';
import { getCurrentPrice } from '../api/priceApi';
import { GoldPrice } from '../types';
import { PRICE_POLL_INTERVAL } from '../utils/constants';

export function useGoldPrice() {
  const [price, setPrice] = useState<GoldPrice | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPrice = async () => {
    try {
      const res = await getCurrentPrice();
      setPrice(res.data);
    } catch (err) {
      console.error('Failed to fetch gold price:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrice();
    const interval = setInterval(fetchPrice, PRICE_POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return { price, loading, refetch: fetchPrice };
}
