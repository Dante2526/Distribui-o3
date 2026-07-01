import React, { useState, useCallback } from 'react';
import { FileText, RotateCcw } from 'lucide-react';
import type { AnnotationGroup, AnnotationItem } from '../types';

const AnnotationItemRow = React.memo(({
  item,
  groupIdx,
  itemIdx,
  side,
  isAnimating,
  onUpdate,
  onReturn,
  isAdmin
}: {
  item: AnnotationItem;
  groupIdx: number;
  itemIdx: number;
  side: 'left' | 'right';
  isAnimating: boolean;
  onUpdate: (groupIdx: number, itemIdx: number, field: keyof AnnotationItem, value: string) => void;
  onReturn: (side: 'left' | 'right', groupIdx: number, itemIdx: number) => void;
  isAdmin?: boolean;
}) => {
  return (
    <div className={`annotation-item-row flex items-center justify-between px-2.5 py-2 bg-[#111217] rounded-[8px] border border-white/[0.03] gap-2 transition-all duration-300 md:hover:-translate-y-1 md:hover:bg-[#252836] md:hover:border-[#FF9F0A]/30 md:hover:shadow-md group ${isAnimating ? 'animate-border-spin' : ''}`}>
      <div className="flex flex-col gap-0.5 w-[60%] min-w-0">
        <input 
          type="text" 
          value={item.name} 
          onChange={(e) => onUpdate(groupIdx, itemIdx, 'name', e.target.value)}
          placeholder="NOME E SOBRENOME"
          className="bg-transparent text-white text-[13px] font-bold uppercase w-full focus:outline-none placeholder:text-[#a0aec0]/30 truncate leading-none md:group-hover:text-[#FF9F0A] transition-colors duration-300" 
        />
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-[#A0A0A5] font-medium whitespace-nowrap leading-none select-none">Matrícula:</span>
          <input 
            type="text" 
            value={item.matricula || ''} 
            onChange={(e) => onUpdate(groupIdx, itemIdx, 'matricula', e.target.value)}
            placeholder="N/A"
            maxLength={8}
            className="bg-transparent text-[#A0A0A5] text-[10px] font-medium focus:outline-none placeholder:text-[#A0A0A5]/30 w-[80px] leading-none input-matricula-val"
          />
        </div>
      </div>

      {item.name.trim() && (item.originalDeptId || (item as any).originalSupportGroupIndex !== undefined) ? (
        <button
          onClick={() => {
            if (!isAdmin) return;
            onReturn(side, groupIdx, itemIdx);
          }}
          title={item.originalDeptId ? `Retornar para ${item.originalDeptId === 'recepcao' ? 'Recepção' : item.originalDeptId === 'classificacao' ? 'Classificação' : 'Formação'}` : `Retornar para Apoio ${['Recepção', 'Classificação', 'Formação'][(item as any).originalSupportGroupIndex] || 'Apoio'}`}
          className="p-1 rounded bg-[#FF9F0A]/10 text-[#FF9F0A] transition-all border-none shrink-0 relative z-10 md:hover:bg-[#FF9F0A]/20 cursor-pointer"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isAnimating ? 'animate-spin' : ''}`} />
        </button>
      ) : (
        <div className="w-[22px] h-[22px] shrink-0" />
      )}

      <input 
        type="text" 
        value={item.status} 
        onChange={(e) => onUpdate(groupIdx, itemIdx, 'status', e.target.value)}
        placeholder="STATUS"
        className="bg-transparent text-[#a0aec0] text-[11px] font-semibold uppercase w-[30%] text-right focus:outline-none placeholder:text-[#a0aec0]/30 truncate relative z-10" 
      />
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.item === nextProps.item &&
    prevProps.isAnimating === nextProps.isAnimating &&
    prevProps.groupIdx === nextProps.groupIdx &&
    prevProps.itemIdx === nextProps.itemIdx &&
    prevProps.side === nextProps.side
  );
});

export const AnnotationsBoard = React.memo(({ 
  leftGroups, 
  rightGroups,
  onUpdateLeft,
  onUpdateRight,
  onReturnLeft,
  onReturnRight,
  isAdmin
}: { 
  leftGroups: AnnotationGroup[];
  rightGroups: AnnotationGroup[];
  onUpdateLeft: (groupIndex: number, itemIndex: number, field: keyof AnnotationItem, value: string) => void;
  onUpdateRight: (groupIndex: number, itemIndex: number, field: keyof AnnotationItem, value: string) => void;
  onReturnLeft?: (groupIndex: number, itemIndex: number) => void;
  onReturnRight?: (groupIndex: number, itemIndex: number) => void;
  isAdmin?: boolean;
}) => {
  const [animatingItems, setAnimatingItems] = useState<Record<string, boolean>>({});

  const handleReturn = useCallback((side: 'left' | 'right', groupIdx: number, itemIdx: number) => {
    const key = `${side}-${groupIdx}-${itemIdx}`;
    setAnimatingItems(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setAnimatingItems(prev => ({ ...prev, [key]: false }));
      if (side === 'left') {
        onReturnLeft?.(groupIdx, itemIdx);
      } else {
        onReturnRight?.(groupIdx, itemIdx);
      }
    }, 800);
  }, [onReturnLeft, onReturnRight]);

  return (
    <div className="annotations-board-panel bg-[#1E2029] rounded-[24px] overflow-hidden flex flex-col shadow-lg border border-white/[0.02] min-h-full">
      {/* Header */}
      <div className="px-6 py-5 border-b border-[#FF9F0A]/20 flex items-center justify-center bg-gradient-to-r from-[#FF9F0A]/10 to-[#FF6B00]/5 bg-[#15171E] relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF9F0A] to-[#FF6B00]" />
        <h3 className="text-[22px] font-extrabold text-[#FF9F0A] tracking-wider uppercase drop-shadow-sm flex items-center gap-2.5">
          <FileText className="w-[22px] h-[22px] text-[#FF9F0A]" strokeWidth={2.5} />
          ANOTAÇÕES MINÉRIO
        </h3>
      </div>

      {/* Body */}
      <div className="flex-1 p-5 bg-[#0D0E12]/30 flex flex-row gap-6">
        {/* Left Column */}
        <div className="flex-1 flex flex-col gap-6">
          {leftGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="flex flex-col">
              <div className="bg-[#FF9F0A]/10 border border-[#FF9F0A]/20 text-[#FF9F0A] py-2 px-3 rounded-t-[10px] text-[12px] font-bold uppercase tracking-wider text-center">
                {group.title}
              </div>
              <div className="flex flex-col gap-1 mt-1">
                {group.items.map((item, itemIdx) => {
                  const animKey = `left-${groupIdx}-${itemIdx}`;
                  return (
                    <AnnotationItemRow
                      key={item.id || item.name + '-' + itemIdx}
                      item={item}
                      groupIdx={groupIdx}
                      itemIdx={itemIdx}
                      side="left"
                      isAnimating={!!animatingItems[animKey]}
                      onUpdate={onUpdateLeft}
                      onReturn={handleReturn}
                      isAdmin={isAdmin}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Right Column */}
        <div className="flex-1 flex flex-col gap-6">
          {rightGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="flex flex-col">
              <div className="bg-[#FF9F0A]/10 border border-[#FF9F0A]/20 text-[#FF9F0A] py-2 px-3 rounded-t-[10px] text-[12px] font-bold uppercase tracking-wider text-center">
                {group.title}
              </div>
              <div className="flex flex-col gap-1 mt-1">
                {group.items.map((item, itemIdx) => {
                  const animKey = `right-${groupIdx}-${itemIdx}`;
                  return (
                    <AnnotationItemRow
                      key={item.id || item.name + '-' + itemIdx}
                      item={item}
                      groupIdx={groupIdx}
                      itemIdx={itemIdx}
                      side="right"
                      isAnimating={!!animatingItems[animKey]}
                      onUpdate={onUpdateRight}
                      onReturn={handleReturn}
                      isAdmin={isAdmin}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
