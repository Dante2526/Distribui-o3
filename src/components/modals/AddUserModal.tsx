import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserPlus, X, ArrowLeft } from 'lucide-react';
import { useViewportStyles } from '../../hooks/useViewportStyles';

export function AddUserModal({
  isOpen,
  onClose,
  onAddUser,
  isDarkMode,
  onBack
}: {
  isOpen: boolean;
  onClose: () => void;
  onAddUser: (name: string, matricula: string, sectorId: string) => void;
  isDarkMode: boolean;
  onBack?: () => void;
}) {
  const [name, setName] = useState('');
  const [matricula, setMatricula] = useState('');
  const [sectorId, setSectorId] = useState('maquinista');
  const [continueAdding, setContinueAdding] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const viewportStyles = useViewportStyles(isOpen);

  // Efeito adicional para o foco no input
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => nameInputRef.current?.focus(), 150);
    } else {
      setName('');
      setMatricula('');
    }
  }, [isOpen]);

  const isViewportBackdrop = !!viewportStyles.backdrop.position;

  const handleClose = () => {
    setName('');
    setMatricula('');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !matricula.trim()) return;
    
    onAddUser(name, matricula, sectorId);
    
    if (continueAdding) {
      setName('');
      setMatricula('');
      setTimeout(() => nameInputRef.current?.focus(), 100);
    } else {
      handleClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={isViewportBackdrop ? "flex items-center justify-center p-4 overflow-hidden z-[100]" : "fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden"}
          style={isViewportBackdrop ? {
            ...viewportStyles.backdrop,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(6px)',
          } : {
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(6px)',
          }}
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`rounded-[32px] shadow-2xl w-full max-w-[390px] p-6 md:p-8 relative mx-4 flex flex-col transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-[#1E2029] border border-white/10 text-white' 
                : 'bg-white border border-gray-100 text-[#1F2937]'
            } max-h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`}
            style={isViewportBackdrop ? viewportStyles.card : {}}
            onClick={(e) => e.stopPropagation()}
          >
        <button
          onClick={onBack || handleClose}
          className={`absolute top-4 left-4 w-10 h-10 rounded-full flex items-center justify-center z-10 transition-colors cursor-pointer ${
            isDarkMode ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
          }`}
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
        </button>

        <button
          onClick={handleClose}
          className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center z-10 transition-colors cursor-pointer ${
            isDarkMode ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
          }`}
        >
          <X className="w-5 h-5" strokeWidth={2.5} />
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
            <span className="text-[10px] md:text-[11px] whitespace-nowrap text-[#FFD60A] font-bold block px-1 mt-0.5">
              *Coloque apenas o primeiro nome e o último sobrenome
            </span>
          </div>

          <div className="flex flex-col gap-1.5 text-left">
            <input
              type="text"
              required
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
      </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
