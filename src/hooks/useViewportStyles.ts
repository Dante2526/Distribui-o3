import { useState, useEffect } from 'react';
import type React from 'react';

/**
 * Hook reutilizável para tracking do Visual Viewport em mobile.
 * Centraliza modais corretamente quando o teclado virtual abre
 * e compensa zoom com pinch-to-zoom.
 */
export function useViewportStyles(isOpen: boolean): {
  backdrop: React.CSSProperties;
  card: React.CSSProperties;
} {
  const [viewportStyles, setViewportStyles] = useState<{
    backdrop: React.CSSProperties;
    card: React.CSSProperties;
  }>({
    backdrop: {},
    card: {}
  });

  useEffect(() => {
    if (!isOpen) {
      setViewportStyles({ backdrop: {}, card: {} });
      return;
    }

    const updatePosition = () => {
      if (window.visualViewport) {
        const { width, height, offsetLeft, offsetTop, scale } = window.visualViewport;
        const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);

        if (isMobile) {
          setViewportStyles({
            backdrop: {
              position: 'absolute',
              left: `${offsetLeft}px`,
              top: `${offsetTop}px`,
              width: `${width}px`,
              height: `${height}px`,
            },
            card: {
              transform: `scale(${1 / scale})`,
              transformOrigin: 'center center',
              maxHeight: `${height * 0.95}px`,
            }
          });
        } else {
          setViewportStyles({ backdrop: {}, card: {} });
        }
      }
    };

    const handler = () => requestAnimationFrame(updatePosition);
    window.visualViewport?.addEventListener('resize', handler);
    window.visualViewport?.addEventListener('scroll', handler);
    updatePosition(); 

    return () => {
      window.visualViewport?.removeEventListener('resize', handler);
      window.visualViewport?.removeEventListener('scroll', handler);
    };
  }, [isOpen]);

  return viewportStyles;
}
