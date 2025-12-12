import { useEffect, useMemo, useState } from 'react';
import { fetchCats } from '../data/catsApi';
import { Cat } from '../types/cat';

type StatusFilter = 'all' | 'needs-help' | 'healthy' | 'adopted';

export const useCats = () => {
  const [cats, setCats] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>('all');

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCats();
      setCats(data);
    } catch (e) {
      console.error(e);
      setError('Unable to load cats right now');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredCats = useMemo(() => {
    if (filter === 'all') return cats;
    return cats.filter((cat) => {
      const status = (cat.status ?? '').toLowerCase();
      if (filter === 'needs-help') return status.includes('needs help');
      if (filter === 'healthy') return status.includes('healthy');
      if (filter === 'adopted') return status.includes('adopted');
      return true;
    });
  }, [cats, filter]);

  return {
    cats: filteredCats,
    rawCats: cats,
    loading,
    error,
    filter,
    setFilter,
    refresh: load,
  };
};
