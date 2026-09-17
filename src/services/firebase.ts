import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  type Auth,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore';
import type {
  Colaborador,
  ReceitaLancamento,
  FirebaseCredentials,
  CafeteriaSettings,
  PagamentoParcial,
  CategoriaFinanceira,
} from '../types';

const SETTINGS_STORAGE_KEY = 'grao_nobre_settings';
const DEMO_USERS_KEY = 'grao_nobre_demo_colabs';
const DEMO_RECS_KEY = 'grao_nobre_demo_recs';

// Default initial config safely reading from environment or configured project
const metaEnv = (import.meta as unknown as { env: Record<string, string | undefined> }).env || {};

export const DEFAULT_FIREBASE_CONFIG: FirebaseCredentials = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || "AIzaSyCubwgXzYPEAW9C6k8kRyqnhvpx5iyUWHk",
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || "cafe-8122a.firebaseapp.com",
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || "cafe-8122a",
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || "cafe-8122a.firebasestorage.app",
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || "708885617914",
  appId: metaEnv.VITE_FIREBASE_APP_ID || "1:708885617914:web:6b8ff7123a10a333857d43",
};

export const DEFAULT_SETTINGS: CafeteriaSettings = {
  nomeCafeteria: 'Financeiro Refeições - Café e Hamburgueria',
  slogan: 'Gestão Financeira & Folha de Pagamentos',
  githubRepoUrl: '',
  usarModoDemo: false, // Conectado diretamente ao projeto Firebase cafe-8122a
  firebaseConfig: DEFAULT_FIREBASE_CONFIG,
};

export function loadStoredSettings(): CafeteriaSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ensure we use the active configured keys if the stored ones are empty
      const mergedConfig = {
        ...DEFAULT_FIREBASE_CONFIG,
        ...(parsed.firebaseConfig || {}),
      };
      // If the stored config had empty or placeholder apiKey, use the current active one
      if (!mergedConfig.apiKey || mergedConfig.apiKey.length < 10) {
        mergedConfig.apiKey = DEFAULT_FIREBASE_CONFIG.apiKey;
        mergedConfig.authDomain = DEFAULT_FIREBASE_CONFIG.authDomain;
        mergedConfig.projectId = DEFAULT_FIREBASE_CONFIG.projectId;
        mergedConfig.storageBucket = DEFAULT_FIREBASE_CONFIG.storageBucket;
        mergedConfig.messagingSenderId = DEFAULT_FIREBASE_CONFIG.messagingSenderId;
        mergedConfig.appId = DEFAULT_FIREBASE_CONFIG.appId;
      }

      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        firebaseConfig: mergedConfig,
      };
    }
  } catch (err) {
    console.warn('Erro ao carregar configurações salvas:', err);
  }
  return DEFAULT_SETTINGS;
}

export function saveStoredSettings(settings: CafeteriaSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Erro ao salvar configurações:', err);
  }
}

// Initial Sample Data for Cafeteria & Hamburgueria
const SEED_COLABS: Colaborador[] = [
  { id: 'c1', nome: 'Lucas Silva', setor: 'Barista (Café)', turno: 'Café', chavePix: 'lucas.barista@pix.com', telefone: '(11) 98765-4321' },
  { id: 'c2', nome: 'Camila Rocha', setor: 'Confeitaria (Café)', turno: 'Café', chavePix: 'camila.confeitaria@pix.com', telefone: '(11) 97654-3210' },
  { id: 'c3', nome: 'Mateus Oliveira', setor: 'Atendente Manhã (Café)', turno: 'Café', chavePix: 'mateus.cafe@pix.com', telefone: '(11) 96543-2109' },
  { id: 'c4', nome: 'Rodrigo Santos', setor: 'Chapeiro (Hamburgueria)', turno: 'Hamburgueria', chavePix: 'rodrigo.burger@pix.com', telefone: '(11) 95432-1098' },
  { id: 'c5', nome: 'Juliana Mendes', setor: 'Cozinha Noite (Hamburgueria)', turno: 'Hamburgueria', chavePix: 'juliana.burger@pix.com', telefone: '(11) 94321-0987' },
  { id: 'c6', nome: 'Fernanda Lima', setor: 'Atendente Noite (Hamburgueria)', turno: 'Hamburgueria', chavePix: 'fernanda.burger@pix.com', telefone: '(11) 93210-9876' },
];

