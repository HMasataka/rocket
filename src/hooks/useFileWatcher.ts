import { listen } from "@tauri-apps/api/event";
import { useEffect, useRef } from "react";

export function useFileWatcher(onChanged: () => void) {
  const onChangedRef = useRef(onChanged);
  onChangedRef.current = onChanged;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const setup = async () => {
      const unlisten = await listen("repo:changed", () => {
        if (cancelled) return;
        if (timer !== null) {
          clearTimeout(timer);
        }
        timer = setTimeout(() => {
          onChangedRef.current();
          timer = null;
        }, 300);
      });

      if (cancelled) {
        unlisten();
      }

      return unlisten;
    };

    const unlistenPromise = setup();

    return () => {
      cancelled = true;
      if (timer !== null) {
        clearTimeout(timer);
      }
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, []);
}
