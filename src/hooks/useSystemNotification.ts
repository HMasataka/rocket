import { listen } from "@tauri-apps/api/event";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import { useEffect, useRef } from "react";

interface AutoFetchUpdate {
  tab_id: string;
  remote_name: string;
  new_commits_count: number;
}

export function useSystemNotification() {
  const permissionGranted = useRef(false);

  useEffect(() => {
    const checkPermission = async () => {
      let granted = await isPermissionGranted();
      if (!granted) {
        const result = await requestPermission();
        granted = result === "granted";
      }
      permissionGranted.current = granted;
    };

    checkPermission();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const setup = async () => {
      const unlisten = await listen<AutoFetchUpdate>(
        "auto-fetch:updated",
        (event) => {
          if (cancelled) return;
          if (!permissionGranted.current) return;
          if (!document.hidden) return;

          const { remote_name, new_commits_count } = event.payload;
          sendNotification({
            title: "Rocket - New Commits",
            body: `${new_commits_count} new commit(s) from ${remote_name}`,
          });
        },
      );

      if (cancelled) {
        unlisten();
      }

      return unlisten;
    };

    const unlistenPromise = setup();

    return () => {
      cancelled = true;
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, []);
}