function getInitialDemoReceitas(): ReceitaLancamento[] {
  const agora = new Date();
  const mesAtual = agora.getMonth();
  const anoAtual = agora.getFullYear();
  const dataRef = new Date(anoAtual, mesAtual, 10).toISOString();

  return [
    {
      id: 'r1',
      colabId: 'c1',
      titulo: 'Salário Turno Café (Manhã)',
      categoria: 'Café',
      valorTotal: 2600.0,
      observacoes: 'Salário mensal barista manhã',
      dataRef,
      pagamentos: [
        {
          valor: 1300.0,
          data: '15/09/2026',
          obs: '1ª quinzena via PIX',
        },
      ],
    },
    {
      id: 'r2',
      colabId: 'c2',
      titulo: 'Salário Confeitaria & Café (Manhã)',
      categoria: 'Café',
      valorTotal: 2800.0,
      observacoes: 'Produção de doces e salgados matinais',
      dataRef,
      pagamentos: [
        {
          valor: 1400.0,
          data: '15/09/2026',
          obs: '1ª parcela bancária',
        },
      ],
    },
    {
      id: 'r3',
      colabId: 'c3',
      titulo: 'Salário Atendente Café (Manhã)',
      categoria: 'Café',
      valorTotal: 1850.0,
      observacoes: 'Atendente balcão e salão diurno',
      dataRef,
      pagamentos: [],
    },
    {
      id: 'r4',
      colabId: 'c4',
      titulo: 'Salário Chapeiro (Hamburgueria Noite)',
      categoria: 'Hamburgueria',
      valorTotal: 2900.0,
      observacoes: 'Chapeiro responsável turno noturno',
      dataRef,
      pagamentos: [
        {
          valor: 1450.0,
          data: '15/09/2026',
          obs: 'Adiantamento via PIX',
        },
      ],
    },
    {
      id: 'r5',
      colabId: 'c5',
      titulo: 'Salário Cozinha & Porções (Hamburgueria Noite)',
      categoria: 'Hamburgueria',
      valorTotal: 2400.0,
      observacoes: 'Preparo de lanches e porções noturnas',
      dataRef,
      pagamentos: [],
    },
    {
      id: 'r6',
      colabId: 'c6',
      titulo: 'Salário Atendente / Garçom (Hamburgueria Noite)',
      categoria: 'Hamburgueria',
      valorTotal: 1950.0,
      observacoes: 'Atendimento de mesas no turno da noite',
      dataRef,
      pagamentos: [
        {
          valor: 1950.0,
          data: '05/09/2026',
          obs: 'Salário integral quitado',
        },
      ],
    },
  ];
}

// Local Demo State Manager
class DemoStore {
  private colabs: Colaborador[] = [];
  private recs: ReceitaLancamento[] = [];
  private colabListeners: Set<(colabs: Colaborador[]) => void> = new Set();
  private recListeners: Set<(recs: ReceitaLancamento[]) => void> = new Set();

  constructor() {
    this.load();
  }

  private load() {
    try {
      const storedUsers = localStorage.getItem(DEMO_USERS_KEY);
      if (storedUsers) {
        const parsed = JSON.parse(storedUsers) as Colaborador[];
        this.colabs = parsed.map((c) => {
          let turno = c.turno;
          if (!turno) {
            const txt = ((c.setor || '') + ' ' + (c.nome || '')).toLowerCase();
            turno =
              txt.includes('burger') ||
              txt.includes('hamburguer') ||
              txt.includes('chapeiro') ||
              txt.includes('noite')
                ? 'Hamburgueria'
                : 'Café';
          }
          return { ...c, turno };
        });
      } else {
        this.colabs = SEED_COLABS;
      }

      const storedRecs = localStorage.getItem(DEMO_RECS_KEY);
      if (storedRecs) {
        const parsed = JSON.parse(storedRecs) as ReceitaLancamento[];
        this.recs = parsed.map((r) => ({
          ...r,
          categoria: (r.categoria === 'Hamburgueria' ? 'Hamburgueria' : 'Café') as CategoriaFinanceira,
        }));
      } else {
        this.recs = getInitialDemoReceitas();
      }
    } catch {
      this.colabs = SEED_COLABS;
      this.recs = getInitialDemoReceitas();
    }
  }

