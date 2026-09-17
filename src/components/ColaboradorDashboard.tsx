import React, { useState } from 'react';
import {
  ArrowLeft,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Calendar,
  Trash2,
  Receipt,
  FileText,
  CreditCard,
  History,
  RotateCcw,
} from 'lucide-react';
import type { Colaborador, ReceitaLancamento, CategoriaFinanceira } from '../types';
import { formatarMoeda, getMesRefTexto } from '../utils/format';
import { ModalConfirmacao } from './ModalConfirmacao';

interface ColaboradorDashboardProps {
  colaborador: Colaborador;
  receitas: ReceitaLancamento[];
  categoriaAtiva: CategoriaFinanceira;
  dataVisao: Date;
  onVoltarGlobal: () => void;
  onAddReceita: (rec: Omit<ReceitaLancamento, 'id'>) => Promise<void>;
  onDeleteReceita: (id: string) => Promise<void>;
  onOpenModalPagamento: (receita: ReceitaLancamento) => void;
  onDeletePagamentoParcial: (receitaId: string, index: number, valor: number) => Promise<void>;
  onResetarTodasAsBaixas: (receitaId: string) => Promise<void>;
}

type ConfirmState =
  | {
      tipo: 'excluir_lancamento';
      receitaId: string;
      titulo: string;
      valor: number;
    }
  | {
      tipo: 'excluir_baixa_individual';
      receitaId: string;
      index: number;
      valor: number;
      data: string;
    }
  | {
      tipo: 'resetar_todas_baixas';
      receitaId: string;
      titulo: string;
      totalBaixado: number;
      qtdBaixas: number;
    }
  | null;

