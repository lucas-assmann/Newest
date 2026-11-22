import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * true no navegador, false na renderização do servidor.
 * Substitui o padrão `useEffect(() => setMounted(true), [])`, que causa uma renderização extra.
 */
export function useIsClient() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
