import React, { useState } from 'react';
import {
  Coffee,
  Lock,
  Mail,
  ArrowRight,
  UserPlus,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { CoffeeLogo } from './CoffeeLogo';
import { loginFirebase, registerFirebase } from '../services/firebase';
import type { UserSession } from '../types';

interface AuthScreenProps {
  onSuccessDemo: () => void;
  onOpenSettings?: () => void;
  nomeCafeteria: string;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onSuccessDemo,
  nomeCafeteria,
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (!email || !password) {
      setErro('Por favor informe e-mail e senha.');
      return;
    }
    setLoading(true);
    try {
      if (isRegister) {
        if (password.length < 6) {
          throw new Error('A senha deve conter no mínimo 6 caracteres.');
        }
        await registerFirebase(email, password);
      } else {
        await loginFirebase(email, password);
      }
    } catch (err: any) {
      console.warn('Erro de autenticação:', err);
      let msg = 'Falha na autenticação. Verifique os dados ou use o Modo Demonstração.';
      if (err.message && err.message.includes('auth/')) {
        if (err.message.includes('user-not-found') || err.message.includes('wrong-password')) {
          msg = 'E-mail ou senha incorretos.';
        } else if (err.message.includes('email-already-in-use')) {
          msg = 'Este e-mail já está cadastrado.';
        } else if (err.message.includes('weak-password')) {
          msg = 'A senha deve conter pelo menos 6 dígitos.';
        } else if (err.message.includes('invalid-email')) {
          msg = 'Formato de e-mail inválido.';
        }
      } else if (err.message) {
        msg = err.message;
      }
      setErro(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="screen-login"
      className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-stone-950 via-stone-900 to-amber-950 relative overflow-hidden"
    >
      {/* Subtle coffee steam graphic elements */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-800/15 rounded-full blur-3xl pointer-events-none" />

      <div
        id="login-box"
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-stone-200/80 relative z-10 animate-in fade-in zoom-in-95 duration-300"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <CoffeeLogo size="lg" lightMode={true} />
          <h2 className="text-xl font-extrabold text-stone-900 mt-4 tracking-tight">
            {isRegister ? 'Cadastrar Nova Conta' : 'Acessar Painel Financeiro'}
          </h2>
          <p className="text-xs text-stone-500 mt-1 max-w-[280px]">
            {nomeCafeteria} • Gestão de Folha, Gorjetas e Lançamentos
          </p>
        </div>

        {/* Error Notification */}
        {erro && (
          <div
            id="auth-msg"
            className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2 animate-in fade-in"
          >
            <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <span>{erro}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
              E-mail Profissional
            </label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <input
                id="login-email"
                type="email"
                required
                placeholder="gestor@refeicoes.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 bg-stone-50 text-stone-900 text-sm font-medium focus:bg-white focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
              Senha de Acesso
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <input
                id="login-password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 bg-stone-50 text-stone-900 text-sm font-medium focus:bg-white focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 hover:from-amber-800 hover:to-amber-950 text-white font-bold text-sm shadow-lg shadow-amber-950/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <span>Conectando...</span>
            ) : isRegister ? (
              <>
                <UserPlus size={16} />
                <span>Criar Conta e Acessar</span>
              </>
            ) : (
              <>
                <span>Acessar Painel da Cafeteria</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Demo Mode Button (Instant Preview) */}
        <div className="mt-4 pt-4 border-t border-stone-200">
          <button
            type="button"
            onClick={onSuccessDemo}
            className="w-full py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-800 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Coffee size={15} className="text-amber-700" />
            <span>Entrar em Modo Demonstração (Sem Senha)</span>
          </button>
        </div>

        {/* Toggle Login / Register */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setErro('');
            }}
            className="text-xs text-stone-600 hover:text-amber-800 font-semibold cursor-pointer underline transition-colors"
          >
            {isRegister
              ? 'Já tem uma conta? Fazer Login'
              : 'Primeira vez por aqui? Crie uma conta'}
          </button>
        </div>
      </div>
    </div>
  );
};
