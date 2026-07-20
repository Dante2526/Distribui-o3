import React, { useCallback, useRef, useEffect } from "react";
import type {
  Department,
  SupportRole,
  Employee,
  AnnotationGroup,
  AnnotationItem,
  StatusType,
  TurmaType,
} from "../types";
import { firestoreService } from "../services/firestoreService";

export interface UseBoardMutationsProps {
  departmentsData: Department[];
  setDepartmentsData: React.Dispatch<React.SetStateAction<Department[]>>;
  supportRolesData: SupportRole[][];
  setSupportRolesData: React.Dispatch<React.SetStateAction<SupportRole[][]>>;
  specialShiftData: Employee[];
  setSpecialShiftData: React.Dispatch<React.SetStateAction<Employee[]>>;
  annotationsLeft: AnnotationGroup[];
  setAnnotationsLeft: React.Dispatch<React.SetStateAction<AnnotationGroup[]>>;
  annotationsRight: AnnotationGroup[];
  setAnnotationsRight: React.Dispatch<React.SetStateAction<AnnotationGroup[]>>;
  setIsAdminModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  logMovement: (
    empName: string,
    fromStr: string,
    toStr: string,
    line?: string,
    matricula?: string,
  ) => void;
  selectedTurma: TurmaType | null;
  showToastMessage: (
    message: string,
    type?: "success" | "error" | "info",
  ) => void;
  reportContent: string;
  setReportContent: React.Dispatch<React.SetStateAction<string>>;
  setReportStats: React.Dispatch<React.SetStateAction<any>>;
  setIsReportModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useBoardMutations({
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
}: UseBoardMutationsProps) {
  const pendingFieldLogsRef = useRef<Record<string, NodeJS.Timeout>>({});
  const selectedTurmaRef = useRef(selectedTurma);

  useEffect(() => {
    selectedTurmaRef.current = selectedTurma;
  }, [selectedTurma]);

  const handleClearAll = useCallback(async () => {
    try {
      if (selectedTurmaRef.current) {
        await firestoreService.clearAllEmployeeFieldsDSS(
          selectedTurmaRef.current,
        );
      }
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
    } catch (error) {
      showToastMessage(
        "Erro ao limpar dados no servidor. Tente novamente.",
        "error",
      );
    }
  }, [
    showToastMessage,
    setIsAdminModalOpen,
    setDepartmentsData,
    setSpecialShiftData,
  ]);

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
    const totalFuncionários = totalMaquinistas + totalApoio + totalTurno6H;

    const todasAnotacoes = [
      ...annotationsLeft.flatMap((g) => g.items),
      ...annotationsRight.flatMap((g) => g.items),
    ].filter((item) => item.name && item.name.trim() !== "");

    const totalFerias = todasAnotacoes.filter(
      (item) =>
        (item.status || "").toUpperCase().includes("FÉRIA") ||
        (item.status || "").toUpperCase().includes("FERIA"),
    ).length;
    const totalFora = todasAnotacoes.filter(
      (item) => (item.status || "").toUpperCase() === "FORA",
    ).length;
    const totalATM = todasAnotacoes.filter((item) =>
      (item.status || "").toUpperCase().includes("ATM"),
    ).length;

    let report = `RESUMO GERAL - DISTRIBUIÇÃO DE EQUIPES\n`;
    report += `• Total de Funcionários Ativos: ${totalFuncionários}\n`;
    report += `• Maquinistas: ${totalMaquinistas}\n`;
    report += `• Apoio: ${totalApoio}\n`;
    report += `• Turno 6H: ${totalTurno6H}\n\n`;
    report += `AFASTAMENTOS:\n`;
    report += `• Férias: ${totalFerias}\n`;
    report += `• Fora: ${totalFora}\n`;
    report += `• ATM: ${totalATM}\n`;
    report += `• Restrição: ${todasAnotacoes.filter((item) => (item.status || "").toUpperCase().includes("RESTRIÇÃO") || (item.status || "").toUpperCase().includes("RESTRICAO")).length}\n`;
    report += `• Estágio: ${todasAnotacoes.filter((item) => (item.status || "").toUpperCase().includes("ESTÃGIO") || (item.status || "").toUpperCase().includes("ESTAGIO")).length}\n`;
    report += `• INSS: ${todasAnotacoes.filter((item) => (item.status || "").toUpperCase() === "INSS").length}\n`;
    report += `• Treinamento: ${todasAnotacoes.filter((item) => (item.status || "").toUpperCase().includes("TREINA")).length}\n`;
    report += `• Revezamento: ${todasAnotacoes.filter((item) => (item.status || "").toUpperCase().includes("REVEZA")).length}\n\n`;
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
      presentes: totalFuncionários,
      afastados: todasAnotacoes.length,
      afastadosList: todasAnotacoes.map((a) => a.name),
      ausentes: todasAnotacoes.filter((item) => {
        const s = (item.status || "").toUpperCase();
        return (
          s.includes("FÉRIA") ||
          s.includes("FERIA") ||
          s === "FORA" ||
          s.includes("ATM") ||
          s.includes("RESTRIÇÃO") ||
          s.includes("RESTRICAO") ||
          s === "INSS"
        );
      }).length,
      ativos: totalFuncionários,
      ferias: totalFerias,
      fora: totalFora,
      atm: totalATM,
      restricao: todasAnotacoes.filter(
        (item) =>
          (item.status || "").toUpperCase().includes("RESTRIÇÃO") ||
          (item.status || "").toUpperCase().includes("RESTRICAO"),
      ).length,
      estagio: todasAnotacoes.filter(
        (item) =>
          (item.status || "").toUpperCase().includes("ESTÃGIO") ||
          (item.status || "").toUpperCase().includes("ESTAGIO"),
      ).length,
      inss: todasAnotacoes.filter(
        (item) => (item.status || "").toUpperCase() === "INSS",
      ).length,
      treinamento: todasAnotacoes.filter((item) =>
        (item.status || "").toUpperCase().includes("TREINA"),
      ).length,
      revezamento: todasAnotacoes.filter((item) =>
        (item.status || "").toUpperCase().includes("REVEZA"),
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

  const handleReorganize = useCallback(() => {
    setDepartmentsData((prev) =>
      prev.map((dept) => {
        const sortedData = [...dept.data];
        for (let i = sortedData.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [sortedData[i], sortedData[j]] = [sortedData[j], sortedData[i]];
        }
        return { ...dept, data: sortedData };
      }),
    );
    showToastMessage("Equipes reorganizadas dinamicamente!", "success");
  }, [showToastMessage]);

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

        if (selectedTurma && oldEmp && oldEmp.id) {
          firestoreService.updateEmployeeFieldDSS(
            selectedTurma,
            oldEmp.id,
            field,
            value,
          );
        }

        return newData;
      });
    },
    [logMovement],
  );

  const handleTransferToSpecialShift = useCallback(
    (sourceDeptId: string, sourceEmpIndex: number) => {
      const sourceDept = departmentsData.find((d) => d.id === sourceDeptId);
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
          localOriginal: sourceDeptId,
          tagType: "MAQUINISTA",
        },
      ]);
    },
    [],
  );

  const handleTransferSupportToSpecialShift = useCallback(
    (sourceGroupIndex: number, sourceEmpIndex: number) => {
      const sourceGroup = supportRolesData[sourceGroupIndex];
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
          grupoApoioOriginal: sourceGroupIndex,
          funcaoApoioOriginal: movedRole.role,
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
      const movedEmployee = specialShiftData[empIndex];
      if (!movedEmployee) return;
      if (!movedEmployee.name.trim()) return;

      setSpecialShiftData((prev) => {
        const newSpecial = [...prev];
        newSpecial.splice(empIndex, 1);
        return newSpecial;
      });

      if (movedEmployee.grupoApoioOriginal !== undefined) {
        const groupIdx = movedEmployee.grupoApoioOriginal;
        const roleStr = movedEmployee.funcaoApoioOriginal || "VIRADOR";
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

  const handleUpdateSupportRole = useCallback(
    (groupIndex: number, empIndex: number, newRole: string) => {
      setSupportRolesData((prev) => {
        const newGroups = [...prev];
        const newGroup = [...newGroups[groupIndex]];
        const oldEmp = newGroup[empIndex];
        newGroup[empIndex] = { ...oldEmp, role: newRole };
        newGroups[groupIndex] = newGroup;

        if (selectedTurma && oldEmp && oldEmp.id) {
          firestoreService.updateEmployeeFieldDSS(
            selectedTurma,
            oldEmp.id,
            "funcaoApoio",
            newRole,
          );
        }

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
        const oldEmp = newGroup[empIndex];
        newGroup[empIndex] = { ...oldEmp, name: newName };
        newGroups[groupIndex] = newGroup;

        if (selectedTurma && oldEmp && oldEmp.id) {
          firestoreService.updateEmployeeFieldDSS(
            selectedTurma,
            oldEmp.id,
            "name",
            newName,
          );
        }

        return newGroups;
      });
    },
    [],
  );

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
            const fromStr = `Matrícula: ${originalOldValue || "(vazio)"}`;
            const toStr = `Matrícula: ${newMatricula || "(vazio)"}`;
            if (originalOldValue !== newMatricula) {
              logMovement(empName, fromStr, toStr, undefined, newMatricula);
            }
            delete pendingFieldLogsRef.current[logKey];
          }, 1500);
        }

        if (selectedTurma && oldEmp && oldEmp.id) {
          firestoreService.updateEmployeeFieldDSS(
            selectedTurma,
            oldEmp.id,
            "matricula",
            newMatricula,
          );
        }

        return newGroups;
      });
    },
    [logMovement],
  );

  const handleDeleteSupport = useCallback(
    (groupIndex: number, empIndex: number) => {
      const empId = supportRolesData[groupIndex]?.[empIndex]?.id;
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

        if (selectedTurma && movedEmployee && movedEmployee.id) {
          const names = ["Recepcao", "Classificacao", "Formacao"];
          const newLocal = `Apoio ${names[targetGroupIndex] || targetGroupIndex}`;

          firestoreService.updateEmployeeLocationAndRoleDSS(
            selectedTurma,
            movedEmployee.id,
            newLocal,
            "OOF",
          );

          const updates = targetGroup.map((emp, i) => ({
            id: emp.id,
            ordem: i,
          }));
          firestoreService.updateEmployeeOrdersDSS(selectedTurma, updates);
        }

        return newGroups;
      });
    },
    [],
  );

  const handleMove = useCallback(
    (sourceDeptId: string, targetDeptId: string, sourceEmpIndex: number) => {
      // 1) Descobre qual o novo 'local' no padrão do banco
      let newLocal = "";
      let newRole = "MAQUINISTA";
      if (targetDeptId === "recepcao") newLocal = "Recepcao";
      else if (targetDeptId === "classificacao") newLocal = "Classificacao";
      else if (targetDeptId === "formacao") newLocal = "Formacao";
      else newLocal = targetDeptId;

      // 2) Dispara atualização pro Firebase
      const sourceDept = departmentsData.find((d) => d.id === sourceDeptId);
      const movedEmp = sourceDept?.data[sourceEmpIndex];
      if (movedEmp && movedEmp.id && selectedTurma && newLocal) {
        firestoreService.updateEmployeeLocationAndRoleDSS(
          selectedTurma,
          movedEmp.id,
          newLocal,
          newRole,
        );
      }

      // 3) Atualiza estado local (Optimistic UI)
      setDepartmentsData((prev) => {
        const newDepts = [...prev];
        const sourceDeptIndex = newDepts.findIndex(
          (d) => d.id === sourceDeptId,
        );
        const targetDeptIndex = newDepts.findIndex(
          (d) => d.id === targetDeptId,
        );

        if (
          sourceDeptIndex === targetDeptIndex ||
          sourceDeptIndex === -1 ||
          targetDeptIndex === -1
        )
          return prev;

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

        if (selectedTurma) {
          const updates = targetData.map((emp, i) => ({
            id: emp.id,
            ordem: i,
          }));
          firestoreService.updateEmployeeOrdersDSS(selectedTurma, updates);
        }

        return newDepts;
      });
    },
    [selectedTurma],
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

        if (selectedTurma && oldEmp && oldEmp.id) {
          firestoreService.updateEmployeeFieldDSS(
            selectedTurma,
            oldEmp.id,
            field,
            value,
          );
        }

        return newDepts;
      });
    },
    [logMovement],
  );

  const handleDelete = useCallback(
    (deptId: string, empIndex: number) => {
      const dept = departmentsData.find((d) => d.id === deptId);
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
      const dept = departmentsData.find((d) => d.id === deptId);
      if (!dept) return;
      const emp = dept.data[empIndex];
      if (!emp) return;
      const empName = emp.name;
      const empMatricula = emp.matricula || "";

      if (!empName || !empName.trim()) return;

      logMovement(empName, dept.title, absenceType, emp.line, empMatricula);
      firestoreService.updateEmployeeAbsentDSS(
        selectedTurma,
        emp.id,
        true,
        absenceType,
        dept.id,
      );

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
              localOriginal: deptId,
            };
          } else {
            items.push({
              id: emp.id,
              name: empName,
              status: absenceType,
              matricula: empMatricula,
              localOriginal: deptId,
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
              localOriginal: deptId,
            };
          } else {
            items.push({
              id: emp.id,
              name: empName,
              status: absenceType,
              matricula: empMatricula,
              localOriginal: deptId,
            });
          }
          newGroups[targetRightGroupIndex] = { ...group, items };
          return newGroups;
        });
      }
    },
    [departmentsData, selectedTurma, logMovement],
  );

  const handleMarkSupportAbsent = useCallback(
    (groupIndex: number, empIndex: number, absenceType: StatusType) => {
      const group = supportRolesData[groupIndex];
      if (!group) return;
      const emp = group[empIndex];
      if (!emp) return;
      const empName = emp.name;
      const empMatricula = emp.matricula || "";

      if (!empName || !empName.trim()) return;

      const supportTitles = ["Recepção", "Classificação", "Formação"];
      const groupName = `Apoio - ${supportTitles[groupIndex] || `Grupo ${groupIndex + 1}`}`;
      logMovement(empName, groupName, absenceType, undefined, empMatricula);
      firestoreService.updateEmployeeAbsentDSS(
        selectedTurma,
        emp.id,
        true,
        absenceType,
        undefined,
        groupIndex,
        emp.role,
      );

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

      const grupoApoioOriginal = groupIndex;
      const funcaoApoioOriginal = emp.role;

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
            localOriginal: undefined,
            grupoApoioOriginal,
            funcaoApoioOriginal,
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
            localOriginal: undefined,
            grupoApoioOriginal,
            funcaoApoioOriginal,
          };
          if (emptyIdx !== -1) items[emptyIdx] = newItem;
          else items.push(newItem);
          newGroups[targetRightGroupIndex] = { ...g, items };
          return newGroups;
        });
      }
    },
    [supportRolesData, selectedTurma, logMovement],
  );

  return {
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
  };
}
