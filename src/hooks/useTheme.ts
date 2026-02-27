import { useEffect } from "react";
import { useConfigStore } from "../stores/configStore";

export function useTheme() {
  const appearance = useConfigStore((s) => s.config?.appearance);

  useEffect(() => {
    if (!appearance) return;

    const root = document.documentElement;
    root.setAttribute("data-theme", appearance.theme);
    root.setAttribute("data-color-theme", appearance.color_theme);
  }, [appearance]);
}
