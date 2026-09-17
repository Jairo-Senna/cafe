import React from 'react';
import { Coffee } from 'lucide-react';

interface CoffeeLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  lightMode?: boolean;
}

export const CoffeeLogo: React.FC<CoffeeLogoProps> = ({
  size = 'md',
  className = '',
  lightMode = false,
}) => {
  const iconSize = size === 'sm' ? 18 : size === 'lg' ? 32 : 24;
  const textSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-lg';
  const subTextSize = size === 'sm' ? 'text-[10px]' : size === 'lg' ? 'text-xs' : 'text-[11px]';

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <div
        className={`flex items-center justify-center rounded-xl p-2.5 shadow-md ${
          lightMode
            ? 'bg-amber-600 text-amber-50 ring-2 ring-amber-400/30'
            : 'bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 text-amber-100 ring-1 ring-amber-500/30'
        }`}
      >
        <Coffee size={iconSize} className="stroke-[2.2] animate-pulse" />
      </div>
      <div className="flex flex-col text-left">
        <span
          className={`font-extrabold tracking-tight leading-none ${
            lightMode ? 'text-amber-900' : 'text-amber-100'
          } ${textSize}`}
        >
          Financeiro Refeições
        </span>
        <span
          className={`font-semibold tracking-wide uppercase ${
            lightMode ? 'text-amber-700/80' : 'text-amber-300/80'
          } ${subTextSize}`}
        >
          Café e Hamburgueria
        </span>
      </div>
    </div>
  );
};
