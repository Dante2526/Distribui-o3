import { useState, useCallback } from "react";
import { firestoreService } from "../services/firestoreService";

export function useAppModals(
  setAdministrators: (admins: any[]) => void,
  setToast: (
    toast: { message: string; type: "success" | "error" | "info" } | null,
  ) => void,
) {
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAdminPasswordModalOpen, setIsAdminPasswordModalOpen] =
    useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isAuditLogModalOpen, setIsAuditLogModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isConfirmBiometricModalOpen, setIsConfirmBiometricModalOpen] =
    useState(false);
  const [isManageAdminsModalOpen, setIsManageAdminsModalOpen] = useState(false);
  const [isAddAdminModalOpen, setIsAddAdminModalOpen] = useState(false);
  const [isEditAdminModalOpen, setIsEditAdminModalOpen] = useState(false);
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

  const handleOpenManageAdmins = useCallback(async () => {
    setIsAdminModalOpen(false);
    const admins = await firestoreService.getAdministrators();
    setAdministrators(admins);
    setIsManageAdminsModalOpen(true);
  }, [setAdministrators]);

  const handleOpenAddAdmin = useCallback(() => {
    setIsManageAdminsModalOpen(false);
    setIsAddAdminModalOpen(true);
  }, []);

  const handleOpenEditAdmin = useCallback(
    (id: string, administrators: any[]) => {
      const admin = administrators.find((a) => a.id === id);
      if (admin) {
        setAdminToEdit(admin);
        setIsManageAdminsModalOpen(false);
        setIsEditAdminModalOpen(true);
      }
    },
    [],
  );

  const handleShowHistory = useCallback(() => {
    setIsHistoryModalOpen(true);
    setIsAdminModalOpen(false);
  }, []);

  const handleShowAuditLog = useCallback(() => {
    setIsAuditLogModalOpen(true);
    setIsAdminModalOpen(false);
  }, []);

  const handleShowHelp = useCallback(() => {
    setToast({
      message: "Central de ajuda: Suporte técnico ativo.",
      type: "info",
    });
  }, [setToast]);

  const handleShowTutorial = useCallback(() => {
    setToast({
      message: "Tutorial de distribuição iniciado!",
      type: "success",
    });
  }, [setToast]);

  return {
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
  };
}
