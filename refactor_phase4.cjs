const fs = require('fs');
const path = require('path');

const appTsxPath = path.join(__dirname, 'src', 'App.tsx');
let code = fs.readFileSync(appTsxPath, 'utf8');

const panZoomHookCode = `import { useRef, useCallback, useMemo, useEffect } from "react";
import type { Modifier } from "@dnd-kit/core";

export function useBoardPanZoom(
  isAdmin: boolean,
  activePage: string,
  selectedTurma: string | null
) {
`;

// Extract block from "const viewportRef = useRef<HTMLDivElement>(null);" 
// to the end of "}, [initializeScale, setScale, activePage, isAdmin, selectedTurma]);"
const startMarker = "const viewportRef = useRef<HTMLDivElement>(null);";
const endMarker = "}, [initializeScale, setScale, activePage, isAdmin, selectedTurma]);";

const startIndex = code.indexOf(startMarker);
const endIndex = code.indexOf(endMarker, startIndex) + endMarker.length;

if (startIndex === -1 || endIndex === -1 + endMarker.length) {
    console.error("Could not find block");
    process.exit(1);
}

const blockToExtract = code.substring(startIndex, endIndex);

const hookFullCode = panZoomHookCode + "  " + blockToExtract.replace(/\n/g, "\n  ") + `

  return {
    viewportRef,
    contentWrapperRef,
    scalableContainerRef,
    scaleStateRef,
    dndModifiers,
    setScale,
    initializeScale
  };
}
`;

fs.writeFileSync(path.join(__dirname, 'src', 'hooks', 'useBoardPanZoom.ts'), hookFullCode, 'utf8');

const hookCall = `  const {
    viewportRef,
    contentWrapperRef,
    scalableContainerRef,
    scaleStateRef,
    dndModifiers,
    setScale,
    initializeScale
  } = useBoardPanZoom(isAdmin, activePage, selectedTurma);`;

code = code.substring(0, startIndex) + hookCall + code.substring(endIndex);

// Add import
const importMarker = 'import { useAppModals } from "./hooks/useAppModals";';
code = code.replace(importMarker, importMarker + '\nimport { useBoardPanZoom } from "./hooks/useBoardPanZoom";');

fs.writeFileSync(appTsxPath, code, 'utf8');
console.log("Phase 4 completed successfully!");
