import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { User, Trash2, ArrowRightLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Employee, Department, ActiveEdit, StatusType, DepartmentOption } from '../types';
import { STATUS_METADATA } from '../types';
import { getDeptTheme, PREDEFINED_LINES } from '../constants/data';
import { PortalMenu } from './PortalMenu';
import { DeptIcon } from './DeptIcon';

const BORDER_LEFT_MAP: Record<string, string> = {
  recepcao: 'border-l-4 border-l-[#0A84FF]',
  classificacao: 'border-l-4 border-l-[#FF9F0A]',
  formacao: 'border-l-4 border-l-[#30D158]',
};
const DEFAULT_BORDER_LEFT = 'border-l-4 border-l-[#5E5CE6]';

const SWAP_HOVER_MAP: Record<string, string> = {
  recepcao: 'hover:text-[#0A84FF] hover:bg-[#0A84FF]/10',
  classificacao: 'hover:text-[#FF9F0A] hover:bg-[#FF9F0A]/10',
  formacao: 'hover:text-[#30D158] hover:bg-[#30D158]/10',
};
const DEFAULT_SWAP_HOVER = 'hover:text-[#5E5CE6] hover:bg-[#5E5CE6]/10';

export const EmployeeRow = React.memo(({
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
  isAdmin
}: {
  emp: Employee;
  index: number;
  department: Department;
  departmentOptions: DepartmentOption[];
  onMove: (targetDeptId: string, empIndex: number) => void;
  onUpdateEmployee: (deptId: string, empIndex: number, field: keyof Employee, value: string) => void;
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
}) => {
  const [showLineDropdown, setShowLineDropdown] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [showTransferMenu, setShowTransferMenu] = useState(false);
  const [showAbsentMenu, setShowAbsentMenu] = useState(false);
  const theme = getDeptTheme(department.id);
  const otherDepts = useMemo(() => departmentOptions.filter(d => d.id !== department.id), [departmentOptions, department.id]);

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
      type: 'Employee',
      employee: emp,
      departmentId: department.id,
    },
    disabled: isDragOverlay,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    touchAction: 'none',
    ...(activeEdit ? { outline: `2.5px solid ${activeEdit.color}`, outlineOffset: '1.5px' } : {}),
    ...(isDragging ? { zIndex: 50, position: 'relative' } : {})
  };

  // Helper para borda lateral de destaque conforme o setor no modo claro/escuro
  const getBorderLeftClass = (deptId: string, hasError?: boolean) => {
    return hasError ? 'border-l-4 border-l-[#FF3B30]' : (BORDER_LEFT_MAP[deptId] || DEFAULT_BORDER_LEFT);
  };

  // Helper para hover do botão de troca conforme o setor
  const getSwapHoverClass = (deptId: string) => {
    return SWAP_HOVER_MAP[deptId] || DEFAULT_SWAP_HOVER;
  };

  const [avatarRect, setAvatarRect] = useState<DOMRect | null>(null);
  const [transferRect, setTransferRect] = useState<DOMRect | null>(null);
  const [lineRect, setLineRect] = useState<DOMRect | null>(null);
  const [absentRect, setAbsentRect] = useState<DOMRect | null>(null);

  const [localLine, setLocalLine] = useState(emp.line || '');
  const [localMachine, setLocalMachine] = useState(emp.machine || '');

  useEffect(() => {
    setLocalLine(emp.line || '');
  }, [emp.line]);

  useEffect(() => {
    setLocalMachine(emp.machine || '');
  }, [emp.machine]);

  const handleMoveLocal = useCallback((targetId: string) => {
    onMove(targetId, index);
  }, [onMove, index]);

  const handleUpdateEmployeeFieldLocal = useCallback((field: keyof Employee, value: string) => {
    onUpdateEmployee(department.id, index, field, value);
  }, [onUpdateEmployee, department.id, index]);

  const handleDeleteLocal = useCallback(() => {
    onDelete(department.id, index);
  }, [onDelete, department.id, index]);

  const handleTransferToSpecialLocal = useCallback(() => {
    onTransferToSpecial(index);
  }, [onTransferToSpecial, index]);

  const handleMarkAbsentLocal = useCallback((absenceType: StatusType) => {
    onMarkAbsent(index, absenceType);
  }, [onMarkAbsent, index]);

  const handleStartEditLocal = useCallback(() => {
    if (!isAdmin) return;
    onStartEdit?.(emp.id);
  }, [onStartEdit, emp.id, isAdmin]);

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
    if (showAbsentMenu || showLineDropdown || showTransferMenu || showAvatarMenu) {
      if (emp.id) onStartEditRef.current?.(emp.id);
    } else {
      // Quando todos os menus estão fechados, e se não houver um input ativo dentro do cartão (o blur do input lidaria com a parte dele),
      // nós notificamos para parar a edição originada pelos menus.
      if (emp.id) onStopEditRef.current?.(emp.id);
    }
  }, [showAbsentMenu, showLineDropdown, showTransferMenu, showAvatarMenu, emp.id]);

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onPointerDown={(e: React.PointerEvent<HTMLDivElement>) => {
        // Força o blur do input ativo ao clicar no cartão (ex: arrastar)
        // NÃO chama onStopEdit aqui pois o onBlur do input já cuida disso
        if (e.target instanceof HTMLElement && e.target.tagName !== 'INPUT' && e.target.tagName !== 'BUTTON') {
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
        }
        listeners?.onPointerDown?.(e as any);
      }}
      initial={false}
      animate={{ 
        scale: 1, 
        opacity: (isDragging || isGhost) ? 0.30 : 1 
      }}
      transition={{ 
        type: 'spring', 
        stiffness: 400, 
        damping: 25 
      }}
      className={`employee-row-card relative flex flex-col min-h-[140px] justify-between rounded-[14px] ${isDragActive ? '' : 'transition duration-300'} dept-${department.id} ${
        emp.error ? 'bg-[#3A1414] hover:bg-[#4A1818]' : 'bg-[#111217] hover:bg-[#252836]'
      } ${getBorderLeftClass(department.id, emp.error)} ${
        (isDragging || isGhost) 
          ? 'opacity-30 border-dashed border-2 border-white/10 bg-white/[0.02] shadow-none pointer-events-none' 
          : showAbsentMenu
            ? 'opacity-40 z-[100] shadow-none'
            : 'shadow-sm hover:shadow-md hover:-translate-y-1 cursor-grab'
      }`}
    >
      {/* Active Edit Badge */}
      {activeEdit && !isDragOverlay && (
        <div className="absolute -top-3 right-0 bg-[#2A2D3E] px-2.5 py-1 rounded-full text-[10px] font-bold text-white shadow-lg border border-white/10 flex items-center gap-2 z-50 animate-[fadeIn_0.2s_ease-out]">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: activeEdit.color }} />
          <span className="opacity-90 whitespace-nowrap">
            {activeEdit.userName} editando...
          </span>
        </div>
      )}

      {/* Main Row Content */}
      <div className="p-3.5 flex flex-col justify-between flex-1 w-full gap-3">
        
        {/* Top Row: Avatar, Nome e Botão de Expandir */}
        <div className="flex items-center justify-between w-full bg-[#1E2029] bg-header-dept border border-white/[0.03] p-2.5 rounded-[10px] shadow-sm">
          <div className="flex items-center min-w-0">
            {/* Avatar Container with Pop-up Menu */}
            <div className="relative">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  const open = !showAvatarMenu;
                  setShowAvatarMenu(open);
                  setShowTransferMenu(false);
                  setShowAbsentMenu(false);
                  if (open) {
                    setAvatarRect(e.currentTarget.getBoundingClientRect());
                  } else {
                    setAvatarRect(null);
                  }
                }}
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mr-2 shadow-sm hover:scale-105 active:scale-95 transition-all outline-none avatar-emp ${
                  emp.error 
                    ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' 
                    : `${theme.bg} ${theme.color} hover:opacity-80`
                }`}
              >
                <User className="w-[15px] h-[15px]" strokeWidth={2.5} />
              </button>
            </div>
            
            <div className="flex flex-col min-w-0">
              <span
                className={`font-bold text-[14px] tracking-wide uppercase truncate leading-none w-[220px] block input-emp-name ${emp.error ? 'text-red-400' : 'text-white'}`}
              >
                {emp.name}
              </span>
              <span className="text-[10px] text-[#A0A0A5] -mt-0.5 font-medium truncate span-emp-matricula">Matrícula: {emp.matricula || 'N/A'}</span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="relative flex items-center gap-2">
            <button
              onClick={(e) => {
                if (!isAdmin) return;
                e.stopPropagation();
                const open = !showAbsentMenu;
                setShowAbsentMenu(open);
                setShowTransferMenu(false);
                setShowAvatarMenu(false);
                if (open) {
                  const target = e.currentTarget;
                  const rect = target.getBoundingClientRect();
                  const menuHeight = 350; // Altura estimada para 8 itens
                  
                  if (rect.bottom + menuHeight > window.innerHeight) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    
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
                const open = !showTransferMenu;
                setShowTransferMenu(open);
                setShowAvatarMenu(false);
                setShowAbsentMenu(false);
                if (open) {
                  setTransferRect(e.currentTarget.getBoundingClientRect());
                } else {
                  setTransferRect(null);
                }
              }}
              className={`w-7 h-7 rounded-[6px] flex items-center justify-center shrink-0 transition-all outline-none btn-emp-swap cursor-pointer ${
                emp.error 
                  ? 'bg-red-400/10 text-red-400 hover:bg-red-400/20' 
                  : `bg-white/5 text-[#a0aec0] hover:bg-white/10 ${getSwapHoverClass(department.id)}`
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bottom Row: Inputs "Linha" e "Loco" */}
        <div className="flex items-center justify-center gap-3 w-full mt-auto" onClick={(e) => e.stopPropagation()}>
          <div className="flex flex-col items-center relative">
            <input
              type="text"
              value={localLine}
              onFocus={(e) => {
                if (!isAdmin) return;
                setShowLineDropdown(true);
                setLineRect(e.currentTarget.getBoundingClientRect());
                handleStartEditLocal();
              }}
              onBlur={() => {
                if (!isAdmin) return;
                if (localLine !== (emp.line || '')) {
                  handleUpdateEmployeeFieldLocal('line', localLine);
                }
                // Chama onStopEdit IMEDIATAMENTE, sem esperar o setTimeout do dropdown
                onStopEdit?.(emp.id);
                setTimeout(() => {
                  setShowLineDropdown(false);
                  setLineRect(null);
                }, 150);
              }}
              onChange={(e) => {
                if (!isAdmin) return;
                setLocalLine(e.target.value);
                setShowLineDropdown(true);
                setLineRect(e.currentTarget.getBoundingClientRect());
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              readOnly={!isAdmin}
              className="h-[42px] px-2 rounded-[8px] text-[13px] font-bold w-[95px] sm:w-[105px] text-center uppercase placeholder-white/50 focus:outline-none bg-[#FF6B00] text-white shadow-sm border-none hover:bg-[#E66000] transition-all"
            />
            <span className="text-[9px] text-[#a0aec0] uppercase font-bold tracking-wider mt-1">Linha</span>
          </div>
          <div className="flex flex-col items-center">
            <input
              type="text"
              value={localMachine}
              onFocus={(e) => {
                if (!isAdmin) return;
                handleStartEditLocal();
              }}
              onBlur={() => {
                if (!isAdmin) return;
                if (localMachine !== (emp.machine || '')) {
                  handleUpdateEmployeeFieldLocal('machine', localMachine);
                }
                onStopEdit?.(emp.id);
              }}
              onChange={(e) => {
                if (!isAdmin) return;
                setLocalMachine(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              readOnly={!isAdmin}
              className="h-[42px] px-2 rounded-[8px] text-[13px] font-bold w-[95px] sm:w-[105px] text-center uppercase placeholder-white/50 focus:outline-none bg-[#10B981] text-white shadow-sm border-none hover:bg-[#059669] transition-all"
            />
            <span className="text-[9px] text-[#a0aec0] uppercase font-bold tracking-wider mt-1">Loco</span>
          </div>
        </div>
      </div>

      {/* === PORTALS: renderizados fora do overflow-hidden === */}

      {/* Portal: Menu Deletar (Avatar) */}
      {showAvatarMenu && avatarRect && (
        <PortalMenu>
          <div className="fixed inset-0 z-[999]" onClick={() => { setShowAvatarMenu(false); setAvatarRect(null); }} />
          <div
            style={{
              position: 'fixed',
              top: avatarRect.bottom + 6,
              left: avatarRect.left,
              transformOrigin: 'top left',
              transform: 'scale(var(--app-scale, 1))',
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
          </div>
        </PortalMenu>
      )}

      {/* Portal: Menu Transferir */}
      {showTransferMenu && transferRect && (
        <PortalMenu>
          <div className="fixed inset-0 z-[999]" onClick={() => { setShowTransferMenu(false); setTransferRect(null); }} />
            <div
            style={{
              position: 'fixed',
              top: transferRect.bottom + 6,
              left: transferRect.right - 190,
              transformOrigin: 'top right',
              transform: 'scale(var(--app-scale, 1))',
              zIndex: 1000,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -5 }}
              transition={{ duration: 0.15 }}
              className="w-[190px] bg-[#1E2029]/80 backdrop-blur-md border border-white/10 rounded-[12px] shadow-xl overflow-hidden flex flex-col py-1"
            >
              <div className="px-3 py-1 text-[10px] font-bold text-[#a0aec0] uppercase tracking-wider">Transferir para</div>
            {otherDepts.map(d => {
              const deptTheme = getDeptTheme(d.id);
              return (
                <button
                  key={d.id}
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    handleMoveLocal(d.id); 
                    setShowTransferMenu(false); 
                    setTransferRect(null);
                  }}
                  className={`flex items-center justify-between px-3 py-2 rounded-[12px] text-[11px] font-extrabold tracking-wider w-full transition-all text-left uppercase cursor-pointer border-none bg-transparent group ${
                    isDarkMode 
                      ? 'text-white hover:bg-white/10 active:bg-white/15' 
                      : 'text-slate-800 hover:bg-slate-800/10 active:bg-slate-800/15'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-[8px] ${deptTheme.bg} ${deptTheme.color}`}>
                      <DeptIcon iconName={deptTheme.iconName as string} className="w-3.5 h-3.5 shrink-0" />
                    </div>
                    <span>{d.title}</span>
                  </div>
                  <ChevronRight 
                    className={`w-3.5 h-3.5 shrink-0 transition-all duration-150 ${
                      isDarkMode 
                        ? 'text-white/25 group-hover:text-white/60 group-hover:translate-x-0.5' 
                        : 'text-slate-800/25 group-hover:text-slate-800/60 group-hover:translate-x-0.5'
                    }`} 
                  />
                </button>
              );
            })}
            </motion.div>
          </div>
        </PortalMenu>
      )}

      {/* Portal: Dropdown de Linhas */}
      <AnimatePresence>
        {showLineDropdown && lineRect && PREDEFINED_LINES.filter(l => l.toLowerCase().includes(localLine.toLowerCase())).length > 0 && (
          <PortalMenu>
            {/* Overlay invisível para garantir fechamento ao clicar fora */}
            <div 
              className="fixed inset-0 z-[999]" 
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowLineDropdown(false);
                setLineRect(null);
                (document.activeElement as HTMLElement)?.blur();
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowLineDropdown(false);
                setLineRect(null);
                (document.activeElement as HTMLElement)?.blur();
              }}
            />
            <div
              style={{
                position: 'fixed',
                top: lineRect.bottom + 4,
                left: lineRect.left + lineRect.width / 2 - 65,
                transformOrigin: 'top center',
                transform: 'scale(var(--app-scale, 1))',
                zIndex: 1000,
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="w-[130px] max-h-[150px] overflow-y-auto bg-[#1E2029]/80 backdrop-blur-md border border-white/10 rounded-[12px] shadow-2xl flex flex-col p-1.5 gap-1 hide-scrollbar"
              >
                {PREDEFINED_LINES.filter(l => l.toLowerCase().includes(localLine.toLowerCase())).map((linha) => (
                <button
                  key={linha}
                  onMouseDown={(e) => {
                    e.preventDefault(); 
                    setLocalLine(linha);
                    handleUpdateEmployeeFieldLocal('line', linha);
                    setShowLineDropdown(false);
                    setLineRect(null);
                  }}
                  className="text-center px-2 py-1.5 text-[12px] font-bold text-white hover:bg-[#FF6B00] rounded-[8px] transition-all duration-150 outline-none"
                >
                  {linha}
                  </button>
                ))}
              </motion.div>
            </div>
          </PortalMenu>
        )}
      </AnimatePresence>

      {/* Portal: Menu Ausente */}
      <AnimatePresence>
        {showAbsentMenu && absentRect && (
          <PortalMenu>
            <div className="fixed inset-0 z-[999]" onClick={() => { setShowAbsentMenu(false); setAbsentRect(null); }} />
            <div
              style={{
                position: 'fixed',
                top: absentRect.bottom + 10,
                left: absentRect.left + absentRect.width / 2,
                transform: 'translateX(-50%) scale(var(--app-scale, 1))',
                transformOrigin: 'top center',
                zIndex: 1000,
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -8 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className={`w-[155px] backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.3)] rounded-[16px] overflow-hidden flex flex-col p-1.5 gap-1 transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-slate-950/40 border border-white/10' 
                    : 'bg-white/40 border border-slate-300/50'
                }`}
              >
                {[
                  { type: 'FÉRIAS' },
                  { type: 'FORA' },
                  { type: 'ATM' },
                  { type: 'RESTRIÇÃO' },
                  { type: 'INSS' },
                  { type: 'TREINAMENTO' },
                  { type: 'REVEZAMENTO' },
                  { type: 'ESTÁGIO' }
                ].map((opt) => {
                  const meta = STATUS_METADATA[opt.type as StatusType];
                  const Icon = meta.icon;
                  const colorClass = isDarkMode ? meta.colorDark : meta.colorLight;

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
                          ? 'text-white hover:bg-white/10 active:bg-white/15' 
                          : 'text-slate-800 hover:bg-slate-800/10 active:bg-slate-800/15'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 shrink-0 ${colorClass}`} />
                        <span className={colorClass}>{meta.label}</span>
                      </div>
                      <ChevronRight 
                        className={`w-3.5 h-3.5 shrink-0 transition-all duration-150 ${
                          isDarkMode 
                            ? 'text-white/25 group-hover:text-white/60 group-hover:translate-x-0.5' 
                            : 'text-slate-800/25 group-hover:text-slate-800/60 group-hover:translate-x-0.5'
                        }`} 
                      />
                    </button>
                  );
                })}
              </motion.div>
            </div>
          </PortalMenu>
        )}
      </AnimatePresence>

    </motion.div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.emp === nextProps.emp &&
    prevProps.isDragActive === nextProps.isDragActive &&
    prevProps.activeEdit === nextProps.activeEdit &&
    prevProps.index === nextProps.index &&
    prevProps.isDarkMode === nextProps.isDarkMode &&
    prevProps.is6HActive === nextProps.is6HActive
  );
});
