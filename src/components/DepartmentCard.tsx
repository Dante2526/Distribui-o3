import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Employee, Department, ActiveEdit, StatusType, DepartmentOption } from '../types';
import { getDeptTheme } from '../constants/data';
import { EmployeeRow } from './EmployeeRow';
import { DeptIcon } from './DeptIcon';

export const DepartmentCard = React.memo(({ 
  department, 
  departmentOptions,
  maxCount,
  onMove,
  onUpdateEmployee,
  onDelete,
  onTransferToSpecial,
  onMarkAbsent,
  isDarkMode,
  is6HActive,
  activeEdits,
  onStartEdit,
  onStopEdit,
  isDragActive,
  isAdmin
}: { 
  department: Department;
  departmentOptions: DepartmentOption[];
  maxCount: number;
  onMove: (targetDeptId: string, empIndex: number) => void;
  onUpdateEmployee: (deptId: string, empIndex: number, field: keyof Employee, value: string) => void;
  onDelete: (deptId: string, empIndex: number) => void;
  onTransferToSpecial: (deptId: string, empIndex: number) => void;
  onMarkAbsent: (deptId: string, empIndex: number, absenceType: StatusType) => void;
  isDarkMode: boolean;
  is6HActive: boolean;
  activeEdits: Record<string, ActiveEdit>;
  onStartEdit: (empId: string) => void;
  onStopEdit: (empId: string) => void;
  isDragActive?: boolean;
  isAdmin?: boolean;
}) => {
  const theme = getDeptTheme(department.id);
  const { setNodeRef } = useDroppable({
    id: department.id,
  });

  const wrappedOnMarkAbsent = React.useCallback(
    (empIndex: number, absenceType: StatusType) => onMarkAbsent(department.id, empIndex, absenceType),
    [onMarkAbsent, department.id]
  );
  
  const wrappedOnTransferToSpecial = React.useCallback(
    (empIndex: number) => onTransferToSpecial(department.id, empIndex),
    [onTransferToSpecial, department.id]
  );

  // Array de IDs memoizado para o SortableContext
  const sortableItems = React.useMemo(() => department.data.map(e => e.id || e.name), [department.data]);

  return (
    <div className="dept-card-panel bg-[#1E2029] rounded-[24px] overflow-hidden flex flex-col shadow-lg border border-white/[0.02] min-h-full">
      {/* Cabeçalho do Setor */}
      <div className="px-6 py-5 border-b border-[#111217] flex items-center justify-between bg-[#15171E]">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center shadow-inner ${theme.bg} ${theme.color}`}>
            <DeptIcon iconName={theme.iconName as string} className="w-6 h-6" />
          </div>
          <h3 className="text-[22px] font-bold text-white tracking-tight uppercase">{department.title}</h3>
        </div>
        <div className={`flex items-center font-semibold text-[14px] px-4 py-2 rounded-full ${theme.color} ${theme.bg}`}>
          <CheckCircle2 className="w-4 h-4 mr-2" />
          {department.count} Colab.
        </div>
      </div>

      {/* Área Direita (Grade de Colaboradores) */}
      <div ref={setNodeRef} className="flex-1 p-5 bg-[#0D0E12]/30 flex flex-col">
        <SortableContext id={department.id} items={sortableItems} strategy={verticalListSortingStrategy}>
        <div className="grid grid-cols-1 gap-4 flex-1">
          {department.data.map((emp, i) => (
            <EmployeeRow
              key={emp.id}
              emp={emp}
              index={i}
              department={department}
              departmentOptions={departmentOptions}
              onMove={onMove}
              onUpdateEmployee={onUpdateEmployee}
              onDelete={onDelete}
              onTransferToSpecial={wrappedOnTransferToSpecial}
              onMarkAbsent={wrappedOnMarkAbsent}
              isDarkMode={isDarkMode}
              is6HActive={is6HActive}
              activeEdit={activeEdits[emp.id]}
              onStartEdit={onStartEdit}
              onStopEdit={onStopEdit}
              isDragActive={isDragActive}
              isAdmin={isAdmin}
            />
          ))}

          {/* Slots vazios de preenchimento para igualar a altura máxima */}
          {Array.from({ length: Math.max(0, maxCount - department.data.length) }).map((_, idx) => (
            <div
              key={`empty-${department.id}-${idx}`}
              className="min-h-[140px] select-none pointer-events-none"
            />
          ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.department === nextProps.department &&
    prevProps.maxCount === nextProps.maxCount &&
    prevProps.isDarkMode === nextProps.isDarkMode &&
    prevProps.is6HActive === nextProps.is6HActive &&
    prevProps.isDragActive === nextProps.isDragActive &&
    prevProps.activeEdits === nextProps.activeEdits
  );
});
