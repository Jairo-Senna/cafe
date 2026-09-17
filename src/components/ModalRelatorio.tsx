import React, { useState, useMemo } from 'react';
import { X, Copy, Download, Check, Sparkles, Filter, Calendar } from 'lucide-react';
import type { Colaborador, ReceitaLancamento, CategoriaFinanceira } from '../types';
import { formatarMoeda, normalizarTexto } from '../utils/format';

interface ModalRelatorioProps {
  isOpen: boolean;
  onClose: () => void;
  colaboradores: Colaborador[];
  receitas: ReceitaLancamento[];
  nomeCafeteria: string;
  dataVisao: Date;
}

const TODAS_CATEGORIAS: CategoriaFinanceira[] = ['Café', 'Hamburgueria'];

export const ModalRelatorio: React.FC<ModalRelatorioProps> = ({
  isOpen,
  onClose,
  colaboradores,
  receitas,
  nomeCafeteria,
  dataVisao,
}) => {
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<CategoriaFinanceira[]>([
    'Café',
    'Hamburgueria',
  ]);

  const [mesAnoString, setMesAnoString] = useState<string>(() => {
    const y = dataVisao.getFullYear();
    const m = (dataVisao.getMonth() + 1).toString().padStart(2, '0');
    return `${y}-${m}`;
  });

  const [ordem, setOrdem] = useState<'decrescente' | 'crescente' | 'alfabetica'>('decrescente');
  const [copiado, setCopiado] = useState<boolean>(false);

  // Toggle single category
  const toggleCategoria = (cat: CategoriaFinanceira) => {
    if (categoriasSelecionadas.includes(cat)) {
      if (categoriasSelecionadas.length === 1) {
        alert('Selecione ao menos uma categoria para o relatório.');
        return;
      }
      setCategoriasSelecionadas(categoriasSelecionadas.filter((c) => c !== cat));
    } else {
      setCategoriasSelecionadas([...categoriasSelecionadas, cat]);
    }
  };

  const selecionarTodas = () => {
    setCategoriasSelecionadas([...TODAS_CATEGORIAS]);
  };

  // Process data for the report
  const relatorioData = useMemo(() => {
    if (!mesAnoString) {
      return {
        texto: 'Selecione um mês válido.',
        totalGeral: 0,
        recebidoGeral: 0,
        pendenteGeral: 0,
        colaboradoresRelatorio: [],
      };
    }

    const [anoStr, mesStr] = mesAnoString.split('-');
    const ano = parseInt(anoStr, 10);
    const mes = parseInt(mesStr, 10) - 1;

    // Filter recipes for this month + selected categories + active collaborators
    const recsDoMes = receitas.filter((r) => {
      const d = new Date(r.dataRef || r.dataCriacao || '');
      if (isNaN(d.getTime())) return false;

      const isMes = d.getMonth() === mes && d.getFullYear() === ano;
      const cat = r.categoria || 'Café';
      const isCat = categoriasSelecionadas.includes(cat);

      // Verify colab exists
      const idColab = r.colabId || r.utilizadorId;
      const isAtivo = colaboradores.some((c) => c.id === idColab);

      return isMes && isCat && isAtivo;
    });

    let totalGeral = 0;
    let recebidoGeral = 0;

    interface DadosColab {
      id: string;
      nome: string;
      setor: string;
      turno: string;
      chavePix?: string;
      totalPrevisto: number;
      totalPago: number;
      pendenteTotal: number;
      detalheCategoria: Record<string, { previsto: number; pago: number; pendente: number }>;
    }

    const mapColab: Record<string, DadosColab> = {};

    recsDoMes.forEach((r) => {
      const somaPg = (r.pagamentos || []).reduce((acc, p) => acc + (p.valor || 0), 0);
      totalGeral += r.valorTotal;
      recebidoGeral += somaPg;

      const idColab = r.colabId || r.utilizadorId || 'sem-id';
      if (!mapColab[idColab]) {
        const c = colaboradores.find((u) => u.id === idColab);
        const t = c?.turno || (r.categoria === 'Hamburgueria' ? 'Hamburgueria' : 'Café');
        mapColab[idColab] = {
          id: idColab,
          nome: c ? c.nome.toUpperCase() : 'COLABORADOR',
          setor: c?.setor || 'Equipe',
          turno: t,
          chavePix: c?.chavePix,
          totalPrevisto: 0,
          totalPago: 0,
          pendenteTotal: 0,
          detalheCategoria: {},
        };
      }

      const pendente = r.valorTotal - somaPg;
      mapColab[idColab].totalPrevisto += r.valorTotal;
      mapColab[idColab].totalPago += somaPg;
      mapColab[idColab].pendenteTotal += pendente;

      const cat = r.categoria || 'Café';
      if (!mapColab[idColab].detalheCategoria[cat]) {
        mapColab[idColab].detalheCategoria[cat] = { previsto: 0, pago: 0, pendente: 0 };
      }
      mapColab[idColab].detalheCategoria[cat].previsto += r.valorTotal;
      mapColab[idColab].detalheCategoria[cat].pago += somaPg;
      mapColab[idColab].detalheCategoria[cat].pendente += pendente;
    });

    let lista = Object.values(mapColab);

    if (ordem === 'crescente') {
      lista.sort((a, b) => a.pendenteTotal - b.pendenteTotal);
    } else if (ordem === 'decrescente') {
      lista.sort((a, b) => b.pendenteTotal - a.pendenteTotal);
    } else {
      lista.sort((a, b) =>
        normalizarTexto(a.nome).localeCompare(normalizarTexto(b.nome), 'pt-BR')
      );
    }

    const dtRef = new Date(ano, mes, 10);
    const nomeMesAno = dtRef
      .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      .toUpperCase();

    // Construction of WhatsApp message
    let texto = `☕ *FECHAMENTO DE FOLHA & REPASSES - ${nomeCafeteria.toUpperCase()}*\n`;
    texto += `📅 *Competência:* ${nomeMesAno}\n`;
    texto += `🏷️ *Categorias Incluídas:* ${categoriasSelecionadas.join(', ')}\n\n`;
    texto += `━━━━━━━━━━━━━━━━━━━━━\n`;
    texto += `📊 *RESUMO GERAL DA CAFETERIA*\n`;
    texto += `• Total Previsto: ${formatarMoeda(totalGeral)}\n`;
    texto += `• Total Já Pago: ${formatarMoeda(recebidoGeral)}\n`;
    texto += `• Saldo Restante a Pagar: *${formatarMoeda(totalGeral - recebidoGeral)}*\n`;
    texto += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    texto += `👥 *DETALHAMENTO POR COLABORADOR:*\n\n`;

    if (lista.length === 0) {
      texto += `Nenhum lançamento registrado para as categorias e mês selecionados.\n`;
    } else {
      lista.forEach((item) => {
        const turnoIcon = item.turno === 'Hamburgueria' ? '🍔' : '☕';
        const turnoDesc = `${turnoIcon} Turno ${item.turno}`;
        if (item.pendenteTotal <= 0.01) {
          texto += `✅ *${item.nome}* (${item.setor} • ${turnoDesc}): Quitado integralmente\n`;
          texto += `   ↳ Total pago no período: ${formatarMoeda(item.totalPago)}\n\n`;
        } else {
          texto += `⏳ *${item.nome}* (${item.setor} • ${turnoDesc}): Pendente *${formatarMoeda(
            item.pendenteTotal
          )}*\n`;
          texto += `   ↳ Previsto: ${formatarMoeda(item.totalPrevisto)} | Pago: ${formatarMoeda(
            item.totalPago
          )}\n`;

          const detalhes: string[] = [];
          for (const [catName, catVal] of Object.entries(item.detalheCategoria)) {
            if (catVal.pendente > 0.01) {
              detalhes.push(`${catName}: ${formatarMoeda(catVal.pendente)}`);
            }
          }
          if (detalhes.length > 0) {
            texto += `   ↳ _Pendência por item: ${detalhes.join(' | ')}_\n`;
          }
          if (item.chavePix) {
            texto += `   ↳ _PIX: ${item.chavePix}_\n`;
          }
          texto += `\n`;
        }
      });
    }

    texto += `_Gerado pelo sistema financeiro ${nomeCafeteria} em ${new Date().toLocaleDateString(
      'pt-BR'
    )}_`;

    return {
      texto,
      totalGeral,
      recebidoGeral,
      pendenteGeral: totalGeral - recebidoGeral,
      colaboradoresRelatorio: lista,
    };
  }, [mesAnoString, categoriasSelecionadas, ordem, receitas, colaboradores, nomeCafeteria]);

  if (!isOpen) return null;

  const copiarRelatorio = async () => {
    try {
      await navigator.clipboard.writeText(relatorioData.texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    } catch {
      alert('Não foi possível copiar automaticamente. Selecione o texto abaixo e copie manualmente.');
    }
  };

  const exportarCSV = () => {
    const cabecalho = ['Colaborador', 'Setor', 'Total Previsto', 'Total Pago', 'Saldo Pendente', 'Chave PIX'];
    const linhas = relatorioData.colaboradoresRelatorio.map((c) => [
      `"${c.nome}"`,
      `"${c.setor}"`,
      c.totalPrevisto.toFixed(2),
      c.totalPago.toFixed(2),
      c.pendenteTotal.toFixed(2),
      `"${c.chavePix || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [cabecalho.join(';'), ...linhas.map((e) => e.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio-financeiro-cafeteria-${mesAnoString}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      id="modal-relatorio-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="modal-relatorio-card"
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 px-6 py-4 flex items-center justify-between text-white flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-300 rounded-lg">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-amber-100">Relatório Inteligente da Cafeteria</h3>
              <p className="text-xs text-stone-300">
                Formatação automática pronta para envio via WhatsApp ou exportação CSV
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body / Controls */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-stone-800">
          {/* Categories Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                <Filter size={14} className="text-amber-600" />
                Categorias no Relatório
              </label>
              <button
                type="button"
                onClick={selecionarTodas}
                className="text-xs text-amber-700 hover:text-amber-900 font-semibold underline cursor-pointer"
              >
                Marcar Todas
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TODAS_CATEGORIAS.map((cat) => {
                const ativo = categoriasSelecionadas.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategoria(cat)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between border transition-all text-left cursor-pointer ${
                      ativo
                        ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-xs'
                        : 'bg-stone-50 border-stone-200 text-stone-500 hover:border-stone-300'
                    }`}
                  >
                    <span>{cat}</span>
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                        ativo ? 'bg-amber-600 text-white' : 'bg-stone-200 text-stone-400'
                      }`}
                    >
                      {ativo ? '✓' : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Month & Ordering Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1 flex items-center gap-1.5">
                <Calendar size={14} className="text-amber-600" />
                Mês de Referência
              </label>
              <input
                type="month"
                value={mesAnoString}
                onChange={(e) => setMesAnoString(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-300 bg-stone-50 text-stone-900 text-sm font-medium focus:bg-white focus:border-amber-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                Critério de Ordenação
              </label>
              <select
                value={ordem}
                onChange={(e) => setOrdem(e.target.value as any)}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-300 bg-stone-50 text-stone-900 text-sm font-medium focus:bg-white focus:border-amber-600 outline-none cursor-pointer"
              >
                <option value="decrescente">Maior Valor Pendente</option>
                <option value="crescente">Menor Valor Pendente</option>
                <option value="alfabetica">Ordem Alfabética</option>
              </select>
            </div>
          </div>

          {/* Textarea Preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
                Pré-visualização da Mensagem:
              </span>
              <span className="text-xs text-stone-500">
                Pendente total:{' '}
                <strong className="text-amber-800 font-bold">
                  {formatarMoeda(relatorioData.pendenteGeral)}
                </strong>
              </span>
            </div>
            <textarea
              id="texto-relatorio-whatsapp"
              readOnly
              rows={10}
              value={relatorioData.texto}
              className="w-full p-4 rounded-xl border border-stone-300 bg-stone-900 text-amber-100 font-mono text-xs leading-relaxed outline-none shadow-inner resize-none select-all"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-stone-50 px-6 py-4 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={exportarCSV}
            className="py-2 px-3.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download size={14} />
            Exportar Planilha (CSV)
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              Fechar
            </button>
            <button
              id="btn-copiar-whatsapp"
              type="button"
              onClick={copiarRelatorio}
              className={`py-2 px-5 rounded-xl text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer ${
                copiado
                  ? 'bg-emerald-700 ring-2 ring-emerald-500'
                  : 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-emerald-700/20'
              }`}
            >
              {copiado ? (
                <>
                  <Check size={16} /> Copiado com Sucesso!
                </>
              ) : (
                <>
                  <Copy size={16} /> Copiar p/ WhatsApp
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
