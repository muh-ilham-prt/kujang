import { useEffect, useState } from "react";

// Seeds only apply when a key is absent, so editing a SEED never reaches a browser
// that already stored the old data. Bump this after any SEED change to wipe it.
const SCHEMA_VERSION = "2";

try {
  if (localStorage.getItem("schema") !== SCHEMA_VERSION) {
    localStorage.clear();
    localStorage.setItem("schema", SCHEMA_VERSION);
  }
} catch {
  // Storage blocked (private mode) — nothing persisted, nothing to clear
}

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
