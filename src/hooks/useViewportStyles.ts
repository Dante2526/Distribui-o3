import { useState, useEffect } from "react";
import type React from "react";

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
    card: {},
  });

  useEffect(() => {
    if (!isOpen) {
      setViewportStyles({ backdrop: {}, card: {} });
      return;
    }

    const updatePosition = () => {
      if (window.visualViewport) {
        const { width, height, offsetLeft, offsetTop, scale } =
          window.visualViewport;
        const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);

        if (isMobile) {
          setViewportStyles((prev) => {
            const prevBackdrop = prev.backdrop as any;
            const prevCard = prev.card as any;

            const prevLeft = parseFloat(prevBackdrop.left) || 0;
            const prevTop = parseFloat(prevBackdrop.top) || 0;
            const prevWidth = parseFloat(prevBackdrop.width) || 0;
            const prevHeight = parseFloat(prevBackdrop.height) || 0;

            let prevScale = 1;
            if (prevCard?.transform) {
              const match = prevCard.transform.match(/scale\(([^)]+)\)/);
              if (match) prevScale = parseFloat(match[1]);
            }

            const targetScale = 1 / scale;

            // Tolerância de 2px para absorver flutuações de ponto flutuante (jitter) e evitar loop infinito (Error 185)
            if (
              Object.keys(prevBackdrop).length > 0 &&
              Math.abs(prevLeft - offsetLeft) < 2 &&
              Math.abs(prevTop - offsetTop) < 2 &&
              Math.abs(prevWidth - width) < 2 &&
              Math.abs(prevHeight - height) < 2 &&
              Math.abs(prevScale - targetScale) < 0.05
            ) {
              return prev;
            }

            return {
              backdrop: {
                position: "absolute",
                left: `${offsetLeft}px`,
                top: `${offsetTop}px`,
                width: `${width}px`,
                height: `${height}px`,
              },
              card: {
                transform: `scale(${targetScale})`,
                transformOrigin: "center center",
                maxHeight: `${height * 0.95}px`,
              },
            };
          });
        } else {
          setViewportStyles((prev) => {
            if (
              Object.keys(prev.backdrop).length === 0 &&
              Object.keys(prev.card).length === 0
            ) {
              return prev;
            }
            return { backdrop: {}, card: {} };
          });
        }
      }
    };

    let rafId: number;
    const handler = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updatePosition);
    };
    window.visualViewport?.addEventListener("resize", handler);
    window.visualViewport?.addEventListener("scroll", handler);
    updatePosition();

    return () => {
      cancelAnimationFrame(rafId);
      window.visualViewport?.removeEventListener("resize", handler);
      window.visualViewport?.removeEventListener("scroll", handler);
    };
  }, [isOpen]);

  return viewportStyles;
}
