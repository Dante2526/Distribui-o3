import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Users, LayoutGrid, CheckCircle2, ChevronRight, ChevronDown, Inbox, Layers, UserCog, Trash2, Zap, User, ArrowRightLeft, Palmtree, Shield, Clock, LogOut, Activity, ShieldAlert, FileText, GripVertical, RotateCcw, Eye, EyeOff, Eraser, UserPlus, RefreshCw, Hourglass, History, Pause, Play, HelpCircle, MousePointerClick, Repeat, List, CirclePause, CirclePlay, MousePointer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  DndContext,
  closestCorners,
  closestCenter,
  pointerWithin,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  useDroppable,
  Modifier,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Portal Popup Anchor: calcula posição real na tela para renderizar fora do overflow-hidden ---
function useAnchoredRect(triggerRef: React.RefObject<HTMLElement | null>, open: boolean) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  useEffect(() => {
    if (open && triggerRef.current) {
      setRect(triggerRef.current.getBoundingClientRect());
    } else {
      setRect(null);
    }
  }, [open, triggerRef]);
  return rect;
}

function PortalMenu({ children }: { children: React.ReactNode }) {
  return createPortal(children, document.body);
}

// --- Custom Icons from PAINEL-DSS ---
const ExchangeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 1l4 4-4 4"></path>
    <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
    <path d="M7 23l-4-4 4-4"></path>
    <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
  </svg>
);

const HelpIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

const StatCard = React.memo(({ label, value, colorClass, bgClass }: { label: string; value: number; colorClass: string; bgClass: string }) => (
  <div className={`text-center py-2 px-3.5 rounded-xl min-w-[95px] border border-white/5 transition-all shadow-sm ${bgClass}`}>
    <div className={`text-[24px] font-black mb-0.5 tracking-tight ${colorClass}`}>{value}</div>
    <div className="text-[10px] text-[#a0aec0] uppercase font-bold tracking-wider">{label}</div>
  </div>
));

// --- Status Types and Predefined Styles ---
export type StatusType = 'FÉRIAS' | 'FORA' | 'ATM' | 'RESTRIÇÃO' | 'INSS';

export const STATUS_METADATA: Record<StatusType, {
  label: string;
  colorDark: string;    // cor para modo escuro
  colorLight: string;   // cor com mais contraste/escura para modo claro
  dotColor: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  'FÉRIAS': {
    label: 'FÉRIAS',
    colorDark: 'text-[#30D158]',      // Verde vibrante no escuro (iOS Green)
    colorLight: 'text-[#16A34A]',     // Verde forte de ótimo contraste no claro (Tailwind green-600)
    dotColor: 'bg-[#30D158]',
    icon: Palmtree,
  },
  'FORA': {
    label: 'FORA',
    colorDark: 'text-[#FF453A]',
    colorLight: 'text-[#EF4444]',     // Vermelho vivo no claro (Tailwind red-500)
    dotColor: 'bg-[#FF453A]',
    icon: LogOut,
  },
  'ATM': {
    label: 'ATM',
    colorDark: 'text-[#FFD60A]',      // Amarelo no escuro
    colorLight: 'text-[#D97706]',     // Âmbar/Dourado equilibrado no claro (Tailwind amber-600)
    dotColor: 'bg-[#FFD60A]',
    icon: Activity,
  },
  'RESTRIÇÃO': {
    label: 'RESTRIÇÃO',
    colorDark: 'text-[#BF5AF2]',
    colorLight: 'text-[#8B5CF6]',     // Violeta vibrante no claro (Tailwind violet-500)
    dotColor: 'bg-[#BF5AF2]',
    icon: ShieldAlert,
  },
  'INSS': {
    label: 'INSS',
    colorDark: 'text-[#FF453A]',
    colorLight: 'text-[#EF4444]',     // Vermelho vivo no claro
    dotColor: 'bg-[#FF453A]',
    icon: FileText,
  }
};

// --- Data Models ---
type Employee = {
  id: string;
  name: string;
  line: string;
  machine: string;
  error?: boolean;
  originalDeptId?: string;
  originalSupportGroupIndex?: number;
  originalSupportRole?: string;
  tagType?: 'MAQUINISTA' | 'OOF';
};

type Department = {
  id: string;
  title: string;
  data: Employee[];
  count: number;
};

type SupportRole = {
  id?: string;
  name: string;
  role: string;
  matricula?: string;
};

type AnnotationItem = {
  id?: string;
  name: string;
  status: string;
  matricula?: string;
  originalDeptId?: string;
};

type AnnotationGroup = {
  title: string;
  items: AnnotationItem[];
};

// --- Mock Data based on the provided image ---
const PREDEFINED_LINES = [
  'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 
  'VIRADOR', 'GIROFLEX', 'PIAL', 'FORM - CM', 'FORM - BX'
];

const initialDepartmentsData: Department[] = [
  {
    id: 'recepcao',
    title: 'Recepção',
    count: 6,
    data: [
      { id: 'emp-' + (1), name: 'LUCIANO ALVES', line: 'X3', machine: '238' },
      { id: 'emp-' + (2), name: 'RUFINO SANTOS', line: 'X2', machine: '231' },
      { id: 'emp-' + (3), name: 'GERALDO COSTA', line: 'X2', machine: '220' },
      { id: 'emp-' + (4), name: 'RAFAEL LIMA', line: 'X1', machine: '848' },
      { id: 'emp-' + (5), name: 'ARTHUR SOUZA', line: 'X1', machine: '819' },
      { id: 'emp-' + (6), name: 'WALTERILSON SILVA', line: '1º CORTE', machine: '253' },
    ],
  },
  {
    id: 'classificacao',
    title: 'Classificação',
    count: 8,
    data: [
      { id: 'emp-' + (7), name: 'NAIMARA MENDES', line: 'X04', machine: '805' },
      { id: 'emp-' + (8), name: 'DANIELLE OLIVEIRA', line: 'X04', machine: '257' },
      { id: 'emp-' + (9), name: 'CID PINTO', line: 'X04', machine: '259' },
      { id: 'emp-' + (10), name: 'IGOR RABELO', line: 'X04', machine: '3949' },
      { id: 'emp-' + (11), name: 'NAYLAN ROCHA', line: 'X05', machine: '847' },
      { id: 'emp-' + (12), name: 'HUMBERTO NUNES', line: 'X05', machine: '743' },
      { id: 'emp-' + (13), name: 'PEDRO JUNIOR', line: 'X05', machine: '712' },
      { id: 'emp-' + (14), name: 'NAYRON DIAS', line: 'X05', machine: '284' },
    ],
  },
  {
    id: 'formacao',
    title: 'Formação',
    count: 5,
    data: [
      { id: 'emp-' + (15), name: 'JESSICA BARROS', line: 'CTR2', machine: '2003' },
      { id: 'emp-' + (16), name: 'DANIEL ALMEIDA', line: 'CTR3', machine: '270' },
      { id: 'emp-' + (17), name: 'GABRIEL CARVALHO', line: '4C', machine: '288' },
      { id: 'emp-' + (18), name: 'PEDRO CARDOSO', line: '4C', machine: '260' },
      { id: 'emp-' + (19), name: 'ROSANA TEIXEIRA', line: '201 B', machine: '277' },
    ],
  },
];

const SUPPORT_ROLES_OPTIONS = [
  'MIKE 02',
  'VIRADOR',
  'MIKE 03',
  'AUX X5',
  'AUX GIROFLEX',
  'MIKE 06',
  'AUX X6'
];

const initialSupportData: SupportRole[][] = [
  [
    { id: 'emp-' + (20), name: 'BEATRIZ SILVA', role: 'MIKE 02', matricula: '00002020' },
    { id: 'emp-' + (21), name: 'AMÉRICO SANTOS', role: 'VIRADOR', matricula: '00002021' },
    { id: 'emp-' + (22), name: 'ESDRAS SOUZA', role: 'VIRADOR', matricula: '00002022' },
    { id: 'emp-' + (23), name: 'LARISSA COSTA', role: 'VIRADOR', matricula: '00002023' },
  ],
  [
    { id: 'emp-' + (24), name: 'CAMILE BARROS', role: 'MIKE 03', matricula: '00002024' },
    { id: 'emp-' + (25), name: 'ALBERTO LIMA', role: 'AUX GIROFLEX', matricula: '00002025' },
    { id: 'emp-' + (26), name: 'RICARDO ROCHA', role: 'AUX GIROFLEX', matricula: '00002026' },
  ],
  [
    { id: 'emp-' + (27), name: 'LUANA ALVES', role: 'MIKE 06', matricula: '00002027' },
    { id: 'emp-' + (28), name: 'ROSA MENDES', role: 'AUX X6', matricula: '00002028' },
  ],
];

const initialAnnotationsLeft: AnnotationGroup[] = [
  {
    title: 'FÉRIAS/ATM/TE/TREIN./REVEZA',
    items: [
      { id: 'emp-' + (29), name: 'WEBERTH SILVA', status: 'TREINAMENTO', matricula: '00014820', originalDeptId: 'recepcao' },
      { id: 'emp-' + (30), name: 'RAFAEL SOUZA', status: 'TREINAMENTO', matricula: '00038100', originalDeptId: 'classificacao' },
      { id: 'emp-' + (31), name: 'ARTHUR COSTA', status: 'TREINAMENTO', matricula: '00020050', originalDeptId: 'formacao' },
      { id: 'emp-' + (32), name: 'GERALDO SANTOS', status: 'TREINAMENTO', matricula: '00008490', originalDeptId: 'recepcao' },
    ]
  },
  {
    title: 'AUSENTES/FORA/FÉRIAS',
    items: [
      { id: 'emp-' + (35), name: 'ALDO RIBEIRO', status: 'FÉRIAS', matricula: '00000725', originalDeptId: 'recepcao' },
      { id: 'emp-' + (36), name: 'KEYLSON LIMA', status: 'FÉRIAS', matricula: '00000298', originalDeptId: 'classificacao' },
      { id: 'emp-' + (37), name: 'JOANDERSON ALVES', status: 'FÉRIAS', matricula: '00000801', originalDeptId: 'formacao' },
    ]
  }
];

const initialAnnotationsRight: AnnotationGroup[] = [
  {
    title: 'MAQ/OFF - ESTÁGIO',
    items: [
      { id: 'emp-' + (41), name: 'THAIS OLIVEIRA', status: 'ESTÁGIO', matricula: '00002501', originalDeptId: 'recepcao' },
      { id: 'emp-' + (42), name: 'ELIAS PEREIRA', status: 'ESTÁGIO', matricula: '00002502', originalDeptId: 'classificacao' },
      { id: 'emp-' + (43), name: 'JESSICA RODRIGUES', status: 'ESTÁGIO', matricula: '00002503', originalDeptId: 'formacao' },
      { id: 'emp-' + (44), name: 'GIANFRANCO NUNES', status: 'ESTÁGIO', matricula: '00002504', originalDeptId: 'recepcao' },
      { id: 'emp-' + (45), name: 'THAIS GOMES', status: 'ESTÁGIO', matricula: '00002505', originalDeptId: 'classificacao' },
      { id: 'emp-' + (46), name: 'BEATRIZ BARBOSA', status: 'ESTÁGIO', matricula: '00002506', originalDeptId: 'formacao' },
      { id: 'emp-' + (47), name: 'DENISSON MARTINS', status: '', matricula: '00002507', originalDeptId: 'recepcao' },
    ]
  },
  {
    title: 'TREINAMENTO / FÉRIAS/ ATM / TE',
    items: [
      { id: 'emp-' + (48), name: 'ANA PAULA SILVA', status: 'RESTRIÇÃO', matricula: '00000811', originalDeptId: 'recepcao' },
      { id: 'emp-' + (49), name: 'JONH CARDOSO', status: 'RESTRIÇÃO', matricula: '00000812', originalDeptId: 'classificacao' },
      { id: 'emp-' + (50), name: 'ANA BEATRIZ LIMA', status: 'INSS', matricula: '00000813', originalDeptId: 'formacao' },
      { id: 'emp-' + (51), name: 'CAMILE MOREIRA', status: 'ATM', matricula: '00000814', originalDeptId: 'recepcao' },
      { id: 'emp-' + (53), name: 'MARCO POLO SOUZA', status: 'FÉRIAS', matricula: '00000815', originalDeptId: 'recepcao' },
      { id: 'emp-' + (54), name: 'ADRYELLEN VIEIRA', status: 'FÉRIAS', matricula: '00000816', originalDeptId: 'classificacao' },
      { id: 'emp-' + (55), name: 'LARISSA DIAS', status: 'FORA', matricula: '00000817', originalDeptId: 'formacao' },
    ]
  },
  {
    title: 'FÉRIAS/IN SP/LICENÇA',
    items: [
      { id: 'emp-' + (57), name: 'EDNELSON MELO', status: 'INSS', matricula: '00002801', originalDeptId: 'recepcao' },
    ]
  }
];

const getDeptTheme = (deptId: string) => {
  switch (deptId) {
    case 'recepcao':
      return { color: 'text-[#0A84FF]', bg: 'bg-[#0A84FF]/15', icon: <Inbox className="w-[26px] h-[26px]" strokeWidth={1.5} /> };
    case 'classificacao':
      return { color: 'text-[#FF9F0A]', bg: 'bg-[#FF9F0A]/15', icon: <Layers className="w-[26px] h-[26px]" strokeWidth={1.5} /> };
    case 'formacao':
      return { color: 'text-[#30D158]', bg: 'bg-[#30D158]/15', icon: <UserCog className="w-[26px] h-[26px]" strokeWidth={1.5} /> };
    default:
      return { color: 'text-[#5E5CE6]', bg: 'bg-[#5E5CE6]/15', icon: <LayoutGrid className="w-[26px] h-[26px]" strokeWidth={1.5} /> };
  }
};

