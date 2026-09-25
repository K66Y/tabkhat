import React, { useState } from 'react';
import { useRecipes } from '../context/RecipeContext';
import { Recipe, DifficultyLevel } from '../types/recipe';
import { RecipeCard } from './RecipeCard';
import { Search, SlidersHorizontal, X } from 'lucide-react';

interface SearchDiscoverProps {
  onSelectRecipe: (recipe: Recipe) => void;
  onAddToPlan: (recipe: Recipe) => void;
}

export const SearchDiscover: React.FC<SearchDiscoverProps> = ({
  onSelectRecipe,
  onAddToPlan,
}) => {
  const { recipes } = useRecipes();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | 'الكل'>('الكل');
  const [timeFilter, setTimeFilter] = useState<'all' | 'under30' | '30to60' | 'over60'>('all');

  const categories = [
    { label: 'الكل', icon: '🍽️' },
    { label: 'شعبي وخليجي', icon: '🍲' },
    { label: 'أطباق رئيسية', icon: '🥘' },
    { label: 'فطور', icon: '🍳' },
    { label: 'مقبلات وسلطات', icon: '🥗' },
    { label: 'حلويات', icon: '🍰' },
    { label: 'صحي ودايت', icon: '🥑' },
    { label: 'شوربات', icon: '🥣' },
    { label: 'مشروبات', icon: '☕' },
  ];

  // Filter recipes
  const filtered = recipes.filter((recipe) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const inTitle = recipe.title.toLowerCase().includes(q);
      const inDesc = recipe.description.toLowerCase().includes(q);
      const inCat = recipe.category.toLowerCase().includes(q);
      const inIngs = recipe.ingredients.some((i) => i.name.toLowerCase().includes(q));
      if (!inTitle && !inDesc && !inCat && !inIngs) {
        return false;
      }
    }

    if (selectedCategory !== 'الكل') {
      if (selectedCategory === 'شعبي وخليجي') {
        const isGulf = recipe.category.includes('خليجي') || recipe.cuisine === 'سعودي' || recipe.category.includes('شعبي');
        if (!isGulf) return false;
      } else {
        const matches = recipe.category.includes(selectedCategory) || recipe.tags?.includes(selectedCategory);
        if (!matches) return false;
      }
    }

    if (selectedDifficulty !== 'الكل' && recipe.difficulty !== selectedDifficulty) {
      return false;
    }

    const totalTime = recipe.prepTime + recipe.cookTime;
    if (timeFilter === 'under30' && totalTime > 30) return false;
    if (timeFilter === '30to60' && (totalTime < 30 || totalTime > 60)) return false;
    if (timeFilter === 'over60' && totalTime < 60) return false;

    return true;
  });

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-200">
      {/* 🔍 Search Input with Filter Button (Matches IMG_2068: Search on Right, Filter on Left) */}
      <div className="flex items-center gap-2">
        {/* Right in RTL: Search input with search icon on left inside the input */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث باسم الطبخة، المكونات (دجاج، أرز)..."
            className="w-full pr-4 pl-11 py-3 rounded-2xl bg-white border border-stone-200/90 text-xs sm:text-sm text-[#242A26] placeholder-stone-400 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#2D5A46]/20 transition-all text-right"
          />
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 stroke-[2]" />
        </div>

        {/* Left in RTL: Filter Toggle Button */}
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`w-11 h-11 rounded-2xl flex items-center justify-center border transition-all shrink-0 active:scale-95 ${
            showFilters || selectedDifficulty !== 'الكل' || timeFilter !== 'all'
              ? 'bg-[#2D5A46] text-white border-[#2D5A46] shadow-sm'
              : 'bg-white text-stone-700 border-stone-200/90 shadow-2xs hover:bg-stone-50'
          }`}
          title="خيارات التصفية"
        >
          <SlidersHorizontal className="w-5 h-5 stroke-[2]" />
        </button>
      </div>

      {/* Advanced Filter Drawer if toggled */}
      {showFilters && (
        <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-xs space-y-3.5 animate-in fade-in duration-150 text-right">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <span className="text-xs font-bold text-[#242A26]">خيارات تصفية متقدمة</span>
            <button
              onClick={() => {
                setSelectedDifficulty('الكل');
                setTimeFilter('all');
                setShowFilters(false);
              }}
              className="text-xs text-stone-400 hover:text-stone-700 font-medium"
            >
              إعادة تعيين
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="block font-bold text-stone-600 mb-1.5">مستوى الصعوبة:</span>
              <div className="flex flex-wrap gap-1.5">
                {(['الكل', 'سهل', 'متوسط', 'متقدم'] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSelectedDifficulty(d)}
                    className={`px-2.5 py-1 rounded-xl font-semibold ${
                      selectedDifficulty === d
                        ? 'bg-[#2D5A46] text-white'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block font-bold text-stone-600 mb-1.5">وقت الطبخ:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'all', label: 'الكل' },
                  { id: 'under30', label: '< 30 د' },
                  { id: '30to60', label: '30-60 د' },
                  { id: 'over60', label: '> ساعة' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTimeFilter(t.id as any)}
                    className={`px-2.5 py-1 rounded-xl font-semibold ${
                      timeFilter === t.id
                        ? 'bg-[#2D5A46] text-white'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🏷️ Categories Strip (Matches IMG_2068) */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.label;
          return (
            <button
              key={cat.label}
              onClick={() => setSelectedCategory(cat.label)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 active:scale-95 ${
                isActive
                  ? 'bg-[#2D5A46] text-white shadow-xs'
                  : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200/80 shadow-2xs'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* 📊 Results Count (Matches IMG_2068: Right: النتائج (10) | Left: مسح البحث) */}
      <div className="flex items-center justify-between px-1 pt-1">
        {/* Right in RTL */}
        <span className="text-xs font-bold text-stone-600">
          النتائج ({filtered.length})
        </span>

        {/* Left in RTL */}
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs text-[#E26D46] hover:underline flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            <span>مسح البحث</span>
          </button>
        )}
      </div>

      {/* 🍲 2-Column Grid (Matches IMG_2068) */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-stone-200 text-center space-y-2">
          <p className="text-sm font-bold text-[#242A26]">لا توجد نتائج مطابقة لبحثك</p>
          <p className="text-xs text-stone-500">جرب البحث بكلمات أخرى أو اختر تصنيفاً مختلفاً</p>
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
