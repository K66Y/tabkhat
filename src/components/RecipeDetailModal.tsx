import React, { useState } from 'react';
import { Recipe } from '../types/recipe';
import { useRecipes } from '../context/RecipeContext';
import {
  X,
  Heart,
  Share2,
  Clock,
  Flame,
  Users,
  Plus,
  Minus,
  ShoppingCart,
  Check,
  Timer,
  ChefHat,
  CalendarPlus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface RecipeDetailModalProps {
  recipe: Recipe | null;
  onClose: () => void;
  onAddToPlanModal?: (recipe: Recipe) => void;
  onEditRecipe?: (recipe: Recipe) => void;
}

export const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({
  recipe,
  onClose,
  onAddToPlanModal,
  onEditRecipe,
}) => {
  const {
    isFavorite,
    toggleFavorite,
    deleteRecipe,
    addIngredientsToShoppingList,
    shareRecipeItemsViaWhatsApp,
    startTimer,
    showToast,
  } = useRecipes();

  // Servings state
  const [servings, setServings] = useState<number>(recipe?.baseServings || 4);
  // Checked step numbers
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  // Added ingredients feedback
  const [addedAllToCart, setAddedAllToCart] = useState(false);
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({});
  // Delete confirmation modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Ingredient status: 'available' (متوفر بالبيت) or 'missing' (ناقص أحتاج شراءه)
  const [ingredientStatus, setIngredientStatus] = useState<Record<string, 'available' | 'missing'>>({});

  if (!recipe) return null;

  const favorite = isFavorite(recipe.id);

  // Scaler multiplier
  const scaleRatio = servings / (recipe.baseServings || 4);

  const formatScaledAmount = (baseAmount: number) => {
    const scaled = baseAmount * scaleRatio;
    if (Number.isInteger(scaled)) return scaled.toString();
    return scaled.toFixed(1).replace(/\.0$/, '');
  };

  const handleToggleStep = (stepNumber: number) => {
    setCompletedSteps((prev) => {
      const exists = prev.includes(stepNumber);
      const next = exists
        ? prev.filter((s) => s !== stepNumber)
        : [...prev, stepNumber];

      if (!exists && next.length === recipe.steps.length) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
        showToast('👨‍🍳 رائع! لقد أتممت طهي هذه الوصفة الشهية بنجاح!', 'success');
      }
      return next;
    });
  };

  const handleAddAllToCart = () => {
    const items = recipe.ingredients.map((ing) => ({
      name: ing.name,
      amount: `${formatScaledAmount(ing.amount)} ${ing.unit}`,
      category: ing.category,
      recipeTitle: recipe.title,
    }));

    addIngredientsToShoppingList(items);
    setAddedAllToCart(true);
    showToast(`🛒 تمت إضافة جميع مقادير ${recipe.title} للمشتريات`, 'success');
    setTimeout(() => setAddedAllToCart(false), 2500);
  };

  const handleAddSingleIngredient = (ing: (typeof recipe.ingredients)[0]) => {
    addIngredientsToShoppingList([
      {
        name: ing.name,
        amount: `${formatScaledAmount(ing.amount)} ${ing.unit}`,
        category: ing.category,
        recipeTitle: recipe.title,
      },
    ]);
    setAddedItemIds((prev) => ({ ...prev, [ing.id]: true }));
    showToast(`تمت إضافة ${ing.name} للمشتريات`, 'info');
  };

  const toggleIngredientStatus = (id: string) => {
    setIngredientStatus((prev) => {
      const current = prev[id];
      const next = current === 'missing' ? 'available' : 'missing';
      return { ...prev, [id]: next };
    });
  };

  const setSingleStatus = (id: string, status: 'available' | 'missing') => {
    setIngredientStatus((prev) => ({ ...prev, [id]: status }));
  };

  const markAllAvailable = () => {
    const next: Record<string, 'available' | 'missing'> = {};
    recipe.ingredients.forEach((ing) => {
      next[ing.id] = 'available';
    });
    setIngredientStatus(next);
    showToast('✅ تم تحديد جميع المقادير كـ "متوفرة بالبيت"', 'info');
  };

  const markAllMissing = () => {
    const next: Record<string, 'available' | 'missing'> = {};
    recipe.ingredients.forEach((ing) => {
      next[ing.id] = 'missing';
    });
    setIngredientStatus(next);
    showToast('🛒 تم تحديد جميع المقادير كـ "نواقص تحتاج شراء"', 'info');
  };

  const missingIngredients = recipe.ingredients.filter(
    (ing) => ingredientStatus[ing.id] === 'missing'
  );

  const handleSendMissingToShoppingList = () => {
    if (missingIngredients.length === 0) {
      showToast('اضغط على المقادير الناقصة أولاً لتحديدها بلون السلة 🛒', 'warning');
      return;
    }

    const items = missingIngredients.map((ing) => ({
      name: ing.name,
      amount: `${formatScaledAmount(ing.amount)} ${ing.unit}`,
      category: ing.category,
      recipeTitle: recipe.title,
    }));

    addIngredientsToShoppingList(items);

    const updatedAdded: Record<string, boolean> = { ...addedItemIds };
    missingIngredients.forEach((ing) => {
      updatedAdded[ing.id] = true;
    });
    setAddedItemIds(updatedAdded);

    showToast(`🛒 تم نقل ${items.length} من نواقص "${recipe.title}" إلى قائمة المشتريات!`, 'success');
  };

  const handleShareMealViaWhatsApp = () => {
    // If user selected missing items, send missing items; otherwise send all recipe ingredients
    const itemsToShare = missingIngredients.length > 0 ? missingIngredients : recipe.ingredients;
    const shoppingItems = itemsToShare.map((ing) => ({
      id: ing.id,
      name: ing.name,
      amount: `${formatScaledAmount(ing.amount)} ${ing.unit}`,
      category: ing.category,
      completed: false,
      recipeTitle: recipe.title,
      addedAt: Date.now(),
    }));

    shareRecipeItemsViaWhatsApp(recipe.title, shoppingItems);
  };

  const handleShare = async () => {
    const shareText = `🍳 وصفة شهية من تطبيق طبخات: ${recipe.title}\n\nالوصف: ${recipe.description}\nوقت التحضير: ${recipe.prepTime} دقيقة | وقت الطهي: ${recipe.cookTime} دقيقة`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: recipe.title,
          text: shareText,
          url: window.location.href,
        });
      } catch {
        // Ignored
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      showToast('📋 تم نسخ تفاصيل الوصفة إلى الحافظة!', 'success');
    }
  };

  const handleDeleteCurrentRecipe = () => {
    deleteRecipe(recipe.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FAF8F5] w-full max-w-2xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-stone-200">
        {/* Modal Top Header Image Banner */}
        <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden bg-stone-900">
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/20" />

          {/* Top Bar Action Buttons */}
          <div className="absolute top-4 right-4 left-4 flex items-center justify-between z-10">
            {/* Close button on right in RTL */}
            <button
              onClick={onClose}
              aria-label="إغلاق"
              className="p-2.5 rounded-full bg-white/80 hover:bg-white text-[#242A26] backdrop-blur-md shadow-md transition-transform active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Actions group on left in RTL */}
            <div className="flex items-center gap-2">
              {/* Edit Recipe Button */}
              {onEditRecipe && (
                <button
                  onClick={() => {
                    onEditRecipe(recipe);
                    onClose();
                  }}
                  aria-label="تعديل الأكلة"
                  className="p-2.5 rounded-full bg-white/80 hover:bg-orange-50 text-stone-600 hover:text-[#E26D46] backdrop-blur-md shadow-md transition-all active:scale-95"
                  title="تعديل بيانات ومقادير وصورة هذه الطبخة"
                >
                  <Edit3 className="w-5 h-5" />
                </button>
              )}

              {/* Delete Recipe Button */}
              <button
                onClick={() => setShowDeleteConfirm(true)}
                aria-label="حذف الأكلة"
                className="p-2.5 rounded-full bg-white/80 hover:bg-rose-50 text-stone-600 hover:text-rose-600 backdrop-blur-md shadow-md transition-all active:scale-95"
                title="حذف هذه الطبخة / الأكلة نهائياً"
              >
                <Trash2 className="w-5 h-5" />
              </button>

              {/* Share button */}
              <button
                onClick={handleShare}
                aria-label="مشاركة"
                className="p-2.5 rounded-full bg-white/80 hover:bg-white text-[#242A26] backdrop-blur-md shadow-md transition-transform active:scale-95"
                title="مشاركة الوصفة"
              >
                <Share2 className="w-5 h-5" />
              </button>

              {/* Favorite button */}
              <button
                onClick={() => toggleFavorite(recipe.id)}
                aria-label={favorite ? 'إزالة من المفضلة' : 'حفظ في المفضلة'}
                className="p-2.5 rounded-full bg-white/80 hover:bg-white text-[#242A26] backdrop-blur-md shadow-md transition-transform active:scale-95"
                title={favorite ? 'إزالة من المفضلة' : 'حفظ في المفضلة'}
              >
                <Heart
                  className={`w-5 h-5 transition-colors ${
                    favorite ? 'fill-rose-500 text-rose-500' : 'text-stone-700'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Hero details at bottom of image */}
          <div className="absolute bottom-4 right-4 left-4 text-white text-right">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="bg-[#E26D46] text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                {recipe.cuisine}
              </span>
              <span className="bg-white/20 backdrop-blur-md text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {recipe.category}
              </span>
            </div>
            <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-white drop-shadow-md">
              {recipe.title}
            </h1>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-right">
          {/* Quick Stats Pill Grid */}
          <div className="grid grid-cols-4 gap-2 text-center bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-sm">
            <div className="flex flex-col items-center">
              <Clock className="w-4 h-4 text-[#E26D46] mb-1" />
              <span className="text-[11px] text-stone-500 font-medium">التحضير</span>
              <span className="text-xs sm:text-sm font-bold text-[#242A26]">{recipe.prepTime} د</span>
            </div>
            <div className="flex flex-col items-center border-r border-stone-100">
              <Flame className="w-4 h-4 text-amber-500 mb-1" />
              <span className="text-[11px] text-stone-500 font-medium">الطهي</span>
              <span className="text-xs sm:text-sm font-bold text-[#242A26]">{recipe.cookTime} د</span>
            </div>
            <div className="flex flex-col items-center border-r border-stone-100">
              <Users className="w-4 h-4 text-[#2D5A46] mb-1" />
              <span className="text-[11px] text-stone-500 font-medium">الحصص</span>
              <span className="text-xs sm:text-sm font-bold text-[#242A26]">{servings} أشخاص</span>
            </div>
            <div className="flex flex-col items-center border-r border-stone-100">
              <span className="text-xs font-bold text-[#E26D46] mb-1">🔥</span>
              <span className="text-[11px] text-stone-500 font-medium">السعرات</span>
              <span className="text-xs sm:text-sm font-bold text-[#242A26]">{recipe.calories || 350}</span>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
              {recipe.description}
            </p>
          </div>

          {/* Dynamic Servings Scaler */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs flex items-center justify-between gap-4">
            <div>
              <h3 className="font-heading font-bold text-sm text-[#242A26]">
                تعديل عدد الحصص
              </h3>
              <p className="text-[11px] text-stone-500">
                تتعدل مقادير وكميات المكونات تلقائياً حسب عدد الأفراد
              </p>
            </div>

            <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-2xl">
              <button
                onClick={() => setServings((s) => Math.max(1, s - 1))}
                className="w-8 h-8 rounded-xl bg-white text-stone-700 hover:text-[#E26D46] flex items-center justify-center font-bold shadow-xs active:scale-95 transition-all"
                title="تقليل الحصص"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-10 text-center font-heading font-extrabold text-sm text-[#242A26]">
                {servings}
              </span>
              <button
                onClick={() => setServings((s) => s + 1)}
                className="w-8 h-8 rounded-xl bg-white text-stone-700 hover:text-[#E26D46] flex items-center justify-center font-bold shadow-xs active:scale-95 transition-all"
                title="زيادة الحصص"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Ingredients Section with Availability & Missing Items Selector */}
          <div className="space-y-3.5 bg-stone-50/70 p-4 rounded-3xl border border-stone-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <h2 className="font-heading font-bold text-base text-[#242A26] flex items-center gap-2">
                  <span>المقادير والطلبات ({recipe.ingredients.length})</span>
                  <span>🧂</span>
                </h2>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  حدد المقادير المتوفرة لديك بالبيت والنواقص لنقلها للمشتريات أو مشاركتها:
                </p>
              </div>

              {/* Fast presets */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={markAllAvailable}
                  className="px-2.5 py-1 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold shadow-2xs active:scale-95 transition-all"
                  title="تحديد الكل كمتوفر لديك"
                >
                  الكل متوفر بالبيت ✅
                </button>
                <button
                  type="button"
                  onClick={markAllMissing}
                  className="px-2.5 py-1 rounded-xl bg-white hover:bg-orange-50 text-[#E26D46] border border-orange-200 text-[11px] font-bold shadow-2xs active:scale-95 transition-all"
                  title="تحديد كل المقادير كنواقص تحتاج شراء"
                >
                  الكل ناقص 🛒
                </button>
              </div>
            </div>

            {/* Ingredients Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {recipe.ingredients.map((ing) => {
                const isAdded = !!addedItemIds[ing.id];
                const status = ingredientStatus[ing.id]; // 'available' | 'missing' | undefined

                return (
                  <div
                    key={ing.id}
                    className={`p-3 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-2.5 shadow-2xs ${
                      status === 'available'
                        ? 'bg-emerald-50/70 border-emerald-300'
                        : status === 'missing'
                        ? 'bg-orange-50/70 border-orange-300'
                        : 'bg-white border-stone-200/90'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            status === 'available'
                              ? 'bg-emerald-500'
                              : status === 'missing'
                              ? 'bg-[#E26D46]'
                              : 'bg-stone-300'
                          }`}
                        />
                        <div className="min-w-0">
                          <span
                            className={`text-xs sm:text-sm font-bold block truncate ${
                              status === 'available'
                                ? 'text-emerald-900 line-through decoration-emerald-500/60'
                                : 'text-[#242A26]'
                            }`}
                          >
                            {ing.name}
                          </span>
                          <span className="text-[11px] text-stone-500 font-semibold block">
                            {formatScaledAmount(ing.amount)} {ing.unit}
                          </span>
                        </div>
                      </div>

                      {/* Direct Single Item Cart Button */}
                      <button
                        type="button"
                        onClick={() => handleAddSingleIngredient(ing)}
                        className={`p-1.5 rounded-xl transition-all shrink-0 active:scale-95 ${
                          isAdded
                            ? 'bg-emerald-600 text-white'
                            : 'bg-stone-100 hover:bg-[#E26D46] hover:text-white text-stone-600'
                        }`}
                        title="إضافة هذا الصنف مباشرة لقائمة المشتريات"
                      >
                        {isAdded ? (
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        ) : (
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        )}
                      </button>
                    </div>

                    {/* Interactive Status Selector Bar */}
                    <div className="flex items-center gap-1.5 pt-1 border-t border-stone-200/60">
                      <button
                        type="button"
                        onClick={() => setSingleStatus(ing.id, 'available')}
                        className={`flex-1 py-1 px-1.5 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${
                          status === 'available'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white hover:bg-emerald-50 text-stone-600 border border-stone-200'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>متوفر عندي</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSingleStatus(ing.id, 'missing')}
                        className={`flex-1 py-1 px-1.5 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${
                          status === 'missing'
                            ? 'bg-[#E26D46] text-white shadow-xs'
                            : 'bg-white hover:bg-orange-50 text-stone-600 border border-stone-200'
                        }`}
                      >
                        <ShoppingCart className="w-3 h-3" />
                        <span>ناقص أحتاجه</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Smart Action Bar for Ingredients */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-t border-stone-200/80">
              {/* Transfer Missing or All to Cart */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleSendMissingToShoppingList}
                  className="flex-1 sm:flex-initial px-3.5 py-2 rounded-2xl bg-[#E26D46] hover:bg-[#D15B35] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>
                    {missingIngredients.length > 0
                      ? `نقل النواقص إلى المشتريات (${missingIngredients.length})`
                      : 'نقل النواقص المحددة إلى المشتريات'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleAddAllToCart}
                  className="px-3 py-2 rounded-2xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 font-bold text-xs flex items-center justify-center gap-1 shadow-2xs active:scale-95 transition-all"
                  title="إضافة جميع مقادير الطبخة للمشتريات دفعة واحدة"
                >
                  {addedAllToCart ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">تمت إضافة الكل!</span>
                    </>
                  ) : (
                    <span>إضافة كل المقادير</span>
                  )}
                </button>
              </div>

              {/* Instant WhatsApp Share for this Meal */}
              <button
                type="button"
                onClick={handleShareMealViaWhatsApp}
                className="px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                title="مشاركة طلبات ونواقص هذه الوجبة مباشرة على واتساب"
              >
                <MessageCircle className="w-4 h-4" />
                <span>
                  {missingIngredients.length > 0
                    ? `مشاركة النواقص (${missingIngredients.length}) على واتساب`
                    : 'مشاركة مقادير الوجبة على واتساب'}
                </span>
              </button>
            </div>
          </div>

          {/* Steps Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-bold text-base text-[#242A26] flex items-center gap-2">
                <span>خطوات التحضير ({recipe.steps.length})</span>
                <span>👨‍🍳</span>
              </h2>
              <span className="text-xs text-stone-500">
                أكملت {completedSteps.length} من {recipe.steps.length}
              </span>
            </div>

            <div className="space-y-3">
              {recipe.steps.map((step) => {
                const isDone = completedSteps.includes(step.stepNumber);
                return (
                  <div
                    key={step.stepNumber}
                    onClick={() => handleToggleStep(step.stepNumber)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                      isDone
                        ? 'bg-emerald-50/60 border-emerald-200 text-stone-500'
                        : 'bg-white border-stone-200/90 shadow-2xs hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs transition-colors ${
                          isDone
                            ? 'bg-emerald-500 text-white'
                            : 'bg-stone-100 text-stone-600 border border-stone-200'
                        }`}
                      >
                        {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : step.stepNumber}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-xs sm:text-sm leading-relaxed ${
                            isDone ? 'line-through text-stone-400' : 'text-[#242A26] font-medium'
                          }`}
                        >
                          {step.instruction}
                        </p>

                        {/* Interactive Timer button inside step if specified */}
                        {step.timerMinutes && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="mt-3 flex items-center justify-between bg-orange-50/80 p-2.5 rounded-xl border border-orange-200/70"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                startTimer(
                                  `خطوة ${step.stepNumber}: ${recipe.title}`,
                                  step.timerMinutes!,
                                  recipe.title,
                                  step.stepNumber
                                );
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E26D46] hover:bg-[#D15B35] text-white text-xs font-bold transition-colors shadow-2xs active:scale-95"
                            >
                              <Timer className="w-4 h-4 animate-pulse" />
                              <span>تشغيل مؤقت ({step.timerMinutes} دقيقة)</span>
                            </button>

                            <span className="text-[11px] text-stone-500 font-medium">مؤقت ذكي مدمج</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Edit & Delete Recipe Actions at the bottom of content */}
          <div className="pt-3 pb-1 border-t border-stone-200/80 flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs text-stone-500">
              خيارات التعديل والحذف لهذه الوصفة:
            </span>
            <div className="flex items-center gap-2">
              {onEditRecipe && (
                <button
                  type="button"
                  onClick={() => {
                    onEditRecipe(recipe);
                    onClose();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#E26D46] border border-orange-200 text-xs font-bold flex items-center gap-1.5 transition-colors active:scale-95"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>تعديل المقادير والبيانات</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-colors active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف الأكلة</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer with Actions */}
        <div className="p-4 bg-white border-t border-stone-200/80 flex items-center gap-3 shrink-0">
          {onAddToPlanModal && (
            <button
              onClick={() => {
                onAddToPlanModal(recipe);
                onClose();
              }}
              className="flex-1 py-3 px-4 rounded-2xl bg-[#FAF8F5] border border-stone-300 hover:bg-stone-100 text-[#242A26] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors active:scale-98"
            >
              <CalendarPlus className="w-4 h-4 text-[#2D5A46]" />
              <span>إضافة للجدول</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-2xl bg-[#E26D46] hover:bg-[#D15B35] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-[#E26D46]/20 transition-all active:scale-98"
          >
            <ChefHat className="w-4 h-4" />
            <span>جاهز للطبخ!</span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl border border-stone-200 text-right">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-black text-base text-[#242A26]">
                تأكيد حذف الأكلة
              </h3>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                هل أنت متأكد من حذف طبخة <strong className="text-rose-600 font-bold">"{recipe.title}"</strong>؟ سيتم إزالتها نهائياً من التطبيق، المفضلة، وجدول الوجبات.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleDeleteCurrentRecipe}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-colors"
              >
                نعم، احذف الطبخة
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition-colors"
              >
                تراجع
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
