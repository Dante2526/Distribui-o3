import React from 'react';
import { Users, CheckCircle2 } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { SupportRole, StatusType, ActiveEdit } from '../types';
import { SupportRoleRow } from './SupportRoleRow';

export const SupportCard = React.memo(({ 
  roles, 
  groupIndex, 
  isDarkMode,
  is6HActive,
  onUpdateRole,
  onUpdateName,
  onUpdateMatricula,
  onMoveSupport,
  onMoveToSpecial,
  onMarkAbsent,
  onDeleteSupport,
  isDragActive,
  activeEdits,
  onStartEdit,
  onStopEdit
}: { 
  roles: SupportRole[]; 
  groupIndex: number; 
  isDarkMode: boolean;
  is6HActive: boolean;
  onUpdateRole: (groupIndex: number, empIndex: number, newRole: string) => void;
  onUpdateName: (groupIndex: number, empIndex: number, newName: string) => void;
  onUpdateMatricula: (groupIndex: number, empIndex: number, newMatricula: string) => void;
  onMoveSupport: (sourceGroupIndex: number, targetGroupIndex: number, empIndex: number) => void;
  onMoveToSpecial: (groupIndex: number, empIndex: number) => void;
  onMarkAbsent: (groupIndex: number, empIndex: number, absenceType: StatusType) => void;
  onDeleteSupport: (groupIndex: number, empIndex: number) => void;
  isDragActive?: boolean;
  activeEdits?: Record<string, ActiveEdit>;
  onStartEdit?: (empId: string) => void;
  onStopEdit?: (empId: string) => void;
}) => {
  const themes = [
    { bg: "bg-[#0A84FF]/10", border: "border-[#0A84FF]/20", text: "text-[#0A84FF]", bar: "bg-[#0A84FF]" },
    { bg: "bg-[#FF9F0A]/10", border: "border-[#FF9F0A]/20", text: "text-[#FF9F0A]", bar: "bg-[#FF9F0A]" },
    { bg: "bg-[#30D158]/10", border: "border-[#30D158]/20", text: "text-[#30D158]", bar: "bg-[#30D158]" }
  ];
  const theme = themes[groupIndex] || themes[0];
  const { setNodeRef } = useDroppable({
    id: `support-group-${groupIndex}`,
  });

  const sortableItems = React.useMemo(() => roles.map(e => e.id || e.name), [roles]);

  return (
    <div className="bg-[#1E2029] rounded-[24px] overflow-visible flex flex-col border border-white/[0.02] relative min-h-full">
      
      {/* Support Card Header */}
      <div className="px-5 py-4 border-b border-[#111217] flex items-center justify-between bg-[#15171E]">
        <div className="flex items-center gap-3.5">
          <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center shadow-inner ${theme.bg} ${theme.text}`}>
            <Users className="w-5 h-5" />
          </div>
          <h4 className="text-[18px] font-bold text-white tracking-tight uppercase">
            {["Recepção", "Classificação", "Formação"][groupIndex] || `Grupo ${groupIndex + 1}`}
          </h4>
        </div>
        <div className={`flex items-center font-semibold text-[12px] px-3.5 py-1.5 rounded-full ${theme.text} ${theme.bg}`}>
          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
          {roles.length} Colab.
        </div>
      </div>
      
      {/* Support List */}
      <div ref={setNodeRef} className="p-3 space-y-2 flex-1 min-h-[150px] flex flex-col">
        <SortableContext id={`support-group-${groupIndex}`} items={sortableItems} strategy={verticalListSortingStrategy}>
        {roles.map((emp, i) => (
          <SupportRoleRow 
            key={emp.id} 
            emp={emp} 
            index={i}
            groupIndex={groupIndex}
            isDarkMode={isDarkMode}
            is6HActive={is6HActive}
            onUpdateRole={onUpdateRole} 
            onUpdateName={onUpdateName} 
            onUpdateMatricula={onUpdateMatricula}
            onMove={onMoveSupport}
            onMoveToSpecial={onMoveToSpecial}
            onMarkAbsent={onMarkAbsent}
            onDelete={onDeleteSupport}
            isDragActive={isDragActive}
            activeEdit={activeEdits?.[emp.id || '']}
            onStartEdit={onStartEdit}
            onStopEdit={onStopEdit}
          />
        ))}

        {/* Slots vazios de preenchimento para garantir espaço de 5 usuários */}
        {Array.from({ length: Math.max(0, 5 - roles.length) }).map((_, idx) => (
          <div
            key={`empty-support-${groupIndex}-${idx}`}
            className="min-h-[56px] select-none pointer-events-none"
          />
        ))}
        </SortableContext>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.roles === nextProps.roles &&
    prevProps.isDarkMode === nextProps.isDarkMode &&
    prevProps.is6HActive === nextProps.is6HActive &&
    prevProps.isDragActive === nextProps.isDragActive &&
    prevProps.groupIndex === nextProps.groupIndex &&
    prevProps.activeEdits === nextProps.activeEdits
  );
});
