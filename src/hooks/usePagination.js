import { useEffect, useMemo, useState } from "react";

// Client-side pagination over an already-filtered array. Callers reset
// `page` to 1 themselves when a search/filter changes (so a new filter
// always starts at the top); this hook only clamps `page` back down when
// the list shrinks out from under the current page (e.g. after a delete).
export const usePagination = (items, pageSize) => {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = useMemo(
    () => items.slice((page - 1) * pageSize, page * pageSize),
    [items, page, pageSize],
  );

  return { page, setPage, totalPages, pageItems, totalItems: items.length };
};
