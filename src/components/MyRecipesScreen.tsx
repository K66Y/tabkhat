import React, { useState } from 'react';
import { useRecipes } from '../context/RecipeContext';
import { Recipe, RecipeCategory } from '../types/recipe';
import { MyRecipesDashboard } from './MyRecipesDashboard';
import {
  BookOpen,
  Plus,
  Mic,
  Search,
  Trash2,
  Clock,
  Flame,
  Users,
  CalendarPlus,
  Share2,
  Heart,
  ChefHat,
  Sparkles,
  UtensilsCrossed,
  Edit3,
} from 'lucide-react';

interface MyRecipesScreenProps {
  onSelectRecipe: (recipe: Recipe) => void;
  onOpenVoiceModal: () => void;
  onAddToPlan: (recipe: Recipe) => void;
  onEditRecipe?: (recipe: Recipe) => void;
}

export const MyRecipesScreen: React.FC<MyRecipesScreenProps> = ({
  onSelectRecipe,
  onOpenVoiceModal,
  onAddToPlan,
  onEditRecipe,
}) => {
  const { myRecipes, deleteRecipe, clearMyRecipes, isFavorite, toggleFavorite, showToast } = useRecipes();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<RecipeCategory>('الكل');
  const [recipeToDelete, setRecipeToDelete] = useState<string | null>(null);
  const [showConfirmClearAll, setShowConfirmClearAll] = useState(false);

  const categories: RecipeCategory[] = [
    'الكل',
    'أطباق رئيسية',
    'أطباق خليجية وسعودية',
    'شوربات',
    'مقبلات وسلطات',
    'حلا وحلويات',
    'فطور',
    'وجبات سريعة',
    'وجبات صحية',
    'مشروبات',
  ];

  // Filter user recipes
  const filteredRecipes = myRecipes.filter((recipe) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const inTitle = recipe.title.toLowerCase().includes(q);
      const inDesc = recipe.description.toLowerCase().includes(q);
      const inIngs = recipe.ingredients.some((i) => i.name.toLowerCase().includes(q));
      if (!inTitle && !inDesc && !inIngs) return false;
    }

    if (selectedCategory !== 'الكل' && recipe.category !== selectedCategory) {
      return false;
    }

    return true;
  });

  const handleDeleteConfirm = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteRecipe(id);
    setRecipeToDelete(null);
  };

  const handleShare = async (recipe: Recipe, e: React.MouseEvent) => {
    e.stopPropagation();
    const shareText = `وصفة خاصة بي على تطبيق طبخات 🍲:\n*${recipe.title}*\n${recipe.description}\nالمقادير:\n${recipe.ingredients.map((i) => `• ${i.name} (${i.amount} ${i.unit})`).join('\n')}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: recipe.title,
          text: shareText,
        });
      } catch {
        // Ignored
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      showToast('تم نسخ تفاصيل الوصفة للمشاركة', 'info');
    }
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-[#E26D46] via-[#D15B35] to-[#B84824] text-white p-5 sm:p-6 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-36 h-36 bg-white/10 rounded-full -translate-x-12 -translate-y-12 blur-2xl" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-white mb-2 shadow-sm">
              <BookOpen className="w-3.5 h-3.5" />
              دفتر وصفاتك الشخصية
            </div>
            <h1 className="font-heading font-extrabold text-xl sm:text-2xl tracking-tight">
              وصفاتي
            </h1>
            <p className="text-xs text-orange-100 mt-1 max-w-md">
              جميع الوصفات التي قمت بإضافتها أو تسجيلها بصوتك مع الذكاء الاصطناعي ({myRecipes.length} وصفة)
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onOpenVoiceModal}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl bg-white text-[#E26D46] hover:bg-orange-50 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              إضافة وصفة جديدة
            </button>
            <button
              onClick={onOpenVoiceModal}
              className="p-2.5 rounded-2xl bg-black/20 hover:bg-black/30 text-white font-bold text-xs flex items-center justify-center shadow-md transition-all active:scale-95 backdrop-blur-md"
              title="تسجيل سريع بالصوت"
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 📊 Interactive Recipes Dashboard */}
      <MyRecipesDashboard
        recipes={myRecipes}
        isFavorite={isFavorite}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Search Bar inside My Recipes */}
      <div className="relative">
        <Search className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث في وصفاتك الخاصة (بالاسم أو المكون)..."
          className="w-full pr-12 pl-4 py-3 rounded-2xl bg-white border border-stone-200/90 text-xs sm:text-sm text-[#242A26] placeholder-stone-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E26D46]/40"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
          >
            مسح
          </button>
        )}
      </div>

      {/* Horizontal Category Filters */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 flex-1">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all active:scale-95 ${
                  isActive
                    ? 'bg-[#E26D46] text-white shadow-sm'
                    : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200/80'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {myRecipes.length > 0 && (
          <button
            type="button"
            onClick={() => setShowConfirmClearAll(true)}
            className="px-2.5 py-2 rounded-xl bg-white hover:bg-rose-50 border border-stone-200 text-stone-500 hover:text-rose-600 text-xs font-bold shrink-0 flex items-center gap-1 transition-colors"
            title="حذف جميع الوصفات المضافة في وصفاتي"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">حذف كل وصفاتي</span>
          </button>
        )}
      </div>

      {/* Recipes List */}
      {filteredRecipes.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-3xl border border-stone-200 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-orange-50 text-[#E26D46] flex items-center justify-center mx-auto shadow-inner">
            <UtensilsCrossed className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-base text-[#242A26]">
              {myRecipes.length === 0
                ? 'لا توجد وصفات مضافة في "وصفاتي" بعد'
                : 'لا توجد نتائج تطابق بحثك في وصفاتك'}
            </h3>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto leading-relaxed">
              سجل وصفتك العائلية أو السرية بصوتك وسيقوم الذكاء الاصطناعي Gemini بتفريغ مقاديرها وخطواتها تلقائياً!
            </p>
          </div>

          <button
            onClick={onOpenVoiceModal}
            className="px-5 py-3 rounded-2xl bg-[#E26D46] hover:bg-[#D15B35] text-white font-bold text-xs sm:text-sm inline-flex items-center gap-2 shadow-lg shadow-[#E26D46]/25 transition-all active:scale-95"
          >
            <Mic className="w-4 h-4" />
            سجل أول وصفة لك بصوتك الآن
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecipes.map((recipe) => {
            const favorite = isFavorite(recipe.id);

            return (
              <div
                key={recipe.id}
                onClick={() => onSelectRecipe(recipe)}
                className="group bg-white rounded-3xl overflow-hidden border border-stone-100 shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col cursor-pointer hover:-translate-y-1 relative"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
                  <img
                    src={recipe.imageUrl}
                    alt={recipe.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                  {/* Top Badges */}
                  <div className="absolute top-3 right-3 left-3 flex items-center justify-between pointer-events-none">
                    <div className="flex items-center gap-1.5">
                      <span className="bg-[#2D5A46] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        من وصفاتي
                      </span>
                      <span className="bg-black/40 backdrop-blur-md text-white text-[11px] font-medium px-2 py-0.5 rounded-full">
                        {recipe.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 pointer-events-auto">
                      {/* Favorite Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(recipe.id);
                        }}
                        className="p-1.5 rounded-full bg-white/90 backdrop-blur-md text-stone-700 hover:text-rose-600 transition-colors"
                        title={favorite ? 'إزالة من المفضلة' : 'حفظ بالمفضلة'}
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            favorite ? 'fill-rose-500 text-rose-500' : 'text-stone-600'
                          }`}
                        />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRecipeToDelete(recipe.id);
                        }}
                        className="p-1.5 rounded-full bg-white/90 backdrop-blur-md text-stone-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="حذف الوصفة من وصفاتي"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-heading font-bold text-base text-[#242A26] leading-snug line-clamp-1 group-hover:text-[#E26D46] transition-colors">
                      {recipe.title}
                    </h3>
                    <p className="text-xs text-stone-500 line-clamp-2 mt-1 leading-relaxed">
                      {recipe.description}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3 text-stone-600 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#E26D46]" />
                        {recipe.cookTime + recipe.prepTime} د
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-[#2D5A46]" />
                        {recipe.baseServings} حصص
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {onEditRecipe && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditRecipe(recipe);
                          }}
                          className="p-1.5 rounded-lg text-stone-500 hover:text-[#E26D46] hover:bg-orange-50 transition-colors"
                          title="تعديل المقادير والصورة والبيانات"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={(e) => handleShare(recipe, e)}
                        className="p-1.5 rounded-lg text-stone-500 hover:text-[#E26D46] hover:bg-orange-50 transition-colors"
                        title="مشاركة الوصفة"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToPlan(recipe);
                        }}
                        className="p-1.5 rounded-lg text-[#2D5A46] hover:bg-[#2D5A46]/10 transition-colors"
                        title="إضافة للجدول الأسبوعي"
                      >
                        <CalendarPlus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Delete Confirmation Overlay */}
                {recipeToDelete === recipe.id && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute inset-0 bg-black/75 backdrop-blur-sm p-4 rounded-3xl flex flex-col items-center justify-center text-center text-white z-20 animate-in fade-in duration-200"
                  >
                    <p className="font-bold text-sm mb-1">هل أنت متأكد من حذف هذه الوصفة؟</p>
                    <p className="text-xs text-stone-300 mb-3">لن تتمكن من استرجاعها بعد الحذف.</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleDeleteConfirm(recipe.id, e)}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-colors"
                      >
                        تأكيد الحذف
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRecipeToDelete(null);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs transition-colors"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialog to Clear All My Recipes */}
      {showConfirmClearAll && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl border border-stone-200 text-right">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-heading font-black text-base text-[#242A26]">
                حذف جميع وصفاتي الخاصة
              </h3>
              <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                هل أنت متأكد من رغبتك في حذف كافة الوصفات التي قمت بإضافتها ({myRecipes.length} وصفة)؟ لن تتمكن من استرجاعها بعد الحذف.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  clearMyRecipes();
                  setShowConfirmClearAll(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-colors"
              >
                نعم، احذف كل وصفاتي
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmClearAll(false)}
                className="flex-1 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
