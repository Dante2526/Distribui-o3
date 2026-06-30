import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, CheckCircle2, Download, FileText, Hourglass, UserMinus, ArrowLeft } from 'lucide-react';
import { useViewportStyles } from '../../hooks/useViewportStyles';
import { StatCard } from '../StatCard';

export function ReportModal({
  isOpen,
  onClose,
  reportText,
  stats,
  isDarkMode
}: {
  isOpen: boolean;
  onClose: () => void;
  reportText: string;
  stats?: any;
  isDarkMode: boolean;
  onBack?: () => void;
}) {
  const viewportStyles = useViewportStyles(isOpen);
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    console.log("Baixar clicado");
  };

  const isViewportBackdrop = !!viewportStyles.backdrop.position;

  const today = new Date();
  const dateFormatted = today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={isViewportBackdrop ? "flex items-center justify-center p-4 overflow-hidden z-[110]" : "fixed inset-0 z-[110] flex items-center justify-center p-4 overflow-hidden"}
          style={isViewportBackdrop ? {
            ...viewportStyles.backdrop,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(6px)',
          } : {
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(6px)',
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`rounded-[16px] shadow-2xl w-full max-w-[420px] relative flex flex-col overflow-hidden transition-colors duration-300 bg-[#1C1D24] text-white`}
            style={{ 
              ...(isViewportBackdrop ? viewportStyles.card : {}),
              maxHeight: '90vh'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {onBack && (
              <button
                onClick={onBack}
                className="absolute top-4 left-4 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
              </button>
            )}
            
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" strokeWidth={2.5} />
            </button>

            <div className="pt-8 pb-4 flex flex-col items-center">
              <h2 className="text-[20px] md:text-[22px] font-black uppercase tracking-wider text-white">RELATÓRIO DIÁRIO</h2>
              <div className="text-[#6C7280] font-medium text-[13px] mt-2 mb-4">
                {dateFormatted}
              </div>
              <div className="w-[85%] h-px bg-white/10"></div>
            </div>

            <div className="px-5 md:px-6 py-2 overflow-y-auto flex-1 flex flex-col gap-6 hide-scrollbar">
              
              {/* Stats Cards Row (Copiado do PAINEL-DSS) */}
              {stats && (
                <div className="flex gap-3">
                  {/* PRESENTES CARD (Blue) */}
                  <div className="flex-1 bg-blue-900/20 p-3 rounded-xl border border-blue-800 text-center relative overflow-hidden group flex flex-col items-center justify-center transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03] hover:shadow-xl hover:shadow-blue-500/20 active:scale-[0.96] active:shadow-xl active:shadow-blue-500/40 active:bg-blue-800/30 transform cursor-pointer lg:cursor-default">
                    <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                      <FileText className="w-16 h-16 text-blue-600" />
                    </div>
                    
                    <div className="text-[10px] font-bold text-white bg-blue-500 px-2.5 py-1 rounded-md w-fit mb-3 relative z-10 uppercase tracking-wider mx-auto shadow-sm">
                      ATIVOS
                    </div>
                    
                    <div className="relative z-10 flex flex-col items-center justify-center">
                      <span className="text-[9px] uppercase text-gray-400 block font-bold mb-1">Total</span>
                      <span className="text-4xl font-black text-white leading-none drop-shadow-md">{stats.presentes}</span>
                    </div>
                  </div>

                  {/* AUSENTES CARD (Amber/Yellow) */}
                  <div className="flex-1 bg-amber-900/20 p-3 rounded-xl border border-amber-800 text-center relative overflow-hidden group flex flex-col items-center justify-center transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03] hover:shadow-xl hover:shadow-amber-500/20 active:scale-[0.96] active:shadow-xl active:shadow-amber-500/40 active:bg-amber-800/30 transform cursor-pointer lg:cursor-default">
                    <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                      <Hourglass className="w-16 h-16 text-amber-600" />
                    </div>
                    
                    <div className="text-[10px] font-bold text-white bg-amber-500 px-2.5 py-1 rounded-md w-fit mb-3 relative z-10 uppercase tracking-wider mx-auto shadow-sm">
                      AUSENTES
                    </div>
                    
                    <div className="relative z-10 flex flex-col items-center justify-center">
                      <span className="text-[9px] uppercase text-gray-400 block font-bold mb-1">Total</span>
                      <span className="text-4xl font-black text-white leading-none drop-shadow-md">{stats.ausentes}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Métricas Quadradas (Estilo Ausentes) */}
              {stats && (
                <div className="grid grid-cols-4 gap-1 w-fit mx-auto mt-[-5px]">
                  <div className="bg-[#FF9F0A]/10 border border-[#FF9F0A]/20 rounded-lg py-1 px-1 w-[64px] flex flex-col items-center justify-center shadow-sm">
                    <span className="text-[16px] font-black tracking-tight mb-0 text-[#FF9F0A]">{stats.ferias || 0}</span>
                    <span className="text-[8px] uppercase font-bold tracking-wider text-[#FF9F0A]/80">Férias</span>
                  </div>
                  <div className="bg-[#FF453A]/10 border border-[#FF453A]/20 rounded-lg py-1 px-1 w-[64px] flex flex-col items-center justify-center shadow-sm">
                    <span className="text-[16px] font-black tracking-tight mb-0 text-[#FF453A]">{stats.fora || 0}</span>
                    <span className="text-[8px] uppercase font-bold tracking-wider text-[#FF453A]/80">Fora</span>
                  </div>
                  <div className="bg-[#FFD60A]/10 border border-[#FFD60A]/20 rounded-lg py-1 px-1 w-[64px] flex flex-col items-center justify-center shadow-sm">
                    <span className="text-[16px] font-black tracking-tight mb-0 text-[#FFD60A]">{stats.atm || 0}</span>
                    <span className="text-[8px] uppercase font-bold tracking-wider text-[#FFD60A]/80">ATM</span>
                  </div>
                  <div className="bg-[#BF5AF2]/10 border border-[#BF5AF2]/20 rounded-lg py-1 px-1 w-[64px] flex flex-col items-center justify-center shadow-sm">
                    <span className="text-[16px] font-black tracking-tight mb-0 text-[#BF5AF2]">{stats.restricao || 0}</span>
                    <span className="text-[8px] uppercase font-bold tracking-wider text-[#BF5AF2]/80">Restrição</span>
                  </div>
                  <div className="bg-[#30D158]/10 border border-[#30D158]/20 rounded-lg py-1 px-1 w-[64px] flex flex-col items-center justify-center shadow-sm">
                    <span className="text-[16px] font-black tracking-tight mb-0 text-[#30D158]">{stats.estagio || 0}</span>
                    <span className="text-[8px] uppercase font-bold tracking-wider text-[#30D158]/80">Estágio</span>
                  </div>
                  <div className="bg-[#FF453A]/10 border border-[#FF453A]/20 rounded-lg py-1 px-1 w-[64px] flex flex-col items-center justify-center shadow-sm">
                    <span className="text-[16px] font-black tracking-tight mb-0 text-[#FF453A]">{stats.inss || 0}</span>
                    <span className="text-[8px] uppercase font-bold tracking-wider text-[#FF453A]/80">INSS</span>
                  </div>
                  <div className="bg-[#0A84FF]/10 border border-[#0A84FF]/20 rounded-lg py-1 px-1 w-[64px] flex flex-col items-center justify-center shadow-sm">
                    <span className="text-[16px] font-black tracking-tight mb-0 text-[#0A84FF]">{stats.treinamento || 0}</span>
                    <span className="text-[8px] uppercase font-bold tracking-wider text-[#0A84FF]/80">Treinam.</span>
                  </div>
                  <div className="bg-[#32ADE6]/10 border border-[#32ADE6]/20 rounded-lg py-1 px-1 w-[64px] flex flex-col items-center justify-center shadow-sm">
                    <span className="text-[16px] font-black tracking-tight mb-0 text-[#32ADE6]">{stats.revezamento || 0}</span>
                    <span className="text-[8px] uppercase font-bold tracking-wider text-[#32ADE6]/80">Revezam.</span>
                  </div>
                </div>
              )}

              {/* Lista de Ausentes (Chips) */}
              {stats && stats.afastadosList && stats.afastadosList.length > 0 && (
                <div className="flex flex-col items-center mt-2 w-full">
                  <div className="flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-[#FF9500]/10 border border-[#FF9500]/25 shadow-sm shadow-[#FF9500]/5">
                    <UserMinus className="w-3.5 h-3.5 text-[#FF9500]" />
                    <span className="text-[11px] font-extrabold text-[#FF9500] uppercase tracking-widest">
                      Colaboradores Afastados
                    </span>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 w-full max-w-[95%]">
                    {stats.afastadosList.map((nome: string, i: number) => (
                      <div 
                        key={i} 
                        className="px-3 py-1.5 rounded-full border border-[#FFD60A]/20 bg-[#FFD60A]/5 text-[10px] font-bold text-[#FFD60A] uppercase tracking-wider transition-all duration-300 hover:bg-[#FFD60A]/10 hover:border-[#FFD60A]/40 hover:scale-[1.03] cursor-default flex items-center gap-1.5"
                      >
                        <div className="w-1 h-1 rounded-full bg-[#FFD60A]/70"></div>
                        {nome}
                      </div>
                    ))}
                  </div>
                </div>
              )}


            </div>

            {/* Footer Buttons */}
            <div className="px-6 py-4 pb-6 flex gap-3 mt-auto">
              <button
                onClick={handleCopy}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all shadow-md text-sm ${
                  copied 
                    ? 'bg-[#30D158] text-white border-transparent' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    COPIADO
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    COPIAR
                  </>
                )}
              </button>
              <button
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-all shadow-md text-sm"
              >
                <Download className="w-5 h-5" />
                BAIXAR
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
