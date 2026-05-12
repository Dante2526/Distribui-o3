import React, { useState } from 'react';
import { Users, LayoutGrid, CheckCircle2, ChevronRight, ChevronDown, Inbox, Layers, UserCog, Trash2, Zap } from 'lucide-react';
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
const initialDepartmentsData: Department[] = [
  {
    id: 'recepcao',
    title: 'Recepção',
    count: 15,
    data: [
      { name: 'LUCIANO', line: 'X3', machine: '238' },
      { name: 'RUFINO', line: 'X2', machine: '231' },
      { name: 'GERALDO', line: 'X2', machine: '220' },
      { name: 'RAFAEL', line: 'X1', machine: '848' },
      { name: 'ARTHUR', line: 'X1', machine: '819' },
      { name: 'WALTERILSON', line: '1º CORTE', machine: '253' },
      { name: 'JOAO SILVA', line: 'X1', machine: '101' },
      { name: 'MARIA SANTOS', line: 'X1', machine: '102' },
      { name: 'CARLOS OLIVEIRA', line: 'X2', machine: '103' },
      { name: 'ANA SOUZA', line: 'X2', machine: '104' },
      { name: 'PEDRO ALVES', line: 'X3', machine: '105' },
      { name: 'PAULA COSTA', line: 'X3', machine: '106' },
      { name: 'LUIZ FERREIRA', line: 'X1', machine: '107' },
      { name: 'FERNANDA LIMA', line: 'X2', machine: '108' },
      { name: 'MARCELO GOMES', line: 'X3', machine: '109' },
    ],
  },
  {
    id: 'classificacao',
    title: 'Classificação',
    count: 15,
    data: [
      { name: 'NAIMARA', line: 'X04', machine: '805', error: true },
      { name: 'DANIELLE', line: 'X04', machine: '257' },
      { name: 'CID', line: 'X04', machine: '259' },
      { name: 'IGOR RABELO', line: 'X04', machine: '3949' },
      { name: 'NAYLAN', line: 'X05', machine: '847' },
      { name: 'HUMBERTO', line: 'X05', machine: '743' },
      { name: 'PEDRO JR', line: 'X05', machine: '712' },
      { name: 'NAYRON', line: 'X05', machine: '284' },
      { name: 'ISAIAS', line: 'PIAL', machine: '-' },
      { name: 'BEATRIZ ROCHA', line: 'X04', machine: '201' },
      { name: 'RICARDO MELO', line: 'X04', machine: '202' },
      { name: 'JULIA PINTO', line: 'X05', machine: '203' },
      { name: 'GABRIEL NUNES', line: 'X05', machine: '204' },
      { name: 'AMANDA BARROS', line: 'PIAL', machine: '205' },
      { name: 'RENATO TEIXEIRA', line: 'PIAL', machine: '206' },
    ],
  },
  {
    id: 'formacao',
    title: 'Formação',
    count: 15,
    data: [
      { name: 'JESSICA', line: 'CTR2', machine: '2003' },
      { name: 'DANIEL', line: 'CTR3', machine: '270' },
      { name: 'GABRIEL', line: '4C', machine: '288' },
      { name: 'PEDRO C.', line: '4C', machine: '260' },
      { name: 'ROSANA', line: '201 B', machine: '277' },
      { name: 'BRUNO HENRIQUE', line: 'CTR2', machine: '301' },
      { name: 'CAMILA QUEIROZ', line: 'CTR3', machine: '302' },
      { name: 'DIEGO SOUZA', line: '4C', machine: '303' },
      { name: 'ELISA VIANA', line: '4C', machine: '304' },
      { name: 'FABIO MOTA', line: '201 B', machine: '305' },
      { name: 'GISELE PAIVA', line: 'CTR2', machine: '306' },
      { name: 'HUGO CARDOSO', line: 'CTR3', machine: '307' },
      { name: 'IRENE MACHADO', line: '4C', machine: '308' },
      { name: 'JORGE LOPES', line: '4C', machine: '309' },
      { name: 'KARINA FARIAS', line: '201 B', machine: '310' },
    ],
  },
];

