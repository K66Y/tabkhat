import React, { useState } from 'react';
import { useRecipes } from '../context/RecipeContext';
import { IngredientCategory, ShoppingItem } from '../types/recipe';
import {
  ShoppingCart,
  Plus,
  Trash2,
  Share2,
  CheckCircle,
  Circle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Utensils,
  Layers,
} from 'lucide-react';

export const ShoppingList: React.FC = () => {
  const {
    shoppingList,
    toggleShoppingItem,
    removeShoppingItem,
    addManualShoppingItem,
    clearCompletedShoppingItems,
    clearAllShoppingList,
    shareShoppingListViaWhatsApp,
    shareRecipeItemsViaWhatsApp,
  } = useRecipes();

  const [itemName, setItemName] = useState('');
  const [itemAmount, setItemAmount] = useState('');
  const [category, setCategory] = useState<IngredientCategory>('خضار وفواكه');
  const [viewMode, setViewMode] = useState<'byMeal' | 'byCategory'>('byMeal');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const categoriesOrder: IngredientCategory[] = [
    'خضار وفواكه',
    'لحوم ودواجن',
    'توابل وبهارات',
    'معلبات ومؤونة',
    'ألبان وأجبان',
    'أخرى',
  ];

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;
    addManualShoppingItem(itemName, category, itemAmount || undefined);
    setItemName('');
    setItemAmount('');
  };

  const toggleCategoryCollapse = (cat: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  // Group items by category
  const groupedByCategory: Record<string, ShoppingItem[]> = {};
  categoriesOrder.forEach((c) => {
    groupedByCategory[c] = [];
  });

  // Group items by Meal / Recipe
  const groupedByMeal: Record<string, ShoppingItem[]> = {};

  shoppingList.forEach((item) => {
    const cat = item.category || 'أخرى';
    if (!groupedByCategory[cat]) groupedByCategory[cat] = [];
    groupedByCategory[cat].push(item);

    const mealKey = item.recipeTitle ? item.recipeTitle : 'طلبات عامة إضافية';
    if (!groupedByMeal[mealKey]) groupedByMeal[mealKey] = [];
    groupedByMeal[mealKey].push(item);
  });

  const totalCount = shoppingList.length;
  const completedCount = shoppingList.filter((i) => i.completed).length;

  return (
    <div className="space-y-6 pb-24">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-[#E26D46] to-[#C95732] text-white p-5 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-white mb-2">
              <ShoppingCart className="w-3.5 h-3.5" />
              قائمة مشتريات ذكية
            </div>
            <h1 className="font-heading font-extrabold text-xl sm:text-2xl">
              مشتريات السوبرماركت
            </h1>
            <p className="text-xs text-orange-100 mt-1">
              مفرزة حسب الأقسام ليسهل تسوقها بسلاسة ({completedCount} مكتمل من {totalCount})
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={shareShoppingListViaWhatsApp}
              className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-2xl bg-white text-[#242A26] hover:bg-stone-100 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
              title="مشاركة مرتبة عبر واتساب"
            >
              <Share2 className="w-4 h-4 text-emerald-600" />
              مشاركة واتساب
            </button>

            {completedCount > 0 && (
              <button
                onClick={clearCompletedShoppingItems}
                className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-2xl bg-black/20 hover:bg-black/30 text-white font-bold text-xs flex items-center justify-center gap-1.5 backdrop-blur-md transition-all active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                حذف المكتمل
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Manual Quick Add Form */}
      <form
        onSubmit={handleAddItem}
        className="bg-white p-4 rounded-3xl border border-stone-200/90 shadow-sm space-y-3"
      >
        <div className="flex items-center justify-between">
          <span className="font-heading font-bold text-xs sm:text-sm text-[#242A26] flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-[#E26D46]" />
            إضافة غرض جديد سريعاً
          </span>
          {totalCount > 0 && (
            <button
              type="button"
              onClick={clearAllShoppingList}
              className="text-[11px] text-stone-400 hover:text-rose-500 font-medium transition-colors"
            >
              مسح الكل
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
          <input
            type="text"
            required
            placeholder="اسم الغرض (مثال: حليب المراعي، صدور دجاج...)"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            className="sm:col-span-5 p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#E26D46]/40"
          />

          <input
            type="text"
            placeholder="الكمية (مثال: 1 كيلو، علبتين)"
            value={itemAmount}
            onChange={(e) => setItemAmount(e.target.value)}
            className="sm:col-span-3 p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#E26D46]/40"
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as IngredientCategory)}
            className="sm:col-span-3 p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#E26D46]/40"
          >
            {categoriesOrder.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="sm:col-span-1 p-2.5 rounded-xl bg-[#E26D46] hover:bg-[#D15B35] text-white flex items-center justify-center font-bold text-xs shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* View Switcher Bar */}
      {totalCount > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-stone-100/80 p-1.5 rounded-2xl border border-stone-200">
          <div className="flex items-center gap-1 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setViewMode('byMeal')}
              className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                viewMode === 'byMeal'
                  ? 'bg-white text-[#242A26] shadow-xs'
                  : 'text-stone-600 hover:text-[#242A26]'
              }`}
            >
              <Utensils className="w-3.5 h-3.5 text-[#E26D46]" />
              <span>فرز حسب الوجبة والطبخة 🍲</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('byCategory')}
              className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                viewMode === 'byCategory'
                  ? 'bg-white text-[#242A26] shadow-xs'
                  : 'text-stone-600 hover:text-[#242A26]'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#2D5A46]" />
              <span>فرز حسب أقسام السوبرماركت 🛒</span>
            </button>
          </div>

          <span className="text-[11px] text-stone-500 font-medium px-2 text-center sm:text-right">
            {viewMode === 'byMeal'
              ? 'مفرزة لكل طبخة مع زر مشاركة واتساب مخصص'
              : 'مفرزة حسب ممرات السوبرماركت'}
          </span>
        </div>
      )}

      {/* Shopping Lists */}
      {totalCount === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-stone-200">
          <div className="w-16 h-16 rounded-full bg-orange-50 text-[#E26D46] flex items-center justify-center mx-auto mb-3">
            <ShoppingCart className="w-8 h-8" />
          </div>
          <h3 className="font-heading font-bold text-base text-[#242A26]">قائمة المشتريات فارغة</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            أضف أغراضك يدوياً أعلاه، أو اضغط على "إضافة للمشتريات" من أي وصفة أو من جدول الطبخ الأسبوعي!
          </p>
        </div>
      ) : viewMode === 'byMeal' ? (
        /* View By Meal / Recipe */
        <div className="space-y-4">
          {Object.entries(groupedByMeal).map(([mealTitle, items]) => {
            if (items.length === 0) return null;
            const completedInMeal = items.filter((i) => i.completed).length;

            return (
              <div
                key={mealTitle}
                className="bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden"
              >
                {/* Meal Header with Per-Meal WhatsApp Share */}
                <div className="p-3.5 bg-gradient-to-r from-stone-50 to-orange-50/40 flex flex-wrap items-center justify-between gap-2.5 border-b border-stone-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-orange-100/80 text-[#E26D46] flex items-center justify-center">
                      <Utensils className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-heading font-bold text-sm text-[#242A26] block">
                        {mealTitle}
                      </span>
                      <span className="text-[11px] text-stone-500">
                        {completedInMeal} من {items.length} صنف مكتمل
                      </span>
                    </div>
                  </div>

                  {/* Share this specific meal to WhatsApp */}
                  <button
                    type="button"
                    onClick={() => shareRecipeItemsViaWhatsApp(mealTitle, items)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
                    title={`مشاركة طلبات "${mealTitle}" على واتساب`}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>مشاركة هذه الوجبة على واتساب 📲</span>
                  </button>
                </div>

                {/* Items in Meal */}
                <div className="divide-y divide-stone-100">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 sm:p-3.5 flex items-center justify-between gap-3 transition-colors ${
                        item.completed ? 'bg-stone-50/60' : 'hover:bg-orange-50/20'
                      }`}
                    >
                      <div
                        onClick={() => toggleShoppingItem(item.id)}
                        className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                      >
                        <button
                          type="button"
                          className={`w-6 h-6 rounded-full flex items-center justify-center transition-all shrink-0 ${
                            item.completed
                              ? 'bg-emerald-600 text-white'
                              : 'border-2 border-stone-300 text-transparent hover:border-[#E26D46]'
                          }`}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>

                        <div className="min-w-0">
                          <span
                            className={`text-xs sm:text-sm font-medium block truncate ${
                              item.completed
                                ? 'line-through text-stone-400'
                                : 'text-[#242A26]'
                            }`}
                          >
                            {item.name}
                          </span>
                          <span className="text-[10px] text-stone-400 font-normal block truncate">
                            قسم: {item.category}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        {item.amount && (
                          <span
                            className={`text-xs font-bold px-2 py-1 rounded-lg ${
                              item.completed
                                ? 'bg-stone-100 text-stone-400'
                                : 'bg-amber-50 text-amber-800'
                            }`}
                          >
                            {item.amount}
                          </span>
                        )}

                        <button
                          onClick={() => removeShoppingItem(item.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* View By Category */
        <div className="space-y-4">
          {categoriesOrder.map((cat) => {
            const items = groupedByCategory[cat] || [];
            if (items.length === 0) return null;

            const isCollapsed = collapsedCategories[cat];
            const catCompleted = items.filter((i) => i.completed).length;

            return (
              <div
                key={cat}
                className="bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden"
              >
                {/* Category Header Accordion */}
                <button
                  type="button"
                  onClick={() => toggleCategoryCollapse(cat)}
                  className="w-full p-3.5 bg-stone-50/80 hover:bg-stone-100/80 flex items-center justify-between border-b border-stone-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-sm text-[#242A26]">
                      {cat}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-stone-200/70 text-stone-700">
                      {catCompleted}/{items.length}
                    </span>
                  </div>

                  {isCollapsed ? (
                    <ChevronDown className="w-4 h-4 text-stone-400" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-stone-400" />
                  )}
                </button>

                {/* Category Items */}
                {!isCollapsed && (
                  <div className="divide-y divide-stone-100">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 sm:p-3.5 flex items-center justify-between gap-3 transition-colors ${
                          item.completed ? 'bg-stone-50/60' : 'hover:bg-orange-50/20'
                        }`}
                      >
                        <div
                          onClick={() => toggleShoppingItem(item.id)}
                          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                        >
                          <button
                            type="button"
                            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all shrink-0 ${
                              item.completed
                                ? 'bg-emerald-600 text-white'
                                : 'border-2 border-stone-300 text-transparent hover:border-[#E26D46]'
                            }`}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>

                          <div className="min-w-0">
                            <span
                              className={`text-xs sm:text-sm font-medium block truncate ${
                                item.completed
                                ? 'line-through text-stone-400'
                                : 'text-[#242A26]'
                            }`}
                          >
                            {item.name}
                          </span>
                          {item.recipeTitle && (
                            <span className="text-[10px] text-[#2D5A46] font-normal block truncate">
                              لوصفة: {item.recipeTitle}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {item.amount && (
                          <span
                            className={`text-xs font-bold px-2 py-1 rounded-lg ${
                              item.completed
                                ? 'bg-stone-100 text-stone-400'
                                : 'bg-amber-50 text-amber-800'
                            }`}
                          >
                            {item.amount}
                          </span>
                        )}

                        <button
                          onClick={() => removeShoppingItem(item.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    )}
    </div>
  );
};
