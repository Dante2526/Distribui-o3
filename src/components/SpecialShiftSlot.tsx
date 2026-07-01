import React, { useState, useRef, useCallback, useEffect } from 'react';
import { User, ChevronDown, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Employee, Department, ActiveEdit, DepartmentOption } from '../types';
import { PortalMenu } from './PortalMenu';
import { useAnchoredRect } from '../hooks/useAnchoredRect';

export const SpecialShiftSlot = React.memo(({
  emp,
  index,
  departmentOptions,
  onUpdate,
  onTransfer,
  activeEdit,
  onStartEdit,
  onStopEdit,
  isAdmin
}: { 
  emp: Employee; 
  index: number; 
  departmentOptions: DepartmentOption[];
  onUpdate: (empIndex: number, field: keyof Employee, value: string) => void;
  onTransfer: (empIndex: number, targetDeptId: string) => void;
  activeEdit?: ActiveEdit;
  onStartEdit?: (empId: string) => void;
  onStopEdit?: (empId: string) => void;
  isAdmin?: boolean;
}) => {

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
      type: 'special',
      employee: emp,
      specialIndex: index,
    },
    disabled: !emp.name.trim()
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    touchAction: 'none',
    ...(activeEdit ? { outline: `2.5px solid ${activeEdit.color}`, outlineOffset: '1.5px' } : {}),
    ...(isDragging ? { zIndex: 50, position: 'relative' } : {})
  };

  const [showOofMenu, setShowOofMenu] = useState(false);
  const oofButtonRef = useRef<HTMLButtonElement>(null);
  const oofRect = useAnchoredRect(oofButtonRef, showOofMenu);

  const handleUpdateLocal = useCallback((field: keyof Employee, value: string) => {
    if (!isAdmin) return;
    onUpdate(index, field, value);
  }, [onUpdate, index, isAdmin]);

  const handleTransferLocal = useCallback((targetDeptId: string) => {
    if (!isAdmin) return;
    onTransfer(index, targetDeptId);
  }, [onTransfer, index, isAdmin]);

  const handleStartEditLocal = useCallback(() => {
    if (!isAdmin) return;
    onStartEdit?.(emp.id);
  }, [onStartEdit, emp.id, isAdmin]);

  const isMountedRef = useRef(false);
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }
    if (showOofMenu) {
      if (emp.id) onStartEdit?.(emp.id);
    } else {
      if (emp.id) onStopEdit?.(emp.id);
    }
  }, [showOofMenu, emp.id, onStartEdit, onStopEdit]);

  return (
    <motion.div 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onPointerDown={(e: React.PointerEvent<HTMLDivElement>) => {
        if (e.target instanceof HTMLElement && e.target.tagName !== 'INPUT' && e.target.tagName !== 'BUTTON') {
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
        }
        listeners?.onPointerDown?.(e as any);
      }}
      initial={{ scale: 0.98, opacity: 0.4 }}
      animate={{ 
        scale: 1, 
        opacity: isDragging ? 0.30 : 1 
      }}
      transition={{ 
        type: 'spring', 
        stiffness: 400, 
        damping: 25 
      }}
      className={`w-[250px] shrink-0 h-[100px] bg-[#111217] rounded-2xl border border-white/5 border-l-4 border-l-[#BF5AF2] shadow-sm p-3 flex flex-col justify-between relative group hover:border-[#BF5AF2]/30 transition-colors ${
        isDragging 
          ? 'opacity-30 border-dashed border-2 border-white/10 bg-white/[0.02] shadow-none pointer-events-none' 
          : 'cursor-grab'
      }`}
    >
      {/* Active Edit Badge */}
      {activeEdit && (
        <div className="absolute -top-3 right-2 bg-[#1E2029] border border-white/10 px-2 py-0.5 rounded-[6px] z-[100] shadow-lg flex items-center gap-1.5 animate-[fadeIn_0.2s_ease-out]">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: activeEdit.color }} />
          <span className="text-[10px] text-white font-bold whitespace-nowrap">
            {activeEdit.userName} editando...
          </span>
        </div>
      )}

      <div className="flex items-center justify-between w-full">
        <div className="flex items-center min-w-0">
          <div className="w-6 h-6 rounded-full bg-[#BF5AF2]/20 text-[#BF5AF2] flex items-center justify-center mr-2 shrink-0">
            <User className="w-3 h-3" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col min-w-0">
            <span
              className="font-bold text-[12px] text-white w-[130px] truncate uppercase leading-none block"
            >
              {emp.name}
            </span>
            {emp.tagType && (
              <span 
                onClick={(e) => {
                  if (!isAdmin) return;
                  e.stopPropagation();
                  handleUpdateLocal('tagType', emp.tagType === 'MAQUINISTA' ? 'OOF' : 'MAQUINISTA');
                }}
                className={`text-[8px] font-extrabold uppercase px-1 py-0.5 rounded w-max mt-0.5 tracking-wider transition-all select-none cursor-pointer hover:scale-105 active:scale-95 ${
                  emp.tagType === 'MAQUINISTA' 
                    ? 'bg-[#0A84FF]/10 text-[#0A84FF] border border-[#0A84FF]/20 hover:bg-[#0A84FF]/20' 
                    : 'bg-[#BF5AF2]/10 text-[#BF5AF2] border border-[#BF5AF2]/20 hover:bg-[#BF5AF2]/20'
                }`}
              >
                {emp.tagType === 'MAQUINISTA' ? 'MAQ' : emp.tagType}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => { 
              if (!isAdmin) return;
              e.stopPropagation(); 
              handleTransferLocal(emp.originalDeptId || 'recepcao'); 
            }}
            className="h-[24px] px-1.5 font-bold text-white bg-gradient-to-r from-[#0052B3] to-[#003D8A] rounded shadow-sm transition-all duration-300 text-[9px] whitespace-nowrap hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
          >
            TURNO 7H
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 mt-auto">
        {emp.tagType === 'OOF' ? (
          <div className="flex flex-col items-center">
            <button
              ref={oofButtonRef}
              onClick={(e) => { 
                if (!isAdmin) return;
                e.stopPropagation(); 
                setShowOofMenu(true); 
              }}
              className="h-[26px] px-2 flex items-center justify-center gap-1 rounded-md text-[10px] font-bold w-[120px] text-center uppercase bg-[#FF6B00] text-white shadow-sm border-none transition-colors hover:bg-[#E66000] cursor-pointer"
            >
              <span className="truncate">{emp.line || "LOCAL DE APOIO"}</span>
              <ChevronDown className="w-3 h-3 shrink-0" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center">
              <input
                type="text"
                value={emp.line}
                onFocus={handleStartEditLocal}
                onBlur={() => onStopEdit?.(emp.id)}
                onChange={(e) => handleUpdateLocal('line', e.target.value.toUpperCase())}
                placeholder="LINHA"
                readOnly={!isAdmin}
                className="h-[34px] px-1 rounded-md text-[10px] font-bold w-[95px] text-center uppercase placeholder-white/30 focus:outline-none bg-[#FF6B00] text-white shadow-sm border-none"
              />
            </div>
            <div className="flex flex-col items-center">
              <input
                type="text"
                value={emp.machine}
                onFocus={handleStartEditLocal}
                onBlur={() => onStopEdit?.(emp.id)}
                onChange={(e) => handleUpdateLocal('machine', e.target.value.toUpperCase())}
                placeholder="LOCO"
                readOnly={!isAdmin}
                className="h-[34px] px-1 rounded-md text-[10px] font-bold w-[95px] text-center uppercase placeholder-white/30 focus:outline-none bg-[#10B981] text-white shadow-sm border-none"
              />
            </div>
          </>
        )}
      </div>

      {/* OOF Menu (Semitransparente) */}
      {showOofMenu && oofRect && (
        <PortalMenu>
          <div className="fixed inset-0 z-[200]" onClick={(e) => { e.stopPropagation(); setShowOofMenu(false); }}>
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="bg-[#1a1c23]/90 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl py-2 w-48 overflow-hidden z-[210] flex flex-col"
              style={{
                position: 'absolute',
                top: `${oofRect.bottom + 8}px`,
                left: `${Math.min(oofRect.left, window.innerWidth - 192 - 16)}px`
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {['RECEPÇÃO', 'VIRADOR', 'CLASSIFICAÇÃO', 'FORMAÇÃO'].map((opcao) => (
                <button
                  key={opcao}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdateLocal('line', opcao);
                    setShowOofMenu(false);
                  }}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-[11px] font-bold tracking-wider hover:bg-white/10 transition-all uppercase ${
                    emp.line === opcao ? 'text-[#BF5AF2] bg-[#BF5AF2]/10 font-extrabold' : 'text-slate-300'
                  }`}
                >
                  <span>{opcao}</span>
                  {emp.line === opcao && (
                    <CheckCircle2 className="w-3 h-3 text-[#BF5AF2] shrink-0" />
                  )}
                </button>
              ))}
            </motion.div>
          </div>
        </PortalMenu>
      )}

    </motion.div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.emp === nextProps.emp &&
    prevProps.activeEdit === nextProps.activeEdit &&
    prevProps.index === nextProps.index
  );
});
