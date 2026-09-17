import React, { useState } from 'react';
import {
  Coffee,
  Utensils,
  FileSpreadsheet,
  LayoutDashboard,
  ChevronDown,
  UserPlus,
  Search,
  Trash2,
  Users,
  Sparkles,
  Sun,
  Moon,
} from 'lucide-react';
import type { Colaborador, CategoriaFinanceira } from '../types';
import { normalizarTexto } from '../utils/format';
import { CoffeeLogo } from './CoffeeLogo';
import { ModalConfirmacao } from './ModalConfirmacao';

interface SidebarProps {
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  colaboradores: Colaborador[];
  selectedColabId: string | null;
  onSelectColab: (id: string | null) => void;
  onAddColaborador: (nome: string, setor: string, turno: CategoriaFinanceira) => Promise<void>;
  onDeleteColaborador: (id: string, nome: string) => Promise<void>;
  categoriaAtiva: CategoriaFinanceira;
  onSelectCategoria: (cat: CategoriaFinanceira) => void;
  onOpenRelatorio: () => void;
}

const CATEGORIAS_CONFIG: {
  nome: CategoriaFinanceira;
  label: string;
  subLabel: string;
  icone: React.ReactNode;
}[] = [
  {
    nome: 'Café',
    label: '☕ Café (Manhã)',
    subLabel: 'Turno Diurno',
    icone: <Sun size={16} className="text-amber-400" />,
  },
  {
    nome: 'Hamburgueria',
    label: '🍔 Hamburgueria (Noite)',
    subLabel: 'Turno Noturno',
    icone: <Moon size={16} className="text-orange-400" />,
  },
];

const SETORES_SUGERIDOS = [
  'Barista (Café)',
  'Atendente de Salão (Café)',
  'Confeitaria & Cozinha (Café)',
  'Chapeiro (Hamburgueria)',
  'Cozinha & Montagem (Hamburgueria)',
  'Atendente / Garçom (Hamburgueria)',
  'Operador de Caixa',
  'Gerente de Turno',
  'Apoio & Limpeza',
];

