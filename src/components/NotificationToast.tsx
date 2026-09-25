import React from 'react';
import { useRecipes } from '../context/RecipeContext';
import { CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export const NotificationToast: React.FC = () => {
  const { toast } = useRecipes();

  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isWarning = toast.type === 'warning';

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 max-w-[90vw] md:max-w-md w-full px-4 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-none">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-sm md:text-base font-medium pointer-events-auto backdrop-blur-md ${
          isSuccess
            ? 'bg-[#2D5A46]/95 text-white border-[#3D6B56]/50 shadow-[#2D5A46]/20'
            : isWarning
            ? 'bg-amber-600/95 text-white border-amber-500/50 shadow-amber-600/20'
            : 'bg-[#242A26]/95 text-white border-gray-700/50 shadow-black/20'
        }`}
      >
        {isSuccess ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
        ) : isWarning ? (
          <AlertTriangle className="w-5 h-5 text-amber-200 shrink-0" />
        ) : (
          <Info className="w-5 h-5 text-orange-300 shrink-0" />
        )}
        <span className="flex-1 leading-snug">{toast.message}</span>
      </div>
    </div>
  );
};
