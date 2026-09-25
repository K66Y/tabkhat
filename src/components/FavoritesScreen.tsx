import React, { useState } from 'react';
import { useRecipes } from '../context/RecipeContext';
import { Recipe } from '../types/recipe';
import { RecipeCard } from './RecipeCard';
import { Search, Heart, UtensilsCrossed } from 'lucide-react';

interface FavoritesScreenProps {
  onSelectRecipe: (recipe: Recipe) => void;
  onAddToPlan: (recipe: Recipe) => void;
  onExplore: () => void;
}

export const FavoritesScreen: React.FC<FavoritesScreenProps> = ({
  onSelectRecipe,
  onAddToPlan,
  onExplore,
}) => {
  const { recipes, favorites } = useRecipes();
  const [searchQuery, setSearchQuery] = useState('');

  // Get favorite recipe objects
  const favoriteRecipes = recipes.filter((r) => favorites.includes(r.id));

  // Filter with search query
  const filtered = favoriteRecipes.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      r.title.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q) ||
      r.ingredients.some((i) => i.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-5 pb-24 animate-in fade-in duration-200">
      {/* Header matching IMG_2069 (Aligned to Right) */}
      <div className="text-right space-y-1">
        <h1 className="font-heading font-black text-xl sm:text-2xl text-[#242A26] flex items-center gap-2">
          <span>وصفاتي المفضلة</span>
          <span>❤️</span>
        </h1>
        <p className="text-xs text-stone-500 font-medium">
          الأطباق التي أحببتها وترغب في طبخها دائماً ({favoriteRecipes.length})
        </p>
      </div>

      {/* Search Input matching IMG_2069 */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث في أطباقك المفضلة..."
          className="w-full pr-4 pl-11 py-3 rounded-2xl bg-white border border-stone-200/90 text-xs sm:text-sm text-[#242A26] placeholder-stone-400 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#E26D46]/30 transition-all text-right"
        />
        <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 stroke-[2]" />
      </div>

      {/* Grid of Favorite Recipes or Empty State */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-stone-200 text-center space-y-3.5 shadow-2xs">
          <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
            <Heart className="w-7 h-7 stroke-[1.8]" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm text-[#242A26]">
              {favoriteRecipes.length === 0
                ? 'لم تقم بإضافة أي وصفة للمفضلة بعد'
                : 'لا توجد نتائج مطابقة لبحثك في المفضلة'}
            </h3>
            <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
              اضغط على رمز القلب في أي طبق لحفظه في قائمتك المفضلة والرجوع إليه بسرعة!
            </p>
          </div>
          <button
            onClick={onExplore}
            type="button"
            className="px-5 py-2.5 rounded-2xl bg-[#E26D46] hover:bg-[#D15B35] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>استكشف الوصفات الشهية</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {filtered.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onSelect={onSelectRecipe}
              onAddToPlan={onAddToPlan}
            />
          ))}
        </div>
      )}
    </div>
  );
};
