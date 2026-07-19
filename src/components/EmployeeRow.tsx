import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { User, Trash2, ArrowRightLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type {
  Employee,
  Department,
  ActiveEdit,
  StatusType,
  DepartmentOption,
} from "../types";
import { STATUS_METADATA } from "../types";
import { getDeptTheme, PREDEFINED_LINES } from "../constants/data";
import { useRowPortalsDispatch } from "../contexts/RowPortalsContext";
import { DeptIcon } from "./DeptIcon";

const BORDER_LEFT_MAP: Record<string, string> = {
  recepcao: "border-l-4 border-l-[#0A84FF]",
  classificacao: "border-l-4 border-l-[#FF9F0A]",
  formacao: "border-l-4 border-l-[#30D158]",
};
const DEFAULT_BORDER_LEFT = "border-l-4 border-l-[#5E5CE6]";

const SWAP_HOVER_MAP: Record<string, string> = {
  recepcao: "hover:text-[#0A84FF] hover:bg-[#0A84FF]/10",
  classificacao: "hover:text-[#FF9F0A] hover:bg-[#FF9F0A]/10",
  formacao: "hover:text-[#30D158] hover:bg-[#30D158]/10",
};
const DEFAULT_SWAP_HOVER = "hover:text-[#5E5CE6] hover:bg-[#5E5CE6]/10";

export const EmployeeRow = React.memo(
  ({
    emp,
    index,
    department,
    departmentOptions,
    onMove,
    onUpdateEmployee,
    onDelete,
    onTransferToSpecial,
    onMarkAbsent,
    isDarkMode,
    is6HActive,
    isDragOverlay,
    activeEdit,
    onStartEdit,
    onStopEdit,
    isGhost,
    isDragActive,
    isAdmin,
    currentAdminName,
  }: {
    emp: Employee;
    index: number;
    department: Department;
    departmentOptions: DepartmentOption[];
    onMove: (sourceId: string, targetId: string, empIndex: number) => void;
    onUpdateEmployee: (
      deptId: string,
      empIndex: number,
      field: keyof Employee,
      value: string,
    ) => void;
    onDelete: (deptId: string, empIndex: number) => void;
    onTransferToSpecial: (empIndex: number) => void;
    onMarkAbsent: (empIndex: number, absenceType: StatusType) => void;
    isDarkMode: boolean;
    is6HActive: boolean;
    isDragOverlay?: boolean;
    activeEdit?: ActiveEdit;
    onStartEdit?: (empId: string) => void;
    onStopEdit?: (empId: string) => void;
    isGhost?: boolean;
    isDragActive?: boolean;
    isAdmin?: boolean;
    currentAdminName?: string | null;
  }) => {
    const isLocked = !!activeEdit && activeEdit.userName !== currentAdminName;
    const { openPortal, closePortal } = useRowPortalsDispatch();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const theme = getDeptTheme(department.id);
    const otherDepts = useMemo(
      () => departmentOptions.filter((d) => d.id !== department.id),
      [departmentOptions, department.id],
    );

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
        type: "Employee",
        employee: emp,
        departmentId: department.id,
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

    // Helper para borda lateral de destaque conforme o setor no modo claro/escuro
    const getBorderLeftClass = (deptId: string, hasError?: boolean) => {
      return hasError
        ? "border-l-4 border-l-[#FF3B30]"
        : BORDER_LEFT_MAP[deptId] || DEFAULT_BORDER_LEFT;
    };

    // Helper para hover do botão de troca conforme o setor
    const getSwapHoverClass = (deptId: string) => {
      return SWAP_HOVER_MAP[deptId] || DEFAULT_SWAP_HOVER;
    };

    const [localLine, setLocalLine] = useState(emp.line || "");
    const [localMachine, setLocalMachine] = useState(emp.machine || "");

    useEffect(() => {
      setLocalLine(emp.line || "");
    }, [emp.line]);

    useEffect(() => {
      setLocalMachine(emp.machine || "");
    }, [emp.machine]);

    const handleMoveLocal = useCallback(
      (targetId: string) => {
        onMove(department.id, targetId, index);
      },
      [onMove, department.id, index],
    );

    const handleUpdateEmployeeFieldLocal = useCallback(
      (field: keyof Employee, value: string) => {
        onUpdateEmployee(department.id, index, field, value);
      },
      [onUpdateEmployee, department.id, index],
    );

    const handleDeleteLocal = useCallback(() => {
      onDelete(department.id, index);
    }, [onDelete, department.id, index]);

    const handleTransferToSpecialLocal = useCallback(() => {
      onTransferToSpecial(index);
    }, [onTransferToSpecial, index]);

    const handleMarkAbsentLocal = useCallback(
      (absenceType: StatusType) => {
        onMarkAbsent(index, absenceType);
      },
      [onMarkAbsent, index],
    );

    const handleStartEditLocal = useCallback(() => {
      if (!isAdmin) return;
      onStartEdit?.(emp.id);
    }, [onStartEdit, emp.id, isAdmin]);

    const actionsRef = useRef({
      onDelete: handleDeleteLocal,
      onTransfer: handleMoveLocal,
      onAbsent: handleMarkAbsentLocal,
      onSelectLine: (linha: string) => {
        setLocalLine(linha);
        handleUpdateEmployeeFieldLocal("line", linha);
      },
      onClose: () => setIsMenuOpen(false),
    });

    useEffect(() => {
      actionsRef.current = {
        onDelete: handleDeleteLocal,
        onTransfer: handleMoveLocal,
        onAbsent: handleMarkAbsentLocal,
        onSelectLine: (linha: string) => {
          setLocalLine(linha);
          handleUpdateEmployeeFieldLocal("line", linha);
        },
        onClose: () => setIsMenuOpen(false),
      };
    });

    const isMountedRef = useRef(false);
    const onStartEditRef = useRef(onStartEdit);
    const onStopEditRef = useRef(onStopEdit);

    useEffect(() => {
      onStartEditRef.current = onStartEdit;
    }, [onStartEdit]);

    useEffect(() => {
      onStopEditRef.current = onStopEdit;
    }, [onStopEdit]);

    useEffect(() => {
      if (!isMountedRef.current) {
        isMountedRef.current = true;
        return;
      }
      if (isMenuOpen) {
        if (emp.id) onStartEditRef.current?.(emp.id);
      } else {
        if (emp.id) onStopEditRef.current?.(emp.id);
      }
    }, [isMenuOpen, emp.id]);

    return (
      <motion.div
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
        initial={false}
        animate={{
          scale: 1,
          opacity: isDragging || isGhost ? 0.3 : 1,
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 25,
        }}
        className={`employee-row-card relative flex flex-col min-h-[140px] justify-between rounded-[14px] ${isDragActive ? "" : "transition duration-300"} dept-${department.id} ${
          emp.error
            ? "bg-[#3A1414] hover:bg-[#4A1818]"
            : "bg-[#111217] hover:bg-[#252836]"
        } ${getBorderLeftClass(department.id, emp.error)} ${
          isDragging || isGhost
            ? "opacity-30 border-dashed border-2 border-white/10 bg-white/[0.02] shadow-none pointer-events-none"
            : isMenuOpen
              ? "bg-[#111217] opacity-40 z-[100] shadow-none"
              : "shadow-md hover:shadow-xl hover:-translate-y-1 cursor-grab"
        }`}
      >
        {activeEdit && !isDragOverlay && (
          <div
            className={`absolute -top-3 right-0 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-lg border flex items-center gap-2 z-50 animate-[fadeIn_0.2s_ease-out] ${
              isDarkMode
                ? "bg-[#2A2D3E] text-white border-white/10"
                : "bg-white text-slate-800 border-slate-200"
            }`}
          >
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: activeEdit.color }}
            />
            <span
              className={`opacity-90 whitespace-nowrap ${
                isDarkMode ? "text-white" : "text-slate-800"
              }`}
            >
              {activeEdit.userName} editando...
            </span>
          </div>
        )}

        <div className="p-3.5 flex flex-col justify-between flex-1 w-full gap-3">
          <div className="flex items-center justify-between w-full bg-gradient-to-r from-[#1E2029] to-[#2A2D3E] bg-header-dept border border-white/[0.03] p-2.5 rounded-[10px] shadow-sm">
            <div className="flex items-center min-w-0">
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(true);
                    openPortal(
                      "avatar",
                      e.currentTarget.getBoundingClientRect(),
                      emp.id,
                      { actionsRef, isDarkMode },
                    );
                  }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mr-2 shadow-sm hover:scale-105 active:scale-95 transition-all outline-none avatar-emp ${
                    emp.error
                      ? "bg-red-500/20 text-red-500 hover:bg-red-500/30"
                      : `${theme.bg} ${theme.color} hover:opacity-80`
                  }`}
                >
                  <User className="w-[15px] h-[15px]" strokeWidth={2.5} />
                </button>
              </div>

              <div className="flex flex-col min-w-0">
                <span
                  className={`font-bold text-[15px] tracking-wide uppercase truncate leading-none w-[220px] block input-emp-name ${emp.error ? "text-red-400" : "text-white"}`}
                >
                  {emp.name}
                </span>
                <span className="text-[11px] text-[#888890] mt-1 font-medium truncate span-emp-matricula">
                  Matrícula: {emp.matricula || "N/A"}
                </span>
              </div>
            </div>

            <div className="relative flex items-center gap-2">
              <button
                onClick={(e) => {
                  if (!isAdmin) return;
                  e.stopPropagation();
                  setIsMenuOpen(true);
                  openPortal(
                    "absent",
                    e.currentTarget.getBoundingClientRect(),
                    emp.id,
                    { actionsRef, isDarkMode },
                  );
                }}
                className="h-[34px] w-[70px] sm:w-[80px] flex items-center justify-center font-bold text-white bg-[#F59E0B] hover:bg-[#D97706] rounded-[8px] shadow-none border-none text-[10px] tracking-tight text-center leading-none whitespace-nowrap px-1 cursor-pointer transition-colors duration-150"
              >
                AUSENTE
              </button>
              {is6HActive && (
                <button
                  onClick={(e) => {
                    if (!isAdmin) return;
                    e.stopPropagation();
                    handleTransferToSpecialLocal();
                  }}
                  className="h-[34px] w-[70px] sm:w-[80px] flex items-center justify-center font-bold text-white bg-gradient-to-r from-[#FF9F0A] to-[#FF6B00] rounded-[8px] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 text-[10px] tracking-tight text-center leading-none whitespace-nowrap px-1 cursor-pointer"
                >
                  TURNO 6H
                </button>
              )}
              <button
                onClick={(e) => {
                  if (!isAdmin) return;
                  e.stopPropagation();
                  setIsMenuOpen(true);
                  openPortal(
                    "transfer",
                    e.currentTarget.getBoundingClientRect(),
                    emp.id,
                    { actionsRef, otherDepts, isDarkMode },
                  );
                }}
                className={`w-7 h-7 rounded-[6px] flex items-center justify-center shrink-0 transition-all outline-none btn-emp-swap cursor-pointer ${
                  emp.error
                    ? "bg-red-400/10 text-red-400 hover:bg-red-400/20"
                    : `bg-white/5 text-[#a0aec0] hover:bg-white/10 ${getSwapHoverClass(department.id)}`
                }`}
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Bottom Row: Inputs "Linha" e "Loco" */}
          <div
            className="flex items-center justify-center gap-3 w-full mt-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center relative">
              <input
                type="text"
                value={localLine}
                onFocus={(e) => {
                  if (!isAdmin || isLocked) return;
                  setIsMenuOpen(true);
                  openPortal(
                    "line",
                    e.currentTarget.getBoundingClientRect(),
                    emp.id,
                    { actionsRef, localLine, isDarkMode },
                  );
                  handleStartEditLocal();
                }}
                onBlur={(e) => {
                  if (!isAdmin) return;
                  if (localLine !== (emp.line || "")) {
                    handleUpdateEmployeeFieldLocal("line", localLine);
                  }

                  const related = e.relatedTarget as HTMLElement | null;
                  if (related && related.dataset.empId === emp.id) {
                    // movendo foco dentro do mesmo card, mantém edição
                  } else {
                    onStopEdit?.(emp.id);
                  }

                  setTimeout(() => {
                    closePortal();
                  }, 150);
                }}
                onChange={(e) => {
                  if (!isAdmin) return;
                  setLocalLine(e.target.value);
                  openPortal(
                    "line",
                    e.currentTarget.getBoundingClientRect(),
                    emp.id,
                    {
                      onSelectLine: (linha) => {
                        setLocalLine(linha);
                        handleUpdateEmployeeFieldLocal("line", linha);
                      },
                      localLine: e.target.value,
                      isDarkMode,
                    },
                  );
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.currentTarget.blur();
                  }
                }}
                readOnly={!isAdmin || isLocked}
                data-emp-id={emp.id}
                className="input-linha-loco h-[42px] px-2 rounded-[8px] text-[18px] font-semibold w-[95px] sm:w-[105px] text-center uppercase focus:outline-none border border-transparent shadow-inner transition-all"
              />
              <span className="text-[14px] text-[#a0aec0] uppercase font-bold tracking-wider mt-1">
                Linha
              </span>
            </div>
            <div className="flex flex-col items-center">
              <input
                type="text"
                value={localMachine}
                onFocus={(e) => {
                  if (!isAdmin || isLocked) return;
                  handleStartEditLocal();
                }}
                onBlur={(e) => {
                  if (!isAdmin) return;
                  if (localMachine !== (emp.machine || "")) {
                    handleUpdateEmployeeFieldLocal("machine", localMachine);
                  }

                  const related = e.relatedTarget as HTMLElement | null;
                  if (related && related.dataset.empId === emp.id) {
                    // movendo foco dentro do mesmo card, mantém edição
                  } else {
                    onStopEdit?.(emp.id);
                  }
                }}
                onChange={(e) => {
                  if (!isAdmin) return;
                  setLocalMachine(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.currentTarget.blur();
                  }
                }}
                readOnly={!isAdmin || isLocked}
                data-emp-id={emp.id}
                className="input-linha-loco h-[42px] px-2 rounded-[8px] text-[18px] font-semibold w-[95px] sm:w-[105px] text-center uppercase focus:outline-none border border-transparent shadow-inner transition-all"
              />
              <span className="text-[14px] text-[#a0aec0] uppercase font-bold tracking-wider mt-1">
                Loco
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.emp === nextProps.emp &&
      prevProps.isDragActive === nextProps.isDragActive &&
      prevProps.activeEdit === nextProps.activeEdit &&
      prevProps.index === nextProps.index &&
      prevProps.isDarkMode === nextProps.isDarkMode &&
      prevProps.is6HActive === nextProps.is6HActive &&
      prevProps.isAdmin === nextProps.isAdmin &&
      prevProps.currentAdminName === nextProps.currentAdminName
    );
  },
);
