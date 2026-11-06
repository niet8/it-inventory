import { useCallback, useEffect, useRef, useState } from 'react';

const OPEN_DELAY_MS = 150;
const CLOSE_DELAY_MS = 250;

// Hovering previews the popover; clicking pins it open until it is dismissed.
export function useHoverPopover(disabled = false) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const later = useCallback((action: () => void, delay: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(action, delay);
  }, []);

  const close = useCallback(() => {
    clearTimeout(timer.current);
    setOpen(false);
    setPinned(false);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (disabled) close();
  }, [disabled, close]);

  const enter = useCallback(() => {
    if (!disabled) later(() => setOpen(true), OPEN_DELAY_MS);
  }, [disabled, later]);

  const leave = useCallback(() => {
    if (pinned) clearTimeout(timer.current);
    else later(() => setOpen(false), CLOSE_DELAY_MS);
  }, [pinned, later]);

  const toggle = useCallback(() => {
    if (disabled) return;
    clearTimeout(timer.current);
    if (pinned) close();
    else {
      setOpen(true);
      setPinned(true);
    }
  }, [disabled, pinned, close]);

  // Moving from the trigger into the popover keeps it open.
  const keep = useCallback(() => clearTimeout(timer.current), []);

  return { open, pinned, enter, leave, toggle, keep, close };
}
