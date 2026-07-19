import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Administrator } from "../../types";
import { Trash2, UserPlus, Edit, X } from "lucide-react";

export const ManageAdminsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  administrators: Administrator[];
  currentAdminEmail: string;
  onOpenAddAdmin: () => void;
  onOpenEditAdmin: (id: string) => void;
  onDeleteAdmin: (
    id: string,
    name?: string,
    matricula?: string,
  ) => Promise<void>;
  isDarkMode: boolean;
}> = ({
  isOpen,
  onClose,
  onBack,
  administrators,
  currentAdminEmail,
  onOpenAddAdmin,
  onOpenEditAdmin,
  onDeleteAdmin,
  isDarkMode,
}) => {
  const [adminToDelete, setAdminToDelete] = useState<Administrator | null>(
    null,
  );

  if (!isOpen) return null;

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
            className={`rounded-[24px] shadow-2xl w-full max-w-[700px] flex flex-col text-center relative ${
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
                Gerenciar ADMs
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

            <div className="flex flex-col space-y-4 p-4 md:p-6">
              <div className="flex justify-center items-center">
                <button
                  onClick={onOpenAddAdmin}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>Novo ADM</span>
                </button>
              </div>

              <div className="max-h-[50vh] overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                {administrators.map((admin) => {
                  const isSuper = admin.nivel === "2";
                  const isMe = admin.email === currentAdminEmail;

                  if (adminToDelete?.id === admin.id) {
                    return (
                      <div
                        key={admin.id}
                        className="flex items-center justify-between p-3 rounded-lg border-2 border-red-500 bg-red-50 dark:bg-red-900/20 shadow-sm transition-all"
                      >
                        <div className="flex flex-col overflow-hidden text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-red-800 dark:text-red-200 truncate">
                              {admin.name}
                            </span>
                            {isSuper && (
                              <span className="bg-red-200 text-red-900 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase whitespace-nowrap border border-red-300">
                                Super ADM
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col gap-1 text-xs text-red-700 dark:text-red-300 mt-1">
                            <span className="truncate">{admin.email}</span>
                            <span>Mat: {admin.matricula}</span>
                            <span className="font-bold text-red-600 dark:text-red-400 mt-1 uppercase">
                              Tem certeza que deseja excluir?
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                          <button
                            onClick={() => setAdminToDelete(null)}
                            className="px-3 py-1.5 bg-gray-500 hover:bg-gray-600 transition-colors text-white rounded font-medium text-xs"
                          >
                            CANCELAR
                          </button>
                          <button
                            onClick={async () => {
                              await onDeleteAdmin(
                                admin.id,
                                admin.name,
                                admin.matricula,
                              );
                              setAdminToDelete(null);
                            }}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 transition-colors text-white rounded font-bold text-xs shadow-md"
                          >
                            EXCLUIR
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={admin.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${isMe ? "border-green-500 bg-green-50 dark:bg-green-900/20" : "border-gray-200 dark:border-gray-700 bg-transparent"} shadow-sm transition-all hover:shadow-md`}
                    >
                      <div className="flex flex-col overflow-hidden text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-bold truncate">
                            {admin.name}
                          </span>
                          {isSuper && (
                            <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase whitespace-nowrap">
                              Super ADM
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <span className="truncate">{admin.email}</span>
                          <span>Mat: {admin.matricula}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => onOpenEditAdmin(admin.id)}
                          className="p-2 rounded-lg transition-all text-white bg-blue-500 hover:bg-blue-600 shadow-sm hover:shadow transform hover:-translate-y-0.5"
                          title="Editar Administrador"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setAdminToDelete(admin)}
                          disabled={isMe}
                          className={`p-2 rounded-lg transition-all text-white shadow-sm hover:shadow transform ${isMe ? "opacity-50 cursor-not-allowed bg-red-400" : "bg-red-500 hover:bg-red-600 hover:-translate-y-0.5"}`}
                          title={
                            isMe
                              ? "Você não pode excluir a si mesmo"
                              : "Excluir Administrador"
                          }
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