  private save() {
    try {
      localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(this.colabs));
      localStorage.setItem(DEMO_RECS_KEY, JSON.stringify(this.recs));
    } catch (e) {
      console.warn('Erro ao salvar no cache local:', e);
    }
  }

  notifyColabs() {
    this.save();
    this.colabListeners.forEach((l) => l([...this.colabs]));
  }

  notifyRecs() {
    this.save();
    this.recListeners.forEach((l) => l([...this.recs]));
  }

  subscribeColabs(callback: (colabs: Colaborador[]) => void): Unsubscribe {
    this.colabListeners.add(callback);
    callback([...this.colabs]);
    return () => this.colabListeners.delete(callback);
  }

  subscribeRecs(callback: (recs: ReceitaLancamento[]) => void): Unsubscribe {
    this.recListeners.add(callback);
    callback([...this.recs]);
    return () => this.recListeners.delete(callback);
  }

  addColab(nome: string, setor: string, turno: CategoriaFinanceira = 'Café'): Colaborador {
    const novo: Colaborador = {
      id: 'colab_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      nome,
      setor,
      turno,
    };
    this.colabs.push(novo);
    this.notifyColabs();
    return novo;
  }

  deleteColab(id: string) {
    this.colabs = this.colabs.filter((c) => c.id !== id);
    this.recs = this.recs.filter((r) => r.colabId !== id && r.utilizadorId !== id);
    this.save();
    this.colabListeners.forEach((l) => l([...this.colabs]));
    this.recListeners.forEach((l) => l([...this.recs]));
  }

  addRec(rec: Omit<ReceitaLancamento, 'id'>): ReceitaLancamento {
    const nova: ReceitaLancamento = {
      id: 'rec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      ...rec,
      pagamentos: rec.pagamentos || [],
      historicoPagamentos: rec.pagamentos || [],
    };
    this.recs.push(nova);
    this.notifyRecs();
    return nova;
  }

  updateRec(id: string, updates: Partial<ReceitaLancamento>) {
    this.recs = this.recs.map((r) => {
      if (r.id === id) {
        const pgs = updates.pagamentos !== undefined ? updates.pagamentos : r.pagamentos;
        return {
          ...r,
          ...updates,
          pagamentos: pgs,
          historicoPagamentos: pgs,
        };
      }
      return r;
    });
    this.notifyRecs();
  }

  deleteRec(id: string) {
    this.recs = this.recs.filter((r) => r.id !== id);
    this.notifyRecs();
  }

  resetToSeed() {
    this.colabs = SEED_COLABS;
    this.recs = getInitialDemoReceitas();
    this.notifyColabs();
    this.notifyRecs();
  }
}

export const demoStore = new DemoStore();

// Firebase Singleton Instance Handler
let firebaseAppInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let firestoreInstance: Firestore | null = null;

export function getFirebaseClient(config?: FirebaseCredentials): {
  app: FirebaseApp | null;
  auth: Auth | null;
  db: Firestore | null;
  hasValidConfig: boolean;
} {
  const currentConfig = config || loadStoredSettings().firebaseConfig;
  const hasValidConfig = Boolean(
    currentConfig.apiKey &&
      currentConfig.apiKey.length > 10 &&
      currentConfig.projectId &&
      !currentConfig.apiKey.includes('MY_')
  );

  if (!hasValidConfig) {
    return { app: null, auth: null, db: null, hasValidConfig: false };
  }

  try {
    const apps = getApps();
    if (apps.length > 0) {
      firebaseAppInstance = apps[0];
    } else {
      firebaseAppInstance = initializeApp({
        apiKey: currentConfig.apiKey,
        authDomain: currentConfig.authDomain,
        projectId: currentConfig.projectId,
        storageBucket: currentConfig.storageBucket,
        messagingSenderId: currentConfig.messagingSenderId,
        appId: currentConfig.appId,
        measurementId: currentConfig.measurementId,
      });
    }

    if (!authInstance && firebaseAppInstance) {
      authInstance = getAuth(firebaseAppInstance);
      setPersistence(authInstance, browserLocalPersistence).catch(console.warn);
    }
    if (!firestoreInstance && firebaseAppInstance) {
      firestoreInstance = getFirestore(firebaseAppInstance);
    }

    return {
      app: firebaseAppInstance,
      auth: authInstance,
      db: firestoreInstance,
      hasValidConfig: true,
    };
  } catch (err) {
    console.warn('Erro ao inicializar Firebase:', err);
    return { app: null, auth: null, db: null, hasValidConfig: false };
  }
}

