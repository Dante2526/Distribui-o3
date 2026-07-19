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
  rectIntersection,
  pointerWithin,
  closestCenter,
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

function mergeArray<T>(prev: T[], next: T[]): T[] {
  if (
    prev.length === next.length &&
    prev.every((item, i) => item === next[i])
  ) {
    return prev;
  }
  return next;
}

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
import { useAdminAuth } from "./hooks/useAdminAuth";
import { useAppModals } from "./hooks/useAppModals";
import { useBoardPanZoom } from "./hooks/useBoardPanZoom";
import { useBoardMutations } from "./hooks/useBoardMutations";
import { useDashboardData } from "./hooks/useDashboardData";
import { useFirebaseSync } from "./hooks/useFirebaseSync";
import { useMovementLog } from "./hooks/useMovementLog";
import { useDragAndDrop } from "./hooks/useDragAndDrop";

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

  const urlParams = new URLSearchParams(window.location.search);
  const isMock = urlParams.get("mock") === "true";

  const handleThemeContinue = useCallback(() => {
    localStorage.setItem("distribui-theme-selected", "true");
    setHasSelectedTheme(true);
  }, []);

  const [activePage, setActivePage] = useState(() => {
    return localStorage.getItem("distribui-page") || "home";
  });
  const [administrators, setAdministrators] = useState<any[]>([]);

  const {
    isAdminModalOpen,
    setIsAdminModalOpen,
    isAddUserModalOpen,
    setIsAddUserModalOpen,
    isImportModalOpen,
    setIsImportModalOpen,
    isAdminPasswordModalOpen,
    setIsAdminPasswordModalOpen,
    isHistoryModalOpen,
    setIsHistoryModalOpen,
    isAuditLogModalOpen,
    setIsAuditLogModalOpen,
    isReportModalOpen,
    setIsReportModalOpen,
    isConfirmBiometricModalOpen,
    setIsConfirmBiometricModalOpen,
    isManageAdminsModalOpen,
    setIsManageAdminsModalOpen,
    isAddAdminModalOpen,
    setIsAddAdminModalOpen,
    isEditAdminModalOpen,
    setIsEditAdminModalOpen,
    adminToEdit,
    setAdminToEdit,
    reportContent,
    setReportContent,
    reportStats,
    setReportStats,
    handleOpenManageAdmins,
    handleOpenAddAdmin,
    handleOpenEditAdmin,
    handleShowHistory,
    handleShowAuditLog,
    handleShowHelp,
    handleShowTutorial,
  } = useAppModals(setAdministrators, setToast);

  const {
    isAdmin,
    adminUser,
    showLoginToast,
    showErrorToast,
    handleAdminLogin,
    handleAdminLogout,
    handleChangeAdminPassword,
    handleActivateBiometrics,
    handleAdminLoginError,
    handleCloseBiometricModal,
    handleAddAdmin,
    handleEditAdmin,
    handleDeleteAdmin,
  } = useAdminAuth(
    isMock,
    setToast,
    setIsAdminModalOpen,
    setIsConfirmBiometricModalOpen,
    setIsAdminPasswordModalOpen,
    setAdministrators,
  );

  // Inicializa o state do history se não existir
  useEffect(() => {
    if (!window.history.state || !window.history.state.page) {
      window.history.replaceState({ page: activePage }, "");
    }
  }, [activePage]);

  // Algoritmo de Colisão customizado e robusto
  const customCollisionDetection = useCallback((args: any) => {
    // 1. Onde está o mouse de fato?
    const pointerCollisions = pointerWithin(args);

    if (pointerCollisions.length > 0) {
      // Se o mouse estiver tocando em qualquer área (containers ou cards),
      // filtramos os droppables apenas para os que o mouse toca, e usamos closestCenter para desempatar matematicamente.
      return closestCenter({
        ...args,
        droppableContainers: args.droppableContainers.filter((container: any) =>
          pointerCollisions.some((c: any) => c.id === container.id),
        ),
      });
    }

    // 2. Fallback: Se o mouse estiver num gap (espaço vazio fora de áreas droppable),
    // o closestCenter padrão tende a puxar o card para o Turno 6H. Isso ocorre pelo "viés vertical":
    // o centro das colunas (que são altas) fica lá embaixo, enquanto o centro do Turno 6H fica
    // no topo (perto de onde o card está sendo arrastado).
    // Correção: Removemos o Turno 6H e seus cards da avaliação de fallback! Ele só poderá ser
    // focado se o ponteiro do mouse entrar fisicamente nele (acionando o if acima).
    return closestCenter({
      ...args,
      droppableContainers: args.droppableContainers.filter(
        (container: any) =>
          container.id !== "special-shift" &&
          container.data?.current?.type !== "special",
      ),
    });
  }, []);

  // Configurações e estados do painel

  useEffect(() => {
    localStorage.setItem("distribui-page", activePage);
  }, [activePage]);

  // Histórico de Movimentações

  const isReceivingSnapshotRef = useRef(false);
  const isDragActiveRef = useRef(false);
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

  // Efeito principal de sincronização de dados (Firebase vs Mock) extraído para Hook
  useFirebaseSync({
    selectedTurma,
    isDemoMode,
    isTabVisible,
    setActiveEdits,
  });

  // Efeito para carregar o histórico de logs apenas quando o modal for aberto
  useEffect(() => {
    if (isDemoMode || !selectedTurma || !isAuditLogModalOpen || !isTabVisible)
      return;

    const unsubscribeLogs = firestoreService.subscribeToHistory(
      selectedTurma,
      (logs) => {
        setMovementLogs(logs);
      },
    );

    return () => {
      unsubscribeLogs();
    };
  }, [isDemoMode, selectedTurma, isAuditLogModalOpen, isTabVisible]);

  // Efeito ÚNICO de Montagem da Interface (Single Database)
  useEffect(() => {
    if (isDemoMode || !selectedTurma || !isTabVisible) return;

    if (isMock) {
      const mockEmployees = [
        {
          id: "emp-dept-1",
          name: "NAYLAN MOREIRA",
          matricula: "81025193",
          local: "Recepcao",
          tagType: "MAQUINISTA",
          line: "",
          machine: "",
        },
        {
          id: "emp-dept-2",
          name: "LUCAS SILVA",
          matricula: "12345678",
          local: "Classificacao",
          tagType: "MAQUINISTA",
          line: "",
          machine: "",
        },
        {
          id: "emp-dept-3",
          name: "MARIA SOUSA",
          matricula: "87654321",
          local: "Formacao",
          tagType: "MAQUINISTA",
          line: "",
          machine: "",
        },
      ] as Employee[];
      dssEmployeesRef.current = mockEmployees;

      const newDepts = JSON.parse(JSON.stringify(initialDepartmentsData)).map(
        (dept: any) => {
          const empLocal = mockEmployees.filter((e) =>
            e.local?.toLowerCase().includes(dept.id.toLowerCase()),
          );
          return { ...dept, count: empLocal.length, data: empLocal };
        },
      );
      setDepartmentsData(newDepts);
      setIsLoadingData(false);
      return;
    }

    const unsubscribeDSS = firestoreService.subscribeToDSS(
      selectedTurma,
      (dssEmployees) => {
        if (isDragActiveRef.current) return;

        dssEmployeesRef.current = dssEmployees;

        const newDepts = initialDepartmentsData.map((d: any) => ({
          ...d,
          data: [],
          count: 0,
        }));
        const newSupport = initialSupportData.map(() => [] as any[]);
        const newAnnotationsLeft = initialAnnotationsLeft.map((g: any) => ({
          ...g,
          items: [],
        }));
        const newAnnotationsRight = initialAnnotationsRight.map((g: any) => ({
          ...g,
          items: [],
        }));
        const newSpecial: any[] = [];

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
            if (statusNormal.includes("feria")) {
              newAnnotationsLeft[1].items.push(emp);
            } else if (statusNormal.includes("inss")) {
              newAnnotationsRight[2].items.push(emp);
            } else if (
              statusNormal.includes("fora") ||
              statusNormal.includes("atm") ||
              statusNormal.includes("atestado") ||
              statusNormal.includes("medico")
            ) {
              newAnnotationsLeft[2].items.push(emp);
            } else if (statusNormal.includes("restri")) {
              newAnnotationsRight[1].items.push(emp);
            } else if (
              statusNormal.includes("estagio") ||
              statusNormal.includes("estágio") ||
              statusNormal.includes("maq") ||
              statusNormal.includes("off")
            ) {
              newAnnotationsRight[0].items.push(emp);
            } else if (
              statusNormal.includes("treina") ||
              statusNormal.includes("reveza") ||
              statusNormal.includes("te")
            ) {
              newAnnotationsLeft[0].items.push(emp);
            } else {
              newAnnotationsLeft[2].items.push(emp); // Default Fora
            }
            return; // Skip other boards if absent
          }

          const localLower = rawLocal.toLowerCase();

          if (
            localLower === "classificacao" ||
            localLower === "classificação"
          ) {
            newDepts.find((d: any) => d.id === "classificacao")?.data.push(emp);
          } else if (localLower === "formacao" || localLower === "formação") {
            newDepts.find((d: any) => d.id === "formacao")?.data.push(emp);
          } else if (
            localLower.startsWith("recepcao") ||
            localLower.startsWith("recepção")
          ) {
            newDepts.find((d: any) => d.id === "recepcao")?.data.push(emp);
          } else if (localLower === "turno 6h") {
            newSpecial.push(emp);
          } else if (localLower.startsWith("apoio ")) {
            const suffix = localLower.replace("apoio ", "").trim();
            let idx = -1;
            if (suffix === "recepcao" || suffix === "recepção") idx = 0;
            else if (suffix === "classificacao" || suffix === "classificação")
              idx = 1;
            else if (suffix === "formacao" || suffix === "formação") idx = 2;
            else idx = parseInt(suffix, 10);

            if (!isNaN(idx) && newSupport[idx]) {
              newSupport[idx].push({ ...emp, role: (emp as any)._role || "" });
            }
          } else {
            // Fallback para quando o local não está definido (como quando recém-criado)
            if (emp.tagType === "OOF") {
              if (newSupport[1])
                newSupport[1].push({ ...emp, role: (emp as any)._role || "" });
            } else {
              newDepts
                .find((d: any) => d.id === "classificacao")
                ?.data.push(emp);
            }
          }
        });

        newDepts.forEach((d: any) => {
          d.count = d.data.length;
        });

        if (!hasInitialDataLoadedRef.current) {
          hasInitialDataLoadedRef.current = true;
          setIsLoadingData(false);
          lastUpdateSourceRef.current = "dss_init";
        } else {
          lastUpdateSourceRef.current = "dss_update";
        }

        setDepartmentsData((prev) =>
          prev.map((d, i) => {
            const mergedData = mergeArray(d.data, newDepts[i].data);
            return mergedData === d.data
              ? d
              : { ...newDepts[i], data: mergedData };
          }),
        );
        setSupportRolesData((prev) => {
          const merged = prev.map((group, i) =>
            mergeArray(group, newSupport[i]),
          );
          return mergeArray(prev, merged);
        });
        setAnnotationsLeft((prev) => {
          const merged = prev.map((group, i) => {
            const mergedItems = mergeArray(
              group.items,
              newAnnotationsLeft[i].items,
            );
            return mergedItems === group.items
              ? group
              : { ...newAnnotationsLeft[i], items: mergedItems };
          });
          return mergeArray(prev, merged);
        });
        setAnnotationsRight((prev) => {
          const merged = prev.map((group, i) => {
            const mergedItems = mergeArray(
              group.items,
              newAnnotationsRight[i].items,
            );
            return mergedItems === group.items
              ? group
              : { ...newAnnotationsRight[i], items: mergedItems };
          });
          return mergeArray(prev, merged);
        });
        setSpecialShiftData((prev) => mergeArray(prev, newSpecial));
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

  const { logMovement } = useMovementLog({
    adminUser,
    isDemoMode,
    selectedTurma,
    setMovementLogs,
  });

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
              id:
                "emp-imp-" +
                Date.now() +
                "-" +
                Math.random().toString(36).substring(2, 9),
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

  const handleToggle6H = useCallback(() => {
    setIs6HActive((prev) => {
      const next = !prev;
      setToast({
        message: next
          ? "Visualização do Turno 6H ativada!"
          : "Visualização do Turno 6H desativada!",
        type: "success",
      });
      return next;
    });
  }, [setToast, setIs6HActive]);

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

  const handleStartEditRef = useRef(handleStartEdit);
  const handleStopEditRef = useRef(handleStopEdit);
  const logMovementRef = useRef(logMovement);
  useEffect(() => {
    handleStartEditRef.current = handleStartEdit;
    handleStopEditRef.current = handleStopEdit;
    logMovementRef.current = logMovement;
  }, [handleStartEdit, handleStopEdit, logMovement]);

  const {
    sensors,
    handleDragStart,
    handleDragCancel,
    handleDragOver,
    handleDragEnd,
    activeId,
    activeItem,
    activeType,
    overId,
    activeSupportId,
  } = useDragAndDrop({
    isAdmin,
    handleStartEditRef,
    handleStopEditRef,
    logMovementRef,
    departmentsData,
    supportRolesData,
    specialShiftData,
    setDepartmentsData,
    setSupportRolesData,
    setSpecialShiftData,
    selectedTurma,
  });

  const wrappedHandleDragStart = useCallback(
    (e: any) => {
      isDragActiveRef.current = true;
      handleDragStart(e);
    },
    [handleDragStart],
  );

  const wrappedHandleDragEnd = useCallback(
    (e: any) => {
      try {
        handleDragEnd(e);
      } finally {
        isDragActiveRef.current = false;
      }
    },
    [handleDragEnd],
  );

  const wrappedHandleDragCancel = useCallback(() => {
    try {
      handleDragCancel();
    } finally {
      isDragActiveRef.current = false;
    }
  }, [handleDragCancel]);

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

    const isSwitchingToDark = !isDarkMode;

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

  // --- Viewport & Scale Refs (Painel DSS Pattern) ---
  const {
    viewportRef,
    contentWrapperRef,
    scalableContainerRef,
    scaleStateRef,
    dndModifiers,
    setScale,
    initializeScale,
  } = useBoardPanZoom(isAdmin, activePage, selectedTurma);

  const {
    handleClearAll,
    handleGenerateReport,
    handleReorganize,
    handleUpdateSpecialShiftEmployee,
    handleTransferToSpecialShift,
    handleTransferSupportToSpecialShift,
    handleTransferFromSpecialShift,
    handleUpdateAnnotationLeft,
    handleUpdateAnnotationRight,
    handleUpdateSupportRole,
    handleUpdateSupportName,
    handleUpdateSupportMatricula,
    handleDeleteSupport,
    handleMoveSupport,
    handleMove,
    handleUpdateEmployeeField,
    handleDelete,
    handleMarkEmployeeAbsent,
    handleMarkSupportAbsent,
  } = useBoardMutations({
    departmentsData,
    setDepartmentsData,
    supportRolesData,
    setSupportRolesData,
    specialShiftData,
    setSpecialShiftData,
    annotationsLeft,
    setAnnotationsLeft,
    annotationsRight,
    setAnnotationsRight,
    logMovement,
    selectedTurma,
    showToastMessage,
    reportContent,
    setReportContent,
    setReportStats,
    setIsReportModalOpen,
    setIsAdminModalOpen,
  });

  // Bug 14: debounce igual ao handleUpdateEmployeeField para não inundar o histórico

  const handleReturnFromAnnotation = useCallback(
    (isLeft: boolean, groupIdx: number, itemIdx: number) => {
      const groups = isLeft
        ? annotationsLeftRef.current
        : annotationsRightRef.current;
      const item = groups[groupIdx].items[itemIdx];
      if (
        !item ||
        !item.name.trim() ||
        (!item.localOriginal &&
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
        firestoreService.updateEmployeeAbsentDSS(
          selectedTurma,
          item.id,
          false,
          "",
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
      } else if (item.localOriginal) {
        let deptName = item.localOriginal;
        const dept = departmentsData?.find((d) => d.id === item.localOriginal);
        if (dept) deptName = dept.title;

        logMovement(
          item.name,
          item.status,
          deptName,
          undefined,
          item.matricula,
        );
        firestoreService.updateEmployeeAbsentDSS(
          selectedTurma,
          item.id,
          false,
          "",
        );

        setDepartmentsData((prev) => {
          const newDepts = [...prev];
          const targetDeptIdx = newDepts.findIndex(
            (d) => d.id === item.localOriginal,
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
    [selectedTurma, departmentsData, logMovement],
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
          (item.status || "").toUpperCase().includes("FÉRIA") ||
          (item.status || "").toUpperCase().includes("FERIA"),
      ).length,
      totalFora: todasAnotacoes.filter(
        (item) => (item.status || "").toUpperCase() === "FORA",
      ).length,
      totalATM: todasAnotacoes.filter(
        (item) =>
          (item.status || "").toUpperCase().includes("ATM") ||
          (item.status || "").toUpperCase().includes("ATESTADO") ||
          (item.status || "").toUpperCase().includes("MÉDICO") ||
          (item.status || "").toUpperCase().includes("MEDICO"),
      ).length,
      totalRestricao: todasAnotacoes.filter(
        (item) =>
          (item.status || "").toUpperCase().includes("RESTRI") ||
          (item.status || "").toUpperCase().includes("RESTRICAO"),
      ).length,
      totalEstagio: todasAnotacoes.filter(
        (item) =>
          (item.status || "").toUpperCase().includes("ESTÁGIO") ||
          (item.status || "").toUpperCase().includes("ESTAGIO"),
      ).length,
      totalINSS: todasAnotacoes.filter(
        (item) => (item.status || "").toUpperCase() === "INSS",
      ).length,
      totalTreinamento: todasAnotacoes.filter((item) =>
        (item.status || "").toUpperCase().includes("TREINA"),
      ).length,
      totalRevezamento: todasAnotacoes.filter((item) =>
        (item.status || "").toUpperCase().includes("REVEZA"),
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
                      collisionDetection={customCollisionDetection}
                      modifiers={dndModifiers}
                      onDragStart={wrappedHandleDragStart}
                      onDragOver={handleDragOver}
                      onDragEnd={wrappedHandleDragEnd}
                      onDragCancel={wrappedHandleDragCancel}
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

                      <DragOverlay dropAnimation={undefined}>
                        {activeItem && activeType === "maquinista" ? (
                          <div className="w-[500px]">
                            <EmployeeRow
                              emp={activeItem}
                              index={0}
                              department={
                                departmentsData.find((d) =>
                                  d.data.some((e) => e.id === activeItem.id),
                                ) || departmentsData[0]
                              }
                              departmentOptions={departmentOptions}
                              onMove={() => {}}
                              onUpdateEmployee={() => {}}
                              onDelete={() => {}}
                              onTransferToSpecial={() => {}}
                              onMarkAbsent={() => {}}
                              isDarkMode={isDarkMode}
                              is6HActive={is6HActive}
                              isDragOverlay={true}
                              activeEdit={undefined}
                              onStartEdit={() => {}}
                              onStopEdit={() => {}}
                              isGhost={false}
                              isDragActive={true}
                              isAdmin={isAdmin}
                            />
                          </div>
                        ) : activeItem && activeType === "apoio" ? (
                          <div className="w-[500px]">
                            <SupportRoleRow
                              emp={activeItem}
                              index={0}
                              groupIndex={0}
                              isDarkMode={isDarkMode}
                              is6HActive={is6HActive}
                              onUpdateRole={() => {}}
                              onUpdateName={() => {}}
                              onUpdateMatricula={() => {}}
                              onMove={() => {}}
                              onMoveToSpecial={() => {}}
                              onMarkAbsent={() => {}}
                              onDelete={() => {}}
                              isDragOverlay={true}
                              isDragActive={true}
                              activeEdit={undefined}
                              onStartEdit={() => {}}
                              onStopEdit={() => {}}
                              isAdmin={isAdmin}
                            />
                          </div>
                        ) : activeItem && activeType === "special" ? (
                          <div className="w-[480px]">
                            <SpecialShiftSlot
                              emp={activeItem}
                              index={0}
                              departmentOptions={departmentOptions}
                              onUpdate={() => {}}
                              onTransfer={() => {}}
                              isDarkMode={isDarkMode}
                              isDragOverlay={true}
                              activeEdit={undefined}
                              onStartEdit={() => {}}
                              onStopEdit={() => {}}
                              isAdmin={isAdmin}
                            />
                          </div>
                        ) : null}
                      </DragOverlay>
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
