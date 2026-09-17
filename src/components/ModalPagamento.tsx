import React, { useState } from 'react';
import { X, CheckCircle2, DollarSign, FileText } from 'lucide-react';
import { formatarMoeda, getDataHojePtBr } from '../utils/format';

interface ModalPagamentoProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (valor: number, obs: string) => Promise<void>;
  tituloLancamento: string;
  valorTotal: number;
  valorJaPago: number;
}

export const ModalPagamento: React.FC<ModalPagamentoProps> = ({
  isOpen,
  onClose,
  onConfirm,
  tituloLancamento,
  valorTotal,
  valorJaPago,
}) => {
  const [valor, setValor] = useState<string>('');
  const [obs, setObs] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [erro, setErro] = useState<string>('');

  if (!isOpen) return null;

  const saldoPendente = Math.max(0, valorTotal - valorJaPago);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    const parsed = parseFloat(valor.replace(',', '.'));
    if (isNaN(parsed) || parsed <= 0) {
      setErro('Por favor informe um valor válido maior que zero.');
      return;
    }
    setLoading(true);
    try {
      await onConfirm(parsed, obs.trim() || `Pago em ${getDataHojePtBr()}`);
      setValor('');
      setObs('');
      setErro('');
      onClose();
    } catch (err) {
      console.error(err);
      setErro('Erro ao registrar pagamento.');
    } finally {
      setLoading(false);
    }
  };

  const preencherSaldoTotal = () => {
    setValor(saldoPendente.toFixed(2));
  };

  const preencherMetade = () => {
    setValor((saldoPendente / 2).toFixed(2));
  };

  return (
    <div
      id="modal-pagamento-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="modal-pagamento-card"
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-amber-900/10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <DollarSign size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-amber-50">Dar Baixa / Registrar Pagamento</h3>
              <p className="text-xs text-stone-300 truncate max-w-[260px]">{tituloLancamento}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Balance Status */}
        <div className="bg-amber-50/70 border-b border-amber-100/80 px-6 py-3 flex items-center justify-between text-xs">
          <div>
            <span className="text-stone-500">Valor Total:</span>{' '}
            <strong className="text-stone-800">{formatarMoeda(valorTotal)}</strong>
          </div>
          <div>
            <span className="text-stone-500">Já Baixado:</span>{' '}
            <strong className="text-emerald-700">{formatarMoeda(valorJaPago)}</strong>
          </div>
          <div>
            <span className="text-stone-500">Restante:</span>{' '}
            <strong className="text-amber-800 font-bold">{formatarMoeda(saldoPendente)}</strong>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Valor a Pagar (R$)
              </label>
              {saldoPendente > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={preencherMetade}
                    className="text-[11px] text-amber-700 hover:text-amber-900 font-medium underline cursor-pointer"
                  >
                    50% ({formatarMoeda(saldoPendente / 2)})
                  </button>
                  <span className="text-stone-300">|</span>
                  <button
                    type="button"
                    onClick={preencherSaldoTotal}
                    className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
                  >
                    Total ({formatarMoeda(saldoPendente)})
                  </button>
                </div>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-sm">
                R$
              </span>
              <input
                id="input-modal-valor"
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0,00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                autoFocus
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 bg-stone-50 text-stone-900 text-lg font-bold focus:bg-white focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              Observação / Comprovante
            </label>
            <div className="relative">
              <textarea
                id="input-modal-obs"
                rows={3}
                placeholder="Ex: Pago via PIX Banco Inter, adiantamento no caixa, etc."
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-stone-50 text-stone-800 text-sm focus:bg-white focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all resize-none"
              />
            </div>
            <p className="text-[11px] text-stone-400 mt-1">
              Data de hoje ({getDataHojePtBr()}) será vinculada automaticamente ao histórico.
            </p>
          </div>

          {erro && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
              {erro}
            </div>
          )}

          <div className="pt-2 flex items-center gap-3">
            <button
              id="btn-cancelar-pg"
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 px-4 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 font-semibold text-sm transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              id="btn-confirmar-pg"
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-sm shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 size={16} />
              {loading ? 'Processando...' : 'Confirmar Baixa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