// Subscribe to Auth changes
export function subscribeAuth(
  onUser: (user: User | null, isDemo: boolean) => void
): () => void {
  const settings = loadStoredSettings();
  if (settings.usarModoDemo) {
    // Demo user session
    const demoUser = {
      uid: 'demo-gestor-cafeteria',
      email: 'gestor@refeicoes.com.br',
      displayName: 'Gestor(a) Financeiro Refeições',
    } as unknown as User;
    onUser(demoUser, true);
    return () => {};
  }

  const { auth, hasValidConfig } = getFirebaseClient(settings.firebaseConfig);
  if (!auth || !hasValidConfig) {
    onUser(null, false);
    return () => {};
  }

  return onAuthStateChanged(auth, (user) => {
    onUser(user, false);
  });
}

// Data Subscriptions (Colaboradores and Receitas)
export function subscribeColaboradores(
  uid: string,
  isDemo: boolean,
  callback: (colabs: Colaborador[]) => void
): Unsubscribe {
  if (isDemo) {
    return demoStore.subscribeColabs(callback);
  }

  const { db } = getFirebaseClient();
  if (!db) {
    callback([]);
    return () => {};
  }

  const colRef = collection(db, `gestao-financeira/${uid}/colaboradores`);
  return onSnapshot(
    colRef,
    (snap) => {
      const list = snap.docs.map((d) => {
        const data = d.data();
        let turno = data.turno as CategoriaFinanceira | undefined;
        if (!turno) {
          const txt = ((data.setor || '') + ' ' + (data.nome || '')).toLowerCase();
          turno =
            txt.includes('burger') ||
            txt.includes('hamburguer') ||
            txt.includes('chapeiro') ||
            txt.includes('noite')
              ? 'Hamburgueria'
              : 'Café';
        }
        return {
          id: d.id,
          nome: data.nome || '',
          setor: data.setor || '',
          turno,
          chavePix: data.chavePix || '',
          telefone: data.telefone || '',
          ativo: data.ativo !== false,
        } as Colaborador;
      });
      callback(list);
    },
    (err) => {
      console.warn('Erro ao escutar colaboradores no Firestore:', err);
    }
  );
}

export function subscribeReceitas(
  uid: string,
  isDemo: boolean,
  callback: (recs: ReceitaLancamento[]) => void
): Unsubscribe {
  if (isDemo) {
    return demoStore.subscribeRecs(callback);
  }

  const { db } = getFirebaseClient();
  if (!db) {
    callback([]);
    return () => {};
  }

  const colRef = collection(db, `gestao-financeira/${uid}/receitas`);
  return onSnapshot(
    colRef,
    (snap) => {
      const list = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          colabId: data.colabId || data.utilizadorId || '',
          titulo: data.titulo || '',
          categoria: data.categoria || 'Café',
          valorTotal: Number(data.valorTotal) || 0,
          observacoes: data.observacoes || '',
          dataRef: data.dataRef || data.dataCriacao || new Date().toISOString(),
          pagamentos: (data.pagamentos || data.historicoPagamentos || []).map((p: any) => ({
            valor: Number(p.valor) || 0,
            data: p.data || '',
            obs: p.obs || p.observacao || '',
          })),
        } as ReceitaLancamento;
      });
      callback(list);
    },
    (err) => {
      console.warn('Erro ao escutar receitas no Firestore:', err);
    }
  );
}

// Data Actions
export async function addColaborador(
  uid: string,
  isDemo: boolean,
  colab: {
    nome: string;
    setor: string;
    turno?: CategoriaFinanceira;
    chavePix?: string;
    telefone?: string;
  }
): Promise<string> {
  const turno = colab.turno || 'Café';
  if (isDemo) {
    const created = demoStore.addColab(colab.nome, colab.setor, turno);
    return created.id;
  }
  const { db } = getFirebaseClient();
  if (!db) throw new Error('Firestore não configurado.');
  const docRef = await addDoc(collection(db, `gestao-financeira/${uid}/colaboradores`), {
    ...colab,
    turno,
  });
  return docRef.id;
}

