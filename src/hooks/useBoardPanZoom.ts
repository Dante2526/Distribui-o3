import { useRef, useCallback, useMemo, useEffect } from "react";
import type { Modifier } from "@dnd-kit/core";

export function useBoardPanZoom(
  isAdmin: boolean,
  activePage: string,
  selectedTurma: string | null,
) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const scalableContainerRef = useRef<HTMLDivElement>(null);
  const scaleStateRef = useRef({ currentScale: 1 });
  const scaleCompensationModifier: Modifier = useCallback(
    ({ transform }) => ({
      ...transform,
      x: transform.x / scaleStateRef.current.currentScale,
      y: transform.y / scaleStateRef.current.currentScale,
    }),
    [],
  );

  const dndModifiers = useMemo(
    () => [scaleCompensationModifier],
    [scaleCompensationModifier],
  );

  const dragScrollRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0,
    moved: false,
  });

  const setScale = useCallback(
    (newScale: number, scrollX?: number, scrollY?: number) => {
      const viewport = viewportRef.current;
      const scalableContainer = scalableContainerRef.current;
      const contentWrapper = contentWrapperRef.current;
      if (!viewport || !scalableContainer || !contentWrapper) return;

      let minScale = 0.2;
      if (
        scalableContainer.scrollWidth > 0 &&
        scalableContainer.scrollHeight > 0
      ) {
        const scaleW = viewport.clientWidth / scalableContainer.scrollWidth;
        const scaleH =
          viewport.clientHeight / (scalableContainer.scrollHeight - 300);
        minScale = Math.max(scaleW, scaleH);
      }

      const finalScale = Math.max(minScale, Math.min(newScale, 2.0));
      scaleStateRef.current.currentScale = finalScale;

      scalableContainer.style.transform = `scale(${finalScale})`;
      document.documentElement.style.setProperty(
        "--app-scale",
        finalScale.toString(),
      );

      const originalWidth = scalableContainer.scrollWidth;
      const originalHeight = scalableContainer.scrollHeight;

      contentWrapper.style.width = `${originalWidth * finalScale}px`;
      contentWrapper.style.height = `${originalHeight * finalScale}px`;

      if (scrollX !== undefined) viewport.scrollLeft = scrollX;
      if (scrollY !== undefined) viewport.scrollTop = scrollY;
    },
    [],
  );

  const initializeScale = useCallback(() => {
    const viewport = viewportRef.current;
    const scalableContainer = scalableContainerRef.current;
    if (!viewport || !scalableContainer) return;

    const isMobileView = window.innerWidth < 1024;

    if (isMobileView) {
      const oneColumnScale = viewport.clientWidth / 920;
      const finalScale = Math.min(Math.max(oneColumnScale, 0.3), 0.85);
      setScale(finalScale, 0, 0);
    } else {
      const contentWidth = 1716;
      const threeColumnsScale = viewport.clientWidth / contentWidth;
      const finalScale = Math.min(Math.max(threeColumnsScale, 0.3), 2.0);
      setScale(finalScale, 0, 0);
    }
  }, [setScale]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const scalableContainer = scalableContainerRef.current;
    if (!viewport || !scalableContainer) return;

    initializeScale();
    const initTimer = setTimeout(initializeScale, 50);

    const resizeObserver = new ResizeObserver(() => {
      setScale(scaleStateRef.current.currentScale);
    });
    resizeObserver.observe(scalableContainer);
    resizeObserver.observe(viewport);

    let initialDistance = 0;
    let initialScaleValue = 1;
    let scrollStart = { x: 0, y: 0 };
    let initialContentCenter = { x: 0, y: 0 };
    let viewportRect = { left: 0, top: 0 };
    let touchRafId: number | null = null;
    let wheelRafId: number | null = null;
    let pendingTouch = { scale: 0, scrollX: 0, scrollY: 0, valid: false };
    let pendingWheel = { scale: 0, scrollX: 0, scrollY: 0, valid: false };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        initialDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        );

        // Guarda contra initialDistance === 0 (divisão por zero)
        if (initialDistance < 1) initialDistance = 1;

        initialScaleValue = scaleStateRef.current.currentScale;
        scrollStart = { x: viewport.scrollLeft, y: viewport.scrollTop };

        // Cache do getBoundingClientRect - uma vez por gesto, não a cada frame
        const rect = viewport.getBoundingClientRect();
        viewportRect = { left: rect.left, top: rect.top };

        // Ponto do conteúdo sob o centro inicial dos dedos
        const cx0 =
          (e.touches[0].clientX + e.touches[1].clientX) / 2 - viewportRect.left;
        const cy0 =
          (e.touches[0].clientY + e.touches[1].clientY) / 2 - viewportRect.top;
        initialContentCenter = {
          x: (scrollStart.x + cx0) / initialScaleValue,
          y: (scrollStart.y + cy0) / initialScaleValue,
        };

        pendingTouch.valid = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();

        // Centro atual dos dedos (recalculado a cada frame)
        const currentCx =
          (e.touches[0].clientX + e.touches[1].clientX) / 2 - viewportRect.left;
        const currentCy =
          (e.touches[0].clientY + e.touches[1].clientY) / 2 - viewportRect.top;

        const currentDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        );

        let computedMinScale = 0.2;
        if (
          scalableContainer.scrollWidth > 0 &&
          scalableContainer.scrollHeight > 0
        ) {
          const scaleW = viewport.clientWidth / scalableContainer.scrollWidth;
          const scaleH =
            viewport.clientHeight / (scalableContainer.scrollHeight - 300);
          computedMinScale = Math.max(scaleW, scaleH);
        }

        let newScale = Math.max(
          computedMinScale,
          Math.min(
            initialScaleValue * (currentDistance / initialDistance),
            2.0,
          ),
        );
        if (scaleStateRef.current.currentScale === newScale) return;

        // Sempre atualiza os valores mais recentes ANTES de checar o rAF
        pendingTouch = {
          scale: newScale,
          scrollX: initialContentCenter.x * newScale - currentCx,
          scrollY: initialContentCenter.y * newScale - currentCy,
          valid: true,
        };

        // Se já há um rAF agendado, ele vai pegar o pendingTouch atualizado acima
        if (touchRafId) return;

        touchRafId = requestAnimationFrame(() => {
          if (pendingTouch.valid) {
            setScale(
              pendingTouch.scale,
              pendingTouch.scrollX,
              pendingTouch.scrollY,
            );
            pendingTouch.valid = false;
          }
          touchRafId = null;
        });
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const zoomIntensity = 0.002;
        const delta = -e.deltaY * zoomIntensity;
        let newScale =
          scaleStateRef.current.currentScale +
          delta * scaleStateRef.current.currentScale;

        let minScale = 0.2;
        if (
          scalableContainer.scrollWidth > 0 &&
          scalableContainer.scrollHeight > 0
        ) {
          const scaleW = viewport.clientWidth / scalableContainer.scrollWidth;
          const scaleH =
            viewport.clientHeight / (scalableContainer.scrollHeight - 300);
          minScale = Math.max(scaleW, scaleH);
        }

        newScale = Math.max(minScale, Math.min(newScale, 2.0));
        if (scaleStateRef.current.currentScale === newScale) return;

        const rect = viewport.getBoundingClientRect();
        const originX = e.clientX - rect.left;
        const originY = e.clientY - rect.top;

        const contentOriginX =
          (viewport.scrollLeft + originX) / scaleStateRef.current.currentScale;
        const contentOriginY =
          (viewport.scrollTop + originY) / scaleStateRef.current.currentScale;

        const newScrollX = contentOriginX * newScale - originX;
        const newScrollY = contentOriginY * newScale - originY;

        pendingWheel = {
          scale: newScale,
          scrollX: newScrollX,
          scrollY: newScrollY,
          valid: true,
        };

        if (wheelRafId) return;
        wheelRafId = requestAnimationFrame(() => {
          if (pendingWheel.valid) {
            setScale(
              pendingWheel.scale,
              pendingWheel.scrollX,
              pendingWheel.scrollY,
            );
            pendingWheel.valid = false;
          }
          wheelRafId = null;
        });
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Se tem um input com foco e clicamos fora dele, force o blur
      // O onBlur do input já vai chamar onStopEdit para limpar o estado de edição
      if (
        document.activeElement instanceof HTMLElement &&
        (document.activeElement.tagName === "INPUT" ||
          document.activeElement.tagName === "TEXTAREA")
      ) {
        if (!target.closest("input, textarea")) {
          document.activeElement.blur();
        }
      }

      if (
        target.closest(
          isAdmin
            ? 'button, input, select, textarea, a, [role="button"], .employee-row-card, .support-role-row, .special-shift-slot'
            : 'button, input, select, textarea, a, [role="button"]:not(.employee-row-card):not(.support-role-row):not(.special-shift-slot)',
        )
      )
        return;

      // Impede que o clique inicie seleção de texto ou arraste nativo de imagens
      // Isso garante que o mousemove não seja cancelado pelo navegador
      if (e.button === 0) {
        e.preventDefault();
      }

      dragScrollRef.current.isDragging = true;
      dragScrollRef.current.moved = false;
      dragScrollRef.current.startX = e.pageX - viewport.offsetLeft;
      dragScrollRef.current.startY = e.pageY - viewport.offsetTop;
      dragScrollRef.current.scrollLeft = viewport.scrollLeft;
      dragScrollRef.current.scrollTop = viewport.scrollTop;

      viewport.style.cursor = "grabbing";
      viewport.style.userSelect = "none";
    };

    let rafId: number | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragScrollRef.current.isDragging) return;
      e.preventDefault();
      const x = e.pageX - viewport.offsetLeft;
      const y = e.pageY - viewport.offsetTop;
      const walkX = (x - dragScrollRef.current.startX) * 1.5;
      const walkY = (y - dragScrollRef.current.startY) * 1.5;

      if (Math.abs(walkX) > 5 || Math.abs(walkY) > 5) {
        dragScrollRef.current.moved = true;
      }

      if (rafId) return;

      rafId = requestAnimationFrame(() => {
        viewport.scrollLeft = dragScrollRef.current.scrollLeft - walkX;
        viewport.scrollTop = dragScrollRef.current.scrollTop - walkY;
        rafId = null;
      });
    };

    const handleMouseUp = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (!dragScrollRef.current.isDragging) return;
      dragScrollRef.current.isDragging = false;
      viewport.style.cursor = "grab";
      viewport.style.removeProperty("user-select");
    };

    let lastWidth = window.innerWidth;
    const handleResize = () => {
      const activeTag = document.activeElement?.tagName;
      if (activeTag === "INPUT" || activeTag === "TEXTAREA") return;
      if (window.innerWidth !== lastWidth) {
        lastWidth = window.innerWidth;
        setScale(scaleStateRef.current.currentScale);
        initializeScale();
      }
    };

    window.addEventListener("load", initializeScale);
    window.addEventListener("resize", handleResize);
    viewport.addEventListener("wheel", handleWheel, { passive: false });
    viewport.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    viewport.addEventListener("touchstart", handleTouchStart as EventListener, {
      passive: false,
    });
    viewport.addEventListener("touchmove", handleTouchMove as EventListener, {
      passive: false,
    });
    viewport.style.cursor = "grab";

    return () => {
      clearTimeout(initTimer);
      if (rafId) cancelAnimationFrame(rafId);
      if (touchRafId) cancelAnimationFrame(touchRafId);
      if (wheelRafId) cancelAnimationFrame(wheelRafId);
      window.removeEventListener("load", initializeScale);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      if (viewport) {
        viewport.removeEventListener("wheel", handleWheel);
        viewport.removeEventListener("mousedown", handleMouseDown);
        viewport.removeEventListener(
          "touchstart",
          handleTouchStart as EventListener,
        );
        viewport.removeEventListener(
          "touchmove",
          handleTouchMove as EventListener,
        );
      }
      resizeObserver.disconnect();
    };
  }, [initializeScale, setScale, activePage, isAdmin, selectedTurma]);

  return {
    viewportRef,
    contentWrapperRef,
    scalableContainerRef,
    scaleStateRef,
    dndModifiers,
    setScale,
    initializeScale,
  };
}
