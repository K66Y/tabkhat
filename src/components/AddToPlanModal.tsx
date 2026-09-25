import React, { useState } from 'react';
import { useRecipes } from '../context/RecipeContext';
import { Recipe, MealType } from '../types/recipe';
import { X, Calendar, Check } from 'lucide-react';

interface AddToPlanModalProps {
  recipe: Recipe | null;
  onClose: () => void;
}

const DAYS_OF_WEEK = [
  'السبت',
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
];

const MEAL_TYPES: MealType[] = ['فطور', 'غداء', 'عشاء'];

export const AddToPlanModal: React.FC<AddToPlanModalProps> = ({ recipe, onClose }) => {
  const { addMealToPlan } = useRecipes();

  const [selectedDay, setSelectedDay] = useState<string>('السبت');
  const [selectedMeal, setSelectedMeal] = useState<MealType>('غداء');

  if (!recipe) return null;

  const handleConfirm = () => {
    addMealToPlan(selectedDay, selectedMeal, recipe);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-end sm:items-center p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div
        className="bg-[#FAF8F5] w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 border border-stone-200 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#2D5A46] text-white flex items-center justify-center shadow-sm">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-[#242A26]">
                إضافة للجدول الأسبوعي
              </h3>
              <p className="text-xs text-stone-500 truncate max-w-[220px]">
                {recipe.title}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Day selection */}
        <div>
          <label className="block text-xs font-bold text-[#242A26] mb-2">
            اختر اليوم:
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = selectedDay === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-[#E26D46] text-white shadow-sm'
                      : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Meal type selection */}
        <div>
          <label className="block text-xs font-bold text-[#242A26] mb-2">
            اختر الوجبة:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {MEAL_TYPES.map((type) => {
              const isSelected = selectedMeal === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedMeal(type)}
                  className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#2D5A46] text-white shadow-sm'
                      : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                  {type}
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={handleConfirm}
          className="w-full py-3 rounded-2xl bg-[#E26D46] hover:bg-[#D15B35] text-white font-bold text-sm shadow-md transition-all active:scale-98"
        >
          تأكيد الإضافة للجدول
        </button>
      </div>
    </div>
  );
};
