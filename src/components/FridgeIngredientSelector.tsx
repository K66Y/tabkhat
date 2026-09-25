import React, { useState } from 'react';
import { useRecipes } from '../context/RecipeContext';
import { Recipe } from '../types/recipe';
import {
  X,
  Sparkles,
  Check,
  Plus,
  Refrigerator,
  ChefHat,
  ArrowLeft,
  Loader2,
  Flame,
} from 'lucide-react';

interface FridgeIngredientSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRecipe: (recipe: Recipe) => void;
}

const COMMON_PANTRY_ITEMS = [
  'دجاج',
  'لحم',
  'أرز',
  'طماطم',
  'بصل',
  'ثوم',
  'بطاطس',
  'بيض',
  'حليب',
  'معكرونة',
  'جبن',
  'ليمون',
  'عدس',
  'خيار',
  'شبت',
  'كراث',
  'فستق',
  'قشطة',
  'سمن',
  'خبز',
];

export const FridgeIngredientSelector: React.FC<FridgeIngredientSelectorProps> = ({
  isOpen,
  onClose,
  onSelectRecipe,
}) => {
  const { recipes, addRecipe, showToast } = useRecipes();

  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([
    'دجاج',
    'أرز',
    'طماطم',
    'بصل',
  ]);
  const [customInput, setCustomInput] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  if (!isOpen) return null;

  const toggleIngredient = (item: string) => {
    setSelectedIngredients((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    const clean = customInput.trim();
    if (!selectedIngredients.includes(clean)) {
      setSelectedIngredients((prev) => [...prev, clean]);
    }
    setCustomInput('');
  };

  // Match existing recipes by counting how many ingredients appear in the recipe
  const matchedRecipes = recipes
    .map((recipe) => {
      const recipeIngredientsText = recipe.ingredients
        .map((i) => i.name.toLowerCase())
        .join(' ');
      const matchCount = selectedIngredients.filter((ing) =>
        recipeIngredientsText.includes(ing.toLowerCase())
      ).length;

      const matchPercent =
        selectedIngredients.length > 0
          ? Math.round((matchCount / Math.min(recipe.ingredients.length, selectedIngredients.length)) * 100)
          : 0;

      return { recipe, matchCount, matchPercent };
    })
    .filter((item) => item.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount);

  // AI Generation from ingredients
  const handleGenerateCustomDish = async () => {
    if (selectedIngredients.length === 0) {
      showToast('يرجى تحديد مكون واحد على الأقل في الثلاجة', 'warning');
      return;
    }

    setIsGeneratingAI(true);
    try {
      const res = await fetch('/api/fridge-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients: selectedIngredients }),
      });

      const data = await res.json();
      if (data && data.recipe) {
        const newRecipe = addRecipe(data.recipe);
        onClose();
        onSelectRecipe(newRecipe);
        showToast('✨ ابتكر Gemini وصفة خاصة وجديدة بمكونات ثلاجتك!', 'success');
      } else {
        throw new Error('فشل الابتكار');
      }
    } catch (err) {
      console.error(err);
      showToast('تعذر توليد الوصفة بالذكاء الاصطناعي حالياً', 'warning');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-end sm:items-center p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div
        className="bg-[#FAF8F5] w-full max-w-xl max-h-[92vh] sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-stone-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-white border-b border-stone-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <Refrigerator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg text-[#242A26]">ماذا أطبخ اليوم؟</h2>
              <p className="text-xs text-stone-500">حدد ما يتوفر في ثلاجتك وسنقترح عليك أشهى الوصفات</p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="p-2 rounded-full hover:bg-stone-100 text-stone-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Ingredient Pills */}
          <div>
            <label className="block text-xs font-bold text-[#242A26] mb-2">
              اختر المكونات المتوفرة لديك حالياً ({selectedIngredients.length} محددة):
            </label>
            <div className="flex flex-wrap gap-2">
              {COMMON_PANTRY_ITEMS.map((item) => {
                const isSelected = selectedIngredients.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleIngredient(item)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
                      isSelected
                        ? 'bg-[#E26D46] text-white shadow-sm'
                        : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add custom ingredient input */}
          <form onSubmit={handleAddCustom} className="flex gap-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="إضافة مكون آخر بالثلاجة (مثلاً: جبنة موزاريلا...)"
              className="flex-1 p-2.5 rounded-xl bg-white border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#E26D46]/40"
            />
            <button
              type="submit"
              className="px-3.5 py-2.5 bg-[#2D5A46] text-white rounded-xl text-xs font-bold hover:bg-[#224535] flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> إضافة
            </button>
          </form>

          {/* AI Generator CTA Banner */}
          <div className="bg-gradient-to-r from-orange-100/90 to-amber-100/90 border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-right">
              <div className="w-9 h-9 rounded-xl bg-[#E26D46] text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#242A26]">طبخة مبتكرة بمكوناتك تحديداً</p>
                <p className="text-[11px] text-stone-600">سيقوم الشيف الذكي بابتكار وصفة فورية جديدة ومضبوطة</p>
              </div>
            </div>

            <button
              onClick={handleGenerateCustomDish}
              disabled={isGeneratingAI || selectedIngredients.length === 0}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#E26D46] hover:bg-[#D15B35] disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm shrink-0 active:scale-95 transition-all"
            >
              {isGeneratingAI ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري الابتكار...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  ابتكار طبخة مخصصة
                </>
              )}
            </button>
          </div>

          {/* Matched Recipes List */}
          <div>
            <h3 className="font-heading font-bold text-sm text-[#242A26] mb-3 flex items-center justify-between">
              <span>وصفات مطابقة من المجموعة ({matchedRecipes.length})</span>
            </h3>

            {matchedRecipes.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-stone-200">
                <ChefHat className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                <p className="text-xs text-stone-500 font-medium">
                  لم نجد وصفة مطابقة للمكونات المختارة تماماً. اضغط على "ابتكار طبخة مخصصة" لتوليد وصفة فورية!
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {matchedRecipes.slice(0, 6).map(({ recipe, matchCount }) => (
                  <div
                    key={recipe.id}
                    onClick={() => {
                      onClose();
                      onSelectRecipe(recipe);
                    }}
                    className="p-3 bg-white hover:bg-stone-50 rounded-2xl border border-stone-200/80 flex items-center justify-between gap-3 cursor-pointer transition-all hover:border-[#E26D46]/40 shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={recipe.imageUrl}
                        alt={recipe.title}
                        className="w-14 h-14 rounded-xl object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs sm:text-sm text-[#242A26] truncate">
                          {recipe.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-500">
                          <span>{recipe.category}</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5 text-amber-600">
                            <Flame className="w-3 h-3" />
                            {recipe.calories} سعرة
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2 py-1 rounded-lg border border-emerald-200">
                        يتوفر {matchCount} مكونات
                      </span>
                      <ArrowLeft className="w-4 h-4 text-stone-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
