import { useState, useMemo } from 'react';

interface UseSortingProps<T> {
  data: T[];
  initialSort?: { key: keyof T; direction: 'asc' | 'desc' } | null;
}

export function useSorting<T>({ data, initialSort = null }: UseSortingProps<T>) {
  const [sortConfig, setSortConfig] = useState<{ key: keyof T; direction: 'asc' | 'desc' } | null>(initialSort);

  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const { key, direction } = sortConfig;
      let valA = a[key];
      let valB = b[key];

      if (valA === null || valA === undefined) valA = '' as any;
      if (valB === null || valB === undefined) valB = '' as any;

      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  const onSort = (key: keyof T) => {
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  return {
    sortedData,
    sortConfig,
    onSort,
  };
}
