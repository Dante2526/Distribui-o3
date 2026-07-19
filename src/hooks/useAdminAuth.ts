import { useState, useCallback, useRef, useEffect } from "react";
import { firestoreService } from "../services/firestoreService";
import {
  isMobileCellularWithBiometrics,
  hasRegisteredBiometrics,
  clearBiometricData,
  registerBiometricAdmin,
} from "../services/biometricService";

export function useAdminAuth(
  isMock: boolean,
  setToast: (
    toast: { message: string; type: "success" | "error" | "info" } | null,
  ) => void,
  setIsAdminModalOpen: (open: boolean) => void,
  setIsConfirmBiometricModalOpen: (open: boolean) => void,
  setIsAdminPasswordModalOpen: (open: boolean) => void,
  setAdministrators: (admins: any[]) => void,
) {
  const [isAdmin, setIsAdmin] = useState(isMock);
  const [adminUser, setAdminUser] = useState<{
    name: string;
    email: string;
    color?: string;
    funcao?: string;
    nivel?: string;
  } | null>(isMock ? { name: "Mock Admin", email: "mock@admin.com" } : null);
  const [showLoginToast, setShowLoginToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);

  const loginToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (loginToastTimerRef.current) clearTimeout(loginToastTimerRef.current);
      if (errorToastTimerRef.current) clearTimeout(errorToastTimerRef.current);
    };
  }, []);

  const handleAdminLogin = useCallback(
    async (adminData: { name: string; email: string; color?: string }) => {
      setIsAdmin(true);
      setAdminUser(adminData);
      setIsAdminModalOpen(false);
      setShowLoginToast(true);
      if (loginToastTimerRef.current) clearTimeout(loginToastTimerRef.current);
      loginToastTimerRef.current = setTimeout(
        () => setShowLoginToast(false),
        3500,
      );

      const isCell = await isMobileCellularWithBiometrics();
      const hasBio = hasRegisteredBiometrics();
      if (isCell && !hasBio) {
        setIsConfirmBiometricModalOpen(true);
      }
    },
    [setIsAdminModalOpen, setIsConfirmBiometricModalOpen],
  );

  const handleAdminLogout = useCallback(() => {
    setIsAdmin(false);
    setAdminUser(null);
    setIsAdminModalOpen(false);
  }, [setIsAdminModalOpen]);

  const handleCloseBiometricModal = useCallback(() => {
    setIsConfirmBiometricModalOpen(false);
  }, [setIsConfirmBiometricModalOpen]);

  const handleChangeAdminPassword = async (newPassword: string) => {
    if (!adminUser?.email) return;
    try {
      await firestoreService.updateAdminPassword(adminUser.email, newPassword);
      setToast({ message: "Senha alterada com sucesso!", type: "success" });
      setIsAdminPasswordModalOpen(false);
      setIsAdminModalOpen(true);
      clearBiometricData();
    } catch (error: any) {
      console.error(error);
      setToast({
        message: error.message || "Erro ao alterar senha",
        type: "error",
      });
    }
  };

  const handleActivateBiometrics = useCallback(async () => {
    try {
      if (!adminUser?.email) throw new Error("Email não encontrado");
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
  }, [adminUser, setToast, setIsConfirmBiometricModalOpen]);

  const handleAdminLoginError = useCallback(() => {
    setShowErrorToast(true);
    if (errorToastTimerRef.current) clearTimeout(errorToastTimerRef.current);
    errorToastTimerRef.current = setTimeout(
      () => setShowErrorToast(false),
      3500,
    );
  }, []);

  const handleDeleteAdmin = useCallback(
    async (id: string, name?: string, matricula?: string) => {
      try {
        await firestoreService.deleteAdministrator(id);
        setToast({
          message: `ADM ${name || matricula} excluído com sucesso!`,
          type: "success",
        });
        const updatedAdmins = await firestoreService.getAdministrators();
        setAdministrators(updatedAdmins);
      } catch (err: any) {
        setToast({
          message: "Erro ao excluir ADM: " + err.message,
          type: "error",
        });
      }
    },
    [setToast],
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
        setToast({
          message: `ADM ${name} adicionado com sucesso!`,
          type: "success",
        });
        const updatedAdmins = await firestoreService.getAdministrators();
        setAdministrators(updatedAdmins);
      } catch (err: any) {
        setToast({
          message: "Erro ao adicionar ADM: " + err.message,
          type: "error",
        });
      }
    },
    [setToast],
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
        setToast({
          message: `ADM ${name} atualizado com sucesso!`,
          type: "success",
        });
        const updatedAdmins = await firestoreService.getAdministrators();
        setAdministrators(updatedAdmins);
      } catch (err: any) {
        setToast({
          message: "Erro ao editar ADM: " + err.message,
          type: "error",
        });
      }
    },
    [setToast],
  );

  return {
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
  };
}
