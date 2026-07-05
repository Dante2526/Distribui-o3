import { initializeApp } from "firebase/app";
import { getFirestore, doc, updateDoc } from "firebase/firestore/lite";
import { getAuth, signInAnonymously } from "firebase/auth";

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
    apiKey: env.VITE_apiKey_distribuicao,
    authDomain: env.VITE_authDomain_distribuicao,
    projectId: env.VITE_projectId_distribuicao,
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  try {
    // Autenticação anônima obrigatória pelas regras de segurança
    await signInAnonymously(auth);

    // Apenas limpar os campos de Linha e Loco
    const docRef = doc(db, `turma ${team.toLowerCase()}`, "estado_painel");

    const emptyDepartmentsData = [
      { id: "recepcao", title: "Recepção", count: 0, data: [] },
      { id: "classificacao", title: "Classificação", count: 0, data: [] },
      { id: "formacao", title: "Formação", count: 0, data: [] },
    ];

    // 7 grupos de apoio conforme configurado no projeto
    const emptySupportRolesData = [
      { items: [] },
      { items: [] },
      { items: [] },
      { items: [] },
      { items: [] },
      { items: [] },
      { items: [] },
    ];

    await updateDoc(docRef, {
      departmentsData: emptyDepartmentsData,
      supportRolesData: emptySupportRolesData,
    });

    return new Response(
      JSON.stringify({
        status: "success",
        message: `Limpeza (Linha e Loco) da Turma ${team} concluída.`,
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
