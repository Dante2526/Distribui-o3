import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Users, LayoutGrid, CheckCircle2, ChevronRight, ChevronDown, Inbox, Layers, UserCog, Trash2, Zap, User, ArrowRightLeft, Palmtree, Shield, Clock, LogOut, Activity, ShieldAlert, FileText, GripVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  DndContext,
  closestCorners,
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

const StatCard = ({ label, value, colorClass, bgClass }: { label: string; value: number; colorClass: string; bgClass: string }) => (
  <div className={`text-center py-2 px-3.5 rounded-xl min-w-[95px] border border-white/5 transition-all shadow-sm ${bgClass}`}>
    <div className={`text-[24px] font-black mb-0.5 tracking-tight ${colorClass}`}>{value}</div>
    <div className="text-[10px] text-[#a0aec0] uppercase font-bold tracking-wider">{label}</div>
  </div>
);

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
};

type AnnotationItem = {
  id?: string;
  name: string;
  status: string;
};

type AnnotationGroup = {
  title: string;
  items: AnnotationItem[];
};

// --- Mock Data based on the provided image ---
const PREDEFINED_LINES = [
  'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 
  'VIRADOR', 'GIROFLEX', 'PIAL', 'FORM - CIMA', 'FORM - BAIXO'
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
      { id: 'emp-' + (7), name: 'NAIMARA MENDES', line: 'X04', machine: '805', error: true },
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
    { id: 'emp-' + (20), name: 'BEATRIZ SILVA', role: 'MIKE 02' },
    { id: 'emp-' + (21), name: 'AMÉRICO SANTOS', role: 'VIRADOR' },
    { id: 'emp-' + (22), name: 'ESDRAS SOUZA', role: 'VIRADOR' },
    { id: 'emp-' + (23), name: 'LARISSA COSTA', role: 'VIRADOR' },
  ],
  [
    { id: 'emp-' + (24), name: 'CAMILE BARROS', role: 'MIKE 03' },
    { id: 'emp-' + (25), name: 'ALBERTO LIMA', role: 'AUX GIROFLEX' },
    { id: 'emp-' + (26), name: 'RICARDO ROCHA', role: 'AUX GIROFLEX' },
  ],
  [
    { id: 'emp-' + (27), name: 'LUANA ALVES', role: 'MIKE 06' },
    { id: 'emp-' + (28), name: 'ROSA MENDES', role: 'AUX X6' },
  ],
];

const initialAnnotationsLeft: AnnotationGroup[] = [
  {
    title: 'FÉRIAS/ATM/TE/TREIN./REVEZA',
    items: [
      { id: 'emp-' + (29), name: 'WEBERTH SILVA', status: 'TREINAMENTO' },
      { id: 'emp-' + (30), name: 'RAFAEL SOUZA', status: 'TREINAMENTO' },
      { id: 'emp-' + (31), name: 'ARTHUR COSTA', status: 'TREINAMENTO' },
      { id: 'emp-' + (32), name: 'GERALDO SANTOS', status: 'TREINAMENTO' },
      { id: 'emp-' + (33), name: '', status: '' },
      { id: 'emp-' + (34), name: '', status: '' },
    ]
  },
  {
    title: 'AUSENTES/FORA/FÉRIAS',
    items: [
      { id: 'emp-' + (35), name: 'ALDO RIBEIRO', status: 'FÉRIAS' },
      { id: 'emp-' + (36), name: 'KEYLSON LIMA', status: 'FÉRIAS' },
      { id: 'emp-' + (37), name: 'JOANDERSON ALVES', status: 'FÉRIAS' },
      { id: 'emp-' + (38), name: '', status: '' },
      { id: 'emp-' + (39), name: '', status: '' },
      { id: 'emp-' + (40), name: '', status: '' },
    ]
  }
];