const AnnotationsBoard = React.memo(({ 
  leftGroups, 
  rightGroups,
  onUpdateLeft,
  onUpdateRight,
  onReturnLeft,
  onReturnRight
}: { 
  leftGroups: AnnotationGroup[];
  rightGroups: AnnotationGroup[];
  onUpdateLeft: (groupIndex: number, itemIndex: number, field: keyof AnnotationItem, value: string) => void;
  onUpdateRight: (groupIndex: number, itemIndex: number, field: keyof AnnotationItem, value: string) => void;
  onReturnLeft?: (groupIndex: number, itemIndex: number) => void;
  onReturnRight?: (groupIndex: number, itemIndex: number) => void;
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
                    <div key={itemIdx} className={`annotation-item-row flex items-center justify-between px-2.5 py-2 bg-[#111217] rounded-[8px] border border-white/[0.03] gap-2 ${animatingItems[animKey] ? 'animate-border-spin' : ''}`}>
                      <div className="flex flex-col gap-0.5 w-[60%] min-w-0">
                        <input 
                          type="text" 
                          value={item.name} 
                          onChange={(e) => onUpdateLeft(groupIdx, itemIdx, 'name', e.target.value)}
                          placeholder="NOME E SOBRENOME"
                          className="bg-transparent text-white text-[13px] font-bold uppercase w-full focus:outline-none placeholder:text-[#a0aec0]/30 truncate leading-none" 
                        />
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-[#A0A0A5] font-medium whitespace-nowrap leading-none select-none">Matrícula:</span>
                          <input 
                            type="text" 
                            value={item.matricula || ''} 
                            onChange={(e) => onUpdateLeft(groupIdx, itemIdx, 'matricula', e.target.value)}
                            placeholder="N/A"
                            maxLength={8}
                            className="bg-transparent text-[#A0A0A5] text-[10px] font-medium focus:outline-none placeholder:text-[#A0A0A5]/30 w-[80px] leading-none input-matricula-val"
                          />
                        </div>
                      </div>

                      {item.name.trim() && (item.originalDeptId || (item as any).originalSupportGroupIndex !== undefined) ? (
                        <button
                          onClick={() => handleReturn('left', groupIdx, itemIdx)}
                          title={item.originalDeptId ? `Retornar para ${item.originalDeptId === 'recepcao' ? 'Recepção' : item.originalDeptId === 'classificacao' ? 'Classificação' : 'Formação'}` : `Retornar para Apoio ${['Recepção', 'Classificação', 'Formação'][(item as any).originalSupportGroupIndex] || 'Apoio'}`}
                          className="p-1 rounded bg-[#FF9F0A]/10 text-[#FF9F0A] hover:bg-[#FF9F0A]/20 transition-all cursor-pointer border-none shrink-0 relative z-10"
                        >
                          <RotateCcw className={`w-3.5 h-3.5 ${animatingItems[animKey] ? 'animate-spin' : ''}`} />
                        </button>
                      ) : (
                        <div className="w-[22px] h-[22px] shrink-0" />
                      )}

                      <input 
                        type="text" 
                        value={item.status} 
                        onChange={(e) => onUpdateLeft(groupIdx, itemIdx, 'status', e.target.value)}
                        placeholder="STATUS"
                        className="bg-transparent text-[#a0aec0] text-[11px] font-semibold uppercase w-[30%] text-right focus:outline-none placeholder:text-[#a0aec0]/30 truncate relative z-10" 
                      />
                    </div>
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
                    <div key={itemIdx} className={`annotation-item-row flex items-center justify-between px-2.5 py-2 bg-[#111217] rounded-[8px] border border-white/[0.03] gap-2 ${animatingItems[animKey] ? 'animate-border-spin' : ''}`}>
                      <div className="flex flex-col gap-0.5 w-[60%] min-w-0">
                        <input 
                          type="text" 
                          value={item.name} 
                          onChange={(e) => onUpdateRight(groupIdx, itemIdx, 'name', e.target.value)}
                          placeholder="NOME E SOBRENOME"
                          className="bg-transparent text-white text-[13px] font-bold uppercase w-full focus:outline-none placeholder:text-[#a0aec0]/30 truncate leading-none" 
                        />
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-[#A0A0A5] font-medium whitespace-nowrap leading-none select-none">Matrícula:</span>
                          <input 
                            type="text" 
                            value={item.matricula || ''} 
                            onChange={(e) => onUpdateRight(groupIdx, itemIdx, 'matricula', e.target.value)}
                            placeholder="N/A"
                            maxLength={8}
                            className="bg-transparent text-[#A0A0A5] text-[10px] font-medium focus:outline-none placeholder:text-[#A0A0A5]/30 w-[80px] leading-none input-matricula-val"
                          />
                        </div>
                      </div>

                      {item.name.trim() && (item.originalDeptId || (item as any).originalSupportGroupIndex !== undefined) ? (
                        <button
                          onClick={() => handleReturn('right', groupIdx, itemIdx)}
                          title={item.originalDeptId ? `Retornar para ${item.originalDeptId === 'recepcao' ? 'Recepção' : item.originalDeptId === 'classificacao' ? 'Classificação' : 'Formação'}` : `Retornar para Apoio ${['Recepção', 'Classificação', 'Formação'][(item as any).originalSupportGroupIndex] || 'Apoio'}`}
                          className="p-1 rounded bg-[#FF9F0A]/10 text-[#FF9F0A] hover:bg-[#FF9F0A]/20 transition-all cursor-pointer border-none shrink-0 relative z-10"
                        >
                          <RotateCcw className={`w-3.5 h-3.5 ${animatingItems[animKey] ? 'animate-spin' : ''}`} />
                        </button>
                      ) : (
                        <div className="w-[22px] h-[22px] shrink-0" />
                      )}

                      <input 
                        type="text" 
                        value={item.status} 
                        onChange={(e) => onUpdateRight(groupIdx, itemIdx, 'status', e.target.value)}
                        placeholder="STATUS"
                        className="bg-transparent text-[#a0aec0] text-[11px] font-semibold uppercase w-[30%] text-right focus:outline-none placeholder:text-[#a0aec0]/30 truncate relative z-10" 
                      />
                    </div>
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

// --- Admin Modal Component ---
const ADMIN_PASSWORD = 'adm2025';

function AdminModal({
  isOpen,
  onClose,
  isAdmin,
  onLogin,
  onLogout,
  onLoginError,
  onClearAll,
  onGenerateReport,
  onAddUser,
  onReorganize,
  onImportCollaborator,
  is6HActive,
  onToggle6H,
  onToggleAutomation,
  isAutomationPaused,
  onShowHistory,
  onShowHelp,
  onShowTutorial,
  isDemoMode,
  onToggleDemoMode,
  isDarkMode
}: {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  onLogin: (password: string) => void;
  onLogout: () => void;
  onLoginError: () => void;
  onClearAll: () => void;
  onGenerateReport: () => void;
  onAddUser: () => void;
  onReorganize: () => void;
  onImportCollaborator: () => void;
  is6HActive: boolean;
  onToggle6H: () => void;
  onToggleAutomation: () => void;
  isAutomationPaused: boolean;
  onShowHistory: () => void;
  onShowHelp: () => void;
  onShowTutorial: () => void;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
  isDarkMode: boolean;
}) {
  const [password, setPassword] = useState('');
  const [charTimestamps, setCharTimestamps] = useState<number[]>([]);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const newTimestamps = [...charTimestamps];

    if (newValue.length > password.length) {
      // Caractere adicionado
      const diffIndex = e.target.selectionStart !== null ? e.target.selectionStart - 1 : newValue.length - 1;
      newTimestamps.splice(diffIndex, 0, Date.now());

      setTimeout(() => {
        setCharTimestamps((prev) => [...prev]);
      }, 1010);
    } else if (newValue.length < password.length) {
      // Caractere removido
      const diffIndex = e.target.selectionStart !== null ? e.target.selectionStart : newValue.length;
      newTimestamps.splice(diffIndex, password.length - newValue.length);
    } else {
      // Substituição (tamanho igual)
      const diffIndex = e.target.selectionStart !== null ? e.target.selectionStart - 1 : 0;
      newTimestamps[diffIndex] = Date.now();
      setTimeout(() => {
        setCharTimestamps((prev) => [...prev]);
      }, 1010);
    }

    setPassword(newValue);
    setCharTimestamps(newTimestamps);
  };

  const toggleShowPassword = () => {
    if (showPassword) {
      setCharTimestamps(new Array(password.length).fill(0));
    }
    setShowPassword(!showPassword);
  };

  const handleClose = () => {
    setPassword('');
    setCharTimestamps([]);
    setError('');
    setShowPassword(false);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password === ADMIN_PASSWORD) {
      setPassword('');
      setCharTimestamps([]);
      onLogin(password);
    } else {
      setError('Senha incorreta! Digite tudo em minúsculo.');
      onLoginError();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(5px)',
        animation: 'fadeIn 0.2s ease-out forwards',
      }}
      onClick={handleClose}
    >
      <div
        className={`rounded-[32px] shadow-2xl w-full text-center relative mx-4 transition-all duration-300 animate-[fadeInScale_0.25s_ease-out_forwards] flex flex-col ${
          isAdmin ? 'max-w-[448px] px-4 py-4 md:px-8 md:py-8' : 'max-w-[370px] p-8'
        } max-h-[95vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${
          isDarkMode 
            ? 'bg-[#1E2029] border border-white/10 text-white' 
            : 'bg-white border border-gray-100 text-[#1F2937]'
        }`}
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'fadeInScale 0.25s ease-out forwards' }}
      >
        <button
          onClick={handleClose}
          className={`absolute top-5 right-5 text-3xl font-light z-10 transition-colors cursor-pointer ${
            isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          &times;
        </button>

        {/* Icon */}
        {!isAdmin && (
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[#FF9F0A] to-[#FF6B00] rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-[#FF6B00]/30">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
            </svg>
          </div>
        )}

        {isAdmin ? (
          // Painel de opções do administrador - Design ultra premium IDÊNTICO À IMAGEM DO USUÁRIO
          <>
            <div className="shrink-0 mb-4 mt-1">
              <h2 className={`text-[20px] font-black uppercase tracking-wide text-center ${
                isDarkMode ? 'text-white' : 'text-[#1F2937]'
              }`}>
                Painel do Administrador
              </h2>
            </div>
            
            <div className="flex-1 space-y-3.5 text-center flex flex-col justify-between">
              <div className="grid grid-cols-2 gap-2 md:gap-2.5">
                {/* LIMPAR TUDO */}
                <button
                  onClick={onClearAll}
                  className="flex flex-col items-center justify-center p-3 bg-[#FF9500] hover:bg-[#E08300] text-white rounded-xl transition-all duration-300 active:scale-[0.98] cursor-pointer shadow-md h-[86px] md:h-[82px]"
                >
                  <div className="scale-[0.85] md:scale-90 origin-bottom">
                    <Eraser className="w-7 h-7 text-white" strokeWidth={2} />
                  </div>
                  <span className="font-bold text-[10px] md:text-xs uppercase tracking-wider text-center leading-tight mt-1">LIMPAR TUDO</span>
                </button>

                {/* RELATÓRIO */}
                <button
                  onClick={onGenerateReport}
                  className="flex flex-col items-center justify-center p-3 bg-[#3B82F6] hover:bg-[#256FD0] text-white rounded-xl transition-all duration-300 active:scale-[0.98] cursor-pointer shadow-md h-[86px] md:h-[82px]"
                >
                  <div className="scale-[0.85] md:scale-90 origin-bottom">
                    <FileText className="w-7 h-7 text-white" strokeWidth={2} />
                  </div>
                  <span className="font-bold text-[10px] md:text-xs uppercase tracking-wider text-center leading-tight mt-1">RELATÓRIO</span>
                </button>

                {/* ADD USUÁRIO */}
                <button
                  onClick={onAddUser}
                  className="flex flex-col items-center justify-center p-3 bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-xl transition-all duration-300 active:scale-[0.98] cursor-pointer shadow-md h-[86px] md:h-[82px]"
                >
                  <div className="scale-[0.85] md:scale-90 origin-bottom">
                    <UserPlus className="w-7 h-7 text-white" strokeWidth={2} />
                  </div>
                  <span className="font-bold text-[10px] md:text-xs uppercase tracking-wider text-center leading-tight mt-1">ADD USUÁRIO</span>
                </button>

                {/* IMPORTAR COLAB. */}
                <button
                  onClick={onImportCollaborator}
                  className="flex flex-col items-center justify-center p-3 bg-[#14B8A6] hover:bg-[#0D9488] text-white rounded-xl transition-all duration-300 active:scale-[0.98] cursor-pointer shadow-md h-[86px] md:h-[82px]"
                >
                  <div className="scale-[0.85] md:scale-90 origin-bottom">
                    <Repeat className="w-7 h-7 text-white" strokeWidth={2} />
                  </div>
                  <span className="font-bold text-[10px] md:text-xs uppercase tracking-wider text-center leading-tight mt-1">IMPORTAR COLAB.</span>
                </button>
                
                {/* DESATIVAR 6H / ATIVAR 6H */}
                <button
                  onClick={onToggle6H}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 active:scale-[0.98] cursor-pointer shadow-md h-[86px] md:h-[82px] text-white ${
                    is6HActive 
                      ? 'bg-[#EF4444] hover:bg-[#DC2626]' 
                      : 'bg-[#22C55E] hover:bg-[#16A34A]'
                  }`}
                >
                  <div className="scale-[0.85] md:scale-90 origin-bottom">
                    <Hourglass className="w-7 h-7 text-white" strokeWidth={2} />
                  </div>
                  <span className="font-bold text-[10px] md:text-xs uppercase tracking-wider text-center leading-tight mt-1">
                    {is6HActive ? 'DESATIVAR 6H' : 'ATIVAR 6H'}
                  </span>
                </button>

                {/* HISTÓRICO */}
                <button
                  onClick={onShowHistory}
                  className="flex flex-col items-center justify-center p-3 bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-xl transition-all duration-300 active:scale-[0.98] cursor-pointer shadow-md h-[86px] md:h-[82px]"
                >
                  <div className="scale-[0.85] md:scale-90 origin-bottom">
                    <Clock className="w-7 h-7 text-white" strokeWidth={2} />
                  </div>
                  <span className="font-bold text-[10px] md:text-xs uppercase tracking-wider text-center leading-tight mt-1">HISTÓRICO</span>
                </button>

                {/* PAUSAR AÇÕES / RETOMAR AÇÕES */}
                <button
                  onClick={onToggleAutomation}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 active:scale-[0.98] cursor-pointer shadow-md h-[86px] md:h-[82px] text-white ${
                    isAutomationPaused 
                      ? 'bg-[#EF4444] hover:bg-[#DC2626]' 
                      : 'bg-[#10B981] hover:bg-[#059669]'
                  }`}
                >
                  <div className="scale-[0.85] md:scale-90 origin-bottom">
                    {isAutomationPaused ? (
                      <CirclePlay className="w-7 h-7 text-white" strokeWidth={2} />
                    ) : (
                      <CirclePause className="w-7 h-7 text-white" strokeWidth={2} />
                    )}
                  </div>
                  <span className="font-bold text-[10px] md:text-xs uppercase tracking-wider text-center leading-tight mt-1">
                    {isAutomationPaused ? 'RETOMAR AÇÕES' : 'PAUSAR AÇÕES'}
                  </span>
                </button>

                {/* MODO DEMONSTRAÇÃO */}
                <button
                  onClick={onToggleDemoMode}
                  className="flex flex-col items-center justify-center p-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl transition-all duration-300 active:scale-[0.98] cursor-pointer shadow-md h-[86px] md:h-[82px]"
                >
                  <div className="scale-[0.85] md:scale-90 origin-bottom">
                    <MousePointer className="w-7 h-7 text-white" strokeWidth={2} />
                  </div>
                  <span className="font-bold text-[10px] md:text-xs uppercase tracking-wider text-center leading-tight mt-1">MODO DEMO</span>
                </button>
              </div>

              {/* Linha Divisória Fina */}
              <div 
                className="h-px w-full my-2.5" 
                style={{ 
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)' 
                }}
              ></div>

              <div className="w-full">
                {/* AJUDA / TUTORIAL */}
                <button
                  onClick={() => { onShowHelp(); }}
                  className="py-3 bg-[#06B6D4] hover:bg-[#0891B2] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2.5 transition active:scale-[0.98] cursor-pointer shadow-md w-full uppercase tracking-wider h-[50px]"
                >
                  <HelpCircle className="w-5 h-5 text-white" strokeWidth={2} />
                  AJUDA / TUTORIAL
                </button>
              </div>
            </div>
          </>
        ) : (
          // Formulário de login - 100% responsivo ao tema claro/escuro
          <>
            <h2 className={`text-xl font-bold mb-6 uppercase tracking-wide ${
              isDarkMode ? 'text-white' : 'text-[#1F2937]'
            }`}>
              Acesso Administrativo
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative flex flex-col">
                <div className="relative w-full">
                  <input
                    type="text"
                    placeholder="E-mail do Administrador"
                    value={password}
                    onChange={handlePasswordChange}
                    className={`text-base w-full p-4 pr-12 rounded-xl outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-[#FF6B00] font-mono transition-all relative z-10 ${
                      isDarkMode 
                        ? 'bg-[#111217] border border-white/10 placeholder-white/30 text-white' 
                        : 'bg-[#F3F4F6] border border-gray-200 placeholder-gray-400 text-gray-900'
                    } ${
                      showPassword ? '' : 'text-transparent select-all caret-[#FF6B00]'
                    }`}
                    autoFocus
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                  />
                  {!showPassword && password.length > 0 && (
                    <div 
                      className={`text-base absolute inset-y-0 left-0 flex items-center pl-4 pr-12 pointer-events-none z-20 font-mono text-left select-none ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}
                      style={{ 
                        lineHeight: '1',
                        letterSpacing: 'normal'
                      }}
                    >
                      {password.split('').map((char, i) => {
                        const ts = charTimestamps[i];
                        const isVisible = ts && (Date.now() - ts < 1000);
                        return isVisible ? char : '●';
                      }).join('')}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={toggleShowPassword}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 focus:outline-none transition-colors z-30 ${
                      isDarkMode ? 'text-[#a0aec0] hover:text-white' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <span className="text-xs text-[#FFD60A] font-bold text-left mt-2 block px-1">
                  * Digite tudo em minúsculo
                </span>
              </div>
              {error && (
                <p className="text-sm text-red-400 font-semibold text-left px-1">{error}</p>
              )}
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-[#FF9F0A] to-[#FF6B00] text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-[#FF6B00]/30"
              >
                ENTRAR
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}


function AddUserModal({
  isOpen,
  onClose,
  onAddUser,
  isDarkMode
}: {
  isOpen: boolean;
  onClose: () => void;
  onAddUser: (name: string, matricula: string, sectorId: string) => void;
  isDarkMode: boolean;
}) {
  const [name, setName] = useState('');
  const [matricula, setMatricula] = useState('');
  const [sectorId, setSectorId] = useState('maquinista');
  const [continueAdding, setContinueAdding] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => nameInputRef.current?.focus(), 150);
    } else {
      setName('');
      setMatricula('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddUser(name.trim().toUpperCase(), matricula.trim(), sectorId);

    setName('');
    setMatricula('');

    if (continueAdding) {
      setTimeout(() => nameInputRef.current?.focus(), 50);
    } else {
      onClose();
    }
  };

  const handleClose = () => {
    setName('');
    setMatricula('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(5px)',
        animation: 'fadeIn 0.2s ease-out forwards',
      }}
      onClick={handleClose}
    >
      <div
        className={`rounded-[32px] shadow-2xl w-full max-w-[390px] p-8 relative mx-4 transition-all duration-300 animate-[fadeInScale_0.25s_ease-out_forwards] flex flex-col ${
          isDarkMode 
            ? 'bg-[#1E2029] border border-white/10 text-white' 
            : 'bg-white border border-gray-100 text-[#1F2937]'
        }`}
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'fadeInScale 0.25s ease-out forwards' }}
      >
        <button
          onClick={handleClose}
          className={`absolute top-5 right-5 text-3xl font-light z-10 transition-colors cursor-pointer ${
            isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          &times;
        </button>

        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[#22C55E] to-[#16A34A] rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-[#16A34A]/30">
          <UserPlus className="w-8 h-8 text-white" strokeWidth={2.5} />
        </div>

        <h2 className={`text-xl font-black mb-6 uppercase tracking-wide text-center ${
          isDarkMode ? 'text-white' : 'text-[#1F2937]'
        }`}>
          Adicionar Colaborador
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5 text-left">
            <input
              ref={nameInputRef}
              type="text"
              required
              placeholder="NOME E SOBRENOME"
              value={name}
              onChange={(e) => setName(e.target.value.toUpperCase())}
              className={`text-sm w-full p-4 rounded-xl outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-[#22C55E] transition-all font-bold ${
                isDarkMode 
                  ? 'bg-[#111217] border border-white/10 placeholder-white/20 text-white' 
                  : 'bg-[#F3F4F6] border border-gray-200 placeholder-gray-400 text-gray-900'
              }`}
              autoComplete="off"
            />
            <span className="text-[11px] text-[#FFD60A] font-bold block px-1 mt-0.5">
              *Coloque apenas o primeiro nome e o último sobrenome
            </span>
          </div>

          <div className="flex flex-col gap-1.5 text-left">
            <input
              type="text"
              placeholder="MATRÍCULA"
              maxLength={8}
              value={matricula}
              onChange={(e) => setMatricula(e.target.value.replace(/\D/g, ''))}
              className={`text-sm w-full p-4 rounded-xl outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-[#22C55E] transition-all font-mono font-bold ${
                isDarkMode 
                  ? 'bg-[#111217] border border-white/10 placeholder-white/20 text-white' 
                  : 'bg-[#F3F4F6] border border-gray-200 placeholder-gray-400 text-gray-900'
              }`}
              autoComplete="off"
            />
          </div>

          <div className="flex flex-col gap-1.5 text-left">
            <label className={`text-[10px] font-black uppercase tracking-wider px-1 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Função
            </label>
            <div className={`flex p-1.5 rounded-xl border gap-1 transition-all ${
              isDarkMode 
                ? 'bg-[#111217] border-white/10' 
                : 'bg-[#F3F4F6] border-gray-200'
            }`}>
              <button
                type="button"
                onClick={() => setSectorId('maquinista')}
                className={`flex-1 py-3.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all duration-200 cursor-pointer ${
                  sectorId === 'maquinista'
                    ? 'bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white shadow-md shadow-[#16A34A]/20 scale-[1.02]'
                    : isDarkMode
                      ? 'text-gray-400 hover:text-white hover:bg-white/5'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                MAQUINISTA
              </button>
              <button
                type="button"
                onClick={() => setSectorId('off')}
                className={`flex-1 py-3.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all duration-200 cursor-pointer ${
                  sectorId === 'off'
                    ? 'bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white shadow-md shadow-[#16A34A]/20 scale-[1.02]'
                    : isDarkMode
                      ? 'text-gray-400 hover:text-white hover:bg-white/5'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                OFF
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between px-1 py-1.5 select-none">
            <span className={`text-xs font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Continuar adicionando
            </span>
            <button
              type="button"
              onClick={() => setContinueAdding(prev => !prev)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none cursor-pointer ${
                continueAdding ? 'bg-[#22C55E]' : isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                  continueAdding ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white font-black rounded-2xl hover:opacity-95 hover:scale-[1.01] hover:shadow-xl hover:shadow-[#16A34A]/30 active:scale-[0.99] transition-all text-sm uppercase tracking-widest cursor-pointer"
            >
              ADICIONAR
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export interface ActiveEdit {
  empId: string;
  userName: string;
  color: string;
  timestamp: number;
}

export const MOCK_USERS = [
  { name: 'Ana (Simulado)', color: '#0A84FF' }, // Azul
  { name: 'Carlos (Simulado)', color: '#30D158' }, // Verde
  { name: 'João (Simulado)', color: '#FF9F0A' }, // Laranja
  { name: 'Maria (Simulado)', color: '#FF2D55' }, // Rosa
  { name: 'Pedro (Simulado)', color: '#FFD60A' }, // Amarelo
  { name: 'Lucas (Simulado)', color: '#FF3B30' }, // Vermelho
  { name: 'Naylan (Você)', color: '#BF5AF2' }, // Roxo
];

// --- Error Boundary "Espião" para capturar erros e tela preta no mobile ---
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}
// ErrorBoundary usa coerção de tipo para compatibilidade com tsconfig (useDefineForClassFields: false)
const ErrorBoundaryBase = React.Component as any;

class ErrorBoundary extends ErrorBoundaryBase {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null } as ErrorBoundaryState;
    this.handleCopyError = this.handleCopyError.bind(this);
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Erro capturado pelo Espião:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleCopyError() {
    const { error, errorInfo } = this.state as ErrorBoundaryState;
    const errorText = `Distribui-o2 - Erro Mobile (Espião)
Erro: ${error?.toString()}
Stack: ${error?.stack}
Component Stack: ${errorInfo?.componentStack}
Device Info: ${navigator.userAgent}
Time: ${new Date().toISOString()}
    `;
    
    navigator.clipboard.writeText(errorText)
      .then(() => alert("Detalhes do erro copiados com sucesso! Cole na conversa com o desenvolvedor."))
      .catch(() => alert("Não foi possível copiar automaticamente. Selecione e copie o texto abaixo."));
  }

  render() {
    const state = this.state as ErrorBoundaryState;
    if (state.hasError) {
      return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-[#0d0e12] overflow-y-auto font-sans">
          <div className="w-full max-w-lg bg-[#1e2029]/95 border border-[#FF3B30]/30 backdrop-blur-xl rounded-[24px] p-6 shadow-2xl flex flex-col gap-6 text-white my-8">
            
            {/* Cabeçalho */}
            <div className="flex items-center gap-4 text-left">
              <div className="w-12 h-12 bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20 rounded-[14px] flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-black uppercase tracking-wider text-[#FF3B30] leading-none">ESPIÃO DE CRASH</h2>
                <p className="text-[11px] text-[#a0aec0] mt-1 font-semibold uppercase tracking-wider">A tela ficou preta por um erro interno no mobile</p>
              </div>
            </div>

            {/* Alerta explicativo */}
            <div className="p-4 bg-[#FF9F0A]/10 border border-[#FF9F0A]/20 rounded-[16px] text-left">
              <p className="text-[12px] text-[#FF9F0A] font-bold leading-normal flex items-start gap-2">
                <span>⚠️</span>
                <span>Copie os detalhes do erro usando o botão abaixo e envie no chat para que possamos corrigir esse crash específico!</span>
              </p>
            </div>

            {/* Mensagem principal do Erro */}
            <div className="bg-[#111217] border border-white/5 rounded-[14px] p-4 text-left">
              <span className="text-[10px] font-black text-[#FF3B30] uppercase tracking-wider block mb-1.5">Mensagem do Erro</span>
              <p className="text-[13px] font-mono text-white break-words select-all font-bold">
                {state.error?.toString()}
              </p>
            </div>

            {/* Detalhes Técnicos / Stack */}
            <div className="bg-[#111217] border border-white/5 rounded-[14px] p-4 text-left flex flex-col gap-2">
              <span className="text-[10px] font-black text-[#a0aec0] uppercase tracking-wider block">Rastreamento Técnico (Stack)</span>
              <div className="max-h-[140px] overflow-y-auto text-[11px] font-mono text-[#a0aec0]/80 bg-[#0d0e12] rounded-[8px] p-3 border border-white/5 break-all whitespace-pre-wrap select-all">
                {state.error?.stack || state.errorInfo?.componentStack || "Nenhum detalhe técnico adicional capturado."}
              </div>
            </div>

            {/* Ações */}
            <div className="flex flex-col gap-3 w-full mt-2">
              <button
                onClick={this.handleCopyError}
                className="w-full py-3.5 bg-gradient-to-r from-[#BF5AF2] to-[#5E5CE6] hover:opacity-90 active:scale-[0.98] transition-all text-white font-black rounded-xl shadow-lg shadow-purple-500/10 text-center text-sm uppercase tracking-wider"
              >
                COPIAR DETALHES DO ERRO 📋
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 active:scale-[0.98] transition-all text-[#a0aec0] font-black rounded-xl text-center text-sm uppercase tracking-wider"
              >
                RECARREGAR APLICAÇÃO 🔄
              </button>
            </div>

          </div>
        </div>
      );
    }

    return (this.props as ErrorBoundaryProps).children;
  }
}

function AppContent() {
  const [departmentsData, setDepartmentsData] = useState<Department[]>(initialDepartmentsData);
  const [supportRolesData, setSupportRolesData] = useState<SupportRole[][]>(initialSupportData);
  const [annotationsLeft, setAnnotationsLeft] = useState<AnnotationGroup[]>(initialAnnotationsLeft);
  const [annotationsRight, setAnnotationsRight] = useState<AnnotationGroup[]>(initialAnnotationsRight);
  const [specialShiftData, setSpecialShiftData] = useState<Employee[]>([
    { id: 'emp-' + (60), name: 'FABIANO SILVA', line: 'X4', machine: '222', tagType: 'MAQUINISTA' },
    { id: 'emp-' + (61), name: 'MAURICIO SOUZA', line: 'X6', machine: '280', tagType: 'MAQUINISTA' }
  ]);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('distribui-theme');
    return saved !== 'light'; // padrão é modo escuro
  });
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginToast, setShowLoginToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);

  // Estados e callbacks para o painel de configurações administrativas
  const [is6HActive, setIs6HActive] = useState(true);
  const [isAutomationPaused, setIsAutomationPaused] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToastMessage = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => {
        if (prev?.message === message) return null;
        return prev;
      });
    }, 3500);
  }, []);

  const handleClearAll = useCallback(() => {
    // 1. Limpar campos de Linha e Loco de todos os colaboradores nos setores comuns
    setDepartmentsData(prev => 
      prev.map(dept => ({
        ...dept,
        data: dept.data.map(emp => ({
          ...emp,
          line: '',
          machine: ''
        }))
      }))
    );

    // 2. Limpar campos de Linha e Loco dos colaboradores do Turno 6H
    setSpecialShiftData(prev => 
      prev.map(emp => ({
        ...emp,
        line: '',
        machine: ''
      }))
    );

    // 3. Limpar cargos pré-escolhidos na seção de Apoio (off)
    setSupportRolesData(prev => 
      prev.map(group => 
        group.map(emp => ({
          ...emp,
          role: ''
        }))
      )
    );

    showToastMessage("Distribuição limpa com sucesso!", "success");
    setIsAdminModalOpen(false);
  }, [showToastMessage, setIsAdminModalOpen]);

  const handleGenerateReport = useCallback(() => {
    const totalMaquinistas = departmentsData.reduce((acc, dept) => acc + dept.data.filter(emp => emp.name.trim() !== '').length, 0);
    const totalApoio = supportRolesData.reduce((acc, group) => acc + group.filter(emp => emp.name.trim() !== '').length, 0);
    const totalTurno6H = specialShiftData.filter(emp => emp.name.trim() !== '').length;
    const totalFuncionarios = totalMaquinistas + totalApoio + totalTurno6H;

    const todasAnotacoes = [
      ...annotationsLeft.flatMap(g => g.items),
      ...annotationsRight.flatMap(g => g.items)
    ].filter(item => item.name && item.name.trim() !== '');

    const totalFerias = todasAnotacoes.filter(item => item.status.toUpperCase().includes('FÉRIA') || item.status.toUpperCase().includes('FERIA')).length;
    const totalFora = todasAnotacoes.filter(item => item.status.toUpperCase() === 'FORA').length;
    const totalATM = todasAnotacoes.filter(item => item.status.toUpperCase().includes('ATM')).length;

    let report = `RESUMO GERAL - DISTRIBUIÇÃO DE EQUIPES\n`;
    report += `• Total de Funcionários Ativos: ${totalFuncionarios}\n`;
    report += `• Maquinistas: ${totalMaquinistas}\n`;
    report += `• Apoio: ${totalApoio}\n`;
    report += `• Turno 6H: ${totalTurno6H}\n\n`;
    report += `AFASTAMENTOS:\n`;
    report += `• Férias: ${totalFerias}\n`;
    report += `• Fora: ${totalFora}\n`;
    report += `• ATM: ${totalATM}\n\n`;
    report += `Colaboradores por Setor:\n`;
    departmentsData.forEach(d => {
      report += `\n[${d.title}] (${d.count} Colab.)\n`;
      d.data.forEach(e => {
        if (e.name.trim()) report += `  - ${e.name} (Linha: ${e.line || '---'}, Máquina: ${e.machine || '---'})\n`;
      });
    });

    navigator.clipboard.writeText(report);
    showToastMessage("Relatório de distribuição copiado!", "success");
  }, [departmentsData, supportRolesData, specialShiftData, annotationsLeft, annotationsRight, showToastMessage]);

  const handleAddNewUser = useCallback((name: string, matricula: string, sectorId: string) => {
    if (!name.trim()) return;
    
    const formattedName = name.toUpperCase();
    const formattedMatricula = matricula.trim();

    if (sectorId.startsWith('support-group-') || sectorId === 'off') {
      const groupIdx = sectorId === 'off' ? 0 : parseInt(sectorId.replace('support-group-', ''), 10);
      setSupportRolesData(prev => {
        return prev.map((g, idx) => {
          if (idx === groupIdx) {
            return [...g, {
              id: 'emp-supp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9),
              name: formattedName,
              role: 'VIRADOR',
              matricula: formattedMatricula
            }];
          }
          return g;
        });
      });
    } else {
      const targetSectorId = sectorId === 'maquinista' ? 'recepcao' : sectorId;
      setDepartmentsData(prev => {
        return prev.map(dept => {
          if (dept.id === targetSectorId) {
            const targetData = [...dept.data];
            targetData.push({
              id: 'emp-dept-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9),
              name: formattedName,
              line: '',
              machine: formattedMatricula,
              error: false
            });
            return {
              ...dept,
              data: targetData,
              count: targetData.length
            };
          }
          return dept;
        });
      });
    }
    
    showToastMessage(`Colaborador ${formattedName} adicionado com sucesso!`, "success");
  }, [showToastMessage]);

  const handleReorganize = useCallback(() => {
    setDepartmentsData(prev => {
      return prev.map(dept => {
        const sortedData = [...dept.data].sort(() => Math.random() - 0.5);
        return {
          ...dept,
          data: sortedData
        };
      });
    });
    showToastMessage("Equipes reorganizadas dinamicamente!", "success");
  }, [showToastMessage]);

  const handleImportCollaborator = useCallback(() => {
    setDepartmentsData(prev => {
      return prev.map((dept, i) => {
        if (i === 0) {
          const newData = [...dept.data];
          newData.push({ id: 'emp-imp-1-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9), name: 'MARCOS AURELIO', line: 'L1', machine: '110', error: false });
          newData.push({ id: 'emp-imp-2-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9), name: 'PAULO SERGIO', line: 'L2', machine: '112', error: false });
          return { ...dept, data: newData, count: newData.length };
        }
        return dept;
      });
    });
    showToastMessage("Colaboradores adicionais importados!", "success");
  }, [showToastMessage]);

  const handleToggle6H = useCallback(() => {
    setIs6HActive(prev => {
      const next = !prev;
      showToastMessage(next ? "Visualização do Turno 6H ativada!" : "Visualização do Turno 6H desativada!", "success");
      return next;
    });
  }, [showToastMessage]);

  const handleToggleAutomation = useCallback(() => {
    setIsAutomationPaused(prev => {
      const next = !prev;
      showToastMessage(next ? "Ações automáticas pausadas!" : "Ações automáticas retomadas!", "success");
      return next;
    });
  }, [showToastMessage]);

  const handleShowHistory = useCallback(() => {
    showToastMessage("Exibindo histórico de alterações no console...", "info");
    console.log("Histórico administrativo acessado em " + new Date().toLocaleString());
  }, [showToastMessage]);

  const handleShowHelp = useCallback(() => {
    showToastMessage("Central de ajuda: Suporte técnico ativo.", "info");
  }, [showToastMessage]);

  const handleShowTutorial = useCallback(() => {
    showToastMessage("Tutorial de distribuição iniciado!", "success");
  }, [showToastMessage]);

  const handleToggleDemoMode = useCallback(() => {
    setIsDemoMode(prev => {
      const next = !prev;
      showToastMessage(next ? "Modo demonstração ativado!" : "Modo demonstração desativado!", "success");
      return next;
    });
  }, [showToastMessage]);

  const [activeEdits, setActiveEdits] = useState<Record<string, ActiveEdit>>({});


  const handleStartEdit = useCallback((empId: string) => {
    setActiveEdits((prev) => {
      const newEdits = { ...prev };
      // Remove edições anteriores do próprio usuário (Naylan)
      Object.keys(newEdits).forEach(key => {
        if (newEdits[key].userName === MOCK_USERS[6].name) {
          delete newEdits[key];
        }
      });
      // Adiciona a nova edição
      newEdits[empId] = {
        empId,
        userName: MOCK_USERS[6].name,
        color: MOCK_USERS[6].color,
        timestamp: Date.now()
      };
      return newEdits;
    });

    setTimeout(() => {
      setActiveEdits((prev) => {
        const newEdits = { ...prev };
        if (newEdits[empId] && Date.now() - newEdits[empId].timestamp >= 11500) {
          delete newEdits[empId];
        }
        return newEdits;
      });
    }, 12000);
  }, []);

  const [activeId, setActiveId] = useState<string | null>(null);
  const clonedDepartmentsRef = useRef<Department[] | null>(null);

  const [activeSupportId, setActiveSupportId] = useState<string | null>(null);
  const clonedSupportRef = useRef<SupportRole[][] | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  // --- LATEST STATE REFS (Para evitar stale closures nos DND callbacks sem quebrar o memo) ---
  const departmentsDataRef = useRef(departmentsData);
  const supportRolesDataRef = useRef(supportRolesData);
  useEffect(() => {
    departmentsDataRef.current = departmentsData;
    supportRolesDataRef.current = supportRolesData;
  }, [departmentsData, supportRolesData]);
  // -----------------------------------------------------------------------------------------

  const pointerSensor = useSensor(PointerSensor, React.useMemo(() => ({
    activationConstraint: {
      distance: 5,
    },
  }), []));

  const touchSensor = useSensor(TouchSensor, React.useMemo(() => ({
    activationConstraint: {
      delay: 250,
      tolerance: 6,
    },
  }), []));

  const sensors = useSensors(pointerSensor, touchSensor);

  const findContainer = useCallback((id: string, departments: Department[]) => {
    if (departments.some(d => d.id === id)) return id;
    const dept = departments.find(d => d.data.some(e => e.id === id));
    return dept ? dept.id : null;
  }, []);

  const handleDragStart = useCallback((event: any) => {
    const activeIdVal = event.active.id;
    setActiveId(activeIdVal);
    setOverId(null);
    clonedDepartmentsRef.current = departmentsDataRef.current;
    clonedSupportRef.current = supportRolesDataRef.current;
    const isSupport = supportRolesDataRef.current.some(group => group.some(e => e.id === activeIdVal));
    if (isSupport) {
      setActiveSupportId(activeIdVal);
    }
  }, []);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setActiveSupportId(null);
    setOverId(null);
    if (clonedDepartmentsRef.current) {
      setDepartmentsData(clonedDepartmentsRef.current);
    }
    if (clonedSupportRef.current) {
      setSupportRolesData(clonedSupportRef.current);
    }
  }, []);

  const findSupportContainer = useCallback((id: string, supportData: SupportRole[][]) => {
    if (id.startsWith?.('support-group-')) {
      return id;
    }
    const groupIdx = supportData.findIndex(group => group.some(e => e.id === id));
    return groupIdx !== -1 ? `support-group-${groupIdx}` : null;
  }, []);

  const handleDragOver = useCallback((event: any) => {
    const { active, over } = event;
    if (!over) {
      setOverId(null);
      return;
    }

    const activeId = active.id;
    const overId = over.id;
    setOverId(overId);

    if (activeId === overId) return;

    // Encontrar container de origem
    let activeContainer: string | null = null;
    let activeType: 'maquinista' | 'apoio' | null = null;
    let activeItem: any = null;
    let activeIdx = -1;

    for (const dept of departmentsDataRef.current) {
      const idx = dept.data.findIndex(e => e.id === activeId);
      if (idx !== -1) {
        activeContainer = dept.id;
        activeType = 'maquinista';
        activeItem = dept.data[idx];
        activeIdx = idx;
        break;
      }
    }

    if (!activeType) {
      for (let idx = 0; idx < supportRolesDataRef.current.length; idx++) {
        const supportIdx = supportRolesDataRef.current[idx].findIndex(e => e.id === activeId);
        if (supportIdx !== -1) {
          activeContainer = `support-group-${idx}`;
          activeType = 'apoio';
          activeItem = supportRolesDataRef.current[idx][supportIdx];
          activeIdx = supportIdx;
          break;
        }
      }
    }

    if (!activeContainer || !activeType || !activeItem) return;

    // Encontrar container de destino
    let overContainer: string | null = null;
    let overType: 'maquinista' | 'apoio' | null = null;
    let overIdx = -1;

    if (overId === 'recepcao' || overId === 'classificacao' || overId === 'formacao') {
      overContainer = overId;
      overType = 'maquinista';
    } else if (overId.startsWith?.('support-group-')) {
      overContainer = overId;
      overType = 'apoio';
    } else {
      const dept = departmentsData.find(d => d.id === overId);
      if (dept) {
        overContainer = dept.id;
        overType = 'maquinista';
      } else {
        for (const d of departmentsData) {
          const idx = d.data.findIndex(e => e.id === overId);
          if (idx !== -1) {
            overContainer = d.id;
            overType = 'maquinista';
            overIdx = idx;
            break;
          }
        }
      }

      if (!overContainer) {
        const groupIdx = parseInt(overId.toString().replace('support-group-', ''), 10);
        if (!isNaN(groupIdx) && groupIdx >= 0 && groupIdx < supportRolesData.length) {
          overContainer = `support-group-${groupIdx}`;
          overType = 'apoio';
        } else {
          for (let idx = 0; idx < supportRolesData.length; idx++) {
            const supportIdx = supportRolesData[idx].findIndex(e => e.id === activeId);
            if (supportIdx !== -1) {
              overContainer = `support-group-${idx}`;
              overType = 'apoio';
              overIdx = supportIdx;
              break;
            }
          }
        }
      }
    }

    if (!overContainer || !overType) return;

    // Se estiver no mesmo container, retornar imediatamente!
    // A reordenação interna é feita de forma visual pelo useSortable e gravada apenas no handleDragEnd!
    if (activeContainer === overContainer) {
      // HOTFIX: Se o usuário escorregar o cartão para a pista de pouso (padding vazio) 
      // do PRÓPRIO container, o dnd-kit aborta a animação visual por não achar um SortableItem.
      // Para o fantasma não ficar preso na posição antiga, forçamos o cartão pro final do array no React!
      if (overIdx === -1) {
        if (activeType === 'maquinista') {
          setDepartmentsData(prev => prev.map(d => {
            if (d.id === activeContainer && activeIdx !== d.data.length - 1) {
              const newData = [...d.data];
              const item = newData.splice(activeIdx, 1)[0];
              newData.push(item);
              return { ...d, data: newData, count: newData.length };
            }
            return d;
          }));
        } else if (activeType === 'apoio') {
          const groupIdx = parseInt(activeContainer.replace('support-group-', ''), 10);
          if (!isNaN(groupIdx)) {
            setSupportRolesData(prev => prev.map((g, idx) => {
              if (idx === groupIdx && activeIdx !== g.length - 1) {
                const newGroup = [...g];
                const item = newGroup.splice(activeIdx, 1)[0];
                newGroup.push(item);
                return newGroup;
              }
              return g;
            }));
          }
        }
      }
      return;
    }

    // --- CASO A: Maquinista -> Maquinista ---
    if (activeType === 'maquinista' && overType === 'maquinista') {
      setDepartmentsData(prev => {
        const activeDept = prev.find(d => d.id === activeContainer);
        const overDept = prev.find(d => d.id === overContainer);
        if (!activeDept || !overDept) return prev;

        const targetIdx = overIdx >= 0 ? overIdx : overDept.data.length;

        return prev.map(d => {
          if (d.id === activeContainer) {
            const newData = d.data.filter(e => e.id !== activeId);
            return { ...d, data: newData, count: newData.length };
          }
          if (d.id === overContainer) {
            const cleaned = d.data.filter(e => e.id !== activeId);
            const newData = [...cleaned];
            newData.splice(targetIdx, 0, activeItem);
            return { ...d, data: newData, count: newData.length };
          }
          return d;
        });
      });
    }

    // --- CASO B: Apoio -> Apoio ---
    else if (activeType === 'apoio' && overType === 'apoio') {
      const activeGroupIdx = parseInt(activeContainer.replace('support-group-', ''), 10);
      const overGroupIdx = parseInt(overContainer.replace('support-group-', ''), 10);
      if (!isNaN(activeGroupIdx) && !isNaN(overGroupIdx)) {
        setSupportRolesData(prev => {
          const activeItems = prev[activeGroupIdx];
          const overItems = prev[overGroupIdx];
          if (!activeItems || !overItems) return prev;

          const targetIdx = overIdx >= 0 ? overIdx : overItems.length;

          return prev.map((group, idx) => {
            if (idx === activeGroupIdx) return group.filter(e => e.id !== activeId);
            if (idx === overGroupIdx) {
              const cleaned = group.filter(e => e.id !== activeId);
              const newData = [...cleaned];
              newData.splice(targetIdx, 0, activeItem);
              return newData;
            }
            return group;
          });
        });
      }
    }

    // --- CASO C: Maquinista -> Apoio ---
    else if (activeType === 'maquinista' && overType === 'apoio') {
      const overGroupIdx = parseInt(overContainer.replace('support-group-', ''), 10);
      if (!isNaN(overGroupIdx)) {
        const adaptedSupport: SupportRole = {
          id: activeItem.id,
          name: activeItem.name,
          role: 'VIRADOR',
          matricula: activeItem.machine || ''
        };

        setDepartmentsData(prev => prev.map(d => {
          if (d.id === activeContainer) {
            const newData = d.data.filter(e => e.id !== activeId);
            return { ...d, data: newData, count: newData.length };
          }
          return d;
        }));

        setSupportRolesData(prev => prev.map((group, idx) => {
          if (idx === overGroupIdx) {
            const cleaned = group.filter(e => e.id !== activeId);
            const newData = [...cleaned];
            const targetIdx = overIdx >= 0 ? overIdx : group.length;
            newData.splice(targetIdx, 0, adaptedSupport);
            return newData;
          }
          return group;
        }));
      }
    }

    // --- CASO 4: Apoio -> Maquinista ---
    else if (activeType === 'apoio' && overType === 'maquinista') {
      const activeGroupIdx = parseInt(activeContainer.replace('support-group-', ''), 10);
      if (!isNaN(activeGroupIdx)) {
        const adaptedEmployee: Employee = {
          id: activeItem.id,
          name: activeItem.name,
          line: '',
          machine: activeItem.matricula || '',
          error: false
        };

        setSupportRolesData(prev => prev.map((group, idx) => {
          if (idx === activeGroupIdx) return group.filter(e => e.id !== activeId);
          return group;
        }));

        setDepartmentsData(prev => prev.map(d => {
          if (d.id === overContainer) {
            const cleaned = d.data.filter(e => e.id !== activeId);
            const newData = [...cleaned];
            const targetIdx = overIdx >= 0 ? overIdx : d.data.length;
            newData.splice(targetIdx, 0, adaptedEmployee);
            return { ...d, data: newData, count: newData.length };
          }
          return d;
        }));
      }
    }
  }, [departmentsData, supportRolesData]);

  const handleDragEnd = useCallback((event: any) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveSupportId(null);
    setOverId(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Encontrar container de origem
    let activeContainer: string | null = null;
    let activeType: 'maquinista' | 'apoio' | null = null;

    for (const dept of departmentsDataRef.current) {
      if (dept.data.some(e => e.id === activeId)) {
        activeContainer = dept.id;
        activeType = 'maquinista';
        break;
      }
    }

    if (!activeType) {
      for (let idx = 0; idx < supportRolesDataRef.current.length; idx++) {
        if (supportRolesDataRef.current[idx].some(e => e.id === activeId)) {
          activeContainer = `support-group-${idx}`;
          activeType = 'apoio';
          break;
        }
      }
    }

    if (!activeContainer || !activeType) return;

    // Encontrar container de destino
    let overContainer: string | null = null;
    let overType: 'maquinista' | 'apoio' | null = null;
    let overIdx = -1;

    if (overId === 'recepcao' || overId === 'classificacao' || overId === 'formacao') {
      overContainer = overId;
      overType = 'maquinista';
    } else if (overId.startsWith?.('support-group-')) {
      overContainer = overId;
      overType = 'apoio';
    } else {
      const dept = departmentsDataRef.current.find(d => d.id === overId);
      if (dept) {
        overContainer = dept.id;
        overType = 'maquinista';
      } else {
        for (const d of departmentsDataRef.current) {
          const idx = d.data.findIndex(e => e.id === overId);
          if (idx !== -1) {
            overContainer = d.id;
            overType = 'maquinista';
            overIdx = idx;
            break;
          }
        }
      }

      if (!overContainer) {
        const groupIdx = parseInt(overId.toString().replace('support-group-', ''), 10);
        if (!isNaN(groupIdx) && groupIdx >= 0 && groupIdx < supportRolesDataRef.current.length) {
          overContainer = `support-group-${groupIdx}`;
          overType = 'apoio';
        } else {
          for (let idx = 0; idx < supportRolesDataRef.current.length; idx++) {
            const supportIdx = supportRolesDataRef.current[idx].findIndex(e => e.id === overId);
            if (supportIdx !== -1) {
              overContainer = `support-group-${idx}`;
              overType = 'apoio';
              overIdx = supportIdx;
              break;
            }
          }
        }
      }
    }

    if (!overContainer || !overType) return;

    // Apenas se for no mesmo container é que reordenamos os itens!
    if (activeContainer === overContainer) {
      if (activeType === 'maquinista') {
        const dept = departmentsDataRef.current.find(d => d.id === activeContainer);
        if (dept) {
          const activeIndex = dept.data.findIndex(e => e.id === activeId);
          const overIndex = overIdx >= 0 ? overIdx : dept.data.length - 1;
          if (activeIndex !== overIndex && activeIndex !== -1) {
            setDepartmentsData(prev => prev.map(d => {
              if (d.id === activeContainer) {
                return { ...d, data: arrayMove(d.data, activeIndex, overIndex) };
              }
              return d;
            }));
          }
        }
      } else if (activeType === 'apoio') {
        const groupIdx = parseInt(activeContainer.replace('support-group-', ''), 10);
        if (!isNaN(groupIdx)) {
          const group = supportRolesDataRef.current[groupIdx];
          const activeIndex = group.findIndex(e => e.id === activeId);
          const overIndex = overIdx >= 0 ? overIdx : group.length - 1;
          if (activeIndex !== overIndex && activeIndex !== -1) {
            setSupportRolesData(prev => prev.map((g, idx) => {
              if (idx === groupIdx) return arrayMove(g, activeIndex, overIndex);
              return g;
            }));
          }
        }
      }
    }
  }, []);


  const activeEmployee = activeId 
    ? departmentsData.flatMap(d => d.data).find(e => e.id === activeId)
    : null;
  const activeDepartment = activeEmployee
    ? departmentsData.find(d => d.data.some(e => e.id === activeId))
    : null;
  const activeSupportItem = activeId
    ? supportRolesData.flatMap(g => g).find(e => e.id === activeId)
    : null;
  const activeSupportGroupIndex = activeSupportItem
    ? supportRolesData.findIndex(g => g.some(e => e.id === activeId))
    : -1;


  const handleAdminLogin = useCallback((enteredPassword: string) => {
    if (enteredPassword === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setShowLoginToast(true);
      setTimeout(() => {
        setShowLoginToast(false);
      }, 3500);
    }
  }, []);

  const handleAdminLogout = useCallback(() => {
    setIsAdmin(false);
    setIsAdminModalOpen(false);
  }, []);

  const handleAdminLoginError = useCallback(() => {
    setShowErrorToast(true);
    setTimeout(() => {
      setShowErrorToast(false);
    }, 3500);
  }, []);

  useEffect(() => {
    localStorage.setItem('distribui-theme', isDarkMode ? 'dark' : 'light');
    // Atualiza o background do body para evitar flash branco no overscroll
    document.body.style.backgroundColor = isDarkMode ? '#111217' : '#eef2f7';
    
    // Aplica a classe light-mode ao body para que os portais herdem os estilos corretos
    if (!isDarkMode) {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, [isDarkMode]);

  const handleToggleDarkMode = useCallback(() => setIsDarkMode(prev => !prev), []);

  const handleUpdateSpecialShiftEmployee = useCallback((empIndex: number, field: keyof Employee, value: any) => {
    setSpecialShiftData(prev => {
      const newData = [...prev];
      newData[empIndex] = { ...newData[empIndex], [field]: value };
      if (field === 'name' && value.trim() && !newData[empIndex].tagType) {
        newData[empIndex].tagType = 'MAQUINISTA';
      }
      return newData;
    });
  }, []);

  const handleTransferToSpecialShift = useCallback((sourceDeptId: string, sourceEmpIndex: number) => {
    const sourceDept = departmentsData.find(d => d.id === sourceDeptId);
    if (!sourceDept) return;

    const movedEmployee = sourceDept.data[sourceEmpIndex];
    if (!movedEmployee) return;

    // Remove da origem
    setDepartmentsData(prev => {
      const newDepts = [...prev];
      const idx = newDepts.findIndex(d => d.id === sourceDeptId);
      if (idx === -1) return prev;
      const newData = [...newDepts[idx].data];
      newData.splice(sourceEmpIndex, 1);
      newDepts[idx] = { ...newDepts[idx], data: newData, count: newData.length };
      return newDepts;
    });

    // Adiciona no Turno Especial
    setSpecialShiftData(prev => [
      ...prev,
      { ...movedEmployee, originalDeptId: sourceDeptId, tagType: 'MAQUINISTA' }
    ]);
  }, [departmentsData]);

  const handleTransferSupportToSpecialShift = useCallback((sourceGroupIndex: number, sourceEmpIndex: number) => {
    const sourceGroup = supportRolesData[sourceGroupIndex];
    if (!sourceGroup) return;

    const movedRole = sourceGroup[sourceEmpIndex];
    if (!movedRole) return;

    // Remove do grupo de apoio
    setSupportRolesData(prev => {
      const newSupport = prev.map(group => [...group]);
      newSupport[sourceGroupIndex].splice(sourceEmpIndex, 1);
      return newSupport;
    });

    // Adiciona no Turno Especial
    setSpecialShiftData(prev => [
      ...prev,
      {
        id: movedRole.id,
        name: movedRole.name,
        line: '',
        machine: movedRole.matricula || '',
        originalSupportGroupIndex: sourceGroupIndex,
        originalSupportRole: movedRole.role,
        tagType: 'OOF'
      }
    ]);
  }, [supportRolesData]);

  const handleTransferFromSpecialShift = useCallback((empIndex: number, targetDeptId: string) => {
    const movedEmployee = specialShiftData[empIndex];
    if (!movedEmployee.name.trim()) return;

    setSpecialShiftData(prev => {
      const newSpecial = [...prev];
      newSpecial.splice(empIndex, 1);
      return newSpecial;
    });

    if (movedEmployee.originalSupportGroupIndex !== undefined) {
      const groupIdx = movedEmployee.originalSupportGroupIndex;
      const roleStr = movedEmployee.originalSupportRole || 'VIRADOR';
      setSupportRolesData(prev => {
        const newSupport = prev.map(group => [...group]);
        newSupport[groupIdx].push({
          id: movedEmployee.id || ('emp-supp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9)),
          name: movedEmployee.name,
          role: roleStr,
          matricula: movedEmployee.machine || ''
        });
        return newSupport;
      });
    } else {
      setDepartmentsData(prev => {
        const newDepts = [...prev];
        const targetDeptIndex = newDepts.findIndex(d => d.id === targetDeptId);
        if (targetDeptIndex === -1) return prev;
        
        const cleanedEmp: Employee = {
          id: movedEmployee.id,
          name: movedEmployee.name,
          line: movedEmployee.line,
          machine: movedEmployee.machine,
          error: movedEmployee.error
        };
        
        const targetData = [...newDepts[targetDeptIndex].data];
        targetData.push(cleanedEmp);
        newDepts[targetDeptIndex] = { ...newDepts[targetDeptIndex], data: targetData, count: targetData.length };
        return newDepts;
      });
    }
  }, [specialShiftData]);

  const handleUpdateAnnotationLeft = useCallback((groupIndex: number, itemIndex: number, field: keyof AnnotationItem, value: string) => {
    setAnnotationsLeft(prev => {
      const newGroups = [...prev];
      const newItems = [...newGroups[groupIndex].items];
      newItems[itemIndex] = { ...newItems[itemIndex], [field]: value };
      newGroups[groupIndex] = { ...newGroups[groupIndex], items: newItems };
      return newGroups;
    });
  }, []);

  const handleUpdateAnnotationRight = useCallback((groupIndex: number, itemIndex: number, field: keyof AnnotationItem, value: string) => {
    setAnnotationsRight(prev => {
      const newGroups = [...prev];
      const newItems = [...newGroups[groupIndex].items];
      newItems[itemIndex] = { ...newItems[itemIndex], [field]: value };
      newGroups[groupIndex] = { ...newGroups[groupIndex], items: newItems };
      return newGroups;
    });
  }, []);


  // --- Viewport & Scale Refs (Painel DSS Pattern) ---
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const scalableContainerRef = useRef<HTMLDivElement>(null);
  const scaleStateRef = useRef({ currentScale: 1 });
  const scaleCompensationModifier: Modifier = useCallback(({ transform }) => ({
    ...transform,
    x: transform.x / scaleStateRef.current.currentScale,
    y: transform.y / scaleStateRef.current.currentScale,
  }), []);
  const dragScrollRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0,
    moved: false
  });

  // --- Scale Function (Painel DSS) ---
  const setScale = useCallback((newScale: number, scrollX?: number, scrollY?: number) => {
    const viewport = viewportRef.current;
    const scalableContainer = scalableContainerRef.current;
    const contentWrapper = contentWrapperRef.current;
    if (!viewport || !scalableContainer || !contentWrapper) return;

    let minScale = 0.2;
    if (scalableContainer.offsetWidth > 0) {
      minScale = Math.min(1.0, window.innerWidth / scalableContainer.offsetWidth);
    }

    const finalScale = Math.max(minScale, Math.min(newScale, 2.0));
    scaleStateRef.current.currentScale = finalScale;

    scalableContainer.style.transform = `scale(${finalScale})`;

    const originalWidth = scalableContainer.offsetWidth;
    const originalHeight = scalableContainer.offsetHeight;

    contentWrapper.style.width = `${originalWidth * finalScale}px`;
    contentWrapper.style.height = `${originalHeight * finalScale}px`;

    if (scrollX !== undefined) viewport.scrollLeft = scrollX;
    if (scrollY !== undefined) viewport.scrollTop = scrollY;
  }, []);

  // --- Initialize Scale (Painel DSS) ---
  const initializeScale = useCallback(() => {
    const viewport = viewportRef.current;
    const scalableContainer = scalableContainerRef.current;
    if (!viewport || !scalableContainer) return;

    const isMobileView = window.innerWidth < 1024;

    if (isMobileView) {
      const oneColumnScale = viewport.clientWidth / 920;
      const finalScale = Math.min(Math.max(oneColumnScale, 0.3), 0.85);
      setScale(finalScale, 0, 0);
    } else {
      // Escala fixa otimizada de 0.92 para o enquadramento perfeito das 3 colunas principais (Recepção, Classificação, Formação)
      setScale(0.92, 0, 0);
    }
  }, [setScale]);

  // --- Gesture & Event Handlers (Painel DSS) ---
  useEffect(() => {
    const viewport = viewportRef.current;
    const scalableContainer = scalableContainerRef.current;
    if (!viewport || !scalableContainer) return;

    initializeScale();
    const initTimer = setTimeout(initializeScale, 50);

    let initialDistance = 0;
    let initialScaleValue = 1;
    let scrollStart = { x: 0, y: 0 };
    let touchCenter = { x: 0, y: 0 };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        initialDistance = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        initialScaleValue = scaleStateRef.current.currentScale;
        scrollStart = { x: viewport.scrollLeft, y: viewport.scrollTop };
        touchCenter = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2
        };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const currentDistance = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        const scaleRatio = currentDistance / initialDistance;
        let newScale = initialScaleValue * scaleRatio;

        let minScale = 0.2;
        if (scalableContainer.offsetWidth > 0) {
          minScale = Math.min(1.0, window.innerWidth / scalableContainer.offsetWidth);
        }

        if (newScale < minScale) {
          newScale = minScale;
          if (scaleStateRef.current.currentScale === minScale) return;
        }

        const originX = touchCenter.x - viewport.getBoundingClientRect().left;
        const originY = touchCenter.y - viewport.getBoundingClientRect().top;

        const contentOriginX = (scrollStart.x + originX) / initialScaleValue;
        const contentOriginY = (scrollStart.y + originY) / initialScaleValue;

        const newScrollX = (contentOriginX * newScale) - originX;
        const newScrollY = (contentOriginY * newScale) - originY;

        setScale(newScale, newScrollX, newScrollY);
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const zoomIntensity = 0.002;
        const delta = -e.deltaY * zoomIntensity;
        let newScale = scaleStateRef.current.currentScale + delta * scaleStateRef.current.currentScale;

        let minScale = 0.2;
        if (scalableContainer.offsetWidth > 0) {
          minScale = Math.min(1.0, window.innerWidth / scalableContainer.offsetWidth);
        }

        if (newScale < minScale) {
          newScale = minScale;
          if (scaleStateRef.current.currentScale === minScale) return;
        }

        const originX = e.clientX - viewport.getBoundingClientRect().left;
        const originY = e.clientY - viewport.getBoundingClientRect().top;

        const contentOriginX = (viewport.scrollLeft + originX) / scaleStateRef.current.currentScale;
        const contentOriginY = (viewport.scrollTop + originY) / scaleStateRef.current.currentScale;

        const newScrollX = (contentOriginX * newScale) - originX;
        const newScrollY = (contentOriginY * newScale) - originY;

        setScale(newScale, newScrollX, newScrollY);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button, input, select, textarea, a, [role="button"], .employee-row-card')) return;

      dragScrollRef.current.isDragging = true;
      dragScrollRef.current.moved = false;
      dragScrollRef.current.startX = e.pageX - viewport.offsetLeft;
      dragScrollRef.current.startY = e.pageY - viewport.offsetTop;
      dragScrollRef.current.scrollLeft = viewport.scrollLeft;
      dragScrollRef.current.scrollTop = viewport.scrollTop;

      viewport.style.cursor = 'grabbing';
      viewport.style.userSelect = 'none';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragScrollRef.current.isDragging) return;
      e.preventDefault();
      const x = e.pageX - viewport.offsetLeft;
      const y = e.pageY - viewport.offsetTop;
      const walkX = (x - dragScrollRef.current.startX);
      const walkY = (y - dragScrollRef.current.startY);

      if (Math.abs(walkX) > 5 || Math.abs(walkY) > 5) {
        dragScrollRef.current.moved = true;
      }

      viewport.scrollLeft = dragScrollRef.current.scrollLeft - walkX;
      viewport.scrollTop = dragScrollRef.current.scrollTop - walkY;
    };

    const handleMouseUp = () => {
      if (!dragScrollRef.current.isDragging) return;
      dragScrollRef.current.isDragging = false;
      viewport.style.cursor = 'grab';
      viewport.style.removeProperty('user-select');
    };

    let lastWidth = window.innerWidth;
    const handleResize = () => {
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;
      if (window.innerWidth !== lastWidth) {
        lastWidth = window.innerWidth;
        setScale(scaleStateRef.current.currentScale);
        initializeScale();
      }
    };

    window.addEventListener('load', initializeScale);
    window.addEventListener('resize', handleResize);
    viewport.addEventListener('wheel', handleWheel, { passive: false });
    viewport.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    viewport.style.cursor = 'grab';

    return () => {
      clearTimeout(initTimer);
      window.removeEventListener('load', initializeScale);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (viewport) {
        viewport.removeEventListener('wheel', handleWheel);
        viewport.removeEventListener('mousedown', handleMouseDown);
      }
    };
  }, [initializeScale, setScale]);

  const handleUpdateSupportRole = useCallback((groupIndex: number, empIndex: number, newRole: string) => {
    setSupportRolesData(prev => {
      const newGroups = [...prev];
      const newGroup = [...newGroups[groupIndex]];
      newGroup[empIndex] = { ...newGroup[empIndex], role: newRole };
      newGroups[groupIndex] = newGroup;
      return newGroups;
    });
  }, []);

  const handleUpdateSupportName = useCallback((groupIndex: number, empIndex: number, newName: string) => {
    setSupportRolesData(prev => {
      const newGroups = [...prev];
      const newGroup = [...newGroups[groupIndex]];
      newGroup[empIndex] = { ...newGroup[empIndex], name: newName };
      newGroups[groupIndex] = newGroup;
      return newGroups;
    });
  }, []);

  const handleUpdateSupportMatricula = useCallback((groupIndex: number, empIndex: number, newMatricula: string) => {
    setSupportRolesData(prev => {
      const newGroups = [...prev];
      const newGroup = [...newGroups[groupIndex]];
      newGroup[empIndex] = { ...newGroup[empIndex], matricula: newMatricula };
      newGroups[groupIndex] = newGroup;
      return newGroups;
    });
  }, []);

  const handleDeleteSupport = useCallback((groupIndex: number, empIndex: number) => {
    setSupportRolesData(prev => {
      const newSupport = prev.map(g => [...g]);
      newSupport[groupIndex].splice(empIndex, 1);
      return newSupport;
    });
  }, []);

  const handleMoveSupport = useCallback((sourceGroupIndex: number, targetGroupIndex: number, sourceEmpIndex: number) => {
    setSupportRolesData(prev => {
      const newGroups = [...prev];
      const sourceGroup = [...newGroups[sourceGroupIndex]];
      const targetGroup = [...newGroups[targetGroupIndex]];
      const [movedEmployee] = sourceGroup.splice(sourceEmpIndex, 1);
      targetGroup.push(movedEmployee);
      newGroups[sourceGroupIndex] = sourceGroup;
      newGroups[targetGroupIndex] = targetGroup;
      return newGroups;
    });
  }, []);

  const handleMove = useCallback((sourceDeptId: string, targetDeptId: string, sourceEmpIndex: number) => {
    setDepartmentsData(prev => {
      const newDepts = [...prev];
      const sourceDeptIndex = newDepts.findIndex(d => d.id === sourceDeptId);
      const targetDeptIndex = newDepts.findIndex(d => d.id === targetDeptId);

      if (sourceDeptIndex === targetDeptIndex) return prev;

      const sourceData = [...newDepts[sourceDeptIndex].data];
      const targetData = [...newDepts[targetDeptIndex].data];

      const [movedEmployee] = sourceData.splice(sourceEmpIndex, 1);
      targetData.push(movedEmployee);

      newDepts[sourceDeptIndex] = { ...newDepts[sourceDeptIndex], data: sourceData, count: sourceData.length };
      newDepts[targetDeptIndex] = { ...newDepts[targetDeptIndex], data: targetData, count: targetData.length };

      return newDepts;
    });
  }, []);

  const handleUpdateEmployeeField = useCallback((deptId: string, empIndex: number, field: keyof Employee, value: string) => {
    setDepartmentsData(prev => {
      const newDepts = [...prev];
      const deptIndex = newDepts.findIndex(d => d.id === deptId);
      if (deptIndex === -1) return prev;
      
      const newEmployees = [...newDepts[deptIndex].data];
      newEmployees[empIndex] = { ...newEmployees[empIndex], [field]: value };
      newDepts[deptIndex] = { ...newDepts[deptIndex], data: newEmployees };
      
      return newDepts;
    });
  }, []);

  const handleDelete = useCallback((deptId: string, empIndex: number) => {
    setDepartmentsData(prev => {
      const newDepts = [...prev];
      const deptIndex = newDepts.findIndex(d => d.id === deptId);
      const newData = [...newDepts[deptIndex].data];
      newData.splice(empIndex, 1);
      newDepts[deptIndex] = { ...newDepts[deptIndex], data: newData, count: newData.length };
      return newDepts;
    });
  }, []);

  const handleMarkEmployeeAbsent = (
    deptId: string,
    empIndex: number,
    absenceType: StatusType
  ) => {
    const dept = departmentsData.find(d => d.id === deptId);
    if (!dept) return;
    const emp = dept.data[empIndex];
    if (!emp) return;
    const empName = emp.name;
    const empMatricula = emp.machine || ''; // No modelo atual, machine guarda a Matrícula
    
    if (!empName || !empName.trim()) return;

    // 1. Remover o colaborador do departamento
    setDepartmentsData(prev => {
      const newDepts = [...prev];
      const idx = newDepts.findIndex(d => d.id === deptId);
      if (idx === -1) return prev;
      const newData = [...newDepts[idx].data];
      newData.splice(empIndex, 1);
      newDepts[idx] = { ...newDepts[idx], data: newData, count: newData.length };
      return newDepts;
    });

    // 2. Direcionar para a tabela de anotações adequada
    let targetLeftGroupIndex = -1;
    let targetRightGroupIndex = -1;

    if (absenceType === 'FÉRIAS') {
      targetLeftGroupIndex = 1; // "AUSENTES/FORA/FÉRIAS"
    } else if (absenceType === 'FORA') {
      targetLeftGroupIndex = 1; // "AUSENTES/FORA/FÉRIAS"
    } else if (absenceType === 'ATM') {
      targetLeftGroupIndex = 0; // "FÉRIAS/ATM/TE/TREIN./REVEZA"
    } else if (absenceType === 'RESTRIÇÃO') {
      targetRightGroupIndex = 1; // "TREINAMENTO / FÉRIAS/ ATM / TE"
    } else if (absenceType === 'INSS') {
      targetRightGroupIndex = 2; // "FÉRIAS/IN SP/LICENÇA"
    }

    if (targetLeftGroupIndex !== -1) {
      setAnnotationsLeft(prev => {
        const newGroups = [...prev];
        const group = newGroups[targetLeftGroupIndex];
        const items = [...group.items];
        
        // Achar o primeiro slot vazio (name sem texto)
        const emptyIdx = items.findIndex(item => !item.name || !item.name.trim());
        if (emptyIdx !== -1) {
          items[emptyIdx] = { name: empName, status: absenceType, matricula: empMatricula, originalDeptId: deptId };
        } else {
          // Se não houver slot vazio, faz push
          items.push({ name: empName, status: absenceType, matricula: empMatricula, originalDeptId: deptId });
        }
        newGroups[targetLeftGroupIndex] = { ...group, items };
        return newGroups;
      });
    } else if (targetRightGroupIndex !== -1) {
      setAnnotationsRight(prev => {
        const newGroups = [...prev];
        const group = newGroups[targetRightGroupIndex];
        const items = [...group.items];
        
        const emptyIdx = items.findIndex(item => !item.name || !item.name.trim());
        if (emptyIdx !== -1) {
          items[emptyIdx] = { name: empName, status: absenceType, matricula: empMatricula, originalDeptId: deptId };
        } else {
          items.push({ name: empName, status: absenceType, matricula: empMatricula, originalDeptId: deptId });
        }
        newGroups[targetRightGroupIndex] = { ...group, items };
        return newGroups;
      });
    }
  };

  const handleMarkSupportAbsent = (
    groupIndex: number,
    empIndex: number,
    absenceType: StatusType
  ) => {
    const group = supportRolesData[groupIndex];
    if (!group) return;
    const emp = group[empIndex];
    if (!emp) return;
    const empName = emp.name;
    const empMatricula = emp.matricula || '';

    if (!empName || !empName.trim()) return;

    // 1. Remover do grupo de Apoio
    setSupportRolesData(prev => {
      const newSupport = prev.map(g => [...g]);
      newSupport[groupIndex].splice(empIndex, 1);
      return newSupport;
    });

    // 2. Direcionar para a tabela de anotações adequada, salvando o grupo original
    let targetLeftGroupIndex = -1;
    let targetRightGroupIndex = -1;

    if (absenceType === 'FÉRIAS') {
      targetLeftGroupIndex = 1; // "AUSENTES/FORA/FÉRIAS"
    } else if (absenceType === 'FORA') {
      targetLeftGroupIndex = 1; // "AUSENTES/FORA/FÉRIAS"
    } else if (absenceType === 'ATM') {
      targetLeftGroupIndex = 0; // "FÉRIAS/ATM/TE/TREIN./REVEZA"
    } else if (absenceType === 'RESTRIÇÃO') {
      targetRightGroupIndex = 1; // "TREINAMENTO / FÉRIAS/ ATM / TE"
    } else if (absenceType === 'INSS') {
      targetRightGroupIndex = 2; // "FÉRIAS/IN SP/LICENÇA"
    }

    const originalSupportGroupIndex = groupIndex;
    const originalSupportRole = emp.role;

    if (targetLeftGroupIndex !== -1) {
      setAnnotationsLeft(prev => {
        const newGroups = [...prev];
        const g = newGroups[targetLeftGroupIndex];
        const items = [...g.items];
        
        const emptyIdx = items.findIndex(item => !item.name || !item.name.trim());
        const newItem = { 
          name: empName, 
          status: absenceType, 
          matricula: empMatricula, 
          originalDeptId: undefined,
          originalSupportGroupIndex,
          originalSupportRole
        };

        if (emptyIdx !== -1) {
          items[emptyIdx] = newItem;
        } else {
          items.push(newItem);
        }
        newGroups[targetLeftGroupIndex] = { ...g, items };
        return newGroups;
      });
    } else if (targetRightGroupIndex !== -1) {
      setAnnotationsRight(prev => {
        const newGroups = [...prev];
        const g = newGroups[targetRightGroupIndex];
        const items = [...g.items];
        
        const emptyIdx = items.findIndex(item => !item.name || !item.name.trim());
        const newItem = { 
          name: empName, 
          status: absenceType, 
          matricula: empMatricula, 
          originalDeptId: undefined,
          originalSupportGroupIndex,
          originalSupportRole
        };

        if (emptyIdx !== -1) {
          items[emptyIdx] = newItem;
        } else {
          items.push(newItem);
        }
        newGroups[targetRightGroupIndex] = { ...g, items };
        return newGroups;
      });
    }
  };

  const handleReturnFromAnnotation = useCallback((isLeft: boolean, groupIdx: number, itemIdx: number) => {
    const groups = isLeft ? annotationsLeft : annotationsRight;
    const item = groups[groupIdx].items[itemIdx];
    if (!item || !item.name.trim() || (!item.originalDeptId && (item as any).originalSupportGroupIndex === undefined)) return;

    if ((item as any).originalSupportGroupIndex !== undefined) {
      const targetGroupIdx = (item as any).originalSupportGroupIndex;
      const roleStr = (item as any).originalSupportRole || 'VIRADOR';
      setSupportRolesData(prev => {
        const newSupport = prev.map(group => [...group]);
        newSupport[targetGroupIdx].push({
          id: item.id || ('emp-supp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9)),
          name: item.name,
          role: roleStr,
          matricula: item.matricula || ''
        });
        return newSupport;
      });
    } else if (item.originalDeptId) {
      // 1. Adicionar ao departamento original
      setDepartmentsData(prev => {
        const newDepts = [...prev];
        const targetDeptIdx = newDepts.findIndex(d => d.id === item.originalDeptId);
        if (targetDeptIdx === -1) return prev;

        const cleanedEmp: Employee = {
          id: item.id || ('emp-' + Math.floor(Math.random() * 100000)),
          name: item.name,
          line: '',
          machine: item.matricula || '',
          error: false
        };

        const targetData = [...newDepts[targetDeptIdx].data];
        targetData.push(cleanedEmp);
        newDepts[targetDeptIdx] = { ...newDepts[targetDeptIdx], data: targetData, count: targetData.length };
        return newDepts;
      });
    }

    // 2. Limpar/remover o slot de anotação (Opção 1: remove da grade completamente)
    if (isLeft) {
      setAnnotationsLeft(prev => {
        const newGroups = [...prev];
        const newItems = newGroups[groupIdx].items.filter((_, idx) => idx !== itemIdx);
        newGroups[groupIdx] = { ...newGroups[groupIdx], items: newItems };
        return newGroups;
      });
    } else {
      setAnnotationsRight(prev => {
        const newGroups = [...prev];
        const newItems = newGroups[groupIdx].items.filter((_, idx) => idx !== itemIdx);
        newGroups[groupIdx] = { ...newGroups[groupIdx], items: newItems };
        return newGroups;
      });
    }
  }, [annotationsLeft, annotationsRight]);

  const handleReturnFromAnnotationLeft = useCallback((groupIdx: number, itemIdx: number) => {
    handleReturnFromAnnotation(true, groupIdx, itemIdx);
  }, [handleReturnFromAnnotation]);

  const handleReturnFromAnnotationRight = useCallback((groupIdx: number, itemIdx: number) => {
    handleReturnFromAnnotation(false, groupIdx, itemIdx);
  }, [handleReturnFromAnnotation]);

  const maxCount = Math.max(...departmentsData.map(d => d.data.length), 1);

  // --- Dynamic Statistical Calculations ---
  const totalMaquinistas = departmentsData.reduce((acc, dept) => acc + dept.data.filter(emp => emp.name.trim() !== '').length, 0);
  const totalApoio = supportRolesData.reduce((acc, group) => acc + group.filter(emp => emp.name.trim() !== '').length, 0);
  const totalTurno6H = specialShiftData.filter(emp => emp.name.trim() !== '').length;
  const totalFuncionarios = totalMaquinistas + totalApoio + totalTurno6H;

  const todasAnotacoes = [
    ...annotationsLeft.flatMap(g => g.items),
    ...annotationsRight.flatMap(g => g.items)
  ].filter(item => item.name && item.name.trim() !== '');

  const totalFerias = todasAnotacoes.filter(item => item.status.toUpperCase().includes('FÉRIA') || item.status.toUpperCase().includes('FERIA')).length;
  const totalFora = todasAnotacoes.filter(item => item.status.toUpperCase() === 'FORA').length;
  
  const totalATM = todasAnotacoes.filter(item => 
    item.status.toUpperCase().includes('ATM') || 
    item.status.toUpperCase().includes('ATESTADO') || 
    item.status.toUpperCase().includes('MÉDICO') || 
    item.status.toUpperCase().includes('MEDICO')
  ).length;

  const totalRestricao = todasAnotacoes.filter(item => 
    item.status.toUpperCase().includes('RESTRI') || 
    item.status.toUpperCase().includes('RESTRICAO')
  ).length;

  const totalEstagio = todasAnotacoes.filter(item => 
    item.status.toUpperCase().includes('ESTÁGIO') || 
    item.status.toUpperCase().includes('ESTAGIO')
  ).length;

  const totalINSS = todasAnotacoes.filter(item => item.status.toUpperCase() === 'INSS').length;

  return (
    <>
    <div className={`bg-[#111217] text-[#f7fafc] font-sans selection:bg-blue-500/30 overflow-hidden relative${!isDarkMode ? ' light-mode' : ''}`}>
      {/* Viewport - Scroll Container (Painel DSS Pattern) */}
      <div ref={viewportRef} className={`viewport fixed inset-0${isDarkMode ? ' bg-[#111217]' : ' bg-[#eef2f7]'}`}>
        {/* Content Wrapper - Carries the scaled dimensions for scroll area */}
        <div ref={contentWrapperRef} className="origin-top-left">
          {/* Scalable Container - The actual content that gets scaled */}
          <div ref={scalableContainerRef} className="scalable-container w-fit origin-top-left p-8 bg-[#111217]">

            {/* Header Card - Painel DSS Style */}
            <div className="bg-[#1E2029] border border-white/5 rounded-3xl py-9 px-6 md:py-16 md:px-10 mb-8 shadow-lg flex justify-between items-center w-full transition-colors">
              <div className="flex items-center gap-6">
                <div className="h-20 w-20 md:h-24 md:w-24 rounded-2xl bg-gradient-to-br from-[#00A8FF] to-[#0055FF] flex items-center justify-center shadow-lg shadow-[#0055FF]/30 shrink-0">
                  <Shield className="w-10 h-10 md:w-12 md:h-12 text-white drop-shadow-md" strokeWidth={2.5} />
                </div>
                <div className="flex flex-col gap-1">
                  <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                    Distribuição de Equipes
                  </h1>
                  <p className="text-lg md:text-xl font-medium text-[#a0aec0]">
                    Controle Operacional - Gestão e monitoramento em tempo real
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-11">
                <div className="flex items-center gap-3">
                  {/* Botão TROCAR TURMA */}
                  <button
                    id="change-turma-btn"
                    onClick={() => {}}
                    className="h-[90px] w-[190px] flex items-center justify-center gap-2 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-green-600 rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-emerald-300 cursor-pointer"
                    aria-label="Trocar Turma"
                    title="Voltar para seleção de turma"
                  >
                    <ExchangeIcon className="w-7 h-7" />
                    <span className="tracking-wide">TROCAR TURMA</span>
                  </button>

                  {/* Botão TUTORIAL */}
                  <button
                    id="tutorial-btn"
                    onClick={() => {}}
                    className="h-[90px] w-[190px] flex items-center justify-center gap-2 text-sm font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-cyan-300 cursor-pointer"
                    aria-label="Iniciar Tutorial"
                    title="Como usar o sistema"
                  >
                    <HelpIcon className="w-7 h-7" />
                    <span className="tracking-wide">TUTORIAL</span>
                  </button>

                {/* BB-8 Dark/Light Mode Toggle */}
                  <label className="bb8-toggle" htmlFor="darkModeToggle" aria-label="Alternar modo escuro">
                    <input
                      className="bb8-toggle__checkbox"
                      type="checkbox"
                      id="darkModeToggle"
                      checked={isDarkMode}
                      onChange={handleToggleDarkMode}
                    />
                    <div className="bb8-toggle__container">
                      <div className="bb8-toggle__scenery">
                        <div className="bb8-toggle__star"></div>
                        <div className="bb8-toggle__star"></div>
                        <div className="bb8-toggle__star"></div>
                        <div className="bb8-toggle__star"></div>
                        <div className="bb8-toggle__star"></div>
                        <div className="bb8-toggle__star"></div>
                        <div className="bb8-toggle__star"></div>
                        <div className="tatto-1" aria-hidden="true"></div>
                        <div className="tatto-2" aria-hidden="true"></div>
                        <div className="gomrassen"></div>
                        <div className="hermes"></div>
                        <div className="chenini"></div>
                        <div className="bb8-toggle__cloud"></div>
                        <div className="bb8-toggle__cloud"></div>
                        <div className="bb8-toggle__cloud"></div>
                      </div>
                      <div className="bb8">
                        <div className="bb8__head-container">
                          <div className="bb8__antenna"></div>
                          <div className="bb8__antenna"></div>
                          <div className="bb8__head"></div>
                        </div>
                        <div className="bb8__body"></div>
                      </div>
                      <div className="artificial__hidden" aria-hidden="true">
                        <div className="bb8__shadow"></div>
                      </div>
                    </div>
                  </label>

                  {/* Admin Button - mesmo formato do BB-8 */}
                  <button
                    id="admin-access-btn"
                    onClick={() => setIsAdminModalOpen(true)}
                    className="relative flex items-center justify-center gap-3 bg-gradient-to-r from-[#FF9F0A] to-[#FF6B00] shadow-lg shadow-[#FF6B00]/30 hover:shadow-[#FF6B00]/50 hover:-translate-y-0.5 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-orange-300/50"
                    style={{
                      width: '190px',
                      height: '90px',
                      borderRadius: '99em',
                      color: '#ffffff',
                    }}
                    aria-label="Acesso Administrativo"
                  >
                    <svg className="w-7 h-7 shrink-0" style={{ color: '#ffffff' }} viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                    </svg>
                    <span style={{ color: '#ffffff' }} className="text-sm font-extrabold uppercase tracking-wider leading-tight text-center">
                      ACESSO ADM
                    </span>
                  </button>
                </div>

                {/* Stats Container (Painel DSS Style) */}
                <div className="flex gap-4 pr-[10px]">
                  <StatCard label="Ativos" value={totalFuncionarios} colorClass="text-[#30D158]" bgClass="bg-[#30D158]/10" />
                  <StatCard label="Férias" value={totalFerias} colorClass="text-[#FF9F0A]" bgClass="bg-[#FF9F0A]/10" />
                  <StatCard label="Fora" value={totalFora} colorClass="text-[#FF453A]" bgClass="bg-[#FF453A]/10" />
                  <StatCard label="ATM" value={totalATM} colorClass="text-[#FFD60A]" bgClass="bg-[#FFD60A]/10" />
                  <StatCard label="Restrição" value={totalRestricao} colorClass="text-[#BF5AF2]" bgClass="bg-[#BF5AF2]/10" />
                  <StatCard label="Estágio" value={totalEstagio} colorClass="text-[#30D158]" bgClass="bg-[#30D158]/10" />
                  <StatCard label="INSS" value={totalINSS} colorClass="text-[#FF453A]" bgClass="bg-[#FF453A]/10" />
                </div>
              </div>
            </div>

            {/* Special Shift Section */}
            {is6HActive && (
              <div className="special-shift-card bg-[#1E2029] border border-[#BF5AF2]/20 rounded-3xl p-6 mb-8 shadow-lg w-max relative overflow-hidden animate-[fadeInScale_0.25s_ease-out_forwards]">
                <div className="absolute top-0 left-0 w-2 h-full bg-[#BF5AF2]" />
                <div className="flex items-center gap-4 mb-5 ml-2">
                  <div className="p-3 rounded-xl bg-[#BF5AF2]/15 text-[#BF5AF2]">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-wide uppercase">TURNO 6H</h2>
                  </div>
                </div>
                <div className="flex gap-4 pb-2 ml-2 pr-2">
                  {specialShiftData.map((emp, idx) => (
                    <SpecialShiftSlot 
                      key={emp.id} 
                      emp={emp} 
                      index={idx} 
                      allDepartments={departmentsData}
                      onUpdate={handleUpdateSpecialShiftEmployee}
                      onTransfer={handleTransferFromSpecialShift}
                      activeEdit={activeEdits[emp.id]}
                      onStartEdit={handleStartEdit}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Main Content Area */}
            <DndContext
              sensors={sensors}
              collisionDetection={pointerWithin}
              modifiers={[scaleCompensationModifier]}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
              <div className="space-y-8">
                {/* Main Departments Grid - Always 3 columns + Annotations */}
                <div className="flex gap-6 w-max">
                  {departmentsData.map((dept) => (
                    <div key={dept.id} className="w-[500px] shrink-0">
                      <DepartmentCard 
                        department={dept} 
                        allDepartments={departmentsData}
                        maxCount={maxCount}
                        onMove={handleMove}
                        onUpdateEmployee={handleUpdateEmployeeField}
                        onDelete={handleDelete}
                        onTransferToSpecial={handleTransferToSpecialShift}
                        onMarkAbsent={handleMarkEmployeeAbsent}
                        isDarkMode={isDarkMode}
                        is6HActive={is6HActive}
                        activeEdits={activeEdits}
                        onStartEdit={handleStartEdit}
                        isDragActive={activeId !== null}
                      />
                    </div>
                  ))}

                  {/* NOVO ESPAÇO: ANOTAÇÕES MINÉRIO */}
                  <div className="w-[680px] shrink-0">
                    <AnnotationsBoard 
                      leftGroups={annotationsLeft} 
                      rightGroups={annotationsRight} 
                      onUpdateLeft={handleUpdateAnnotationLeft}
                      onUpdateRight={handleUpdateAnnotationRight}
                      onReturnLeft={handleReturnFromAnnotationLeft}
                      onReturnRight={handleReturnFromAnnotationRight}
                    />
                  </div>
                </div>

                {/* Section Divider */}
                <div className="pt-8 pb-4 px-2 flex items-center space-x-3">
                  <Users className="text-[#a0aec0] w-6 h-6" />
                  <h2 className="text-2xl font-semibold text-white">Apoio (OOF)</h2>
                </div>

                {/* Support Roles Grid - Always 3 columns */}
                <div className="flex gap-6 w-max pb-[50vh]">
                  {supportRolesData.map((group, index) => (
                    <div key={index} className="w-[600px] shrink-0">
                      <SupportCard 
                        roles={group} 
                        groupIndex={index} 
                        isDarkMode={isDarkMode}
                        is6HActive={is6HActive}
                        onUpdateRole={handleUpdateSupportRole} 
                        onUpdateName={handleUpdateSupportName} 
                        onUpdateMatricula={handleUpdateSupportMatricula}
                        onMoveSupport={handleMoveSupport}
                        onMoveToSpecial={handleTransferSupportToSpecialShift}
                        onMarkAbsent={handleMarkSupportAbsent}
                        onDeleteSupport={handleDeleteSupport}
                        isDragActive={activeId !== null}
                      />
                    </div>
                  ))}
                </div>
              </div>


            </DndContext>

          </div>
        </div>
      </div>
    </div>

    {/* Admin Modal */}
    <AdminModal
      isOpen={isAdminModalOpen}
      onClose={() => setIsAdminModalOpen(false)}
      isAdmin={isAdmin}
      onLogin={handleAdminLogin}
      onLogout={handleAdminLogout}
      onLoginError={handleAdminLoginError}
      onClearAll={handleClearAll}
      onGenerateReport={handleGenerateReport}
      onAddUser={() => {
        setIsAddUserModalOpen(true);
        setIsAdminModalOpen(false);
      }}
      onReorganize={handleReorganize}
      onImportCollaborator={handleImportCollaborator}
      is6HActive={is6HActive}
      onToggle6H={handleToggle6H}
      onToggleAutomation={handleToggleAutomation}
      isAutomationPaused={isAutomationPaused}
      onShowHistory={handleShowHistory}
      onShowHelp={handleShowHelp}
      onShowTutorial={handleShowTutorial}
      isDemoMode={isDemoMode}
      onToggleDemoMode={handleToggleDemoMode}
      isDarkMode={isDarkMode}
    />

    {/* Add User Modal */}
    <AddUserModal
      isOpen={isAddUserModalOpen}
      onClose={() => setIsAddUserModalOpen(false)}
      onAddUser={handleAddNewUser}
      isDarkMode={isDarkMode}
    />

    {/* Universal Toast */}
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, x: 80, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 80, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className={`fixed top-6 right-6 z-[99999] text-white font-bold px-7 py-4 rounded-[16px] shadow-2xl flex items-center justify-center text-center text-sm md:text-base max-w-[320px] select-none border border-white/10 ${
            toast.type === 'success' 
              ? 'bg-[#30D158]' 
              : toast.type === 'error' 
                ? 'bg-[#FF453A]' 
                : 'bg-[#5E5CE6]'
          }`}
          style={{
            boxShadow: toast.type === 'success' 
              ? '0 16px 36px rgba(48, 209, 88, 0.35)' 
              : toast.type === 'error' 
                ? '0 16px 36px rgba(255, 69, 58, 0.35)' 
                : '0 16px 36px rgba(94, 92, 230, 0.35)',
          }}
        >
          {toast.message}
        </motion.div>
      )}
    </AnimatePresence>

    {/* Login Success Toast */}
    <AnimatePresence>
      {showLoginToast && (
        <motion.div
          initial={{ opacity: 0, x: 80, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 80, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="fixed top-6 right-6 z-[99999] bg-[#30D158] text-white font-bold px-7 py-4 rounded-[16px] shadow-2xl flex items-center justify-center text-center text-sm md:text-base max-w-[280px] select-none border border-white/10"
          style={{
            boxShadow: '0 16px 36px rgba(48, 209, 88, 0.35)',
          }}
        >
          Login de administrador bem-sucedido!
        </motion.div>
      )}
    </AnimatePresence>

    {/* Login Error Toast */}
    <AnimatePresence>
      {showErrorToast && (
        <motion.div
          initial={{ opacity: 0, x: 80, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 80, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="fixed top-6 right-6 z-[99999] bg-[#FF453A] text-white font-bold px-7 py-4 rounded-[16px] shadow-2xl flex items-center justify-center text-center text-sm md:text-base max-w-[280px] select-none border border-white/10"
          style={{
            boxShadow: '0 16px 36px rgba(255, 69, 58, 0.35)',
          }}
        >
          Credenciais de administrador inválidas.
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}

// --- Components ---

const DepartmentCard = React.memo(({ 
  department, 
  allDepartments,
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
  isDragActive
}: { 
  department: Department;
  allDepartments: Department[];
  maxCount: number;
  onMove: (targetDeptId: string, empIndex: number) => void;
  onUpdateEmployee: (deptId: string, empIndex: number, field: keyof Employee, value: string) => void;
  onDelete: (deptId: string, empIndex: number) => void;
  onTransferToSpecial: (empIndex: number) => void;
  onMarkAbsent: (empIndex: number, absenceType: StatusType) => void;
  isDarkMode: boolean;
  is6HActive: boolean;
  activeEdits: Record<string, ActiveEdit>;
  onStartEdit: (empId: string) => void;
  isDragActive?: boolean;
}) => {
  const theme = getDeptTheme(department.id);
  const { setNodeRef } = useDroppable({
    id: department.id,
  });

  // Array de IDs memoizado para o SortableContext: evita criar nova 
  // referência de array a cada render (previne loop infinito no dnd-kit).
  const sortableItems = React.useMemo(() => department.data.map(e => e.id || e.name), [department.data]);

  return (
    <div className="dept-card-panel bg-[#1E2029] rounded-[24px] overflow-hidden flex flex-col shadow-lg border border-white/[0.02] min-h-full">
      {/* Cabeçalho do Setor */}
      <div className="px-6 py-5 border-b border-[#111217] flex items-center justify-between bg-[#15171E]">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center shadow-inner ${theme.bg} ${theme.color}`}>
            {React.cloneElement(theme.icon as React.ReactElement, { className: "w-6 h-6" })}
          </div>
          <h3 className="text-[22px] font-bold text-white tracking-tight uppercase">{department.title}</h3>
        </div>
        <div className={`flex items-center font-semibold text-[14px] px-4 py-2 rounded-full ${theme.color} ${theme.bg}`}>
          <CheckCircle2 className="w-4 h-4 mr-2" />
          {department.count} Colab.
        </div>
      </div>

      {/* Área Direita (Grade de Colaboradores) */}
      <div ref={setNodeRef} className="flex-1 p-5 pb-[150px] bg-[#0D0E12]/30 flex flex-col">
        <SortableContext id={department.id} items={sortableItems} strategy={verticalListSortingStrategy}>
        <div className="grid grid-cols-1 gap-4 flex-1">
          {department.data.map((emp, i) => (
            <EmployeeRow
              key={emp.id}
              emp={emp}
              index={i}
              department={department}
              allDepartments={allDepartments}
              onMove={onMove}
              onUpdateEmployee={onUpdateEmployee}
              onDelete={onDelete}
              onTransferToSpecial={onTransferToSpecial}
              onMarkAbsent={onMarkAbsent}
              isDarkMode={isDarkMode}
              is6HActive={is6HActive}
              activeEdit={activeEdits[emp.id]}
              onStartEdit={onStartEdit}
              isDragActive={isDragActive}
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
  if (prevProps.department !== nextProps.department) return false;
  if (prevProps.maxCount !== nextProps.maxCount) return false;
  if (prevProps.isDarkMode !== nextProps.isDarkMode) return false;
  if (prevProps.is6HActive !== nextProps.is6HActive) return false;
  if (prevProps.onMove !== nextProps.onMove) return false;
  if (prevProps.onUpdateEmployee !== nextProps.onUpdateEmployee) return false;
  if (prevProps.onDelete !== nextProps.onDelete) return false;
  if (prevProps.onTransferToSpecial !== nextProps.onTransferToSpecial) return false;
  if (prevProps.onMarkAbsent !== nextProps.onMarkAbsent) return false;
  if (prevProps.onStartEdit !== nextProps.onStartEdit) return false;
  
  const prevData = prevProps.department.data;
  const nextData = nextProps.department.data;
  
  if (prevData.length !== nextData.length) return false;
  
  for (let i = 0; i < prevData.length; i++) {
    const empId = prevData[i].id;
    if (prevProps.activeEdits[empId] !== nextProps.activeEdits[empId]) {
      return false;
    }
  }
  
  return true;
});

const EmployeeRow = React.memo(({
  emp,
  index,
  department,
  allDepartments,
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
  isGhost,
  isDragActive
}: {
  emp: Employee;
  index: number;
  department: Department;
  allDepartments: Department[];
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
  isGhost?: boolean;
  isDragActive?: boolean;
}) => {
  const [showLineDropdown, setShowLineDropdown] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [showTransferMenu, setShowTransferMenu] = useState(false);
  const [showAbsentMenu, setShowAbsentMenu] = useState(false);
  const theme = getDeptTheme(department.id);
  const otherDepts = allDepartments.filter(d => d.id !== department.id);

  // ID estável via prop: o pai (DepartmentCard) garante emp.id estável.
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

  const currentActiveEdit: ActiveEdit | undefined = isDragging
    ? {
        empId: emp.id,
        userName: 'Naylan (Você)',
        color: '#BF5AF2',
        timestamp: Date.now()
      }
    : activeEdit;

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    touchAction: 'none',
    ...(currentActiveEdit ? { outline: `2.5px solid ${currentActiveEdit.color}`, outlineOffset: '1.5px' } : {}),
    ...(isDragging ? { zIndex: 50, position: 'relative' } : {})
  };

  // Helper para borda lateral de destaque conforme o setor no modo claro/escuro
  const getBorderLeftClass = (deptId: string, hasError?: boolean) => {
    if (hasError) return 'border-l-4 border-l-[#FF3B30]';
    switch (deptId) {
      case 'recepcao': return 'border-l-4 border-l-[#0A84FF]';
      case 'classificacao': return 'border-l-4 border-l-[#FF9F0A]';
      case 'formacao': return 'border-l-4 border-l-[#30D158]';
      default: return 'border-l-4 border-l-[#5E5CE6]';
    }
  };

  // Helper para hover do botão de troca conforme o setor
  const getSwapHoverClass = (deptId: string) => {
    switch (deptId) {
      case 'recepcao': return 'hover:text-[#0A84FF] hover:bg-[#0A84FF]/10';
      case 'classificacao': return 'hover:text-[#FF9F0A] hover:bg-[#FF9F0A]/10';
      case 'formacao': return 'hover:text-[#30D158] hover:bg-[#30D158]/10';
      default: return 'hover:text-[#5E5CE6] hover:bg-[#5E5CE6]/10';
    }
  };

  const [avatarRect, setAvatarRect] = useState<DOMRect | null>(null);
  const [transferRect, setTransferRect] = useState<DOMRect | null>(null);
  const [lineRect, setLineRect] = useState<DOMRect | null>(null);
  const [absentRect, setAbsentRect] = useState<DOMRect | null>(null);

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
    onStartEdit?.(emp.id);
  }, [onStartEdit, emp.id]);

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      initial={{ scale: 0.98, opacity: 0.4 }}
      animate={{ 
        scale: 1, 
        opacity: (isDragging || isGhost) ? 0.30 : 1 
      }}
      transition={{ 
        type: 'spring', 
        stiffness: 400, 
        damping: 25 
      }}
      className={`employee-row-card relative flex flex-col min-h-[140px] justify-between rounded-[14px] ${isDragActive ? '' : 'transition-all duration-300'} dept-${department.id} ${
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
      {currentActiveEdit && !isDragOverlay && (
        <div className="absolute -top-3 right-2 bg-[#1E2029] border border-white/10 px-2 py-0.5 rounded-[6px] z-[100] shadow-lg flex items-center gap-1.5 animate-[fadeIn_0.2s_ease-out]">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: currentActiveEdit.color }} />
          <span className="text-[10px] text-white font-bold whitespace-nowrap">
            {currentActiveEdit.userName} editando...
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
                className={`font-bold text-[14px] tracking-wide uppercase truncate leading-none w-[180px] block input-emp-name ${emp.error ? 'text-red-400' : 'text-white'}`}
              >
                {emp.name}
              </span>
              <span className="text-[10px] text-[#A0A0A5] -mt-0.5 font-medium truncate span-emp-matricula">Matrícula: {emp.machine || 'N/A'}</span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="relative flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                const open = !showAbsentMenu;
                setShowAbsentMenu(open);
                setShowTransferMenu(false);
                setShowAvatarMenu(false);
                if (open) {
                  setAbsentRect(e.currentTarget.getBoundingClientRect());
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
                onClick={(e) => { e.stopPropagation(); handleTransferToSpecialLocal(); }}
                className="h-[34px] w-[70px] sm:w-[80px] flex items-center justify-center font-bold text-white bg-gradient-to-r from-[#FF9F0A] to-[#FF6B00] rounded-[8px] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 text-[10px] tracking-tight text-center leading-none whitespace-nowrap px-1"
              >
                TURNO 6H
              </button>
            )}
            <button 
              onClick={(e) => {
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
              className={`w-7 h-7 rounded-[6px] flex items-center justify-center shrink-0 transition-all outline-none btn-emp-swap ${
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
              value={emp.line}
              onFocus={(e) => {
                setShowLineDropdown(true);
                setLineRect(e.currentTarget.getBoundingClientRect());
                handleStartEditLocal();
              }}
              onBlur={() => {
                setTimeout(() => {
                  setShowLineDropdown(false);
                  setLineRect(null);
                }, 200);
              }}
              onChange={(e) => {
                handleUpdateEmployeeFieldLocal('line', e.target.value);
                setShowLineDropdown(true);
                setLineRect(e.currentTarget.getBoundingClientRect());
              }}
              className="h-[42px] px-2 rounded-[8px] text-[13px] font-bold w-[95px] sm:w-[105px] text-center uppercase placeholder-white/50 focus:outline-none bg-[#FF6B00] text-white shadow-sm border-none hover:bg-[#E66000] transition-all"
            />
            <span className="text-[9px] text-[#a0aec0] uppercase font-bold tracking-wider mt-1">Linha</span>
          </div>
          <div className="flex flex-col items-center">
            <input
              type="text"
              value={emp.machine}
              onFocus={handleStartEditLocal}
              onChange={(e) => handleUpdateEmployeeFieldLocal('machine', e.target.value)}
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
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'fixed',
              top: avatarRect.bottom + 10,
              left: avatarRect.left,
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

      {/* Portal: Menu Transferir */}
      {showTransferMenu && transferRect && (
        <PortalMenu>
          <div className="fixed inset-0 z-[999]" onClick={() => { setShowTransferMenu(false); setTransferRect(null); }} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'fixed',
              top: transferRect.bottom + 6,
              left: transferRect.right - 180,
              zIndex: 1000,
            }}
            className="w-[180px] bg-[#1E2029]/80 backdrop-blur-md border border-white/10 rounded-[12px] shadow-xl overflow-hidden flex flex-col py-1"
          >
            <div className="px-3 py-1 text-[10px] font-bold text-[#a0aec0] uppercase tracking-wider">Transferir para</div>
            {otherDepts.map(d => {
              const theme = getDeptTheme(d.id);
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
                    <div className={`p-1.5 rounded-[8px] ${theme.bg} ${theme.color}`}>
                      {React.cloneElement(theme.icon, { className: 'w-3.5 h-3.5 shrink-0' })}
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
        </PortalMenu>
      )}

      {/* Portal: Dropdown de Linhas */}
      <AnimatePresence>
        {showLineDropdown && lineRect && PREDEFINED_LINES.filter(l => l.toLowerCase().includes((emp.line || '').toLowerCase())).length > 0 && (
          <PortalMenu>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'fixed',
                top: lineRect.bottom + 4,
                left: lineRect.left + lineRect.width / 2 - 65,
                zIndex: 1000,
              }}
              className="w-[130px] max-h-[150px] overflow-y-auto bg-[#1E2029]/80 backdrop-blur-md border border-white/10 rounded-[12px] shadow-2xl flex flex-col p-1.5 gap-1 hide-scrollbar"
            >
              {PREDEFINED_LINES.filter(l => l.toLowerCase().includes((emp.line || '').toLowerCase())).map((linha) => (
                <button
                  key={linha}
                  onMouseDown={(e) => {
                    e.preventDefault(); 
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
                transform: 'translateX(-50%)',
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
                  { type: 'INSS' }
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
});

const SupportCard = React.memo(({ 
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
  isDragActive
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

  // Array de IDs memoizado para o SortableContext
  const sortableItems = React.useMemo(() => roles.map(e => e.id || e.name), [roles]);

  return (
    <div className="bg-[#1E2029] rounded-[24px] overflow-hidden flex flex-col border border-white/[0.02] relative min-h-full">
      
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
      <div ref={setNodeRef} className="p-3 pb-[150px] space-y-2 flex-1 min-h-[150px] flex flex-col">
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
          />
        ))}
        </SortableContext>
      </div>
    </div>
  );
});

const SupportRoleRow = React.memo(({ 
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
  isGhost,
  isDragActive
}: { 
  emp: SupportRole; 
  index: number;
  groupIndex: number;
  isDarkMode: boolean;
  is6HActive: boolean;
  isDragOverlay?: boolean;
  onUpdateRole: (groupIndex: number, empIndex: number, newRole: string) => void;
  onUpdateName: (groupIndex: number, empIndex: number, newName: string) => void;
  onUpdateMatricula: (groupIndex: number, empIndex: number, newMatricula: string) => void;
  onMove: (sourceGroupIndex: number, targetGroupIndex: number, empIndex: number) => void;
  onMoveToSpecial?: (groupIndex: number, empIndex: number) => void;
  onMarkAbsent: (groupIndex: number, empIndex: number, absenceType: StatusType) => void;
  onDelete: (groupIndex: number, empIndex: number) => void;
  isGhost?: boolean;
  isDragActive?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [showAbsentMenu, setShowAbsentMenu] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);

  // ID estável via prop: o pai (SupportCard) garante emp.id estável.
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
      type: 'Support',
      employee: emp,
      groupIndex,
    },
    disabled: isDragOverlay,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    touchAction: 'none',
    ...(isDragging ? { zIndex: 50, position: 'relative' } : {})
  };

  const groupsList = [0, 1, 2].filter(g => g !== groupIndex);
  const themes = [
    { bg: "bg-[#0A84FF]/10", text: "text-[#0A84FF]" },
    { bg: "bg-[#FF9F0A]/10", text: "text-[#FF9F0A]" },
    { bg: "bg-[#30D158]/10", text: "text-[#30D158]" }
  ];
  const theme = themes[groupIndex] || themes[0];

  const [absentRect, setAbsentRect] = useState<DOMRect | null>(null);
  const [transferRect, setTransferRect] = useState<DOMRect | null>(null);
  const [roleRect, setRoleRect] = useState<DOMRect | null>(null);
  const [avatarRect, setAvatarRect] = useState<DOMRect | null>(null);

  const handleUpdateRoleLocal = useCallback((newRole: string) => {
    onUpdateRole(groupIndex, index, newRole);
  }, [onUpdateRole, groupIndex, index]);

  const handleUpdateMatriculaLocal = useCallback((newMatricula: string) => {
    onUpdateMatricula(groupIndex, index, newMatricula);
  }, [onUpdateMatricula, groupIndex, index]);

  const handleMoveLocal = useCallback((targetGroupIdx: number) => {
    onMove(groupIndex, targetGroupIdx, index);
  }, [onMove, groupIndex, index]);

  const handleMoveToSpecialLocal = useCallback(() => {
    onMoveToSpecial?.(groupIndex, index);
  }, [onMoveToSpecial, groupIndex, index]);

  const handleMarkAbsentLocal = useCallback((absenceType: StatusType) => {
    onMarkAbsent(groupIndex, index, absenceType);
  }, [onMarkAbsent, groupIndex, index]);

  const handleDeleteLocal = useCallback(() => {
    onDelete(groupIndex, index);
  }, [onDelete, groupIndex, index]);

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`px-4 py-2.5 flex items-center rounded-[12px] ${isDragActive ? '' : 'transition-all duration-300'} relative h-[56px] w-full ${
        (isDragging || isGhost) 
          ? 'opacity-30 border-dashed border border-white/10 bg-white/[0.02] shadow-none pointer-events-none' 
          : showAbsentMenu
            ? 'bg-[#111217] opacity-40 z-[100] shadow-none'
            : 'bg-[#111217] hover:bg-[#252836] border border-white/5 shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-grab'
      }`}
    >
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
          <span
            className="font-bold text-[14px] text-white w-full truncate leading-none uppercase tracking-wide block"
          >
            {emp.name}
          </span>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[10px] text-[#A0A0A5] font-medium whitespace-nowrap leading-none select-none">Matrícula:</span>
            <input 
              type="text" 
              value={emp.matricula || ''} 
              onChange={(e) => handleUpdateMatriculaLocal(e.target.value)}
              placeholder="N/A"
              maxLength={8}
              className="bg-transparent text-[#A0A0A5] text-[10px] font-medium focus:outline-none placeholder:text-[#A0A0A5]/30 w-[80px] leading-none input-matricula-val" 
            />
          </div>
        </div>
      </div>

      {/* Área de Ações: Botões Ausente, Turno 6H, Swap e Dropdown (Alinhados à direita) */}
      <div className="flex items-center gap-2.5 ml-auto shrink-0 relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            const open = !showAbsentMenu;
            setShowAbsentMenu(open);
            setIsTransferOpen(false);
            setIsOpen(false);
            if (open) {
              setAbsentRect(e.currentTarget.getBoundingClientRect());
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
            onClick={(e) => { e.stopPropagation(); handleMoveToSpecialLocal(); }}
            className="h-[34px] w-[75px] flex items-center justify-center font-bold text-white bg-gradient-to-r from-[#FF9F0A] to-[#FF6B00] rounded-[8px] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 text-[10px] tracking-tight text-center leading-none whitespace-nowrap px-1 shrink-0"
          >
            TURNO 6H
          </button>
        )}
        
        {/* Transfer Button */}
        <div className="relative">
          <button
            onClick={(e) => {
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
            className="w-7 h-7 rounded-[6px] flex items-center justify-center shrink-0 transition-colors outline-none bg-white/5 text-[#a0aec0] hover:bg-white/10 hover:text-white"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Role Tag Dropdown */}
        <div className="relative w-[130px] shrink-0">
          <button
            onClick={(e) => {
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
            className="relative flex items-center justify-center text-[#a0aec0] hover:text-white text-xs font-bold bg-[#1A202C] border border-white/5 hover:bg-[#4a5568] px-3 h-[34px] rounded-lg transition-colors outline-none shadow-sm w-full min-w-[130px] shrink-0"
          >
            <span className="truncate pr-4 leading-none">{emp.role || '\u00A0'}</span>
            <ChevronDown className="absolute right-3 w-3.5 h-3.5 shrink-0" />
          </button>
        </div>
      </div>

      {/* === PORTALS: renderizados fora do overflow-hidden === */}

      {/* Portal: Menu Deletar Apoio (Avatar) */}
      {showAvatarMenu && avatarRect && (
        <PortalMenu>
          <div className="fixed inset-0 z-[999]" onClick={() => { setShowAvatarMenu(false); setAvatarRect(null); }} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'fixed',
              top: avatarRect.bottom + 10,
              left: avatarRect.left,
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
          <div className="fixed inset-0 z-[999]" onClick={() => { setIsTransferOpen(false); setTransferRect(null); }} />
          <div
            style={{
              position: 'fixed',
              top: transferRect.bottom + 6,
              left: transferRect.right - 160,
              zIndex: 1000,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -5 }}
              transition={{ duration: 0.15 }}
              className={`w-[160px] backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.3)] rounded-[16px] overflow-hidden flex flex-col p-1.5 gap-1 transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-slate-950/40 border border-white/10 text-white' 
                  : 'bg-white/40 border border-slate-300/50 text-slate-800'
              }`}
            >
              <div className="px-3 py-1 text-[9px] font-extrabold text-[#a0aec0] uppercase tracking-wider select-none">Mudar para</div>
              {groupsList.map(g => {
                const names = ["Recepção", "Classificação", "Formação"];
                const deptId = ["recepcao", "classificacao", "formacao"][g] || "";
                const theme = getDeptTheme(deptId);
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
                        ? 'text-white hover:bg-white/10 active:bg-white/15' 
                        : 'text-slate-800 hover:bg-slate-800/10 active:bg-slate-800/15'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {theme && (
                        <div className={`p-1.5 rounded-[8px] ${theme.bg} ${theme.color}`}>
                          {React.cloneElement(theme.icon, { className: 'w-3.5 h-3.5 shrink-0' })}
                        </div>
                      )}
                      <span>{names[g] || `Grupo ${g + 1}`}</span>
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

      {/* Portal: Dropdown de Role Apoio */}
      {isOpen && roleRect && (
        <PortalMenu>
          <div className="fixed inset-0 z-[999]" onClick={() => { setIsOpen(false); setRoleRect(null); }} />
          <div
            style={{
              position: 'fixed',
              top: roleRect.bottom + 6,
              left: roleRect.left + roleRect.width / 2,
              transform: 'translateX(-50%)',
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
                  ? 'bg-slate-950/40 border border-white/10 text-white' 
                  : 'bg-white/40 border border-slate-300/50 text-slate-800'
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
                        ? 'text-[#FF6B00] bg-white/5 font-extrabold'
                        : 'text-[#FF6B00] bg-slate-800/5 font-extrabold'
                      : isDarkMode
                        ? 'text-white hover:bg-white/10 active:bg-white/15'
                        : 'text-slate-800 hover:bg-slate-800/10 active:bg-slate-800/15'
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
          <div className="fixed inset-0 z-[999]" onClick={() => { setShowAbsentMenu(false); setAbsentRect(null); }} />
          <div
            style={{
              position: 'fixed',
              top: absentRect.bottom + 10,
              left: absentRect.left + absentRect.width / 2,
              transform: 'translateX(-50%)',
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
                  ? 'bg-slate-950/40 border border-white/10 text-white' 
                  : 'bg-white/40 border border-slate-300/50 text-slate-800'
              }`}
            >
              {[
                { type: 'FÉRIAS' },
                { type: 'FORA' },
                { type: 'ATM' },
                { type: 'RESTRIÇÃO' },
                { type: 'INSS' }
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
    </div>
  );
});

const SpecialShiftSlot = React.memo(({
  emp,
  index,
  allDepartments,
  onUpdate,
  onTransfer,
  activeEdit,
  onStartEdit
}: { 
  emp: Employee; 
  index: number; 
  allDepartments: Department[];
  onUpdate: (empIndex: number, field: keyof Employee, value: string) => void;
  onTransfer: (empIndex: number, targetDeptId: string) => void;
  activeEdit?: ActiveEdit;
  onStartEdit?: (empId: string) => void;
}) => {

  const style: React.CSSProperties = {
    ...(activeEdit ? { outline: `2.5px solid ${activeEdit.color}`, outlineOffset: '1.5px' } : {})
  };

  const [showOofMenu, setShowOofMenu] = useState(false);
  const oofButtonRef = useRef<HTMLButtonElement>(null);
  const oofRect = useAnchoredRect(oofButtonRef, showOofMenu);

  const handleUpdateLocal = useCallback((field: keyof Employee, value: string) => {
    onUpdate(index, field, value);
  }, [onUpdate, index]);

  const handleTransferLocal = useCallback((targetDeptId: string) => {
    onTransfer(index, targetDeptId);
  }, [onTransfer, index]);

  const handleStartEditLocal = useCallback(() => {
    onStartEdit?.(emp.id);
  }, [onStartEdit, emp.id]);

  return (
    <div 
      style={style}
      className="w-[250px] shrink-0 h-[100px] bg-[#111217] rounded-2xl border border-white/5 shadow-sm p-3 flex flex-col justify-between relative group hover:border-[#BF5AF2]/30 transition-colors"
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
                  e.stopPropagation();
                  handleUpdateLocal('tagType', emp.tagType === 'MAQUINISTA' ? 'OOF' : 'MAQUINISTA');
                }}
                className={`text-[8px] font-extrabold uppercase px-1 py-0.5 rounded w-max mt-0.5 tracking-wider cursor-pointer transition-all hover:scale-105 active:scale-95 select-none ${
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
            onClick={(e) => { e.stopPropagation(); handleTransferLocal(emp.originalDeptId || 'recepcao'); }}
            className="h-[24px] px-1.5 font-bold text-white bg-gradient-to-r from-[#0052B3] to-[#003D8A] rounded shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 text-[9px] whitespace-nowrap"
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
              onClick={(e) => { e.stopPropagation(); setShowOofMenu(true); }}
              className="h-[26px] px-2 flex items-center justify-center gap-1 rounded-md text-[10px] font-bold w-[120px] text-center uppercase bg-[#FF6B00] text-white shadow-sm border-none hover:bg-[#E66000] transition-colors"
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
                onChange={(e) => handleUpdateLocal('line', e.target.value.toUpperCase())}
                placeholder="LINHA"
                className="h-[34px] px-1 rounded-md text-[10px] font-bold w-[95px] text-center uppercase placeholder-white/30 focus:outline-none bg-[#FF6B00] text-white shadow-sm border-none"
              />
            </div>
            <div className="flex flex-col items-center">
              <input
                type="text"
                value={emp.machine}
                onFocus={handleStartEditLocal}
                onChange={(e) => handleUpdateLocal('machine', e.target.value.toUpperCase())}
                placeholder="LOCO"
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
                  className={`w-full text-left px-4 py-3 text-[11px] font-bold tracking-wider hover:bg-white/10 transition-colors uppercase ${
                    emp.line === opcao ? 'text-[#FF9F0A] bg-[#FF9F0A]/10' : 'text-slate-300'
                  }`}
                >
                  {opcao}
                </button>
              ))}
            </motion.div>
          </div>
        </PortalMenu>
      )}

    </div>
  );
});

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}


