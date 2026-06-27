import { doc, onSnapshot, setDoc, collection, addDoc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import { dbDSS, dbRegistros } from '../lib/firebase';
import type { Department, SupportRole, AnnotationGroup, Employee, MovementLog, TurmaType } from '../types';

export interface BoardState {
  departmentsData: Department[];
  supportRolesData: SupportRole[][];
  annotationsLeft: AnnotationGroup[];
  annotationsRight: AnnotationGroup[];
  specialShiftData: Employee[];
}

const BOARD_DOC_ID = 'current';
// Não precisamos mais de BOARD_COLLECTION global pois será dinâmico: turma a, turma b...

// Debounce timer for saves
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export const firestoreService = {
  // LER DADOS DO BANCO ANTIGO (APENAS LEITURA)
  async fetchEmployeesDSS(turma: TurmaType) {
    if (!dbDSS) return [];
    try {
      const collectionName = `turma ${turma.toLowerCase()}`;
      const allEmployees: Employee[] = [];

      const snapshot = await getDocs(collection(dbDSS, collectionName));
      snapshot.docs.forEach(doc => {
          const data = doc.data();
          // Mapeia os dados do DSS para o nosso formato Employee
          allEmployees.push({
            id: doc.id, // ou gerar um novo se precisar
            name: data.name || '',
            matricula: data.matricula || '',
            tagType: data.tagType || 'N/A',
            // Adicione outras propriedades relevantes se o DSS tiver (linha, maquina, etc)
            line: data.line || '',
            machine: data.machine || '',
            role: data['função'] || data.funcao || data.role || ''
          });
        });
      
      console.log(`[DEBUG] fetchEmployeesDSS: Encontrou ${allEmployees.length} funcionários na coleção '${collectionName}'`);
      return allEmployees;
    } catch (error) {
      console.error("[DEBUG] Erro ao buscar funcionários do DSS:", error);
      return [];
    }
  },

  async updateEmployeeRoleDSS(turma: TurmaType, employeeId: string, newRole: string) {
    if (!dbDSS) return;
    // Evita tentar atualizar colaboradores recém-criados que não vieram do DSS e não tem ID real
    if (employeeId.startsWith('emp-dept') || employeeId.startsWith('emp-supp') || employeeId.startsWith('emp-imp')) return;
    
    try {
      const collectionName = `turma ${turma.toLowerCase()}`;
      const docRef = doc(dbDSS, collectionName, employeeId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return;
      
      const data = docSnap.data();
      const updates: Record<string, string> = {};
      
      if (data['função'] !== undefined) updates['função'] = newRole;
      if (data.funcao !== undefined) updates.funcao = newRole;
      if (data.role !== undefined) updates.role = newRole;
      
      // Fallback: se nenhum existir, cria o padrão 'função'
      if (Object.keys(updates).length === 0) {
        updates['função'] = newRole;
      }

      await updateDoc(docRef, updates);
      console.log(`[DEBUG] Função do colaborador ${employeeId} atualizada para ${newRole} no DSS.`);
    } catch (error) {
      console.error("[DEBUG] Erro ao atualizar função do colaborador no DSS:", error);
    }
  },

  // ESCUTAR O ESTADO DO PAINEL EM TEMPO REAL
  subscribeToBoardState(turma: TurmaType, callback: (state: BoardState) => void) {
    if (!dbRegistros) {
      // Se não houver firebase, não faz nada
      return () => {};
    }

    const collectionName = `turma ${turma.toLowerCase()}`;
    const boardDocRef = doc(dbRegistros, collectionName, 'estado_painel');
    
    return onSnapshot(boardDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        // Fazer parser de JSON string (caso seja guardado como string) ou dados diretos
        try {
          const state: BoardState = {
            departmentsData: typeof data.departmentsData === 'string' ? JSON.parse(data.departmentsData) : data.departmentsData || [],
            supportRolesData: typeof data.supportRolesData === 'string' ? JSON.parse(data.supportRolesData) : data.supportRolesData || [],
            annotationsLeft: typeof data.annotationsLeft === 'string' ? JSON.parse(data.annotationsLeft) : data.annotationsLeft || [],
            annotationsRight: typeof data.annotationsRight === 'string' ? JSON.parse(data.annotationsRight) : data.annotationsRight || [],
            specialShiftData: typeof data.specialShiftData === 'string' ? JSON.parse(data.specialShiftData) : data.specialShiftData || [],
          };
          callback(state);
        } catch (e) {
          console.error("Erro ao fazer parse dos dados do Firebase:", e);
        }
      } else {
        // Doc não existe ainda (primeira vez no projeto vazio)
        callback(null);
      }
    }, (error) => {
      console.error("Erro no onSnapshot do Board:", error);
    });
  },

  // SALVAR O ESTADO DO PAINEL (COM DEBOUNCE PARA NÃO SOBRECARREGAR)
  saveBoardState(turma: TurmaType, state: BoardState, immediate = false) {
    if (!dbRegistros) return; // Local mode sem variáveis

    const executeSave = async () => {
      try {
        const collectionName = `turma ${turma.toLowerCase()}`;
        const boardDocRef = doc(dbRegistros, collectionName, 'estado_painel');
        
        // Salvamos como JSON stringificados para evitar limites de profundidade/tipagem estrita do firestore
        // ou salvamos o array direto (o Firestore aceita arrays/objetos aninhados, mas stringify garante o estado exato)
        await setDoc(boardDocRef, {
          departmentsData: JSON.stringify(state.departmentsData),
          supportRolesData: JSON.stringify(state.supportRolesData),
          annotationsLeft: JSON.stringify(state.annotationsLeft),
          annotationsRight: JSON.stringify(state.annotationsRight),
          specialShiftData: JSON.stringify(state.specialShiftData),
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (error) {
        console.error("Erro ao salvar board state:", error);
      }
    };

    if (immediate) {
      if (saveTimeout) clearTimeout(saveTimeout);
      executeSave();
    } else {
      if (saveTimeout) clearTimeout(saveTimeout);
      saveTimeout = setTimeout(executeSave, 200); // Debounce de 200ms
    }
  },

  // ESCUTAR EDICOES ATIVAS
  subscribeToActiveEdits(turma: TurmaType, callback: (edits: Record<string, any>) => void) {
    if (!dbRegistros) return () => {};
    const editsDocRef = doc(dbRegistros, `turma ${turma.toLowerCase()}`, 'estado_painel', 'metadata', 'edits');
    return onSnapshot(editsDocRef, (snapshot) => {
      if (snapshot.exists()) {
        try {
          const data = snapshot.data();
          const edits = data.edits ? JSON.parse(data.edits) : {};
          callback(edits);
        } catch(e) { callback({}); }
      } else {
        callback({});
      }
    });
  },

  // SALVAR EDICOES ATIVAS
  saveActiveEdits(turma: TurmaType, edits: Record<string, any>) {
    if (!dbRegistros) return;
    const editsDocRef = doc(dbRegistros, `turma ${turma.toLowerCase()}`, 'estado_painel', 'metadata', 'edits');
    setDoc(editsDocRef, { edits: JSON.stringify(edits), updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
  },

  // GRAVAR HISTÓRICO DE MOVIMENTAÇÃO
  async saveMovementLog(turma: TurmaType, log: MovementLog) {
    if (!dbRegistros) return;

    try {
      const collectionName = `turma ${turma.toLowerCase()}`;
      const historyCol = collection(dbRegistros, collectionName, 'estado_painel', 'historico');
      
      await addDoc(historyCol, {
        ...log,
        timestamp: log.timestamp.toISOString() // Firestore prefere datas em timestamp ou ISO string
      });
    } catch (error) {
      console.error("Erro ao salvar log de movimento:", error);
    }
  },
  
  // ESCUTAR HISTÓRICO (Para o modal de histórico)
  subscribeToHistory(turma: TurmaType, callback: (logs: MovementLog[]) => void) {
    if (!dbRegistros) return () => {};

    const collectionName = `turma ${turma.toLowerCase()}`;
    const historyCol = collection(dbRegistros, collectionName, 'estado_painel', 'historico');
    
    return onSnapshot(historyCol, (snapshot) => {
      const logs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          timestamp: new Date(data.timestamp)
        } as MovementLog;
      });
      
      // Ordenar do mais recente para o mais antigo (local sorting para simplificar sem índices compostos)
      logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      // Retornar apenas os 500 mais recentes se tiver muitos
      callback(logs.slice(0, 500));
    });
  },

  // VERIFICAR LOGIN DE ADMIN (Apenas pelo E-mail Corporativo)
  async verifyAdminLogin(email: string): Promise<boolean> {
    if (!dbDSS) return false;

    try {
      const adminsRef = collection(dbDSS, 'administrators');
      const snapshot = await getDocs(adminsRef);
      
      let isValid = false;
      snapshot.forEach(doc => {
        const data = doc.data();
        // Verifica se existe algum administrador com esse email
        if (data.email === email) {
          isValid = true;
        }
      });
      
      return isValid;
    } catch (error) {
      console.error("Erro ao verificar login de administrador:", error);
      return false;
    }
  }
};
