import { useEffect, useRef } from 'react';

type Shortcuts = { onEscape: () => void; onRotate: () => void; onUndo: () => void };

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

// Escape leaves the current tool, R rotates the object about to be placed, Ctrl/Cmd+Z undoes.
export function useEditorShortcuts(shortcuts: Shortcuts) {
  const latest = useRef(shortcuts);
  useEffect(() => {
    latest.current = shortcuts;
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') return latest.current.onEscape();
      if (isTyping(event.target)) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        latest.current.onUndo();
      } else if (!event.metaKey && !event.ctrlKey && event.key.toLowerCase() === 'r') {
        latest.current.onRotate();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
