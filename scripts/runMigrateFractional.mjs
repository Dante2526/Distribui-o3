import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  collection,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { generateKeyBetween } from "fractional-indexing";

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
    console.error("Erro: Chaves do Firebase não encontradas.");
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
      console.log(`\nIniciando migração fracionária na ${turma}...`);
      const colRef = collection(db, turma);
      const snapshot = await getDocs(colRef);

      if (snapshot.empty) {
        console.log(`Coleção ${turma} vazia, pulando.`);
        continue;
      }

      const allEmployees = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Ordenar como no endpoint de migração
      allEmployees.sort((a, b) => {
        const aO = a.ordem ?? 0;
        const bO = b.ordem ?? 0;
        if (typeof aO === "number" && typeof bO === "number") return aO - bO;
        return String(aO).localeCompare(String(bO));
      });

      const batch = writeBatch(db);
      let countTurma = 0;
      let currentKey = null;

      for (const emp of allEmployees) {
        currentKey = generateKeyBetween(currentKey, null);
        const docRef = doc(db, turma, emp.id);
        batch.update(docRef, { ordem: currentKey });
        countTurma++;
      }

      if (countTurma > 0) {
        await batch.commit();
        console.log(`✔ Migrados ${countTurma} registros na ${turma}.`);
        countTotal += countTurma;
      }
    }

    console.log(`\n✅ Migração fracionária concluída com sucesso! Total: ${countTotal}`);
    process.exit(0);
  } catch (error) {
    console.error("Erro durante a migração:", error);
    process.exit(1);
  }
}

runMigration();
