import { useEffect } from 'react';

/**
 * Calls onResize whenever the ref's content changes (children, attributes, subtree).
 */
export function useDynamicResize(ref: React.RefObject<HTMLElement>, onResize: () => void) {
  useEffect(() => {
    if (!ref.current) return;
    const observer = new window.MutationObserver(() => {
      onResize();
    });
    observer.observe(ref.current, { childList: true, subtree: true, attributes: true });
    return () => observer.disconnect();
  }, [ref, onResize]);
}
