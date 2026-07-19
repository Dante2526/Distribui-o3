import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";
import {
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Department, SupportRole, Employee, TurmaType } from "../types";
import { firestoreService } from "../services/firestoreService";

function resolveContainerId(
  id: string,
  departmentsData: Department[],
  supportRolesData: SupportRole[][],
  specialShiftData: Employee[],
): string {
  if (id === "recepcao" || id === "classificacao" || id === "formacao")
    return id;
  if (id.startsWith("support-group-")) return id;
  if (id === "special-shift") return id;

  const dept = departmentsData.find((d) => d.id === id);
  if (dept) return dept.id;

  for (const d of departmentsData) {
    if (d.data.some((e) => e.id === id)) return d.id;
  }

  for (let i = 0; i < supportRolesData.length; i++) {
    if (supportRolesData[i].some((e) => e.id === id))
      return `support-group-${i}`;
  }

  if (specialShiftData.some((e) => e.id === id)) return "special-shift";

  return "";
}

export interface UseDragAndDropProps {
  isAdmin: boolean;
  handleStartEditRef: React.MutableRefObject<(id: string) => void>;
  handleStopEditRef: React.MutableRefObject<(id: string) => void>;
  departmentsData: Department[];
  supportRolesData: SupportRole[][];
  specialShiftData: Employee[];
  setDepartmentsData: React.Dispatch<React.SetStateAction<Department[]>>;
  setSupportRolesData: React.Dispatch<React.SetStateAction<SupportRole[][]>>;
  setSpecialShiftData: React.Dispatch<React.SetStateAction<Employee[]>>;
  selectedTurma: TurmaType | null;
}

