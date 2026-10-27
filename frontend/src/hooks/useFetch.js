import { useCallback, useEffect, useRef, useState } from "react";
import { getErrorMessage } from "../services/api";

/**
 * Custom hook to manage asynchronous data fetching with loading and error states.
 * @param {Function} fetchFn - Function returning a promise
 * @returns {{ data: any, loading: boolean, error: string, refetch: Function, setData: Function }}
 */
export default function useFetch(fetchFn) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fnRef = useRef(fetchFn);
  useEffect(() => {
    fnRef.current = fetchFn;
  });

  const execute = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fnRef.current();
      setData(result);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    execute();
  }, [execute]);

  return { data, loading, error, refetch: execute, setData };
}

