import { useEffect, useState } from 'react';

export default function useStoredState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved !== null ? JSON.parse(saved) as T : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* The workspace still works when browser storage is unavailable. */ }
  }, [key, value]);

  return [value, setValue] as const;
}