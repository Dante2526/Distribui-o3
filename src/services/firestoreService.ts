import {
  doc,
  onSnapshot,
  setDoc,
  collection,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { dbDSS } from "../lib/firebase";
import type {
  Department,
  SupportRole,
  AnnotationGroup,
  Employee,
  MovementLog,
  TurmaType,
  BoardState,
} from "../types";

const BOARD_DOC_ID = "current";
// Não precisamos mais de BOARD_COLLECTION global pois será dinâmico: turma a, turma b...

// Debounce timer for saves
const saveTimeouts: Map<string, ReturnType<typeof setTimeout>> = new Map();

export const firestoreService = {
  // LER DADOS DO BANCO ANTIGO EM TEMPO REAL (CACHE ENABLED)
  subscribeToDSS(
    turma: TurmaType,
    callback: (employees: (Employee & { _role?: string })[]) => void,
  ) {
    if (!dbDSS) return () => {};

    const collectionName = `turma ${turma.toLowerCase()}`;
    const q = collection(dbDSS, collectionName);
    const employeeCache = new Map<string, Employee & { _role?: string }>();

    return onSnapshot(
      q,
      (snapshot) => {
        const allEmployees: (Employee & { _role?: string })[] = [];
        const seenIds = new Set<string>();

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const cached = employeeCache.get(doc.id);

          const next: Employee & { _role?: string } = {
            id: doc.id,
            name: data.name || "",
            matricula: data.matricula || "",
            tagType:
              data["função"] ||
              data.funcao ||
              data.role ||
              data.tagType ||
              "N/A",
            line: data.linha || data.line || "",
            machine: data.loco || data.machine || "",
            error: data.error || false,
            localOriginal: data.localOriginal,
            grupoApoioOriginal:
              data.grupoApoioOriginal ?? data.originalSupportGroupIndex,
            funcaoApoioOriginal:
              data.funcaoApoioOriginal ?? data.originalSupportRole,
            status: data.status,
            ordem: data.ordem || 0,
            local: data.local || "",
          };
          next._role = data["funcaoApoio"] || data.funcaoApoio || "";

          let changed = !cached;
          if (cached) {
            const keys = Object.keys(next) as Array<keyof typeof next>;
            for (const k of keys) {
              if (cached[k] !== next[k]) {
                changed = true;
                break;
              }
            }
          }

          const emp = changed ? next : cached!;
          employeeCache.set(doc.id, emp);
          seenIds.add(doc.id);
          allEmployees.push(emp);
        });

        for (const id of employeeCache.keys()) {
          if (!seenIds.has(id)) employeeCache.delete(id);
        }

        callback(allEmployees);
      },
      (error) => {
        console.error("[DEBUG] Erro ao escutar DSS:", error);
      },
    );
  },

  async addEmployeeDSS(
    turma: TurmaType,
    name: string,
    matricula: string,
    role: string,
  ) {
    if (!dbDSS) return null;
    try {
      const collectionName = `turma ${turma.toLowerCase()}`;
      // Maintain exact schema from DSS Panel
      const docRef = await addDoc(collection(dbDSS, collectionName), {
        name: name,
        matricula: matricula,
        assDss: false,
        bem: false,
        mal: false,
        time: null,
        turno: "7H",
        senha: matricula,
        função: role,
      });
      return docRef.id;
    } catch (error) {
      console.error("[DEBUG] Erro ao adicionar funcionário no DSS:", error);
      return null;
    }
  },

  async deleteEmployeeDSS(turma: TurmaType, employeeId: string) {
    if (!dbDSS) return;
    try {
      const collectionName = `turma ${turma.toLowerCase()}`;
      await deleteDoc(doc(dbDSS, collectionName, employeeId));
      console.log(`[DEBUG] Funcionário ${employeeId} deletado do DSS.`);
    } catch (error) {
      console.error("[DEBUG] Erro ao deletar funcionário no DSS:", error);
    }
  },

  // LER DADOS DO BANCO ANTIGO (APENAS LEITURA ÚNICA - FALLBACK)
  async fetchEmployeesDSS(turma: TurmaType) {
    if (!dbDSS) return [];
    try {
      const collectionName = `turma ${turma.toLowerCase()}`;
      const allEmployees: Employee[] = [];

      const snapshot = await getDocs(collection(dbDSS, collectionName));
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        // Mapeia os dados do DSS para o nosso formato Employee
        // 'role' não existe no tipo Employee; guardamos em _role para uso do App no mapeamento inicial
        const emp: Employee & { _role?: string } = {
          id: doc.id,
          name: data.name || "",
          matricula: data.matricula || "",
          tagType: data.tagType || "N/A",
          line: data.linha || data.line || "",
          machine: data.loco || data.machine || "",
        };
        emp._role = data["funcaoApoio"] || data.funcaoApoio || "";
        allEmployees.push(emp);
      });

      console.log(
        `[DEBUG] fetchEmployeesDSS: Encontrou ${allEmployees.length} funcionários na coleção '${collectionName}'`,
      );
      return allEmployees;
    } catch (error) {
      console.error("[DEBUG] Erro ao buscar funcionários do DSS:", error);
      return [];
    }
  },

  async updateEmployeeLocationAndRoleDSS(
    turma: string,
    employeeId: string,
    local: string,
    role: string,
  ): Promise<void> {
    if (!dbDSS) return;
    try {
      const collectionName = `turma ${turma.toLowerCase()}`;
      const docRef = doc(dbDSS, collectionName, employeeId);
      await updateDoc(docRef, { local, função: role });
    } catch (e) {
      console.error("Erro ao atualizar local e funcao no DSS:", e);
    }
  },

  async updateEmployeeAbsentDSS(
    turma: string,
    employeeId: string,
    status: string,
    localOriginal?: string,
    grupoApoioOriginal?: number,
    funcaoApoioOriginal?: string,
  ): Promise<void> {
    if (!dbDSS) return;
    try {
      const collectionName = `turma ${turma.toLowerCase()}`;
      const docRef = doc(dbDSS, collectionName, employeeId);

      const updateData: any = { status };
      if (localOriginal !== undefined) updateData.localOriginal = localOriginal;
      if (grupoApoioOriginal !== undefined)
        updateData.grupoApoioOriginal = grupoApoioOriginal;
      if (funcaoApoioOriginal !== undefined)
        updateData.funcaoApoioOriginal = funcaoApoioOriginal;

      await updateDoc(docRef, updateData);
    } catch (e) {
      console.error("Erro ao atualizar status de ausência no DSS:", e);
    }
  },

  async moveEmployeeDSS(
    turma: string,
    employeeId: string,
    local: string,
    role: string,
    updates: { id: string; ordem: string | number }[],
    options?: { clearLineFields?: boolean },
  ): Promise<void> {
    if (!dbDSS) return;
    try {
      const collectionName = `turma ${turma.toLowerCase()}`;
      const batch = writeBatch(dbDSS);

      // 1. Atualizar local e função do ativo
      const activeDocRef = doc(dbDSS, collectionName, employeeId);
      const updateData: any = { local, função: role };
      if (options?.clearLineFields) {
        updateData.linha = "";
        updateData.loco = "";
      }
      batch.update(activeDocRef, updateData);

      // 2. Atualizar todas as ordens
      updates.forEach((update) => {
        if (
          update.id.startsWith("emp-dept") ||
          update.id.startsWith("emp-supp") ||
          update.id.startsWith("emp-imp")
        )
          return; // Ignora mock IDs

        const docRef = doc(dbDSS, collectionName, update.id);
        batch.update(docRef, { ordem: update.ordem });
      });

      await batch.commit();
    } catch (e) {
      console.error("Erro ao mover e ordenar no DSS:", e);
    }
  },

  async clearAllEmployeeFieldsDSS(turma: string): Promise<void> {
    if (!dbDSS) return;
    try {
      const collectionName = `turma ${turma.toLowerCase()}`;
      const q = collection(dbDSS, collectionName);
      const snapshot = await getDocs(q);
      const batch = writeBatch(dbDSS);

      snapshot.docs.forEach((document) => {
        if (
          document.id.startsWith("emp-dept") ||
          document.id.startsWith("emp-supp") ||
          document.id.startsWith("emp-imp")
        )
          return; // Ignora mock IDs

        const docRef = doc(dbDSS, collectionName, document.id);
        batch.update(docRef, { linha: "", loco: "" });
      });

      await batch.commit();
    } catch (e) {
      console.error("Erro ao limpar dados no DSS:", e);
      throw e;
    }
  },

  async updateEmployeeOrdersDSS(
    turma: string,
    updates: { id: string; ordem: string | number }[],
  ): Promise<void> {
    if (!dbDSS || updates.length === 0) return;
    try {
      const collectionName = `turma ${turma.toLowerCase()}`;
      const batch = writeBatch(dbDSS);

      updates.forEach((update) => {
        if (
          update.id.startsWith("emp-dept") ||
          update.id.startsWith("emp-supp") ||
          update.id.startsWith("emp-imp")
        )
          return; // Ignora mock IDs

        const docRef = doc(dbDSS, collectionName, update.id);
        batch.update(docRef, { ordem: update.ordem });
      });

      await batch.commit();
    } catch (e) {
      console.error("Erro ao atualizar ordem no DSS:", e);
    }
  },

  async updateEmployeeFieldDSS(
    turma: string,
    employeeId: string,
    field: string,
    value: string,
  ): Promise<void> {
    if (!dbDSS) return;
    try {
      const collectionName = `turma ${turma.toLowerCase()}`;
      const docRef = doc(dbDSS, collectionName, employeeId);

      // Mapear para os nomes corretos do banco (linha, loco)
      let dbField = field;
      if (field === "line") dbField = "linha";
      if (field === "machine") dbField = "loco";

      await updateDoc(docRef, { [dbField]: value });
    } catch (e) {
      console.error(`Erro ao atualizar campo ${field} no DSS:`, e);
    }
  },

  async updateEmployeeRoleDSS(
    turma: TurmaType,
    employeeId: string,
    newRole: string,
  ) {
    if (!dbDSS) return;
    // Evita tentar atualizar colaboradores recém-criados que não vieram do DSS e não tem ID real
    if (
      employeeId.startsWith("emp-dept") ||
      employeeId.startsWith("emp-supp") ||
      employeeId.startsWith("emp-imp")
    )
      return;

    try {
      const collectionName = `turma ${turma.toLowerCase()}`;
      const docRef = doc(dbDSS, collectionName, employeeId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return;

      const data = docSnap.data();
      const updates: Record<string, string> = {};

      if (data["função"] !== undefined) updates["função"] = newRole;
      if (data.funcao !== undefined) updates.funcao = newRole;
      if (data.role !== undefined) updates.role = newRole;

      // Fallback: se nenhum existir, cria o padrão 'função'
      if (Object.keys(updates).length === 0) {
        updates["função"] = newRole;
      }

      await updateDoc(docRef, updates);
      console.log(
        `[DEBUG] Função do colaborador ${employeeId} atualizada para ${newRole} no DSS.`,
      );
    } catch (error) {
      console.error(
        "[DEBUG] Erro ao atualizar função do colaborador no DSS:",
        error,
      );
    }
  },

  // ESCUTAR O ESTADO DO PAINEL EM TEMPO REAL
  subscribeToBoardState(
    turma: TurmaType,
    callback: (state: BoardState | null) => void,
  ) {
    if (!dbDSS) {
      // Se não houver firebase, não faz nada
      return () => {};
    }

    const collectionName = `turma ${turma.toLowerCase()}`;
    const boardDocRef = doc(dbDSS, collectionName, "estado_painel");

    return onSnapshot(
      boardDocRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          // Fazer parser de JSON string (caso seja guardado como string) ou dados diretos
          try {
            const state: BoardState = {
              departmentsData:
                typeof data.departmentsData === "string"
                  ? JSON.parse(data.departmentsData)
                  : data.departmentsData || [],
              supportRolesData:
                typeof data.supportRolesData === "string"
                  ? JSON.parse(data.supportRolesData)
                  : (data.supportRolesData || []).map((g: any) =>
                      g.items ? g.items : Array.isArray(g) ? g : [],
                    ),
              annotationsLeft:
                typeof data.annotationsLeft === "string"
                  ? JSON.parse(data.annotationsLeft)
                  : data.annotationsLeft || [],
              annotationsRight:
                typeof data.annotationsRight === "string"
                  ? JSON.parse(data.annotationsRight)
                  : data.annotationsRight || [],
              specialShiftData:
                typeof data.specialShiftData === "string"
                  ? JSON.parse(data.specialShiftData)
                  : data.specialShiftData || [],
            };
            callback(state);
          } catch (e) {
            console.error("Erro ao fazer parse dos dados do Firebase:", e);
          }
        } else {
          // Doc não existe ainda (primeira vez no projeto vazio)
          callback(null);
        }
      },
      (error) => {
        console.error("Erro no onSnapshot do Board:", error);
      },
    );
  },

  // SALVAR O ESTADO DO PAINEL (COM DEBOUNCE PARA NÃO SOBRECARREGAR)
  saveBoardState(turma: TurmaType, state: BoardState, immediate = false) {
    if (!dbDSS) return; // Local mode sem variáveis

    const executeSave = async () => {
      try {
        const collectionName = `turma ${turma.toLowerCase()}`;
        const boardDocRef = doc(dbDSS, collectionName, "estado_painel");

        // O truque JSON.parse(JSON.stringify()) remove qualquer undefined oculto que faria o Firestore estourar erro.
        // E mapeamos supportRolesData para objetos {items: []} porque o Firestore PROÍBE Arrays dentro de Arrays.
        await setDoc(
          boardDocRef,
          {
            departmentsData: JSON.parse(JSON.stringify(state.departmentsData)),
            supportRolesData: JSON.parse(
              JSON.stringify(
                state.supportRolesData.map((group) => ({ items: group })),
              ),
            ),
            annotationsLeft: JSON.parse(JSON.stringify(state.annotationsLeft)),
            annotationsRight: JSON.parse(
              JSON.stringify(state.annotationsRight),
            ),
            specialShiftData: JSON.parse(
              JSON.stringify(state.specialShiftData),
            ),
            updatedAt: new Date().toISOString(),
          },
          { merge: true },
        );
      } catch (error) {
        console.error("Erro ao salvar board state:", error);
      }
    };

    const key = turma.toLowerCase();

    if (immediate) {
      const existing = saveTimeouts.get(key);
      if (existing) clearTimeout(existing);
      saveTimeouts.delete(key);
      executeSave();
    } else {
      const existing = saveTimeouts.get(key);
      if (existing) clearTimeout(existing);
      saveTimeouts.set(
        key,
        setTimeout(() => {
          saveTimeouts.delete(key);
          executeSave();
        }, 200),
      ); // Debounce de 200ms
    }
  },

  // ESCUTAR EDICOES ATIVAS (Nova Coleção)
  subscribeToActiveEdits(
    turma: TurmaType,
    callback: (edits: Record<string, any>) => void,
  ) {
    if (!dbDSS) return () => {};
    const colRef = collection(
      dbDSS,
      `turma ${turma.toLowerCase()}`,
      "edicao_ativa_distribui",
      "docs",
    );

    return onSnapshot(colRef, (snapshot) => {
      const edits: Record<string, any> = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();

        // Verifica se não está pendente e se tem timestamp
        if (data.timestamp) {
          const ts = data.timestamp.toMillis
            ? data.timestamp.toMillis()
            : Date.now();
          // Se for mais velho que 20 segundos, considera expirado (Garbage Collection visual)
          if (Date.now() - ts < 20000) {
            edits[docSnap.id] = {
              empId: docSnap.id,
              userName: data.userName,
              color: data.color,
              timestamp: ts,
            };
          } else {
            // Garbage collection real no banco de dados se tiver expirado
            deleteDoc(docSnap.ref).catch(() => {});
          }
        } else {
          // Gravação pendente (local)
          edits[docSnap.id] = {
            empId: docSnap.id,
            userName: data.userName,
            color: data.color,
            timestamp: Date.now(),
          };
        }
      });
      callback(edits);
    });
  },

  // INICIAR/RENOVAR EDIÇÃO ATIVA
  startActiveEdit(
    turma: TurmaType,
    empId: string,
    userName: string,
    color: string,
  ) {
    if (!dbDSS) return;
    const docRef = doc(
      dbDSS,
      `turma ${turma.toLowerCase()}`,
      "edicao_ativa_distribui",
      "docs",
      empId,
    );
    setDoc(
      docRef,
      {
        userName,
        color,
        timestamp: serverTimestamp(),
      },
      { merge: true },
    ).catch(() => {});
  },

  // PARAR EDIÇÃO ATIVA
  stopActiveEdit(turma: TurmaType, empId: string) {
    if (!dbDSS) return;
    const docRef = doc(
      dbDSS,
      `turma ${turma.toLowerCase()}`,
      "edicao_ativa_distribui",
      "docs",
      empId,
    );
    deleteDoc(docRef).catch(() => {});
  },

  // GRAVAR HISTÓRICO DE MOVIMENTAÇÃO
  async saveMovementLog(turma: TurmaType, log: MovementLog) {
    if (!dbDSS) return;

    try {
      const historyCol = collection(
        dbDSS,
        "log_auditoria_distribui",
        `turma_${turma.toLowerCase()}`,
        "historico",
      );

      await addDoc(historyCol, {
        ...log,
        timestamp: log.timestamp.toISOString(), // Firestore prefere datas em timestamp ou ISO string
      });
    } catch (error) {
      console.error("Erro ao salvar log de movimento:", error);
    }
  },

  // ESCUTAR HISTÓRICO (Para o modal de histórico)
  subscribeToHistory(
    turma: TurmaType,
    callback: (logs: MovementLog[]) => void,
  ) {
    if (!dbDSS) return () => {};

    const historyCol = collection(
      dbDSS,
      "log_auditoria_distribui",
      `turma_${turma.toLowerCase()}`,
      "historico",
    );
    const historyQuery = query(
      historyCol,
      orderBy("timestamp", "desc"),
      limit(100),
    );

    return onSnapshot(historyQuery, (snapshot) => {
      const logs = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          linha: data.linha || data.line,
          loco: data.loco || data.machine,
          id: doc.id,
          timestamp: new Date(data.timestamp),
        } as MovementLog;
      });

      callback(logs);
    });
  },

  // VERIFICAR LOGIN DE ADMIN (E-mail ou Senha)
  // [NOTA DE ARQUITETURA E SEGURANÇA]
  // O uso de senhas em texto puro ("senha" == inputStr) foi explicitamente
  // AUTORIZADO pelo Product Owner nesta aplicação. O sistema possui um Modal
  // de Gerenciamento de Administradores no front-end que EXIGE a visualização
  // das senhas em formato legível para gestão interna da equipe.
  // Futuros agentes/desenvolvedores: NÃO migrar para Firebase Auth ou Hashing
  // a menos que o requisito de "visualização da senha na interface" seja revogado.
  async verifyAdminLogin(
    inputStr: string,
    isBiometric: boolean = false,
  ): Promise<{
    name: string;
    email: string;
    color?: string;
    funcao?: string;
    nivel?: string;
  } | null> {
    if (!dbDSS) return null;

    try {
      const adminsRef = collection(dbDSS, "administrators");

      // 1. Tenta buscar pela senha exata (se não for biometria)
      if (!isBiometric) {
        const qSenha = query(adminsRef, where("senha", "==", inputStr));
        const snapshotSenha = await getDocs(qSenha);

        if (!snapshotSenha.empty) {
          const data = snapshotSenha.docs[0].data();
          return {
            name: data.name || data.email.split("@")[0],
            email: data.email,
            color: data.color,
            funcao: data["função"] || data.funcao || data.role,
            nivel: data.nivel || "1",
          };
        }
      }

      // 2. Tenta buscar pelo e-mail
      const qEmail = query(
        adminsRef,
        where("email", "==", inputStr.toLowerCase()),
      );
      const snapshotEmail = await getDocs(qEmail);

      if (!snapshotEmail.empty) {
        const data = snapshotEmail.docs[0].data();

        // Se o admin JÁ TIVER uma senha cadastrada E o login NÃO for por biometria, recusa
        if (data.senha && !isBiometric) {
          throw new Error("Credenciais inválidas. Use sua senha.");
        }

        return {
          name: data.name || data.email.split("@")[0],
          email: data.email,
          color: data.color,
          funcao: data["função"] || data.funcao || data.role,
          nivel: data.nivel || "1",
        };
      }

      return null;
    } catch (error) {
      console.error("Erro ao verificar login de administrador:", error);
      throw error; // Repassa o erro para poder mostrar mensagens específicas (ex: "Use sua senha")
    }
  },

  /*
   * NOTA SOBRE SEGURANÇA E ARQUITETURA:
   * O cliente autorizou explicitamente o uso de senhas em texto puro no Firestore,
   * bem como a manipulação dessas senhas e validações críticas de banco de dados diretamente
   * no lado do cliente (Client-Side).
   *
   * Motivo: Para utilizar as melhores práticas de segurança (ex: Firebase Authentication via
   * Custom Tokens ou operações sensíveis em backend), seria necessário habilitar o
   * Cloud Functions for Firebase. Como o Cloud Functions exige a migração para o
   * plano pago "Blaze" (que requer cadastro de cartão de crédito) e o cliente relatou
   * não ter interesse em realizar esse upgrade no momento, essas validações continuarão
   * no Frontend por decisão de negócios, com o cliente ciente da escolha arquitetural.
   */

  // ATUALIZAR SENHA DO ADMINISTRADOR
  async updateAdminPassword(email: string, newPassword: string): Promise<void> {
    if (!dbDSS) throw new Error("Banco de dados indisponível.");

    const adminsRef = collection(dbDSS, "administrators");
    const q = query(adminsRef, where("email", "==", email.toLowerCase()));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const adminDoc = snapshot.docs[0];
      await updateDoc(adminDoc.ref, { senha: newPassword });
    } else {
      throw new Error("Administrador não encontrado.");
    }
  },

  // GET TODOS ADMINISTRADORES
  async getAdministrators() {
    if (!dbDSS) return [];
    try {
      const adminsRef = collection(dbDSS, "administrators");
      const snapshot = await getDocs(adminsRef);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Erro ao buscar administradores:", error);
      return [];
    }
  },

  // ADD ADMINISTRATOR
  async addAdministrator(adminData: any) {
    if (!dbDSS) return;
    try {
      const adminsRef = collection(dbDSS, "administrators");
      await addDoc(adminsRef, adminData);
    } catch (error) {
      console.error("Erro ao adicionar administrador:", error);
      throw error;
    }
  },

  // UPDATE ADMINISTRATOR
  async updateAdministrator(id: string, adminData: any) {
    if (!dbDSS) return;
    try {
      const adminDoc = doc(dbDSS, "administrators", id);
      await updateDoc(adminDoc, adminData);
    } catch (error) {
      console.error("Erro ao atualizar administrador:", error);
      throw error;
    }
  },

  // DELETE ADMINISTRATOR
  async deleteAdministrator(id: string) {
    if (!dbDSS) return;
    try {
      const adminDoc = doc(dbDSS, "administrators", id);
      await deleteDoc(adminDoc);
    } catch (error) {
      console.error("Erro ao excluir administrador:", error);
      throw error;
    }
  },
};