const initialAnnotationsRight: AnnotationGroup[] = [
  {
    title: 'MAQ/OFF - ESTÁGIO',
    items: [
      { id: 'emp-' + (41), name: 'THAIS OLIVEIRA', status: 'ESTÁGIO' },
      { id: 'emp-' + (42), name: 'ELIAS PEREIRA', status: 'ESTÁGIO' },
      { id: 'emp-' + (43), name: 'JESSICA RODRIGUES', status: 'ESTÁGIO' },
      { id: 'emp-' + (44), name: 'GIANFRANCO NUNES', status: 'ESTÁGIO' },
      { id: 'emp-' + (45), name: 'THAIS GOMES', status: 'ESTÁGIO' },
      { id: 'emp-' + (46), name: 'BEATRIZ BARBOSA', status: 'ESTÁGIO' },
      { id: 'emp-' + (47), name: 'DENISSON MARTINS', status: '' },
    ]
  },
  {
    title: 'TREINAMENTO / FÉRIAS/ ATM / TE',
    items: [
      { id: 'emp-' + (48), name: 'ANA PAULA SILVA', status: 'RESTRIÇÃO' },
      { id: 'emp-' + (49), name: 'JONH CARDOSO', status: 'RESTRIÇÃO' },
      { id: 'emp-' + (50), name: 'ANA BEATRIZ LIMA', status: 'INSS' },
      { id: 'emp-' + (51), name: 'CAMILE MOREIRA', status: 'ATM' },
      { id: 'emp-' + (52), name: '', status: '' },
      { id: 'emp-' + (53), name: 'MARCO POLO SOUZA', status: 'FÉRIAS' },
      { id: 'emp-' + (54), name: 'ADRYELLEN VIEIRA', status: 'FÉRIAS' },
      { id: 'emp-' + (55), name: 'LARISSA DIAS', status: 'FORA' },
      { id: 'emp-' + (56), name: '', status: '' },
    ]
  },
  {
    title: 'FÉRIAS/IN SP/LICENÇA',
    items: [
      { id: 'emp-' + (57), name: 'EDNELSON MELO', status: 'INSS' },
      { id: 'emp-' + (58), name: '', status: '' },
      { id: 'emp-' + (59), name: '', status: '' },
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

function AnnotationsBoard({ 
  leftGroups, 
  rightGroups,
  onUpdateLeft,
  onUpdateRight
}: { 
  leftGroups: AnnotationGroup[];
  rightGroups: AnnotationGroup[];
  onUpdateLeft: (groupIndex: number, itemIndex: number, field: keyof AnnotationItem, value: string) => void;
  onUpdateRight: (groupIndex: number, itemIndex: number, field: keyof AnnotationItem, value: string) => void;
}) {
  return (
    <div className="annotations-board-panel bg-[#1E2029] rounded-[24px] overflow-hidden flex flex-col shadow-lg border border-white/[0.02] min-h-full">
      {/* Header */}
      <div className="px-6 py-5 border-b border-[#111217] flex items-center justify-center bg-[#15171E]">
        <h3 className="text-[22px] font-bold text-white tracking-tight uppercase">ANOTAÇÕES MINÉRIO</h3>
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
                {group.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="annotation-item-row flex items-center justify-between px-2 py-1.5 bg-[#111217] rounded-[8px] border border-white/[0.03]">
                    <input 
                      type="text" 
                      value={item.name} 
                      onChange={(e) => onUpdateLeft(groupIdx, itemIdx, 'name', e.target.value)}
                      placeholder="NOME E SOBRENOME"
                      className="bg-transparent text-white text-[13px] font-bold uppercase w-[68%] focus:outline-none placeholder:text-[#a0aec0]/30" 
                    />
                    <input 
                      type="text" 
                      value={item.status} 
                      onChange={(e) => onUpdateLeft(groupIdx, itemIdx, 'status', e.target.value)}
                      placeholder="Status"
                      className="bg-transparent text-[#a0aec0] text-[11px] font-semibold uppercase w-[32%] text-right focus:outline-none placeholder:text-[#a0aec0]/30" 
                    />
                  </div>
                ))}
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
                {group.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="annotation-item-row flex items-center justify-between px-2 py-1.5 bg-[#111217] rounded-[8px] border border-white/[0.03]">
                    <input 
                      type="text" 
                      value={item.name} 
                      onChange={(e) => onUpdateRight(groupIdx, itemIdx, 'name', e.target.value)}
                      placeholder="NOME E SOBRENOME"
                      className="bg-transparent text-white text-[13px] font-bold uppercase w-[68%] focus:outline-none placeholder:text-[#a0aec0]/30" 
                    />
                    <input 
                      type="text" 
                      value={item.status} 
                      onChange={(e) => onUpdateRight(groupIdx, itemIdx, 'status', e.target.value)}
                      placeholder="Status"
                      className="bg-transparent text-[#a0aec0] text-[11px] font-semibold uppercase w-[32%] text-right focus:outline-none placeholder:text-[#a0aec0]/30" 
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Admin Modal Component ---
const ADMIN_PASSWORD = 'adm2025';

function AdminModal({ isOpen, onClose, isAdmin, onLogin, onLogout }: {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  onLogin: (password: string) => void;
  onLogout: () => void;
}) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setError('');
      setPassword('');
      onLogin(password);
    } else {
      setError('Senha incorreta. Tente novamente.');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#1E2029] border border-white/10 rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center relative mx-4 animate-[fadeInScale_0.25s_ease-out_forwards]"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'fadeInScale 0.25s ease-out forwards' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#a0aec0] hover:text-white text-3xl z-10 transition-colors"
        >
          &times;
        </button>

        {/* Icon */}
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-purple-500/30">
          <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
          </svg>
        </div>

        {isAdmin ? (
          // Painel de opções do administrador
          <>
            <h2 className="text-xl font-bold text-white mb-1 uppercase tracking-wide">Painel do Administrador</h2>
            <p className="text-sm text-[#a0aec0] mb-6">Você está logado como administrador</p>
            <div className="flex flex-col gap-3">
              <div className="bg-[#111217] rounded-xl p-4 border border-white/5 text-left">
                <p className="text-xs text-[#a0aec0] uppercase tracking-wider font-bold mb-2">Sessão Ativa</p>
                <p className="text-white font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full inline-block animate-pulse"></span>
                  Administrador autenticado
                </p>
              </div>
              <button
                onClick={onLogout}
                className="w-full py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-red-500/30"
              >
                ENCERRAR SESSÃO
              </button>
              <button
                onClick={onClose}
                className="w-full py-3 bg-white/5 border border-white/10 text-[#a0aec0] font-bold rounded-xl hover:bg-white/10 transition-all"
              >
                FECHAR
              </button>
            </div>
          </>
        ) : (
          // Formulário de login
          <>
            <h2 className="text-xl font-bold text-white mb-1 uppercase tracking-wide">Acesso Administrativo</h2>
            <p className="text-sm text-[#a0aec0] mb-6">Digite a senha para continuar</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="password"
                placeholder="Senha do Administrador"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 bg-[#111217] border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-white/30 transition-all"
                autoFocus
              />
              {error && (
                <p className="text-sm text-red-400 font-semibold text-left px-1">{error}</p>
              )}
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-purple-500/30"
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

export default function App() {
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
  const [isAdmin, setIsAdmin] = useState(false);

  const [activeEdits, setActiveEdits] = useState<Record<string, ActiveEdit>>({});
  const departmentsRef = useRef(departmentsData);
  useEffect(() => {
    departmentsRef.current = departmentsData;
  }, [departmentsData]);

  useEffect(() => {
    const simulate = () => {
      const allEmps = departmentsRef.current.flatMap(d => d.data);
      if (allEmps.length === 0) return;
      
      // Quantos bots vão editar agora? (1 a 2)
      const numBots = Math.floor(Math.random() * 2) + 1;
      
      for (let i = 0; i < numBots; i++) {
        const randomEmp = allEmps[Math.floor(Math.random() * allEmps.length)];
        const randomUser = MOCK_USERS[Math.floor(Math.random() * 6)];
        
        setActiveEdits((prev) => ({
          ...prev,
          [randomEmp.id]: {
            empId: randomEmp.id,
            userName: randomUser.name,
            color: randomUser.color,
            timestamp: Date.now()
          }
        }));

        setTimeout(() => {
          setActiveEdits((prev) => {
            const newEdits = { ...prev };
            delete newEdits[randomEmp.id];
            return newEdits;
          });
        }, 5000 + Math.random() * 7000); // Fica de 5 a 12s
      }
    };

    // Dispara logo no início
    simulate();

    const interval = setInterval(() => {
      if (Math.random() > 0.2) simulate();
    }, 4000); // Tenta a cada 4 segundos

    return () => clearInterval(interval);
  }, []);

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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 500,
        tolerance: 8,
      },
    })
  );

  const findContainer = (id: string, departments: Department[]) => {
    if (departments.some(d => d.id === id)) return id;
    const dept = departments.find(d => d.data.some(e => e.id === id));
    return dept ? dept.id : null;
  };

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
    clonedDepartmentsRef.current = departmentsData;
  };

  const handleDragCancel = () => {
    setActiveId(null);
    if (clonedDepartmentsRef.current) {
      setDepartmentsData(clonedDepartmentsRef.current);
    }
  };

  const handleDragOver = (event: any) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    setDepartmentsData((prev) => {
      const activeContainer = findContainer(activeId, prev);
      const overContainer = findContainer(overId, prev);

      if (!activeContainer || !overContainer) {
        return prev;
      }

      const activeItems = prev.find((d) => d.id === activeContainer)?.data || [];
      const overItems = prev.find((d) => d.id === overContainer)?.data || [];

      const activeIndex = activeItems.findIndex((e) => e.id === activeId);
      const overIndex = overItems.findIndex((e) => e.id === overId);

      const movedItem = activeItems[activeIndex];
      if (!movedItem) return prev;

      let newIndex;
      if (overIndex >= 0) {
        newIndex = overIndex;
      } else {
        newIndex = overItems.length;
      }

      return prev.map((dept) => {
        if (activeContainer === overContainer) {
          if (dept.id === activeContainer) {
            const newData = [...dept.data];
            const itemToMove = newData.splice(activeIndex, 1)[0];
            newData.splice(newIndex, 0, itemToMove);
            return { ...dept, data: newData };
          }
          return dept;
        } else {
          if (dept.id === activeContainer) {
            return { ...dept, data: dept.data.filter((e) => e.id !== activeId), count: dept.data.length - 1 };
          }
          if (dept.id === overContainer) {
            const newData = [...dept.data];
            newData.splice(newIndex, 0, movedItem);
            return { ...dept, data: newData, count: newData.length };
          }
          return dept;
        }
      });
    });
  };

  const handleDragEnd = (event: any) => {
    setActiveId(null);
  };

  const activeEmployee = activeId 
    ? departmentsData.flatMap(d => d.data).find(e => e.id === activeId)
    : null;
  const activeDepartment = activeEmployee
    ? departmentsData.find(d => d.data.some(e => e.id === activeId))
    : null;


  const handleAdminLogin = useCallback(() => {
    setIsAdmin(true);
  }, []);

  const handleAdminLogout = useCallback(() => {
    setIsAdmin(false);
    setIsAdminModalOpen(false);
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

  const handleUpdateSpecialShiftEmployee = (empIndex: number, field: keyof Employee, value: any) => {
    setSpecialShiftData(prev => {
      const newData = [...prev];
      newData[empIndex] = { ...newData[empIndex], [field]: value };
      if (field === 'name' && value.trim() && !newData[empIndex].tagType) {
        newData[empIndex].tagType = 'MAQUINISTA';
      }
      return newData;
    });
  };

  const handleTransferToSpecialShift = (sourceDeptId: string, sourceEmpIndex: number) => {
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
  };

  const handleTransferSupportToSpecialShift = (sourceGroupIndex: number, sourceEmpIndex: number) => {
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
        name: movedRole.name,
        line: '',
        machine: '',
        originalSupportGroupIndex: sourceGroupIndex,
        originalSupportRole: movedRole.role,
        tagType: 'OOF'
      }
    ]);
  };

  const handleTransferFromSpecialShift = (empIndex: number, targetDeptId: string) => {
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
          name: movedEmployee.name,
          role: roleStr
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
  };

  const handleUpdateAnnotationLeft = (groupIndex: number, itemIndex: number, field: keyof AnnotationItem, value: string) => {
    setAnnotationsLeft(prev => {
      const newGroups = [...prev];
      const newItems = [...newGroups[groupIndex].items];
      newItems[itemIndex] = { ...newItems[itemIndex], [field]: value };
      newGroups[groupIndex] = { ...newGroups[groupIndex], items: newItems };
      return newGroups;
    });
  };

  const handleUpdateAnnotationRight = (groupIndex: number, itemIndex: number, field: keyof AnnotationItem, value: string) => {
    setAnnotationsRight(prev => {
      const newGroups = [...prev];
      const newItems = [...newGroups[groupIndex].items];
      newItems[itemIndex] = { ...newItems[itemIndex], [field]: value };
      newGroups[groupIndex] = { ...newGroups[groupIndex], items: newItems };
      return newGroups;
    });
  };

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
      // Auto-fit para focar nas 3 colunas principais (cada uma com 500px + gaps = ~1600px de área alvo)
      const targetViewWidth = 1600;
      const fitScale = viewport.clientWidth / targetViewWidth;
      const finalScale = Math.min(Math.max(fitScale, 0.4), 0.85);
      setScale(finalScale, 0, 0);
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
    viewport.addEventListener('touchstart', handleTouchStart, { passive: false });
    viewport.addEventListener('touchmove', handleTouchMove, { passive: false });
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
        viewport.removeEventListener('touchstart', handleTouchStart);
        viewport.removeEventListener('touchmove', handleTouchMove);
        viewport.removeEventListener('mousedown', handleMouseDown);
      }
    };
  }, [initializeScale, setScale]);

  const handleUpdateSupportRole = (groupIndex: number, empIndex: number, newRole: string) => {
    setSupportRolesData(prev => {
      const newGroups = [...prev];
      const newGroup = [...newGroups[groupIndex]];
      newGroup[empIndex] = { ...newGroup[empIndex], role: newRole };
      newGroups[groupIndex] = newGroup;
      return newGroups;
    });
  };

  const handleUpdateSupportName = (groupIndex: number, empIndex: number, newName: string) => {
    setSupportRolesData(prev => {
      const newGroups = [...prev];
      const newGroup = [...newGroups[groupIndex]];
      newGroup[empIndex] = { ...newGroup[empIndex], name: newName };
      newGroups[groupIndex] = newGroup;
      return newGroups;
    });
  };

  const handleMoveSupport = (sourceGroupIndex: number, targetGroupIndex: number, sourceEmpIndex: number) => {
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
  };

  const handleMove = (sourceDeptId: string, targetDeptId: string, sourceEmpIndex: number) => {
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
  };

  const handleUpdateEmployeeField = (deptId: string, empIndex: number, field: keyof Employee, value: string) => {
    setDepartmentsData(prev => {
      const newDepts = [...prev];
      const deptIndex = newDepts.findIndex(d => d.id === deptId);
      if (deptIndex === -1) return prev;
      
      const newEmployees = [...newDepts[deptIndex].data];
      newEmployees[empIndex] = { ...newEmployees[empIndex], [field]: value };
      newDepts[deptIndex] = { ...newDepts[deptIndex], data: newEmployees };
      
      return newDepts;
    });
  };

  const handleDelete = (deptId: string, empIndex: number) => {
    setDepartmentsData(prev => {
      const newDepts = [...prev];
      const deptIndex = newDepts.findIndex(d => d.id === deptId);
      const newData = [...newDepts[deptIndex].data];
      newData.splice(empIndex, 1);
      newDepts[deptIndex] = { ...newDepts[deptIndex], data: newData, count: newData.length };
      return newDepts;
    });
  };

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
          items[emptyIdx] = { name: empName, status: absenceType };
        } else {
          // Se não houver slot vazio, faz push
          items.push({ name: empName, status: absenceType });
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
          items[emptyIdx] = { name: empName, status: absenceType };
        } else {
          items.push({ name: empName, status: absenceType });
        }
        newGroups[targetRightGroupIndex] = { ...group, items };
        return newGroups;
      });
    }
  };

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
            <div className="bg-[#1E2029] border border-white/5 rounded-3xl p-6 md:p-10 mb-8 shadow-lg flex justify-between items-center w-full transition-colors">
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
              <div className="flex flex-col items-end gap-5">
                <div className="flex items-center gap-6">
                  {/* Botão TROCAR TURMA */}
                  <button
                    id="change-turma-btn"
                    onClick={() => {}}
                    className="h-[90px] w-[190px] flex items-center justify-center gap-2 text-sm font-bold text-white bg-gradient-to-r from-teal-500 to-cyan-600 rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-teal-300 cursor-pointer"
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
                    className="relative flex items-center justify-center gap-3 bg-gradient-to-r from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:-translate-y-0.5 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-purple-300/50"
                    style={{
                      width: '190px',
                      height: '90px',
                      borderRadius: '99em',
                      margin: '10px',
                      color: '#ffffff',
                    }}
                    aria-label="Acesso Administrativo"
                  >
                    {/* Badge verde quando admin ativo */}
                    {isAdmin && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 border-2 border-[#1E2029] rounded-full animate-pulse" />
                    )}
                    <svg className="w-7 h-7 shrink-0" style={{ color: '#ffffff' }} viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                    </svg>
                    <span style={{ color: '#ffffff' }} className="text-sm font-extrabold uppercase tracking-wider leading-tight text-center">
                      {isAdmin ? 'ADM ✓' : 'ACESSO ADM'}
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
            <div className="special-shift-card bg-[#1E2029] border border-[#BF5AF2]/20 rounded-3xl p-6 mb-8 shadow-lg w-max relative overflow-hidden">
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
                    key={emp.id || idx} 
                    emp={emp} 
                    index={idx} 
                    allDepartments={departmentsData}
                    onUpdate={(field, value) => handleUpdateSpecialShiftEmployee(idx, field, value)}
                    onTransfer={(targetDeptId) => handleTransferFromSpecialShift(idx, targetDeptId)}
                  />
                ))}
              </div>
            </div>

            {/* Main Content Area */}
            <div className="space-y-8">
              {/* Main Departments Grid - Always 3 columns + Annotations */}
              <DndContext
                sensors={sensors}
                collisionDetection={pointerWithin}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
              >
              <div className="flex gap-6 w-max">
                {departmentsData.map((dept) => (
                  <div key={dept.id} className="w-[500px] shrink-0">
                    <DepartmentCard 
                      department={dept} 
                      allDepartments={departmentsData}
                      maxCount={maxCount}
                      onMove={(targetDeptId, empIndex) => handleMove(dept.id, targetDeptId, empIndex)}
                      onUpdateEmployee={handleUpdateEmployeeField}
                      onDelete={handleDelete}
                      onTransferToSpecial={(empIndex) => handleTransferToSpecialShift(dept.id, empIndex)}
                      onMarkAbsent={(empIndex, absenceType) => handleMarkEmployeeAbsent(dept.id, empIndex, absenceType)}
                      isDarkMode={isDarkMode}
                      activeEdits={activeEdits}
                      onStartEdit={handleStartEdit}
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
                  />
                </div>
              </div>
              <DragOverlay
                dropAnimation={{
                  sideEffects: defaultDropAnimationSideEffects({
                    styles: { active: { opacity: '0.4' } },
                  }),
                }}
              >
                {activeId && activeEmployee && activeDepartment ? (
                  <EmployeeRow
                    emp={activeEmployee}
                    department={activeDepartment}
                    allDepartments={departmentsData}
                    onMove={() => {}}
                    onUpdateEmployee={() => {}}
                    onDelete={() => {}}
                    onTransferToSpecial={() => {}}
                    onMarkAbsent={() => {}}
                    isDarkMode={isDarkMode}
                    isDragOverlay
                  />
                ) : null}
              </DragOverlay>
              </DndContext>

              {/* Section Divider */}
              <div className="pt-8 pb-4 px-2 flex items-center space-x-3">
                <Users className="text-[#a0aec0] w-6 h-6" />
                <h2 className="text-2xl font-semibold text-white">Apoio (OOF)</h2>
              </div>

              {/* Support Roles Grid - Always 3 columns */}
              <div className="flex gap-6 w-max pb-[50vh]">
                {supportRolesData.map((group, index) => (
                  <div key={index} className="w-[500px] shrink-0">
                    <SupportCard 
                      roles={group} 
                      groupIndex={index} 
                      onUpdateRole={handleUpdateSupportRole} 
                      onUpdateName={handleUpdateSupportName} 
                      onMoveSupport={handleMoveSupport}
                      onMoveToSpecial={handleTransferSupportToSpecialShift}
                    />
                  </div>
                ))}
              </div>
            </div>

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
    />
    </>
  );
}

// --- Components ---

function DepartmentCard({ 
  department, 
  allDepartments,
  maxCount,
  onMove,
  onUpdateEmployee,
  onDelete,
  onTransferToSpecial,
  onMarkAbsent,
  isDarkMode,
  activeEdits,
  onStartEdit
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
  activeEdits: Record<string, ActiveEdit>;
  onStartEdit: (empId: string) => void;
}) {
  const theme = getDeptTheme(department.id);
  const { setNodeRef } = useDroppable({
    id: department.id,
  });

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
      <div ref={setNodeRef} className="flex-1 p-5 bg-[#0D0E12]/30 flex flex-col">
        <SortableContext id={department.id} items={department.data.map(e => e.id)} strategy={verticalListSortingStrategy}>
        <div className="grid grid-cols-1 gap-4 flex-1">
          {department.data.map((emp, i) => (
            <EmployeeRow
              key={emp.id}
              emp={emp}
              department={department}
              allDepartments={allDepartments}
              onMove={(targetId) => onMove(targetId, i)}
              onUpdateEmployee={(field, value) => onUpdateEmployee(department.id, i, field, value)}
              onDelete={() => onDelete(department.id, i)}
              onTransferToSpecial={() => onTransferToSpecial(i)}
              onMarkAbsent={(absenceType) => onMarkAbsent(i, absenceType)}
              isDarkMode={isDarkMode}
              activeEdit={activeEdits[emp.id]}
              onStartEdit={() => onStartEdit(emp.id)}
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
}

function EmployeeRow({
  emp,
  department,
  allDepartments,
  onMove,
  onUpdateEmployee,
  onDelete,
  onTransferToSpecial,
  onMarkAbsent,
  isDarkMode,
  isDragOverlay,
  activeEdit,
  onStartEdit
}: {
  key?: string | number;
  emp: Employee;
  department: Department;
  allDepartments: Department[];
  onMove: (targetId: string) => void;
  onUpdateEmployee: (field: keyof Employee, value: string) => void;
  onDelete: () => void;
  onTransferToSpecial: () => void;
  onMarkAbsent: (absenceType: StatusType) => void;
  isDarkMode: boolean;
  isDragOverlay?: boolean;
  activeEdit?: ActiveEdit;
  onStartEdit?: () => void;
}) {
  const [showLineDropdown, setShowLineDropdown] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [showTransferMenu, setShowTransferMenu] = useState(false);
  const [showAbsentMenu, setShowAbsentMenu] = useState(false);
  const theme = getDeptTheme(department.id);
  const otherDepts = allDepartments.filter(d => d.id !== department.id);

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
    transform: CSS.Transform.toString(isDragging ? null : transform),
    transition: isDragging ? undefined : transition,
    touchAction: 'none',
    ...(activeEdit && !isDragOverlay ? { outline: `2px solid ${activeEdit.color}`, outlineOffset: '1px' } : {})
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

  // Refs para ancorar os portals à posição real na tela
  const avatarBtnRef = useRef<HTMLButtonElement>(null);
  const transferBtnRef = useRef<HTMLButtonElement>(null);
  const lineInputRef = useRef<HTMLInputElement>(null);
  const absentBtnRef = useRef<HTMLButtonElement>(null);

  const avatarRect = useAnchoredRect(avatarBtnRef, showAvatarMenu);
  const transferRect = useAnchoredRect(transferBtnRef, showTransferMenu);
  const lineRect = useAnchoredRect(lineInputRef, showLineDropdown);
  const absentRect = useAnchoredRect(absentBtnRef, showAbsentMenu);

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      initial={{ scale: 0.98, opacity: 0.4 }}
      animate={{ 
        scale: isDragging ? 0.98 : 1, 
        opacity: isDragging ? 0.4 : 1 
      }}
      transition={{ 
        type: 'spring', 
        stiffness: 400, 
        damping: 25 
      }}
      className={`employee-row-card relative flex flex-col min-h-[140px] justify-between rounded-[14px] transition-all duration-300 dept-${department.id} ${
        emp.error ? 'bg-[#3A1414] hover:bg-[#4A1818]' : 'bg-[#111217] hover:bg-[#252836]'
      } ${getBorderLeftClass(department.id, emp.error)} ${
        isDragOverlay 
          ? 'shadow-[0_30px_60px_-15px_rgba(0,0,0,1)] ring-1 ring-white/10 opacity-95 cursor-grabbing z-[9999] !transition-none' 
          : isDragging 
            ? 'opacity-30 z-50 shadow-none' 
            : 'shadow-sm hover:shadow-md hover:-translate-y-1 cursor-grab'
      }`}
    >
      {/* Active Edit Badge */}
      {activeEdit && !isDragOverlay && (
        <div className="absolute -top-3 -right-2 bg-[#1E2029] border border-white/10 px-2 py-0.5 rounded-full z-[100] shadow-lg flex items-center gap-1.5 animate-[fadeIn_0.2s_ease-out]">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: activeEdit.color }} />
          <span className="text-[10px] text-white font-bold whitespace-nowrap">
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
                ref={avatarBtnRef}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAvatarMenu(!showAvatarMenu);
                  setShowTransferMenu(false);
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
              <input
                type="text"
                value={emp.name}
                onChange={(e) => onUpdateEmployee('name', e.target.value.toUpperCase())}
                className={`font-bold text-[14px] tracking-wide uppercase bg-transparent outline-none w-[180px] focus:border-b focus:border-white/20 placeholder:text-white/30 truncate leading-none input-emp-name ${emp.error ? 'text-red-400' : 'text-white'}`}
                placeholder="NOME SOBRENOME"
              />
              <span className="text-[10px] text-[#A0A0A5] -mt-0.5 font-medium truncate span-emp-matricula">Matrícula: {emp.machine || 'N/A'}</span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="relative flex items-center gap-2">
            <button
              ref={absentBtnRef}
              onClick={(e) => {
                e.stopPropagation();
                setShowAbsentMenu(!showAbsentMenu);
                setShowTransferMenu(false);
                setShowAvatarMenu(false);
              }}
              className="h-[34px] w-[70px] sm:w-[80px] flex items-center justify-center font-bold text-white bg-[#F59E0B] hover:bg-[#D97706] rounded-[8px] shadow-none border-none text-[10px] tracking-tight text-center leading-none whitespace-nowrap px-1 cursor-pointer transition-colors duration-150"
            >
              AUSENTE
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onTransferToSpecial(); }}
              className="h-[34px] w-[70px] sm:w-[80px] flex items-center justify-center font-bold text-white bg-gradient-to-r from-[#FF9F0A] to-[#FF6B00] rounded-[8px] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 text-[10px] tracking-tight text-center leading-none whitespace-nowrap px-1"
            >
              TURNO 6H
            </button>
            <button 
              ref={transferBtnRef}
              onClick={(e) => {
                e.stopPropagation();
                setShowTransferMenu(!showTransferMenu);
                setShowAvatarMenu(false);
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
              ref={lineInputRef}
              type="text"
              value={emp.line}
              onFocus={() => {
                setShowLineDropdown(true);
                onStartEdit?.();
              }}
              onBlur={() => setTimeout(() => setShowLineDropdown(false), 200)}
              onChange={(e) => {
                onUpdateEmployee('line', e.target.value);
                setShowLineDropdown(true);
              }}
              className="h-[34px] px-2 rounded-[8px] text-[13px] font-bold w-[70px] sm:w-[80px] text-center uppercase placeholder-white/50 focus:outline-none bg-[#FF6B00] text-white shadow-sm border-none hover:bg-[#E66000] transition-all"
            />
            <span className="text-[9px] text-[#a0aec0] uppercase font-bold tracking-wider mt-1">Linha</span>
          </div>
          <div className="flex flex-col items-center">
            <input
              type="text"
              value={emp.machine}
              onFocus={() => onStartEdit?.()}
              onChange={(e) => onUpdateEmployee('machine', e.target.value)}
              className="h-[34px] px-2 rounded-[8px] text-[13px] font-bold w-[70px] sm:w-[80px] text-center uppercase placeholder-white/50 focus:outline-none bg-[#10B981] text-white shadow-sm border-none hover:bg-[#059669] transition-all"
            />
            <span className="text-[9px] text-[#a0aec0] uppercase font-bold tracking-wider mt-1">Loco</span>
          </div>
        </div>
      </div>

      {/* === PORTALS: renderizados fora do overflow-hidden === */}

      {/* Portal: Menu Deletar (Avatar) */}
      <AnimatePresence>
        {showAvatarMenu && avatarRect && (
          <PortalMenu>
            <div className="fixed inset-0 z-[999]" onClick={() => setShowAvatarMenu(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -5 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'fixed',
                top: avatarRect.bottom + 6,
                left: avatarRect.left,
                zIndex: 1000,
              }}
              className="w-[120px] bg-[#1E2029]/80 backdrop-blur-md border border-[#FF3B30]/30 rounded-[12px] shadow-xl overflow-hidden flex flex-col"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAvatarMenu(false);
                  onDelete();
                }}
                className="flex items-center px-3 py-2 text-[13px] font-bold text-[#FF3B30] hover:bg-[#FF3B30]/15 active:bg-[#FF3B30]/20 transition-colors w-full text-left"
              >
                <Trash2 className="w-[16px] h-[16px] mr-2" />
                Deletar
              </button>
            </motion.div>
          </PortalMenu>
        )}
      </AnimatePresence>

      {/* Portal: Menu Transferir */}
      <AnimatePresence>
        {showTransferMenu && transferRect && (
          <PortalMenu>
            <div className="fixed inset-0 z-[999]" onClick={() => setShowTransferMenu(false)} />
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
                      onMove(d.id); 
                      setShowTransferMenu(false); 
                    }}
                    className="flex items-center px-3.5 py-1.5 text-[12px] font-semibold text-white hover:bg-[#252836] transition-colors w-full text-left"
                  >
                    <div className={`mr-2 p-1 rounded-md ${theme.bg} ${theme.color}`}>
                      {React.cloneElement(theme.icon, { className: 'w-3 h-3' })}
                    </div>
                    {d.title}
                  </button>
                );
              })}
              <div className="h-px bg-white/5 my-1 mx-2" />
              <button
                onClick={(e) => { e.stopPropagation(); onTransferToSpecial(); setShowTransferMenu(false); }}
                className="flex items-center px-3.5 py-1.5 text-[12px] font-semibold text-[#BF5AF2] hover:bg-[#BF5AF2]/10 transition-colors w-full text-left"
              >
                <div className="mr-2 p-1 rounded-md bg-[#BF5AF2]/15 text-[#BF5AF2]">
                  <Zap className="w-3 h-3" />
                </div>
                Tarefa Especial
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setShowTransferMenu(false); }}
                className="flex items-center px-3.5 py-1.5 text-[12px] font-semibold text-[#00C7BE] hover:bg-[#00C7BE]/10 transition-colors w-full text-left"
              >
                <div className="mr-2 p-1 rounded-md bg-[#00C7BE]/15 text-[#00C7BE]">
                  <Palmtree className="w-3 h-3" />
                </div>
                De Férias
              </button>
            </motion.div>
          </PortalMenu>
        )}
      </AnimatePresence>

      {/* Portal: Dropdown de Linhas */}
      <AnimatePresence>
        {showLineDropdown && lineRect && (
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
              className="w-[130px] max-h-[150px] overflow-y-auto bg-[#1E2029]/80 backdrop-blur-md border border-white/10 rounded-[8px] shadow-2xl flex flex-col py-1 hide-scrollbar"
            >
              {PREDEFINED_LINES.filter(l => l.toLowerCase().includes((emp.line || '').toLowerCase())).map((linha) => (
                <button
                  key={linha}
                  onMouseDown={(e) => {
                    e.preventDefault(); 
                    onUpdateEmployee('line', linha);
                    setShowLineDropdown(false);
                  }}
                  className="text-center px-2 py-1.5 text-[12px] font-bold text-white hover:bg-[#FF6B00] transition-colors"
                >
                  {linha}
                </button>
              ))}
              {PREDEFINED_LINES.filter(l => l.toLowerCase().includes((emp.line || '').toLowerCase())).length === 0 && (
                <div className="px-2 py-1.5 text-[10px] text-[#a0aec0] text-center font-medium uppercase tracking-wide">Pressione Enter</div>
              )}
            </motion.div>
          </PortalMenu>
        )}
      </AnimatePresence>

      {/* Portal: Menu Ausente */}
      <AnimatePresence>
        {showAbsentMenu && absentRect && (
          <PortalMenu>
            <div className="fixed inset-0 z-[999]" onClick={() => setShowAbsentMenu(false)} />
            <div
              style={{
                position: 'fixed',
                top: absentRect.bottom + 10, // Abaixo do botão com espaçamento nítido de 10px
                left: absentRect.left + absentRect.width / 2, // Alinhado ao centro horizontal do botão
                transform: 'translateX(-50%)', // Centraliza horizontalmente
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
                        onMarkAbsent(opt.type as StatusType);
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
}

function SupportCard({ 
  roles, 
  groupIndex, 
  onUpdateRole,
  onUpdateName,
  onMoveSupport,
  onMoveToSpecial
}: { 
  roles: SupportRole[]; 
  groupIndex: number; 
  onUpdateRole: (groupIndex: number, empIndex: number, newRole: string) => void;
  onUpdateName: (groupIndex: number, empIndex: number, newName: string) => void;
  onMoveSupport: (sourceGroupIndex: number, targetGroupIndex: number, empIndex: number) => void;
  onMoveToSpecial: (groupIndex: number, empIndex: number) => void;
}) {
  const themes = [
    { bg: "bg-[#0A84FF]/10", border: "border-[#0A84FF]/20", text: "text-[#0A84FF]", bar: "bg-[#0A84FF]" },
    { bg: "bg-[#FF9F0A]/10", border: "border-[#FF9F0A]/20", text: "text-[#FF9F0A]", bar: "bg-[#FF9F0A]" },
    { bg: "bg-[#30D158]/10", border: "border-[#30D158]/20", text: "text-[#30D158]", bar: "bg-[#30D158]" }
  ];
  const theme = themes[groupIndex] || themes[0];

  return (
    <div className="bg-[#1E2029] rounded-[24px] overflow-hidden flex flex-col border border-white/[0.02] relative">
      
      {/* Support Card Header */}
      <div className="px-5 py-4 border-b border-[#111217] flex items-center justify-between bg-[#15171E]">
        <div className="flex items-center gap-3.5">
          <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center shadow-inner ${theme.bg} ${theme.text}`}>
            <Users className="w-5 h-5" />
          </div>
          <h4 className="text-[18px] font-bold text-white tracking-tight uppercase">Grupo {groupIndex + 1}</h4>
        </div>
        <div className={`flex items-center font-semibold text-[12px] px-3.5 py-1.5 rounded-full ${theme.text} ${theme.bg}`}>
          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
          {roles.length} Colab.
        </div>
      </div>
      
      {/* Support List */}
      <div className="p-3 space-y-2">
        {roles.map((emp, i) => (
          <SupportRoleRow 
            key={emp.id || i} 
            emp={emp} 
            groupIndex={groupIndex}
            onUpdateRole={(newRole) => onUpdateRole(groupIndex, i, newRole)} 
            onUpdateName={(newName) => onUpdateName(groupIndex, i, newName)} 
            onMove={(targetGroupIndex) => onMoveSupport(groupIndex, targetGroupIndex, i)}
            onMoveToSpecial={() => onMoveToSpecial(groupIndex, i)}
          />
        ))}
      </div>
    </div>
  );
}

function SupportRoleRow({ 
  emp, 
  groupIndex,
  onUpdateRole,
  onUpdateName,
  onMove,
  onMoveToSpecial
}: { 
  key?: string | number;
  emp: SupportRole; 
  groupIndex: number;
  onUpdateRole: (newRole: string) => void;
  onUpdateName: (newName: string) => void;
  onMove: (targetGroupIndex: number) => void;
  onMoveToSpecial?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  
  const groupsList = [0, 1, 2].filter(g => g !== groupIndex);
  
  return (
    <div className="px-4 py-2.5 flex items-center justify-between rounded-[12px] bg-[#111217] hover:bg-[#252836] border border-white/5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 relative">
      <input
        type="text"
        value={emp.name}
        onChange={(e) => onUpdateName(e.target.value.toUpperCase())}
        className="font-bold text-[14px] text-white bg-transparent outline-none w-[180px] focus:border-b focus:border-white/20 placeholder:text-white/30 truncate leading-none"
        placeholder="NOME SOBRENOME"
      />
      <div className="flex items-center gap-2 relative">
        <button
          onClick={(e) => { e.stopPropagation(); if (onMoveToSpecial) onMoveToSpecial(); }}
          className="h-[24px] px-1.5 font-bold text-white bg-gradient-to-r from-[#FF9F0A] to-[#FF6B00] rounded shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 text-[9px] whitespace-nowrap"
        >
          TURNO 6H
        </button>
        {/* Transfer Button */}
        <div className="relative">
          <button
            onClick={() => setIsTransferOpen(!isTransferOpen)}
            className="w-7 h-7 rounded-[6px] flex items-center justify-center shrink-0 transition-colors outline-none bg-white/5 text-[#a0aec0] hover:bg-white/10 hover:text-white"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
          </button>
          
          <AnimatePresence>
            {isTransferOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsTransferOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-[115%] w-[150px] bg-[#1E2029] border border-white/10 rounded-[10px] shadow-2xl z-50 overflow-hidden flex flex-col py-1"
                >
                  <div className="px-3 py-1 text-[10px] font-bold text-[#a0aec0] uppercase tracking-wider">Mudar para</div>
                  {groupsList.map(g => (
                    <button
                      key={g}
                      onClick={() => {
                        onMove(g);
                        setIsTransferOpen(false);
                      }}
                      className="px-3.5 py-2 text-[12px] font-semibold text-white hover:bg-[#FF6B00] hover:text-white transition-colors text-left"
                    >
                      Grupo {g + 1}
                    </button>
                  ))}
                  <div className="h-px bg-white/5 my-0.5 mx-2" />
                  <button
                    onClick={() => {
                      if (onMoveToSpecial) {
                        onMoveToSpecial();
                      }
                      setIsTransferOpen(false);
                    }}
                    className="px-3.5 py-2 text-[12px] font-semibold text-[#BF5AF2] hover:bg-[#BF5AF2]/10 transition-colors text-left flex items-center gap-1.5 w-full"
                  >
                    <Clock className="w-3.5 h-3.5 text-[#BF5AF2]" />
                    Turno Especial
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Role Tag Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-[#a0aec0] hover:text-white text-xs font-bold bg-[#1A202C] border border-white/5 hover:bg-[#4a5568] px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors outline-none shadow-sm"
          >
            {emp.role}
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          <AnimatePresence>
            {isOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-[115%] w-[150px] bg-[#2D3748] border border-white/10 rounded-[10px] shadow-2xl z-50 overflow-hidden flex flex-col py-1"
                >
                  {SUPPORT_ROLES_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        onUpdateRole(opt);
                        setIsOpen(false);
                      }}
                      className="px-3.5 py-2 text-[12px] font-semibold text-white hover:bg-[#FF6B00] hover:text-white transition-colors text-left"
                    >
                      {opt}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function SpecialShiftSlot({
  emp,
  index,
  allDepartments,
  onUpdate,
  onTransfer
}: { key?: string | number; emp: Employee; index: number; allDepartments: Department[];
  onUpdate: (field: keyof Employee, value: string) => void;
  onTransfer: (targetDeptId: string) => void;
}) {

  return (
    <div className="w-[250px] shrink-0 h-[100px] bg-[#111217] rounded-2xl border border-white/5 shadow-sm p-3 flex flex-col justify-between relative group hover:border-[#BF5AF2]/30 transition-colors">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center min-w-0">
          <div className="w-6 h-6 rounded-full bg-[#BF5AF2]/20 text-[#BF5AF2] flex items-center justify-center mr-2 shrink-0">
            <User className="w-3 h-3" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col min-w-0">
            <input
              type="text"
              value={emp.name}
              onChange={(e) => onUpdate('name', e.target.value.toUpperCase())}
              className="font-bold text-[12px] text-white bg-transparent outline-none w-[130px] truncate uppercase leading-none"
              placeholder="NOME SOBRENOME"
            />
            {emp.tagType && (
              <span 
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate('tagType', emp.tagType === 'MAQUINISTA' ? 'OOF' : 'MAQUINISTA');
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
            onClick={(e) => { e.stopPropagation(); onTransfer(emp.originalDeptId || 'recepcao'); }}
            className="h-[24px] px-1.5 font-bold text-white bg-gradient-to-r from-[#FF9F0A] to-[#FF6B00] rounded shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 text-[9px] whitespace-nowrap"
          >
            TURNO 7H
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 mt-auto">
        {emp.tagType === 'OOF' ? (
          <div className="flex flex-col items-center">
            <input
              type="text"
              list="oof-options"
              value={emp.line}
              onChange={(e) => onUpdate('line', e.target.value.toUpperCase())}
              placeholder="LOCAL DE APOIO"
              className="h-[26px] px-2 rounded-md text-[10px] font-bold w-[120px] text-center uppercase placeholder-white/40 focus:outline-none bg-[#FF6B00] text-white shadow-sm border-none"
            />
            <datalist id="oof-options">
              <option value="RECEPÇÃO" />
              <option value="VIRADOR" />
              <option value="CLASSIFICAÇÃO" />
              <option value="FORMAÇÃO" />
            </datalist>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center">
              <input
                type="text"
                value={emp.line}
                onChange={(e) => onUpdate('line', e.target.value.toUpperCase())}
                placeholder="LINHA"
                className="h-[26px] px-1 rounded-md text-[10px] font-bold w-[70px] text-center uppercase placeholder-white/30 focus:outline-none bg-[#FF6B00] text-white shadow-sm border-none"
              />
            </div>
            <div className="flex flex-col items-center">
              <input
                type="text"
                value={emp.machine}
                onChange={(e) => onUpdate('machine', e.target.value.toUpperCase())}
                placeholder="LOCO"
                className="h-[26px] px-1 rounded-md text-[10px] font-bold w-[70px] text-center uppercase placeholder-white/30 focus:outline-none bg-[#10B981] text-white shadow-sm border-none"
              />
            </div>
          </>
        )}
      </div>

    </div>
  );
}


