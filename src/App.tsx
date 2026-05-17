import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Users, LayoutGrid, CheckCircle2, ChevronRight, ChevronDown, Inbox, Layers, UserCog, Trash2, Zap, User, ArrowRightLeft, Palmtree, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Data Models ---
type Employee = {
  name: string;
  line: string;
  machine: string;
  error?: boolean;
};

type Department = {
  id: string;
  title: string;
  data: Employee[];
  count: number;
};

type SupportRole = {
  name: string;
  role: string;
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
      { name: 'LUCIANO', line: 'X3', machine: '238' },
      { name: 'RUFINO', line: 'X2', machine: '231' },
      { name: 'GERALDO', line: 'X2', machine: '220' },
      { name: 'RAFAEL', line: 'X1', machine: '848' },
      { name: 'ARTHUR', line: 'X1', machine: '819' },
      { name: 'WALTERILSON', line: '1º CORTE', machine: '253' },
    ],
  },
  {
    id: 'classificacao',
    title: 'Classificação',
    count: 8,
    data: [
      { name: 'NAIMARA', line: 'X04', machine: '805', error: true },
      { name: 'DANIELLE', line: 'X04', machine: '257' },
      { name: 'CID', line: 'X04', machine: '259' },
      { name: 'IGOR RABELO', line: 'X04', machine: '3949' },
      { name: 'NAYLAN', line: 'X05', machine: '847' },
      { name: 'HUMBERTO', line: 'X05', machine: '743' },
      { name: 'PEDRO JR', line: 'X05', machine: '712' },
      { name: 'NAYRON', line: 'X05', machine: '284' },
    ],
  },
  {
    id: 'formacao',
    title: 'Formação',
    count: 5,
    data: [
      { name: 'JESSICA', line: 'CTR2', machine: '2003' },
      { name: 'DANIEL', line: 'CTR3', machine: '270' },
      { name: 'GABRIEL', line: '4C', machine: '288' },
      { name: 'PEDRO C.', line: '4C', machine: '260' },
      { name: 'ROSANA', line: '201 B', machine: '277' },
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
    { name: 'BEATRIZ', role: 'MIKE 02' },
    { name: 'AMÉRICO', role: 'VIRADOR' },
    { name: 'ESDRAS', role: 'VIRADOR' },
    { name: 'LARISSA', role: 'VIRADOR' },
  ],
  [
    { name: 'CAMILE', role: 'MIKE 03' },
    { name: 'ALBERTO', role: 'AUX GIROFLEX' },
    { name: 'RICARDO', role: 'AUX GIROFLEX' },
  ],
  [
    { name: 'LUANA', role: 'MIKE 06' },
    { name: 'ROSA', role: 'AUX X6' },
  ],
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

export default function App() {
  const [departmentsData, setDepartmentsData] = useState<Department[]>(initialDepartmentsData);
  const [supportRolesData, setSupportRolesData] = useState<SupportRole[][]>(initialSupportData);

  // --- Viewport & Scale Refs (Painel DSS Pattern) ---
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const scalableContainerRef = useRef<HTMLDivElement>(null);
  const scaleStateRef = useRef({ currentScale: 1 });
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

    const isMobileView = ('ontouchstart' in window || navigator.maxTouchPoints > 0) || window.innerWidth < 1366;

    if (isMobileView) {
      const oneColumnScale = viewport.clientWidth / 920;
      const finalScale = Math.min(Math.max(oneColumnScale, 0.3), 1.0);
      setScale(finalScale, 0, 0);
    } else {
      setScale(1.0, 0, 0);
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
      if (target.closest('button, input, select, textarea, a, [role="button"]')) return;

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

  return (
    <div className="bg-[#1A202C] text-[#f7fafc] font-sans selection:bg-blue-500/30 overflow-hidden relative">
      {/* Viewport - Scroll Container (Painel DSS Pattern) */}
      <div ref={viewportRef} className="viewport fixed inset-0 bg-[#1A202C]">
        {/* Content Wrapper - Carries the scaled dimensions for scroll area */}
        <div ref={contentWrapperRef} className="origin-top-left">
          {/* Scalable Container - The actual content that gets scaled */}
          <div ref={scalableContainerRef} className="scalable-container w-fit origin-top-left p-8 bg-[#1A202C]">

            {/* Header Card - Painel DSS Style */}
            <div className="bg-[#2D3748] border border-white/5 rounded-3xl p-6 md:p-10 mb-8 shadow-lg flex justify-between items-center w-full transition-colors">
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
              <div className="hidden lg:flex items-center gap-6">
              </div>
            </div>

            {/* Main Content Area */}
            <div className="space-y-8">
              {/* Main Departments Grid - Always 3 columns */}
              <div className="flex gap-6 w-max">
                {departmentsData.map((dept) => (
                  <div key={dept.id} className="w-[500px] shrink-0">
                    <DepartmentCard 
                      department={dept} 
                      allDepartments={departmentsData}
                      onMove={(targetDeptId, empIndex) => handleMove(dept.id, targetDeptId, empIndex)}
                      onUpdateEmployee={handleUpdateEmployeeField}
                      onDelete={handleDelete}
                    />
                  </div>
                ))}
              </div>

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
                      onMoveSupport={handleMoveSupport}
                    />
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// --- Components ---

function DepartmentCard({ 
  department, 
  allDepartments,
  onMove,
  onUpdateEmployee,
  onDelete
}: { 
  department: Department;
  allDepartments: Department[];
  onMove: (targetDeptId: string, empIndex: number) => void;
  onUpdateEmployee: (deptId: string, empIndex: number, field: keyof Employee, value: string) => void;
  onDelete: (deptId: string, empIndex: number) => void;
}) {
  const theme = getDeptTheme(department.id);

  return (
    <div className="bg-[#2D3748] rounded-[24px] overflow-hidden flex flex-col shadow-lg border border-white/[0.02]">
      {/* Cabeçalho do Setor */}
      <div className="px-6 py-5 border-b border-[#1A202C] flex items-center justify-between bg-[#242529]">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center shadow-inner ${theme.bg} ${theme.color}`}>
            {React.cloneElement(theme.icon as React.ReactElement, { className: "w-6 h-6" })}
          </div>
          <h3 className="text-[22px] font-bold text-white tracking-tight uppercase">{department.title}</h3>
        </div>
        <div className="flex items-center text-[#34C759] font-semibold text-[14px] bg-[#34C759]/10 px-4 py-2 rounded-full">
          <CheckCircle2 className="w-4 h-4 mr-2" />
          {department.count} Colab.
        </div>
      </div>

      {/* Área Direita (Grade de Colaboradores) */}
      <div className="flex-1 p-5 bg-[#121212]/30">
        <div className="grid grid-cols-1 gap-4">
          {department.data.map((emp, i) => (
            <EmployeeRow
              key={`${department.id}-${i}-${emp.name}`}
              emp={emp}
              department={department}
              allDepartments={allDepartments}
              onMove={(targetId) => onMove(targetId, i)}
              onUpdateEmployee={(field, value) => onUpdateEmployee(department.id, i, field, value)}
              onDelete={() => onDelete(department.id, i)}
            />
          ))}
        </div>
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
  onDelete
}: {
  key?: string | number;
  emp: Employee;
  department: Department;
  allDepartments: Department[];
  onMove: (targetId: string) => void;
  onUpdateEmployee: (field: keyof Employee, value: string) => void;
  onDelete: () => void;
}) {
  const [showLineDropdown, setShowLineDropdown] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [showTransferMenu, setShowTransferMenu] = useState(false);
  const otherDepts = allDepartments.filter(d => d.id !== department.id);

  return (
    <div
      className={`relative flex flex-col min-h-[140px] justify-between rounded-[14px] shadow-sm transition-all overflow-visible ${
        emp.error ? 'bg-[#3A1414] hover:bg-[#4A1818]' : 'bg-[#1A202C] hover:bg-[#4a5568]'
      }`}
    >
      {/* Main Row Content */}
      <div className="p-3.5 flex flex-col justify-between flex-1 w-full gap-3">
        
        {/* Top Row: Avatar, Nome e Botão de Expandir */}
        <div className="flex items-center justify-between w-full bg-[#2D3748] border border-white/[0.03] p-2.5 rounded-[10px] shadow-sm">
          <div className="flex items-center min-w-0">
            {/* Avatar Container with Pop-up Menu */}
            <div className="relative">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAvatarMenu(!showAvatarMenu);
                }}
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mr-2 shadow-sm hover:scale-105 active:scale-95 transition-all outline-none ${
                  emp.error ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-[#82B1FF] text-[#0D47A1] hover:bg-[#82B1FF]/80'
                }`}
              >
                <User className="w-[15px] h-[15px]" strokeWidth={2.5} />
              </button>

              <AnimatePresence>
                {showAvatarMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={(e) => { e.stopPropagation(); setShowAvatarMenu(false); }}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -5 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-[110%] left-0 w-[120px] bg-[#1A202C] border border-[#FF3B30]/30 rounded-[12px] shadow-xl z-50 overflow-hidden flex flex-col"
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
                  </>
                )}
              </AnimatePresence>
            </div>
            
            <div className="flex flex-col min-w-0">
              <span className={`font-bold text-[14px] tracking-wide truncate uppercase ${emp.error ? 'text-red-400' : 'text-white'}`}>
                {emp.name}
              </span>
              <span className="text-[10px] text-[#A0A0A5] -mt-0.5 font-medium truncate">Matrícula: {emp.machine || 'N/A'}</span>
            </div>
          </div>
          
          {/* Transfer Button */}
          <div className="relative">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowTransferMenu(!showTransferMenu);
              }}
              className={`w-7 h-7 rounded-[6px] flex items-center justify-center shrink-0 ml-1 transition-colors outline-none ${emp.error ? 'bg-red-400/10 text-red-400 hover:bg-red-400/20' : 'bg-white/5 text-[#a0aec0] hover:bg-white/10 hover:text-white'}`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </button>
            
            <AnimatePresence>
              {showTransferMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={(e) => { e.stopPropagation(); setShowTransferMenu(false); }}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-[110%] right-0 w-[180px] bg-[#1A202C] border border-white/10 rounded-[12px] shadow-xl z-50 overflow-hidden flex flex-col py-1"
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
                          className="flex items-center px-3.5 py-1.5 text-[12px] font-semibold text-white hover:bg-[#4a5568] transition-colors w-full text-left"
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
                      onClick={(e) => { e.stopPropagation(); setShowTransferMenu(false); }}
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
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom Row: Inputs "X3" e "238" menores */}
        <div className="flex items-center justify-center gap-3 w-full mt-auto" onClick={(e) => e.stopPropagation()}>
          <div className="flex flex-col items-center relative">
            <input
              type="text"
              value={emp.line}
              onFocus={() => setShowLineDropdown(true)}
              onBlur={() => setTimeout(() => setShowLineDropdown(false), 200)}
              onChange={(e) => {
                onUpdateEmployee('line', e.target.value);
                setShowLineDropdown(true);
              }}
              className="h-[34px] px-2 rounded-[8px] text-[13px] font-bold w-[95px] sm:w-[110px] text-center uppercase placeholder-white/50 focus:outline-none bg-[#FF6B00] text-white shadow-sm border-none hover:bg-[#E66000] transition-all relative z-10"
            />
            <span className="text-[9px] text-[#a0aec0] uppercase font-bold tracking-wider mt-1">Linha</span>

            {/* Menu Suspenso Customizado (Combobox) */}
            <AnimatePresence>
              {showLineDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-[38px] left-1/2 -translate-x-1/2 w-[130px] max-h-[150px] overflow-y-auto bg-[#2D3748] border border-white/10 rounded-[8px] shadow-2xl z-50 flex flex-col py-1 hide-scrollbar"
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
              )}
            </AnimatePresence>
          </div>
          <div className="flex flex-col items-center">
            <input
              type="text"
              value={emp.machine}
              onChange={(e) => onUpdateEmployee('machine', e.target.value)}
              className="h-[34px] px-2 rounded-[8px] text-[13px] font-bold w-[95px] sm:w-[110px] text-center uppercase placeholder-white/50 focus:outline-none bg-[#F59E0B] text-white shadow-sm border-none hover:bg-[#D97706] transition-all"
            />
            <span className="text-[9px] text-[#a0aec0] uppercase font-bold tracking-wider mt-1">Loco</span>
          </div>
        </div>
      </div>

    </div>
  );
}

function SupportCard({ 
  roles, 
  groupIndex, 
  onUpdateRole,
  onMoveSupport
}: { 
  roles: SupportRole[]; 
  groupIndex: number; 
  onUpdateRole: (groupIndex: number, empIndex: number, newRole: string) => void;
  onMoveSupport: (sourceGroupIndex: number, targetGroupIndex: number, empIndex: number) => void;
}) {
  return (
    <div className="bg-[#2D3748] rounded-[24px] overflow-hidden flex flex-col">
      {/* Support Card Header */}
      <div className="px-5 py-4 border-b border-[#1A202C] bg-[#1A202C]/20">
        <h4 className="text-[#a0aec0] text-sm uppercase tracking-wider font-semibold">Grupo {groupIndex + 1}</h4>
      </div>
      
      {/* Support List */}
      <div className="p-2 space-y-1">
        {roles.map((emp, i) => (
          <SupportRoleRow 
            key={i} 
            emp={emp} 
            groupIndex={groupIndex}
            onUpdateRole={(newRole) => onUpdateRole(groupIndex, i, newRole)} 
            onMove={(targetGroupIndex) => onMoveSupport(groupIndex, targetGroupIndex, i)}
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
  onMove
}: { 
  emp: SupportRole; 
  groupIndex: number;
  onUpdateRole: (newRole: string) => void;
  onMove: (targetGroupIndex: number) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  
  const groupsList = [0, 1, 2].filter(g => g !== groupIndex);
  
  return (
    <div className="px-4 py-2.5 flex items-center justify-between rounded-[16px] hover:bg-[#1A202C]/50 transition-colors relative">
      <span className="font-medium text-[15px] text-white">
        {emp.name}
      </span>
      <div className="flex items-center gap-2 relative">
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
                  className="absolute right-0 top-[115%] w-[150px] bg-[#2D3748] border border-white/10 rounded-[10px] shadow-2xl z-50 overflow-hidden flex flex-col py-1"
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

