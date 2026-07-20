import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Utensils } from "lucide-react";

const PainelDSSIcon = ({ className }: { className?: string }) => (
  <img src="/painel-dss-icon.svg" alt="Painel DSS" className={className} />
);

const EcossistemaMentalIcon = ({ className }: { className?: string }) => (
  <img
    src="/ecossistema-mental-icon.svg"
    alt="Ecossistema Mental"
    className={className}
  />
);

const CircuitoIcon = () => (
  <img
    src="/circuito-logo.png"
    alt="Circuito 001"
    className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover shadow-sm"
  />
);

const RefeicaoIcon = () => (
  <div className="absolute inset-0 rounded-full flex items-center justify-center border-[3px] border-[#10B981] box-border">
    <Utensils className="w-1/2 h-1/2 text-[#10B981]" strokeWidth={2.5} />
  </div>
);

// Constante estática — não é recriada a cada render
const menuItems = [
  { id: "painel-dss", icon: PainelDSSIcon, label: "Painel DSS" },
  {
    id: "ecossistema-mental",
    icon: EcossistemaMentalIcon,
    label: "Ecossistema",
  },
  { id: "circuito001", icon: CircuitoIcon, label: "Circuito 001" },
  { id: "controles-equipes", icon: RefeicaoIcon, label: "Controle Refeição" },
];

interface RadialMenuProps {
  activePage: string;
  onPageChange: (page: string, e?: React.MouseEvent) => void;
  isDarkMode: boolean;
}

export const RadialMenu = React.memo(function RadialMenu({
  activePage,
  onPageChange,
  isDarkMode,
}: RadialMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const toggleMenu = useCallback(() => setIsOpen((prev) => !prev), []);

  const handleItemClick = useCallback(
    (id: string, e: React.MouseEvent) => {
      onPageChange(id, e);
      setIsOpen(false);
    },
    [onPageChange],
  );

  // Ponto exato de equilíbrio: raio 135 (meio termo entre o grudado 120 e o distante 150)
  // Espalhando de 35º a 110º (75 graus totais)
  const radius = 135;

  return (
    <div
      className="relative z-50 flex items-center justify-center"
      ref={containerRef}
    >
      {/* Botões do Menu Radial */}
      <AnimatePresence>
        {isOpen &&
          menuItems.map((item, index) => {
            // Espalhando de 35º até 110º (75 graus de abertura)
            const angleDeg = 35 + (75 / (menuItems.length - 1)) * index;
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
                  delay: index * 0.03, // Efeito cascata
                }}
                onClick={(e) => handleItemClick(item.id, e)}
                title={item.label}
                className={`absolute w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-xl transition-colors outline-none group ${
                  isActive
                    ? isDarkMode
                      ? "bg-[#111217] text-[#BF5AF2] border border-[#BF5AF2]/30"
                      : "bg-[#eef2f7] text-[#007aff] border border-[#007aff]/30"
                    : isDarkMode
                      ? "bg-[#1E2029] text-gray-300 hover:bg-[#2A2D3A] border border-white/10"
                      : "bg-white text-gray-600 hover:bg-gray-100 border border-black/10"
                }`}
              >
                <Icon className="w-9 h-9 md:w-10 md:h-10 object-contain drop-shadow-sm" />

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
});
