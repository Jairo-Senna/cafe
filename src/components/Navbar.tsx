import React from 'react';
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Calendar,
  Coffee,
  Sparkles,
} from 'lucide-react';
import { getMesFormatado, getMesRefTexto } from '../utils/format';
import type { CategoriaFinanceira, UserSession } from '../types';

interface NavbarProps {
  onToggleMobileMenu: () => void;
  dataVisao: Date;
  onChangeMonth: (delta: number) => void;
  categoriaAtiva: CategoriaFinanceira;
  onLogout: () => void;
  user: UserSession | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleMobileMenu,
  dataVisao,
  onChangeMonth,
  categoriaAtiva,
  onLogout,
  user,
}) => {
  return (
    <header className="bg-white border-b border-stone-200 px-4 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-30 shadow-xs">
      {/* Left Area: Toggle & Month Navigator */}
      <div className="flex items-center gap-3">
        <button
          id="btn-toggle-menu"
          type="button"
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 transition-colors cursor-pointer"
          title="Menu lateral"
        >
          <Menu size={20} />
        </button>

        {/* Month Navigator with Accounting Reference badge */}
        <div className="flex items-center bg-stone-50 p-1 rounded-xl border border-stone-200 shadow-2xs">
          <button
            id="prev-month"
            type="button"
            onClick={() => onChangeMonth(-1)}
            className="p-1.5 rounded-lg text-stone-600 hover:text-stone-950 hover:bg-white transition-all cursor-pointer"
            title="Mês anterior"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="px-3 py-0.5 flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-stone-900 capitalize leading-tight">
              <Calendar size={13} className="text-amber-700" />
              <span>{getMesFormatado(dataVisao)}</span>
            </div>
            <span className="text-[10px] text-stone-500 font-medium leading-none">
              {getMesRefTexto(dataVisao)}
            </span>
          </div>

          <button
            id="next-month"
            type="button"
            onClick={() => onChangeMonth(1)}
            className="p-1.5 rounded-lg text-stone-600 hover:text-stone-950 hover:bg-white transition-all cursor-pointer"
            title="Próximo mês"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Active Category Chip */}
        <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xs border ${
          categoriaAtiva === 'Café'
            ? 'bg-amber-50 border-amber-200 text-amber-900'
            : 'bg-orange-50 border-orange-200 text-orange-950'
        }`}>
          <span>{categoriaAtiva === 'Café' ? '☕ Turno: Café (Manhã)' : '🍔 Turno: Hamburgueria (Noite)'}</span>
        </div>
      </div>

      {/* Right Area: User info, Logout */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* User Session Badge */}
        {user && (
          <div className="hidden lg:flex flex-col items-end text-right border-l border-stone-200 pl-3">
            <span className="text-xs font-bold text-stone-800 leading-tight">
              {user.isDemo ? '☕ Modo Demo' : user.displayName || 'Gestor'}
            </span>
            <span className="text-[10px] text-stone-500 leading-tight truncate max-w-[140px]">
              {user.email || 'Acesso Local'}
            </span>
          </div>
        )}

        {/* Logout Button */}
        <button
          id="btn-logout"
          type="button"
          onClick={onLogout}
          className="py-1.5 px-3 rounded-xl border border-red-200 bg-red-50/60 hover:bg-red-100 text-red-700 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          title="Sair da sessão"
        >
          <LogOut size={15} />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </header>
  );
};
