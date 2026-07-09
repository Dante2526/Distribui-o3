import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Administrator } from "../../types";
import { Save, X } from "lucide-react";

export const EditAdminModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  admin: Administrator | null;
  onEditAdmin: (
    id: string,
    name: string,
    email: string,
    matricula: string,
    nivel: string,
  ) => Promise<void>;
  isDarkMode: boolean;
}> = ({ isOpen, onClose, onBack, admin, onEditAdmin, isDarkMode }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [matricula, setMatricula] = useState("");
  const [nivel, setNivel] = useState("1");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (admin && isOpen) {
      setName(admin.name);
      setEmail(admin.email);
      setMatricula(admin.matricula);
      setNivel(admin.nivel || "1");
      setErrorMsg("");
    }
  }, [admin, isOpen]);

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admin) return;
    if (!name.trim() || !email.trim() || !matricula.trim()) {
      setErrorMsg("Preencha todos os campos obrigatórios.");
      return;
    }
    setErrorMsg("");
    await onEditAdmin(
      admin.id,
      name.trim().toUpperCase(),
      email.trim().toLowerCase(),
      matricula.trim(),
      nivel,
    );
    if (onBack) onBack();
    else onClose();
  };

  if (!isOpen || !admin) return null;

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
                Editar ADM
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
              <form
                noValidate
                onSubmit={handleEdit}
                className="flex flex-col gap-4"
              >
                <input
                  type="text"
                  placeholder="Nome Completo *"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`${inputClassName} uppercase`}
                />
                <input
                  type="email"
                  placeholder="E-mail Corporativo *"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClassName}
                />
                <input
                  type="text"
                  placeholder="Matrícula *"
                  value={matricula}
                  onChange={(e) => setMatricula(e.target.value)}
                  className={inputClassName}
                />

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Nível de Acesso
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNivel("1")}
                      className={`p-3 rounded-lg border-2 text-left transition-colors flex flex-col gap-1 ${
                        nivel === "1"
                          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-sm"
                          : "border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 bg-transparent"
                      }`}
                    >
                      <span
                        className={`font-bold ${nivel === "1" ? "text-indigo-600 dark:text-indigo-400" : "text-gray-700 dark:text-gray-300"}`}
                      >
                        Nível 1
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Acesso Padrão
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNivel("2")}
                      className={`p-3 rounded-lg border-2 text-left transition-colors flex flex-col gap-1 ${
                        nivel === "2"
                          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-sm"
                          : "border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 bg-transparent"
                      }`}
                    >
                      <span
                        className={`font-bold ${nivel === "2" ? "text-indigo-600 dark:text-indigo-400" : "text-gray-700 dark:text-gray-300"}`}
                      >
                        Nível 2
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Super ADM
                      </span>
                    </button>
                  </div>
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
                  <Save className="w-5 h-5" />
                  SALVAR ALTERAÇÕES
                </button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
