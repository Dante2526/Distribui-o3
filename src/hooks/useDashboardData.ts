import { useState, useEffect } from "react";
import {
  Employee,
  Department,
  SupportRole,
  AnnotationGroup,
  MovementLog,
  TurmaType,
  ActiveEdit,
} from "../types";

export function useDashboardData() {
  const [departmentsData, setDepartmentsData] = useState<Department[]>([
    { id: "recepcao", title: "Recepção", count: 0, data: [] },
    { id: "classificacao", title: "Classificação", count: 0, data: [] },
    { id: "formacao", title: "Formação", count: 0, data: [] },
  ]);
  const [supportRolesData, setSupportRolesData] = useState<SupportRole[][]>([
    [],
    [],
    [],
  ]);
  const [annotationsLeft, setAnnotationsLeft] = useState<AnnotationGroup[]>([
    { title: "FÉRIAS/TE/TREIN./REVEZA", items: [] },
    { title: "FÉRIAS", items: [] },
    { title: "ATM / FORA", items: [] },
  ]);
  const [annotationsRight, setAnnotationsRight] = useState<AnnotationGroup[]>([
    { title: "MAQ/OFF - ESTÁGIO", items: [] },
    { title: "RESTRIÇÃO", items: [] },
    { title: "INSS", items: [] },
  ]);
  const [specialShiftData, setSpecialShiftData] = useState<Employee[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("distribui-theme");
    return saved !== "light";
  });

  const [is6HActive, setIs6HActive] = useState(true);
  const [isAutomationPaused, setIsAutomationPaused] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "info" | "error";
  } | null>(null);

  const [selectedTurma, setSelectedTurma] = useState<TurmaType | null>(() => {
    const saved = localStorage.getItem("distribui-turma");
    const validTurmas: TurmaType[] = ["A", "B", "C", "D"];
    return saved && validTurmas.includes(saved as TurmaType)
      ? (saved as TurmaType)
      : null;
  });

  const [movementLogs, setMovementLogs] = useState<MovementLog[]>([]);
  const [isTabVisible, setIsTabVisible] = useState(true);
  const [activeEdits, setActiveEdits] = useState<Record<string, ActiveEdit>>(
    {},
  );

  useEffect(() => {
    if (selectedTurma) {
      localStorage.setItem("distribui-turma", selectedTurma);
    } else {
      localStorage.removeItem("distribui-turma");
    }
  }, [selectedTurma]);

  return {
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
  };
}
