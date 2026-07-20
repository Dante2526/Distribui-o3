import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trash2, ChevronRight, CheckCircle2 } from "lucide-react";
import { PortalMenu } from "../components/PortalMenu";
import { DeptIcon } from "../components/DeptIcon";
import {
  getDeptTheme,
  PREDEFINED_LINES,
  SUPPORT_ROLES_OPTIONS,
} from "../constants/data";
import type { StatusType, DepartmentOption } from "../types";
import { STATUS_METADATA } from "../types";

export type PortalType =
  "avatar" | "transfer" | "absent" | "line" | "role" | null;

interface PortalPayload {
  actionsRef?: React.MutableRefObject<any>;
  otherDepts?: DepartmentOption[];
  localLine?: string; // current input for filtering lines
  isDarkMode?: boolean;
}

interface RowPortalsState {
  activeType: PortalType;
  activeRect: DOMRect | null;
  scrollY: number;
  scrollX: number;
  payload: PortalPayload | null;
  activeRowId: string | null;
}

interface RowPortalsDispatch {
  openPortal: (
    type: PortalType,
    rect: DOMRect,
    rowId: string,
    payload: PortalPayload,
  ) => void;
  closePortal: () => void;
}

const RowPortalsDispatchContext = createContext<RowPortalsDispatch | undefined>(
  undefined,
);

export const useRowPortalsDispatch = () => {
  const context = useContext(RowPortalsDispatchContext);
  if (!context)
    throw new Error(
      "useRowPortalsDispatch must be used within RowPortalsProvider",
    );
  return context;
};

