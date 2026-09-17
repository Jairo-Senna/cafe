import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Coffee,
  Users,
  ChevronRight,
  DollarSign,
  PieChart,
  LayoutGrid,
  List,
  Search,
  Clock,
} from 'lucide-react';
import type { Colaborador, ReceitaLancamento, CategoriaFinanceira } from '../types';
import { formatarMoeda, normalizarTexto } from '../utils/format';

interface GlobalDashboardProps {
  colaboradores: Colaborador[];
  receitas: ReceitaLancamento[];
  categoriaAtiva: CategoriaFinanceira;
  dataVisao: Date;
  onSelectColab: (id: string) => void;
}

export const GlobalDashboard: React.FC<GlobalDashboardProps> = ({
  colaboradores,
  receitas,
  categoriaAtiva,
  dataVisao,
  onSelectColab,
}) => {
  const mes = dataVisao.getMonth();
  const ano = dataVisao.getFullYear();

  // Filter recipes for current month + current shift category + shift-isolated collaborators
  const {
    totalPrevisto,
    totalPago,
    saldoRestante,
    dadosPorColaborador,
    resumoPorSetor,
    colaboradoresDoTurno,
    totalLancamentos,
  } =
    useMemo<{
      totalPrevisto: number;
      totalPago: number;
      saldoRestante: number;
      colaboradoresDoTurno: Colaborador[];
      dadosPorColaborador: {
        colab: Colaborador;
        previsto: number;
        pago: number;
        pendente: number;
        qtdLancamentos: number;
      }[];
      resumoPorSetor: Record<string, { previsto: number; pago: number; qtdPessoas: Set<string> }>;
      totalLancamentos: number;
    }>(() => {
      // Staff belonging strictly to the active shift
      const colabsDoTurno = colaboradores.filter(
        (c) => (c.turno || 'Café') === categoriaAtiva
      );

      const filtradas = receitas.filter((r) => {
        const d = new Date(r.dataRef || r.dataCriacao || '');
        if (isNaN(d.getTime())) return false;

        const isMes = d.getMonth() === mes && d.getFullYear() === ano;
        const cat = r.categoria || 'Café';
        const isCat = cat === categoriaAtiva;

        const idColab = r.colabId || r.utilizadorId;
        const isAtivoNoTurno = colabsDoTurno.some((c) => c.id === idColab);

        return isMes && isCat && isAtivoNoTurno;
      });

      let somaTotal = 0;
      let somaPago = 0;

      interface ColabSummary {
        colab: Colaborador;
        previsto: number;
        pago: number;
        pendente: number;
        qtdLancamentos: number;
      }

      const mapColab: Record<string, ColabSummary> = {};
      const mapSetor: Record<string, { previsto: number; pago: number; qtdPessoas: Set<string> }> =
        {};

      colabsDoTurno.forEach((c) => {
        mapColab[c.id] = {
          colab: c,
          previsto: 0,
          pago: 0,
          pendente: 0,
          qtdLancamentos: 0,
        };
      });

      filtradas.forEach((r) => {
        const arrayPgs = r.pagamentos || r.historicoPagamentos || [];
        const pagoRec = arrayPgs.reduce((acc, p) => acc + (p.valor || 0), 0);

        somaTotal += r.valorTotal;
        somaPago += pagoRec;

        const idColab = r.colabId || r.utilizadorId;
        if (idColab && mapColab[idColab]) {
          mapColab[idColab].previsto += r.valorTotal;
          mapColab[idColab].pago += pagoRec;
          mapColab[idColab].pendente += r.valorTotal - pagoRec;
          mapColab[idColab].qtdLancamentos += 1;

          const setor = mapColab[idColab].colab.setor || 'Outros';
          if (!mapSetor[setor]) {
            mapSetor[setor] = { previsto: 0, pago: 0, qtdPessoas: new Set() };
          }
          mapSetor[setor].previsto += r.valorTotal;
          mapSetor[setor].pago += pagoRec;
          mapSetor[setor].qtdPessoas.add(idColab);
        }
      });

      const listaColabs = Object.values(mapColab).sort((a, b) => b.pendente - a.pendente);

      return {
        totalPrevisto: somaTotal,
        totalPago: somaPago,
        saldoRestante: somaTotal - somaPago,
        colaboradoresDoTurno: colabsDoTurno,
        dadosPorColaborador: listaColabs,
        resumoPorSetor: mapSetor,
        totalLancamentos: filtradas.length,
      };
    }, [receitas, colaboradores, categoriaAtiva, mes, ano]);

  const [modoVisualizacao, setModoVisualizacao] = useState<'cards' | 'lista'>('cards');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'pendentes' | 'finalizados'>('todos');
  const [busca, setBusca] = useState<string>('');

  const percentualPago =
    totalPrevisto > 0 ? Math.min(100, Math.round((totalPago / totalPrevisto) * 100)) : 0;

  // Filter staff by search term and status
  const termo = normalizarTexto(busca);
  const dadosFiltrados = useMemo(() => {
    return dadosPorColaborador.filter(({ colab, pendente, previsto, qtdLancamentos }) => {
      // Search
      if (termo) {
        const matchNome = normalizarTexto(colab.nome).includes(termo);
        const matchSetor = normalizarTexto(colab.setor).includes(termo);
        if (!matchNome && !matchSetor) return false;
      }

      // Status
      const quitado = previsto > 0 && pendente <= 0.01;
      if (filtroStatus === 'pendentes') {
        return pendente > 0.01 && qtdLancamentos > 0;
      }
      if (filtroStatus === 'finalizados') {
        return quitado;
      }

      return true;
    });
  }, [dadosPorColaborador, termo, filtroStatus]);

  // Counts for filters
  const totalColabs = dadosPorColaborador.length;
  const qtdPendentes = dadosPorColaborador.filter(
    (d) => d.qtdLancamentos > 0 && d.pendente > 0.01
  ).length;
  const qtdFinalizados = dadosPorColaborador.filter(
    (d) => d.previsto > 0 && d.pendente <= 0.01
  ).length;

  return (
    <div id="global-dashboard" className="space-y-6 animate-in fade-in duration-300">
      {/* Title Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h2
              id="titulo-visao-geral"
              className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2"
            >
              <span>Visão Geral</span>
              <span className="text-amber-500 font-bold">—</span>
              <span className="text-amber-700 font-extrabold">
                {categoriaAtiva === 'Café' ? 'Café' : 'Hamburgueria'}
              </span>
            </h2>
            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 shadow-2xs">
              <TrendingUp size={13} className="text-amber-600" />
              {percentualPago}% pago
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Consolidação de todos os lançamentos e baixas da empresa para este período
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-stone-600 bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200/70">
          <Users size={15} className="text-amber-700" />
          <span>{colaboradoresDoTurno.length} Colaboradores no Turno ({categoriaAtiva})</span>
        </div>
      </div>

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Previsto */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
          <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>TOTAL PREVISTO (EMPRESA)</span>
            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
              $
            </div>
          </div>
          <p id="global-sum-total" className="text-2xl sm:text-3xl font-black text-amber-900">
            {formatarMoeda(totalPrevisto)}
          </p>
          <span className="text-[11px] text-stone-400 mt-1 block">
            {totalLancamentos} lançamento(s) registrado(s)
          </span>
        </div>

        {/* Total Já Pago */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
          <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>TOTAL PAGO / RECEBIDO (EMPRESA)</span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <p id="global-sum-rec" className="text-2xl sm:text-3xl font-black text-emerald-700">
            {formatarMoeda(totalPago)}
          </p>
          <span className="text-[11px] text-stone-500 font-medium mt-1 block">
            {percentualPago}% liquidado
          </span>
        </div>

        {/* Saldo Restante */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs relative overflow-hidden">
          <div
            className={`absolute top-0 left-0 right-0 h-1 ${
              saldoRestante > 0 ? 'bg-stone-400' : 'bg-stone-300'
            }`}
          />
          <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>SALDO RESTANTE (EMPRESA)</span>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                saldoRestante > 0 ? 'bg-stone-100 text-stone-600' : 'bg-stone-100 text-stone-400'
              }`}
            >
              <Clock size={16} />
            </div>
          </div>
          <p
            id="global-sum-rest"
            className={`text-2xl sm:text-3xl font-black ${
              saldoRestante > 0 ? 'text-red-600' : 'text-stone-500'
            }`}
          >
            {formatarMoeda(saldoRestante)}
          </p>
          <span className="text-[11px] text-stone-400 mt-1 block">
            {saldoRestante <= 0 ? 'Tudo quitado para este mês' : 'Aguardando liquidação'}
          </span>
        </div>
      </div>

      {/* Dedicated Central Liquidation Progress Bar (as in reference image) */}
      <div
        id="barra-progresso-geral"
        className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-2.5"
      >
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span className="text-stone-800 font-bold">
            Progresso da Liquidação ({categoriaAtiva === 'Café' ? 'Salário - Café' : 'Salário - Hamburgueria'})
          </span>
          <span className="text-amber-600 font-extrabold text-xs sm:text-sm">
            {percentualPago}% concluído
          </span>
        </div>

        <div className="w-full bg-stone-100 h-3.5 sm:h-4 rounded-full overflow-hidden p-0.5 border border-stone-200/70">
          <div
            className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-amber-500 via-emerald-500 to-emerald-600 shadow-xs"
            style={{ width: `${percentualPago}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-stone-500 font-medium pt-0.5">
          <span>
            Total Pago: <strong className="text-emerald-700 font-bold">{formatarMoeda(totalPago)}</strong>
          </span>
          <span>
            Falta Pagar: <strong className="text-red-600 font-bold">{formatarMoeda(saldoRestante)}</strong>
          </span>
        </div>
      </div>

      {/* Breakdown by Sector / Department */}
      {Object.keys(resumoPorSetor).length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
              <PieChart size={15} className="text-amber-700" />
              Distribuição por Setor na Cafeteria
            </h3>
            <span className="text-[11px] text-stone-400">Total Previsto x Pago</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(
              Object.entries(resumoPorSetor) as [
                string,
                { previsto: number; pago: number; qtdPessoas: Set<string> }
              ][]
            ).map(([setorNome, dados]) => {
              const pendenteSetor = dados.previsto - dados.pago;
              return (
                <div
                  key={setorNome}
                  className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between font-bold text-stone-800">
                    <span className="truncate">{setorNome}</span>
                    <span className="text-stone-500 text-[11px]">
                      {dados.qtdPessoas.size} pessoa(s)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-stone-600 text-[11px]">
                    <span>Previsto: {formatarMoeda(dados.previsto)}</span>
                    <span className="text-emerald-700 font-semibold">
                      Pago: {formatarMoeda(dados.pago)}
                    </span>
                  </div>
                  {pendenteSetor > 0 ? (
                    <div className="text-[11px] text-amber-800 font-bold">
                      Pendente: {formatarMoeda(pendenteSetor)}
                    </div>
                  ) : (
                    <div className="text-[11px] text-emerald-600 font-semibold">Quitado ✓</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Team Breakdown with View & Status Filters */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-4">
        {/* Header & View Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div>
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Coffee size={16} className="text-amber-700" />
              Posição por Colaborador • {categoriaAtiva}
            </h3>
            <p className="text-xs text-stone-500">
              Acompanhe a folha, valores a receber, baixas realizadas e saldos pendentes
            </p>
          </div>

          {/* View Mode Toggle: Cards vs Lista */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-semibold text-stone-400 mr-1 hidden sm:inline">
              Modo:
            </span>
            <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200">
              <button
                type="button"
                id="btn-view-cards"
                onClick={() => setModoVisualizacao('cards')}
                title="Visualização em Cards"
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  modoVisualizacao === 'cards'
                    ? 'bg-white text-stone-900 shadow-xs border border-stone-200/80'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                <LayoutGrid size={15} />
                <span>Cards</span>
              </button>
              <button
                type="button"
                id="btn-view-lista"
                onClick={() => setModoVisualizacao('lista')}
                title="Visualização em Lista"
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  modoVisualizacao === 'lista'
                    ? 'bg-white text-stone-900 shadow-xs border border-stone-200/80'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                <List size={15} />
                <span>Lista</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
            />
            <input
              id="input-filtro-busca"
              type="text"
              placeholder={`Filtrar na equipe de ${categoriaAtiva}...`}
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 placeholder:text-stone-400 focus:bg-white focus:border-amber-600 outline-none transition-colors"
            />
          </div>

          {/* Quick Status Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              id="filtro-todos"
              onClick={() => setFiltroStatus('todos')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                filtroStatus === 'todos'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <span>Todos</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20">
                {totalColabs}
              </span>
            </button>

            <button
              type="button"
              id="filtro-pendentes"
              onClick={() => setFiltroStatus('pendentes')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                filtroStatus === 'pendentes'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60'
              }`}
            >
              <Clock size={12} />
              <span>Pendentes</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-900/20">
                {qtdPendentes}
              </span>
            </button>

            <button
              type="button"
              id="filtro-finalizados"
              onClick={() => setFiltroStatus('finalizados')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                filtroStatus === 'finalizados'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60'
              }`}
            >
              <CheckCircle2 size={12} />
              <span>Pagamento Finalizado</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-900/20">
                {qtdFinalizados}
              </span>
            </button>
          </div>
        </div>

        {/* Content View: CARDS vs LISTA */}
        {dadosFiltrados.length === 0 ? (
          <div className="py-12 text-center text-stone-400 text-xs space-y-2">
            <p className="font-semibold text-stone-600">Nenhum colaborador encontrado.</p>
            {(busca || filtroStatus !== 'todos') && (
              <button
                type="button"
                onClick={() => {
                  setBusca('');
                  setFiltroStatus('todos');
                }}
                className="text-amber-800 underline font-bold cursor-pointer text-[11px]"
              >
                Limpar filtros de busca
              </button>
            )}
          </div>
        ) : modoVisualizacao === 'cards' ? (
          /* ============================================================ */
          /* CARDS VIEW: Grid de cards ricos com todas as informações     */
          /* ============================================================ */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
            {dadosFiltrados.map(({ colab, previsto, pago, pendente, qtdLancamentos }) => {
              const quitado = previsto > 0 && pendente <= 0.01;
              const semLancamentos = qtdLancamentos === 0;
              const pct = previsto > 0 ? Math.min(100, Math.round((pago / previsto) * 100)) : 0;

              return (
                <div
                  key={colab.id}
                  onClick={() => onSelectColab(colab.id)}
                  className="bg-stone-50/70 hover:bg-white rounded-2xl p-4 border border-stone-200 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                >
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 ${
                      semLancamentos
                        ? 'bg-stone-300'
                        : quitado
                        ? 'bg-emerald-500'
                        : 'bg-amber-500'
                    }`}
                  />

                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-700 to-stone-800 text-amber-100 font-bold flex items-center justify-center text-sm shadow-xs flex-shrink-0">
                          {colab.nome.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-stone-900 group-hover:text-amber-900 transition-colors truncate">
                            {colab.nome}
                          </h4>
                          <span className="text-xs text-stone-500 truncate block">
                            {colab.setor || 'Equipe'}
                          </span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="flex-shrink-0">
                        {semLancamentos ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-500 border border-stone-200">
                            Sem lançamentos
                          </span>
                        ) : quitado ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shadow-2xs">
                            <CheckCircle2 size={11} className="text-emerald-600" />
                            <span>Pagamento Finalizado</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shadow-2xs">
                            <Clock size={11} className="text-amber-600" />
                            <span>Pendente</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress indicator */}
                    {!semLancamentos && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-[11px] mb-1 font-semibold">
                          <span className="text-stone-500">Progresso</span>
                          <span
                            className={
                              quitado ? 'text-emerald-700 font-bold' : 'text-amber-800 font-bold'
                            }
                          >
                            {pct}% liquidado
                          </span>
                        </div>
                        <div className="w-full bg-stone-200/70 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              quitado ? 'bg-emerald-600' : 'bg-amber-600'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Values Box */}
                    <div className="grid grid-cols-2 gap-2 bg-white rounded-xl p-3 border border-stone-200/80 text-xs shadow-2xs">
                      <div>
                        <span className="text-stone-400 block text-[10px] font-bold uppercase tracking-wider">
                          A Receber
                        </span>
                        <span className="font-bold text-stone-800 text-sm">
                          {formatarMoeda(previsto)}
                        </span>
                        <span className="text-[10px] text-emerald-700 block font-medium mt-0.5">
                          Pago: {formatarMoeda(pago)}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[10px] font-bold uppercase tracking-wider">
                          Falta Pagar
                        </span>
                        <span
                          className={`font-black text-sm block ${
                            pendente > 0 ? 'text-red-600' : 'text-stone-400'
                          }`}
                        >
                          {pendente > 0 ? formatarMoeda(pendente) : 'R$ 0,00'}
                        </span>
                        <span className="text-[10px] text-stone-400 block mt-0.5">
                          {qtdLancamentos} lançamento(s)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-3 pt-2.5 border-t border-stone-200/60 flex items-center justify-between text-xs text-amber-800 font-bold">
                    <span>Ver extrato detalhado</span>
                    <ChevronRight
                      size={15}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ============================================================ */
          /* LISTA VIEW: Tabela tabular organizada para visão geral       */
          /* ============================================================ */
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 text-stone-400 font-bold uppercase text-[10px] tracking-wider bg-stone-50/70">
                  <th className="py-3 px-3.5 rounded-l-xl">Colaborador</th>
                  <th className="py-3 px-3">Cargo / Setor</th>
                  <th className="py-3 px-3 text-right">A Receber</th>
                  <th className="py-3 px-3 text-right">Já Pago</th>
                  <th className="py-3 px-3 text-right">Falta Pagar</th>
                  <th className="py-3 px-3.5 text-center">Status</th>
                  <th className="py-3 px-3 rounded-r-xl text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {dadosFiltrados.map(({ colab, previsto, pago, pendente, qtdLancamentos }) => {
                  const quitado = previsto > 0 && pendente <= 0.01;
                  const semLancamentos = qtdLancamentos === 0;

                  return (
                    <tr
                      key={colab.id}
                      onClick={() => onSelectColab(colab.id)}
                      className="hover:bg-amber-50/60 transition-colors cursor-pointer group"
                    >
                      {/* Colaborador */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-700 to-stone-800 text-amber-100 font-bold flex items-center justify-center text-xs shadow-xs flex-shrink-0">
                            {colab.nome.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-stone-900 group-hover:text-amber-900 transition-colors block text-xs">
                              {colab.nome}
                            </span>
                            <span className="text-[10px] text-stone-400 sm:hidden">
                              {colab.setor || 'Equipe'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Cargo / Setor */}
                      <td className="py-3 px-3 text-stone-600 font-medium">
                        {colab.setor || 'Equipe'}
                      </td>

                      {/* A Receber */}
                      <td className="py-3 px-3 text-right font-semibold text-stone-800">
                        {formatarMoeda(previsto)}
                      </td>

                      {/* Já Pago */}
                      <td className="py-3 px-3 text-right font-semibold text-emerald-700">
                        {formatarMoeda(pago)}
                      </td>

                      {/* Falta Pagar */}
                      <td className="py-3 px-3 text-right">
                        <span
                          className={`font-black ${
                            pendente > 0 ? 'text-red-600' : 'text-stone-400'
                          }`}
                        >
                          {pendente > 0 ? formatarMoeda(pendente) : 'R$ 0,00'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3.5 text-center">
                        {semLancamentos ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-500 border border-stone-200">
                            Sem lançamentos
                          </span>
                        ) : quitado ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                            <CheckCircle2 size={12} className="text-emerald-600" />
                            <span>Pagamento Finalizado</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                            <Clock size={12} className="text-amber-600" />
                            <span>Pendente ({formatarMoeda(pendente)})</span>
                          </span>
                        )}
                      </td>

                      {/* Ação */}
                      <td className="py-3 px-3 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 group-hover:text-amber-950">
                          <span className="hidden sm:inline">Abrir</span>
                          <ChevronRight
                            size={14}
                            className="group-hover:translate-x-0.5 transition-transform"
                          />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
