import { useEffect, useState } from "react";

/**
 * Custom hook to debounce a value over a specified delay.
 * @param {any} value
 * @param {number} delay in milliseconds
 * @returns {any} debounced value
 */
export default function useDebounce(value, delay = 350) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

