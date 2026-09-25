import React, { useState } from 'react';
import { useRecipes } from '../context/RecipeContext';
import { Recipe, RecipeCategory } from '../types/recipe';
import { RecipeCard } from './RecipeCard';
import {
  Search,
  Calendar,
  ShoppingCart,
  Lightbulb,
  Clock,
  Mic,
  Heart,
  Bookmark,
  Users,
  Flame,
  ChevronLeft,
  Trash2,
} from 'lucide-react';

interface HomeScreenProps {
  onSelectRecipe: (recipe: Recipe) => void;
  onOpenFridge: () => void;
  onOpenVoiceRecipe: () => void;
  onAddToPlan: (recipe: Recipe) => void;
  onNavigateToCategory: (category: RecipeCategory) => void;
  onNavigateToSearch: () => void;
  onNavigateToPlanner: () => void;
  onNavigateToShopping: () => void;
  onOpenTimer?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectRecipe,
  onOpenFridge,
  onOpenVoiceRecipe,
  onAddToPlan,
  onNavigateToCategory,
  onNavigateToSearch,
  onNavigateToPlanner,
  onNavigateToShopping,
  onOpenTimer,
}) => {
  const { recipes, isFavorite, toggleFavorite, deleteRecipe, startTimer } = useRecipes();

  const [activeCategory, setActiveCategory] = useState<string>('شعبي وخليجي');
  const [searchQuery, setSearchQuery] = useState('');
  const [showHeroConfirmDelete, setShowHeroConfirmDelete] = useState(false);

  const categories = [
    { label: 'شعبي وخليجي', icon: '🍲' },
    { label: 'أطباق رئيسية', icon: '🥘' },
    { label: 'فطور', icon: '🍳' },
    { label: 'مقبلات وسلطات', icon: '🥗' },
    { label: 'حلويات', icon: '🍰' },
    { label: 'صحي ودايت', icon: '🥑' },
    { label: 'وجبات سريعة', icon: '⏱️' },
    { label: 'مشروبات', icon: '☕' },
  ];

  // Meal of the Day: Featured Kabsa or first featured recipe
  const mealOfTheDay =
    recipes.find((r) => r.id.includes('kabsa') || r.isFeatured) || recipes[0];
  const isMealFavorited = mealOfTheDay ? isFavorite(mealOfTheDay.id) : false;

  // Recent/latest recipes (IMG_2070.png)
  const latestRecipes = recipes.filter((r) => r.id !== mealOfTheDay?.id);

  // Category filter
  const displayedCategoryRecipes = recipes.filter((r) => {
    if (activeCategory === 'شعبي وخليجي') {
      return r.category.includes('خليجي') || r.cuisine === 'سعودي' || r.category.includes('شعبي');
    }
    return r.category.includes(activeCategory) || r.tags?.includes(activeCategory);
  });

  const handleStartTimerQuick = () => {
    if (onOpenTimer) {
      onOpenTimer();
    } else {
      startTimer('مؤقت الطبخ السريع', 15);
    }
  };

  return (
    <div className="space-y-5 pb-24 animate-in fade-in duration-200">
      {/* 🔍 Top Search Bar (Matches IMG_2067) */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onNavigateToSearch();
          }}
          placeholder="ابحث عن طبخة، مكونات (دجاج، أرز)..."
          className="w-full pr-4 pl-11 py-3 rounded-2xl bg-white border border-stone-200/90 text-xs sm:text-sm text-[#242A26] placeholder-stone-400 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#2D5A46]/20 transition-all text-right"
        />
        <button
          onClick={onNavigateToSearch}
          type="button"
          aria-label="بحث"
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors"
        >
          <Search className="w-5 h-5 stroke-[2]" />
        </button>
      </div>

      {/* ⚡ 4 Quick Action Cards (Matches IMG_2067) */}
      <div className="grid grid-cols-4 gap-2.5">
        {/* 1. جدول الطبخ (On Right in RTL) */}
        <button
          onClick={onNavigateToPlanner}
          type="button"
          className="bg-white p-3 rounded-2xl border border-stone-200/80 shadow-2xs hover:shadow-xs flex flex-col items-center justify-center text-center group active:scale-95 transition-all"
        >
          <div className="w-11 h-11 rounded-2xl bg-[#FFF5F2] text-[#E26D46] flex items-center justify-center mb-1.5 shadow-2xs group-hover:scale-105 transition-transform">
            <div className="relative">
              <Calendar className="w-6 h-6 stroke-[1.8]" />
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-black text-[#E26D46]">
                17
              </span>
            </div>
          </div>
          <span className="text-[11px] font-bold text-[#242A26] tracking-tight">جدول الطبخ</span>
        </button>

        {/* 2. المشتريات */}
        <button
          onClick={onNavigateToShopping}
          type="button"
          className="bg-white p-3 rounded-2xl border border-stone-200/80 shadow-2xs hover:shadow-xs flex flex-col items-center justify-center text-center group active:scale-95 transition-all"
        >
          <div className="w-11 h-11 rounded-2xl bg-[#EBF3EF] text-[#2D5A46] flex items-center justify-center mb-1.5 shadow-2xs group-hover:scale-105 transition-transform">
            <ShoppingCart className="w-5 h-5 stroke-[2]" />
          </div>
          <span className="text-[11px] font-bold text-[#242A26] tracking-tight">المشتريات</span>
        </button>

        {/* 3. ماذا أطبخ؟ */}
        <button
          onClick={onOpenFridge}
          type="button"
          className="bg-white p-3 rounded-2xl border border-stone-200/80 shadow-2xs hover:shadow-xs flex flex-col items-center justify-center text-center group active:scale-95 transition-all"
        >
          <div className="w-11 h-11 rounded-2xl bg-[#FFF9E6] text-amber-600 flex items-center justify-center mb-1.5 shadow-2xs group-hover:scale-105 transition-transform">
            <Lightbulb className="w-5 h-5 stroke-[2]" />
          </div>
          <span className="text-[11px] font-bold text-[#242A26] tracking-tight">ماذا أطبخ؟</span>
        </button>

        {/* 4. المؤقت (On Left in RTL) */}
        <button
          onClick={handleStartTimerQuick}
          type="button"
          className="bg-white p-3 rounded-2xl border border-stone-200/80 shadow-2xs hover:shadow-xs flex flex-col items-center justify-center text-center group active:scale-95 transition-all"
        >
          <div className="w-11 h-11 rounded-2xl bg-stone-100 text-stone-700 flex items-center justify-center mb-1.5 shadow-2xs group-hover:scale-105 transition-transform">
            <Clock className="w-5 h-5 stroke-[2]" />
          </div>
          <span className="text-[11px] font-bold text-[#242A26] tracking-tight">المؤقت</span>
        </button>
      </div>

      {/* 🎙️ Voice Recording Banner (Matches IMG_2067: Mic on Right, Text in Middle, 'تحدث' on Left) */}
      <div className="bg-[#FFF6F0] rounded-2xl p-3.5 border border-orange-200/70 shadow-2xs flex items-center justify-between gap-3">
        {/* Right Side in RTL: Mic Icon + Text */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Orange Mic Box on Right */}
          <div
            onClick={onOpenVoiceRecipe}
            className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#E26D46] to-[#FF8155] text-white flex items-center justify-center shrink-0 shadow-sm cursor-pointer hover:scale-105 transition-transform"
          >
            <Mic className="w-5 h-5" />
          </div>

          <div className="text-right min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-heading font-extrabold text-xs sm:text-sm text-[#242A26]">
                تسجيل وصفة بالصوت
              </h3>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#E26D46] text-white">
                جديد
              </span>
            </div>
            <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
              تكلم بالمقادير والكميات.. وسنوزعها في الخانات المناسبة فوراً!
            </p>
          </div>
        </div>

        {/* Left Side in RTL: 'تحدث 🎤' Button */}
        <button
          onClick={onOpenVoiceRecipe}
          type="button"
          className="px-3.5 py-1.5 rounded-xl bg-white border border-stone-200/90 shadow-2xs text-xs font-bold text-[#242A26] hover:bg-stone-50 active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
        >
          <span>تحدث</span>
          <span>🎤</span>
        </button>
      </div>

      {/* 🌟 اقتراح اليوم (Matches IMG_2067 Hero Card: Title on Right, 'مختار بعناية لك' on Left) */}
      {mealOfTheDay && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            {/* Right: Section Title */}
            <div className="flex items-center gap-1.5">
              <h2 className="font-heading font-black text-base sm:text-lg text-[#242A26]">
                اقتراح اليوم
              </h2>
              <span className="text-amber-500 text-sm">🌟</span>
            </div>

            {/* Left: Tagline */}
            <span className="text-xs text-stone-400 font-medium">مختار بعناية لك</span>
          </div>

          <div
            onClick={() => onSelectRecipe(mealOfTheDay)}
            className="group relative rounded-3xl overflow-hidden shadow-md cursor-pointer border border-stone-200/80 bg-stone-900"
          >
            {/* Image */}
            <div className="relative aspect-[16/11] sm:aspect-[21/10] w-full overflow-hidden">
              <img
                src={mealOfTheDay.imageUrl}
                alt={mealOfTheDay.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/20" />

              {/* Tag (Top Right) */}
              <div className="absolute top-3.5 right-3.5">
                <span className="bg-white/95 backdrop-blur-md text-[#242A26] text-xs font-bold px-3 py-1 rounded-full shadow-xs">
                  {mealOfTheDay.category === 'أطباق خليجية وسعودية' ? 'شعبي وخليجي' : mealOfTheDay.category}
                </span>
              </div>

              {/* Top Left Floating Buttons: Heart & Bookmark */}
              <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
                {/* Bookmark / Add to Plan */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToPlan(mealOfTheDay);
                  }}
                  className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-md text-stone-700 hover:text-[#2D5A46] flex items-center justify-center shadow-xs active:scale-90 transition-transform"
                  title="إضافة للجدول"
                >
                  <Bookmark className="w-4 h-4" />
                </button>

                {/* Favorite */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(mealOfTheDay.id);
                  }}
                  className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-md text-stone-700 hover:text-rose-500 flex items-center justify-center shadow-xs active:scale-90 transition-transform"
                  title="المفضلة"
                >
                  <Heart
                    className={`w-4 h-4 transition-colors ${
                      isMealFavorited ? 'fill-[#E26D46] text-[#E26D46]' : 'text-stone-600'
                    }`}
                  />
                </button>

                {/* Delete Hero Meal */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowHeroConfirmDelete(true);
                  }}
                  className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-md text-stone-600 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center shadow-xs active:scale-90 transition-transform"
                  title="حذف هذه الطبخة"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Hero Delete Confirmation Overlay */}
              {showHeroConfirmDelete && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute inset-0 bg-black/85 backdrop-blur-xs p-4 rounded-3xl flex flex-col items-center justify-center text-center text-white z-20 animate-in fade-in duration-150"
                >
                  <Trash2 className="w-7 h-7 text-rose-400 mb-1.5" />
                  <p className="font-heading font-bold text-sm mb-1">
                    حذف "{mealOfTheDay.title}"؟
                  </p>
                  <p className="text-xs text-stone-300 mb-3">
                    سيتم حذف هذه الطبخة واقتراح طبخة بديلة لك.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteRecipe(mealOfTheDay.id);
                        setShowHeroConfirmDelete(false);
                      }}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-colors"
                    >
                      نعم، احذف الطبخة
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowHeroConfirmDelete(false);
                      }}
                      className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs transition-colors"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              )}

              {/* Hero Card Bottom Overlay Info */}
              <div className="absolute bottom-3.5 right-3.5 left-3.5 text-white">
                {/* Stats Row */}
                <div className="flex items-center justify-start gap-3 text-[11px] text-stone-200 mb-1 font-medium">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-300" />
                    <span>{mealOfTheDay.cookTime + mealOfTheDay.prepTime} دقيقة</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-stone-300" />
                    <span>{mealOfTheDay.baseServings || 4} أشخاص</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>{mealOfTheDay.calories || 580} ك.س</span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="font-heading font-black text-lg sm:text-2xl text-white text-right leading-tight drop-shadow-sm">
                  {mealOfTheDay.title}
                </h3>

                {/* Subtitle */}
                <p className="text-xs text-stone-200/90 text-right line-clamp-1 mt-1 drop-shadow-xs">
                  {mealOfTheDay.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🏷️ تصنيفات الطبخ (Title on Right, 'عرض الكل' on Left) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          {/* Right: Section Title */}
          <h2 className="font-heading font-black text-base sm:text-lg text-[#242A26]">
            تصنيفات الطبخ
          </h2>

          {/* Left: View All button */}
          <button
            onClick={onNavigateToSearch}
            className="text-xs text-stone-500 hover:text-[#2D5A46] font-bold flex items-center gap-0.5"
          >
            <span>عرض الكل</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Horizontal Category Strip */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.label;
            return (
              <button
                key={cat.label}
                onClick={() => {
                  setActiveCategory(cat.label);
                  onNavigateToCategory(cat.label as RecipeCategory);
                }}
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
      </div>

      {/* 🥗 أحدث الوصفات (Title on Right, 'المزيد' on Left) */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between px-1">
          {/* Right: Section Title */}
          <div className="flex items-center gap-1.5">
            <span>🥗</span>
            <h2 className="font-heading font-black text-base sm:text-lg text-[#242A26]">
              أحدث الوصفات
            </h2>
          </div>

          {/* Left: More button */}
          <button
            onClick={onNavigateToSearch}
            className="text-xs text-stone-500 hover:text-[#2D5A46] font-bold flex items-center gap-0.5"
          >
            <span>المزيد</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* 2-Column Responsive Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {(displayedCategoryRecipes.length > 0 ? displayedCategoryRecipes : latestRecipes)
            .slice(0, 8)
            .map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onSelect={onSelectRecipe}
                onAddToPlan={onAddToPlan}
              />
            ))}
        </div>
      </div>
    </div>
  );
};
