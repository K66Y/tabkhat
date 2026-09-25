import React, { useState } from 'react';
import { Recipe } from '../types/recipe';
import { useRecipes } from '../context/RecipeContext';
import { Clock, Flame, Heart, Users, Trash2 } from 'lucide-react';

interface RecipeCardProps {
  recipe: Recipe;
  onSelect: (recipe: Recipe) => void;
  onAddToPlan?: (recipe: Recipe) => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  onSelect,
}) => {
  const { isFavorite, toggleFavorite, deleteRecipe } = useRecipes();
  const favorite = isFavorite(recipe.id);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const totalTime = (recipe.cookTime || 0) + (recipe.prepTime || 0);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteRecipe(recipe.id);
    setShowConfirmDelete(false);
  };

  return (
    <div
      onClick={() => onSelect(recipe)}
      className="group bg-white rounded-3xl overflow-hidden border border-stone-200/80 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col cursor-pointer active:scale-[0.99] relative"
    >
      {/* Recipe Image Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
        <img
          src={recipe.imageUrl}
          alt={recipe.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Category Pill (Top Right in LTR visual / Top Right) */}
        <div className="absolute top-2.5 right-2.5 z-10">
          <span className="bg-white/95 backdrop-blur-md text-[#242A26] text-[11px] font-bold px-2.5 py-1 rounded-full shadow-xs">
            {recipe.category}
          </span>
        </div>

        {/* Action Buttons (Top Left): Favorite & Delete */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
          {/* Favorite Round Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(recipe.id);
            }}
            type="button"
            aria-label={favorite ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
            className="w-8 h-8 rounded-full bg-white/95 backdrop-blur-md shadow-xs flex items-center justify-center text-stone-600 hover:text-rose-500 active:scale-90 transition-transform"
            title={favorite ? 'إزالة من المفضلة' : 'حفظ في المفضلة'}
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                favorite ? 'fill-[#E26D46] text-[#E26D46]' : 'text-stone-600'
              }`}
            />
          </button>

          {/* Delete Meal / Recipe Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowConfirmDelete(true);
            }}
            type="button"
            aria-label="حذف هذه الطبخة"
            className="w-8 h-8 rounded-full bg-white/95 backdrop-blur-md shadow-xs flex items-center justify-center text-stone-500 hover:text-rose-600 hover:bg-rose-50 active:scale-90 transition-transform"
            title="حذف هذه الطبخة / الأكلة"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Cooking Duration Pill (Bottom Right of Image) */}
        <div className="absolute bottom-2.5 right-2.5 bg-black/65 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 z-10">
          <Clock className="w-3 h-3 text-amber-300" />
          <span>{totalTime} دقيقة</span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-heading font-extrabold text-sm sm:text-base text-[#242A26] leading-tight line-clamp-1 group-hover:text-[#E26D46] transition-colors">
            {recipe.title}
          </h3>
          <p className="text-[11px] text-stone-500 line-clamp-1 mt-1 leading-snug">
            {recipe.description}
          </p>
        </div>

        {/* Bottom Row: Calories & Servings */}
        <div className="pt-2.5 mt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-600 font-medium">
          {/* Calories */}
          <div className="flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-[#E26D46]" />
            <span>{recipe.calories || 350} ك.س</span>
          </div>

          {/* Servings */}
          <div className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-stone-400" />
            <span>{recipe.baseServings || 4} أشخاص</span>
          </div>
        </div>
      </div>

      {/* Delete Confirmation In-Card Overlay */}
      {showConfirmDelete && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-0 bg-black/85 backdrop-blur-xs p-4 rounded-3xl flex flex-col items-center justify-center text-center text-white z-20 animate-in fade-in duration-150"
        >
          <div className="w-9 h-9 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mb-1.5">
            <Trash2 className="w-5 h-5" />
          </div>
          <p className="font-heading font-bold text-xs sm:text-sm mb-1 px-2 line-clamp-2">
            حذف "{recipe.title}"؟
          </p>
          <p className="text-[11px] text-stone-300 mb-3">
            سيتم إزالة هذه الطبخة نهائياً من التطبيق.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDelete}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-colors active:scale-95"
            >
              نعم، احذف الطبخة
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowConfirmDelete(false);
              }}
              className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs transition-colors active:scale-95"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