export function useDragAndDrop({
  isAdmin,
  handleStartEditRef,
  handleStopEditRef,
  departmentsData,
  supportRolesData,
  specialShiftData,
  setDepartmentsData,
  setSupportRolesData,
  setSpecialShiftData,
  selectedTurma,
}: UseDragAndDropProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [activeSupportId, setActiveSupportId] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<any>(null);
  const [activeType, setActiveType] = useState<string | null>(null);

  const activeIdRef = useRef<string | null>(null);
  const activeItemRef = useRef<any>(null);
  const clonedDepartmentsRef = useRef<Department[] | null>(null);
  const clonedSupportRef = useRef<SupportRole[][] | null>(null);
  const clonedSpecialShiftRef = useRef<Employee[] | null>(null);
  const dragSourceRef = useRef<any>(null);

  const departmentsDataRef = useRef(departmentsData);
  const supportRolesDataRef = useRef(supportRolesData);
  const specialShiftDataRef = useRef(specialShiftData);

  useEffect(() => {
    departmentsDataRef.current = departmentsData;
    supportRolesDataRef.current = supportRolesData;
    specialShiftDataRef.current = specialShiftData;
  }, [departmentsData, supportRolesData, specialShiftData]);
  const mouseSensor = useSensor(
    MouseSensor,
    useMemo(
      () => ({
        activationConstraint: { distance: isAdmin ? 5 : 999999 },
      }),
      [isAdmin],
    ),
  );

  const touchSensor = useSensor(
    TouchSensor,
    useMemo(
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

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const activeIdVal = event.active.id as string;
      setActiveId(activeIdVal);
      activeIdRef.current = activeIdVal;

      // Encontrar o tipo do elemento arrastado e o item
      let aType = null;
      let aItem = null;

      const dept = departmentsDataRef.current.find((d) =>
        d.data.some((e) => e.id === activeIdVal),
      );
      if (dept) {
        aType = "maquinista";
        aItem = dept.data.find((e) => e.id === activeIdVal);
      } else {
        const supportGroupIdx = supportRolesDataRef.current.findIndex((g) =>
          g.some((e) => e.id === activeIdVal),
        );
        if (supportGroupIdx !== -1) {
          aType = "apoio";
          aItem = supportRolesDataRef.current[supportGroupIdx].find(
            (e) => e.id === activeIdVal,
          );
        } else {
          if (specialShiftDataRef.current.some((e) => e.id === activeIdVal)) {
            aType = "special";
            aItem = specialShiftDataRef.current.find(
              (e) => e.id === activeIdVal,
            );
          }
        }
      }

      setActiveItem(aItem);
      activeItemRef.current = aItem;

      setOverId(null);
      handleStartEditRef.current(activeIdVal as string);
      clonedDepartmentsRef.current = departmentsDataRef.current;
      clonedSupportRef.current = supportRolesDataRef.current;
      clonedSpecialShiftRef.current = specialShiftDataRef.current;

      let sourceContainer = "";
      let sourceType: "maquinista" | "apoio" | "special" = "maquinista";
      let sourceRole: string | undefined = undefined;
      let activeIdx = -1;

      for (const dept of departmentsDataRef.current) {
        activeIdx = dept.data.findIndex((e) => e.id === activeIdVal);
        if (activeIdx !== -1) {
          sourceContainer = dept.id;
          sourceType = "maquinista";
          break;
        }
      }

      if (!sourceContainer) {
        for (let idx = 0; idx < supportRolesDataRef.current.length; idx++) {
          activeIdx = supportRolesDataRef.current[idx].findIndex(
            (e) => e.id === activeIdVal,
          );
          if (activeIdx !== -1) {
            const emp = supportRolesDataRef.current[idx][activeIdx];
            sourceContainer = `support-group-${idx}`;
            sourceType = "apoio";
            sourceRole = emp.role;
            break;
          }
        }
      }

      if (!sourceContainer) {
        activeIdx = specialShiftDataRef.current.findIndex(
          (e) => e.id === activeIdVal,
        );
        if (activeIdx !== -1) {
          sourceContainer = "special-shift";
          sourceType = "special";
        }
      }

      dragSourceRef.current = {
        id: activeIdVal,
        type: sourceType,
        originalContainer: sourceContainer,
        originalRole: sourceRole,
        originalIndex: activeIdx,
      };

      const isSupport = sourceType === "apoio";
      if (isSupport) {
        setActiveSupportId(activeIdVal);
      }
    },
    [
      setActiveId,
      activeIdRef,
      setOverId,
      handleStartEditRef,
      clonedDepartmentsRef,
      departmentsDataRef,
      clonedSupportRef,
      supportRolesDataRef,
      clonedSpecialShiftRef,
      specialShiftDataRef,
      dragSourceRef,
      setActiveSupportId,
    ],
  );

  const handleDragCancel = useCallback(() => {
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
  }, [
    activeIdRef,
    handleStopEditRef,
    setActiveId,
    setActiveSupportId,
    setOverId,
    dragSourceRef,
    clonedDepartmentsRef,
    setDepartmentsData,
    clonedSupportRef,
    setSupportRolesData,
    clonedSpecialShiftRef,
    setSpecialShiftData,
  ]);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) {
        setOverId(null);
        return;
      }

      const activeId = active.id as string;
      const overId = over.id as string;
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
      } else if (overId.toString().startsWith("support-group-")) {
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
          setDepartmentsData((prev) =>
            prev.map((d) => {
              if (d.id === activeContainer) {
                const currActiveIdx = d.data.findIndex(
                  (e) => e.id === activeId,
                );
                const currOverIdx = d.data.findIndex((e) => e.id === overId);
                if (
                  currActiveIdx !== -1 &&
                  currOverIdx !== -1 &&
                  currActiveIdx !== currOverIdx
                ) {
                  return {
                    ...d,
                    data: arrayMove(d.data, currActiveIdx, currOverIdx),
                  };
                }
              }
              return d;
            }),
          );
        } else if (activeType === "apoio") {
          const groupIdx = parseInt(
            activeContainer.replace("support-group-", ""),
            10,
          );
          setSupportRolesData((prev) =>
            prev.map((g, idx) => {
              if (idx === groupIdx) {
                const currActiveIdx = g.findIndex((e) => e.id === activeId);
                const currOverIdx = g.findIndex((e) => e.id === overId);
                if (
                  currActiveIdx !== -1 &&
                  currOverIdx !== -1 &&
                  currActiveIdx !== currOverIdx
                ) {
                  return arrayMove(g, currActiveIdx, currOverIdx);
                }
              }
              return g;
            }),
          );
        } else if (activeType === "special") {
          setSpecialShiftData((prev) => {
            const currActiveIdx = prev.findIndex((e) => e.id === activeId);
            const currOverIdx = prev.findIndex((e) => e.id === overId);
            if (
              currActiveIdx !== -1 &&
              currOverIdx !== -1 &&
              currActiveIdx !== currOverIdx
            ) {
              return arrayMove(prev, currActiveIdx, currOverIdx);
            }
            return prev;
          });
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
              count: Math.max(
                0,
                d.data.filter((e) => e.id !== activeId).length,
              ),
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
              return group;
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
              return group;
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
              count: Math.max(
                0,
                d.data.filter((e) => e.id !== activeId).length,
              ),
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
          localOriginal: isOriginallyApoio
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
              count: Math.max(
                0,
                d.data.filter((e) => e.id !== activeId).length,
              ),
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
              return group;
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
    },
    [
      setOverId,
      departmentsDataRef,
      supportRolesDataRef,
      specialShiftDataRef,
      setDepartmentsData,
      setSupportRolesData,
      setSpecialShiftData,
      dragSourceRef,
    ],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      const activeIdVal = active?.id;
      if (activeIdVal) handleStopEditRef.current(activeIdVal);

      if (!over || !activeIdVal) {
        // Se soltou fora de qualquer lugar válido, REVERTE o estado React para o original!
        if (clonedDepartmentsRef.current)
          setDepartmentsData(clonedDepartmentsRef.current);
        if (clonedSupportRef.current)
          setSupportRolesData(clonedSupportRef.current);
        if (clonedSpecialShiftRef.current)
          setSpecialShiftData(clonedSpecialShiftRef.current);

        setActiveId(null);
        activeIdRef.current = null;
        setActiveSupportId(null);
        setOverId(null);
        dragSourceRef.current = null;
        return;
      }

      const overId = over.id as string;
      let selfDropTargetLocal: string | null = null;
      if (activeIdVal === overId) {
        // Verifica se a coluna realmente não mudou.
        // O handleDragOver pode já ter movido o item otimisticamente.
        let currentLocal = "";

        // Descobre onde o cartão está *agora* (pós-dragOver otimista) e em qual índice
        let currentIndex = -1;
        for (const dept of departmentsDataRef.current) {
          currentIndex = dept.data.findIndex((e) => e.id === activeIdVal);
          if (currentIndex !== -1) {
            currentLocal = dept.id;
            break;
          }
        }
        if (!currentLocal) {
          for (let i = 0; i < supportRolesDataRef.current.length; i++) {
            currentIndex = supportRolesDataRef.current[i].findIndex(
              (e) => e.id === activeIdVal,
            );
            if (currentIndex !== -1) {
              currentLocal = `support-group-${i}`;
              break;
            }
          }
        }
        if (!currentLocal) {
          currentIndex = specialShiftDataRef.current.findIndex(
            (e) => e.id === activeIdVal,
          );
          if (currentIndex !== -1) {
            currentLocal = "special-shift";
          }
        }

        const originalLocal = dragSourceRef.current?.originalContainer;
        const originalIndex = dragSourceRef.current?.originalIndex;

        // Se a coluna for a mesma e o índice for o mesmo, então SIM é um no-op. REVERTE.
        if (currentLocal === originalLocal && currentIndex === originalIndex) {
          if (clonedDepartmentsRef.current)
            setDepartmentsData(clonedDepartmentsRef.current);
          if (clonedSupportRef.current)
            setSupportRolesData(clonedSupportRef.current);
          if (clonedSpecialShiftRef.current)
            setSpecialShiftData(clonedSpecialShiftRef.current);

          setActiveId(null);
          activeIdRef.current = null;
          setActiveSupportId(null);
          setOverId(null);
          dragSourceRef.current = null;
          return;
        }

        // NÃO é no-op (ou mudou de coluna, ou mudou de posição na mesma coluna)
        // Guarda o destino real já sabido, pra não deixar o overId confundir o mapeamento abaixo
        selfDropTargetLocal = currentLocal; // ex: "classificacao", "formacao", "support-group-1", "special-shift"
      }

      const originContainer = dragSourceRef.current?.originalContainer ?? "";

      const destContainer = selfDropTargetLocal
        ? selfDropTargetLocal
        : resolveContainerId(
            overId,
            departmentsDataRef.current,
            supportRolesDataRef.current,
            specialShiftDataRef.current,
          );

      const MAQUINISTA_CONTAINERS = new Set([
        "recepcao",
        "classificacao",
        "formacao",
      ]);
      const isMaquinistaContainer = (id: string) =>
        MAQUINISTA_CONTAINERS.has(id);
      const isApoioContainer = (id: string) => id.startsWith("support-group-");

      const clearLineFields = Boolean(
        originContainer &&
        destContainer &&
        originContainer !== destContainer &&
        isMaquinistaContainer(destContainer) &&
        (isMaquinistaContainer(originContainer) ||
          isApoioContainer(originContainer)),
      );

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
      if (selfDropTargetLocal) {
        if (selfDropTargetLocal === "recepcao") {
          newLocal = "Recepcao";
          newRole = "MAQUINISTA";
        } else if (selfDropTargetLocal === "classificacao") {
          newLocal = "Classificacao";
          newRole = "MAQUINISTA";
        } else if (selfDropTargetLocal === "formacao") {
          newLocal = "Formacao";
          newRole = "MAQUINISTA";
        } else if (selfDropTargetLocal === "special-shift") {
          newLocal = "Turno 6H";
          newRole = "MAQUINISTA";
        } else if (selfDropTargetLocal.startsWith("support-group-")) {
          const idx = parseInt(selfDropTargetLocal.split("-")[2], 10);
          const names = ["Recepcao", "Classificacao", "Formacao"];
          newLocal = `Apoio ${names[idx] || idx}`;
          newRole = "OOF";
        }
      } else if (overId === "recepcao") {
        newLocal = "Recepcao";
        newRole = "MAQUINISTA";
      } else if (overId === "classificacao") {
        newLocal = "Classificacao";
        newRole = "MAQUINISTA";
      } else if (overId === "formacao") {
        newLocal = "Formacao";
        newRole = "MAQUINISTA";
      } else if (overId.toString().startsWith("Recepcao ")) {
        newLocal = overId.toString();
        newRole = "MAQUINISTA";
      } else if (overId === "special-shift") {
        newLocal = "Turno 6H";
        newRole = "MAQUINISTA";
      } else if (overId.toString().startsWith("support-group-")) {
        const idx = parseInt(overId.toString().split("-")[2], 10);
        const names = ["Recepcao", "Classificacao", "Formacao"];
        newLocal = `Apoio ${names[idx] || idx}`;
        newRole = "OOF";
      } else {
        const overData = over.data?.current;
        const targetDeptId = overData?.departmentId;
        const targetGroupIdx = overData?.groupIndex;
        const targetSpecialIdx = overData?.specialIndex;

        if (targetDeptId) {
          if (targetDeptId === "recepcao") newLocal = "Recepcao";
          else if (targetDeptId === "classificacao") newLocal = "Classificacao";
          else if (targetDeptId === "formacao") newLocal = "Formacao";
          else newLocal = targetDeptId;
          newRole = "MAQUINISTA";
        } else if (targetGroupIdx !== undefined) {
          const names = ["Recepcao", "Classificacao", "Formacao"];
          newLocal = `Apoio ${names[targetGroupIdx] || targetGroupIdx}`;
          newRole = "OOF";
        } else if (targetSpecialIdx !== undefined) {
          newLocal = "Turno 6H";
          newRole = "MAQUINISTA";
        } else {
          // Último recurso (fallback legado)
          const overEmp = allEmployees.find((e) => e.id === overId);
          if (overEmp) {
            newLocal = overEmp.local || "";
            newRole = overEmp.tagType || "MAQUINISTA";
          }
        }
      }

      // Se temos um novo local e um ID valido, enviamos pro DSS!
      if (newLocal && selectedTurma) {
        // Usa setDepartmentsData e etc APENAS para calcular a ordem final já sincronizada localmente
        const localLower = newLocal.toLowerCase();

        if (
          localLower === "classificacao" ||
          localLower === "classificação" ||
          localLower === "formacao" ||
          localLower === "formação" ||
          localLower.startsWith("recepcao") ||
          localLower.startsWith("recepção")
        ) {
          setDepartmentsData((prev) => {
            const updates: { id: string; ordem: number }[] = [];
            const deptId = localLower.includes("classifica")
              ? "classificacao"
              : localLower.includes("formacao")
                ? "formacao"
                : "recepcao";
            const dept = prev.find((d) => d.id === deptId);
            dept?.data.forEach((emp, i) =>
              updates.push({ id: emp.id, ordem: i }),
            );
            firestoreService.moveEmployeeDSS(
              selectedTurma,
              activeIdVal as string,
              newLocal,
              newRole,
              updates,
              { clearLineFields },
            );
            return prev;
          });
        } else if (localLower === "turno 6h") {
          setSpecialShiftData((prev) => {
            const updates: { id: string; ordem: number }[] = [];
            prev.forEach((emp, i) => updates.push({ id: emp.id, ordem: i }));
            firestoreService.moveEmployeeDSS(
              selectedTurma,
              activeIdVal as string,
              newLocal,
              newRole,
              updates,
              { clearLineFields },
            );
            return prev;
          });
        } else if (localLower.startsWith("apoio ")) {
          setSupportRolesData((prev) => {
            const updates: { id: string; ordem: number }[] = [];
            const suffix = localLower.replace("apoio ", "").trim();
            let idx = -1;
            if (suffix === "recepcao" || suffix === "recepção") idx = 0;
            else if (suffix === "classificacao" || suffix === "classificação")
              idx = 1;
            else if (suffix === "formacao" || suffix === "formação") idx = 2;
            else idx = parseInt(suffix, 10);

            if (!isNaN(idx) && prev[idx]) {
              prev[idx].forEach((emp, i) =>
                updates.push({ id: emp.id, ordem: i }),
              );
              firestoreService.moveEmployeeDSS(
                selectedTurma,
                activeIdVal as string,
                newLocal,
                newRole,
                updates,
                { clearLineFields },
              );
            }
            return prev;
          });
        } else {
          // Caso genérico se não caiu em nenhum if de ordem (quase impossível, mas para segurança)
          firestoreService.moveEmployeeDSS(
            selectedTurma,
            activeIdVal as string,
            newLocal,
            newRole,
            [],
            { clearLineFields },
          );
        }
      } else {
        // Fallback: se não conseguiu determinar um novo local válido, reverte!
        if (clonedDepartmentsRef.current)
          setDepartmentsData(clonedDepartmentsRef.current);
        if (clonedSupportRef.current)
          setSupportRolesData(clonedSupportRef.current);
        if (clonedSpecialShiftRef.current)
          setSpecialShiftData(clonedSpecialShiftRef.current);
      }

      setActiveId(null);
      activeIdRef.current = null;
      setActiveSupportId(null);
      setOverId(null);
      dragSourceRef.current = null;
    },
    [
      handleStopEditRef,
      setActiveId,
      activeIdRef,
      setActiveSupportId,
      setOverId,
      dragSourceRef,
      departmentsDataRef,
      supportRolesDataRef,
      specialShiftDataRef,
      selectedTurma,
    ],
  );

  return {
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
  };
}
