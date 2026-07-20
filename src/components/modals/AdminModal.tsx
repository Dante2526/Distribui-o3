import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Eraser,
  FileText,
  UserPlus,
  Repeat,
  Hourglass,
  Clock,
  CirclePause,
  CirclePlay,
  MousePointer,
  HelpCircle,
  Eye,
  EyeOff,
  X,
  Fingerprint,
  Key,
} from "lucide-react";
import { ExchangeIcon } from "../CustomIcons";
import { useViewportStyles } from "../../hooks/useViewportStyles";
import { firestoreService } from "../../services/firestoreService";
import {
  isMobileCellularWithBiometrics,
  hasRegisteredBiometrics,
  authenticateBiometricAdmin,
  clearBiometricData,
} from "../../services/biometricService";

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
  onShowAuditLog,
  onShowDSSHistory,
  onShowHelp,
  onShowTutorial,
  isDemoMode,
  onToggleDemoMode,
  isDarkMode,
  onChangeAdminPassword,
  hasBiometrics,
  onClearBiometrics,
  adminLevel,
  onOpenManageAdmins,
}: {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  onLogin: (adminData: { name: string; email: string; color?: string }) => void;
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
  onShowAuditLog: () => void;
  onShowDSSHistory: () => void;
  onShowHelp: () => void;
  onShowTutorial: () => void;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
  isDarkMode: boolean;
  onChangeAdminPassword: () => void;
  hasBiometrics?: boolean;
  onClearBiometrics?: () => void;
  adminLevel?: string;
  onOpenManageAdmins?: () => void;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isBioAvailable, setIsBioAvailable] = useState(false);
  const [hasRegisteredBio, setHasRegisteredBio] = useState(false);
  const [showEmail, setShowEmail] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const checkBiometrics = async () => {
        const isCell = await isMobileCellularWithBiometrics();
        const hasBio = hasRegisteredBiometrics();
        setIsBioAvailable(isCell && hasBio);
        setHasRegisteredBio(hasBio);
      };
      checkBiometrics();
    }
  }, [isOpen]);

  const handleBiometricClick = async () => {
    try {
      const authenticatedEmail = await authenticateBiometricAdmin();
      if (authenticatedEmail) {
        const adminData = await firestoreService.verifyAdminLogin(
          authenticatedEmail,
          true,
        );
        if (adminData) {
          onLogin(adminData);
        } else {
          setError("E-mail não encontrado no sistema.");
        }
      }
    } catch (err: any) {
      console.error("Erro na autenticação biométrica:", err);
      setError("Falha ao ler impressão digital. Use o e-mail.");
    }
  };

  const viewportStyles = useViewportStyles(isOpen);

  const handleClose = () => {
    setEmail("");
    setError("");
    setShowEmail(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      // 1. Tenta validar no Firebase (pelo E-mail ou Senha)
      const adminData = await firestoreService.verifyAdminLogin(email, false);

      if (adminData) {
        setEmail("");
        onLogin(adminData);
      } else {
        setError("Credenciais corporativas inválidas.");
        onLoginError();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro ao validar. Verifique a conexão.");
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
          className={
            isViewportBackdrop
              ? "flex items-center justify-center p-4 overflow-hidden z-[100]"
              : "fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden"
          }
          style={
            isViewportBackdrop
              ? {
                  ...viewportStyles.backdrop,
                  backgroundColor: "rgba(0, 0, 0, 0.6)",
                  backdropFilter: "blur(6px)",
                }
              : {
                  backgroundColor: "rgba(0, 0, 0, 0.6)",
                  backdropFilter: "blur(6px)",
                }
          }
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`rounded-[24px] shadow-2xl w-full text-center relative flex flex-col transition-colors duration-300 ${
              isAdmin ? "max-w-[600px] max-h-[85vh]" : "max-w-[370px]"
            } overflow-hidden ${
              isDarkMode
                ? "bg-[#1E2029] border border-white/10 text-white"
                : "bg-white border border-gray-100 text-[#1F2937]"
            }`}
            style={isViewportBackdrop ? viewportStyles.card : {}}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleClose}
              className={`absolute top-2 right-2 md:top-4 md:right-4 w-10 h-10 rounded-full flex items-center justify-center z-20 transition-colors cursor-pointer ${
                isDarkMode
                  ? "bg-[#1E2029]/80 backdrop-blur-sm hover:bg-white/10 text-gray-400 hover:text-white"
                  : "bg-white/80 backdrop-blur-sm hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              }`}
            >
              <X className="w-5 h-5" strokeWidth={2.5} />
            </button>

            {/* Icon */}
            {!isAdmin && (
              <div className="mx-auto mt-8 w-16 h-16 bg-gradient-to-br from-[#FF9F0A] to-[#FF6B00] rounded-2xl flex items-center justify-center mb-0 shadow-lg shadow-[#FF6B00]/30">
                <svg
                  className="w-8 h-8 text-white"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                </svg>
              </div>
            )}

            {isAdmin ? (
              // Painel de opções do administrador
              <div className="flex flex-col min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-8 md:py-8 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-button]:hidden">
                <div className="shrink-0 mb-4 mt-6 md:mt-2 px-6">
                  <h2
                    className={`text-[18px] md:text-[20px] font-black uppercase tracking-wide text-center ${
                      isDarkMode ? "text-white" : "text-[#1F2937]"
                    }`}
                  >
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
                        <Eraser
                          className="w-7 h-7 text-white"
                          strokeWidth={2}
                        />
                      </div>
                      <span className="font-bold text-[10px] md:text-xs uppercase tracking-wider text-center leading-tight mt-1">
                        LIMPAR TUDO
                      </span>
                    </button>

                    {/* RELATÓRIO */}
                    <button
                      onClick={onGenerateReport}
                      className="flex flex-col items-center justify-center p-3 bg-[#3B82F6] hover:bg-[#256FD0] text-white rounded-xl transition-all duration-300 active:scale-[0.98] cursor-pointer shadow-md h-[86px] md:h-[82px]"
                    >
                      <div className="scale-[0.85] md:scale-90 origin-bottom">
                        <FileText
                          className="w-7 h-7 text-white"
                          strokeWidth={2}
                        />
                      </div>
                      <span className="font-bold text-[10px] md:text-xs uppercase tracking-wider text-center leading-tight mt-1">
                        RELATÓRIO
                      </span>
                    </button>

                    {/* ADD USUÁRIO */}
                    <button
                      onClick={onAddUser}
                      className="flex flex-col items-center justify-center p-3 bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-xl transition-all duration-300 active:scale-[0.98] cursor-pointer shadow-md h-[86px] md:h-[82px]"
                    >
                      <div className="scale-[0.85] md:scale-90 origin-bottom">
                        <UserPlus
                          className="w-7 h-7 text-white"
                          strokeWidth={2}
                        />
                      </div>
                      <span className="font-bold text-[10px] md:text-xs uppercase tracking-wider text-center leading-tight mt-1">
                        ADD USUÁRIO
                      </span>
                    </button>

                    {/* IMPORTAR COLAB. */}
                    <button
                      onClick={onImportCollaborator}
                      className="flex flex-col items-center justify-center p-3 gap-1.5 bg-[#14B8A6] hover:bg-[#0D9488] text-white rounded-xl transition-all duration-300 shadow-md h-[86px] md:h-[82px] hover:-translate-y-1 hover:scale-[1.03] hover:shadow-lg active:scale-[0.98] transform cursor-pointer"
                    >
                      <div className="scale-[0.85] md:scale-90 origin-bottom">
                        <ExchangeIcon className="w-7 h-7 text-white" />
                      </div>
                      <span className="font-bold text-[10px] md:text-xs uppercase tracking-wider text-center leading-tight">
                        IMPORTAR COLAB.
                      </span>
                    </button>

                    {/* DESATIVAR 6H / ATIVAR 6H */}
                    <button
                      onClick={onToggle6H}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 active:scale-[0.98] cursor-pointer shadow-md h-[86px] md:h-[82px] text-white ${
                        is6HActive
                          ? "bg-[#EF4444] hover:bg-[#DC2626]"
                          : "bg-[#22C55E] hover:bg-[#16A34A]"
                      }`}
                    >
                      <div className="scale-[0.85] md:scale-90 origin-bottom">
                        <Hourglass
                          className="w-7 h-7 text-white"
                          strokeWidth={2}
                        />
                      </div>
                      <span className="font-bold text-[10px] md:text-xs uppercase tracking-wider text-center leading-tight mt-1">
                        {is6HActive ? "DESATIVAR 6H" : "ATIVAR 6H"}
                      </span>
                    </button>

                    {/* LOG DE AUDITORIA */}
                    <button
                      onClick={onShowAuditLog}
                      className="flex flex-col items-center justify-center p-3 bg-[#d904ff] hover:bg-[#bd00de] text-white rounded-xl transition-all duration-300 active:scale-[0.98] cursor-pointer shadow-md h-[86px] md:h-[82px]"
                    >
                      <div className="scale-[0.85] md:scale-90 origin-bottom">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="32"
                          height="32"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect
                            x="8"
                            y="2"
                            width="8"
                            height="4"
                            rx="1"
                            ry="1"
                          />
                          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                          <path d="M12 11h4" />
                          <path d="M12 16h4" />
                          <path d="M8 11h.01" />
                          <path d="M8 16h.01" />
                        </svg>
                      </div>
                      <span className="font-bold text-[10px] md:text-xs uppercase tracking-wider text-center leading-tight mt-1">
                        LOG DE AUDITORIA
                      </span>
                    </button>

                    {/* HISTÓRICO */}
                    <button
                      onClick={onShowDSSHistory}
                      className="flex flex-col items-center justify-center p-3 bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded-xl transition-all duration-300 active:scale-[0.98] cursor-pointer shadow-md h-[86px] md:h-[82px]"
                    >
                      <div className="scale-[0.85] md:scale-90 origin-bottom">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="32"
                          height="32"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                      </div>
                      <span className="font-bold text-[10px] md:text-xs uppercase tracking-wider text-center leading-tight mt-1">
                        HISTÓRICO
                      </span>
                    </button>

                    {/* PAUSAR AÇÕES / RETOMAR AÇÕES */}
                    <button
                      onClick={onToggleAutomation}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 active:scale-[0.98] cursor-pointer shadow-md h-[86px] md:h-[82px] text-white ${
                        isAutomationPaused
                          ? "bg-[#EF4444] hover:bg-[#DC2626]"
                          : "bg-[#10B981] hover:bg-[#059669]"
                      }`}
                    >
                      <div className="scale-[0.85] md:scale-90 origin-bottom">
                        {isAutomationPaused ? (
                          <CirclePlay
                            className="w-7 h-7 text-white"
                            strokeWidth={2}
                          />
                        ) : (
                          <CirclePause
                            className="w-7 h-7 text-white"
                            strokeWidth={2}
                          />
                        )}
                      </div>
                      <span className="font-bold text-[10px] md:text-xs uppercase tracking-wider text-center leading-tight mt-1">
                        {isAutomationPaused ? "RETOMAR AÇÕES" : "PAUSAR AÇÕES"}
                      </span>
                    </button>

                    <button
                      onClick={onChangeAdminPassword}
                      className="flex flex-col items-center justify-center p-3 bg-gray-700 hover:bg-gray-800 text-white rounded-xl transition-all duration-300 active:scale-[0.98] cursor-pointer shadow-md h-[86px] md:h-[82px]"
                    >
                      <div className="scale-[0.85] md:scale-90 origin-bottom">
                        <Key className="w-7 h-7 text-white" strokeWidth={2} />
                      </div>
                      <span className="font-bold text-[10px] md:text-xs uppercase tracking-wider text-center leading-tight mt-1">
                        MINHA SENHA
                      </span>
                    </button>

                    <button
                      onClick={
                        import.meta.env.DEV ? onToggleDemoMode : undefined
                      }
                      disabled={!import.meta.env.DEV}
                      className={`flex flex-col items-center justify-center p-3 text-white rounded-xl shadow-md h-[86px] md:h-[82px] transition-all duration-300 ${
                        import.meta.env.DEV
                          ? "bg-[#7C3AED] hover:bg-[#6D28D9] active:scale-[0.98] cursor-pointer"
                          : "bg-[#7C3AED] opacity-50 cursor-not-allowed grayscale"
                      }`}
                    >
                      <div className="scale-[0.85] md:scale-90 origin-bottom">
                        <MousePointer
                          className="w-7 h-7 text-white"
                          strokeWidth={2}
                        />
                      </div>
                      <span className="font-bold text-[10px] md:text-xs uppercase tracking-wider text-center leading-tight mt-1">
                        MODO DEMO
                      </span>
                    </button>

                    {/* DESATIVAR DIGITAL */}
                    {hasRegisteredBio && (
                      <button
                        onClick={() => {
                          clearBiometricData();
                          setIsBioAvailable(false);
                          setHasRegisteredBio(false);
                        }}
                        className="flex flex-col items-center justify-center p-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all duration-300 active:scale-[0.98] cursor-pointer shadow-md h-[86px] md:h-[82px]"
                      >
                        <div className="scale-[0.85] md:scale-90 origin-bottom">
                          <Fingerprint
                            className="w-7 h-7 text-white"
                            strokeWidth={2}
                          />
                        </div>
                        <span className="font-bold text-[10px] md:text-xs uppercase tracking-wider text-center leading-tight mt-1">
                          DESATIVAR DIGITAL
                        </span>
                      </button>
                    )}
                    {/* AJUDA / TUTORIAL */}
                    <button
                      onClick={onShowHelp}
                      className="flex flex-col items-center justify-center p-3 bg-[#06B6D4] hover:bg-[#0891B2] text-white rounded-xl transition-all duration-300 active:scale-[0.98] cursor-pointer shadow-md h-[86px] md:h-[82px]"
                    >
                      <div className="scale-[0.85] md:scale-90 origin-bottom">
                        <HelpCircle
                          className="w-7 h-7 text-white"
                          strokeWidth={2}
                        />
                      </div>
                      <span className="font-bold text-[10px] md:text-xs uppercase tracking-wider text-center leading-tight mt-1">
                        AJUDA / TUTORIAL
                      </span>
                    </button>

                    {/* GERENCIAR ADMS - APENAS PARA NIVEL 2 */}
                    {adminLevel === "2" && (
                      <button
                        onClick={onOpenManageAdmins}
                        className="flex flex-col items-center justify-center p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all duration-300 active:scale-[0.98] cursor-pointer shadow-md h-[86px] md:h-[82px]"
                      >
                        <div className="scale-[0.85] md:scale-90 origin-bottom">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="32"
                            height="32"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                          </svg>
                        </div>
                        <span className="font-bold text-[10px] md:text-xs uppercase tracking-wider text-center leading-tight mt-1">
                          GERENCIAR ADMS
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // Formulário de login
              <div className="px-4 py-6 md:p-8">
                <h2
                  className={`text-xl font-bold mb-6 uppercase tracking-wide ${
                    isDarkMode ? "text-white" : "text-[#1F2937]"
                  }`}
                >
                  Acesso Administrativo
                </h2>

                {isBioAvailable && (
                  <div className="flex flex-col gap-3 mb-4 w-full">
                    <button
                      type="button"
                      onClick={handleBiometricClick}
                      className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-cyan-700 flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 active:scale-[0.98] transform transition-all duration-300 py-3.5 text-sm"
                    >
                      <Fingerprint className="w-5 h-5 animate-pulse" />
                      ENTRAR COM DIGITAL
                    </button>
                    <div className="flex items-center justify-center gap-2 opacity-60 my-1 w-full">
                      <span className="h-px bg-gray-300 dark:bg-gray-600 flex-1"></span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider whitespace-nowrap">
                        ou entrar com e-mail
                      </span>
                      <span className="h-px bg-gray-300 dark:bg-gray-600 flex-1"></span>
                    </div>
                  </div>
                )}

                <div className="space-y-4 w-full">
                  <div className="relative flex flex-col gap-4">
                    <div className="relative w-full">
                      <input
                        type="text"
                        placeholder={"E\u200B-mail ou Senha"}
                        name={Math.random().toString()}
                        id={Math.random().toString()}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`text-base w-full p-4 pr-12 rounded-xl outline-none focus:ring-1 focus:ring-[#FF6B00] focus:border-[#FF6B00] transition-all relative z-10 font-mono ${
                          isDarkMode
                            ? "bg-[#111217] border border-white/10 placeholder-white/30 text-white"
                            : "bg-[#F3F4F6] border border-gray-200 placeholder-gray-400 text-gray-900"
                        }`}
                        style={
                          !showEmail && email.length > 0
                            ? ({ WebkitTextSecurity: "disc" } as any)
                            : {}
                        }
                        autoFocus
                        autoComplete="off"
                        data-lpignore="true"
                        data-form-type="other"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck={false}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSubmit(e as any);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowEmail(!showEmail)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 z-20 focus:outline-none"
                        title={showEmail ? "Ocultar Email" : "Exibir Email"}
                      >
                        {showEmail ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    {error && (
                      <span className="text-xs text-[#FF453A] font-bold text-left mt-2 block px-1 animate-pulse">
                        {error}
                      </span>
                    )}
                  </div>

                  <p className="text-yellow-500 text-xs font-semibold text-left px-1">
                    * Digite tudo em minúsculo
                  </p>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="w-full py-3 bg-gradient-to-r from-[#FF9F0A] to-[#FF6B00] text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-[#FF6B00]/30"
                  >
                    ENTRAR
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
