import React, { useState, useEffect } from 'react';

// --- Portal Popup Anchor: calcula posição real na tela para renderizar fora do overflow-hidden ---
export function useAnchoredRect(triggerRef: React.RefObject<HTMLElement | null>, open: boolean) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  useEffect(() => {
    if (open && triggerRef.current) {
      setRect(triggerRef.current.getBoundingClientRect());
    } else {
      setRect(null);
    }
  }, [open, triggerRef]);
  return rect;
}
