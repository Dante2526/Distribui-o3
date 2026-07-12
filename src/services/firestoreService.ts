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
import { dbDSS, dbRegistros } from "../lib/firebase";
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

    return onSnapshot(
      q,
      (snapshot) => {
        const allEmployees: (Employee & { _role?: string })[] = [];
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const emp: Employee & { _role?: string } = {
            id: doc.id,
            name: data.name || "",
            matricula: data.matricula || "",
            tagType: data.tagType || "N/A",
            line: data.line || "",
            machine: data.machine || "",
          };
          emp._role = data["função"] || data.funcao || data.role || "";
          allEmployees.push(emp);
        });
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
        ausente: false,
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
          line: data.line || "",
          machine: data.machine || "",
        };
        emp._role = data["função"] || data.funcao || data.role || "";
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
    if (!dbRegistros) {
      // Se não houver firebase, não faz nada
      return () => {};
    }

    const collectionName = `turma ${turma.toLowerCase()}`;
    const boardDocRef = doc(dbRegistros, collectionName, "estado_painel");

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
    if (!dbRegistros) return; // Local mode sem variáveis

    const executeSave = async () => {
      try {
        const collectionName = `turma ${turma.toLowerCase()}`;
        const boardDocRef = doc(dbRegistros, collectionName, "estado_painel");

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
    if (!dbRegistros) return;

    try {
      const collectionName = `turma ${turma.toLowerCase()}`;
      const historyCol = collection(
        dbRegistros,
        collectionName,
        "estado_painel",
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
    if (!dbRegistros) return () => {};

    const collectionName = `turma ${turma.toLowerCase()}`;
    const historyCol = collection(
      dbRegistros,
      collectionName,
      "estado_painel",
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
          id: doc.id,
          timestamp: new Date(data.timestamp),
        } as MovementLog;
      });

      callback(logs);
    });
  },

  // VERIFICAR LOGIN DE ADMIN (E-mail ou Senha)
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
