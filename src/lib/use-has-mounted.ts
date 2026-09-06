"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** Returns false during SSR and the first client render, then true after
 * hydration — without the extra setState-in-effect render pass the classic
 * `useState(false) + useEffect(() => setMounted(true))` pattern causes. */
export function useHasMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