export const RowPortalsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<RowPortalsState>({
    activeType: null,
    activeRect: null,
    scrollY: 0,
    scrollX: 0,
    payload: null,
    activeRowId: null,
  });

  const closePortal = useCallback(() => {
    setState((prev) => {
      if (prev.payload?.actionsRef?.current?.onClose) {
        prev.payload.actionsRef.current.onClose();
      }
      return {
        activeType: null,
        activeRect: null,
        scrollY: 0,
        scrollX: 0,
        payload: null,
        activeRowId: null,
      };
    });
  }, []);

  const openPortal = useCallback(
    (
      type: PortalType,
      rect: DOMRect,
      rowId: string,
      payload: PortalPayload,
    ) => {
      setState((prev) => {
        if (
          prev.activeRowId !== rowId &&
          prev.payload?.actionsRef?.current?.onClose
        ) {
          prev.payload.actionsRef.current.onClose();
        }
        return {
          activeType: type,
          activeRect: rect,
          scrollY: window.scrollY,
          scrollX: window.scrollX,
          payload,
          activeRowId: rowId,
        };
      });
    },
    [],
  );

  useEffect(() => {
    const handleScroll = () => {
      if (state.activeType) closePortal();
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [state.activeType, closePortal]);

  const { activeType, activeRect, scrollY, scrollX, payload } = state;
  const isDarkMode = payload?.isDarkMode ?? true;

  return (
    <RowPortalsDispatchContext.Provider
      value={useMemo(
        () => ({ openPortal, closePortal }),
        [openPortal, closePortal],
      )}
    >
      {children}

      {/* RENDER PORTALS GLOBALLY */}
      <AnimatePresence>
        {activeType === "avatar" && activeRect && payload && (
          <PortalMenu>
            <div
              className="fixed inset-0 z-[999]"
              onMouseDown={closePortal}
              onTouchStart={closePortal}
            />
            <div
              style={{
                position: "fixed",
                top: activeRect.bottom + 6,
                left: activeRect.left,
                transformOrigin: "top left",
                transform: "scale(var(--app-scale, 1))",
                zIndex: 1000,
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                transition={{ duration: 0.15 }}
                className="w-[120px] bg-[#1E2029]/80 backdrop-blur-md border border-[#FF3B30]/30 rounded-[12px] shadow-xl overflow-hidden flex flex-col"
              >
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    payload.actionsRef?.current?.onDelete?.();
                    closePortal();
                  }}
                  className="flex items-center px-3 py-2 text-[13px] font-bold text-[#FF3B30] hover:bg-[#FF3B30]/15 active:bg-[#FF3B30]/20 transition-colors w-full text-left"
                >
                  <Trash2 className="w-[16px] h-[16px] mr-2" />
                  Deletar
                </button>
              </motion.div>
            </div>
          </PortalMenu>
        )}

        {activeType === "transfer" &&
          activeRect &&
          payload &&
          payload.otherDepts && (
            <PortalMenu>
              <div
                className="fixed inset-0 z-[999]"
                onMouseDown={closePortal}
                onTouchStart={closePortal}
              />
              <div
                style={{
                  position: "fixed",
                  top: activeRect.bottom + 6,
                  left: activeRect.right - 190,
                  transformOrigin: "top right",
                  transform: "scale(var(--app-scale, 1))",
                  zIndex: 1000,
                }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="w-[190px] bg-[#1E2029]/80 backdrop-blur-md border border-white/10 rounded-[12px] shadow-xl overflow-y-auto max-h-[300px] flex flex-col py-1"
                >
                  <div className="px-3 py-1 text-[10px] font-bold text-[#a0aec0] uppercase tracking-wider">
                    Transferir para
                  </div>
                  {payload.otherDepts.map((d) => {
                    const deptTheme = getDeptTheme(d.id);
                    return (
                      <button
                        key={d.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          payload.actionsRef?.current?.onTransfer?.(d.id);
                          closePortal();
                        }}
                        className={`flex items-center justify-between px-3 py-2 rounded-[12px] text-[11px] font-extrabold tracking-wider w-full transition-all text-left uppercase cursor-pointer border-none bg-transparent group ${
                          isDarkMode
                            ? "text-white hover:bg-white/10 active:bg-white/15"
                            : "text-slate-800 hover:bg-slate-800/10 active:bg-slate-800/15"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-1.5 rounded-[8px] ${deptTheme.bg} ${deptTheme.color}`}
                          >
                            <DeptIcon
                              iconName={deptTheme.iconName as string}
                              className="w-3.5 h-3.5 shrink-0"
                            />
                          </div>
                          <span>{d.title}</span>
                        </div>
                        <ChevronRight
                          className={`w-3.5 h-3.5 shrink-0 transition-all duration-150 ${
                            isDarkMode
                              ? "text-white/25 group-hover:text-white/60 group-hover:translate-x-0.5"
                              : "text-slate-800/25 group-hover:text-slate-800/60 group-hover:translate-x-0.5"
                          }`}
                        />
                      </button>
                    );
                  })}
                </motion.div>
              </div>
            </PortalMenu>
          )}

        {activeType === "absent" && activeRect && payload && (
          <PortalMenu>
            <div
              className="fixed inset-0 z-[999]"
              onMouseDown={closePortal}
              onTouchStart={closePortal}
            />
            <div
              style={{
                position: "fixed",
                top: activeRect.bottom + 6,
                left: activeRect.right - 140,
                transformOrigin: "top right",
                transform: "scale(var(--app-scale, 1))",
                zIndex: 1000,
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                transition={{ duration: 0.15 }}
                className={`w-[140px] backdrop-blur-md border rounded-[12px] shadow-xl overflow-y-auto max-h-[300px] flex flex-col p-1.5 gap-1 custom-scrollbar ${
                  isDarkMode
                    ? "bg-[#1E2029]/80 border-white/10"
                    : "bg-white/90 border-slate-200"
                }`}
              >
                {(Object.entries(STATUS_METADATA) as [StatusType, any][]).map(
                  ([status, meta]) => (
                    <button
                      key={status}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        payload.actionsRef?.current?.onAbsent?.(status);
                        closePortal();
                      }}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-[11px] font-bold tracking-wider w-full transition-all text-left uppercase hover:bg-white/5 group"
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${meta.dotColor}`}
                      />
                      <span
                        className={isDarkMode ? "text-white" : "text-slate-800"}
                      >
                        {meta.label}
                      </span>
                    </button>
                  ),
                )}
              </motion.div>
            </div>
          </PortalMenu>
        )}

        {activeType === "line" && activeRect && payload && (
          <PortalMenu>
            <div
              className="fixed inset-0 z-[999]"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                closePortal();
                (document.activeElement as HTMLElement)?.blur();
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                closePortal();
                (document.activeElement as HTMLElement)?.blur();
              }}
            />
            <div
              style={{
                position: "fixed",
                top: activeRect.bottom + 4,
                left: activeRect.left + activeRect.width / 2 - 65,
                transformOrigin: "top center",
                transform: "scale(var(--app-scale, 1))",
                zIndex: 1000,
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className={`w-[130px] max-h-[150px] overflow-y-auto backdrop-blur-md border rounded-[12px] shadow-2xl flex flex-col p-1.5 gap-1 hide-scrollbar ${
                  isDarkMode
                    ? "bg-[#1E2029]/80 border-white/10"
                    : "bg-white/90 border-slate-200"
                }`}
              >
                {PREDEFINED_LINES.filter((l) =>
                  l
                    .toLowerCase()
                    .includes((payload.localLine || "").toLowerCase()),
                ).map((linha) => (
                  <button
                    key={linha}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      payload.actionsRef?.current?.onSelectLine?.(linha);
                      closePortal();
                    }}
                    className={`text-center px-2 py-1.5 text-[12px] font-bold rounded-[8px] transition-all duration-150 outline-none ${
                      isDarkMode
                        ? "text-white hover:bg-white/10"
                        : "text-slate-800 hover:bg-slate-800/10"
                    }`}
                  >
                    {linha}
                  </button>
                ))}
              </motion.div>
            </div>
          </PortalMenu>
        )}

        {activeType === "role" && activeRect && payload && (
          <PortalMenu>
            <div
              className="fixed inset-0 z-[999]"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                closePortal();
                (document.activeElement as HTMLElement)?.blur();
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                closePortal();
                (document.activeElement as HTMLElement)?.blur();
              }}
            />
            <div
              style={{
                position: "fixed",
                top: activeRect.bottom + 4,
                left: activeRect.left + activeRect.width / 2 - 90,
                transformOrigin: "top center",
                transform: "scale(var(--app-scale, 1))",
                zIndex: 1000,
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className={`w-[180px] max-h-[220px] overflow-y-auto backdrop-blur-md border rounded-[12px] shadow-2xl flex flex-col p-1.5 gap-1 hide-scrollbar ${
                  isDarkMode
                    ? "bg-[#1E2029]/80 border-white/10"
                    : "bg-white/90 border-slate-200"
                }`}
              >
                {SUPPORT_ROLES_OPTIONS.map((role) => (
                  <button
                    key={role}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      payload.actionsRef?.current?.onSelectRole?.(role);
                      closePortal();
                    }}
                    className={`flex items-center justify-between px-3 py-2 text-[11px] font-bold tracking-wider rounded-[8px] transition-all duration-150 outline-none uppercase ${
                      isDarkMode
                        ? "text-white hover:bg-white/10"
                        : "text-slate-800 hover:bg-slate-800/10"
                    }`}
                  >
                    <span>{role}</span>
                    {payload.localLine === role && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#5E5CE6]" />
                    )}
                  </button>
                ))}
              </motion.div>
            </div>
          </PortalMenu>
        )}
      </AnimatePresence>
    </RowPortalsDispatchContext.Provider>
  );
};
