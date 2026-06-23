import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eraser, FileText, UserPlus, Repeat, Hourglass, Clock, CirclePause, CirclePlay, MousePointer, HelpCircle, Eye, EyeOff, X } from 'lucide-react';
import { ExchangeIcon } from '../CustomIcons';
import { useViewportStyles } from '../../hooks/useViewportStyles';

const DEFAULT_HASH = 'bb5a8c3679034435aacba22a202ba4af1866d5c67bb6aa227462eb9320b9aa55'; // adm2025
const EXPECTED_HASH = import.meta.env.VITE_ADMIN_PASSWORD_HASH ?? DEFAULT_HASH;

async function sha256(message: string) {
  if (!crypto || !crypto.subtle) {
    console.warn("crypto.subtle não disponível (ambiente não seguro).");
    return null;
  }
  try {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    console.error("Erro ao gerar hash SHA-256", err);
    return null;
  }
}

export function AdminModal({
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
  onLogin: () => void;
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
  const [visibleIndex, setVisibleIndex] = useState(-1);
  const timerRef = useRef<any>(null);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const maskScrollRef = useRef<HTMLDivElement>(null);

  const viewportStyles = useViewportStyles(isOpen);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    
    if (val.length > password.length) {
      setVisibleIndex(val.length - 1);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setVisibleIndex(-1);
      }, 1000);
    } else {
      setVisibleIndex(-1);
    }
    
    setPassword(val);
  };

  const toggleShowPassword = () => {
    if (showPassword) {
      setVisibleIndex(-1);
    }
    setShowPassword(!showPassword);
  };

  const handleClose = () => {
    setPassword('');
    setVisibleIndex(-1);
    setError('');
    setShowPassword(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const enteredHash = await sha256(password);
      const legacyPassword = import.meta.env.VITE_ADMIN_PASSWORD;

      // Fallback para quando o crypto.subtle não está disponível (ex: acesso via IP no celular)
      const isFallbackValid = !enteredHash && password === 'adm2025';

      if (
        (enteredHash && enteredHash === EXPECTED_HASH) || 
        (legacyPassword && password === legacyPassword) || 
        isFallbackValid
      ) {
        setPassword('');
        setVisibleIndex(-1);
        onLogin();
      } else {
        setError('Senha incorreta! Digite tudo em minúsculo.');
        onLoginError();
      }
    } catch (err) {
      console.error(err);
      setError('Erro ao validar senha. Verifique a conexão.');
      onLoginError();
    }
  };

  const isViewportBackdrop = !!viewportStyles.backdrop.position;

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
            className={`rounded-[24px] shadow-2xl w-full text-center relative flex flex-col transition-colors duration-300 ${
              isAdmin ? 'max-w-[448px] px-4 py-4 md:px-8 md:py-8' : 'max-w-[370px] px-4 py-6 md:p-8'
            } max-h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${
              isDarkMode 
                ? 'bg-[#1E2029] border border-white/10 text-white' 
                : 'bg-white border border-gray-100 text-[#1F2937]'
            }`}
            style={isViewportBackdrop ? viewportStyles.card : {}}
            onClick={(e) => e.stopPropagation()}
          >
        <button
          onClick={handleClose}
          className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center z-10 transition-colors cursor-pointer ${
            isDarkMode ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
          }`}
        >
          <X className="w-5 h-5" strokeWidth={2.5} />
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
          // Painel de opções do administrador
          <>
            <div className="shrink-0 mb-4 mt-6 md:mt-2 px-6">
              <h2 className={`text-[18px] md:text-[20px] font-black uppercase tracking-wide text-center ${
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
                  className="flex flex-col items-center justify-center p-3 gap-1.5 bg-[#14B8A6] hover:bg-[#0D9488] text-white rounded-xl transition-all duration-300 shadow-md h-[86px] md:h-[82px] hover:-translate-y-1 hover:scale-[1.03] hover:shadow-lg active:scale-[0.98] transform cursor-pointer"
                >
                  <div className="scale-[0.85] md:scale-90 origin-bottom">
                    <ExchangeIcon className="w-7 h-7 text-white" />
                  </div>
                  <span className="font-bold text-[10px] md:text-xs uppercase tracking-wider text-center leading-tight">IMPORTAR COLAB.</span>
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
          // Formulário de login
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
                    className={`text-base w-full p-4 pr-10 rounded-xl outline-none focus:ring-1 focus:ring-[#FF6B00] focus:border-[#FF6B00] font-mono transition-all relative z-10 ${
                      isDarkMode 
                        ? `bg-[#111217] border border-white/10 placeholder-white/30 ${showPassword ? 'text-white' : 'text-transparent'}` 
                        : `bg-[#F3F4F6] border border-gray-200 placeholder-gray-400 ${showPassword ? 'text-gray-900' : 'text-transparent'}`
                    }`}
                    autoFocus
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    onScroll={(e) => {
                      if (maskScrollRef.current) {
                        maskScrollRef.current.style.transform = `translateX(-${e.currentTarget.scrollLeft}px)`;
                      }
                    }}
                  />
                  {!showPassword && password.length > 0 && (
                    <div 
                      className={`text-base absolute inset-y-0 left-4 right-10 flex items-center pointer-events-none z-20 overflow-hidden`}
                    >
                      <div
                        ref={maskScrollRef}
                        className={`font-mono whitespace-nowrap flex items-center h-full ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                        style={{ 
                          lineHeight: '1',
                          letterSpacing: 'normal'
                        }}
                      >
                        {password.split('').map((char, index) => (
                          <span key={index}>
                            {index === visibleIndex ? char : '●'}
                          </span>
                        ))}
                      </div>
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
                {error && (
                  <span className="text-xs text-[#FF453A] font-bold text-left mt-2 block px-1 animate-pulse">
                    {error}
                  </span>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-[#FF9F0A] to-[#FF6B00] text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-[#FF6B00]/30"
              >
                ENTRAR
              </button>
            </form>
          </>
        )}
      </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
