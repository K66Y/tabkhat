import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRecipes } from '../context/RecipeContext';
import { ShoppingCart, RefreshCw } from 'lucide-react';
import { PotLogo } from './PotLogo';

interface NavbarProps {
  onOpenFridge: () => void;
  onOpenVoiceRecipe: () => void;
  onOpenFavorites: () => void;
  onOpenProfile: () => void;
  onOpenShopping?: () => void;
  activeFavoritesCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenProfile,
  onOpenShopping,
}) => {
  const { user } = useAuth();
  const { shoppingList, showToast } = useRecipes();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const pendingShoppingCount = shoppingList.filter((i) => !i.completed).length;
  const displayCartBadge = pendingShoppingCount > 0 ? (pendingShoppingCount > 9 ? '+9' : pendingShoppingCount) : null;

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    showToast('جاري تحديث التطبيق وسحب أحدث نسخة والتعديلات...', 'info');

    try {
      // Clear SW caches if any
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const reg of regs) {
          await reg.update();
        }
      }
    } catch {
      // Ignore
    }

    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  return (
    <header className="sticky top-0 z-30 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#2D5A46]/10 px-4 py-2.5">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        {/* Right Side in RTL: Brand Logo & Title (طبخات على اليمين مع أيقونة القدر) */}
        <div
          onClick={onOpenProfile}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          {/* Green Steaming Pot Logo on the rightmost edge */}
          <PotLogo className="w-11 h-11" />

          <div className="flex flex-col items-start">
            <h1 className="font-heading font-black text-xl text-[#242A26] tracking-tight group-hover:text-[#E26D46] transition-colors leading-none">
              طبخات
            </h1>
            <span className="text-[11px] text-stone-500 font-medium mt-1">
              أطباق يومية شهية
            </span>
          </div>
        </div>

        {/* Left Side in RTL: Refresh + Shopping Cart + Avatar */}
        <div className="flex items-center gap-2">
          {/* Refresh / Update Button for iPhone Home Screen */}
          <button
            onClick={handleManualRefresh}
            type="button"
            className="w-10 h-10 rounded-full bg-white border border-stone-200/90 text-stone-600 hover:text-[#E26D46] hover:border-orange-200 flex items-center justify-center shadow-xs transition-all active:scale-95"
            title="سحب التحديثات وتحديث الصفحة"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#E26D46]' : ''}`} />
          </button>

          {/* Shopping Cart Button with +9 Badge */}
          <button
            onClick={onOpenShopping}
            type="button"
            className="relative w-10 h-10 rounded-full bg-white border border-stone-200/90 text-stone-700 hover:text-[#E26D46] hover:border-orange-200 flex items-center justify-center shadow-xs transition-all active:scale-95"
            title="قائمة المشتريات"
          >
            <ShoppingCart className="w-5 h-5 stroke-[1.8]" />
            {displayCartBadge && (
              <span className="absolute -top-1 -right-1 bg-[#E26D46] text-white text-[10px] font-extrabold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center border-2 border-white shadow-xs">
                {displayCartBadge}
              </span>
            )}
          </button>

          {/* User Profile Avatar on the leftmost edge */}
          <button
            onClick={onOpenProfile}
            type="button"
            className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm ring-1 ring-stone-200/80 hover:ring-[#E26D46] transition-all active:scale-95"
            title="حسابي والإعدادات"
          >
            {user?.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || 'حسابي'} className="w-full h-full object-cover" />
            ) : (
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                alt="المستخدم"
                className="w-full h-full object-cover"
              />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
