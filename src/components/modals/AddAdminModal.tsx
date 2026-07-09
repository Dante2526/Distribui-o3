import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Info, UserPlus, X } from "lucide-react";

export const AddAdminModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  onAddAdmin: (
    name: string,
    email: string,
    matricula: string,
    nivel: string,
    senha?: string,
  ) => Promise<void>;
  isDarkMode: boolean;
}> = ({ isOpen, onClose, onBack, onAddAdmin, isDarkMode }) => {
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newMatricula, setNewMatricula] = useState("");
  const [newNivel, setNewNivel] = useState("1");
  const [newSenha, setNewSenha] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [showWarningCard, setShowWarningCard] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!newName.trim() || !newEmail.trim() || !newMatricula.trim()) {
      setErrorMsg("Preencha todos os campos obrigatórios.");
      return;
    }

    if (newMatricula.trim().length !== 8) {
      setShowWarningCard(true);
      return;
    }

    await onAddAdmin(
      newName.trim().toUpperCase(),
      newEmail.trim().toLowerCase(),
      newMatricula.trim(),
      newNivel,
      newSenha.trim(),
    );
    setNewName("");
    setNewEmail("");
    setNewMatricula("");
    setNewNivel("1");
    setNewSenha("");
    setErrorMsg("");
    setShowWarningCard(false);
    if (onBack) onBack();
    else onClose();
  };

  if (!isOpen) return null;

  const inputClassName = `w-full p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm border transition-colors ${
    isDarkMode
      ? "bg-[#111217] border-gray-700 text-white placeholder-gray-500"
      : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400"
  }`;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(6px)",
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`rounded-[24px] shadow-2xl w-full max-w-[400px] flex flex-col text-center relative ${
              isDarkMode
                ? "bg-[#1E2029] border border-white/10 text-white"
                : "bg-white border border-gray-100 text-[#1F2937]"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-200 dark:border-gray-800">
              {onBack ? (
                <button
                  onClick={onBack}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>
              ) : (
                <div></div>
              )}
              <h2 className="text-xl font-bold uppercase tracking-wide">
                Novo ADM
              </h2>
              <button
                onClick={onClose}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  isDarkMode
                    ? "hover:bg-white/10 text-gray-400 hover:text-white"
                    : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                }`}
              >
                <X className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </div>

            <div className="p-4 md:p-6 text-left">
              {showWarningCard ? (
                <div className="space-y-6 text-center flex flex-col items-center">
                  <h2 className="text-xl font-bold uppercase mb-2">
                    FORMATO DE MATRÍCULA
                  </h2>
                  <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-2 text-blue-500">
                    <Info className="w-8 h-8" />
                  </div>
                  <div className="text-lg font-medium flex flex-col items-center gap-2">
                    <span>
                      Toda matrícula tem <strong>8 dígitos</strong>.
                    </span>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-xl w-full border border-gray-200 dark:border-gray-600">
                    <p className="text-sm">
                      <span className="block font-bold mb-2 text-blue-500 uppercase text-xs tracking-wider">
                        Aviso
                      </span>
                      Se você é da <strong>Velha Guarda</strong>, adicione{" "}
                      <strong className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded text-black dark:text-white">
                        01
                      </strong>{" "}
                      na frente dos demais números para completar os 8 dígitos.
                    </p>
                  </div>
                  <div className="w-full mt-4">
                    <button
                      type="button"
                      onClick={() => setShowWarningCard(false)}
                      className="w-full py-4 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-lg transition-all"
                    >
                      ENTENDI E VOU CORRIGIR
                    </button>
                  </div>
                </div>
              ) : (
                <form
                  noValidate
                  onSubmit={handleAdd}
                  className="flex flex-col gap-4"
                >
                  <input
                    type="text"
                    placeholder="Nome Completo *"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className={`${inputClassName} uppercase`}
                  />
                  <input
                    type="email"
                    placeholder="E-mail *"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className={inputClassName}
                  />
                  <input
                    type="text"
                    placeholder="Matrícula *"
                    value={newMatricula}
                    onChange={(e) =>
                      setNewMatricula(e.target.value.replace(/[^0-9]/g, ""))
                    }
                    className={inputClassName}
                    inputMode="numeric"
                    maxLength={8}
                  />
                  <input
                    type="text"
                    placeholder="Senha (Opcional)"
                    value={newSenha}
                    onChange={(e) => setNewSenha(e.target.value)}
                    className={inputClassName}
                  />

                  <div className="flex flex-col gap-1 mt-2">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase ml-1">
                      Nível de Acesso *
                    </label>
                    <select
                      value={newNivel}
                      onChange={(e) => setNewNivel(e.target.value)}
                      className={inputClassName}
                    >
                      <option value="1">1 - ADM Comum</option>
                      <option value="2">2 - Super ADM</option>
                    </select>
                  </div>

                  {errorMsg && (
                    <div className="text-red-500 text-sm font-bold text-center mt-2 bg-red-100 dark:bg-red-900/30 p-2 rounded">
                      {errorMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-5 h-5" />
                    CADASTRAR
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