export const ColaboradorDashboard: React.FC<ColaboradorDashboardProps> = ({
  colaborador,
  receitas,
  categoriaAtiva,
  dataVisao,
  onVoltarGlobal,
  onAddReceita,
  onDeleteReceita,
  onOpenModalPagamento,
  onDeletePagamentoParcial,
  onResetarTodasAsBaixas,
}) => {
  const [titulo, setTitulo] = useState('');
  const [valor, setValor] = useState('');
  const [obs, setObs] = useState('');
  const [loading, setLoading] = useState(false);
  const [formErro, setFormErro] = useState('');
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);

  const mes = dataVisao.getMonth();
  const ano = dataVisao.getFullYear();

  // Filter recipes for this collaborator + current category + current month
  const lancamentos = receitas
    .filter((r) => {
      const d = new Date(r.dataRef || r.dataCriacao || '');
      if (isNaN(d.getTime())) return false;

      const isColab = r.colabId === colaborador.id || r.utilizadorId === colaborador.id;
      const isMes = d.getMonth() === mes && d.getFullYear() === ano;
      const cat = r.categoria || 'Café';
      const isCat = cat === categoriaAtiva;

      return isColab && isMes && isCat;
    })
    .sort((a, b) => (b.dataRef || b.dataCriacao || '').localeCompare(a.dataRef || a.dataCriacao || ''));

  // KPI calculations
  let totalPrevisto = 0;
  let totalPago = 0;

  lancamentos.forEach((r) => {
    const arrayPgs = r.pagamentos || r.historicoPagamentos || [];
    const somaPgs = arrayPgs.reduce((acc, p) => acc + (p.valor || 0), 0);
    totalPrevisto += r.valorTotal;
    totalPago += somaPgs;
  });

  const saldoRestante = totalPrevisto - totalPago;

  const handleCadastrarEntrada = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErro('');
    const parsedVal = parseFloat(valor.replace(',', '.'));
    if (!titulo.trim() || isNaN(parsedVal) || parsedVal <= 0) {
      setFormErro('Por favor preencha um título e um valor maior que zero.');
      return;
    }

    setLoading(true);
    try {
      const dataCriacao = new Date(dataVisao.getFullYear(), dataVisao.getMonth(), 10).toISOString();

      await onAddReceita({
        colabId: colaborador.id,
        titulo: titulo.trim(),
        categoria: categoriaAtiva,
        valorTotal: parsedVal,
        observacoes: obs.trim(),
        dataRef: dataCriacao,
        pagamentos: [],
      });

      setTitulo('');
      setValor('');
      setObs('');
      setFormErro('');
    } catch (err) {
      console.error(err);
      setFormErro('Erro ao registrar lançamento.');
    } finally {
      setLoading(false);
    }
  };

  const handleExcluirLancamento = (id: string, tit: string, valorTotal: number) => {
    setConfirmState({
      tipo: 'excluir_lancamento',
      receitaId: id,
      titulo: tit,
      valor: valorTotal,
    });
  };

  const handleExcluirPg = (receitaId: string, index: number, valorPg: number, dataPg: string) => {
    setConfirmState({
      tipo: 'excluir_baixa_individual',
      receitaId,
      index,
      valor: valorPg,
      data: dataPg,
    });
  };

  const handleResetarBaixas = (
    receitaId: string,
    tituloRec: string,
    totalPagoRec: number,
    qtd: number
  ) => {
    setConfirmState({
      tipo: 'resetar_todas_baixas',
      receitaId,
      titulo: tituloRec,
      totalBaixado: totalPagoRec,
      qtdBaixas: qtd,
    });
  };

  return (
    <div id="dashboard-content" className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header with Back Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onVoltarGlobal}
            className="p-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Voltar</span>
          </button>

          <div>
            <h2
              id="view-title"
              className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2"
            >
              <span>{colaborador.nome}</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900">
                {colaborador.turno === 'Hamburgueria' ? '🍔' : '☕'} {colaborador.setor || 'Equipe'}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-stone-200 text-stone-700">
                Turno {colaborador.turno || 'Café'}
              </span>
            </h2>
            <div className="flex items-center gap-3 text-xs text-stone-500 mt-0.5">
              <span>Painel de Lançamentos: <strong>{categoriaAtiva}</strong></span>
              {colaborador.chavePix && (
                <span className="text-stone-400">
                  • PIX: <span className="font-mono text-stone-600">{colaborador.chavePix}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-600" />
          <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Total Previsto</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
              <DollarSign size={16} />
            </div>
          </div>
          <p id="sum-total" className="text-2xl sm:text-3xl font-black text-amber-900">
            {formatarMoeda(totalPrevisto)}
          </p>
          <span className="text-[11px] text-stone-400 mt-1 block">
            {lancamentos.length} lançamento(s) na categoria
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-600" />
          <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Total Já Recebido / Pago</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <p id="sum-rec" className="text-2xl sm:text-3xl font-black text-emerald-700">
            {formatarMoeda(totalPago)}
          </p>
          <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
            Repassado ao colaborador
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm relative overflow-hidden">
          <div
            className={`absolute top-0 left-0 right-0 h-1 ${
              saldoRestante > 0 ? 'bg-red-500' : 'bg-stone-300'
            }`}
          />
          <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Saldo Restante a Pagar</span>
            <div
              className={`p-2 rounded-lg ${
                saldoRestante > 0 ? 'bg-red-50 text-red-700' : 'bg-stone-100 text-stone-500'
              }`}
            >
              <AlertCircle size={16} />
            </div>
          </div>
          <p
            id="sum-rest"
            className={`text-2xl sm:text-3xl font-black ${
              saldoRestante > 0 ? 'text-red-600' : 'text-stone-500'
            }`}
          >
            {formatarMoeda(saldoRestante)}
          </p>
          <span className="text-[11px] text-stone-400 mt-1 block">
            {saldoRestante <= 0 ? 'Totalmente quitado' : 'Aguardando liquidação'}
          </span>
        </div>
      </div>

      {/* FORM: Nova Entrada de Valor */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs">
        <div
          id="titulo-nova-entrada"
          className="text-xs font-bold uppercase tracking-wider text-stone-600 mb-4 flex items-center justify-between"
        >
          <span className="flex items-center gap-1.5 text-stone-900">
            <PlusCircle size={16} className="text-amber-700" />
            Nova Entrada de Valor • {categoriaAtiva}
          </span>
          <span className="text-stone-400 font-normal text-[11px]">
            Competência contábil: {getMesRefTexto(dataVisao)}
          </span>
        </div>

        <form id="form-receita" onSubmit={handleCadastrarEntrada} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Título do Lançamento
              </label>
              <input
                id="rec-title"
                type="text"
                placeholder={
                  categoriaAtiva === 'Café'
                    ? 'Ex: Salário Turno Café Manhã'
                    : 'Ex: Salário Turno Hamburgueria Noite'
                }
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-stone-50 text-stone-900 text-sm focus:bg-white focus:border-amber-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Valor Total (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-sm">
                  R$
                </span>
                <input
                  id="rec-val"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0,00"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 bg-stone-50 text-stone-900 text-sm font-bold focus:bg-white focus:border-amber-600 outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Observações Adicionais (opcional)
            </label>
            <textarea
              id="rec-obs"
              rows={2}
              placeholder="Ex: Turno de abertura, desconto de vale transporte aplicado, etc."
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-300 bg-stone-50 text-stone-800 text-xs focus:bg-white focus:border-amber-600 outline-none resize-none"
            />
          </div>

          {formErro && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
              {formErro}
            </div>
          )}

          <button
            id="btn-submit-lancamento"
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white font-bold text-xs shadow-md shadow-amber-900/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <PlusCircle size={15} />
            <span>
              {loading ? 'Gravando...' : `Registrar ${categoriaAtiva} no Mês Atual`}
            </span>
          </button>
        </form>
      </div>

      {/* SECTION: Relatório Detalhado de Lançamentos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-2">
            <Receipt size={15} className="text-amber-700" />
            Lançamentos de {categoriaAtiva} no Mês
          </h3>
          <span className="text-xs text-stone-500 font-medium">
            {lancamentos.length} registro(s)
          </span>
        </div>

        <div id="list-receitas" className="space-y-4">
          {lancamentos.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 border border-stone-200 text-center text-stone-400 space-y-2">
              <History size={36} className="mx-auto text-stone-300 stroke-1" />
              <p className="text-sm font-semibold text-stone-600">
                Nenhum lançamento de {categoriaAtiva} para {colaborador.nome} neste mês.
              </p>
              <p className="text-xs text-stone-400">
                Use o formulário acima para adicionar um novo registro financeiro.
              </p>
            </div>
          ) : (
            lancamentos.map((r) => {
              const arrayPgs = r.pagamentos || r.historicoPagamentos || [];
              const somaPgs = arrayPgs.reduce((acc, p) => acc + (p.valor || 0), 0);
              const restante = r.valorTotal - somaPgs;
              const quitado = restante <= 0.01;

              return (
                <div
                  key={r.id}
                  className="card receita-item bg-white rounded-2xl p-5 border border-stone-200 shadow-xs border-l-6 border-l-amber-600 transition-all hover:shadow-md"
                >
                  {/* Top line: Title & Total Value */}
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-extrabold text-base text-stone-900">{r.titulo}</h4>
                      <span className="text-[11px] text-stone-400 font-medium">
                        Categoria: {r.categoria}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-lg sm:text-xl font-black text-amber-900 block leading-tight">
                        {formatarMoeda(r.valorTotal)}
                      </span>
                      {quitado ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          <CheckCircle2 size={12} /> Quitado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md">
                          <AlertCircle size={12} /> Pendente
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Balance Sub-line */}
                  <div className="flex flex-wrap items-center gap-4 text-xs font-semibold py-2 px-3 bg-stone-50 rounded-xl mb-3">
                    <span className="text-stone-600">
                      Já Baixado: <strong className="text-emerald-700">{formatarMoeda(somaPgs)}</strong>
                    </span>
                    <span className="text-stone-300">|</span>
                    <span className="text-stone-600">
                      Restante a Pagar:{' '}
                      <strong className={quitado ? 'text-stone-400' : 'text-red-600'}>
                        {formatarMoeda(restante)}
                      </strong>
                    </span>
                  </div>

                  {/* Notes if any */}
                  {r.observacoes && (
                    <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-xl text-xs text-stone-700 mb-3">
                      <strong className="text-amber-950 font-bold">Obs: </strong>
                      {r.observacoes}
                    </div>
                  )}

                  {/* Partial Payments History */}
                  {arrayPgs.length > 0 && (
                    <div className="historico-pagamentos bg-stone-50/80 rounded-xl p-3.5 border border-stone-200/90 mb-3 space-y-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-amber-900 flex flex-wrap items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5">
                          <History size={13} className="text-amber-700" />
                          <span>Histórico de Pagamentos Baixados ({arrayPgs.length})</span>
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleResetarBaixas(
                              r.id,
                              r.titulo,
                              somaPgs,
                              arrayPgs.length
                            )
                          }
                          title="Zerar e estornar todas as baixas deste lançamento"
                          className="text-[11px] text-amber-900 hover:text-red-700 bg-amber-100/80 hover:bg-red-50 px-2 py-1 rounded-lg border border-amber-300/80 transition-colors font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw size={11} />
                          <span>Zerar Todas as Baixas ({formatarMoeda(somaPgs)})</span>
                        </button>
                      </div>

                      <div className="divide-y divide-stone-200">
                        {arrayPgs.map((p, idx) => (
                          <div
                            key={idx}
                            className="pagamento-linha py-2 flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="flex-1 min-w-0 pr-2">
                              <div className="flex items-center gap-3 font-semibold">
                                <span className="text-stone-500 text-[11px] flex items-center gap-1">
                                  <Calendar size={12} /> {p.data}
                                </span>
                                <span className="text-emerald-700 font-bold">
                                  + {formatarMoeda(p.valor)}
                                </span>
                              </div>
                              <p className="text-[11px] text-stone-600 italic mt-0.5 truncate bg-white/70 px-2 py-0.5 rounded border-l-2 border-l-amber-600">
                                {p.obs || p.observacao || 'Sem anotação adicional.'}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                handleExcluirPg(r.id, idx, p.valor, p.data)
                              }
                              title="Apagar este pagamento individual e recalcular saldo"
                              className="btn-excluir-pg p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer flex-shrink-0"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onOpenModalPagamento(r)}
                      className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <CreditCard size={14} />
                      <span>{quitado ? 'Adicionar Outro Pagamento' : 'Baixar Valor'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleExcluirLancamento(r.id, r.titulo, r.valorTotal)}
                      className="py-2 px-3 rounded-xl border border-red-200 hover:bg-red-50 text-red-700 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 size={14} />
                      <span>Excluir Lançamento</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ModalConfirmacao
        isOpen={!!confirmState}
        onClose={() => setConfirmState(null)}
        onConfirm={async () => {
          if (!confirmState) return;
          if (confirmState.tipo === 'excluir_lancamento') {
            await onDeleteReceita(confirmState.receitaId);
          } else if (confirmState.tipo === 'excluir_baixa_individual') {
            await onDeletePagamentoParcial(
              confirmState.receitaId,
              confirmState.index,
              confirmState.valor
            );
          } else if (confirmState.tipo === 'resetar_todas_baixas') {
            await onResetarTodasAsBaixas(confirmState.receitaId);
          }
          setConfirmState(null);
        }}
        titulo={
          confirmState?.tipo === 'excluir_lancamento'
            ? 'Excluir Lançamento Completo'
            : confirmState?.tipo === 'excluir_baixa_individual'
            ? 'Excluir Baixa Parcial'
            : 'Zerar / Estornar Todas as Baixas'
        }
        descricao={
          confirmState?.tipo === 'excluir_lancamento'
            ? `Deseja apagar permanentemente o salário/lançamento "${confirmState.titulo}" e todo o seu histórico de pagamentos?`
            : confirmState?.tipo === 'excluir_baixa_individual'
            ? `Deseja apagar a baixa de ${formatarMoeda(
                confirmState.valor
              )} realizada em ${confirmState.data}? O saldo restante voltará a constar como pendente.`
            : `Tem certeza que deseja estornar e apagar todas as ${
                confirmState?.qtdBaixas
              } baixas que somam ${formatarMoeda(
                confirmState?.totalBaixado || 0
              )} do lançamento "${confirmState?.titulo}"? O valor total voltará a ficar 100% pendente.`
        }
        detalhe={
          confirmState?.tipo === 'excluir_lancamento'
            ? `Valor total: ${formatarMoeda(confirmState.valor)}`
            : confirmState?.tipo === 'excluir_baixa_individual'
            ? `Baixa: ${formatarMoeda(confirmState.valor)} (${confirmState.data})`
            : `Total estornado: ${formatarMoeda(confirmState?.totalBaixado || 0)}`
        }
        textoConfirmar={
          confirmState?.tipo === 'excluir_lancamento'
            ? 'Sim, Excluir Lançamento'
            : confirmState?.tipo === 'excluir_baixa_individual'
            ? 'Sim, Excluir Baixa'
            : 'Sim, Zerar Todas as Baixas'
        }
        textoCancelar="Cancelar"
        variante={confirmState?.tipo === 'resetar_todas_baixas' ? 'warning' : 'danger'}
      />
    </div>
  );
};
