import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  doc,
  collection,
  getDocs,
  writeBatch,
} from "firebase/firestore/lite";
import { getAuth, signInAnonymously } from "firebase/auth";
import { generateKeyBetween } from "fractional-indexing";

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const team = url.searchParams.get("team")?.toUpperCase() || "D";
  const token = url.searchParams.get("token");

  if (!env.CRON_SECRET_TOKEN || token !== env.CRON_SECRET_TOKEN) {
    return new Response(
      JSON.stringify({ error: "Acesso Não Autorizado. Token inválido." }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Inicializa o Firebase (Lite version para Cloudflare Edge)
  const firebaseConfig = {
    apiKey: env.VITE_apiKey_dss,
    authDomain: env.VITE_authDomain_dss,
    projectId: env.VITE_projectId_dss,
  };

  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  try {
    // Autenticação anônima obrigatória pelas regras de segurança
    await signInAnonymously(auth);
    console.log(
      `[migrate] Turma ${team} — autenticação OK, iniciando migração fracionária...`,
    );

    const colRef = collection(db, `turma ${team.toLowerCase()}`);
    const snapshot = await getDocs(colRef);

    if (snapshot.empty) {
      console.log(
        `[migrate] Turma ${team} — coleção não encontrada ou vazia no Firestore.`,
      );
      return new Response(
        JSON.stringify({
          status: "no_data",
          message: `Nenhum dado encontrado para a Turma ${team}. Nada para migrar.`,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const allEmployees = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Ordenar os funcionários em memória usando o comparador seguro misto
    allEmployees.sort((a, b) => {
      const aO = a.ordem ?? 0;
      const bO = b.ordem ?? 0;
      if (typeof aO === "number" && typeof bO === "number") return aO - bO;
      return String(aO).localeCompare(String(bO));
    });

    const batch = writeBatch(db);
    let count = 0;
    let currentKey = null;

    // Iterar sobre a lista ordenada e reatribuir chaves fracionárias do zero
    for (const emp of allEmployees) {
      currentKey = generateKeyBetween(currentKey, null);
      const docRef = doc(db, `turma ${team.toLowerCase()}`, emp.id);
      batch.update(docRef, { ordem: currentKey });
      count++;
    }

    await batch.commit();
    console.log(
      `[migrate] Turma ${team} — migração concluída com sucesso. ${count} registros migrados.`,
    );

    return new Response(
      JSON.stringify({
        status: "success",
        message: `Migração fracionária da Turma ${team} concluída. ${count} registros reordenados com sucesso.`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Erro ao migrar ordem", details: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
