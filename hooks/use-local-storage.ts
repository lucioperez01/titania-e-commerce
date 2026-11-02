import { useSyncExternalStore } from 'react';

function getSnapshot(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(key);
}

function subscribe(key: string, callback: () => void): () => void {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const storedValue = useSyncExternalStore(
    (callback) => subscribe(key, callback),
    () => getSnapshot(key),
    () => JSON.stringify(initialValue)
  );

  const value: T = storedValue ? JSON.parse(storedValue) : initialValue;

  const setValue = (newValue: T) => {
    localStorage.setItem(key, JSON.stringify(newValue));
    window.dispatchEvent(new Event('storage'));
  };

  return [value, setValue] as const;
}
