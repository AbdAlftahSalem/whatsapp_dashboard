import { useMemo } from 'react';

interface UseFilteringProps<T> {
  data: T[];
  filters: any;
  filterFn: (item: T, filters: any) => boolean;
}

export function useFiltering<T>({ data, filters, filterFn }: UseFilteringProps<T>) {
  const filteredData = useMemo(() => {
    return data.filter(item => filterFn(item, filters));
  }, [data, filters, filterFn]);

  return filteredData;
}
