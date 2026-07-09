import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  User,
  Trash2,
  ArrowRightLeft,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { motion } from "motion/react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { SupportRole, StatusType, ActiveEdit } from "../types";
import { STATUS_METADATA } from "../types";
import { getDeptTheme, SUPPORT_ROLES_OPTIONS } from "../constants/data";
import { PortalMenu } from "./PortalMenu";
import { DeptIcon } from "./DeptIcon";

export const SupportRoleRow = React.memo(
  ({
    emp,
    index,
    groupIndex,
    isDarkMode,
    is6HActive,
    isDragOverlay,
    onUpdateRole,
    onUpdateName,
    onUpdateMatricula,
    onMove,
    onMoveToSpecial,
    onMarkAbsent,
    onDelete,
    isAdmin,
    isGhost,
    isDragActive,
    activeEdit,
    onStartEdit,
    onStopEdit,
  }: {
    emp: SupportRole;
    index: number;
    groupIndex: number;
    isDarkMode: boolean;
    is6HActive: boolean;
    isDragOverlay?: boolean;
    onUpdateRole: (
      groupIndex: number,
      empIndex: number,
      newRole: string,
    ) => void;
    onUpdateName: (
      groupIndex: number,
      empIndex: number,
      newName: string,
    ) => void;
    onUpdateMatricula: (
      groupIndex: number,
      empIndex: number,
      newMatricula: string,
    ) => void;
    onMove: (
      sourceGroupIndex: number,
      targetGroupIndex: number,
      empIndex: number,
    ) => void;
    onMoveToSpecial?: (groupIndex: number, empIndex: number) => void;
    onMarkAbsent: (
      groupIndex: number,
      empIndex: number,
      absenceType: StatusType,
    ) => void;
    onDelete: (groupIndex: number, empIndex: number) => void;
    isAdmin?: boolean;
    isGhost?: boolean;
    isDragActive?: boolean;
    activeEdit?: ActiveEdit;
    onStartEdit?: (empId: string) => void;
    onStopEdit?: (empId: string) => void;
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isTransferOpen, setIsTransferOpen] = useState(false);
    const [showAbsentMenu, setShowAbsentMenu] = useState(false);
    const [showAvatarMenu, setShowAvatarMenu] = useState(false);

    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: emp.id,
      data: {
        type: "Support",
        employee: emp,
        groupIndex,
      },
      disabled: isDragOverlay,
    });

    const style: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition: isDragging ? "none" : transition,
      touchAction: isAdmin ? "pan-y" : "auto",
      ...(activeEdit
        ? { outline: `2.5px solid ${activeEdit.color}`, outlineOffset: "1.5px" }
        : {}),
      ...(isDragging ? { zIndex: 50, position: "relative" } : {}),
    };

    const groupsList = [0, 1, 2].filter((g) => g !== groupIndex);
    const themes = [
      {
        bg: "bg-[#0A84FF]/10",
        text: "text-[#0A84FF]",
        borderLeft: "border-l-4 border-l-[#0A84FF]",
      },
      {
        bg: "bg-[#FF9F0A]/10",
        text: "text-[#FF9F0A]",
        borderLeft: "border-l-4 border-l-[#FF9F0A]",
      },
      {
        bg: "bg-[#30D158]/10",
        text: "text-[#30D158]",
        borderLeft: "border-l-4 border-l-[#30D158]",
      },
    ];
    const theme = themes[groupIndex] || themes[0];

    const [absentRect, setAbsentRect] = useState<DOMRect | null>(null);
    const [transferRect, setTransferRect] = useState<DOMRect | null>(null);
    const [roleRect, setRoleRect] = useState<DOMRect | null>(null);
    const [avatarRect, setAvatarRect] = useState<DOMRect | null>(null);

    const handleUpdateRoleLocal = useCallback(
      (newRole: string) => {
        onUpdateRole(groupIndex, index, newRole);
      },
      [onUpdateRole, groupIndex, index],
    );

    const handleUpdateMatriculaLocal = useCallback(
      (newMatricula: string) => {
        onUpdateMatricula(groupIndex, index, newMatricula);
      },
      [onUpdateMatricula, groupIndex, index],
    );

    const handleMoveLocal = useCallback(
      (targetGroupIdx: number) => {
        onMove(groupIndex, targetGroupIdx, index);
      },
      [onMove, groupIndex, index],
    );

    const handleMoveToSpecialLocal = useCallback(() => {
      onMoveToSpecial?.(groupIndex, index);
    }, [onMoveToSpecial, groupIndex, index]);

    const handleMarkAbsentLocal = useCallback(
      (absenceType: StatusType) => {
        onMarkAbsent(groupIndex, index, absenceType);
      },
      [onMarkAbsent, groupIndex, index],
    );

    const handleDeleteLocal = useCallback(() => {
      onDelete(groupIndex, index);
    }, [onDelete, groupIndex, index]);

    const isMountedRef = useRef(false);
    useEffect(() => {
      if (!isMountedRef.current) {
        isMountedRef.current = true;
        return;
      }
      if (isOpen || isTransferOpen || showAbsentMenu || showAvatarMenu) {
        if (emp.id) onStartEdit?.(emp.id);
      } else {
        if (emp.id) onStopEdit?.(emp.id);
      }
    }, [
      isOpen,
      isTransferOpen,
      showAbsentMenu,
      showAvatarMenu,
      emp.id,
      onStartEdit,
      onStopEdit,
    ]);

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...(isAdmin ? listeners : {})}
        onPointerDown={(e: React.PointerEvent<HTMLDivElement>) => {
          if (
            e.target instanceof HTMLElement &&
            e.target.tagName !== "INPUT" &&
            e.target.tagName !== "BUTTON"
          ) {
            if (document.activeElement instanceof HTMLElement) {
              document.activeElement.blur();
            }
          }
          if (isAdmin) {
            listeners?.onPointerDown?.(e as any);
          }
        }}
        className={`support-role-row px-4 py-2.5 flex items-center rounded-[12px] ${isDragActive ? "" : "transition duration-300"} relative h-[56px] w-full ${
          isDragging || isGhost
            ? "opacity-30 border-dashed border border-white/10 bg-white/[0.02] shadow-none pointer-events-none"
            : showAbsentMenu
              ? "bg-[#111217] opacity-40 z-[100] shadow-none"
              : `bg-[#111217] hover:bg-[#252836] ${theme.borderLeft} shadow-md hover:shadow-xl hover:-translate-y-0.5 cursor-grab`
        }`}
      >
        {/* Active Edit Badge */}
        {activeEdit && !isDragOverlay && (
          <div
            className={`absolute -top-3 right-0 border px-2 py-0.5 rounded-[6px] z-[100] shadow-lg flex items-center gap-1.5 animate-[fadeIn_0.2s_ease-out] ${
              isDarkMode
                ? "bg-[#1E2029] border-white/10 text-white"
                : "bg-white border-slate-200 text-slate-800"
            }`}
          >
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: activeEdit.color }}
            />
            <span
              className={`text-[10px] font-bold whitespace-nowrap ${
                isDarkMode ? "text-white" : "text-slate-800"
              }`}
            >
              {activeEdit.userName} editando...
            </span>
          </div>
        )}

        {/* Coluna 1: Avatar, Nome e Matrícula */}
        <div className="flex items-center min-w-0 flex-1 mr-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              const open = !showAvatarMenu;
              setShowAvatarMenu(open);
              setIsTransferOpen(false);
              setIsOpen(false);
              setShowAbsentMenu(false);
              if (open) {
                setAvatarRect(e.currentTarget.getBoundingClientRect());
              } else {
                setAvatarRect(null);
              }
            }}
            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mr-2.5 shadow-sm hover:scale-105 active:scale-95 transition-all outline-none ${theme.bg} ${theme.text}`}
          >
            <User className="w-[14px] h-[14px]" strokeWidth={2.5} />
          </button>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="font-bold text-[15px] text-white w-full truncate leading-none uppercase tracking-wide block">
              {emp.name}
            </span>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[11px] text-[#888890] font-medium whitespace-nowrap leading-none select-none">
                Matrícula:
              </span>
              <input
                type="text"
                value={emp.matricula || ""}
                onFocus={() => {
                  if (!isAdmin) return;
                  if (emp.id) onStartEdit?.(emp.id);
                }}
                onBlur={() => {
                  if (!isAdmin) return;
                  if (emp.id) onStopEdit?.(emp.id);
                }}
                onChange={(e) => {
                  if (!isAdmin) return;
                  handleUpdateMatriculaLocal(e.target.value);
                }}
                placeholder="N/A"
                maxLength={8}
                readOnly={!isAdmin}
                className="bg-transparent text-[#A0A0A5] text-[10px] font-medium focus:outline-none placeholder:text-[#A0A0A5]/30 w-[80px] leading-none input-matricula-val"
              />
            </div>
          </div>
        </div>

        {/* Área de Ações */}
        <div className="flex items-center gap-2.5 ml-auto shrink-0 relative">
          <button
            onClick={(e) => {
              if (!isAdmin) return;
              e.stopPropagation();
              const open = !showAbsentMenu;
              setShowAbsentMenu(open);
              setIsTransferOpen(false);
              setIsOpen(false);
              if (open) {
                const target = e.currentTarget;
                const rect = target.getBoundingClientRect();
                const menuHeight = 350; // Altura estimada para 8 itens

                if (rect.bottom + menuHeight > window.innerHeight) {
                  const scrollAmount =
                    rect.bottom + menuHeight - window.innerHeight + 20;
                  const viewport = document.querySelector(".viewport");
                  if (viewport) {
                    viewport.scrollBy({
                      top: scrollAmount,
                      behavior: "smooth",
                    });
                  } else {
                    window.scrollBy({ top: scrollAmount, behavior: "smooth" });
                  }

                  let frameId: number;
                  const startTime = Date.now();
                  const trackScroll = () => {
                    setAbsentRect(target.getBoundingClientRect());
                    if (Date.now() - startTime < 800) {
                      frameId = requestAnimationFrame(trackScroll);
                    }
                  };
                  frameId = requestAnimationFrame(trackScroll);
                } else {
                  setAbsentRect(rect);
                }
              } else {
                setAbsentRect(null);
              }
            }}
            className="h-[34px] w-[75px] flex items-center justify-center font-bold text-white bg-[#F59E0B] hover:bg-[#D97706] rounded-[8px] shadow-none border-none text-[10px] tracking-tight text-center leading-none whitespace-nowrap px-1 cursor-pointer transition-colors duration-150 shrink-0"
          >
            AUSENTE
          </button>
          {is6HActive && (
            <button
              onClick={(e) => {
                if (!isAdmin) return;
                e.stopPropagation();
                handleMoveToSpecialLocal();
              }}
              className="h-[34px] w-[75px] flex items-center justify-center font-bold text-white bg-gradient-to-r from-[#FF9F0A] to-[#FF6B00] rounded-[8px] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 text-[10px] tracking-tight text-center leading-none whitespace-nowrap px-1 shrink-0 cursor-pointer"
            >
              TURNO 6H
            </button>
          )}

          {/* Transfer Button */}
          <div className="relative">
            <button
              onClick={(e) => {
                if (!isAdmin) return;
                const open = !isTransferOpen;
                setIsTransferOpen(open);
                setIsOpen(false);
                setShowAbsentMenu(false);
                if (open) {
                  setTransferRect(e.currentTarget.getBoundingClientRect());
                } else {
                  setTransferRect(null);
                }
              }}
              className="w-7 h-7 rounded-[6px] flex items-center justify-center shrink-0 transition-colors outline-none bg-white/5 text-[#a0aec0] hover:bg-white/10 hover:text-white cursor-pointer"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Role Tag Dropdown */}
          <div className="relative w-[130px] shrink-0">
            <button
              onClick={(e) => {
                if (!isAdmin) return;
                const open = !isOpen;
                setIsOpen(open);
                setIsTransferOpen(false);
                setShowAbsentMenu(false);
                if (open) {
                  setRoleRect(e.currentTarget.getBoundingClientRect());
                } else {
                  setRoleRect(null);
                }
              }}
              className="relative flex items-center justify-center text-[#a0aec0] hover:text-white text-xs font-bold bg-[#1A202C] border border-white/5 hover:bg-[#4a5568] px-3 h-[34px] rounded-lg transition-colors outline-none shadow-sm w-full min-w-[130px] shrink-0 cursor-pointer"
            >
              <span className="truncate pr-4 leading-none">
                {emp.role || "\u00A0"}
              </span>
              <ChevronDown className="absolute right-3 w-3.5 h-3.5 shrink-0" />
            </button>
          </div>
        </div>

        {/* === PORTALS === */}

        {/* Portal: Menu Deletar Apoio (Avatar) */}
        {showAvatarMenu && avatarRect && (
          <PortalMenu>
            <div
              className="fixed inset-0 z-[999]"
              onClick={() => {
                setShowAvatarMenu(false);
                setAvatarRect(null);
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -5 }}
              transition={{ duration: 0.15 }}
              style={{
                position: "fixed",
                top: avatarRect.bottom + 6,
                left: avatarRect.left,
                transformOrigin: "top left",
                transform: "scale(var(--app-scale, 1))",
                zIndex: 1000,
              }}
              className="w-[120px] bg-[#1E2029]/80 backdrop-blur-md border border-[#FF3B30]/30 rounded-[12px] shadow-xl overflow-hidden flex flex-col"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAvatarMenu(false);
                  setAvatarRect(null);
                  handleDeleteLocal();
                }}
                className="flex items-center px-3 py-2 text-[13px] font-bold text-[#FF3B30] hover:bg-[#FF3B30]/15 active:bg-[#FF3B30]/20 transition-colors w-full text-left"
              >
                <Trash2 className="w-[16px] h-[16px] mr-2" />
                Deletar
              </button>
            </motion.div>
          </PortalMenu>
        )}

        {/* Portal: Menu Transferir Apoio */}
        {isTransferOpen && transferRect && (
          <PortalMenu>
            <div
              className="fixed inset-0 z-[999]"
              onClick={() => {
                setIsTransferOpen(false);
                setTransferRect(null);
              }}
            />
            <div
              style={{
                position: "fixed",
                top: transferRect.bottom + 6,
                left: transferRect.right - 160,
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
                className={`w-[190px] backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.3)] rounded-[16px] overflow-hidden flex flex-col p-1.5 gap-1 transition-colors duration-300 ${
                  isDarkMode
                    ? "bg-slate-950/40 border border-white/10 text-white"
                    : "bg-white/40 border border-slate-300/50 text-slate-800"
                }`}
              >
                <div className="px-3 py-1 text-[9px] font-extrabold text-[#a0aec0] uppercase tracking-wider select-none">
                  Mudar para
                </div>
                {groupsList.map((g) => {
                  const names = ["Recepção", "Classificação", "Formação"];
                  const deptId =
                    ["recepcao", "classificacao", "formacao"][g] || "";
                  const deptTheme = getDeptTheme(deptId);
                  return (
                    <button
                      key={g}
                      onClick={() => {
                        handleMoveLocal(g);
                        setIsTransferOpen(false);
                        setTransferRect(null);
                      }}
                      className={`flex items-center justify-between px-3 py-2 rounded-[12px] text-[11px] font-extrabold tracking-wider w-full transition-all text-left uppercase cursor-pointer border-none bg-transparent group ${
                        isDarkMode
                          ? "text-white hover:bg-white/10 active:bg-white/15"
                          : "text-slate-800 hover:bg-slate-800/10 active:bg-slate-800/15"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {deptTheme && (
                          <div
                            className={`p-1.5 rounded-[8px] ${deptTheme.bg} ${deptTheme.color}`}
                          >
                            <DeptIcon
                              iconName={deptTheme.iconName as string}
                              className="w-3.5 h-3.5 shrink-0"
                            />
                          </div>
                        )}
                        <span>{names[g] || `Grupo ${g + 1}`}</span>
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

        {/* Portal: Dropdown de Role Apoio */}
        {isOpen && roleRect && (
          <PortalMenu>
            <div
              className="fixed inset-0 z-[999]"
              onClick={() => {
                setIsOpen(false);
                setRoleRect(null);
              }}
            />
            <div
              style={{
                position: "fixed",
                top: roleRect.bottom + 6,
                left: roleRect.left + roleRect.width / 2,
                transformOrigin: "top center",
                transform: "translateX(-50%) scale(var(--app-scale, 1))",
                zIndex: 1000,
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                transition={{ duration: 0.15 }}
                className={`w-[145px] backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.3)] rounded-[16px] overflow-hidden flex flex-col p-1.5 gap-1 transition-colors duration-300 ${
                  isDarkMode
                    ? "bg-slate-950/40 border border-white/10 text-white"
                    : "bg-white/40 border border-slate-300/50 text-slate-800"
                }`}
              >
                {SUPPORT_ROLES_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      handleUpdateRoleLocal(opt);
                      setIsOpen(false);
                      setRoleRect(null);
                    }}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-[12px] text-[11px] font-bold w-full transition-all text-center uppercase cursor-pointer border-none bg-transparent ${
                      opt === emp.role
                        ? isDarkMode
                          ? "text-[#FF6B00] bg-white/5 font-extrabold"
                          : "text-[#FF6B00] bg-slate-800/5 font-extrabold"
                        : isDarkMode
                          ? "text-white hover:bg-white/10 active:bg-white/15"
                          : "text-slate-800 hover:bg-slate-800/10 active:bg-slate-800/15"
                    }`}
                  >
                    <span>{opt}</span>
                    {opt === emp.role && (
                      <CheckCircle2 className="w-3 h-3 text-[#FF6B00] shrink-0" />
                    )}
                  </button>
                ))}
              </motion.div>
            </div>
          </PortalMenu>
        )}

        {/* Portal: Menu Ausente Apoio */}
        {showAbsentMenu && absentRect && (
          <PortalMenu>
            <div
              className="fixed inset-0 z-[999]"
              onClick={() => {
                setShowAbsentMenu(false);
                setAbsentRect(null);
              }}
            />
            <div
              style={{
                position: "fixed",
                top: absentRect.bottom + 10,
                left: absentRect.left + absentRect.width / 2,
                transform: "translateX(-50%) scale(var(--app-scale, 1))",
                transformOrigin: "top center",
                zIndex: 1000,
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -8 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                style={{
                  maxHeight: `max(100px, ${window.innerHeight - absentRect.bottom - 20}px)`,
                }}
                className={`w-[155px] backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.3)] rounded-[16px] overflow-y-auto overflow-x-hidden hide-scrollbar flex flex-col p-1.5 gap-1 transition-colors duration-300 ${
                  isDarkMode
                    ? "bg-slate-950/40 border border-white/10 text-white"
                    : "bg-white/40 border border-slate-300/50 text-slate-800"
                }`}
              >
                {[
                  { type: "FÉRIAS" },
                  { type: "FORA" },
                  { type: "ATM" },
                  { type: "RESTRIÇÃO" },
                  { type: "INSS" },
                  { type: "TREINAMENTO" },
                  { type: "REVEZAMENTO" },
                  { type: "ESTÁGIO" },
                ].map((opt) => {
                  const meta = STATUS_METADATA[opt.type as StatusType];
                  const Icon = meta.icon;
                  const colorClass = isDarkMode
                    ? meta.colorDark
                    : meta.colorLight;

                  return (
                    <button
                      key={opt.type}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAbsentMenu(false);
                        setAbsentRect(null);
                        handleMarkAbsentLocal(opt.type as StatusType);
                      }}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-[12px] text-[11px] font-extrabold tracking-wider w-full transition-all text-left uppercase cursor-pointer border-none bg-transparent group ${
                        isDarkMode
                          ? "text-white hover:bg-white/10 active:bg-white/15"
                          : "text-slate-800 hover:bg-slate-800/10 active:bg-slate-800/15"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 shrink-0 ${colorClass}`} />
                        <span className={colorClass}>{meta.label}</span>
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
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.emp === nextProps.emp &&
      prevProps.isDragActive === nextProps.isDragActive &&
      prevProps.index === nextProps.index &&
      prevProps.isDarkMode === nextProps.isDarkMode &&
      prevProps.is6HActive === nextProps.is6HActive &&
      prevProps.groupIndex === nextProps.groupIndex &&
      prevProps.activeEdit === nextProps.activeEdit &&
      prevProps.isAdmin === nextProps.isAdmin
    );
  },
);
