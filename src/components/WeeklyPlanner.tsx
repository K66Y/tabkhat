import React, { useState } from 'react';
import { useRecipes } from '../context/RecipeContext';
import { Recipe, MealType } from '../types/recipe';
import {
  Calendar,
  Sparkles,
  ShoppingCart,
  Plus,
  Trash2,
  Clock,
  CheckCircle2,
  X,
  Search,
} from 'lucide-react';

interface WeeklyPlannerProps {
  onSelectRecipe: (recipe: Recipe) => void;
}

export const WeeklyPlanner: React.FC<WeeklyPlannerProps> = ({ onSelectRecipe }) => {
  const {
    mealPlan,
    recipes,
    addMealToPlan,
    removeMealFromPlan,
    autoGenerateWeeklyPlan,
    exportWeekToShoppingList,
  } = useRecipes();

  const [activeDay, setActiveDay] = useState<string>('السبت');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [targetSlot, setTargetSlot] = useState<{ day: string; mealType: MealType } | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');

  const currentDayPlan = mealPlan.find((d) => d.day === activeDay) || {
    day: activeDay,
    meals: {},
  };

  const mealSlots: { type: MealType; label: string; iconEmoji: string }[] = [
    { type: 'فطور', label: 'وجبة الفطور', iconEmoji: '🍳' },
    { type: 'غداء', label: 'وجبة الغداء', iconEmoji: '🍲' },
    { type: 'عشاء', label: 'وجبة العشاء', iconEmoji: '🥗' },
  ];

  const handleOpenPicker = (day: string, mealType: MealType) => {
    setTargetSlot({ day, mealType });
    setIsPickerOpen(true);
  };

  const handleSelectRecipeForSlot = (recipe: Recipe) => {
    if (targetSlot) {
      addMealToPlan(targetSlot.day, targetSlot.mealType, recipe);
    }
    setIsPickerOpen(false);
    setTargetSlot(null);
  };

  const filteredPickerRecipes = recipes.filter(
    (r) =>
      r.title.includes(pickerSearch) ||
      r.category.includes(pickerSearch) ||
      r.cuisine.includes(pickerSearch)
  );

  return (
    <div className="space-y-6 pb-24">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-[#2D5A46] to-[#1E3E30] text-white p-5 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-full -translate-x-12 -translate-y-12 blur-2xl" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-emerald-200 mb-2">
              <Calendar className="w-3.5 h-3.5" />
              تنظيم وتخطيط الوجبات
            </div>
            <h1 className="font-heading font-extrabold text-xl sm:text-2xl">
              جدول الطبخ الأسبوعي
            </h1>
            <p className="text-xs text-emerald-100/80 mt-1">
              خطط لوجبات عائلتك مسبقاً ووفّر الوقت والجهد طوال الأسبوع
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={autoGenerateWeeklyPlan}
              className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/30 transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              اقتراح جدول ذكي
            </button>

            <button
              onClick={exportWeekToShoppingList}
              className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-2xl bg-white text-[#2D5A46] hover:bg-emerald-50 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
            >
              <ShoppingCart className="w-4 h-4" />
              تصدير للمشتريات
            </button>
          </div>
        </div>
      </div>

      {/* Days Selector Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {mealPlan.map((d) => {
          const isActive = d.day === activeDay;
          const mealsCount = Object.values(d.meals).filter(Boolean).length;

          return (
            <button
              key={d.day}
              onClick={() => setActiveDay(d.day)}
              className={`px-4 py-3 rounded-2xl shrink-0 transition-all flex flex-col items-center min-w-[76px] ${
                isActive
                  ? 'bg-[#E26D46] text-white shadow-md shadow-[#E26D46]/25 font-bold scale-105'
                  : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200/80'
              }`}
            >
              <span className="text-xs font-heading font-bold">{d.day}</span>
              <span
                className={`text-[10px] mt-1 px-1.5 py-0.5 rounded-md ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : mealsCount > 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-stone-100 text-stone-500'
                }`}
              >
                {mealsCount > 0 ? `${mealsCount} وجبات` : 'فارغ'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Meals of the active day */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-bold text-base sm:text-lg text-[#242A26]">
            وجبات يوم {activeDay}
          </h2>
          <span className="text-xs text-stone-500">3 وجبات رئيسية</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {mealSlots.map((slot) => {
            const recipe = currentDayPlan.meals[slot.type];

            return (
              <div
                key={slot.type}
                className="bg-white rounded-3xl border border-stone-200/90 shadow-sm p-4 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{slot.iconEmoji}</span>
                    <span className="font-heading font-bold text-sm text-[#242A26]">
                      {slot.label}
                    </span>
                  </div>

                  {recipe && (
                    <button
                      onClick={() => removeMealFromPlan(activeDay, slot.type)}
                      className="p-1.5 text-stone-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
                      title="إزالة الوجبة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {recipe ? (
                  <div
                    onClick={() => onSelectRecipe(recipe)}
                    className="group cursor-pointer bg-stone-50 rounded-2xl overflow-hidden border border-stone-200/60 hover:border-[#E26D46]/40 transition-all p-2.5 flex items-center gap-3"
                  >
                    <img
                      src={recipe.imageUrl}
                      alt={recipe.title}
                      className="w-16 h-16 rounded-xl object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-xs sm:text-sm text-[#242A26] truncate group-hover:text-[#E26D46] transition-colors">
                        {recipe.title}
                      </h4>
                      <p className="text-[11px] text-stone-500 mt-0.5 truncate">
                        {recipe.cuisine} • {recipe.category}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-600 font-medium">
                        <span className="flex items-center gap-0.5 text-[#E26D46]">
                          <Clock className="w-3 h-3" />
                          {recipe.cookTime + recipe.prepTime} د
                        </span>
                        <span>•</span>
                        <span>{recipe.calories} سعرة</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleOpenPicker(activeDay, slot.type)}
                    className="w-full py-6 rounded-2xl border-2 border-dashed border-stone-200 hover:border-[#E26D46] hover:bg-orange-50/50 flex flex-col items-center justify-center gap-2 text-stone-500 hover:text-[#E26D46] transition-all group"
                  >
                    <div className="w-9 h-9 rounded-full bg-stone-100 group-hover:bg-[#E26D46] group-hover:text-white flex items-center justify-center transition-colors">
                      <Plus className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold">إضافة وجبة {slot.type}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recipe Picker Modal */}
      {isPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-end sm:items-center p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div
            className="bg-[#FAF8F5] w-full max-w-lg max-h-[85vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-stone-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-white border-b border-stone-200 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-heading font-bold text-base text-[#242A26]">
                  اختر وجبة لـ {targetSlot?.mealType} ({targetSlot?.day})
                </h3>
                <p className="text-xs text-stone-500">اختر من وصفاتك اللذيذة</p>
              </div>
              <button
                onClick={() => setIsPickerOpen(false)}
                className="p-2 rounded-full hover:bg-stone-100 text-stone-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="p-3 bg-stone-50 border-b border-stone-200">
              <div className="relative">
                <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  placeholder="ابحث بالاسم أو التصنيف..."
                  className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-white border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#E26D46]/40"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {filteredPickerRecipes.map((r) => (
                <div
                  key={r.id}
                  onClick={() => handleSelectRecipeForSlot(r)}
                  className="p-3 bg-white hover:bg-orange-50/70 rounded-2xl border border-stone-200/80 flex items-center justify-between gap-3 cursor-pointer transition-all shadow-sm group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={r.imageUrl}
                      alt={r.title}
                      className="w-12 h-12 rounded-xl object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs sm:text-sm text-[#242A26] truncate group-hover:text-[#E26D46]">
                        {r.title}
                      </h4>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        {r.cuisine} • {r.cookTime + r.prepTime} دقيقة
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-[#E26D46] px-3 py-1.5 rounded-xl bg-orange-50 group-hover:bg-[#E26D46] group-hover:text-white transition-colors shrink-0">
                    اختيار
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