export const Sidebar: React.FC<SidebarProps> = ({
  isOpenMobile,
  onCloseMobile,
  colaboradores,
  selectedColabId,
  onSelectColab,
  onAddColaborador,
  onDeleteColaborador,
  categoriaAtiva,
  onSelectCategoria,
  onOpenRelatorio,
}) => {
  const [accCategoriasAberto, setAccCategoriasAberto] = useState(true);
  const [accCadastroAberto, setAccCadastroAberto] = useState(false);

  const [busca, setBusca] = useState('');
  const [novoNome, setNovoNome] = useState('');
  const [novoSetor, setNovoSetor] = useState('');
  const [loadingCadastro, setLoadingCadastro] = useState(false);
  const [erroCadastro, setErroCadastro] = useState('');
  const [colabParaExcluir, setColabParaExcluir] = useState<Colaborador | null>(null);

  // Filter staff strictly by the active operational shift (Café vs Hamburgueria)
  const colaboradoresDoTurno = colaboradores.filter(
    (c) => (c.turno || 'Café') === categoriaAtiva
  );

  // Search filter on top of the shift-isolated staff
  const termo = normalizarTexto(busca);
  const colaboradoresFiltrados = colaboradoresDoTurno
    .slice()
    .sort((a, b) => normalizarTexto(a.nome).localeCompare(normalizarTexto(b.nome), 'pt-BR'))
    .filter((c) => {
      if (!termo) return true;
      return (
        normalizarTexto(c.nome).includes(termo) || normalizarTexto(c.setor).includes(termo)
      );
    });

  const handleCadastrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroCadastro('');
    if (!novoNome.trim()) {
      setErroCadastro('Por favor informe o nome do colaborador.');
      return;
    }
    setLoadingCadastro(true);
    const setorPadrao =
      categoriaAtiva === 'Café' ? 'Barista (Café)' : 'Chapeiro (Hamburgueria)';
    try {
      await onAddColaborador(
        novoNome.trim(),
        novoSetor.trim() || setorPadrao,
        categoriaAtiva
      );
      setNovoNome('');
      setNovoSetor('');
      setErroCadastro('');
      setAccCadastroAberto(false);
    } catch (err) {
      console.error(err);
      setErroCadastro('Erro ao cadastrar colaborador no banco de dados.');
    } finally {
      setLoadingCadastro(false);
    }
  };

  const handleExcluir = (e: React.MouseEvent, c: Colaborador) => {
    e.stopPropagation();
    setColabParaExcluir(c);
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          id="sidebar-overlay"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-stone-950/70 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="sidebar-menu"
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-72 lg:w-80 bg-stone-950 text-stone-100 flex flex-col h-screen border-r border-stone-800 shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-stone-800/80 bg-gradient-to-b from-stone-900 to-stone-950 flex flex-col items-center text-center">
          <CoffeeLogo size="lg" />
          <p className="text-[11px] text-amber-200/70 font-medium tracking-wide mt-2">
            Controle de Folha & Gorjetas
          </p>
        </div>

        {/* Action Buttons */}
        <div className="p-4 space-y-2 border-b border-stone-800/80 bg-stone-900/30">
          <button
            id="btn-abrir-relatorio"
            type="button"
            onClick={() => {
              onOpenRelatorio();
              onCloseMobile();
            }}
            className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs shadow-md shadow-amber-950/40 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <FileSpreadsheet size={16} />
            <span>📋 Relatório Mensal WhatsApp</span>
          </button>

          <button
            id="btn-visao-geral"
            type="button"
            onClick={() => {
              onSelectColab(null);
              onCloseMobile();
            }}
            className={`w-full py-2 px-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer ${
              selectedColabId === null
                ? 'bg-stone-800 border-amber-600 text-amber-300 shadow-xs'
                : 'bg-stone-900/60 border-stone-800 text-stone-300 hover:bg-stone-800 hover:text-white'
            }`}
          >
            <LayoutDashboard size={15} />
            <span>🏠 Visão Global da Cafeteria</span>
          </button>
        </div>

        {/* Scrollable Navigation Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* ACCORDION 1: Categorias */}
          <div className="rounded-xl border border-stone-800 bg-stone-900/40 overflow-hidden">
            <button
              type="button"
              onClick={() => setAccCategoriasAberto(!accCategoriasAberto)}
              className="w-full p-3 flex items-center justify-between text-stone-300 font-bold hover:text-white transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Coffee size={15} className="text-amber-500" />
                <span>OPERAÇÃO ({categoriaAtiva})</span>
              </div>
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 ${
                  accCategoriasAberto ? 'rotate-180 text-amber-500' : 'text-stone-500'
                }`}
              />
            </button>

            {accCategoriasAberto && (
              <div className="p-2 pt-0 space-y-1.5">
                {CATEGORIAS_CONFIG.map((cat) => {
                  const isActive = categoriaAtiva === cat.nome;
                  return (
                    <button
                      key={cat.nome}
                      type="button"
                      onClick={() => {
                        onSelectCategoria(cat.nome);
                        onCloseMobile();
                      }}
                      className={`w-full px-3 py-2.5 rounded-xl font-semibold flex items-center gap-2.5 transition-all text-left cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-amber-700 to-amber-800 text-white shadow-md font-bold border-l-4 border-amber-300'
                          : 'text-stone-400 hover:bg-stone-800/80 hover:text-stone-200'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg ${isActive ? 'bg-white/20' : 'bg-stone-800'}`}>
                        {cat.icone}
                      </div>
                      <div className="flex flex-col flex-1">
                        <span className="text-xs font-bold leading-tight">{cat.label}</span>
                        <span
                          className={`text-[10px] leading-tight ${
                            isActive ? 'text-amber-200' : 'text-stone-500'
                          }`}
                        >
                          {cat.subLabel}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ACCORDION 2: Novo Cadastro */}
          <div className="rounded-xl border border-stone-800 bg-stone-900/40 overflow-hidden">
            <button
              type="button"
              onClick={() => setAccCadastroAberto(!accCadastroAberto)}
              className="w-full p-3 flex items-center justify-between text-stone-300 font-bold hover:text-white transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <UserPlus size={15} className="text-emerald-500" />
                <span>+ NOVO COLABORADOR</span>
              </div>
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 ${
                  accCadastroAberto ? 'rotate-180 text-emerald-500' : 'text-stone-500'
                }`}
              />
            </button>

            {accCadastroAberto && (
              <form onSubmit={handleCadastrar} className="p-3 pt-0 space-y-2">
                <div className="p-2 rounded-lg bg-stone-950/80 border border-stone-800 text-[11px] flex items-center justify-between">
                  <span className="text-stone-400">Turno de Cadastro:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                      categoriaAtiva === 'Café'
                        ? 'bg-amber-900/60 text-amber-200 border border-amber-700/50'
                        : 'bg-orange-950 text-orange-200 border border-orange-700/50'
                    }`}
                  >
                    {categoriaAtiva === 'Café' ? '☕ Café (Manhã)' : '🍔 Hamburgueria (Noite)'}
                  </span>
                </div>

                <div>
                  <input
                    type="text"
                    placeholder={`Nome do funcionário (${categoriaAtiva})...`}
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-stone-950 border border-stone-700 text-stone-100 text-xs placeholder:text-stone-500 outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <input
                    list="setores-cafeteria"
                    type="text"
                    placeholder={
                      categoriaAtiva === 'Café'
                        ? 'Cargo/Setor (ex: Barista)'
                        : 'Cargo/Setor (ex: Chapeiro)'
                    }
                    value={novoSetor}
                    onChange={(e) => setNovoSetor(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-stone-950 border border-stone-700 text-stone-100 text-xs placeholder:text-stone-500 outline-none focus:border-amber-500"
                  />
                  <datalist id="setores-cafeteria">
                    {SETORES_SUGERIDOS.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>
                {erroCadastro && (
                  <p className="text-[11px] text-red-400 bg-red-950/50 p-2 rounded border border-red-800/60">
                    {erroCadastro}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loadingCadastro}
                  className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Sparkles size={13} />
                  {loadingCadastro ? 'Salvando...' : `Adicionar à Equipe de ${categoriaAtiva}`}
                </button>
              </form>
            )}
          </div>

          {/* SECTION: Colaboradores do Turno Ativo */}
          <div>
            <div className="flex items-center justify-between text-stone-400 font-bold uppercase tracking-wider mb-2 px-1">
              <span className="flex items-center gap-1.5">
                <Users size={14} className={categoriaAtiva === 'Café' ? 'text-amber-500' : 'text-orange-500'} />
                Equipe {categoriaAtiva === 'Café' ? 'Café (Manhã)' : 'Hamburgueria (Noite)'}
              </span>
              <span className="text-[10px] bg-stone-800 text-stone-300 px-2 py-0.5 rounded-full">
                {colaboradoresFiltrados.length}
              </span>
            </div>

            {/* Search Input */}
            <div className="relative mb-2.5">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500"
              />
              <input
                id="search-colab"
                type="text"
                placeholder={`🔍 Buscar na equipe de ${categoriaAtiva}...`}
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-stone-900/90 border border-stone-800 text-stone-200 text-xs placeholder:text-stone-500 outline-none focus:border-amber-600 focus:bg-stone-900 transition-all"
              />
            </div>

            {/* List */}
            <div id="list-users" className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
              {colaboradoresFiltrados.length === 0 ? (
                <div className="text-center py-6 text-stone-500 text-xs px-2">
                  Nenhum colaborador cadastrado no turno{' '}
                  <span className="font-semibold text-stone-300">{categoriaAtiva}</span>.
                </div>
              ) : (
                colaboradoresFiltrados.map((colab) => {
                  const isSelected = colab.id === selectedColabId;
                  return (
                    <div
                      key={colab.id}
                      onClick={() => {
                        onSelectColab(colab.id);
                        onCloseMobile();
                      }}
                      className={`p-3 rounded-xl flex items-center justify-between gap-2 border transition-all cursor-pointer select-none group ${
                        isSelected
                          ? categoriaAtiva === 'Café'
                            ? 'bg-amber-700 border-amber-500 text-white shadow-md shadow-amber-950/40'
                            : 'bg-orange-700 border-orange-500 text-white shadow-md shadow-orange-950/40'
                          : 'bg-stone-900/50 border-stone-800/80 text-stone-300 hover:bg-stone-800 hover:border-stone-700'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs truncate">{colab.nome}</div>
                        <div
                          className={`text-[11px] truncate ${
                            isSelected ? 'text-amber-200' : 'text-stone-400'
                          }`}
                        >
                          {categoriaAtiva === 'Café' ? '☕' : '🍔'} {colab.setor || 'Equipe'}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleExcluir(e, colab)}
                        title="Remover da lista"
                        className={`p-1.5 rounded-lg opacity-40 group-hover:opacity-100 hover:opacity-100 transition-all cursor-pointer ${
                          isSelected
                            ? 'text-white hover:bg-amber-800'
                            : 'text-stone-400 hover:text-red-400 hover:bg-stone-800'
                        }`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 bg-stone-950 border-t border-stone-800/80 text-stone-500 text-[10px] text-center">
          ☕ Financeiro Refeições • Café e Hamburgueria
        </div>
      </aside>

      {/* Confirmation Modal for Staff Removal */}
      <ModalConfirmacao
        isOpen={!!colabParaExcluir}
        onClose={() => setColabParaExcluir(null)}
        onConfirm={async () => {
          if (colabParaExcluir) {
            await onDeleteColaborador(colabParaExcluir.id, colabParaExcluir.nome);
            setColabParaExcluir(null);
          }
        }}
        titulo="Excluir Colaborador"
        descricao={`Tem certeza que deseja remover ${colabParaExcluir?.nome} da equipe do turno ${colabParaExcluir?.turno || categoriaAtiva}?`}
        detalhe={colabParaExcluir ? `${colabParaExcluir.nome} • Cargo: ${colabParaExcluir.setor || 'Equipe'}` : undefined}
        textoConfirmar="Sim, Excluir Colaborador"
        textoCancelar="Cancelar"
        variante="danger"
      />
    </>
  );
};
