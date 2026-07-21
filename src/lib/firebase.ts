import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
} from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

// Função auxiliar para inicializar um app apenas se a API key estiver presente
function safeInitializeApp(config: any, appName: string) {
  console.log(
    `[DEBUG] Tentando inicializar Firebase: ${appName}`,
    config.apiKey ? "API KEY ENCONTRADA" : "API KEY FALTANDO!",
  );
  if (!config.apiKey) {
    console.warn(
      `Firebase: Credenciais não encontradas para o banco '${appName}'. Operando em modo offline/demo.`,
    );
    return null;
  }

  if (
    getApps().length === 0 ||
    !getApps().some((app) => app.name === appName)
  ) {
    return initializeApp(config, appName);
  }
  return getApp(appName);
}

// Configuração Banco Único - DSS
const dssConfig = {
  apiKey: import.meta.env.VITE_apiKey_dss,
  authDomain: import.meta.env.VITE_authDomain_dss,
  projectId: import.meta.env.VITE_projectId_dss,
  storageBucket: import.meta.env.VITE_storageBucket_dss,
  messagingSenderId: import.meta.env.VITE_messagingSenderId_dss,
  appId: import.meta.env.VITE_appId_dss,
};
const appDSS = safeInitializeApp(dssConfig, "dss");

// Ativando o cache persistente (IndexedDB) para economizar leituras do Firebase
export const dbDSS = appDSS
  ? initializeFirestore(appDSS, { localCache: persistentLocalCache() })
  : null;
export const authDSS = appDSS ? getAuth(appDSS) : null;

// Função para logar anonimamente
export const signInToFirebase = async () => {
  if (authDSS) {
    await signInAnonymously(authDSS).catch((e) =>
      console.error("Erro Auth DSS:", e),
    );
  }
};
