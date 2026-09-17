import React, { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ModalConfirmacaoProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  titulo: string;
  descricao: string;
  detalhe?: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  variante?: 'danger' | 'warning';
}

export const ModalConfirmacao: React.FC<ModalConfirmacaoProps> = ({
  isOpen,
  onClose,
  onConfirm,
  titulo,
  descricao,
  detalhe,
  textoConfirmar = 'Confirmar Exclusão',
  textoCancelar = 'Cancelar',
  variante = 'danger',
}) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirmar = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      console.error('Erro ao executar ação de confirmação:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="modal-confirmacao-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="modal-confirmacao-card"
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-xl flex-shrink-0 ${
                variante === 'danger'
                  ? 'bg-red-50 text-red-600 border border-red-100'
                  : 'bg-amber-50 text-amber-700 border border-amber-100'
              }`}
            >
              {variante === 'danger' ? <Trash2 size={24} /> : <AlertTriangle size={24} />}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-stone-900 leading-snug">{titulo}</h3>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">{descricao}</p>

              {detalhe && (
                <div className="mt-2.5 p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono text-stone-800 break-words">
                  {detalhe}
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              disabled={loading}
              className="p-1 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              {textoCancelar}
            </button>

            <button
              type="button"
              onClick={handleConfirmar}
              disabled={loading}
              className={`px-4 py-2 rounded-xl text-white text-xs font-bold shadow transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 ${
                variante === 'danger'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-amber-700 hover:bg-amber-800'
              }`}
            >
              {loading ? (
                <span>Processando...</span>
              ) : (
                <>
                  <Trash2 size={13} />
                  <span>{textoConfirmar}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
