import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  collection,
  getDocs,
  writeBatch,
  deleteField,
} from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "..", ".env") });
dotenv.config({ path: join(__dirname, "..", ".env.local") });

async function runMigration() {
  const firebaseConfig = {
    apiKey: process.env.VITE_apiKey_dss,
    authDomain: process.env.VITE_authDomain_dss,
    projectId: process.env.VITE_projectId_dss,
  };

  if (!firebaseConfig.apiKey) {
    console.error(
      "Erro: Chaves do Firebase não encontradas no .env ou .env.local",
    );
    process.exit(1);
  }

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  try {
    console.log("Autenticando...");
    await signInAnonymously(auth);
    console.log("Autenticação OK.");

    const turmas = ["turma a", "turma b", "turma c_cg", "turma d_cg"];
    let countTotal = 0;

    for (const turma of turmas) {
      console.log(`\nVerificando ${turma}...`);
      const colRef = collection(db, turma);
      const snapshot = await getDocs(colRef);
      const batch = writeBatch(db);
      let countTurma = 0;

      for (const d of snapshot.docs) {
        const data = d.data();
        const hasGroup = data.originalSupportGroupIndex !== undefined;
        const hasRole = data.originalSupportRole !== undefined;

        if (hasGroup || hasRole) {
          const updates = {};
          if (hasGroup) {
            updates.grupoApoioOriginal = data.originalSupportGroupIndex;
            updates.originalSupportGroupIndex = deleteField();
          }
          if (hasRole) {
            updates.funcaoApoioOriginal = data.originalSupportRole;
            updates.originalSupportRole = deleteField();
          }

          const docRef = doc(db, turma, d.id);
          batch.update(docRef, updates);
          countTurma++;
        }
      }

      if (countTurma > 0) {
        await batch.commit();
        console.log(`✔ Migrados ${countTurma} registros na ${turma}.`);
        countTotal += countTurma;
      } else {
        console.log(`Nenhum registro precisou ser migrado na ${turma}.`);
      }
    }

    console.log(`\n✅ Migração concluída com sucesso! Total: ${countTotal}`);
    process.exit(0);
  } catch (error) {
    console.error("Erro durante a migração:", error);
    process.exit(1);
  }
}

runMigration();
