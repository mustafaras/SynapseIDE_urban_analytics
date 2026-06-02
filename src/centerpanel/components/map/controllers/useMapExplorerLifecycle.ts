import { useEffect } from "react";

import { useFocusTrap } from "../useFocusTrap";

interface UseMapExplorerLifecycleOptions {
  open: boolean;
  onClose: () => void;
  focusActivationDelayMs?: number;
}

export function useMapExplorerLifecycle({
  open,
  onClose,
  focusActivationDelayMs = 50,
}: UseMapExplorerLifecycleOptions) {
  const { trapRef, activate } = useFocusTrap(open);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const id = window.setTimeout(activate, focusActivationDelayMs);
    return () => window.clearTimeout(id);
  }, [activate, focusActivationDelayMs, open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) {
        onClose();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, open]);

  return { trapRef };
}