const supportData: SupportRole[][] = [
  [
    { name: 'BEATRIZ', role: 'MK2' },
    { name: 'AMÉRICO', role: 'VV' },
    { name: 'ESDRAS', role: 'VV' },
    { name: 'LARISSA', role: 'VV' },
  ],
  [
    { name: 'CAMILE', role: 'MIKE 03' },
    { name: 'ALBERTO', role: 'GIROFLEX' },
    { name: 'RICARDO', role: 'GIROFLEX' },
  ],
  [
    { name: 'LUANA', role: 'MIKE 6' },
    { name: 'ROSA', role: 'APOIO MK6' },
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
    <div className="min-h-screen bg-black text-gray-100 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      {/* View Area (One UI prominent header) */}
      <div className="pt-16 pb-8 px-6 md:px-10 max-w-7xl mx-auto flex flex-col items-start gap-4">
        <div className="w-full bg-[#1C1C1E] border border-[#2C2C2E] rounded-[20px] px-6 py-4 shadow-lg">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white">
            Distribuição de Equipes
          </h1>
        </div>
        <div className="bg-[#1C1C1E] border border-[#2C2C2E] rounded-[16px] px-5 py-3.5 inline-flex items-center shadow-sm">
          <p className="text-[#E5E5EA] text-[16px] font-medium tracking-wide">Toque no nome para mover de setor</p>
        </div>
      </div>

      {/* Interaction Area */}
      <div className="px-4 md:px-8 max-w-7xl mx-auto pb-20 space-y-8 block">
        
        {/* Main Departments Grid */}
        <div className="flex overflow-x-auto items-stretch gap-6 pb-6 snap-x snap-mandatory scroll-smooth hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
          <style dangerouslySetInnerHTML={{__html: `
            .hide-scrollbar::-webkit-scrollbar { display: none; }
            .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          `}} />
          {departmentsData.map((dept) => (
            <div key={dept.id} className="w-[90vw] sm:w-[400px] lg:w-1/3 shrink-0 snap-center md:snap-start">
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
          <Users className="text-[#8E8E93] w-6 h-6" />
          <h2 className="text-2xl font-semibold text-white">Apoio (OOF)</h2>
        </div>

        {/* Support Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {supportData.map((group, index) => (
            <SupportCard key={index} roles={group} index={index + 1} />
          ))}
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
    <div className="bg-[#1C1C1E] rounded-[28px] overflow-hidden flex flex-col h-full shadow-lg">
      {/* Card Header */}
      <div className="px-6 py-5 border-b border-[#2C2C2E] flex items-center space-x-4">
        <div className={`w-[52px] h-[52px] shrink-0 rounded-[16px] flex items-center justify-center ${theme.bg} ${theme.color}`}>
          {theme.icon}
        </div>
        <div>
          <h3 className="text-[22px] font-semibold text-white tracking-tight">{department.title}</h3>
          <div className="flex items-center mt-1 text-[15px] font-medium text-[#8E8E93]">
            <span className="flex items-center">
              <LayoutGrid className="w-4 h-4 mr-1.5" />
              MAQ: {department.count}
            </span>
          </div>
        </div>
      </div>

      {/* Table Headers (Simplified for One UI) */}
      <div className="px-6 py-3 flex items-center justify-between bg-[#2C2C2E]/30 text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">
        <div className="flex-1">MAQ</div>
        <div className="flex items-center space-x-3">
          <div className="w-20 text-center">Linha</div>
          <div className="w-20 text-center">Loco</div>
        </div>
      </div>

      {/* List content */}
      <div className="flex-1 p-4 space-y-3 bg-[#121212]/30">
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
      
      {/* Footer count indicator */}
      <div className="px-6 py-4 bg-[#2C2C2E]/20 flex items-center justify-center border-t border-[#2C2C2E]">
        <span className="text-[#34C759] font-medium flex items-center text-[15px]">
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Quant MAQ: {department.count}
        </span>
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
  const [isExpanded, setIsExpanded] = useState(false);
  const otherDepts = allDepartments.filter(d => d.id !== department.id);

  return (
    <div
      onClick={() => setIsExpanded(!isExpanded)}
      className={`relative flex flex-col cursor-pointer rounded-[20px] shadow-sm border border-[#2C2C2E]/60 hover:border-[#8E8E93]/40 transition-all ${
        emp.error ? 'bg-[#3A1414] hover:bg-[#4A1818] border-red-500/50 hover:border-red-500' : 'bg-[#252525] hover:bg-[#2C2C2E]'
      }`}
    >
      {/* Main Row Content */}
      <div className="px-5 py-4 flex items-center justify-between">
        {emp.error && (
          <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-[20px] bg-red-500" />
        )}
        
        {/* Row Content */}
        <div className="flex-1 flex items-center justify-between w-full">
          <div className={`flex items-center px-4 py-2.5 rounded-[14px] shrink min-w-0 mr-3 shadow-md border ${
            emp.error ? 'bg-[#4A1818] border-red-500/30' : 'bg-[#1A1A1C] border-[#2C2C2E]'
          }`}>
            <span className={`font-semibold text-[17px] tracking-wide truncate ${emp.error ? 'text-red-400' : 'text-[#E5E5EA]'}`}>
              {emp.name}
            </span>
          </div>
          
          <div className="flex items-center space-x-2.5 shrink-0">
            <input
              type="text"
              value={emp.line}
              onChange={(e) => onUpdateEmployee('line', e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className={`px-3 py-1.5 rounded-[10px] text-[15px] font-bold w-[65px] text-center shadow-sm placeholder-[#8E8E93]/50 focus:outline-none focus:ring-2 focus:ring-[#8E8E93]/50 ${
                emp.error 
                  ? 'bg-red-500 text-white' 
                  : 'bg-[#1C1C1E] text-[#8E8E93] border border-[#2C2C2E]'
              }`}
            />
            <input
              type="text"
              value={emp.machine}
              onChange={(e) => onUpdateEmployee('machine', e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className={`px-3 py-1.5 rounded-[10px] text-[15px] font-extrabold w-[65px] text-center shadow-sm placeholder-[#FF9F0A]/50 focus:outline-none focus:ring-2 focus:ring-[#FF9F0A]/50 ${
                emp.error 
                  ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                  : 'bg-[#FF9F0A]/15 text-[#FF9F0A] border border-[#FF9F0A]/20'
              }`}
            />
            <ChevronDown className={`w-5 h-5 text-[#8E8E93] ml-1 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </div>

      {/* Accordion Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 flex flex-wrap gap-2 border-t border-[#2C2C2E]/50 mx-2 mt-1">
              {otherDepts.map(d => {
                const theme = getDeptTheme(d.id);
                return (
                  <button
                    key={d.id}
                    onClick={(e) => { e.stopPropagation(); onMove(d.id); setIsExpanded(false); }}
                    className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl shrink-0 transition-transform active:scale-95 mt-3 ${theme.bg} ${theme.color} mix-blend-lighten`}
                  >
                    {React.cloneElement(theme.icon, { className: 'w-[18px] h-[18px]' })}
                    <span className="text-[14px] font-semibold whitespace-nowrap opacity-90">{d.title}</span>
                  </button>
                )
              })}
              
              <button
                onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
                className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl shrink-0 transition-transform active:scale-95 mt-3 bg-[#BF5AF2]/15 text-[#BF5AF2] mix-blend-lighten"
              >
                <Zap className="w-[18px] h-[18px]" />
                <span className="text-[14px] font-semibold whitespace-nowrap opacity-90">TE</span>
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); setIsExpanded(false); }}
                className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl shrink-0 transition-transform active:scale-95 mt-3 bg-red-500/15 text-red-500 mix-blend-lighten"
              >
                <Trash2 className="w-[18px] h-[18px]" />
                <span className="text-[14px] font-semibold whitespace-nowrap opacity-90">Deletar</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SupportCard({ roles, index }: { key?: string | number, roles: SupportRole[], index: number }) {
  return (
    <div className="bg-[#1C1C1E] rounded-[24px] overflow-hidden flex flex-col">
      {/* Support Card Header */}
      <div className="px-5 py-4 border-b border-[#2C2C2E] bg-[#2C2C2E]/20">
        <h4 className="text-[#8E8E93] text-sm uppercase tracking-wider font-semibold">Grupo {index}</h4>
      </div>
      
      {/* Support List */}
      <div className="p-2 space-y-1">
        {roles.map((emp, i) => (
          <div 
            key={i} 
            className="px-4 py-3 flex items-center justify-between rounded-[16px] hover:bg-[#2C2C2E]/50 transition-colors"
          >
            <span className="font-medium text-[16px] text-white">
              {emp.name}
            </span>
            <span className="text-[#8E8E93] text-sm font-medium bg-[#2C2C2E] px-3 py-1 rounded-lg">
              {emp.role}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

