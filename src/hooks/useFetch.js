import { useState, useEffect, useCallback, useRef } from "react";

// Runs an API function (from src/api) and tracks its loading/error/data state.
// `request` receives an AbortSignal so it can cancel itself on unmount or re-run.
// `deps` works like useEffect's deps array: pass the values `request` closes over.
export const useFetch = (request, deps = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);
  const abortControllerRef = useRef(null);

  const fetchData = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setLoading(true);
    setError(null);

    request(abortController.signal)
      .then((result) => {
        if (isMounted.current && !abortController.signal.aborted) {
          setData(result);
        }
      })
      .catch((err) => {
        if (isMounted.current && !abortController.signal.aborted) {
          setError(err.message || "Something went wrong");
        }
      })
      .finally(() => {
        if (isMounted.current && !abortController.signal.aborted) {
          setLoading(false);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    isMounted.current = true;

    fetchData();

    return () => {
      isMounted.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};
