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
import { useRowPortalsDispatch } from "../contexts/RowPortalsContext";
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
    const { openPortal } = useRowPortalsDispatch();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

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
      transform: CSS.Translate.toString(transform),
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

    const actionsRef = useRef({
      onDelete: handleDeleteLocal,
      onTransfer: handleMoveLocal,
      onAbsent: handleMarkAbsentLocal,
      onSelectRole: handleUpdateRoleLocal,
      onClose: () => setIsMenuOpen(false)
    });

    useEffect(() => {
      actionsRef.current = {
        onDelete: handleDeleteLocal,
        onTransfer: handleMoveLocal,
        onAbsent: handleMarkAbsentLocal,
        onSelectRole: handleUpdateRoleLocal,
        onClose: () => setIsMenuOpen(false)
      };
    });

    const isMountedRef = useRef(false);
    useEffect(() => {
      if (!isMountedRef.current) {
        isMountedRef.current = true;
        return;
      }
      if (isMenuOpen) {
        if (emp.id) onStartEdit?.(emp.id);
      } else {
        if (emp.id) onStopEdit?.(emp.id);
      }
    }, [isMenuOpen, emp.id, onStartEdit, onStopEdit]);

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
        className={`support-role-row px-4 py-3 flex items-center rounded-[12px] ${isDragActive ? "" : "transition duration-300"} relative min-h-[80px] w-full ${
          isDragging || isGhost
            ? "opacity-30 border-dashed border border-white/10 bg-white/[0.02] shadow-none pointer-events-none"
            : isMenuOpen
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
              setIsMenuOpen(true);
              openPortal('avatar', e.currentTarget.getBoundingClientRect(), emp.id, { actionsRef, isDarkMode });
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
        <div className="flex flex-col gap-2 ml-auto shrink-0 relative items-end">
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                if (!isAdmin) return;
                e.stopPropagation();
                setIsMenuOpen(true);
                openPortal('absent', e.currentTarget.getBoundingClientRect(), emp.id, { actionsRef, isDarkMode });
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
          </div>

          <div className="flex items-center gap-2">
            {/* Transfer Button */}
            <div className="relative">
              <button
                onClick={(e) => {
                  if (!isAdmin) return;
                  setIsMenuOpen(true);
                  openPortal('transfer', e.currentTarget.getBoundingClientRect(), emp.id, { actionsRef, otherDepts: [{ id: "0", title: "Apoio 1", order: 0 }, { id: "1", title: "Apoio 2", order: 1 }, { id: "2", title: "Apoio 3", order: 2 }].filter(d => d.id !== groupIndex.toString()), isDarkMode });
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
                  setIsMenuOpen(true);
                  openPortal('role', e.currentTarget.getBoundingClientRect(), emp.id, { actionsRef, localLine: emp.role, isDarkMode });
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
        </div>

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
