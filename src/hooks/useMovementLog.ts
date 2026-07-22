import React, { useCallback } from "react";
import { MovementLog, TurmaType } from "../types";
import { firestoreService } from "../services/firestoreService";

interface UseMovementLogProps {
  adminUser: { name: string; funcao?: string; email?: string } | null;
  isDemoMode: boolean;
  selectedTurma: TurmaType | null;
  setMovementLogs: React.Dispatch<React.SetStateAction<MovementLog[]>>;
}

export function useMovementLog({
  adminUser,
  isDemoMode,
  selectedTurma,
  setMovementLogs,
}: UseMovementLogProps) {
  const logMovement = useCallback(
    (
      employeeName: string,
      from: string,
      to: string,
      linha?: string,
      loco?: string,
    ) => {
      const logId =
        Date.now().toString() + Math.random().toString(36).substring(2, 7);

      const currentAdmin = adminUser
        ? adminUser.funcao
          ? `${adminUser.name} (${adminUser.funcao})`
          : adminUser.name
        : "Sistema";

      const adminName = isDemoMode
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
          linha,
          loco,
          timestamp: new Date(),
        };
        return [newLog, ...prev].slice(0, 500);
      });

      if (!isDemoMode && selectedTurma) {
        firestoreService.saveMovementLog(selectedTurma, {
          id: logId,
          adminName: adminName,
          employeeName,
          from,
          to,
          linha,
          loco,
          timestamp: new Date(),
        });
      }
    },
    [adminUser, isDemoMode, selectedTurma, setMovementLogs],
  );

  return { logMovement };
}
