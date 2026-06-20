import React from 'react';
import { Home, Users, Settings, PieChart, Bell, Info } from 'lucide-react';

const PainelDSSIcon = ({ className }: { className?: string }) => (
  <img src="/painel-dss-icon.svg" alt="Painel DSS" className={className} />
);

const DistribuicaoIcon = ({ className }: { className?: string }) => (
  <img src="/favicon.svg" alt="Distribuição" className={className} />
);

const EcossistemaMentalIcon = ({ className }: { className?: string }) => (
  <img src="/ecossistema-mental-icon.svg" alt="Ecossistema Mental" className={className} />
);

interface SidebarProps {
  activePage: string;
  onPageChange: (page: string, e?: React.MouseEvent, externalUrl?: string) => void;
  isDarkMode: boolean;
}

export const Sidebar = React.memo(function Sidebar({ activePage, onPageChange, isDarkMode }: SidebarProps) {
  const menuItems = [
    { id: 'home', icon: DistribuicaoIcon, label: 'Distribuição' },
    { id: 'painel-dss', icon: PainelDSSIcon, label: 'Painel DSS' },
    { id: 'ecossistema-mental', icon: EcossistemaMentalIcon, label: 'Ecossistema' },
    { id: 'relatorios', icon: PieChart, label: 'Relatórios' },
    { id: 'equipes', icon: Users, label: 'Equipes' },
    { id: 'notificacoes', icon: Bell, label: 'Avisos' },
    { id: 'configuracoes', icon: Settings, label: 'Ajustes' },
  ];

  return (
    <div className={`group w-[60px] md:w-[80px] hover:w-[160px] md:hover:w-[180px] hover:delay-150 delay-0 h-fit my-auto shrink-0 flex flex-col gap-4 py-4 z-50 transition-all duration-300 ease-in-out ${isDarkMode ? 'bg-[#1E2029] border-y border-r border-white/5' : 'bg-white border-y border-r border-black/5'} shadow-2xl relative overflow-hidden rounded-r-[24px] md:rounded-r-[32px]`}>
      <div className="flex flex-col gap-1 w-full">
        <button 
          onClick={(e) => onPageChange('circuito001', e)}
          className="w-full h-10 md:h-12 flex items-center justify-center shrink-0 mb-2 transition-all duration-300 cursor-pointer border-none bg-transparent outline-none"
        >
           <img src="/favicon.svg" alt="Logo" className={`w-6 h-6 md:w-8 md:h-8 drop-shadow-md transition-all duration-300 ${isDarkMode ? 'brightness-0 invert opacity-80 group-hover:opacity-100' : 'opacity-80 group-hover:opacity-100'}`} />
        </button>
        <div className={`w-[36px] md:w-[48px] h-px mx-auto mb-2 transition-colors ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`} />
        
        <div className="flex flex-col w-full relative">
          {menuItems.map((item) => {
            const isActive = activePage === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={(e) => onPageChange(item.id, e)}
                className={`relative w-full h-[48px] md:h-[56px] flex items-center justify-center md:justify-start px-[10px] md:px-[16px] transition-all duration-300 outline-none sidebar-item ${isActive ? 'active' : ''}`}
                title={item.label}
              >
                <div className={`w-[40px] h-[40px] md:w-[48px] md:h-[48px] rounded-full flex shrink-0 items-center justify-center transition-all duration-300 z-10 mx-auto md:mx-0 ${
                  isActive 
                    ? `shadow-lg ${isDarkMode ? 'bg-[#111217] text-[#BF5AF2]' : 'bg-[#eef2f7] text-[#007aff]'}`
                    : `hover:bg-black/5 dark:hover:bg-white/5 ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'}`
                }`}>
                  <Icon className={`w-5 h-5 md:w-6 md:h-6 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover/btn:scale-110'}`} />
                </div>
                <span className={`ml-4 whitespace-nowrap font-medium opacity-0 -translate-x-4 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 group-hover:delay-150 delay-0 z-10 ${
                  isActive ? (isDarkMode ? 'text-white' : 'text-black') : (isDarkMode ? 'text-gray-400' : 'text-gray-500')
                }`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col w-full items-center md:items-start px-[10px] md:px-[20px] gap-2">
        <button 
          className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex shrink-0 items-center justify-center transition-all outline-none mx-auto md:mx-0 ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:text-black hover:bg-black/5'}`}
          title="Informações"
        >
          <Info className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      </div>
    </div>
  );
});
