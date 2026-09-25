import React from 'react';
import { Home, Search, Plus, Heart, User } from 'lucide-react';
import { useRecipes } from '../context/RecipeContext';

export type TabType = 'home' | 'search' | 'favorites' | 'profile' | 'my-recipes' | 'planner' | 'shopping';

interface BottomNavProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  onOpenAddRecipe: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onTabChange,
  onOpenAddRecipe,
}) => {
  const { favorites } = useRecipes();

  return (
    <nav
      aria-label="شريط التنقل السفلي"
      className="fixed bottom-0 left-0 right-0 z-30 bg-[#FAF8F5]/95 backdrop-blur-lg border-t border-stone-200/70 shadow-[0_-4px_25px_rgba(0,0,0,0.05)]"
    >
      <div className="max-w-md mx-auto px-4 py-1.5 flex items-center justify-between">
        {/* 1. الرئيسية */}
        <button
          onClick={() => onTabChange('home')}
          className={`relative flex flex-col items-center justify-center py-1 px-2 min-w-[54px] transition-all duration-200 ${
            currentTab === 'home'
              ? 'text-[#2D5A46] font-extrabold'
              : 'text-stone-500 hover:text-stone-800 font-medium'
          }`}
        >
          <Home className={`w-5 h-5 ${currentTab === 'home' ? 'stroke-[2.6px]' : 'stroke-[1.8]'}`} />
          <span className="text-[11px] mt-1 tracking-tight">الرئيسية</span>
          {currentTab === 'home' && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#2D5A46] mt-0.5" />
          )}
        </button>

        {/* 2. البحث */}
        <button
          onClick={() => onTabChange('search')}
          className={`relative flex flex-col items-center justify-center py-1 px-2 min-w-[54px] transition-all duration-200 ${
            currentTab === 'search'
              ? 'text-[#2D5A46] font-extrabold'
              : 'text-stone-500 hover:text-stone-800 font-medium'
          }`}
        >
          <Search className={`w-5 h-5 ${currentTab === 'search' ? 'stroke-[2.6px]' : 'stroke-[1.8]'}`} />
          <span className="text-[11px] mt-1 tracking-tight">البحث</span>
          {currentTab === 'search' && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#2D5A46] mt-0.5" />
          )}
        </button>

        {/* 3. إضافة (الزر البرتقالي الدائري البارز في المنتصف كما في الصور) */}
        <button
          onClick={onOpenAddRecipe}
          type="button"
          className="flex flex-col items-center justify-center -mt-6 group active:scale-95 transition-transform"
          title="إضافة وتسجيل وصفة جديدة"
        >
          <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-[#E26D46] to-[#FF8155] text-white flex items-center justify-center shadow-lg shadow-[#E26D46]/45 border-4 border-[#FAF8F5] group-hover:scale-105 transition-transform">
            <Plus className="w-6 h-6 stroke-[2.8]" />
          </div>
          <span className="text-[11px] font-bold text-[#E26D46] mt-0.5 tracking-tight">إضافة</span>
        </button>

        {/* 4. المفضلة */}
        <button
          onClick={() => onTabChange('favorites')}
          className={`relative flex flex-col items-center justify-center py-1 px-2 min-w-[54px] transition-all duration-200 ${
            currentTab === 'favorites'
              ? 'text-[#2D5A46] font-extrabold'
              : 'text-stone-500 hover:text-stone-800 font-medium'
          }`}
        >
          <div className="relative">
            <Heart
              className={`w-5 h-5 ${
                currentTab === 'favorites'
                  ? 'stroke-[2.6px] fill-[#2D5A46]/20'
                  : 'stroke-[1.8]'
              }`}
            />
            {favorites.length > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-[#E26D46] text-white text-[10px] font-extrabold rounded-full min-w-[17px] h-[17px] flex items-center justify-center px-1 border-2 border-[#FAF8F5] shadow-xs">
                {favorites.length > 9 ? '+9' : favorites.length}
              </span>
            )}
          </div>
          <span className="text-[11px] mt-1 tracking-tight">المفضلة</span>
          {currentTab === 'favorites' && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#2D5A46] mt-0.5" />
          )}
        </button>

        {/* 5. الحساب */}
        <button
          onClick={() => onTabChange('profile')}
          className={`relative flex flex-col items-center justify-center py-1 px-2 min-w-[54px] transition-all duration-200 ${
            currentTab === 'profile'
              ? 'text-[#2D5A46] font-extrabold'
              : 'text-stone-500 hover:text-stone-800 font-medium'
          }`}
        >
          <User className={`w-5 h-5 ${currentTab === 'profile' ? 'stroke-[2.6px]' : 'stroke-[1.8]'}`} />
          <span className="text-[11px] mt-1 tracking-tight">الحساب</span>
          {currentTab === 'profile' && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#2D5A46] mt-0.5" />
          )}
        </button>
      </div>
    </nav>
  );
};
