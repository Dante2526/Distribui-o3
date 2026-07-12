import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { flushSync } from "react-dom";
import { Shield, Users, Clock, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  DndContext,
  pointerWithin,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  Modifier,
  useDroppable,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

import {
  Employee,
  Department,
  SupportRole,
  AnnotationItem,
  AnnotationGroup,
  ActiveEdit,
  StatusType,
  MovementLog,
} from "./types";

// Constantes e Dados Iniciais
const EMPTY_OBJECT = Object.freeze({});
const NOOP = () => {};

import {
  initialDepartmentsData,
  initialSupportData,
  initialAnnotationsLeft,
  initialAnnotationsRight,
} from "./constants/data";
import { firestoreService } from "./services/firestoreService";
import {
  isMobileCellularWithBiometrics,
  hasRegisteredBiometrics,
  clearBiometricData,
} from "./services/biometricService";
import { signInToFirebase } from "./lib/firebase";
import { TurmaSelectionScreen } from "./components/TurmaSelectionScreen";
import ThemeSelectionScreen from "./components/ThemeSelectionScreen";
import type { TurmaType } from "./types";
import { generateDailyReportPDF } from "./utils/pdfGenerator";

// Componentes
import { ErrorBoundary } from "./components/ErrorBoundary";
import { StatCard } from "./components/StatCard";
import { ExchangeIcon, HelpIcon } from "./components/CustomIcons";
import { SpecialShiftSlot } from "./components/SpecialShiftSlot";
import { DepartmentCard } from "./components/DepartmentCard";
import { SupportCard } from "./components/SupportCard";
import { AnnotationsBoard } from "./components/AnnotationsBoard";
import { AdminModal } from "./components/modals/AdminModal";
import { AddUserModal } from "./components/modals/AddUserModal";
import { ImportEmployeeModal } from "./components/modals/ImportEmployeeModal";
import { HistoryModal } from "./components/modals/HistoryModal";
import { ReportModal } from "./components/modals/ReportModal";
import { ConfirmBiometricModal } from "./components/modals/ConfirmBiometricModal";
import { AdminPasswordModal } from "./components/modals/AdminPasswordModal";
import { Sidebar } from "./components/Sidebar";
import { RadialMenu } from "./components/RadialMenu";
import Footer from "./components/Footer";

// Components extraídos que são usados no DragOverlay
import { EmployeeRow } from "./components/EmployeeRow";
import { SupportRoleRow } from "./components/SupportRoleRow";
import { ModalsContainer } from "./components/modals/ModalsContainer";
import { useDashboardData } from "./hooks/useDashboardData";

// Componente Wrapper Droppable para o Turno 6H
const SpecialShiftContainer = ({
  children,
  is6HActive,
  isEmpty,
}: {
  children: React.ReactNode;
  is6HActive: boolean;
  isEmpty: boolean;
}) => {
  const { setNodeRef } = useDroppable({
    id: "special-shift",
  });

  if (!is6HActive) return null;

  return (
    <div
      ref={setNodeRef}
      className={`special-shift-card bg-[#1E2029] border border-[#BF5AF2]/20 rounded-3xl p-6 mb-8 shadow-lg w-max relative overflow-hidden animate-[fadeInScale_0.25s_ease-out_forwards] transition-all duration-300 ${
        isEmpty ? "min-w-[280px] flex items-center justify-center" : ""
      }`}
    >
      <div className="absolute top-0 left-0 w-2 h-full bg-[#BF5AF2]" />
      {children}
    </div>
  );
};
const deduplicateAnnotationItems = (
  groups: AnnotationGroup[],
): AnnotationGroup[] => {
  return groups.map((group) => {
    const seen = new Set<string>();
    const dedupedItems = group.items.filter((item) => {
      if (!item.name || !item.name.trim()) return true;
      const key = item.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return dedupedItems.length !== group.items.length
      ? { ...group, items: dedupedItems }
      : group;
  });
};

const deduplicateEmployees = (
  employees: Employee[],
  globalSeen: Set<string>,
): Employee[] => {
  return employees.filter((emp) => {
    const key = emp.id;
    if (globalSeen.has(key)) return false;
    globalSeen.add(key);
    return true;
  });
};

const deduplicateSupportRoles = (
  groups: SupportRole[][],
  globalSeen: Set<string>,
): SupportRole[][] => {
  return groups.map((group) => {
    return group.filter((emp) => {
      const key = emp.id;
      if (globalSeen.has(key)) return false;
      globalSeen.add(key);
      return true;
    });
  });
};

function AppContent() {
  const lastNetworkWriteRef = useRef<Record<string, number>>({});
  const dssEmployeesRef = useRef<Employee[]>([]);
  const hasInitialDataLoadedRef = useRef(false);
  const lastUpdateSourceRef = useRef("none");
  const {
    departmentsData,
    setDepartmentsData,
    supportRolesData,
    setSupportRolesData,
    annotationsLeft,
    setAnnotationsLeft,
    annotationsRight,
    setAnnotationsRight,
    specialShiftData,
    setSpecialShiftData,
    isLoadingData,
    setIsLoadingData,
    isDarkMode,
    setIsDarkMode,
    is6HActive,
    setIs6HActive,
    isAutomationPaused,
    setIsAutomationPaused,
    isDemoMode,
    setIsDemoMode,
    toast,
    setToast,
    selectedTurma,
    setSelectedTurma,
    movementLogs,
    setMovementLogs,
    isTabVisible,
    setIsTabVisible,
    activeEdits,
    setActiveEdits,
  } = useDashboardData();

  const [hasSelectedTheme, setHasSelectedTheme] = useState(() => {
    return localStorage.getItem("distribui-theme-selected") === "true";
  });

  const handleThemeContinue = useCallback(() => {
    localStorage.setItem("distribui-theme-selected", "true");
    setHasSelectedTheme(true);
  }, []);

  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUser, setAdminUser] = useState<{
    name: string;
    email: string;
    color?: string;
    funcao?: string;
    nivel?: string;
  } | null>(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [activePage, setActivePage] = useState(() => {
    return localStorage.getItem("distribui-page") || "home";
  });
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAdminPasswordModalOpen, setIsAdminPasswordModalOpen] =
    useState(false);
  const [showLoginToast, setShowLoginToast] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isAuditLogModalOpen, setIsAuditLogModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isConfirmBiometricModalOpen, setIsConfirmBiometricModalOpen] =
    useState(false);
  const [isManageAdminsModalOpen, setIsManageAdminsModalOpen] = useState(false);
  const [isAddAdminModalOpen, setIsAddAdminModalOpen] = useState(false);
  const [isEditAdminModalOpen, setIsEditAdminModalOpen] = useState(false);
  const [administrators, setAdministrators] = useState<any[]>([]);
  const [adminToEdit, setAdminToEdit] = useState<any | null>(null);
  const [reportContent, setReportContent] = useState("");
  const [reportStats, setReportStats] = useState<{
    presentes: number;
    afastados: number;
    afastadosList: string[];
    ausentes: number;
    ativos: number;
    ferias: number;
    fora: number;
    atm: number;
    restricao: number;
    estagio: number;
    inss: number;
    treinamento: number;
    revezamento: number;
  } | null>(null);
  const [showErrorToast, setShowErrorToast] = useState(false);

  // Inicializa o state do history se não existir
  useEffect(() => {
    if (!window.history.state || !window.history.state.page) {
      window.history.replaceState({ page: activePage }, "");
    }
  }, [activePage]);

  // Configurações e estados do painel

  useEffect(() => {
    localStorage.setItem("distribui-page", activePage);
  }, [activePage]);

  // Histórico de Movimentações
  // Faz o login anônimo ao montar o app (se as vars existirem)
  useEffect(() => {
    signInToFirebase();
  }, []);

  const isReceivingSnapshotRef = useRef(false);
  const isDemoModeRef = useRef(isDemoMode);
  const adminUserRef = useRef(adminUser);

  // Ref para evitar stale closure em callbacks com dependências vazias (logMovement, handleDragEnd, etc.)
  const selectedTurmaRef = useRef(selectedTurma);
  const annotationsLeftRef = useRef(annotationsLeft);
  const annotationsRightRef = useRef(annotationsRight);

  useEffect(() => {
    adminUserRef.current = adminUser;
    isDemoModeRef.current = isDemoMode;
    selectedTurmaRef.current = selectedTurma;
    annotationsLeftRef.current = annotationsLeft;
    annotationsRightRef.current = annotationsRight;
  }, [adminUser, isDemoMode, selectedTurma, annotationsLeft, annotationsRight]);

  // Efeito principal de sincronização de dados (Firebase vs Mock)
  useEffect(() => {
    if (!selectedTurma || isDemoMode || !isTabVisible) return;

    // Escuta edições ativas em tempo real
    const unsubscribeEdits = firestoreService.subscribeToActiveEdits(
      selectedTurma,
      (edits) => {
        const now = Date.now();
        const cleanedEdits: Record<string, ActiveEdit> = {};
        Object.keys(edits).forEach((key) => {
          // Ignora edições mais antigas que 15s que ficaram presas
          if (now - edits[key].timestamp < 15000) {
            cleanedEdits[key] = edits[key];
          }
        });
        setActiveEdits(cleanedEdits);
      },
    );

    const cleanupInterval = setInterval(() => {
      setActiveEdits((prev) => {
        const now = Date.now();
        const cleaned: Record<string, ActiveEdit> = {};
        let changed = false;
        Object.keys(prev).forEach((key) => {
          if (now - prev[key].timestamp < 15000) {
            cleaned[key] = prev[key];
          } else {
            changed = true;
          }
        });
        return changed ? cleaned : prev;
      });
    }, 5000);

    return () => {
      unsubscribeEdits();
      clearInterval(cleanupInterval);
    };
  }, [isDemoMode, selectedTurma, isTabVisible]);

  // Efeito para carregar o histórico de logs apenas quando o modal for aberto
  useEffect(() => {
    if (isDemoMode || !selectedTurma || !isAuditLogModalOpen || !isTabVisible)
      return;

    const unsubscribeLogs = firestoreService.subscribeToHistory(
      selectedTurma,
      (logs) => {
        if (logs && logs.length > 0) {
          setMovementLogs(logs);
        }
      },
    );

    return () => {
      unsubscribeLogs();
    };
  }, [isDemoMode, selectedTurma, isAuditLogModalOpen, isTabVisible]);

  // Efeito ÚNICO de Montagem da Interface (Single Database)
  useEffect(() => {
    if (isDemoMode || !selectedTurma || !isTabVisible) return;

    const unsubscribeDSS = firestoreService.subscribeToDSS(
      selectedTurma,
      (dssEmployees) => {
        dssEmployeesRef.current = dssEmployees;

        const newDepts = JSON.parse(JSON.stringify(initialDepartmentsData));
        const newSupport = JSON.parse(JSON.stringify(initialSupportData));
        const newAnnotationsLeft = JSON.parse(
          JSON.stringify(initialAnnotationsLeft),
        );
        const newAnnotationsRight = JSON.parse(
          JSON.stringify(initialAnnotationsRight),
        );
        const newSpecial = [];

        dssEmployees.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

        dssEmployees.forEach((emp) => {
          const rawLocal = emp.local || "";

          if (emp.ausente) {
            const statusNormal = emp.status
              ? emp.status
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "")
                  .toLowerCase()
              : "";
            if (statusNormal.includes("ferias")) {
              newAnnotationsRight[2].employees.push(emp);
            } else if (statusNormal.includes("inss")) {
              newAnnotationsRight[0].employees.push(emp);
            } else if (statusNormal.includes("fora")) {
              newAnnotationsRight[1].employees.push(emp);
            } else if (statusNormal.includes("atestado")) {
              newAnnotationsLeft[1].employees.push(emp);
            } else {
              newAnnotationsRight[1].employees.push(emp); // Default Fora
            }
            return; // Skip other boards if absent
          }

          if (rawLocal === "Classificacao") {
            newDepts.find((d) => d.id === "Classificacao")?.employees.push(emp);
          } else if (rawLocal === "Formacao") {
            newDepts.find((d) => d.id === "Formacao")?.employees.push(emp);
          } else if (rawLocal === "Triagem") {
            newDepts.find((d) => d.id === "Triagem")?.employees.push(emp);
          } else if (rawLocal.startsWith("Recepcao ")) {
            const rec = newDepts.find((d) => d.id === "Recepcao");
            if (rec) {
              const sub = rec.subGroups.find((g) => g.id === rawLocal);
              if (sub) sub.employees.push(emp);
              else rec.employees.push(emp);
            }
          } else if (rawLocal === "Turno 6H") {
            newSpecial.push(emp);
          } else if (rawLocal.startsWith("Apoio ")) {
            const role = newSupport.find(
              (r) => r.id === rawLocal.replace("Apoio ", ""),
            );
            if (role) role.employees.push(emp);
          }
        });

        if (!hasInitialDataLoadedRef.current) {
          hasInitialDataLoadedRef.current = true;
          setIsLoadingData(false);
          lastUpdateSourceRef.current = "dss_init";
        } else {
          lastUpdateSourceRef.current = "dss_update";
        }

        setDepartmentsData(newDepts);
        setSupportRolesData(newSupport);
        setAnnotationsLeft(newAnnotationsLeft);
        setAnnotationsRight(newAnnotationsRight);
        setSpecialShiftData(newSpecial);
        // setBoardState({}); Removido
      },
    );

    return () => {
      unsubscribeDSS();
    };
  }, [selectedTurma, isDemoMode, isTabVisible]);

  const loginToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingFieldLogsRef = useRef<
    Record<
      string,
      { oldValue: string; timeoutId: ReturnType<typeof setTimeout> | null }
    >
  >({});

  useEffect(() => {
    return () => {
      if (loginToastTimerRef.current) clearTimeout(loginToastTimerRef.current);
      if (errorToastTimerRef.current) clearTimeout(errorToastTimerRef.current);
    };
  }, []);

  const showToastMessage = useCallback(
    (message: string, type: "success" | "info" | "error" = "success") => {
      setToast({ message, type });
      // Limpar timeouts antigos seria ideal, mas no modelo original era assim
    },
    [],
  );

  // UseEffect separado para limpar o toast e evitar memory leaks
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const logMovement = useCallback(
    (
      employeeName: string,
      from: string,
      to: string,
      line?: string,
      machine?: string,
    ) => {
      const logId =
        Date.now().toString() + Math.random().toString(36).substring(2, 7);
      const currentAdmin = adminUserRef.current
        ? adminUserRef.current.funcao
          ? `${adminUserRef.current.name} (${adminUserRef.current.funcao})`
          : adminUserRef.current.name
        : "Sistema";
      const adminName = isDemoModeRef.current
        ? [
            "Lucas (Admin)",
            "Mariana (Super)",
            "Roberto (Gestor)",
            "Fernanda (Coord)",
          ][Math.floor(Math.random() * 4)]
        : currentAdmin;

      setMovementLogs((prev) => {
        const newLog: MovementLog = {
          id: logId,
          adminName: adminName,
          employeeName,
          from,
          to,
          line,
          machine,
          timestamp: new Date(),
        };
        return [newLog, ...prev].slice(0, 500);
      });

      // Bug 3/17: usa selectedTurmaRef para evitar stale closure
      if (!isDemoModeRef.current && selectedTurmaRef.current) {
        firestoreService.saveMovementLog(selectedTurmaRef.current, {
          id: logId,
          adminName: adminName,
          employeeName,
          from,
          to,
          line,
          machine,
          timestamp: new Date(),
        });
      }
    },
    [],
  );

  const handleClearAll = useCallback(() => {
    setDepartmentsData((prev) =>
      prev.map((dept) => ({
        ...dept,
        data: dept.data.map((emp) => ({ ...emp, line: "", machine: "" })),
      })),
    );
    setSpecialShiftData((prev) =>
      prev.map((emp) => ({ ...emp, line: "", machine: "" })),
    );
    showToastMessage("Distribuição limpa com sucesso!", "success");
    setIsAdminModalOpen(false);
  }, [showToastMessage]);

  const handleGenerateReport = useCallback(() => {
    const totalMaquinistas = departmentsData.reduce(
      (acc, dept) =>
        acc + dept.data.filter((emp) => emp.name.trim() !== "").length,
      0,
    );
    const totalApoio = supportRolesData.reduce(
      (acc, group) =>
        acc + group.filter((emp) => emp.name.trim() !== "").length,
      0,
    );
    const totalTurno6H = specialShiftData.filter(
      (emp) => emp.name.trim() !== "",
    ).length;
    const totalFuncionarios = totalMaquinistas + totalApoio + totalTurno6H;

    const todasAnotacoes = [
      ...annotationsLeft.flatMap((g) => g.items),
      ...annotationsRight.flatMap((g) => g.items),
    ].filter((item) => item.name && item.name.trim() !== "");

    const totalFerias = todasAnotacoes.filter(
      (item) =>
        item.status.toUpperCase().includes("FÉRIA") ||
        item.status.toUpperCase().includes("FERIA"),
    ).length;
    const totalFora = todasAnotacoes.filter(
      (item) => item.status.toUpperCase() === "FORA",
    ).length;
    const totalATM = todasAnotacoes.filter((item) =>
      item.status.toUpperCase().includes("ATM"),
    ).length;

    let report = `RESUMO GERAL - DISTRIBUIÇÃO DE EQUIPES\n`;
    report += `• Total de Funcionários Ativos: ${totalFuncionarios}\n`;
    report += `• Maquinistas: ${totalMaquinistas}\n`;
    report += `• Apoio: ${totalApoio}\n`;
    report += `• Turno 6H: ${totalTurno6H}\n\n`;
    report += `AFASTAMENTOS:\n`;
    report += `• Férias: ${totalFerias}\n`;
    report += `• Fora: ${totalFora}\n`;
    report += `• ATM: ${totalATM}\n`;
    report += `• Restrição: ${todasAnotacoes.filter((item) => item.status.toUpperCase().includes("RESTRI") || item.status.toUpperCase().includes("RESTRICAO")).length}\n`;
    report += `• Estágio: ${todasAnotacoes.filter((item) => item.status.toUpperCase().includes("ESTÁGIO") || item.status.toUpperCase().includes("ESTAGIO")).length}\n`;
    report += `• INSS: ${todasAnotacoes.filter((item) => item.status.toUpperCase() === "INSS").length}\n`;
    report += `• Treinamento: ${todasAnotacoes.filter((item) => item.status.toUpperCase().includes("TREINA")).length}\n`;
    report += `• Revezamento: ${todasAnotacoes.filter((item) => item.status.toUpperCase().includes("REVEZA")).length}\n\n`;
    report += `\n--- COLABORADORES POR SETOR ---\n`;
    departmentsData.forEach((d) => {
      let icon = "🟢";
      if (
        d.id.toLowerCase() === "classificacao" ||
        d.id.toLowerCase() === "classificação"
      )
        icon = "🟡";
      if (
        d.id.toLowerCase() === "formacao" ||
        d.id.toLowerCase() === "formação"
      )
        icon = "🔵";
      report += `\n[${d.title.toUpperCase()}] (${d.count} COLAB.)\n`;
      d.data.forEach((e) => {
        if (e.name.trim())
          report += `${icon} ${e.name.toUpperCase()}\n  (MAT: ${e.matricula || "S/N"}) - LINHA: ${e.line ? e.line.toUpperCase() : "---"} - LOCO: ${e.machine ? e.machine.toUpperCase() : "---"}\n\n`;
      });
    });

    report += `\n--- APOIO (OOF) ---\n`;
    supportRolesData.forEach((group, idx) => {
      const activeGroup = group.filter((e) => e.name.trim() !== "");
      if (activeGroup.length > 0) {
        report += `\n[GRUPO DE APOIO ${idx + 1}]\n`;
        activeGroup.forEach((e) => {
          report += `🟣 ${e.name.toUpperCase()}\n  (MAT: ${e.matricula || "S/N"})\n\n`;
        });
      }
    });

    const activeSpecial = specialShiftData.filter((e) => e.name.trim() !== "");
    if (activeSpecial.length > 0) {
      report += `\n--- TURNO 6H ---\n`;
      activeSpecial.forEach((e) => {
        report += `🟠 ${e.name.toUpperCase()}\n  (MAT: ${e.matricula || "S/N"}) - LINHA: ${e.line ? e.line.toUpperCase() : "---"} - LOCO: ${e.machine ? e.machine.toUpperCase() : "---"}\n\n`;
      });
    }

    report += `\n--- ANOTAÇÕES MINÉRIO ---\n`;
    annotationsLeft.concat(annotationsRight).forEach((group) => {
      const activeAnnotations = group.items.filter((e) => e.name.trim() !== "");
      if (activeAnnotations.length > 0) {
        report += `\n[${group.title.toUpperCase()}]\n`;
        activeAnnotations.forEach((e) => {
          report += `  - ${e.name.toUpperCase()}\n    (MAT: ${e.matricula || "S/N"}) - STATUS: ${e.status ? e.status.toUpperCase() : "---"}\n\n`;
        });
      }
    });

    setReportContent(report);
    setReportStats({
      presentes: totalFuncionarios,
      afastados: todasAnotacoes.length,
      afastadosList: todasAnotacoes.map((a) => a.name),
      ausentes: todasAnotacoes.filter((item) => {
        const s = item.status.toUpperCase();
        return (
          s.includes("FÉRIA") ||
          s.includes("FERIA") ||
          s === "FORA" ||
          s.includes("ATM") ||
          s.includes("RESTRI") ||
          s.includes("RESTRICAO") ||
          s === "INSS"
        );
      }).length,
      ativos: totalFuncionarios,
      ferias: totalFerias,
      fora: totalFora,
      atm: totalATM,
      restricao: todasAnotacoes.filter(
        (item) =>
          item.status.toUpperCase().includes("RESTRI") ||
          item.status.toUpperCase().includes("RESTRICAO"),
      ).length,
      estagio: todasAnotacoes.filter(
        (item) =>
          item.status.toUpperCase().includes("ESTÁGIO") ||
          item.status.toUpperCase().includes("ESTAGIO"),
      ).length,
      inss: todasAnotacoes.filter(
        (item) => item.status.toUpperCase() === "INSS",
      ).length,
      treinamento: todasAnotacoes.filter((item) =>
        item.status.toUpperCase().includes("TREINA"),
      ).length,
      revezamento: todasAnotacoes.filter((item) =>
        item.status.toUpperCase().includes("REVEZA"),
      ).length,
    });
    setIsReportModalOpen(true);
    setIsAdminModalOpen(false); // Fecha o painel de adm para focar no relatório
  }, [
    departmentsData,
    supportRolesData,
    specialShiftData,
    annotationsLeft,
    annotationsRight,
  ]);

  const handleDownloadPDF = useCallback(() => {
    generateDailyReportPDF(departmentsData);
  }, [departmentsData]);

  const handleAddNewUser = useCallback(
    async (name: string, matricula: string, sectorId: string) => {
      if (!name.trim()) return;

      const formattedName = name.toUpperCase();
      const formattedMatricula = matricula.trim();

      let dssRole = "MAQUINISTA";
      if (sectorId === "off" || sectorId.startsWith("support-group-"))
        dssRole = "OOF";
      else if (sectorId === "estagio") dssRole = "ESTÁGIO";

      // Salva diretamente no DSS. O listener (subscribeToDSS) vai detectar a mudança em tempo real,
      // e puxar a pessoa para a Recepção, Apoio ou Estágio automaticamente!
      await firestoreService.addEmployeeDSS(
        selectedTurma,
        formattedName,
        formattedMatricula,
        dssRole,
      );

      showToastMessage(
        `Colaborador ${formattedName} adicionado com sucesso!`,
        "success",
      );
    },
    [showToastMessage, selectedTurma],
  );

  const handleReorganize = useCallback(() => {
    setDepartmentsData((prev) =>
      prev.map((dept) => {
        const sortedData = [...dept.data].sort(() => Math.random() - 0.5);
        return { ...dept, data: sortedData };
      }),
    );
    showToastMessage("Equipes reorganizadas dinamicamente!", "success");
  }, [showToastMessage]);

  // Bug 6: assinatura ajustada para receber Employee completo (alinhado com ImportEmployeeModal)
  const handlePerformImport = useCallback(
    (employee: Employee, sourceTurma: string, _destTurma: string) => {
      const name = employee.name || "";
      const matricula = employee.matricula || "";
      setDepartmentsData((prev) =>
        prev.map((dept, i) => {
          if (i === 0) {
            // Adicionando à recepção por padrão
            const newData = [...dept.data];
            newData.push({
              id: "emp-imp-" + Date.now(),
              name,
              matricula,
              line: `TURMA ${sourceTurma}`,
              machine: "",
              error: false,
            });
            return { ...dept, data: newData, count: newData.length };
          }
          return dept;
        }),
      );
      showToastMessage(
        `Colaborador ${name} importado da Turma ${sourceTurma}!`,
        "success",
      );
    },
    [showToastMessage],
  );

  const handleOpenManageAdmins = useCallback(async () => {
    setIsAdminModalOpen(false);
    const admins = await firestoreService.getAdministrators();
    setAdministrators(admins);
    setIsManageAdminsModalOpen(true);
  }, []);

  const handleOpenAddAdmin = useCallback(() => {
    setIsManageAdminsModalOpen(false);
    setIsAddAdminModalOpen(true);
  }, []);

  const handleOpenEditAdmin = useCallback(
    (id: string) => {
      const admin = administrators.find((a) => a.id === id);
      if (admin) {
        setAdminToEdit(admin);
        setIsManageAdminsModalOpen(false);
        setIsEditAdminModalOpen(true);
      }
    },
    [administrators],
  );

  const handleDeleteAdmin = useCallback(
    async (id: string, name?: string, matricula?: string) => {
      try {
        await firestoreService.deleteAdministrator(id);
        showToastMessage(
          `ADM ${name || matricula} excluído com sucesso!`,
          "success",
        );
        const updatedAdmins = await firestoreService.getAdministrators();
        setAdministrators(updatedAdmins);
      } catch (err: any) {
        showToastMessage("Erro ao excluir ADM: " + err.message, "error");
      }
    },
    [showToastMessage],
  );

  const handleAddAdmin = useCallback(
    async (
      name: string,
      email: string,
      matricula: string,
      nivel: string,
      senha?: string,
    ) => {
      try {
        await firestoreService.addAdministrator({
          name,
          email,
          matricula,
          nivel,
          senha,
        });
        showToastMessage(`ADM ${name} adicionado com sucesso!`, "success");
        const updatedAdmins = await firestoreService.getAdministrators();
        setAdministrators(updatedAdmins);
      } catch (err: any) {
        showToastMessage("Erro ao adicionar ADM: " + err.message, "error");
      }
    },
    [showToastMessage],
  );

  const handleEditAdmin = useCallback(
    async (
      id: string,
      name: string,
      email: string,
      matricula: string,
      nivel: string,
    ) => {
      try {
        await firestoreService.updateAdministrator(id, {
          name,
          email,
          matricula,
          nivel,
        });
        showToastMessage(`ADM ${name} atualizado com sucesso!`, "success");
        const updatedAdmins = await firestoreService.getAdministrators();
        setAdministrators(updatedAdmins);
      } catch (err: any) {
        showToastMessage("Erro ao editar ADM: " + err.message, "error");
      }
    },
    [showToastMessage],
  );

  const handleToggle6H = useCallback(() => {
    setIs6HActive((prev) => {
      const next = !prev;
      showToastMessage(
        next
          ? "Visualização do Turno 6H ativada!"
          : "Visualização do Turno 6H desativada!",
        "success",
      );
      return next;
    });
  }, [showToastMessage]);

  const handleToggleAutomation = useCallback(() => {
    setIsAutomationPaused((prev) => {
      const next = !prev;
      showToastMessage(
        next ? "Ações automáticas pausadas!" : "Ações automáticas retomadas!",
        "success",
      );
      return next;
    });
  }, [showToastMessage]);

  const handleShowHistory = useCallback(() => {
    setIsHistoryModalOpen(true);
    setIsAdminModalOpen(false); // Fecha o modal admin se estiver aberto
  }, []);

  const handleShowAuditLog = useCallback(() => {
    setIsAuditLogModalOpen(true);
    setIsAdminModalOpen(false); // Fecha o modal admin se estiver aberto
  }, []);

  const handleShowHelp = useCallback(() => {
    showToastMessage("Central de ajuda: Suporte técnico ativo.", "info");
  }, [showToastMessage]);

  const handleShowTutorial = useCallback(() => {
    showToastMessage("Tutorial de distribuição iniciado!", "success");
  }, [showToastMessage]);

  const handleToggleDemoMode = useCallback(() => {
    setIsDemoMode((prev) => {
      const next = !prev;
      showToastMessage(
        next ? "Modo demonstração ativado!" : "Modo demonstração desativado!",
        "success",
      );
      return next;
    });
  }, [showToastMessage]);

  const editTimersRef = React.useRef<
    Record<string, ReturnType<typeof setTimeout>>
  >({});

  const handleStartEdit = useCallback(
    (empId: string) => {
      if (!selectedTurma || !isAdmin || !adminUser) return;

      const adminDisplayName = adminUser.funcao
        ? `${adminUser.name} (${adminUser.funcao})`
        : adminUser.name;
      const color = adminUser.color || "#3b82f6";

      setActiveEdits((prev) => {
        const newEdits = { ...prev };
        Object.keys(newEdits).forEach((key) => {
          if (newEdits[key].userName === adminDisplayName && key !== empId) {
            delete newEdits[key];
            if (selectedTurma)
              firestoreService.stopActiveEdit(selectedTurma, key);
          }
        });
        newEdits[empId] = {
          empId,
          userName: adminDisplayName,
          color,
          timestamp: Date.now(),
        };
        return newEdits;
      });

      const now = Date.now();
      const lastWrite = lastNetworkWriteRef.current[empId] || 0;

      if (now - lastWrite > 3000) {
        firestoreService.startActiveEdit(
          selectedTurma,
          empId,
          adminDisplayName,
          color,
        );
        lastNetworkWriteRef.current[empId] = now;
      }
    },
    [selectedTurma, isAdmin, adminUser],
  );

  const handleStopEdit = useCallback(
    (empId: string) => {
      setActiveEdits((prev) => {
        if (!prev[empId]) return prev;
        const newEdits = { ...prev };
        delete newEdits[empId];
        return newEdits;
      });
      if (selectedTurma) {
        firestoreService.stopActiveEdit(selectedTurma, empId);
      }
    },
    [selectedTurma],
  );

  // Listener global: qualquer clique fora de um input/textarea limpa o contorno de edição
  useEffect(() => {
    const handleDocMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const activeEl = document.activeElement;

      if (!(activeEl instanceof HTMLElement)) return;
      if (activeEl.tagName !== "INPUT" && activeEl.tagName !== "TEXTAREA")
        return;
      if (target.closest("input, textarea")) return;

      activeEl.blur();

      if (adminUser) {
        setActiveEdits((prev) => {
          const newEdits = { ...prev };
          const adminDisplayName = adminUser.funcao
            ? `${adminUser.name} (${adminUser.funcao})`
            : adminUser.name;
          Object.keys(newEdits).forEach((key) => {
            if (newEdits[key].userName === adminDisplayName) {
              delete newEdits[key];
              if (selectedTurma)
                firestoreService.stopActiveEdit(selectedTurma, key);
            }
          });
          return newEdits;
        });
      }
    };

    document.addEventListener("mousedown", handleDocMouseDown, true);
    return () => {
      document.removeEventListener("mousedown", handleDocMouseDown, true);
    };
  }, [selectedTurma, adminUser]);

  // ===================== DND HANDLERS =====================
  const [activeId, setActiveId] = useState<string | null>(null);
  // Bug 1: ref para manter o activeId atual acessível em callbacks com dependências vazias
  const activeIdRef = useRef<string | null>(null);

  const handleStartEditRef = useRef(handleStartEdit);
  const handleStopEditRef = useRef(handleStopEdit);
  useEffect(() => {
    handleStartEditRef.current = handleStartEdit;
    handleStopEditRef.current = handleStopEdit;
  }, [handleStartEdit, handleStopEdit]);

  const clonedDepartmentsRef = useRef<Department[] | null>(null);
  const clonedSupportRef = useRef<SupportRole[][] | null>(null);
  const clonedSpecialShiftRef = useRef<Employee[] | null>(null);
  const dragSourceRef = useRef<{
    id: string;
    type: "maquinista" | "apoio" | "special";
    originalContainer: string;
    originalRole?: string;
  } | null>(null);
  const [activeSupportId, setActiveSupportId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  // LATEST STATE REFS
  const departmentsDataRef = useRef(departmentsData);
  const supportRolesDataRef = useRef(supportRolesData);
  const specialShiftDataRef = useRef(specialShiftData);
  const isDarkModeRef = useRef(isDarkMode);

  useEffect(() => {
    departmentsDataRef.current = departmentsData;
    supportRolesDataRef.current = supportRolesData;
    specialShiftDataRef.current = specialShiftData;
    isDarkModeRef.current = isDarkMode;
  }, [departmentsData, supportRolesData, specialShiftData, isDarkMode]);

  const mouseSensor = useSensor(
    MouseSensor,
    React.useMemo(
      () => ({
        activationConstraint: { distance: isAdmin ? 5 : 999999 },
      }),
      [isAdmin],
    ),
  );

  const touchSensor = useSensor(
    TouchSensor,
    React.useMemo(
      () => ({
        activationConstraint: {
          delay: isAdmin ? 250 : 999999,
          tolerance: isAdmin ? 5 : 0,
        },
      }),
      [isAdmin],
    ),
  );

  const sensors = useSensors(mouseSensor, touchSensor);

  const handleDragStart = useCallback((event: any) => {
    const activeIdVal = event.active.id;
    setActiveId(activeIdVal);
    activeIdRef.current = activeIdVal; // Bug 1: mantém ref atualizada
    setOverId(null);
    handleStartEditRef.current(activeIdVal as string);
    clonedDepartmentsRef.current = departmentsDataRef.current;
    clonedSupportRef.current = supportRolesDataRef.current;
    clonedSpecialShiftRef.current = specialShiftDataRef.current;

    let sourceContainer = "";
    let sourceType: "maquinista" | "apoio" | "special" = "maquinista";
    let sourceRole: string | undefined = undefined;

    for (const dept of departmentsDataRef.current) {
      if (dept.data.some((e) => e.id === activeIdVal)) {
        sourceContainer = dept.id;
        sourceType = "maquinista";
        break;
      }
    }

    if (!sourceContainer) {
      for (let idx = 0; idx < supportRolesDataRef.current.length; idx++) {
        const emp = supportRolesDataRef.current[idx].find(
          (e) => e.id === activeIdVal,
        );
        if (emp) {
          sourceContainer = `support-group-${idx}`;
          sourceType = "apoio";
          sourceRole = emp.role;
          break;
        }
      }
    }

    if (!sourceContainer) {
      if (specialShiftDataRef.current.some((e) => e.id === activeIdVal)) {
        sourceContainer = "special-shift";
        sourceType = "special";
      }
    }

    dragSourceRef.current = {
      id: activeIdVal,
      type: sourceType,
      originalContainer: sourceContainer,
      originalRole: sourceRole,
    };

    const isSupport = sourceType === "apoio";
    if (isSupport) {
      setActiveSupportId(activeIdVal);
    }
  }, []);

  const handleDragCancel = useCallback(() => {
    // Bug 1: usa ref para evitar stale closure com activeId
    const currentActiveId = activeIdRef.current;
    if (currentActiveId) handleStopEditRef.current(currentActiveId);
    setActiveId(null);
    activeIdRef.current = null;
    setActiveSupportId(null);
    setOverId(null);
    dragSourceRef.current = null;
    if (clonedDepartmentsRef.current)
      setDepartmentsData(clonedDepartmentsRef.current);
    if (clonedSupportRef.current) setSupportRolesData(clonedSupportRef.current);
    if (clonedSpecialShiftRef.current)
      setSpecialShiftData(clonedSpecialShiftRef.current);
  }, []);

  const handleDragOver = useCallback((event: any) => {
    const { active, over } = event;
    if (!over) {
      setOverId(null);
      return;
    }

    const activeId = active.id;
    const overId = over.id;
    setOverId(overId);

    if (activeId === overId) return;

    let activeContainer: string | null = null;
    let activeType: "maquinista" | "apoio" | "special" | null = null;
    let activeItem: any = null;
    let activeIdx = -1;

    for (const dept of departmentsDataRef.current) {
      const idx = dept.data.findIndex((e) => e.id === activeId);
      if (idx !== -1) {
        activeContainer = dept.id;
        activeType = "maquinista";
        activeItem = dept.data[idx];
        activeIdx = idx;
        break;
      }
    }

    if (!activeType) {
      for (let idx = 0; idx < supportRolesDataRef.current.length; idx++) {
        const supportIdx = supportRolesDataRef.current[idx].findIndex(
          (e) => e.id === activeId,
        );
        if (supportIdx !== -1) {
          activeContainer = `support-group-${idx}`;
          activeType = "apoio";
          activeItem = supportRolesDataRef.current[idx][supportIdx];
          activeIdx = supportIdx;
          break;
        }
      }
    }

    if (!activeType) {
      const idx = specialShiftDataRef.current.findIndex(
        (e) => e.id === activeId,
      );
      if (idx !== -1) {
        activeContainer = "special-shift";
        activeType = "special";
        activeItem = specialShiftDataRef.current[idx];
        activeIdx = idx;
      }
    }

    if (!activeContainer || !activeType || !activeItem) return;

    let overContainer: string | null = null;
    let overType: "maquinista" | "apoio" | "special" | null = null;
    let overIdx = -1;

    if (
      overId === "recepcao" ||
      overId === "classificacao" ||
      overId === "formacao"
    ) {
      overContainer = overId;
      overType = "maquinista";
    } else if (overId.startsWith?.("support-group-")) {
      overContainer = overId;
      overType = "apoio";
    } else if (overId === "special-shift") {
      overContainer = "special-shift";
      overType = "special";
    } else {
      const dept = departmentsDataRef.current.find((d) => d.id === overId);
      if (dept) {
        overContainer = dept.id;
        overType = "maquinista";
      } else {
        for (const d of departmentsDataRef.current) {
          const idx = d.data.findIndex((e) => e.id === overId);
          if (idx !== -1) {
            overContainer = d.id;
            overType = "maquinista";
            overIdx = idx;
            break;
          }
        }
      }

      if (!overContainer) {
        const groupIdx = parseInt(
          overId.toString().replace("support-group-", ""),
          10,
        );
        if (
          !isNaN(groupIdx) &&
          groupIdx >= 0 &&
          groupIdx < supportRolesDataRef.current.length
        ) {
          overContainer = `support-group-${groupIdx}`;
          overType = "apoio";
        } else {
          for (let idx = 0; idx < supportRolesDataRef.current.length; idx++) {
            const supportIdx = supportRolesDataRef.current[idx].findIndex(
              (e) => e.id === overId,
            );
            if (supportIdx !== -1) {
              overContainer = `support-group-${idx}`;
              overType = "apoio";
              overIdx = supportIdx;
              break;
            }
          }
        }
      }

      if (!overContainer) {
        const specialIdx = specialShiftDataRef.current.findIndex(
          (e) => e.id === overId,
        );
        if (specialIdx !== -1) {
          overContainer = "special-shift";
          overType = "special";
          overIdx = specialIdx;
        }
      }
    }

    if (!overContainer || !overType) return;

    if (activeContainer === overContainer) {
      if (activeType === "maquinista") {
        const dept = departmentsDataRef.current.find(
          (d) => d.id === activeContainer,
        );
        if (dept) {
          const activeIndex = dept.data.findIndex((e) => e.id === activeId);
          const overIndex = overIdx >= 0 ? overIdx : dept.data.length - 1;
          if (activeIndex !== overIndex && activeIndex !== -1) {
            setDepartmentsData((prev) =>
              prev.map((d) => {
                if (d.id === activeContainer) {
                  return {
                    ...d,
                    data: arrayMove(d.data, activeIndex, overIndex),
                  };
                }
                return {
                  ...d,
                  data: d.data.filter((e) => e.id !== activeId),
                  count: Math.max(
                    0,
                    d.data.filter((e) => e.id !== activeId).length,
                  ),
                };
              }),
            );
          }
        }
      } else if (activeType === "apoio") {
        const groupIdx = parseInt(
          activeContainer.replace("support-group-", ""),
          10,
        );
        if (!isNaN(groupIdx)) {
          const activeIndex = supportRolesDataRef.current[groupIdx].findIndex(
            (e) => e.id === activeId,
          );
          const overIndex =
            overIdx >= 0
              ? overIdx
              : supportRolesDataRef.current[groupIdx].length - 1;
          if (activeIndex !== overIndex && activeIndex !== -1) {
            setSupportRolesData((prev) =>
              prev.map((g, idx) => {
                if (idx === groupIdx)
                  return arrayMove(g, activeIndex, overIndex);
                return g;
              }),
            );
          }
        }
      } else if (activeType === "special") {
        const activeIndex = specialShiftDataRef.current.findIndex(
          (e) => e.id === activeId,
        );
        const overIndex =
          overIdx >= 0 ? overIdx : specialShiftDataRef.current.length - 1;
        if (activeIndex !== overIndex && activeIndex !== -1) {
          setSpecialShiftData((prev) =>
            arrayMove(prev, activeIndex, overIndex),
          );
        }
      }
      return;
    }

    // A: Maquinista -> Maquinista
    if (activeType === "maquinista" && overType === "maquinista") {
      setDepartmentsData((prev) => {
        const activeDept = prev.find((d) => d.id === activeContainer);
        const overDept = prev.find((d) => d.id === overContainer);
        if (!activeDept || !overDept) return prev;

        const targetIdx = overIdx >= 0 ? overIdx : overDept.data.length;

        return prev.map((d) => {
          if (d.id === activeContainer) {
            const newData = d.data.filter((e) => e.id !== activeId);
            return { ...d, data: newData, count: newData.length };
          }
          if (d.id === overContainer) {
            const cleaned = d.data.filter((e) => e.id !== activeId);
            const newData = [...cleaned];
            const movedItem = { ...activeItem, line: "", machine: "" };
            newData.splice(targetIdx, 0, movedItem);
            return { ...d, data: newData, count: newData.length };
          }
          return {
            ...d,
            data: d.data.filter((e) => e.id !== activeId),
            count: Math.max(0, d.data.filter((e) => e.id !== activeId).length),
          };
        });
      });
    }

    // B: Apoio -> Apoio
    else if (activeType === "apoio" && overType === "apoio") {
      const activeGroupIdx = parseInt(
        activeContainer.replace("support-group-", ""),
        10,
      );
      const overGroupIdx = parseInt(
        overContainer.replace("support-group-", ""),
        10,
      );
      if (!isNaN(activeGroupIdx) && !isNaN(overGroupIdx)) {
        setSupportRolesData((prev) => {
          const activeItems = prev[activeGroupIdx];
          const overItems = prev[overGroupIdx];
          if (!activeItems || !overItems) return prev;

          const targetIdx = overIdx >= 0 ? overIdx : overItems.length;

          return prev.map((group, idx) => {
            if (idx === activeGroupIdx)
              return group.filter((e) => e.id !== activeId);
            if (idx === overGroupIdx) {
              const cleaned = group.filter((e) => e.id !== activeId);
              const newData = [...cleaned];
              newData.splice(targetIdx, 0, activeItem);
              return newData;
            }
            return group.filter((e) => e.id !== activeId);
          });
        });
      }
    }

    // C: Maquinista -> Apoio
    else if (activeType === "maquinista" && overType === "apoio") {
      const overGroupIdx = parseInt(
        overContainer.replace("support-group-", ""),
        10,
      );
      if (!isNaN(overGroupIdx)) {
        const adaptedSupport: SupportRole = {
          id: activeItem.id,
          name: activeItem.name,
          role: "VIRADOR",
          // Bug 10: usa matricula (não machine que é o número da locomotiva)
          matricula: activeItem.matricula || "",
        };

        setDepartmentsData((prev) =>
          prev.map((d) => {
            if (d.id === activeContainer) {
              const newData = d.data.filter((e) => e.id !== activeId);
              return { ...d, data: newData, count: newData.length };
            }
            return {
              ...d,
              data: d.data.filter((e) => e.id !== activeId),
              count: Math.max(
                0,
                d.data.filter((e) => e.id !== activeId).length,
              ),
            };
          }),
        );

        setSupportRolesData((prev) =>
          prev.map((group, idx) => {
            if (idx === overGroupIdx) {
              const cleaned = group.filter((e) => e.id !== activeId);
              const newData = [...cleaned];
              const targetIdx = overIdx >= 0 ? overIdx : group.length;
              newData.splice(targetIdx, 0, adaptedSupport);
              return newData;
            }
            return group.filter((e) => e.id !== activeId);
          }),
        );
      }
    }

    // D: Apoio -> Maquinista
    else if (activeType === "apoio" && overType === "maquinista") {
      const activeGroupIdx = parseInt(
        activeContainer.replace("support-group-", ""),
        10,
      );
      if (!isNaN(activeGroupIdx)) {
        const adaptedEmployee: Employee = {
          id: activeItem.id,
          name: activeItem.name,
          matricula: activeItem.matricula || "",
          line: "",
          machine: "",
          error: false,
        };

        setSupportRolesData((prev) =>
          prev.map((group, idx) => {
            if (idx === activeGroupIdx)
              return group.filter((e) => e.id !== activeId);
            return group.filter((e) => e.id !== activeId);
          }),
        );

        setDepartmentsData((prev) =>
          prev.map((d) => {
            if (d.id === overContainer) {
              const cleaned = d.data.filter((e) => e.id !== activeId);
              const newData = [...cleaned];
              const targetIdx = overIdx >= 0 ? overIdx : d.data.length;
              newData.splice(targetIdx, 0, adaptedEmployee);
              return { ...d, data: newData, count: newData.length };
            }
            return {
              ...d,
              data: d.data.filter((e) => e.id !== activeId),
              count: Math.max(
                0,
                d.data.filter((e) => e.id !== activeId).length,
              ),
            };
          }),
        );
      }
    }

    // E: Special -> Maquinista
    else if (activeType === "special" && overType === "maquinista") {
      const adaptedEmployee: Employee = {
        id: activeItem.id,
        name: activeItem.name,
        matricula: activeItem.matricula || "",
        line: activeItem.line || "",
        machine: activeItem.machine || "",
        error: activeItem.error || false,
      };

      setSpecialShiftData((prev) => prev.filter((e) => e.id !== activeId));

      setDepartmentsData((prev) =>
        prev.map((d) => {
          if (d.id === overContainer) {
            const cleaned = d.data.filter((e) => e.id !== activeId);
            const newData = [...cleaned];
            const targetIdx = overIdx >= 0 ? overIdx : d.data.length;
            newData.splice(targetIdx, 0, adaptedEmployee);
            return { ...d, data: newData, count: newData.length };
          }
          return {
            ...d,
            data: d.data.filter((e) => e.id !== activeId),
            count: Math.max(0, d.data.filter((e) => e.id !== activeId).length),
          };
        }),
      );
    }

    // F: Special -> Apoio
    else if (activeType === "special" && overType === "apoio") {
      const overGroupIdx = parseInt(
        overContainer.replace("support-group-", ""),
        10,
      );
      if (!isNaN(overGroupIdx)) {
        const adaptedSupport: SupportRole = {
          id: activeItem.id,
          name: activeItem.name,
          role: activeItem.originalSupportRole || "VIRADOR",
          // Bug 11: usa matricula (não machine)
          matricula: activeItem.matricula || "",
        };

        setSpecialShiftData((prev) => prev.filter((e) => e.id !== activeId));

        setSupportRolesData((prev) =>
          prev.map((group, idx) => {
            if (idx === overGroupIdx) {
              const cleaned = group.filter((e) => e.id !== activeId);
              const newData = [...cleaned];
              const targetIdx = overIdx >= 0 ? overIdx : group.length;
              newData.splice(targetIdx, 0, adaptedSupport);
              return newData;
            }
            return group.filter((e) => e.id !== activeId);
          }),
        );
      }
    }

    // G: Maquinista -> Special
    else if (activeType === "maquinista" && overType === "special") {
      const isOriginallyApoio = dragSourceRef.current?.type === "apoio";
      const adaptedSpecial: Employee = {
        id: activeItem.id,
        name: activeItem.name,
        matricula: activeItem.matricula || "",
        line: activeItem.line || "",
        machine: activeItem.machine || "",
        tagType: isOriginallyApoio ? "OOF" : "MAQUINISTA",
        originalDeptId: isOriginallyApoio
          ? undefined
          : dragSourceRef.current?.originalContainer || activeContainer,
        originalSupportGroupIndex: isOriginallyApoio
          ? parseInt(
              dragSourceRef.current?.originalContainer.replace(
                "support-group-",
                "",
              ) || "0",
              10,
            )
          : undefined,
        originalSupportRole: isOriginallyApoio
          ? dragSourceRef.current?.originalRole || "VIRADOR"
          : undefined,
      };

      setDepartmentsData((prev) =>
        prev.map((d) => {
          if (d.id === activeContainer) {
            const newData = d.data.filter((e) => e.id !== activeId);
            return { ...d, data: newData, count: newData.length };
          }
          return {
            ...d,
            data: d.data.filter((e) => e.id !== activeId),
            count: Math.max(0, d.data.filter((e) => e.id !== activeId).length),
          };
        }),
      );

      setSupportRolesData((prev) =>
        prev.map((group) => group.filter((e) => e.id !== activeId)),
      );

      setSpecialShiftData((prev) => {
        const cleaned = prev.filter((e) => e.id !== activeId);
        const newData = [...cleaned];
        const targetIdx = overIdx >= 0 ? overIdx : prev.length;
        newData.splice(targetIdx, 0, adaptedSpecial);
        return newData;
      });
    }

    // H: Apoio -> Special
    else if (activeType === "apoio" && overType === "special") {
      const activeGroupIdx = parseInt(
        activeContainer.replace("support-group-", ""),
        10,
      );
      if (!isNaN(activeGroupIdx)) {
        const adaptedSpecial: Employee = {
          id: activeItem.id,
          name: activeItem.name,
          matricula: activeItem.matricula || "",
          line: "",
          machine: activeItem.machine || "",
          tagType: "OOF",
          originalSupportGroupIndex: activeGroupIdx,
          originalSupportRole: activeItem.role,
        };

        setSupportRolesData((prev) =>
          prev.map((group, idx) => {
            if (idx === activeGroupIdx)
              return group.filter((e) => e.id !== activeId);
            return group.filter((e) => e.id !== activeId);
          }),
        );

        setSpecialShiftData((prev) => {
          const cleaned = prev.filter((e) => e.id !== activeId);
          const newData = [...cleaned];
          const targetIdx = overIdx >= 0 ? overIdx : prev.length;
          newData.splice(targetIdx, 0, adaptedSpecial);
          return newData;
        });
      }
    }
  }, []);

  const handleDragEnd = useCallback((event: any) => {
    const { active, over } = event;
    const activeIdVal = active?.id;
    if (activeIdVal) handleStopEditRef.current(activeIdVal);

    if (!over || !activeIdVal) {
      setActiveId(null);
      activeIdRef.current = null;
      setActiveSupportId(null);
      setOverId(null);
      dragSourceRef.current = null;
      return;
    }

    const overId = over.id;
    if (activeIdVal === overId) {
      setActiveId(null);
      activeIdRef.current = null;
      setActiveSupportId(null);
      setOverId(null);
      dragSourceRef.current = null;
      return;
    }

    // Identificar a origem (para logging se necessário)
    let employeeName = "";
    const allEmployees = [
      ...departmentsDataRef.current.flatMap((d) => d.data),
      ...supportRolesDataRef.current.flatMap((g) => g),
      ...specialShiftDataRef.current,
    ];
    const emp = allEmployees.find((e) => e.id === activeIdVal);
    if (emp) employeeName = emp.name;

    // Determinar o formato do novo "local" no DSS
    let newLocal = "";
    let newRole = "";

    // Mapear destinos
    if (overId === "recepcao") {
      newLocal = "Recepcao"; // Nao devera acontecer muito por causa dos subgrupos
      newRole = "MAQUINISTA";
    } else if (overId === "classificacao") {
      newLocal = "Classificacao";
      newRole = "MAQUINISTA";
    } else if (overId === "formacao") {
      newLocal = "Formacao";
      newRole = "MAQUINISTA";
    } else if (overId.toString().startsWith("Recepcao ")) {
      newLocal = overId.toString(); // Ex: "Recepcao 1"
      newRole = "MAQUINISTA";
    } else if (overId === "special-shift") {
      newLocal = "Turno 6H";
      newRole = "MAQUINISTA";
    } else if (overId.toString().startsWith("support-group-")) {
      const idx = overId.toString().split("-")[2];
      newLocal = `Apoio ${idx}`; // Ex: Apoio 0
      newRole = "OOF";
    } else {
      // Tentar descobrir se caiu em cima de um funcionario
      const overEmp = allEmployees.find((e) => e.id === overId);
      if (overEmp) {
        // Pega o local do funcionario sobreposto
        newLocal = overEmp.local || "";
        newRole = overEmp.tagType || "MAQUINISTA";
      }
    }

    // Se temos um novo local e um ID valido, enviamos pro DSS!
    if (newLocal && selectedTurmaRef.current) {
      firestoreService.updateEmployeeLocalDSS(
        selectedTurmaRef.current,
        activeIdVal,
        newLocal,
      );
      if (newRole) {
        firestoreService.updateEmployeeRoleDSS(
          selectedTurmaRef.current,
          activeIdVal,
          newRole,
        );
      }
    }

    setActiveId(null);
    activeIdRef.current = null;
    setActiveSupportId(null);
    setOverId(null);
    dragSourceRef.current = null;
  }, []);

  const {
    activeEmployee,
    activeDepartment,
    activeSupportItem,
    activeSupportGroupIndex,
    activeSpecialEmployee,
  } = useMemo(() => {
    const emp = activeId
      ? departmentsData.flatMap((d) => d.data).find((e) => e.id === activeId)
      : null;
    const dept = emp
      ? departmentsData.find((d) => d.data.some((e) => e.id === activeId))
      : null;
    const supportItem = activeId
      ? supportRolesData.flatMap((g) => g).find((e) => e.id === activeId)
      : null;
    const supportGroupIndex = supportItem
      ? supportRolesData.findIndex((g) => g.some((e) => e.id === activeId))
      : -1;
    const specialEmp = activeId
      ? specialShiftData.find((e) => e.id === activeId)
      : null;
    return {
      activeEmployee: emp,
      activeDepartment: dept,
      activeSupportItem: supportItem,
      activeSupportGroupIndex: supportGroupIndex,
      activeSpecialEmployee: specialEmp,
    };
  }, [activeId, departmentsData, supportRolesData, specialShiftData]);

  const handleChangeAdminPassword = async (newPassword: string) => {
    if (!adminUser?.email) return;
    try {
      await firestoreService.updateAdminPassword(adminUser.email, newPassword);
      setToast({ message: "Senha alterada com sucesso!", type: "success" });
      setIsAdminPasswordModalOpen(false);
      setIsAdminModalOpen(true);

      // Regra: Desativa a biometria se houver para forçar um novo cadastro com a senha correta
      clearBiometricData();
    } catch (error: any) {
      console.error(error);
      setToast({
        message: error.message || "Erro ao alterar senha",
        type: "error",
      });
    }
  };

  const handleAdminLogin = useCallback(
    async (adminData: { name: string; email: string; color?: string }) => {
      setIsAdmin(true);
      setAdminUser(adminData);
      setIsAdminModalOpen(false); // Fecha o modal imediatamente
      setShowLoginToast(true);
      if (loginToastTimerRef.current) clearTimeout(loginToastTimerRef.current);
      loginToastTimerRef.current = setTimeout(
        () => setShowLoginToast(false),
        3500,
      );

      // Verifica suporte a biometria
      const isCell = await isMobileCellularWithBiometrics();
      const hasBio = hasRegisteredBiometrics();
      if (isCell && !hasBio) {
        setIsConfirmBiometricModalOpen(true);
      }
    },
    [],
  );

  const handleAdminLogout = useCallback(() => {
    setIsAdmin(false);
    setAdminUser(null);
    setIsAdminModalOpen(false);
  }, []);

  const handleCloseBiometricModal = useCallback(() => {
    setIsConfirmBiometricModalOpen(false);
  }, []);

  const handleActivateBiometrics = useCallback(async () => {
    try {
      if (!adminUser?.email) throw new Error("Email não encontrado");
      const { registerBiometricAdmin } =
        await import("./services/biometricService");
      await registerBiometricAdmin(adminUser.email);
      setToast({
        message: "Biometria cadastrada com sucesso!",
        type: "success",
      });
      setIsConfirmBiometricModalOpen(false);
    } catch (err: any) {
      console.error("Erro ao registrar:", err);
      setToast({
        message: "Falha ao registrar biometria. " + (err.message || ""),
        type: "error",
      });
    }
  }, [adminUser]);

  const handleAdminLoginError = useCallback(() => {
    setShowErrorToast(true);
    if (errorToastTimerRef.current) clearTimeout(errorToastTimerRef.current);
    errorToastTimerRef.current = setTimeout(
      () => setShowErrorToast(false),
      3500,
    );
  }, []);

  useEffect(() => {
    localStorage.setItem("distribui-theme", isDarkMode ? "dark" : "light");
    document.body.style.backgroundColor = isDarkMode ? "#111217" : "#eef2f7";
    if (!isDarkMode) {
      document.body.classList.add("light-mode");
    } else {
      document.body.classList.remove("light-mode");
    }
  }, [isDarkMode]);

  const handleToggleDarkMode = useCallback((e?: any) => {
    if (!("startViewTransition" in document)) {
      setIsDarkMode((prev) => !prev);
      return;
    }

    const isSwitchingToDark = !isDarkModeRef.current;

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;

    if (
      e &&
      e.nativeEvent &&
      typeof e.nativeEvent.clientX === "number" &&
      e.nativeEvent.clientX > 0
    ) {
      x = e.nativeEvent.clientX;
      y = e.nativeEvent.clientY;
    } else if (e && e.target instanceof Element) {
      const targetEl = e.target.closest(".bb8-toggle") || e.target;
      const rect = targetEl.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    }

    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    document.documentElement.style.setProperty("--toggle-x", `${x}px`);
    document.documentElement.style.setProperty("--toggle-y", `${y}px`);
    document.documentElement.style.setProperty("--toggle-r", `${endRadius}px`);

    const transitionClass = isSwitchingToDark
      ? "dark-transition"
      : "light-transition";
    document.documentElement.classList.add(transitionClass);

    const transition = (document as any).startViewTransition(() => {
      flushSync(() => {
        setIsDarkMode((prev) => !prev);
      });
    });

    transition.finished.finally(() => {
      document.documentElement.classList.remove(transitionClass);
      document.documentElement.style.removeProperty("--toggle-x");
      document.documentElement.style.removeProperty("--toggle-y");
      document.documentElement.style.removeProperty("--toggle-r");
    });
  }, []);

  const handlePageChange = useCallback(
    (page: string, e?: React.MouseEvent, isPopState: boolean = false) => {
      if (page === activePage) return;

      if (!isPopState) {
        window.history.pushState({ page }, "", `?page=${page}`);
      }

      if (!("startViewTransition" in document)) {
        setActivePage(page);
        return;
      }

      let x = window.innerWidth / 2;
      let y = window.innerHeight / 2;

      if (
        e &&
        e.nativeEvent &&
        typeof e.nativeEvent.clientX === "number" &&
        e.nativeEvent.clientX > 0
      ) {
        x = e.nativeEvent.clientX;
        y = e.nativeEvent.clientY;
      } else if (e && e.target instanceof Element) {
        const targetEl = e.target.closest("button, a") || e.target;
        const rect = targetEl.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
      }

      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      );

      document.documentElement.style.setProperty("--toggle-x", `${x}px`);
      document.documentElement.style.setProperty("--toggle-y", `${y}px`);
      document.documentElement.style.setProperty(
        "--toggle-r",
        `${endRadius}px`,
      );

      document.documentElement.classList.add("page-transition");

      const transition = (document as any).startViewTransition(() => {
        flushSync(() => {
          setActivePage(page);
        });
      });

      transition.finished.finally(() => {
        document.documentElement.classList.remove("page-transition");
        document.documentElement.style.removeProperty("--toggle-x");
        document.documentElement.style.removeProperty("--toggle-y");
        document.documentElement.style.removeProperty("--toggle-r");
      });
    },
    [activePage],
  );

  // Listener para o botão voltar do navegador/celular
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const targetPage = event.state?.page || "home";
      handlePageChange(targetPage, undefined, true);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [handlePageChange]);

  const handleUpdateSpecialShiftEmployee = useCallback(
    (empIndex: number, field: keyof Employee, value: any) => {
      setSpecialShiftData((prev) => {
        const newData = [...prev];
        const oldEmp = newData[empIndex];
        const oldValue = oldEmp ? oldEmp[field] : undefined;
        const empName = oldEmp ? oldEmp.name : "";

        newData[empIndex] = { ...oldEmp, [field]: value };
        if (field === "name" && value.trim() && !newData[empIndex].tagType) {
          newData[empIndex].tagType = "MAQUINISTA";
        }

        if (
          (field === "line" || field === "machine") &&
          empName &&
          oldValue !== value
        ) {
          const fieldName = field === "line" ? "Linha" : "Loco";
          const logKey = `special-${empIndex}-${field}`;

          if (!pendingFieldLogsRef.current[logKey]) {
            pendingFieldLogsRef.current[logKey] = {
              oldValue: oldValue || "",
              timeoutId: null,
            };
          }

          const originalOldValue = pendingFieldLogsRef.current[logKey].oldValue;

          if (pendingFieldLogsRef.current[logKey].timeoutId) {
            clearTimeout(pendingFieldLogsRef.current[logKey].timeoutId!);
          }

          pendingFieldLogsRef.current[logKey].timeoutId = setTimeout(() => {
            const fromStr = `${fieldName}: ${originalOldValue || "(vazio)"}`;
            const toStr = `${fieldName}: ${value || "(vazio)"}`;
            if (originalOldValue !== value) {
              logMovement(
                empName,
                fromStr,
                toStr,
                field === "line" ? value : undefined,
                field === "machine" ? value : undefined,
              );
            }
            delete pendingFieldLogsRef.current[logKey];
          }, 1500);
        }

        return newData;
      });
    },
    [logMovement],
  );

  const handleTransferToSpecialShift = useCallback(
    (sourceDeptId: string, sourceEmpIndex: number) => {
      const sourceDept = departmentsDataRef.current.find(
        (d) => d.id === sourceDeptId,
      );
      if (!sourceDept) return;

      const movedEmployee = sourceDept.data[sourceEmpIndex];
      if (!movedEmployee) return;

      setDepartmentsData((prev) => {
        const newDepts = [...prev];
        const idx = newDepts.findIndex((d) => d.id === sourceDeptId);
        if (idx === -1) return prev;
        const newData = [...newDepts[idx].data];
        newData.splice(sourceEmpIndex, 1);
        newDepts[idx] = {
          ...newDepts[idx],
          data: newData,
          count: newData.length,
        };
        return newDepts;
      });

      setSpecialShiftData((prev) => [
        ...prev,
        {
          ...movedEmployee,
          originalDeptId: sourceDeptId,
          tagType: "MAQUINISTA",
        },
      ]);
    },
    [],
  );

  const handleTransferSupportToSpecialShift = useCallback(
    (sourceGroupIndex: number, sourceEmpIndex: number) => {
      const sourceGroup = supportRolesDataRef.current[sourceGroupIndex];
      if (!sourceGroup) return;

      const movedRole = sourceGroup[sourceEmpIndex];
      if (!movedRole) return;

      setSupportRolesData((prev) => {
        const newSupport = prev.map((group) => [...group]);
        newSupport[sourceGroupIndex].splice(sourceEmpIndex, 1);
        return newSupport;
      });

      setSpecialShiftData((prev) => [
        ...prev,
        {
          id: movedRole.id,
          name: movedRole.name,
          matricula: movedRole.matricula || "",
          line: "",
          machine: "",
          originalSupportGroupIndex: sourceGroupIndex,
          originalSupportRole: movedRole.role,
          tagType: "OOF",
        },
      ]);

      if (selectedTurmaRef.current) {
        firestoreService.updateEmployeeRoleDSS(
          selectedTurmaRef.current,
          movedRole.id,
          "MAQUINISTA",
        );
      }
    },
    [],
  );

  const handleTransferFromSpecialShift = useCallback(
    (empIndex: number, targetDeptId: string) => {
      const movedEmployee = specialShiftDataRef.current[empIndex];
      if (!movedEmployee.name.trim()) return;

      setSpecialShiftData((prev) => {
        const newSpecial = [...prev];
        newSpecial.splice(empIndex, 1);
        return newSpecial;
      });

      if (movedEmployee.originalSupportGroupIndex !== undefined) {
        const groupIdx = movedEmployee.originalSupportGroupIndex;
        const roleStr = movedEmployee.originalSupportRole || "VIRADOR";
        setSupportRolesData((prev) => {
          const newSupport = prev.map((group) => [...group]);
          newSupport[groupIdx].push({
            id:
              movedEmployee.id ||
              "emp-supp-" +
                Date.now() +
                "-" +
                Math.random().toString(36).substring(2, 9),
            name: movedEmployee.name,
            role: roleStr,
            // Bug 12: usa matricula (não machine)
            matricula: movedEmployee.matricula || "",
          });
          return newSupport;
        });
      } else {
        setDepartmentsData((prev) => {
          const newDepts = [...prev];
          const targetDeptIndex = newDepts.findIndex(
            (d) => d.id === targetDeptId,
          );
          if (targetDeptIndex === -1) return prev;

          const cleanedEmp: Employee = {
            id: movedEmployee.id,
            name: movedEmployee.name,
            matricula: movedEmployee.matricula || "",
            line: movedEmployee.line,
            machine: movedEmployee.machine,
            error: movedEmployee.error,
          };

          const targetData = [...newDepts[targetDeptIndex].data];
          targetData.push(cleanedEmp);
          newDepts[targetDeptIndex] = {
            ...newDepts[targetDeptIndex],
            data: targetData,
            count: targetData.length,
          };
          return newDepts;
        });
      }
    },
    [],
  );

  const handleUpdateAnnotationLeft = useCallback(
    (
      groupIndex: number,
      itemIndex: number,
      field: keyof AnnotationItem,
      value: string,
    ) => {
      setAnnotationsLeft((prev) => {
        const newGroups = [...prev];
        const newItems = [...newGroups[groupIndex].items];
        newItems[itemIndex] = { ...newItems[itemIndex], [field]: value };
        newGroups[groupIndex] = { ...newGroups[groupIndex], items: newItems };
        return newGroups;
      });
    },
    [],
  );

  const handleUpdateAnnotationRight = useCallback(
    (
      groupIndex: number,
      itemIndex: number,
      field: keyof AnnotationItem,
      value: string,
    ) => {
      setAnnotationsRight((prev) => {
        const newGroups = [...prev];
        const newItems = [...newGroups[groupIndex].items];
        newItems[itemIndex] = { ...newItems[itemIndex], [field]: value };
        newGroups[groupIndex] = { ...newGroups[groupIndex], items: newItems };
        return newGroups;
      });
    },
    [],
  );

  // --- Viewport & Scale Refs (Painel DSS Pattern) ---
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const scalableContainerRef = useRef<HTMLDivElement>(null);
  const scaleStateRef = useRef({ currentScale: 1 });
  const scaleCompensationModifier: Modifier = useCallback(
    ({ transform }) => ({
      ...transform,
      x: transform.x / scaleStateRef.current.currentScale,
      y: transform.y / scaleStateRef.current.currentScale,
    }),
    [],
  );

  const dndModifiers = useMemo(
    () => [scaleCompensationModifier],
    [scaleCompensationModifier],
  );

  const dragScrollRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0,
    moved: false,
  });

  const setScale = useCallback(
    (newScale: number, scrollX?: number, scrollY?: number) => {
      const viewport = viewportRef.current;
      const scalableContainer = scalableContainerRef.current;
      const contentWrapper = contentWrapperRef.current;
      if (!viewport || !scalableContainer || !contentWrapper) return;

      let minScale = 0.2;
      if (
        scalableContainer.scrollWidth > 0 &&
        scalableContainer.scrollHeight > 0
      ) {
        const scaleW = viewport.clientWidth / scalableContainer.scrollWidth;
        const scaleH =
          viewport.clientHeight / (scalableContainer.scrollHeight - 300);
        minScale = Math.max(scaleW, scaleH);
      }

      const finalScale = Math.max(minScale, Math.min(newScale, 2.0));
      scaleStateRef.current.currentScale = finalScale;

      scalableContainer.style.transform = `scale(${finalScale})`;
      document.documentElement.style.setProperty(
        "--app-scale",
        finalScale.toString(),
      );

      const originalWidth = scalableContainer.scrollWidth;
      const originalHeight = scalableContainer.scrollHeight;

      contentWrapper.style.width = `${originalWidth * finalScale}px`;
      contentWrapper.style.height = `${originalHeight * finalScale}px`;

      if (scrollX !== undefined) viewport.scrollLeft = scrollX;
      if (scrollY !== undefined) viewport.scrollTop = scrollY;
    },
    [],
  );

  const initializeScale = useCallback(() => {
    const viewport = viewportRef.current;
    const scalableContainer = scalableContainerRef.current;
    if (!viewport || !scalableContainer) return;

    const isMobileView = window.innerWidth < 1024;

    if (isMobileView) {
      const oneColumnScale = viewport.clientWidth / 920;
      const finalScale = Math.min(Math.max(oneColumnScale, 0.3), 0.85);
      setScale(finalScale, 0, 0);
    } else {
      const contentWidth = 1716;
      const threeColumnsScale = viewport.clientWidth / contentWidth;
      const finalScale = Math.min(Math.max(threeColumnsScale, 0.3), 2.0);
      setScale(finalScale, 0, 0);
    }
  }, [setScale]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const scalableContainer = scalableContainerRef.current;
    if (!viewport || !scalableContainer) return;

    initializeScale();
    const initTimer = setTimeout(initializeScale, 50);

    const resizeObserver = new ResizeObserver(() => {
      setScale(scaleStateRef.current.currentScale);
    });
    resizeObserver.observe(scalableContainer);
    resizeObserver.observe(viewport);

    let initialDistance = 0;
    let initialScaleValue = 1;
    let scrollStart = { x: 0, y: 0 };
    let initialContentCenter = { x: 0, y: 0 };
    let viewportRect = { left: 0, top: 0 };
    let touchRafId: number | null = null;
    let wheelRafId: number | null = null;
    let pendingTouch = { scale: 0, scrollX: 0, scrollY: 0, valid: false };
    let pendingWheel = { scale: 0, scrollX: 0, scrollY: 0, valid: false };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        initialDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        );

        // Guarda contra initialDistance === 0 (divisão por zero)
        if (initialDistance < 1) initialDistance = 1;

        initialScaleValue = scaleStateRef.current.currentScale;
        scrollStart = { x: viewport.scrollLeft, y: viewport.scrollTop };

        // Cache do getBoundingClientRect - uma vez por gesto, não a cada frame
        const rect = viewport.getBoundingClientRect();
        viewportRect = { left: rect.left, top: rect.top };

        // Ponto do conteúdo sob o centro inicial dos dedos
        const cx0 =
          (e.touches[0].clientX + e.touches[1].clientX) / 2 - viewportRect.left;
        const cy0 =
          (e.touches[0].clientY + e.touches[1].clientY) / 2 - viewportRect.top;
        initialContentCenter = {
          x: (scrollStart.x + cx0) / initialScaleValue,
          y: (scrollStart.y + cy0) / initialScaleValue,
        };

        pendingTouch.valid = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();

        // Centro atual dos dedos (recalculado a cada frame)
        const currentCx =
          (e.touches[0].clientX + e.touches[1].clientX) / 2 - viewportRect.left;
        const currentCy =
          (e.touches[0].clientY + e.touches[1].clientY) / 2 - viewportRect.top;

        const currentDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        );

        let computedMinScale = 0.2;
        if (
          scalableContainer.scrollWidth > 0 &&
          scalableContainer.scrollHeight > 0
        ) {
          const scaleW = viewport.clientWidth / scalableContainer.scrollWidth;
          const scaleH =
            viewport.clientHeight / (scalableContainer.scrollHeight - 300);
          computedMinScale = Math.max(scaleW, scaleH);
        }

        let newScale = Math.max(
          computedMinScale,
          Math.min(
            initialScaleValue * (currentDistance / initialDistance),
            2.0,
          ),
        );
        if (scaleStateRef.current.currentScale === newScale) return;

        // Sempre atualiza os valores mais recentes ANTES de checar o rAF
        pendingTouch = {
          scale: newScale,
          scrollX: initialContentCenter.x * newScale - currentCx,
          scrollY: initialContentCenter.y * newScale - currentCy,
          valid: true,
        };

        // Se já há um rAF agendado, ele vai pegar o pendingTouch atualizado acima
        if (touchRafId) return;

        touchRafId = requestAnimationFrame(() => {
          if (pendingTouch.valid) {
            setScale(
              pendingTouch.scale,
              pendingTouch.scrollX,
              pendingTouch.scrollY,
            );
            pendingTouch.valid = false;
          }
          touchRafId = null;
        });
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const zoomIntensity = 0.002;
        const delta = -e.deltaY * zoomIntensity;
        let newScale =
          scaleStateRef.current.currentScale +
          delta * scaleStateRef.current.currentScale;

        let minScale = 0.2;
        if (
          scalableContainer.scrollWidth > 0 &&
          scalableContainer.scrollHeight > 0
        ) {
          const scaleW = viewport.clientWidth / scalableContainer.scrollWidth;
          const scaleH =
            viewport.clientHeight / (scalableContainer.scrollHeight - 300);
          minScale = Math.max(scaleW, scaleH);
        }

        newScale = Math.max(minScale, Math.min(newScale, 2.0));
        if (scaleStateRef.current.currentScale === newScale) return;

        const rect = viewport.getBoundingClientRect();
        const originX = e.clientX - rect.left;
        const originY = e.clientY - rect.top;

        const contentOriginX =
          (viewport.scrollLeft + originX) / scaleStateRef.current.currentScale;
        const contentOriginY =
          (viewport.scrollTop + originY) / scaleStateRef.current.currentScale;

        const newScrollX = contentOriginX * newScale - originX;
        const newScrollY = contentOriginY * newScale - originY;

        pendingWheel = {
          scale: newScale,
          scrollX: newScrollX,
          scrollY: newScrollY,
          valid: true,
        };

        if (wheelRafId) return;
        wheelRafId = requestAnimationFrame(() => {
          if (pendingWheel.valid) {
            setScale(
              pendingWheel.scale,
              pendingWheel.scrollX,
              pendingWheel.scrollY,
            );
            pendingWheel.valid = false;
          }
          wheelRafId = null;
        });
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Se tem um input com foco e clicamos fora dele, force o blur
      // O onBlur do input já vai chamar onStopEdit para limpar o estado de edição
      if (
        document.activeElement instanceof HTMLElement &&
        (document.activeElement.tagName === "INPUT" ||
          document.activeElement.tagName === "TEXTAREA")
      ) {
        if (!target.closest("input, textarea")) {
          document.activeElement.blur();
        }
      }

      if (
        target.closest(
          isAdmin
            ? 'button, input, select, textarea, a, [role="button"], .employee-row-card, .support-role-row, .special-shift-slot'
            : 'button, input, select, textarea, a, [role="button"]:not(.employee-row-card):not(.support-role-row):not(.special-shift-slot)',
        )
      )
        return;

      // Impede que o clique inicie seleção de texto ou arraste nativo de imagens
      // Isso garante que o mousemove não seja cancelado pelo navegador
      if (e.button === 0) {
        e.preventDefault();
      }

      dragScrollRef.current.isDragging = true;
      dragScrollRef.current.moved = false;
      dragScrollRef.current.startX = e.pageX - viewport.offsetLeft;
      dragScrollRef.current.startY = e.pageY - viewport.offsetTop;
      dragScrollRef.current.scrollLeft = viewport.scrollLeft;
      dragScrollRef.current.scrollTop = viewport.scrollTop;

      viewport.style.cursor = "grabbing";
      viewport.style.userSelect = "none";
    };

    let rafId: number | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragScrollRef.current.isDragging) return;
      e.preventDefault();
      const x = e.pageX - viewport.offsetLeft;
      const y = e.pageY - viewport.offsetTop;
      const walkX = (x - dragScrollRef.current.startX) * 1.5;
      const walkY = (y - dragScrollRef.current.startY) * 1.5;

      if (Math.abs(walkX) > 5 || Math.abs(walkY) > 5) {
        dragScrollRef.current.moved = true;
      }

      if (rafId) return;

      rafId = requestAnimationFrame(() => {
        viewport.scrollLeft = dragScrollRef.current.scrollLeft - walkX;
        viewport.scrollTop = dragScrollRef.current.scrollTop - walkY;
        rafId = null;
      });
    };

    const handleMouseUp = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (!dragScrollRef.current.isDragging) return;
      dragScrollRef.current.isDragging = false;
      viewport.style.cursor = "grab";
      viewport.style.removeProperty("user-select");
    };

    let lastWidth = window.innerWidth;
    const handleResize = () => {
      const activeTag = document.activeElement?.tagName;
      if (activeTag === "INPUT" || activeTag === "TEXTAREA") return;
      if (window.innerWidth !== lastWidth) {
        lastWidth = window.innerWidth;
        setScale(scaleStateRef.current.currentScale);
        initializeScale();
      }
    };

    window.addEventListener("load", initializeScale);
    window.addEventListener("resize", handleResize);
    viewport.addEventListener("wheel", handleWheel, { passive: false });
    viewport.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    viewport.addEventListener("touchstart", handleTouchStart as EventListener, {
      passive: false,
    });
    viewport.addEventListener("touchmove", handleTouchMove as EventListener, {
      passive: false,
    });
    viewport.style.cursor = "grab";

    return () => {
      clearTimeout(initTimer);
      if (rafId) cancelAnimationFrame(rafId);
      if (touchRafId) cancelAnimationFrame(touchRafId);
      if (wheelRafId) cancelAnimationFrame(wheelRafId);
      window.removeEventListener("load", initializeScale);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      if (viewport) {
        viewport.removeEventListener("wheel", handleWheel);
        viewport.removeEventListener("mousedown", handleMouseDown);
        viewport.removeEventListener(
          "touchstart",
          handleTouchStart as EventListener,
        );
        viewport.removeEventListener(
          "touchmove",
          handleTouchMove as EventListener,
        );
      }
      resizeObserver.disconnect();
    };
  }, [initializeScale, setScale, activePage, isAdmin, selectedTurma]);

  const handleUpdateSupportRole = useCallback(
    (groupIndex: number, empIndex: number, newRole: string) => {
      setSupportRolesData((prev) => {
        const newGroups = [...prev];
        const newGroup = [...newGroups[groupIndex]];
        newGroup[empIndex] = { ...newGroup[empIndex], role: newRole };
        newGroups[groupIndex] = newGroup;
        return newGroups;
      });
    },
    [],
  );

  const handleUpdateSupportName = useCallback(
    (groupIndex: number, empIndex: number, newName: string) => {
      setSupportRolesData((prev) => {
        const newGroups = [...prev];
        const newGroup = [...newGroups[groupIndex]];
        newGroup[empIndex] = { ...newGroup[empIndex], name: newName };
        newGroups[groupIndex] = newGroup;
        return newGroups;
      });
    },
    [],
  );

  // Bug 14: debounce igual ao handleUpdateEmployeeField para não inundar o histórico
  const handleUpdateSupportMatricula = useCallback(
    (groupIndex: number, empIndex: number, newMatricula: string) => {
      setSupportRolesData((prev) => {
        const newGroups = [...prev];
        const newGroup = [...newGroups[groupIndex]];
        const oldEmp = newGroup[empIndex];
        const oldValue = oldEmp ? oldEmp.matricula : undefined;
        const empName = oldEmp ? oldEmp.name : "";

        newGroup[empIndex] = { ...oldEmp, matricula: newMatricula };
        newGroups[groupIndex] = newGroup;

        if (empName && oldValue !== newMatricula) {
          const logKey = `support-${groupIndex}-${empIndex}-matricula`;

          if (!pendingFieldLogsRef.current[logKey]) {
            pendingFieldLogsRef.current[logKey] = {
              oldValue: oldValue || "",
              timeoutId: null,
            };
          }

          const originalOldValue = pendingFieldLogsRef.current[logKey].oldValue;

          if (pendingFieldLogsRef.current[logKey].timeoutId) {
            clearTimeout(pendingFieldLogsRef.current[logKey].timeoutId!);
          }

          pendingFieldLogsRef.current[logKey].timeoutId = setTimeout(() => {
            const fromStr = `Loco: ${originalOldValue || "(vazio)"}`;
            const toStr = `Loco: ${newMatricula || "(vazio)"}`;
            if (originalOldValue !== newMatricula) {
              logMovement(empName, fromStr, toStr, undefined, newMatricula);
            }
            delete pendingFieldLogsRef.current[logKey];
          }, 1500);
        }

        return newGroups;
      });
    },
    [logMovement],
  );

  const handleDeleteSupport = useCallback(
    (groupIndex: number, empIndex: number) => {
      const empId = supportRolesDataRef.current[groupIndex]?.[empIndex]?.id;
      if (empId) {
        firestoreService
          .deleteEmployeeDSS(selectedTurma, empId)
          .catch(console.error);
      }
      setSupportRolesData((prev) => {
        const newSupport = prev.map((g) => [...g]);
        newSupport[groupIndex].splice(empIndex, 1);
        return newSupport;
      });
    },
    [selectedTurma],
  );

  const handleMoveSupport = useCallback(
    (
      sourceGroupIndex: number,
      targetGroupIndex: number,
      sourceEmpIndex: number,
    ) => {
      setSupportRolesData((prev) => {
        const newGroups = [...prev];
        const sourceGroup = [...newGroups[sourceGroupIndex]];
        const targetGroup = [...newGroups[targetGroupIndex]];
        const [movedEmployee] = sourceGroup.splice(sourceEmpIndex, 1);
        targetGroup.push(movedEmployee);
        newGroups[sourceGroupIndex] = sourceGroup;
        newGroups[targetGroupIndex] = targetGroup;
        return newGroups;
      });
    },
    [],
  );

  const handleMove = useCallback(
    (sourceDeptId: string, targetDeptId: string, sourceEmpIndex: number) => {
      setDepartmentsData((prev) => {
        const newDepts = [...prev];
        const sourceDeptIndex = newDepts.findIndex(
          (d) => d.id === sourceDeptId,
        );
        const targetDeptIndex = newDepts.findIndex(
          (d) => d.id === targetDeptId,
        );

        if (sourceDeptIndex === targetDeptIndex) return prev;

        const sourceData = [...newDepts[sourceDeptIndex].data];
        const targetData = [...newDepts[targetDeptIndex].data];

        const [movedEmployee] = sourceData.splice(sourceEmpIndex, 1);
        targetData.push(movedEmployee);

        newDepts[sourceDeptIndex] = {
          ...newDepts[sourceDeptIndex],
          data: sourceData,
          count: sourceData.length,
        };
        newDepts[targetDeptIndex] = {
          ...newDepts[targetDeptIndex],
          data: targetData,
          count: targetData.length,
        };

        return newDepts;
      });
    },
    [],
  );

  const handleUpdateEmployeeField = useCallback(
    (
      deptId: string,
      empIndex: number,
      field: keyof Employee,
      value: string,
    ) => {
      setDepartmentsData((prev) => {
        const newDepts = [...prev];
        const deptIndex = newDepts.findIndex((d) => d.id === deptId);
        if (deptIndex === -1) return prev;

        const newEmployees = [...newDepts[deptIndex].data];
        const oldEmp = newEmployees[empIndex];
        const oldValue = oldEmp ? oldEmp[field] : undefined;
        const empName = oldEmp ? oldEmp.name : "";

        newEmployees[empIndex] = { ...oldEmp, [field]: value };
        newDepts[deptIndex] = { ...newDepts[deptIndex], data: newEmployees };

        if (
          (field === "line" || field === "machine") &&
          empName &&
          oldValue !== value
        ) {
          const fieldName = field === "line" ? "Linha" : "Loco";
          const logKey = `${deptId}-${empIndex}-${field}`;

          if (!pendingFieldLogsRef.current[logKey]) {
            pendingFieldLogsRef.current[logKey] = {
              oldValue: oldValue || "",
              timeoutId: null,
            };
          }

          const originalOldValue = pendingFieldLogsRef.current[logKey].oldValue;

          if (pendingFieldLogsRef.current[logKey].timeoutId) {
            clearTimeout(pendingFieldLogsRef.current[logKey].timeoutId!);
          }

          pendingFieldLogsRef.current[logKey].timeoutId = setTimeout(() => {
            const fromStr = `${fieldName}: ${originalOldValue || "(vazio)"}`;
            const toStr = `${fieldName}: ${value || "(vazio)"}`;
            if (originalOldValue !== value) {
              logMovement(
                empName,
                fromStr,
                toStr,
                field === "line" ? value : undefined,
                field === "machine" ? value : undefined,
              );
            }
            delete pendingFieldLogsRef.current[logKey];
          }, 1500);
        }

        return newDepts;
      });
    },
    [logMovement],
  );

  const handleDelete = useCallback(
    (deptId: string, empIndex: number) => {
      const dept = departmentsDataRef.current.find((d) => d.id === deptId);
      if (dept && dept.data[empIndex]) {
        const empId = dept.data[empIndex].id;
        firestoreService
          .deleteEmployeeDSS(selectedTurma, empId)
          .catch(console.error);
      }
      setDepartmentsData((prev) => {
        const newDepts = [...prev];
        const deptIndex = newDepts.findIndex((d) => d.id === deptId);
        if (deptIndex === -1) return prev;
        const newData = [...newDepts[deptIndex].data];
        newData.splice(empIndex, 1);
        newDepts[deptIndex] = {
          ...newDepts[deptIndex],
          data: newData,
          count: newData.length,
        };
        return newDepts;
      });
    },
    [selectedTurma],
  );

  const handleMarkEmployeeAbsent = useCallback(
    (deptId: string, empIndex: number, absenceType: StatusType) => {
      const dept = departmentsDataRef.current.find((d) => d.id === deptId);
      if (!dept) return;
      const emp = dept.data[empIndex];
      if (!emp) return;
      const empName = emp.name;
      const empMatricula = emp.matricula || "";

      if (!empName || !empName.trim()) return;

      logMovement(empName, dept.title, absenceType, emp.line, empMatricula);

      setDepartmentsData((prev) => {
        const newDepts = [...prev];
        const idx = newDepts.findIndex((d) => d.id === deptId);
        if (idx === -1) return prev;
        const newData = [...newDepts[idx].data];
        newData.splice(empIndex, 1);
        newDepts[idx] = {
          ...newDepts[idx],
          data: newData,
          count: newData.length,
        };
        return newDepts;
      });

      let targetLeftGroupIndex = -1;
      let targetRightGroupIndex = -1;

      if (absenceType === "FÉRIAS") targetLeftGroupIndex = 1;
      else if (absenceType === "FORA" || absenceType === "ATM")
        targetLeftGroupIndex = 2;
      else if (absenceType === "RESTRIÇÃO") targetRightGroupIndex = 1;
      else if (absenceType === "INSS") targetRightGroupIndex = 2;
      else if (absenceType === "TREINAMENTO" || absenceType === "REVEZAMENTO")
        targetLeftGroupIndex = 0;
      else if (absenceType === "ESTÁGIO") targetRightGroupIndex = 0;

      if (targetLeftGroupIndex !== -1) {
        setAnnotationsLeft((prev) => {
          const newGroups = [...prev];
          const group = newGroups[targetLeftGroupIndex];
          const items = [...group.items];
          if (
            items.some(
              (item) =>
                item.matricula === empMatricula && item.name === empName,
            )
          )
            return prev;
          const emptyIdx = items.findIndex(
            (item) => !item.name || !item.name.trim(),
          );
          if (emptyIdx !== -1) {
            items[emptyIdx] = {
              id: emp.id,
              name: empName,
              status: absenceType,
              matricula: empMatricula,
              originalDeptId: deptId,
            };
          } else {
            items.push({
              id: emp.id,
              name: empName,
              status: absenceType,
              matricula: empMatricula,
              originalDeptId: deptId,
            });
          }
          newGroups[targetLeftGroupIndex] = { ...group, items };
          return newGroups;
        });
      } else if (targetRightGroupIndex !== -1) {
        setAnnotationsRight((prev) => {
          const newGroups = [...prev];
          const group = newGroups[targetRightGroupIndex];
          const items = [...group.items];
          if (
            items.some(
              (item) =>
                item.matricula === empMatricula && item.name === empName,
            )
          )
            return prev;
          const emptyIdx = items.findIndex(
            (item) => !item.name || !item.name.trim(),
          );
          if (emptyIdx !== -1) {
            items[emptyIdx] = {
              id: emp.id,
              name: empName,
              status: absenceType,
              matricula: empMatricula,
              originalDeptId: deptId,
            };
          } else {
            items.push({
              id: emp.id,
              name: empName,
              status: absenceType,
              matricula: empMatricula,
              originalDeptId: deptId,
            });
          }
          newGroups[targetRightGroupIndex] = { ...group, items };
          return newGroups;
        });
      }
    },
    [],
  );

  const handleMarkSupportAbsent = useCallback(
    (groupIndex: number, empIndex: number, absenceType: StatusType) => {
      const group = supportRolesDataRef.current[groupIndex];
      if (!group) return;
      const emp = group[empIndex];
      if (!emp) return;
      const empName = emp.name;
      const empMatricula = emp.matricula || "";

      if (!empName || !empName.trim()) return;

      const supportTitles = ["Recepção", "Classificação", "Formação"];
      const groupName = `Apoio - ${supportTitles[groupIndex] || `Grupo ${groupIndex + 1}`}`;
      logMovement(empName, groupName, absenceType, undefined, empMatricula);

      setSupportRolesData((prev) => {
        const newSupport = prev.map((g) => [...g]);
        newSupport[groupIndex].splice(empIndex, 1);
        return newSupport;
      });

      let targetLeftGroupIndex = -1;
      let targetRightGroupIndex = -1;

      if (absenceType === "FÉRIAS") targetLeftGroupIndex = 1;
      else if (absenceType === "FORA" || absenceType === "ATM")
        targetLeftGroupIndex = 2;
      else if (absenceType === "RESTRIÇÃO") targetRightGroupIndex = 1;
      else if (absenceType === "INSS") targetRightGroupIndex = 2;
      else if (absenceType === "TREINAMENTO" || absenceType === "REVEZAMENTO")
        targetLeftGroupIndex = 0;
      else if (absenceType === "ESTÁGIO") targetRightGroupIndex = 0;

      const originalSupportGroupIndex = groupIndex;
      const originalSupportRole = emp.role;

      if (targetLeftGroupIndex !== -1) {
        setAnnotationsLeft((prev) => {
          const newGroups = [...prev];
          const g = newGroups[targetLeftGroupIndex];
          const items = [...g.items];
          if (
            items.some(
              (item) =>
                item.matricula === empMatricula && item.name === empName,
            )
          )
            return prev;
          const emptyIdx = items.findIndex(
            (item) => !item.name || !item.name.trim(),
          );
          const newItem = {
            id: emp.id,
            name: empName,
            status: absenceType,
            matricula: empMatricula,
            originalDeptId: undefined,
            originalSupportGroupIndex,
            originalSupportRole,
          };
          if (emptyIdx !== -1) items[emptyIdx] = newItem;
          else items.push(newItem);
          newGroups[targetLeftGroupIndex] = { ...g, items };
          return newGroups;
        });
      } else if (targetRightGroupIndex !== -1) {
        setAnnotationsRight((prev) => {
          const newGroups = [...prev];
          const g = newGroups[targetRightGroupIndex];
          const items = [...g.items];
          if (
            items.some(
              (item) =>
                item.matricula === empMatricula && item.name === empName,
            )
          )
            return prev;
          const emptyIdx = items.findIndex(
            (item) => !item.name || !item.name.trim(),
          );
          const newItem = {
            id: emp.id,
            name: empName,
            status: absenceType,
            matricula: empMatricula,
            originalDeptId: undefined,
            originalSupportGroupIndex,
            originalSupportRole,
          };
          if (emptyIdx !== -1) items[emptyIdx] = newItem;
          else items.push(newItem);
          newGroups[targetRightGroupIndex] = { ...g, items };
          return newGroups;
        });
      }
    },
    [],
  );

  const handleReturnFromAnnotation = useCallback(
    (isLeft: boolean, groupIdx: number, itemIdx: number) => {
      const groups = isLeft
        ? annotationsLeftRef.current
        : annotationsRightRef.current;
      const item = groups[groupIdx].items[itemIdx];
      if (
        !item ||
        !item.name.trim() ||
        (!item.originalDeptId &&
          (item as any).originalSupportGroupIndex === undefined)
      )
        return;

      if ((item as any).originalSupportGroupIndex !== undefined) {
        const targetGroupIdx = (item as any).originalSupportGroupIndex;
        const roleStr = (item as any).originalSupportRole || "VIRADOR";

        const supportTitles = ["Recepção", "Classificação", "Formação"];
        const groupName = `Apoio - ${supportTitles[targetGroupIdx] || `Grupo ${targetGroupIdx + 1}`}`;
        logMovement(
          item.name,
          item.status,
          groupName,
          undefined,
          item.matricula,
        );

        setSupportRolesData((prev) => {
          const newSupport = prev.map((group) => [...group]);
          if (
            newSupport[targetGroupIdx].some(
              (e) => e.matricula === item.matricula && e.name === item.name,
            )
          )
            return prev;
          newSupport[targetGroupIdx].push({
            id:
              item.id ||
              "emp-supp-" +
                Date.now() +
                "-" +
                Math.random().toString(36).substring(2, 9),
            name: item.name,
            role: roleStr,
            matricula: item.matricula || "",
          });
          return newSupport;
        });
      } else if (item.originalDeptId) {
        let deptName = item.originalDeptId;
        const dept = departmentsDataRef.current?.find(
          (d) => d.id === item.originalDeptId,
        );
        if (dept) deptName = dept.title;

        logMovement(
          item.name,
          item.status,
          deptName,
          undefined,
          item.matricula,
        );

        setDepartmentsData((prev) => {
          const newDepts = [...prev];
          const targetDeptIdx = newDepts.findIndex(
            (d) => d.id === item.originalDeptId,
          );
          if (targetDeptIdx === -1) return prev;
          if (
            newDepts[targetDeptIdx].data.some(
              (e) => e.matricula === item.matricula && e.name === item.name,
            )
          )
            return prev;

          const cleanedEmp: Employee = {
            id: item.id || "emp-" + Math.floor(Math.random() * 100000),
            name: item.name,
            matricula: item.matricula || "",
            line: "",
            machine: "",
            error: false,
          };

          const targetData = [...newDepts[targetDeptIdx].data];
          targetData.push(cleanedEmp);
          newDepts[targetDeptIdx] = {
            ...newDepts[targetDeptIdx],
            data: targetData,
            count: targetData.length,
          };
          return newDepts;
        });
      }

      if (isLeft) {
        setAnnotationsLeft((prev) => {
          const newGroups = [...prev];
          const newItems = newGroups[groupIdx].items.filter(
            (_, idx) => idx !== itemIdx,
          );
          newGroups[groupIdx] = { ...newGroups[groupIdx], items: newItems };
          return newGroups;
        });
      } else {
        setAnnotationsRight((prev) => {
          const newGroups = [...prev];
          const newItems = newGroups[groupIdx].items.filter(
            (_, idx) => idx !== itemIdx,
          );
          newGroups[groupIdx] = { ...newGroups[groupIdx], items: newItems };
          return newGroups;
        });
      }
    },
    [logMovement],
  );

  const handleReturnFromAnnotationLeft = useCallback(
    (groupIdx: number, itemIdx: number) => {
      handleReturnFromAnnotation(true, groupIdx, itemIdx);
    },
    [handleReturnFromAnnotation],
  );

  const handleReturnFromAnnotationRight = useCallback(
    (groupIdx: number, itemIdx: number) => {
      handleReturnFromAnnotation(false, groupIdx, itemIdx);
    },
    [handleReturnFromAnnotation],
  );

  const isDragActive = useMemo(() => activeId !== null, [activeId]);

  const editsByDept = useMemo(() => {
    const map: Record<string, Record<string, ActiveEdit>> = {};
    departmentsData.forEach((dept) => {
      const deptEdits: Record<string, ActiveEdit> = {};
      Object.entries(activeEdits).forEach(([empId, edit]) => {
        if (dept.data.some((e) => e.id === empId)) {
          deptEdits[empId] = edit as ActiveEdit;
        }
      });
      map[dept.id] = deptEdits;
    });
    return map;
  }, [activeEdits, departmentsData]);

  const editsByGroup = useMemo(() => {
    const map: Record<number, Record<string, ActiveEdit>> = {};
    supportRolesData.forEach((group, index) => {
      const groupEdits: Record<string, ActiveEdit> = {};
      Object.entries(activeEdits).forEach(([empId, edit]) => {
        if (group.some((e) => e.id === empId)) {
          groupEdits[empId] = edit as ActiveEdit;
        }
      });
      map[index] = groupEdits;
    });
    return map;
  }, [activeEdits, supportRolesData]);

  const {
    maxCount,
    totalMaquinistas,
    totalApoio,
    totalTurno6H,
    totalFuncionarios,
    totalFerias,
    totalFora,
    totalATM,
    totalRestricao,
    totalEstagio,
    totalINSS,
    totalTreinamento,
    totalRevezamento,
  } = useMemo(() => {
    const mCount = Math.max(...departmentsData.map((d) => d.data.length), 1);
    const tMaquinistas = departmentsData.reduce(
      (acc, dept) =>
        acc + dept.data.filter((emp) => emp.name.trim() !== "").length,
      0,
    );
    const tApoio = supportRolesData.reduce(
      (acc, group) =>
        acc + group.filter((emp) => emp.name.trim() !== "").length,
      0,
    );
    const tTurno6H = specialShiftData.filter(
      (emp) => emp.name.trim() !== "",
    ).length;

    const todasAnotacoes = [
      ...annotationsLeft.flatMap((g) => g.items),
      ...annotationsRight.flatMap((g) => g.items),
    ].filter((item) => item.name && item.name.trim() !== "");

    return {
      maxCount: mCount,
      totalMaquinistas: tMaquinistas,
      totalApoio: tApoio,
      totalTurno6H: tTurno6H,
      totalFuncionarios: tMaquinistas + tApoio + tTurno6H,
      totalFerias: todasAnotacoes.filter(
        (item) =>
          item.status.toUpperCase().includes("FÉRIA") ||
          item.status.toUpperCase().includes("FERIA"),
      ).length,
      totalFora: todasAnotacoes.filter(
        (item) => item.status.toUpperCase() === "FORA",
      ).length,
      totalATM: todasAnotacoes.filter(
        (item) =>
          item.status.toUpperCase().includes("ATM") ||
          item.status.toUpperCase().includes("ATESTADO") ||
          item.status.toUpperCase().includes("MÉDICO") ||
          item.status.toUpperCase().includes("MEDICO"),
      ).length,
      totalRestricao: todasAnotacoes.filter(
        (item) =>
          item.status.toUpperCase().includes("RESTRI") ||
          item.status.toUpperCase().includes("RESTRICAO"),
      ).length,
      totalEstagio: todasAnotacoes.filter(
        (item) =>
          item.status.toUpperCase().includes("ESTÁGIO") ||
          item.status.toUpperCase().includes("ESTAGIO"),
      ).length,
      totalINSS: todasAnotacoes.filter(
        (item) => item.status.toUpperCase() === "INSS",
      ).length,
      totalTreinamento: todasAnotacoes.filter((item) =>
        item.status.toUpperCase().includes("TREINA"),
      ).length,
      totalRevezamento: todasAnotacoes.filter((item) =>
        item.status.toUpperCase().includes("REVEZA"),
      ).length,
    };
  }, [
    departmentsData,
    supportRolesData,
    specialShiftData,
    annotationsLeft,
    annotationsRight,
  ]);

  const departmentOptions = React.useMemo(
    () => departmentsData.map((d) => ({ id: d.id, title: d.title })),
    [departmentsData],
  );

  const todayStr = React.useMemo(
    () => new Date().toLocaleDateString("pt-BR"),
    [],
  );

  if (!hasSelectedTheme) {
    return (
      <ThemeSelectionScreen
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
        onContinue={handleThemeContinue}
      />
    );
  }

  if (!selectedTurma) {
    return <TurmaSelectionScreen onSelect={setSelectedTurma} />;
  }

  return (
    <>
      <div
        className={`flex h-full w-full overflow-hidden text-[#f7fafc] font-sans selection:bg-blue-500/30 relative transition-colors duration-500 ${!isDarkMode ? "light-mode" : ""} bg-[var(--app-bg)]`}
      >
        {/* 
      <div className="shrink-0 w-[60px] md:w-[80px] h-full flex items-center pointer-events-none z-auto">
        <div className="pointer-events-auto w-full relative z-50">
          <Sidebar activePage={activePage} onPageChange={handlePageChange} isDarkMode={isDarkMode} />
        </div>
      </div>
      */}

        <div
          className={`flex-1 w-full h-full relative overflow-hidden transition-all duration-500 ${activePage === "ecossistema-mental" ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        >
          {/* iFrame Painel DSS */}
          {activePage === "painel-dss" && (
            <iframe
              src="https://painel-dss.vercel.app"
              className="w-full h-full border-0 absolute inset-0 z-0 animate-[fadeIn_0.3s_ease-in-out]"
              title="Painel DSS"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}

          {/* iFrame Circuito 001 */}
          {activePage === "circuito001" && (
            <iframe
              src="https://taplink.cc/circuito001"
              className="w-full h-full border-0 absolute inset-0 z-0 animate-[fadeIn_0.3s_ease-in-out]"
              title="Circuito 001"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}

          {/* iFrame Controle Refeição */}
          {activePage === "controles-equipes" && (
            <iframe
              src="https://controles-equipes.vercel.app/"
              className="w-full h-full border-0 absolute inset-0 z-0 animate-[fadeIn_0.3s_ease-in-out]"
              title="Controle Refeição"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}

          {activePage === "home" ? (
            <div
              ref={viewportRef}
              className={`viewport absolute inset-0 ${isDarkMode ? "bg-[#111217]" : "bg-[#eef2f7]"}`}
            >
              <div
                ref={contentWrapperRef}
                className="origin-top-left overflow-hidden"
              >
                <div
                  ref={scalableContainerRef}
                  className="scalable-container w-fit origin-top-left p-8 pb-[300px]"
                >
                  {/* Header Card */}
                  <div className="bg-[#1E2029] border border-white/5 rounded-3xl py-9 px-6 md:py-16 md:px-10 mb-8 shadow-lg flex justify-between items-center w-full transition-colors">
                    <div className="flex items-center gap-6">
                      <RadialMenu
                        activePage={activePage}
                        onPageChange={handlePageChange}
                        isDarkMode={isDarkMode}
                      />
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-4">
                          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight uppercase">
                            DISTRIBUIÇÃO - TURMA {selectedTurma}
                          </h1>
                        </div>
                        <p className="text-lg md:text-xl font-medium text-[#a0aec0]">
                          Gestão de Equipes - Monitoramento em tempo real
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-11">
                      <div className="flex items-center gap-3">
                        <div className="h-[90px] px-8 min-w-[190px] flex items-center justify-center gap-2 text-sm font-bold text-white bg-gradient-to-r from-slate-700 to-slate-800 rounded-full shadow-lg select-none cursor-default border border-white/5">
                          <Calendar className="w-7 h-7 text-slate-300" />
                          <span className="tracking-wide">{todayStr}</span>
                        </div>

                        <button
                          id="change-turma-btn"
                          onClick={() => setSelectedTurma(null)}
                          className="h-[90px] w-[190px] flex items-center justify-center gap-2 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-green-600 rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-emerald-300 cursor-pointer"
                        >
                          <ExchangeIcon className="w-7 h-7" />
                          <span className="tracking-wide">TROCAR TURMA</span>
                        </button>

                        <button
                          id="tutorial-btn"
                          onClick={handleShowTutorial}
                          className="h-[90px] w-[190px] flex items-center justify-center gap-2 text-sm font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-cyan-300 cursor-pointer"
                        >
                          <HelpIcon className="w-7 h-7" />
                          <span className="tracking-wide">TUTORIAL</span>
                        </button>

                        <label
                          className="bb8-toggle"
                          htmlFor="darkModeToggle"
                          aria-label="Alternar modo escuro"
                        >
                          <input
                            className="bb8-toggle__checkbox"
                            type="checkbox"
                            id="darkModeToggle"
                            checked={isDarkMode}
                            onChange={handleToggleDarkMode}
                          />
                          <div className="bb8-toggle__container">
                            <div className="bb8-toggle__scenery">
                              <div className="bb8-toggle__star"></div>
                              <div className="bb8-toggle__star"></div>
                              <div className="bb8-toggle__star"></div>
                              <div className="bb8-toggle__star"></div>
                              <div className="bb8-toggle__star"></div>
                              <div className="bb8-toggle__star"></div>
                              <div className="bb8-toggle__star"></div>
                              <div className="tatto-1" aria-hidden="true"></div>
                              <div className="tatto-2" aria-hidden="true"></div>
                              <div className="gomrassen"></div>
                              <div className="hermes"></div>
                              <div className="chenini"></div>
                              <div className="bb8-toggle__cloud"></div>
                              <div className="bb8-toggle__cloud"></div>
                              <div className="bb8-toggle__cloud"></div>
                            </div>
                            <div className="bb8">
                              <div className="bb8__head-container">
                                <div className="bb8__antenna"></div>
                                <div className="bb8__antenna"></div>
                                <div className="bb8__head"></div>
                              </div>
                              <div className="bb8__body"></div>
                            </div>
                            <div
                              className="artificial__hidden"
                              aria-hidden="true"
                            >
                              <div className="bb8__shadow"></div>
                            </div>
                          </div>
                        </label>

                        <button
                          id="admin-access-btn"
                          onClick={() => setIsAdminModalOpen(true)}
                          className="relative flex items-center justify-center gap-3 bg-gradient-to-r from-[#FF9F0A] to-[#FF6B00] shadow-lg shadow-[#FF6B00]/30 hover:shadow-[#FF6B00]/50 hover:-translate-y-0.5 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-orange-300/50"
                          style={{
                            width: "190px",
                            height: "90px",
                            borderRadius: "99em",
                            color: "#ffffff",
                          }}
                        >
                          <svg
                            className="w-7 h-7 shrink-0"
                            style={{ color: "#ffffff" }}
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                          </svg>
                          <span
                            style={{ color: "#ffffff" }}
                            className="text-sm font-extrabold uppercase tracking-wider leading-tight text-center"
                          >
                            ACESSO ADM
                          </span>
                        </button>
                      </div>

                      <div className="flex gap-4 pr-[10px]">
                        <StatCard
                          label="Ativos"
                          value={totalFuncionarios}
                          colorClass="text-[#30D158]"
                          bgClass="bg-[#30D158]/10"
                        />
                        <StatCard
                          label="Férias"
                          value={totalFerias}
                          colorClass="text-[#FF9F0A]"
                          bgClass="bg-[#FF9F0A]/10"
                        />
                        <StatCard
                          label="Fora"
                          value={totalFora}
                          colorClass="text-[#FF453A]"
                          bgClass="bg-[#FF453A]/10"
                        />
                        <StatCard
                          label="ATM"
                          value={totalATM}
                          colorClass="text-[#FFD60A]"
                          bgClass="bg-[#FFD60A]/10"
                        />
                        <StatCard
                          label="Restrição"
                          value={totalRestricao}
                          colorClass="text-[#BF5AF2]"
                          bgClass="bg-[#BF5AF2]/10"
                        />
                        <StatCard
                          label="Estágio"
                          value={totalEstagio}
                          colorClass="text-[#30D158]"
                          bgClass="bg-[#30D158]/10"
                        />
                        <StatCard
                          label="INSS"
                          value={totalINSS}
                          colorClass="text-[#FF453A]"
                          bgClass="bg-[#FF453A]/10"
                        />
                        <StatCard
                          label="Treinam."
                          value={totalTreinamento}
                          colorClass="text-[#0A84FF]"
                          bgClass="bg-[#0A84FF]/10"
                        />
                        <StatCard
                          label="Revezam."
                          value={totalRevezamento}
                          colorClass="text-[#32ADE6]"
                          bgClass="bg-[#32ADE6]/10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="relative w-full min-h-[60vh]">
                    {isLoadingData && (
                      <div className="absolute inset-0 z-[100] bg-[#111217]/50 backdrop-blur-[2px] rounded-3xl transition-opacity duration-300" />
                    )}

                    <DndContext
                      sensors={sensors}
                      collisionDetection={pointerWithin}
                      modifiers={dndModifiers}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDragEnd={handleDragEnd}
                      onDragCancel={handleDragCancel}
                    >
                      {/* Special Shift Section */}
                      <SpecialShiftContainer
                        is6HActive={is6HActive}
                        isEmpty={specialShiftData.length === 0}
                      >
                        {specialShiftData.length === 0 ? (
                          <div className="flex items-center justify-center gap-4 py-2 px-6 w-full">
                            <div className="p-3 rounded-xl bg-[#BF5AF2]/15 text-[#BF5AF2]">
                              <Clock className="w-6 h-6" />
                            </div>
                            <div>
                              <h2 className="text-xl font-bold text-white tracking-wide uppercase leading-none">
                                TURNO 6H
                              </h2>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-4 mb-5 ml-2">
                              <div className="p-3 rounded-xl bg-[#BF5AF2]/15 text-[#BF5AF2]">
                                <Clock className="w-6 h-6" />
                              </div>
                              <div>
                                <h2 className="text-xl font-bold text-white tracking-wide uppercase">
                                  TURNO 6H
                                </h2>
                              </div>
                            </div>
                            <div className="flex gap-4 pb-2 ml-2 pr-2">
                              {specialShiftData.map((emp, idx) => (
                                <SpecialShiftSlot
                                  key={emp.id}
                                  emp={emp}
                                  index={idx}
                                  departmentOptions={departmentOptions}
                                  onUpdate={handleUpdateSpecialShiftEmployee}
                                  onTransfer={handleTransferFromSpecialShift}
                                  activeEdit={activeEdits[emp.id]}
                                  onStartEdit={handleStartEdit}
                                  onStopEdit={handleStopEdit}
                                  isAdmin={isAdmin}
                                  isDarkMode={isDarkMode}
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </SpecialShiftContainer>
                      <div className="space-y-8">
                        <div className="flex gap-6 w-max">
                          {departmentsData.map((dept) => (
                            <div key={dept.id} className="w-[540px] shrink-0">
                              <DepartmentCard
                                department={dept}
                                departmentOptions={departmentOptions}
                                maxCount={maxCount}
                                onMove={handleMove}
                                onUpdateEmployee={handleUpdateEmployeeField}
                                onDelete={handleDelete}
                                onTransferToSpecial={
                                  handleTransferToSpecialShift
                                }
                                onMarkAbsent={handleMarkEmployeeAbsent}
                                isDarkMode={isDarkMode}
                                is6HActive={is6HActive}
                                activeEdits={
                                  editsByDept[dept.id] || EMPTY_OBJECT
                                }
                                onStartEdit={handleStartEdit}
                                onStopEdit={handleStopEdit}
                                isDragActive={isDragActive}
                                isAdmin={isAdmin}
                              />
                            </div>
                          ))}

                          <div className="w-[680px] shrink-0">
                            <AnnotationsBoard
                              leftGroups={annotationsLeft}
                              rightGroups={annotationsRight}
                              onUpdateLeft={handleUpdateAnnotationLeft}
                              onUpdateRight={handleUpdateAnnotationRight}
                              onReturnLeft={handleReturnFromAnnotationLeft}
                              onReturnRight={handleReturnFromAnnotationRight}
                              isAdmin={isAdmin}
                            />
                          </div>
                        </div>

                        <div className="pt-8 pb-4 px-2 flex items-center space-x-3">
                          <Users className="text-[#a0aec0] w-6 h-6" />
                          <h2 className="text-2xl font-semibold text-white">
                            Apoio (OOF)
                          </h2>
                        </div>

                        <div className="flex gap-6 w-max pb-8">
                          {supportRolesData.map((group, index) => (
                            <div key={index} className="w-[540px] shrink-0">
                              <SupportCard
                                roles={group}
                                groupIndex={index}
                                isDarkMode={isDarkMode}
                                is6HActive={is6HActive}
                                onUpdateRole={handleUpdateSupportRole}
                                onUpdateName={handleUpdateSupportName}
                                onUpdateMatricula={handleUpdateSupportMatricula}
                                onMoveSupport={handleMoveSupport}
                                onMoveToSpecial={
                                  handleTransferSupportToSpecialShift
                                }
                                onMarkAbsent={handleMarkSupportAbsent}
                                onDeleteSupport={handleDeleteSupport}
                                isDragActive={isDragActive}
                                activeEdits={
                                  editsByGroup[index] || EMPTY_OBJECT
                                }
                                onStartEdit={handleStartEdit}
                                onStopEdit={handleStopEdit}
                                isAdmin={isAdmin}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <DragOverlay dropAnimation={null}>{null}</DragOverlay>
                    </DndContext>

                    <Footer />
                  </div>
                </div>
              </div>
            </div>
          ) : activePage !== "painel-dss" &&
            activePage !== "ecossistema-mental" &&
            activePage !== "circuito001" &&
            activePage !== "controles-equipes" ? (
            <div
              className={`absolute inset-0 flex items-center justify-center text-2xl font-bold tracking-wider ${isDarkMode ? "text-white/50 bg-[#111217]" : "text-slate-800/50 bg-[#eef2f7]"}`}
            >
              Página {activePage} em construção...
            </div>
          ) : null}
        </div>

        {/* iFrame do Ecossistema Mental renderizado em Full Screen (por trás da barra) */}
        {activePage === "ecossistema-mental" && (
          <iframe
            src="https://ecossistema-mental.vercel.app/"
            className="w-full h-full border-0 absolute top-0 left-0 z-10 pointer-events-auto animate-[fadeIn_0.3s_ease-in-out]"
            title="Ecossistema Mental"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>
      <ModalsContainer
        isChangePasswordModalOpen={isAdminPasswordModalOpen}
        closeChangePasswordModal={() => {
          setIsAdminPasswordModalOpen(false);
          setIsAdminModalOpen(true);
        }}
        handleChangeAdminPassword={handleChangeAdminPassword}

        isAdminModalOpen={isAdminModalOpen}
        closeAdminModal={() => setIsAdminModalOpen(false)}
        adminModalProps={{
          isAdmin,
          adminLevel: adminUser?.nivel,
          onLogin: handleAdminLogin,
          onLogout: handleAdminLogout,
          onLoginError: handleAdminLoginError,
          onClearAll: handleClearAll,
          onGenerateReport: handleGenerateReport,
          onDownloadPDF: handleDownloadPDF,
          onAddUser: () => {
            setIsAddUserModalOpen(true);
            setIsAdminModalOpen(false);
          },
          onReorganize: handleReorganize,
          onImportCollaborator: () => {
            setIsImportModalOpen(true);
            setIsAdminModalOpen(false);
          },
          is6HActive,
          onToggle6H: handleToggle6H,
          onToggleAutomation: handleToggleAutomation,
          isAutomationPaused,
          onShowAuditLog: handleShowAuditLog,
          onShowDSSHistory: handleShowHistory,
          onShowHelp: handleShowHelp,
          onShowTutorial: handleShowTutorial,
          isDemoMode,
          onToggleDemoMode: handleToggleDemoMode,
          isDarkMode,
          onChangeAdminPassword: () => {
            setIsAdminModalOpen(false);
            setIsAdminPasswordModalOpen(true);
          },
          hasBiometrics: hasRegisteredBiometrics(),
          onClearBiometrics: clearBiometricData,
          onOpenManageAdmins: handleOpenManageAdmins,
        }}

        isConfirmBiometricModalOpen={isConfirmBiometricModalOpen}
        closeConfirmBiometricModal={handleCloseBiometricModal}
        handleActivateBiometrics={handleActivateBiometrics}

        isAddUserModalOpen={isAddUserModalOpen}
        closeAddUserModal={() => setIsAddUserModalOpen(false)}
        handleAddUser={handleAddNewUser}
        onAddUserBack={() => {
          setIsAddUserModalOpen(false);
          setIsAdminModalOpen(true);
        }}

        isImportModalOpen={isImportModalOpen}
        closeImportModal={() => setIsImportModalOpen(false)}
        handleImportSelected={handlePerformImport}
        onImportBack={() => {
          setIsImportModalOpen(false);
          setIsAdminModalOpen(true);
        }}

        adminEmail={adminUser?.email}
        administrators={administrators}
        isManageAdminsModalOpen={isManageAdminsModalOpen}
        closeManageAdminsModal={() => setIsManageAdminsModalOpen(false)}
        onManageAdminsBack={() => {
          setIsManageAdminsModalOpen(false);
          setIsAdminModalOpen(true);
        }}
        onOpenAddAdmin={handleOpenAddAdmin}
        onOpenEditAdmin={handleOpenEditAdmin}
        onDeleteAdmin={handleDeleteAdmin}

        isAddAdminModalOpen={isAddAdminModalOpen}
        closeAddAdminModal={() => setIsAddAdminModalOpen(false)}
        onAddAdminBack={() => {
          setIsAddAdminModalOpen(false);
          setIsManageAdminsModalOpen(true);
        }}
        handleAddAdmin={handleAddAdmin}

        isEditAdminModalOpen={isEditAdminModalOpen}
        closeEditAdminModal={() => setIsEditAdminModalOpen(false)}
        onEditAdminBack={() => {
          setIsEditAdminModalOpen(false);
          setIsManageAdminsModalOpen(true);
        }}
        adminToEdit={adminToEdit}
        handleEditAdmin={handleEditAdmin}

        isHistoryModalOpen={isHistoryModalOpen}
        closeHistoryModal={() => setIsHistoryModalOpen(false)}
        isAuditLogModalOpen={isAuditLogModalOpen}
        closeAuditLogModal={() => setIsAuditLogModalOpen(false)}
        movementLogs={movementLogs}
        onAuditLogBack={() => {
          setIsAuditLogModalOpen(false);
          setIsAdminModalOpen(true);
        }}
        onHistoryBack={() => {
          setIsHistoryModalOpen(false);
          setIsAdminModalOpen(true);
        }}

        isReportModalOpen={isReportModalOpen}
        closeReportModal={() => setIsReportModalOpen(false)}
        reportText={reportContent}
        stats={reportStats}
        onDownloadPDF={handleDownloadPDF}
        onReportBack={() => {
          setIsReportModalOpen(false);
          setIsAdminModalOpen(true);
        }}

        departmentsData={departmentsData}
        supportRolesData={supportRolesData}
        annotationsLeft={annotationsLeft}
        isDarkMode={isDarkMode}
      />

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, x: 80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className={`fixed top-6 right-6 z-[99999] text-white font-bold px-7 py-4 rounded-[16px] shadow-2xl flex items-center justify-center text-center text-sm md:text-base max-w-[320px] select-none border border-white/10 ${
              toast.type === "success"
                ? "bg-[#30D158]"
                : toast.type === "error"
                  ? "bg-[#FF453A]"
                  : "bg-[#5E5CE6]"
            }`}
            style={{
              boxShadow:
                toast.type === "success"
                  ? "0 16px 36px rgba(48, 209, 88, 0.35)"
                  : toast.type === "error"
                    ? "0 16px 36px rgba(255, 69, 58, 0.35)"
                    : "0 16px 36px rgba(94, 92, 230, 0.35)",
            }}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLoginToast && (
          <motion.div
            initial={{ opacity: 0, x: 80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="fixed top-24 right-6 z-[99999] bg-[#30D158] text-white font-bold px-7 py-4 rounded-[16px] shadow-2xl flex items-center justify-center text-center text-sm md:text-base max-w-[280px] select-none border border-white/10"
            style={{ boxShadow: "0 16px 36px rgba(48, 209, 88, 0.35)" }}
          >
            Login de administrador bem-sucedido!
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showErrorToast && (
          <motion.div
            initial={{ opacity: 0, x: 80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="fixed top-44 right-6 z-[99999] bg-[#FF453A] text-white font-bold px-7 py-4 rounded-[16px] shadow-2xl flex items-center justify-center text-center text-sm md:text-base max-w-[280px] select-none border border-white/10"
            style={{ boxShadow: "0 16px 36px rgba(255, 69, 58, 0.35)" }}
          >
            Credenciais de administrador inválidas.
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
