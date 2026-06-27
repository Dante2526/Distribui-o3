import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ExchangeIcon } from '../CustomIcons';
import { useViewportStyles } from '../../hooks/useViewportStyles';
import { X, Search, Check, ArrowLeft, Users } from 'lucide-react';
import { Employee, Department, TurmaType } from '../../types';
import { firestoreService } from '../../services/firestoreService';

interface ImportEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (employee: Employee, sourceTurma: string, destTurma: string) => void;
  departments?: Department[];
  isDarkMode: boolean;
  destTurma?: string;
  onBack?: () => void;
}

export const ImportEmployeeModal: React.FC<ImportEmployeeModalProps> = ({
  isOpen,
  onClose,
  onImport,
  isDarkMode,
  destTurma,
  onBack
}) => {
  const [sourceTurma, setSourceTurma] = useState('');
  const [isTurmaDropdownOpen, setIsTurmaDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployeeName, setSelectedEmployeeName] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const mouseDownInsideCard = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const viewportStyles = useViewportStyles(isOpen);
  const isViewportBackdrop = !!viewportStyles.backdrop.position;
  const dropdownRef = useRef<HTMLDivElement>(null);
  const turmaDropdownRef = useRef<HTMLDivElement>(null);

  const [dssEmployees, setDssEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    if (sourceTurma) {
      // Mapeia 'Turma A' -> 'A'
      const turmaType = sourceTurma.replace('Turma ', '') as TurmaType;
      firestoreService.fetchEmployeesDSS(turmaType).then(emps => {
        setDssEmployees(emps);
      });
    } else {
      setDssEmployees([]);
    }
  }, [sourceTurma]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (turmaDropdownRef.current && !turmaDropdownRef.current.contains(event.target as Node)) {
        setIsTurmaDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClose = () => {
    setSourceTurma('');
    setSearchQuery('');
    setSelectedEmployeeName('');
    setSelectedEmployee(null);
    setIsDropdownOpen(false);
    setIsTurmaDropdownOpen(false);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEmployee && sourceTurma) {
      onImport(selectedEmployee, sourceTurma, destTurma || 'Turma B');
      handleClose();
    }
  };

  const destTurmaFinal = destTurma || 'Turma B';
  const availableTurmas = ['Turma A', 'Turma B', 'Turma C', 'Turma D'].filter(t => t !== destTurmaFinal);

  const filteredEmployees = useMemo(() => {
    if (!sourceTurma) return [];
    return dssEmployees.filter(emp =>
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.matricula.includes(searchQuery)
    );
  }, [searchQuery, sourceTurma, dssEmployees]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isViewportBackdrop ? '' : 'backdrop-blur-sm'}`}
          style={isViewportBackdrop ? viewportStyles.backdrop : { backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
          onMouseDown={(e) => {
            // Só marca para fechar se o clique começou direto no fundo escuro
            if ((e.target as HTMLElement) === e.currentTarget) {
              handleClose();
            }
          }}
        >
          <motion.div
            ref={cardRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`rounded-[32px] shadow-2xl w-full max-w-[390px] min-h-[420px] relative mx-4 flex flex-col py-6 transition-colors duration-300 ${
              isDarkMode
                ? 'bg-[#1E2029] border border-white/10 text-white'
                : 'bg-white border border-gray-100 text-[#1F2937]'
            } max-h-[90vh]`}
            style={isViewportBackdrop ? viewportStyles.card : {}}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Botões fixos no topo */}
            <button
              onClick={onBack || handleClose}
              className={`absolute top-4 left-4 w-10 h-10 rounded-full flex items-center justify-center z-20 transition-colors cursor-pointer ${
                isDarkMode ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
              }`}
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
            </button>

            <button
              onClick={handleClose}
              className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center z-20 transition-colors cursor-pointer ${
                isDarkMode ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
              }`}
            >
              <X className="w-5 h-5" strokeWidth={2.5} />
            </button>

            {/* Ícone central Fixo (Reduzido) */}
            <div className="flex justify-center mb-1 mt-4">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full blur opacity-45 group-hover:opacity-75 transition duration-500 animate-pulse"></div>
                <div className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-teal-600 to-cyan-500 flex items-center justify-center shadow-xl transform group-hover:scale-105 transition-all duration-300">
                  <ExchangeIcon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="text-center mb-2">
              <h2 className="text-lg font-bold uppercase tracking-wide">Importar Colaborador</h2>
            </div>

            {/* Conteúdo com scroll de segurança (mas que não vai ativar em telas normais agora) */}
            <div className="overflow-y-auto floating-scrollbar flex-1 px-6 mb-2">
              <form onSubmit={handleSubmit} className="space-y-3 text-left">

                {/* Turma de Origem */}
                <div className="space-y-1.5 relative" ref={turmaDropdownRef}>
                  <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Turma de Origem
                  </label>
                  <div
                    className={`w-full p-3.5 rounded-xl border flex justify-between items-center cursor-pointer transition-colors ${
                      isDarkMode
                        ? 'bg-[#111217] border-white/5 hover:border-teal-500/30 text-white'
                        : 'bg-[#F3F4F6] border-transparent hover:border-teal-500/30 text-[#1F2937]'
                    }`}
                    onClick={() => setIsTurmaDropdownOpen(!isTurmaDropdownOpen)}
                  >
                    <span className={`flex-1 flex justify-center ${sourceTurma ? '' : (isDarkMode ? 'text-gray-500' : 'text-gray-400')}`}>
                      {sourceTurma ? (
                        <div className="flex items-center justify-center gap-2">
                          <Users className="w-4 h-4 opacity-70" />
                          {sourceTurma}
                        </div>
                      ) : (
                        'Selecione a turma...'
                      )}
                    </span>
                    <motion.div animate={{ rotate: isTurmaDropdownOpen ? 180 : 0 }}>
                      <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                        <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </motion.div>
                  </div>

                  <AnimatePresence>
                    {isTurmaDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className={`absolute z-50 left-0 right-0 mt-1 rounded-xl shadow-xl overflow-hidden border ${
                          isDarkMode ? 'bg-[#1E2029] border-white/10' : 'bg-white border-gray-200'
                        }`}
                      >
                        {availableTurmas.map(turma => (
                          <div
                            key={turma}
                            className={`relative p-3.5 cursor-pointer flex justify-center items-center transition-colors ${
                              sourceTurma === turma
                                ? (isDarkMode ? 'bg-teal-500/20 text-teal-400' : 'bg-teal-50 text-teal-600')
                                : (isDarkMode ? 'hover:bg-white/5 text-gray-300' : 'hover:bg-gray-50 text-gray-700')
                            }`}
                            onClick={() => {
                              setSourceTurma(turma);
                              setIsTurmaDropdownOpen(false);
                              setSearchQuery('');
                              setSelectedEmployeeName('');
                              setSelectedEmployee(null);
                            }}
                          >
                            <div className="flex items-center justify-center gap-2">
                              <Users className={`w-4 h-4 ${sourceTurma === turma ? '' : 'opacity-60'}`} />
                              <span className="font-medium">{turma}</span>
                            </div>
                            {sourceTurma === turma && <Check className="w-4 h-4 absolute right-3.5" />}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Campo Colaborador */}
                <div className="space-y-1.5 relative" ref={dropdownRef}>
                  <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Colaborador
                  </label>
                  <div className={`relative flex items-center transition-all duration-300 rounded-xl border ${
                    isDarkMode
                      ? 'bg-[#111217] border-white/5 focus-within:border-teal-500/50 focus-within:ring-1 focus-within:ring-teal-500/50'
                      : 'bg-[#F3F4F6] border-transparent focus-within:border-teal-500/50 focus-within:ring-1 focus-within:ring-teal-500/50 focus-within:bg-white'
                  }`}>
                    <Search className={`absolute left-3.5 w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    <input
                      type="text"
                      required
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value.toUpperCase());
                        setSelectedEmployeeName('');
                        setSelectedEmployee(null);
                        if (sourceTurma) setIsDropdownOpen(true);
                      }}
                      onFocus={() => sourceTurma && setIsDropdownOpen(true)}
                      disabled={!sourceTurma}
                      className={`w-full py-3.5 pl-10 pr-4 bg-transparent outline-none text-[13px] sm:text-sm font-medium transition-colors ${
                        !sourceTurma ? (isDarkMode ? 'opacity-50 cursor-not-allowed' : 'opacity-60 cursor-not-allowed') : ''
                      } ${isDarkMode ? 'text-white placeholder-gray-600' : 'text-[#1F2937] placeholder-gray-400'}`}
                      placeholder={sourceTurma ? 'Pesquisar por nome ou matrícula...' : 'Selecione a turma primeiro'}
                    />
                  </div>

                  {isDropdownOpen && sourceTurma && (
                    <div className={`w-full mt-2 rounded-xl border overflow-hidden py-2 transition-all ${
                      isDarkMode ? 'bg-[#111217] border-white/10' : 'bg-[#F3F4F6] border-gray-200'
                    }`}>
                      <div className="max-h-32 overflow-y-auto floating-scrollbar px-2">
                          {filteredEmployees.length > 0 ? (
                            filteredEmployees.map(emp => (
                              <div
                                key={emp.matricula}
                                className={`p-3 cursor-pointer rounded-lg mb-1 last:mb-0 transition-colors ${
                                  selectedEmployeeName === emp.name
                                    ? (isDarkMode ? 'bg-teal-500/20 text-teal-400' : 'bg-teal-50 text-teal-600')
                                    : (isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-100')
                                }`}
                                onClick={() => {
                                  setSearchQuery(emp.name);
                                  setSelectedEmployeeName(emp.name);
                                  setSelectedEmployee({
                                    id: Math.random().toString(36).substr(2, 9),
                                    name: emp.name,
                                    matricula: emp.matricula || '',
                                    line: '',
                                    machine: '',
                                    error: false,
                                  });
                                  setIsDropdownOpen(false);
                                }}
                              >
                                <div className="font-bold text-sm">{emp.name}</div>
                                <div className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                  Matrícula: {emp.matricula}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className={`p-4 text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              Nenhum colaborador encontrado na {sourceTurma}
                            </div>
                          )}
                        </div>
                    </div>
                  )}
                </div>

                {/* Botão Importar */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={!selectedEmployeeName}
                    className="w-full py-3.5 bg-gradient-to-r from-[#14B8A6] to-[#0D9488] hover:from-[#0D9488] hover:to-[#0F766E] disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold rounded-xl transition shadow-lg shadow-teal-600/10 active:scale-[0.98] transform uppercase text-sm cursor-pointer"
                  >
                    IMPORTAR PARA {destTurmaFinal.toUpperCase()}
                  </button>
                </div>

              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
