import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  doc,
  collection,
  getDocs,
  writeBatch,
} from "firebase/firestore/lite";
import { getAuth, signInAnonymously } from "firebase/auth";

// Datas-âncora para cálculo de escala 2x2.
// TODO: Adicionar turmas A, B e C quando suas datas-âncora forem definidas.
// Turmas sem âncora nunca terão dias de folga pulados pelo cron.
const ANCHOR_DATES = {
  D: "2026-01-26",
};

function isDiaDeTrabalho(team) {
  const anchorStr = ANCHOR_DATES[team];
  if (!anchorStr) return true;

  const now = new Date();

  // Data local em Brasilia
  const formatter = new Intl.DateTimeFormat("fr-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const localDateStr = formatter.format(now);

  const localMidnight = new Date(`${localDateStr}T00:00:00Z`);
  const anchorMidnight = new Date(`${anchorStr}T00:00:00Z`);

  const diffDays = Math.round(
    (localMidnight.getTime() - anchorMidnight.getTime()) /
      (24 * 60 * 60 * 1000),
  );

  // Ciclo de 4 dias (módulo 4)
  const cycleDay = ((diffDays % 4) + 4) % 4;

  // 0 e 1 são dias de trabalho (2x2)
  return cycleDay === 0 || cycleDay === 1;
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const team = url.searchParams.get("team")?.toUpperCase() || "D";
  const token = url.searchParams.get("token");
  const force = url.searchParams.get("force") === "true";

  if (!env.CRON_SECRET_TOKEN || token !== env.CRON_SECRET_TOKEN) {
    return new Response(
      JSON.stringify({ error: "Acesso Não Autorizado. Token inválido." }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Verifica escala 2x2
  const worksToday = isDiaDeTrabalho(team);
  if (!worksToday && !force) {
    return new Response(
      JSON.stringify({
        status: "skipped",
        message: `Hoje é folga para a Turma ${team}.`,
      }),
      {
        status: 200,
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

  // C1 fix: Reutiliza o Firebase App se já foi inicializado neste isolate
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  try {
    // Autenticação anônima obrigatória pelas regras de segurança
    await signInAnonymously(auth);
    console.log(
      `[limpar] Turma ${team} — autenticação OK, iniciando limpeza...`,
    );

    // Apenas limpar os campos de Linha e Loco dos maquinistas
    const colRef = collection(db, `turma ${team.toLowerCase()}`);
    const snapshot = await getDocs(colRef);

    if (snapshot.empty) {
      console.log(
        `[limpar] Turma ${team} — coleção não encontrada ou vazia no Firestore.`,
      );
      return new Response(
        JSON.stringify({
          status: "no_data",
          message: `Nenhum dado encontrado para a Turma ${team}. Nada para limpar.`,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const batch = writeBatch(db);
    let count = 0;

    snapshot.docs.forEach((document) => {
      const docRef = doc(db, `turma ${team.toLowerCase()}`, document.id);
      batch.update(docRef, { linha: "", loco: "" });
      count++;
    });

    await batch.commit();
    console.log(
      `[limpar] Turma ${team} — limpeza concluída com sucesso. ${count} registros limpos.`,
    );

    return new Response(
      JSON.stringify({
        status: "success",
        message: `Limpeza (Linha e Loco) da Turma ${team} concluída. ${count} registros atualizados.`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Erro ao limpar", details: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
