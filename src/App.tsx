import React, { useState, useEffect } from 'react';
import type {
  Colaborador,
  ReceitaLancamento,
  CategoriaFinanceira,
  CafeteriaSettings,
  UserSession,
} from './types';
import {
  loadStoredSettings,
  saveStoredSettings,
  subscribeAuth,
  subscribeColaboradores,
  subscribeReceitas,
  addColaborador,
  deleteColaborador,
  addReceita,
  deleteReceita,
  addPagamentoParcial,
  deletePagamentoParcial,
  resetarTodasAsBaixas,
  logoutFirebase,
} from './services/firebase';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { GlobalDashboard } from './components/GlobalDashboard';
import { ColaboradorDashboard } from './components/ColaboradorDashboard';
import { ModalPagamento } from './components/ModalPagamento';
import { ModalRelatorio } from './components/ModalRelatorio';
import { AuthScreen } from './components/AuthScreen';

export default function App() {
  // App Settings
  const [settings, setSettings] = useState<CafeteriaSettings>(loadStoredSettings);

  // User State
  const [user, setUser] = useState<UserSession | null>(() => {
    if (settings.usarModoDemo) {
      return {
        uid: 'demo-gestor-cafeteria',
        email: 'gestor@refeicoes.com.br',
        displayName: 'Gestor(a) Financeiro Refeições',
        isDemo: true,
      };
    }
    return null;
  });

  // Navigation State
  const [selectedColabId, setSelectedColabId] = useState<string | null>(null);
  const [dataVisao, setDataVisao] = useState<Date>(new Date());
  const [categoriaAtiva, setCategoriaAtiva] = useState<CategoriaFinanceira>('Café');
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState<boolean>(false);

  // Data Caches
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [receitas, setReceitas] = useState<ReceitaLancamento[]>([]);

  // Modals
  const [modalPagamentoState, setModalPagamentoState] = useState<{
    isOpen: boolean;
    receita: ReceitaLancamento | null;
  }>({
    isOpen: false,
    receita: null,
  });

  const [isRelatorioOpen, setIsRelatorioOpen] = useState<boolean>(false);

  // Auth Listener
  useEffect(() => {
    const unsub = subscribeAuth((fbUser, isDemo) => {
      if (fbUser) {
        setUser({
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName,
          isDemo,
        });
      } else {
        setUser(null);
      }
    });
    return unsub;
  }, [settings.usarModoDemo]);

  // Data Listeners
  useEffect(() => {
    if (!user) {
      setColaboradores([]);
      setReceitas([]);
      return;
    }

    const unsubColabs = subscribeColaboradores(user.uid, !!user.isDemo, (list) => {
      setColaboradores(list);
    });

    const unsubRecs = subscribeReceitas(user.uid, !!user.isDemo, (list) => {
      setReceitas(list);
    });

    return () => {
      unsubColabs();
      unsubRecs();
    };
  }, [user]);

  // Month navigation handler
  const handleChangeMonth = (delta: number) => {
    setDataVisao((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + delta);
      return next;
    });
  };

  // Add Collaborator handler (tied to the active shift)
  const handleAddColaborador = async (
    nome: string,
    setor: string,
    turno: CategoriaFinanceira
  ) => {
    if (!user) return;
    await addColaborador(user.uid, !!user.isDemo, { nome, setor, turno });
  };

  // Switch shift handler
  const handleSelectCategoria = (cat: CategoriaFinanceira) => {
    setCategoriaAtiva(cat);
    if (selectedColabId) {
      const colab = colaboradores.find((c) => c.id === selectedColabId);
      if (colab && (colab.turno || 'Café') !== cat) {
        setSelectedColabId(null);
      }
    }
  };

  // Delete Collaborator handler
  const handleDeleteColaborador = async (id: string) => {
    if (!user) return;
    await deleteColaborador(user.uid, !!user.isDemo, id);
    if (selectedColabId === id) {
      setSelectedColabId(null);
    }
  };

  // Add Recipe/Entry handler
  const handleAddReceita = async (rec: Omit<ReceitaLancamento, 'id'>) => {
    if (!user) return;
    await addReceita(user.uid, !!user.isDemo, rec);
  };

  // Delete Recipe handler
  const handleDeleteReceita = async (id: string) => {
    if (!user) return;
    await deleteReceita(user.uid, !!user.isDemo, id);
  };

  // Open Payment Modal
  const handleOpenModalPagamento = (receita: ReceitaLancamento) => {
    setModalPagamentoState({
      isOpen: true,
      receita,
    });
  };

  // Confirm Payment
  const handleConfirmPagamento = async (valor: number, obs: string) => {
    if (!user || !modalPagamentoState.receita) return;
    const recId = modalPagamentoState.receita.id;
    await addPagamentoParcial(
      user.uid,
      !!user.isDemo,
      recId,
      {
        valor,
        obs,
        data: new Date().toLocaleDateString('pt-BR'),
      },
      receitas
    );
  };

  // Delete Partial Payment
  const handleDeletePagamentoParcial = async (
    receitaId: string,
    index: number
  ) => {
    if (!user) return;
    await deletePagamentoParcial(
      user.uid,
      !!user.isDemo,
      receitaId,
      index,
      receitas
    );
  };

  // Reset/Clear all partial payments of a recipe/launch
  const handleResetarTodasAsBaixas = async (receitaId: string) => {
    if (!user) return;
    await resetarTodasAsBaixas(user.uid, !!user.isDemo, receitaId);
  };

  // Save Settings
  const handleSaveSettings = (newSettings: CafeteriaSettings) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings);
    if (newSettings.usarModoDemo) {
      setUser({
        uid: 'demo-gestor-cafeteria',
        email: 'gestor@refeicoes.com.br',
        displayName: 'Gestor(a) Financeiro Refeições',
        isDemo: true,
      });
    }
  };

  // Logout
  const handleLogout = async () => {
    if (user?.isDemo) {
      setUser(null);
      setSettings((prev) => {
        const updated = { ...prev, usarModoDemo: false };
        saveStoredSettings(updated);
        return updated;
      });
    } else {
      await logoutFirebase();
      setUser(null);
    }
    setSelectedColabId(null);
  };

  // If user is not authenticated and not in demo mode, show Auth Screen
  if (!user) {
    return (
      <AuthScreen
        nomeCafeteria={settings.nomeCafeteria}
        onSuccessDemo={() => {
          const updated = { ...settings, usarModoDemo: true };
          handleSaveSettings(updated);
        }}
      />
    );
  }

  // Find currently selected collaborator only if belonging to the active shift
  const selectedColaborador = colaboradores.find(
    (c) => c.id === selectedColabId && (c.turno || 'Café') === categoriaAtiva
  );

  // Calculate sum paid for active modal item
  const modalItemRecebido = modalPagamentoState.receita
    ? (modalPagamentoState.receita.pagamentos || []).reduce(
        (acc, p) => acc + (p.valor || 0),
        0
      )
    : 0;

  return (
    <div className="flex w-full min-h-screen bg-stone-100/90 text-stone-900 antialiased font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpenMobile={isSidebarOpenMobile}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
        colaboradores={colaboradores}
        selectedColabId={selectedColabId}
        onSelectColab={(id) => setSelectedColabId(id)}
        onAddColaborador={handleAddColaborador}
        onDeleteColaborador={handleDeleteColaborador}
        categoriaAtiva={categoriaAtiva}
        onSelectCategoria={handleSelectCategoria}
        onOpenRelatorio={() => setIsRelatorioOpen(true)}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Top Navbar */}
        <Navbar
          onToggleMobileMenu={() => setIsSidebarOpenMobile(!isSidebarOpenMobile)}
          dataVisao={dataVisao}
          onChangeMonth={handleChangeMonth}
          categoriaAtiva={categoriaAtiva}
          onLogout={handleLogout}
          user={user}
        />

        {/* Dashboard Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {selectedColaborador ? (
            <ColaboradorDashboard
              colaborador={selectedColaborador}
              receitas={receitas}
              categoriaAtiva={categoriaAtiva}
              dataVisao={dataVisao}
              onVoltarGlobal={() => setSelectedColabId(null)}
              onAddReceita={handleAddReceita}
              onDeleteReceita={handleDeleteReceita}
              onOpenModalPagamento={handleOpenModalPagamento}
              onDeletePagamentoParcial={handleDeletePagamentoParcial}
              onResetarTodasAsBaixas={handleResetarTodasAsBaixas}
            />
          ) : (
            <GlobalDashboard
              colaboradores={colaboradores}
              receitas={receitas}
              categoriaAtiva={categoriaAtiva}
              dataVisao={dataVisao}
              onSelectColab={(id) => setSelectedColabId(id)}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <ModalPagamento
        isOpen={modalPagamentoState.isOpen}
        onClose={() => setModalPagamentoState({ isOpen: false, receita: null })}
        onConfirm={handleConfirmPagamento}
        tituloLancamento={modalPagamentoState.receita?.titulo || ''}
        valorTotal={modalPagamentoState.receita?.valorTotal || 0}
        valorJaPago={modalItemRecebido}
      />

      <ModalRelatorio
        isOpen={isRelatorioOpen}
        onClose={() => setIsRelatorioOpen(false)}
        colaboradores={colaboradores}
        receitas={receitas}
        nomeCafeteria={settings.nomeCafeteria}
        dataVisao={dataVisao}
      />
    </div>
  );
}
