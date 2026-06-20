import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Settings, PieChart, Bell } from 'lucide-react';

const PainelDSSIcon = ({ className }: { className?: string }) => (
  <img src="/painel-dss-icon.svg" alt="Painel DSS" className={className} />
);

const DistribuicaoIcon = ({ className }: { className?: string }) => (
  <img src="/favicon.svg" alt="Distribuição" className={className} />
);

const EcossistemaMentalIcon = ({ className }: { className?: string }) => (
  <img src="/ecossistema-mental-icon.svg" alt="Ecossistema Mental" className={className} />
);

interface RadialMenuProps {
  activePage: string;
  onPageChange: (page: string, e?: React.MouseEvent, externalUrl?: string) => void;
  isDarkMode: boolean;
}

export function RadialMenu({ activePage, onPageChange, isDarkMode }: RadialMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const menuItems = [
    { id: 'painel-dss', icon: PainelDSSIcon, label: 'Painel DSS' },
    { id: 'ecossistema-mental', icon: EcossistemaMentalIcon, label: 'Ecossistema' },
  ];

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleItemClick = (id: string, e: React.MouseEvent, externalUrl?: string) => {
    onPageChange(id, e, externalUrl);
    setIsOpen(false);
  };

  // Com apenas 2 botões, 90 graus coloca um na ponta direita (0º) e outro totalmente pra baixo (90º)
  const radius = 100; 
  const totalAngle = 90; // em graus
  
  return (
    <div className="relative z-50 flex items-center justify-center" ref={containerRef}>
      {/* Botões do Menu Radial */}
      <AnimatePresence>
        {isOpen && menuItems.map((item, index) => {
          // O usuário quer eles mais próximos, mas mantendo o círculo e sem sobrepor.
          // Com 2 botões e raio de 100, uma separação de 45 graus é perfeita (gap de ~20px).
          // Vamos abrir um no ângulo 45º (Diagonal Direita/Baixo) e outro no 90º (Baixo).
          const angleDeg = 45 + ((45 / (menuItems.length - 1)) * index);
          const angleRad = (angleDeg * Math.PI) / 180;
          
          const x = Math.cos(angleRad) * radius;
          const y = Math.sin(angleRad) * radius;
          
          const isActive = activePage === item.id;
          const Icon = item.icon;

          return (
            <motion.button
              key={item.id}
              initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
              animate={{ x, y, scale: 1, opacity: 1 }}
              exit={{ x: 0, y: 0, scale: 0, opacity: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 260, 
                damping: 20, 
                delay: index * 0.03 // Efeito cascata
              }}
              onClick={(e) => handleItemClick(item.id, e)}
              title={item.label}
              className={`absolute w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-xl transition-colors outline-none group ${
                isActive 
                  ? (isDarkMode ? 'bg-[#111217] text-[#BF5AF2] border border-[#BF5AF2]/30' : 'bg-[#eef2f7] text-[#007aff] border border-[#007aff]/30')
                  : (isDarkMode ? 'bg-[#1E2029] text-gray-300 hover:bg-[#2A2D3A] border border-white/10' : 'bg-white text-gray-600 hover:bg-gray-100 border border-black/10')
              }`}
            >
              <Icon className="w-6 h-6" />
              
              {/* Tooltip on hover */}
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/80 text-white text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-md">
                {item.label}
              </div>
            </motion.button>
          );
        })}
      </AnimatePresence>

      {/* Favicon Principal (Botão Central) */}
      <motion.button
        onClick={toggleMenu}
        className="relative z-10 w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-blue-500/30"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <img 
          src="/favicon.svg" 
          alt="Menu de Navegação" 
          className="w-full h-full drop-shadow-md"
        />
        
        {/* Glow animado quando aberto */}
        {isOpen && (
          <motion.div 
            className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </motion.button>
    </div>
  );
}