export async function deleteColaborador(
  uid: string,
  isDemo: boolean,
  colabId: string
): Promise<void> {
  if (isDemo) {
    demoStore.deleteColab(colabId);
    return;
  }
  const { db } = getFirebaseClient();
  if (!db) throw new Error('Firestore não configurado.');
  await deleteDoc(doc(db, `gestao-financeira/${uid}/colaboradores`, colabId));
}

export async function addReceita(
  uid: string,
  isDemo: boolean,
  rec: Omit<ReceitaLancamento, 'id'>
): Promise<string> {
  if (isDemo) {
    const created = demoStore.addRec(rec);
    return created.id;
  }
  const { db } = getFirebaseClient();
  if (!db) throw new Error('Firestore não configurado.');
  const docRef = await addDoc(collection(db, `gestao-financeira/${uid}/receitas`), rec);
  return docRef.id;
}

export async function addPagamentoParcial(
  uid: string,
  isDemo: boolean,
  receitaId: string,
  novoPagamento: PagamentoParcial,
  receitasCache: ReceitaLancamento[]
): Promise<void> {
  const receita = receitasCache.find((r) => r.id === receitaId);
  if (!receita) return;

  const currentPgs = [...(receita.pagamentos || receita.historicoPagamentos || [])];
  const atualizados = [...currentPgs, novoPagamento];

  if (isDemo) {
    demoStore.updateRec(receitaId, { pagamentos: atualizados, historicoPagamentos: atualizados });
    return;
  }

  const { db } = getFirebaseClient();
  if (!db) throw new Error('Firestore não configurado.');
  await updateDoc(doc(db, `gestao-financeira/${uid}/receitas`, receitaId), {
    pagamentos: atualizados,
    historicoPagamentos: atualizados,
  });
}

export async function deletePagamentoParcial(
  uid: string,
  isDemo: boolean,
  receitaId: string,
  index: number,
  receitasCache: ReceitaLancamento[]
): Promise<void> {
  const receita = receitasCache.find((r) => r.id === receitaId);
  if (!receita) return;

  const atualizados = [...(receita.pagamentos || receita.historicoPagamentos || [])];
  if (index >= 0 && index < atualizados.length) {
    atualizados.splice(index, 1);
  }

  if (isDemo) {
    demoStore.updateRec(receitaId, { pagamentos: atualizados, historicoPagamentos: atualizados });
    return;
  }

  const { db } = getFirebaseClient();
  if (!db) throw new Error('Firestore não configurado.');
  await updateDoc(doc(db, `gestao-financeira/${uid}/receitas`, receitaId), {
    pagamentos: atualizados,
    historicoPagamentos: atualizados,
  });
}

export async function resetarTodasAsBaixas(
  uid: string,
  isDemo: boolean,
  receitaId: string
): Promise<void> {
  if (isDemo) {
    demoStore.updateRec(receitaId, { pagamentos: [], historicoPagamentos: [] });
    return;
  }

  const { db } = getFirebaseClient();
  if (!db) throw new Error('Firestore não configurado.');
  await updateDoc(doc(db, `gestao-financeira/${uid}/receitas`, receitaId), {
    pagamentos: [],
    historicoPagamentos: [],
  });
}

export async function deleteReceita(
  uid: string,
  isDemo: boolean,
  receitaId: string
): Promise<void> {
  if (isDemo) {
    demoStore.deleteRec(receitaId);
    return;
  }
  const { db } = getFirebaseClient();
  if (!db) throw new Error('Firestore não configurado.');
  await deleteDoc(doc(db, `gestao-financeira/${uid}/receitas`, receitaId));
}

// Auth Actions
export async function loginFirebase(email: string, pass: string): Promise<User> {
  const { auth } = getFirebaseClient();
  if (!auth) throw new Error('Firebase Auth não configurado.');
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  return cred.user;
}

export async function registerFirebase(email: string, pass: string): Promise<User> {
  const { auth } = getFirebaseClient();
  if (!auth) throw new Error('Firebase Auth não configurado.');
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  return cred.user;
}

export async function logoutFirebase(): Promise<void> {
  const { auth } = getFirebaseClient();
  if (auth) {
    await signOut(auth);
  }
}
