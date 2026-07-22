import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Clock,
  User,
  ArrowRight,
  FileText,
  ChevronDown,
  X,
  ArrowLeft,
  ClipboardList,
} from "lucide-react";
import { MovementLog } from "../../types";
import { useViewportStyles } from "../../hooks/useViewportStyles";

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: MovementLog[];
  isDarkMode: boolean;
  onBack?: () => void;
}

export function AuditLogModal({
  isOpen,
  onClose,
  logs,
  isDarkMode,
  onBack,
}: AuditLogModalProps) {
  const viewportStyles = useViewportStyles(isOpen);
  const isViewportBackdrop = !!viewportStyles.backdrop.position;

  // Estado para controlar quais agrupamentos est+�o expandidos
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {},
  );

  const toggleGroup = (employeeName: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [employeeName]: !prev[employeeName],
    }));
  };

  // Agrupar as movimenta+�+�es por funcion+�rio
  const groupedLogs = useMemo(() => {
    const groups: Record<string, MovementLog[]> = {};
    logs.forEach((log) => {
      if (!groups[log.employeeName]) {
        groups[log.employeeName] = [];
      }
      groups[log.employeeName].push(log);
    });

    // Converter para array e ordenar
    return Object.values(groups)
      .map((groupLogs) => {
        // Ordenar os logs internos do mais recente para o mais antigo
        const sortedMovements = [...groupLogs].sort(
          (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
        );

        return {
          employeeName: sortedMovements[0].employeeName,
          movements: sortedMovements,
          count: sortedMovements.length,
          lastMove: sortedMovements[0].timestamp.getTime(),
        };
      })
      .sort((a, b) => b.lastMove - a.lastMove); // Ordenar os grupos pelo mais recente
  }, [logs]);

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
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`rounded-[32px] shadow-2xl w-full max-w-[800px] flex flex-col relative overflow-hidden transition-colors duration-300 ${
              isDarkMode
                ? "bg-[#1E2029] border border-white/10 text-white"
                : "bg-white border border-gray-100 text-[#1F2937]"
            }`}
            style={
              isViewportBackdrop ? viewportStyles.card : { maxHeight: "90vh" }
            }
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 md:p-6 md:px-8 md:pt-8 shrink-0 flex items-start md:items-center gap-3 md:gap-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className={`w-8 h-8 md:w-10 md:h-10 shrink-0 -ml-1 md:-ml-2 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                    isDarkMode
                      ? "hover:bg-white/10 text-gray-400 hover:text-white"
                      : "hover:bg-gray-200 text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <ArrowLeft
                    className="w-4 h-4 md:w-5 md:h-5"
                    strokeWidth={2.5}
                  />
                </button>
              )}
              <div className="w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-xl md:rounded-2xl bg-gradient-to-br from-[#d904ff] to-[#bd00de] flex items-center justify-center shadow-lg shadow-[#bd00de]/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-[#bd00de]/50 hover:scale-105">
                <ClipboardList
                  className="w-5 h-5 md:w-6 md:h-6 text-white"
                  strokeWidth={2.5}
                />
              </div>
              <div className="flex-1 min-w-0 pt-0.5 md:pt-0">
                <h2 className="text-[16px] leading-[1.1] md:leading-normal md:text-2xl font-black uppercase tracking-wide">
                  LOG DE AUDITORIA
                </h2>
                <p
                  className={`text-[11px] md:text-sm mt-1 font-medium leading-tight md:leading-normal ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  Registro agrupado por funcionário
                </p>
              </div>
              <button
                onClick={onClose}
                className={`w-8 h-8 md:w-10 md:h-10 shrink-0 rounded-full flex items-center justify-center transition-colors ${
                  isDarkMode
                    ? "hover:bg-white/10 text-gray-400 hover:text-white"
                    : "hover:bg-gray-200 text-gray-500 hover:text-gray-700"
                }`}
              >
                <X className="w-4 h-4 md:w-5 md:h-5" strokeWidth={2.5} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:px-8 md:pb-6 floating-scrollbar">
              {groupedLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="relative group flex justify-center mb-6 mt-4">
                    <div className="absolute -inset-1 bg-gradient-to-r from-#6366F1 to-#4F46E5 rounded-full blur opacity-45 group-hover:opacity-75 transition duration-500 animate-pulse"></div>
                    <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-#6366F1 to-#4F46E5 flex items-center justify-center shadow-xl transform group-hover:scale-105 transition-all duration-300">
                      <FileText className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold">Nenhuma movimentação</h3>
                  <p
                    className={`text-sm mt-2 max-w-[250px] mx-auto ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    As alterações feitas nos cartões aparecerão aqui.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {groupedLogs.map((group) => {
                    const isExpanded = expandedGroups[group.employeeName];
                    const lastDataFormatada = dateTimeFormatter.format(
                      new Date(group.lastMove),
                    );

                    return (
                      <div
                        key={group.employeeName}
                        className={`rounded-[16px] overflow-hidden transition-all ${
                          isDarkMode
                            ? "bg-white/5 border border-white/5"
                            : "bg-gray-50 border border-gray-100 shadow-sm"
                        }`}
                      >
                        {/* Summary Header (Clickable) */}
                        <div
                          onClick={() => toggleGroup(group.employeeName)}
                          className={`p-4 md:p-5 flex items-center justify-between cursor-pointer transition-colors hover:bg-black/5 ${
                            isDarkMode
                              ? "hover:bg-white/5"
                              : "hover:bg-gray-200/50"
                          }`}
                        >
                          <div className="flex items-center gap-3 md:gap-4 min-w-0">
                            <div
                              className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${
                                isDarkMode
                                  ? "bg-[#d904ff]/20 text-[#e879f9]"
                                  : "bg-[#d904ff]/10 text-[#d904ff]"
                              }`}
                            >
                              <User className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-[15px] md:text-base truncate">
                                {group.employeeName}
                              </span>
                              <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-0.5">
                                <span
                                  className={`text-[10px] md:text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full whitespace-nowrap ${
                                    isDarkMode
                                      ? "bg-white/10 text-gray-300"
                                      : "bg-gray-200 text-gray-700"
                                  }`}
                                >
                                  {group.count}{" "}
                                  {group.count === 1
                                    ? "Movimentação"
                                    : "Movimentações"}
                                </span>
                                <span
                                  className={`text-[11px] md:text-xs whitespace-nowrap ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                                >
                                  Última às {lastDataFormatada}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div
                            className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center transition-transform duration-300 ml-2 ${
                              isExpanded ? "rotate-180" : ""
                            } ${isDarkMode ? "bg-white/10 text-gray-400" : "bg-gray-200 text-gray-500"}`}
                          >
                            <ChevronDown className="w-5 h-5" />
                          </div>
                        </div>

                        {/* Expanded Movements List */}
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: "easeInOut" }}
                            >
                              <div
                                className={`border-t p-4 space-y-3 ${
                                  isDarkMode
                                    ? "border-white/5 bg-black/20"
                                    : "border-gray-100 bg-white/50"
                                }`}
                              >
                                {group.movements.map((log) => {
                                  const horaFormatada = timeFormatter.format(
                                    log.timestamp,
                                  );

                                  const isLocationMovement =
                                    log.from
                                      .toUpperCase()
                                      .startsWith("LINHA:") ||
                                    log.from
                                      .toUpperCase()
                                      .startsWith("LOCO:") ||
                                    log.to.toUpperCase().startsWith("LINHA:") ||
                                    log.to.toUpperCase().startsWith("LOCO:");

                                  return (
                                    <div
                                      key={log.id}
                                      className={`p-3 rounded-[12px] flex flex-col md:flex-row md:items-center gap-2 md:gap-3 ${
                                        isDarkMode
                                          ? "bg-white/5"
                                          : "bg-white shadow-sm border border-gray-100"
                                      }`}
                                    >
                                      {/* Hora e ADM Respons+�vel (Mobile) */}
                                      <div className="flex items-center justify-between w-full md:w-auto md:min-w-[90px]">
                                        <div className="flex items-center gap-2 shrink-0">
                                          <div
                                            className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? "bg-[#d904ff]" : "bg-[#d904ff]"}`}
                                          ></div>
                                          <span className="font-bold text-sm">
                                            {horaFormatada}
                                          </span>
                                        </div>
                                        {/* ADM Respons+�vel Mobile Only */}
                                        <div className="flex items-center gap-1 md:hidden">
                                          <span
                                            className={`text-[9px] font-bold uppercase tracking-wider ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
                                          >
                                            POR
                                          </span>
                                          <span className="text-[11px] font-semibold">
                                            {log.adminName}
                                          </span>
                                        </div>
                                      </div>

                                      {/* De -> Para e Info (Linha/Loco) */}
                                      <div className="flex-1 flex items-center gap-2 text-sm flex-wrap py-1">
                                        {/* Coluna da Origem + Tags */}
                                        <div className="flex flex-col gap-1.5 min-w-0">
                                          <span
                                            className={`px-2.5 py-1 rounded-md font-medium text-[11px] uppercase tracking-wider text-center w-full block whitespace-nowrap ${
                                              isDarkMode
                                                ? "bg-white/10 text-gray-300"
                                                : "bg-gray-100 text-gray-700"
                                            }`}
                                          >
                                            {log.from}
                                          </span>

                                          {!isLocationMovement &&
                                            (log.linha || log.loco) && (
                                              <div className="flex items-center gap-1.5 w-full mt-1">
                                                {log.linha && (
                                                  <span
                                                    className={`flex-1 text-center whitespace-nowrap text-[9px] font-bold uppercase tracking-wider px-1 py-0.5 rounded ${isDarkMode ? "bg-white/5 text-gray-400" : "bg-gray-100 text-gray-500"}`}
                                                  >
                                                    L: {log.linha}
                                                  </span>
                                                )}
                                                {log.loco && (
                                                  <span
                                                    className={`flex-1 text-center whitespace-nowrap text-[9px] font-bold uppercase tracking-wider px-1 py-0.5 rounded ${isDarkMode ? "bg-white/5 text-gray-400" : "bg-gray-100 text-gray-500"}`}
                                                  >
                                                    LOCO: {log.loco}
                                                  </span>
                                                )}
                                              </div>
                                            )}
                                        </div>

                                        <ArrowRight
                                          className={`w-3 h-3 shrink-0 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
                                        />

                                        <span
                                          className={`px-2.5 py-1 rounded-md font-medium text-[11px] uppercase tracking-wider h-fit ${
                                            isDarkMode
                                              ? "bg-[#d904ff]/20 text-[#e879f9]"
                                              : "bg-[#d904ff]/10 text-[#d904ff]"
                                          }`}
                                        >
                                          {log.to}
                                        </span>
                                      </div>

                                      {/* ADM Respons+�vel (Desktop Only) */}
                                      <div className="hidden md:flex shrink-0 items-center gap-2 justify-end">
                                        <div className="flex flex-col text-right">
                                          <span
                                            className={`text-[9px] font-bold uppercase tracking-wider ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
                                          >
                                            POR
                                          </span>
                                          <span className="text-xs font-semibold">
                                            {log.adminName}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
