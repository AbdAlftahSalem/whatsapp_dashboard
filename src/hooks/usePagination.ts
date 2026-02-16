import { useState, useMemo, useEffect } from 'react';

interface UsePaginationProps<T> {
  data: T[];
  initialPageSize?: number;
  initialPage?: number;
}

export function usePagination<T>({ data, initialPageSize = 25, initialPage = 1 }: UsePaginationProps<T>) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalPages = Math.ceil(data.length / pageSize);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, currentPage, pageSize]);

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  // Reset page when data or its length changes (optional, but often helpful)
  // Or when searching/filtering happens outside - usually better to handle that in the component
  // but we can reset when data length decreases significantly.
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    } else if (totalPages === 0) {
      setCurrentPage(1);
    }
  }, [data.length, totalPages]);

  return {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems: data.length,
    paginatedData,
    goToNextPage,
    goToPrevPage,
  };
}
