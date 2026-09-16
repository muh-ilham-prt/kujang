import { useEffect, useState } from "react";

// ponytail: localStorage stand-in for the API — swap for fetch/mutate calls when the backend lands.
// Same key in two components = two copies; mount each key once.
export default function useLocalState(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initial;
    } catch {
      // Corrupt or unreadable (private mode) — fall back to the seed
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Quota exceeded or storage blocked — keep working in memory
    }
  }, [key, value]);

  return [value, setValue];
}
