import React, { useState } from 'react';
import {
  X,
  Settings,
  Database,
  Github,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Store,
} from 'lucide-react';
import type { CafeteriaSettings, FirebaseCredentials } from '../types';
import { demoStore } from '../services/firebase';

interface ModalSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  settings: CafeteriaSettings;
  onSaveSettings: (newSettings: CafeteriaSettings) => void;
}

export const ModalSettings: React.FC<ModalSettingsProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [nome, setNome] = useState(settings.nomeCafeteria);
  const [slogan, setSlogan] = useState(settings.slogan);
  const [githubUrl, setGithubUrl] = useState(settings.githubRepoUrl);
  const [usarDemo, setUsarDemo] = useState(settings.usarModoDemo);

  const [firebaseConfig, setFirebaseConfig] = useState<FirebaseCredentials>({
    apiKey: settings.firebaseConfig?.apiKey || '',
    authDomain: settings.firebaseConfig?.authDomain || '',
    projectId: settings.firebaseConfig?.projectId || '',
    storageBucket: settings.firebaseConfig?.storageBucket || '',
    messagingSenderId: settings.firebaseConfig?.messagingSenderId || '',
    appId: settings.firebaseConfig?.appId || '',
    measurementId: settings.firebaseConfig?.measurementId || '',
  });

  const [jsonPaste, setJsonPaste] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleParseJson = () => {
    try {
      // Clean string
      let cleaned = jsonPaste.trim();
      if (cleaned.includes('firebaseConfig =')) {
        cleaned = cleaned.split('firebaseConfig =')[1].replace(/;/g, '').trim();
      }
      // Replace keys without quotes
      const jsonLike = cleaned
        .replace(/([a-zA-Z0-9_]+):/g, '"$1":')
        .replace(/'/g, '"')
        .replace(/,(\s*})/g, '$1');

      const parsed = JSON.parse(jsonLike);

      setFirebaseConfig({
        apiKey: parsed.apiKey || '',
        authDomain: parsed.authDomain || '',
        projectId: parsed.projectId || '',
        storageBucket: parsed.storageBucket || '',
        messagingSenderId: parsed.messagingSenderId || '',
        appId: parsed.appId || '',
        measurementId: parsed.measurementId || '',
      });

      setJsonPaste('');
      setSuccessMsg('Configuração do Firebase colada e preenchida com sucesso!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch {
      alert(
        'Não foi possível interpretar o JSON. Certifique-se de colar o bloco de configuração do Firebase Console ou preencha os campos individuais abaixo.'
      );
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: CafeteriaSettings = {
      nomeCafeteria: nome.trim() || 'Financeiro Refeições - Café e Hamburgueria',
      slogan: slogan.trim() || 'Gestão Financeira & Folha de Pagamentos',
      githubRepoUrl: githubUrl.trim(),
      usarModoDemo: usarDemo,
      firebaseConfig,
    };
    onSaveSettings(updated);
    setSuccessMsg('Configurações salvas!');
    setTimeout(() => {
      setSuccessMsg('');
      onClose();
    }, 1200);
  };

  const handleResetSeed = () => {
    if (
      confirm(
        'Deseja restaurar os dados de exemplo da Cafeteria (Baristas, Lançamentos de Salário e Gorjetas)? Isso recarregará a base demonstrativa local.'
      )
    ) {
      demoStore.resetToSeed();
      alert('Dados de exemplo restaurados!');
      window.location.reload();
    }
  };

  return (
    <div
      id="modal-settings-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="modal-settings-card"
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 px-6 py-4 flex items-center justify-between text-white flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
              <Settings size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-amber-100">Configurações da Cafeteria</h3>
              <p className="text-xs text-stone-300">
                Personalize nome, identidade visual, repositório GitHub e conta do Firebase
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6 flex-1 text-stone-800">
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 size={16} />
              {successMsg}
            </div>
          )}

          {/* Section: Identidade da Empresa */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Store size={18} className="text-amber-700" />
              <h4 className="font-bold text-sm text-stone-900 uppercase tracking-wider">
                1. Identidade da Cafeteria & Marca
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Nome da Cafeteria / Empresa
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Financeiro Refeições - Café e Hamburgueria"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 bg-stone-50 text-stone-900 text-sm focus:bg-white focus:border-amber-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Slogan ou Subtítulo
                </label>
                <input
                  type="text"
                  value={slogan}
                  onChange={(e) => setSlogan(e.target.value)}
                  placeholder="Ex: Gestão Financeira & Folha da Equipe"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 bg-stone-50 text-stone-900 text-sm focus:bg-white focus:border-amber-600 outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1.5">
                  <Github size={14} className="text-stone-600" />
                  Repositório do GitHub do Projeto
                </label>
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/seu-usuario/seu-repositorio"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 bg-stone-50 text-stone-900 text-sm focus:bg-white focus:border-amber-600 outline-none"
                />
              </div>
            </div>
          </div>

          <hr className="border-stone-200" />

          {/* Section: Firebase / Database Connection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Database size={18} className="text-amber-700" />
                <h4 className="font-bold text-sm text-stone-900 uppercase tracking-wider">
                  2. Conexão do Servidor Firebase (Firestore & Auth)
                </h4>
              </div>
            </div>

            {/* Mode Toggle Banner */}
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/80 mb-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-amber-950">
                    Modo de Operação Atual:
                  </span>
                  <p className="text-xs text-amber-800">
                    {usarDemo
                      ? '🟢 Modo Demonstração Local Ativo (funciona imediatamente sem precisar de chaves Firebase).'
                      : '🔵 Conectado ao Firebase Cloud (Firestore em Nuvem).'
                    }
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setUsarDemo(!usarDemo)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    usarDemo
                      ? 'bg-amber-600 text-white hover:bg-amber-700'
                      : 'bg-stone-800 text-white hover:bg-stone-900'
                  }`}
                >
                  {usarDemo ? 'Alternar para Firebase Nuvem' : 'Ativar Modo Demonstração'}
                </button>
              </div>
            </div>

            {/* Paste Firebase Config Helper */}
            <div className="mb-4 bg-stone-50 p-3.5 rounded-xl border border-stone-200">
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Colar Objeto <code className="text-amber-800 bg-amber-100/60 px-1 py-0.5 rounded">firebaseConfig</code> do Console do Firebase:
              </label>
              <div className="flex gap-2">
                <textarea
                  rows={2}
                  value={jsonPaste}
                  onChange={(e) => setJsonPaste(e.target.value)}
                  placeholder={`{\n  apiKey: "AIzaSy...",\n  projectId: "sua-cafeteria",\n  ...\n}`}
                  className="flex-1 p-2 text-xs font-mono rounded-lg border border-stone-300 bg-white outline-none focus:border-amber-600 resize-none"
                />
                <button
                  type="button"
                  onClick={handleParseJson}
                  className="px-3 py-1.5 self-center bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Auto-Preencher
                </button>
              </div>
            </div>

            {/* Manual Credential Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-stone-600 mb-1">apiKey</label>
                <input
                  type="text"
                  value={firebaseConfig.apiKey}
                  onChange={(e) =>
                    setFirebaseConfig({ ...firebaseConfig, apiKey: e.target.value })
                  }
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-stone-50 font-mono text-xs focus:bg-white focus:border-amber-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-600 mb-1">authDomain</label>
                <input
                  type="text"
                  value={firebaseConfig.authDomain}
                  onChange={(e) =>
                    setFirebaseConfig({ ...firebaseConfig, authDomain: e.target.value })
                  }
                  placeholder="sua-cafeteria.firebaseapp.com"
                  className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-stone-50 font-mono text-xs focus:bg-white focus:border-amber-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-600 mb-1">projectId</label>
                <input
                  type="text"
                  value={firebaseConfig.projectId}
                  onChange={(e) =>
                    setFirebaseConfig({ ...firebaseConfig, projectId: e.target.value })
                  }
                  placeholder="sua-cafeteria"
                  className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-stone-50 font-mono text-xs focus:bg-white focus:border-amber-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-600 mb-1">storageBucket</label>
                <input
                  type="text"
                  value={firebaseConfig.storageBucket}
                  onChange={(e) =>
                    setFirebaseConfig({ ...firebaseConfig, storageBucket: e.target.value })
                  }
                  placeholder="sua-cafeteria.firebasestorage.app"
                  className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-stone-50 font-mono text-xs focus:bg-white focus:border-amber-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-600 mb-1">messagingSenderId</label>
                <input
                  type="text"
                  value={firebaseConfig.messagingSenderId}
                  onChange={(e) =>
                    setFirebaseConfig({ ...firebaseConfig, messagingSenderId: e.target.value })
                  }
                  placeholder="1234567890"
                  className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-stone-50 font-mono text-xs focus:bg-white focus:border-amber-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-600 mb-1">appId</label>
                <input
                  type="text"
                  value={firebaseConfig.appId}
                  onChange={(e) =>
                    setFirebaseConfig({ ...firebaseConfig, appId: e.target.value })
                  }
                  placeholder="1:1234567890:web:abcdef..."
                  className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-stone-50 font-mono text-xs focus:bg-white focus:border-amber-600 outline-none"
                />
              </div>
            </div>
          </div>

          <hr className="border-stone-200" />

          {/* Section: Reset Data */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-stone-100 border border-stone-200">
            <div>
              <span className="font-bold text-xs text-stone-800">
                Restaurar Dados Demonstrativos da Cafeteria
              </span>
              <p className="text-[11px] text-stone-500">
                Recria baristas, atendentes, salários e gorjetas de exemplo.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetSeed}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-stone-200 border border-stone-300 text-stone-700 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw size={14} /> Restaurar
            </button>
          </div>

          {/* Footer inside form */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              Fechar
            </button>
            <button
              id="btn-salvar-configuracoes"
              type="submit"
              className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white font-bold text-xs shadow-md shadow-amber-900/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Save size={16} /> Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
