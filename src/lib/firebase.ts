import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

// Função auxiliar para inicializar um app apenas se a API key estiver presente
function safeInitializeApp(config: any, appName: string) {
  if (!config.apiKey) {
    console.warn(`Firebase: Credenciais não encontradas para o banco '${appName}'. Operando em modo offline/demo.`);
    return null;
  }
  
  if (getApps().length === 0 || !getApps().some(app => app.name === appName)) {
    return initializeApp(config, appName);
  }
  return getApp(appName);
}

// Configuração Banco 1 - DSS (Leitura)
const dssConfig = {
  apiKey: import.meta.env.VITE_apiKey_dss,
  authDomain: import.meta.env.VITE_authDomain_dss,
  projectId: import.meta.env.VITE_projectId_dss,
  storageBucket: import.meta.env.VITE_storageBucket_dss,
  messagingSenderId: import.meta.env.VITE_messagingSenderId_dss,
  appId: import.meta.env.VITE_appId_dss
};

// Configuração Banco 2 - Registros (Leitura + Escrita)
const regConfig = {
  apiKey: import.meta.env.VITE_apiKey_distribuicao,
  authDomain: import.meta.env.VITE_authDomain_distribuicao,
  projectId: import.meta.env.VITE_projectId_distribuicao,
  storageBucket: import.meta.env.VITE_storageBucket_distribuicao,
  messagingSenderId: import.meta.env.VITE_messagingSenderId_distribuicao,
  appId: import.meta.env.VITE_appId_distribuicao
};

const appDSS = safeInitializeApp(dssConfig, 'dss');
const appRegistros = safeInitializeApp(regConfig, 'registros');

export const dbDSS = appDSS ? getFirestore(appDSS) : null;
export const dbRegistros = appRegistros ? getFirestore(appRegistros) : null;

export const authDSS = appDSS ? getAuth(appDSS) : null;
export const authRegistros = appRegistros ? getAuth(appRegistros) : null;

// Função para logar anonimamente nos bancos que estiverem ativos
export const signInToFirebase = async () => {
  const promises = [];
  if (authDSS) {
    promises.push(signInAnonymously(authDSS).catch(e => console.error('Erro Auth DSS:', e)));
  }
  if (authRegistros) {
    promises.push(signInAnonymously(authRegistros).catch(e => console.error('Erro Auth Registros:', e)));
  }
  await Promise.all(promises);
};
