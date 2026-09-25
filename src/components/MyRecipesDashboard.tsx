import React, { useState } from 'react';
import { Recipe, RecipeCategory } from '../types/recipe';
import {
  BarChart3,
  PieChart,
  Clock,
  Flame,
  Heart,
  BookOpen,
  ChevronDown,
  ChevronUp,
  UtensilsCrossed,
  Sparkles,
  Layers,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';

interface MyRecipesDashboardProps {
  recipes: Recipe[];
  isFavorite: (id: string) => boolean;
  selectedCategory: RecipeCategory;
  onSelectCategory: (cat: RecipeCategory) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  'أطباق رئيسية': '🥘',
  'أطباق خليجية وسعودية': '🇸🇦',
  'شوربات': '🥣',
  'مقبلات وسلطات': '🥗',
  'حلا وحلويات': '🍰',
  'فطور': '🍳',
  'وجبات سريعة': '⏱️',
  'وجبات صحية': '🥑',
  'مشروبات': '☕',
};

export const MyRecipesDashboard: React.FC<MyRecipesDashboardProps> = ({
  recipes,
  isFavorite,
  selectedCategory,
  onSelectCategory,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const totalRecipes = recipes.length;

  // Favorited count
  const favoritesCount = recipes.filter((r) => isFavorite(r.id)).length;

  // Average preparation and cooking time
  const totalMinutes = recipes.reduce((sum, r) => sum + (r.prepTime || 0) + (r.cookTime || 0), 0);
  const avgMinutes = totalRecipes > 0 ? Math.round(totalMinutes / totalRecipes) : 0;

  // Average calories
  const totalCalories = recipes.reduce((sum, r) => sum + (r.calories || 0), 0);
  const avgCalories = totalRecipes > 0 ? Math.round(totalCalories / totalRecipes) : 0;

  // Total ingredients count
  const totalIngredients = recipes.reduce((sum, r) => sum + (r.ingredients ? r.ingredients.length : 0), 0);

  // Group by category
  const categoryCounts = recipes.reduce<Record<string, number>>((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1;
    return acc;
  }, {});

  const categoryList = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);

  // Group by difficulty
  const difficultyCounts = {
    سهل: recipes.filter((r) => r.difficulty === 'سهل').length,
    متوسط: recipes.filter((r) => r.difficulty === 'متوسط').length,
    متقدم: recipes.filter((r) => r.difficulty === 'متقدم').length,
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden transition-all duration-300">
      {/* Dashboard Top Header Bar with Collapse/Expand Toggle */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-stone-50/70 transition-colors border-b border-stone-100 select-none"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#2D5A46] to-[#407B60] text-white flex items-center justify-center shadow-md shadow-[#2D5A46]/20">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading font-extrabold text-sm sm:text-base text-[#242A26]">
                لوحة إحصائيات وصفاتي
              </h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#2D5A46]/10 text-[#2D5A46]">
                Dashboard
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              تحليل شامل لأطباقك المحفوظة، وتوزيع التصنيفات، ومعدلات الطبخ
            </p>
          </div>
        </div>

        <button
          type="button"
          aria-label={isExpanded ? 'طي لوحة البيانات' : 'توسيع لوحة البيانات'}
          className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors shrink-0"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Dashboard Body */}
      {isExpanded && (
        <div className="p-5 space-y-6 animate-in fade-in duration-200">
          {/* 4 Summary Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* 1. Total Saved Recipes */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 p-4 rounded-2xl border border-orange-200/70 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-600">إجمالي الوصفات</span>
                <div className="w-8 h-8 rounded-xl bg-[#E26D46] text-white flex items-center justify-center shadow-sm">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-heading font-extrabold text-[#E26D46]">
                  {totalRecipes}
                </div>
                <div className="text-[11px] text-stone-500 font-medium mt-0.5">
                  وصفة محفوظة في دفترك
                </div>
              </div>
            </div>

            {/* 2. Favorites */}
            <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 p-4 rounded-2xl border border-rose-200/70 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-600">المفضلة</span>
                <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-sm">
                  <Heart className="w-4 h-4 fill-white" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-heading font-extrabold text-rose-600">
                  {favoritesCount}
                </div>
                <div className="text-[11px] text-stone-500 font-medium mt-0.5">
                  من وصفاتك المفضلة
                </div>
              </div>
            </div>

            {/* 3. Average Cooking Time */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-4 rounded-2xl border border-amber-200/70 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-600">متوسط وقت الطبخ</span>
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-heading font-extrabold text-amber-700">
                  {avgMinutes} <span className="text-xs font-medium text-amber-600">دقيقة</span>
                </div>
                <div className="text-[11px] text-stone-500 font-medium mt-0.5">
                  تحضير + طهي
                </div>
              </div>
            </div>

            {/* 4. Average Calories */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4 rounded-2xl border border-emerald-200/70 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-600">متوسط السعرات</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                  <Flame className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-heading font-extrabold text-emerald-700">
                  {avgCalories} <span className="text-xs font-medium text-emerald-600">سعرة</span>
                </div>
                <div className="text-[11px] text-stone-500 font-medium mt-0.5">
                  {totalIngredients} مكون مستخدم إجمالاً
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Breakdown: Categories and Difficulties */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pt-2">
            {/* Categories Breakdown (2 columns wide) */}
            <div className="lg:col-span-2 space-y-3 bg-stone-50/70 p-4 rounded-2xl border border-stone-200/60">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#E26D46]" />
                  <h3 className="font-heading font-bold text-xs sm:text-sm text-[#242A26]">
                    توزيع الأطباق حسب التصنيف
                  </h3>
                </div>
                <span className="text-[11px] text-stone-500">
                  انقر على أي تصنيف لتصفيته
                </span>
              </div>

              {categoryList.length === 0 ? (
                <p className="text-xs text-stone-400 py-3 text-center">لا توجد تصنيفات بعد</p>
              ) : (
                <div className="space-y-2.5">
                  {categoryList.map(([catName, count]) => {
                    const percentage = totalRecipes > 0 ? Math.round((count / totalRecipes) * 100) : 0;
                    const isCurrent = selectedCategory === catName;
                    const icon = CATEGORY_ICONS[catName] || '🍽️';

                    return (
                      <div
                        key={catName}
                        onClick={() => onSelectCategory(isCurrent ? 'الكل' : (catName as RecipeCategory))}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-white border-[#E26D46] shadow-sm ring-2 ring-[#E26D46]/20'
                            : 'bg-white/80 hover:bg-white border-stone-200/70 hover:border-stone-300'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <div className="flex items-center gap-2 font-bold text-[#242A26]">
                            <span>{icon}</span>
                            <span>{catName}</span>
                            {isCurrent && (
                              <span className="text-[10px] font-semibold text-[#E26D46] bg-orange-50 px-1.5 py-0.5 rounded-md">
                                مُحدد
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-stone-500 font-medium">
                            <span className="text-stone-700 font-bold">{count} أطباق</span>
                            <span className="text-[11px] text-stone-400">({percentage}%)</span>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isCurrent ? 'bg-[#E26D46]' : 'bg-[#2D5A46]'
                            }`}
                            style={{ width: `${Math.max(percentage, 5)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Difficulty Breakdown (1 column wide) */}
            <div className="space-y-3 bg-stone-50/70 p-4 rounded-2xl border border-stone-200/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-[#2D5A46]" />
                  <h3 className="font-heading font-bold text-xs sm:text-sm text-[#242A26]">
                    مستوى الصعوبة
                  </h3>
                </div>

                <div className="space-y-3">
                  {/* Easy */}
                  <div className="bg-white p-3 rounded-xl border border-stone-200/70">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-emerald-700 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        سهل وبسيط
                      </span>
                      <span className="font-bold text-stone-700">
                        {difficultyCounts.سهل} وصفة
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{
                          width: `${totalRecipes > 0 ? (difficultyCounts.سهل / totalRecipes) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Medium */}
                  <div className="bg-white p-3 rounded-xl border border-stone-200/70">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-amber-700 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        متوسط
                      </span>
                      <span className="font-bold text-stone-700">
                        {difficultyCounts.متوسط} وصفة
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{
                          width: `${totalRecipes > 0 ? (difficultyCounts.متوسط / totalRecipes) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Hard */}
                  <div className="bg-white p-3 rounded-xl border border-stone-200/70">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-rose-700 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        متقدم / للمحترفين
                      </span>
                      <span className="font-bold text-stone-700">
                        {difficultyCounts.متقدم} وصفة
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full"
                        style={{
                          width: `${totalRecipes > 0 ? (difficultyCounts.متقدم / totalRecipes) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Tip box */}
              <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/70 text-[11px] text-emerald-800 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  كلما أضفت وصفات أكثر، سيقدم لك الذكاء الاصطناعي اقتراحات أدق تتناسب مع ذوقك ومكوناتك!
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
