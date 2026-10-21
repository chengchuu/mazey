import { useState } from "react";
import { isStandalonePWA } from "../../../src/browser";
import { readQuickAccess } from "../../../site/quick-access";
import type { PlaygroundTabId } from "../../../site/quick-access";

export function useQuickAccess(storageKey: string) {
  const [standalone] = useState(() => isStandalonePWA());
  const [selected, setSelected] = useState(() =>
    standalone ? readQuickAccess(storageKey) : null
  );
  const [error, setError] = useState("");

  const toggle = (tab: PlaygroundTabId): void => {
    const next = selected === tab ? null : tab;
    try {
      if (next === null) localStorage.removeItem(storageKey);
      else localStorage.setItem(storageKey, next);
      setSelected(next);
      setError("");
    } catch {
      setError("Quick access could not be saved. Please try again.");
    }
  };

  return { standalone, selected, error, toggle };
}
