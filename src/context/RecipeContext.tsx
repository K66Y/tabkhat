import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  Recipe,
  ShoppingItem,
  DayMealPlan,
  MealType,
  IngredientCategory,
} from '../types/recipe';
import { INITIAL_RECIPES } from '../data/seedRecipes';
import { useAuth } from './AuthContext';
import { useAccountData } from './useAccountData';

export interface ActiveTimer {
  id: string;
  name: string;
  recipeTitle?: string;
  totalSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  stepNumber?: number;
}

interface ToastInfo {
  id: string;
  message: string;
  type?: 'success' | 'info' | 'warning';
}

interface RecipeContextType {
  dataSyncStatus: 'local' | 'syncing' | 'synced' | 'error';
  isUserDataLoading: boolean;
  userDataError: string;
  dataSyncError: string;
  retryUserData: () => void;
  flushPendingChanges: () => Promise<void>;
  exportBackup: () => void;
  recipes: Recipe[];
  myRecipes: Recipe[];
  favorites: string[];
  toggleFavorite: (recipeId: string) => void;
  isFavorite: (recipeId: string) => boolean;
  addRecipe: (recipe: Omit<Recipe, 'id'>) => Recipe;
  updateRecipe: (recipeId: string, updatedFields: Partial<Recipe>) => void;
  deleteRecipe: (recipeId: string) => void;
  mealPlan: DayMealPlan[];
  addMealToPlan: (day: string, mealType: MealType, recipe: Recipe) => void;
  removeMealFromPlan: (day: string, mealType: MealType) => void;
  autoGenerateWeeklyPlan: () => void;
  exportWeekToShoppingList: () => void;
  shoppingList: ShoppingItem[];
  addIngredientsToShoppingList: (items: { name: string; amount?: string; category?: IngredientCategory; recipeTitle?: string }[]) => void;
  addManualShoppingItem: (name: string, category: IngredientCategory, amount?: string) => void;
  toggleShoppingItem: (id: string) => void;
  removeShoppingItem: (id: string) => void;
  clearCompletedShoppingItems: () => void;
  clearAllShoppingList: () => void;
  shareShoppingListViaWhatsApp: () => void;
  shareRecipeItemsViaWhatsApp: (recipeTitle: string, items?: ShoppingItem[]) => void;
  activeTimers: ActiveTimer[];
  startTimer: (name: string, minutes: number, recipeTitle?: string, stepNumber?: number) => void;
  toggleTimerPause: (id: string) => void;
  cancelTimer: (id: string) => void;
  toast: ToastInfo | null;
  showToast: (message: string, type?: 'success' | 'info' | 'warning') => void;
  selectedRecipeForDetail: Recipe | null;
  setSelectedRecipeForDetail: (recipe: Recipe | null) => void;
  selectedRecipeForPlan: Recipe | null;
  setSelectedRecipeForPlan: (recipe: Recipe | null) => void;
  clearFavorites: () => void;
  clearMealPlan: () => void;
  clearMyRecipes: () => void;
  deleteAllRecipes: () => void;
  restoreDefaultRecipes: () => void;
  resetAllUserData: () => void;
  deletedRecipeCount: number;
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

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export const RecipeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, firebaseUser } = useAuth();
  const {
    data: { recipes, favorites, mealPlan, shoppingList, deletedRecipeCount },
    setRecipes, setFavorites, setMealPlan, setShoppingList, setDeletedRecipeCount,
    dataSyncStatus, isUserDataLoading, userDataError, dataSyncError,
    retryUserData, flushPendingChanges, exportBackup,
  } = useAccountData(firebaseUser?.uid);

  const [activeTimers, setActiveTimers] = useState<ActiveTimer[]>([]);
  const [toast, setToast] = useState<ToastInfo | null>(null);
  const [selectedRecipeForDetail, setSelectedRecipeForDetail] = useState<Recipe | null>(null);
  const [selectedRecipeForPlan, setSelectedRecipeForPlan] = useState<Recipe | null>(null);

  useEffect(() => {
    setSelectedRecipeForDetail(null);
    setSelectedRecipeForPlan(null);
    setActiveTimers([]);
    setToast(null);
  }, [firebaseUser?.uid]);

  // Show Toast helper
  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    const id = Math.random().toString(36).substring(2, 7);
    setToast({ id, message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.id === id ? null : curr));
    }, 3200);
  };

  // Active timers countdown tick
  useEffect(() => {
    if (activeTimers.length === 0) return;

    const interval = setInterval(() => {
      setActiveTimers((prev) =>
        prev
          .map((t) => {
            if (!t.isRunning) return t;
            const next = t.remainingSeconds - 1;
            if (next <= 0) {
              // Play audio beep sound
              try {
                playTimerFinishSound();
              } catch {
                // Audio error safe ignore
              }
              showToast(`⏰ انتهى وقت: ${t.name}!`, 'info');
              return { ...t, remainingSeconds: 0, isRunning: false };
            }
            return { ...t, remainingSeconds: next };
          })
          .filter((t) => t.remainingSeconds > 0 || !t.isRunning)
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimers.length]);

  const playTimerFinishSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    } catch {
      // Audio not permitted without interaction
    }
  };

  const toggleFavorite = (recipeId: string) => {
    setFavorites((prev) => {
      const exists = prev.includes(recipeId);
      const next = exists ? prev.filter((id) => id !== recipeId) : [...prev, recipeId];

      showToast(exists ? 'تمت الإزالة من المفضلة' : '❤️ تم الحفظ في المفضلة', 'success');
      return next;
    });
  };

  const isFavorite = (recipeId: string) => favorites.includes(recipeId);

  const addRecipe = (recipeData: Omit<Recipe, 'id'>): Recipe => {
    const newId = 'custom-' + crypto.randomUUID();
    const newRecipe: Recipe = {
      ...recipeData,
      id: newId,
      authorId: user?.uid,
      authorName: user?.displayName || 'طاهٍ مبدع',
      createdAt: new Date().toISOString(),
    };

    setRecipes((prev) => {
      const updated = [newRecipe, ...prev];

      return updated;
    });

    showToast('أُضيفت الوصفة؛ انتظر تأكيد الحفظ السحابي أعلى الشاشة.', 'success');
    return newRecipe;
  };

  const updateRecipe = (recipeId: string, updatedFields: Partial<Recipe>) => {
    setRecipes((prev) => {
      const updated = prev.map((r) => {
        if (r.id === recipeId) {
          return { ...r, ...updatedFields, id: recipeId };
        }
        return r;
      });



      return updated;
    });

    // Update currently viewed detail modal if open
    if (selectedRecipeForDetail?.id === recipeId) {
      setSelectedRecipeForDetail((prev) => (prev ? { ...prev, ...updatedFields } : null));
    }

    // Update in mealPlan if present
    setMealPlan((prev) => {
      const next = prev.map((day) => {
        const nextMeals = { ...day.meals };
        (['فطور', 'غداء', 'عشاء'] as MealType[]).forEach((m) => {
          if (nextMeals[m]?.id === recipeId) {
            nextMeals[m] = { ...nextMeals[m]!, ...updatedFields };
          }
        });
        return { ...day, meals: nextMeals };
      });


      return next;
    });

    showToast('تم التعديل؛ جاري تأكيد الحفظ السحابي.', 'success');
  };

  const deleteRecipe = (recipeId: string) => {
    // 1. Remove from recipes and persist deletion
    setRecipes((prev) => {
      const updated = prev.filter((r) => r.id !== recipeId);


      return updated;
    });

    setDeletedRecipeCount(count => count + 1);

    // 2. Remove from favorites
    setFavorites((prev) => {
      const next = prev.filter((id) => id !== recipeId);


      return next;
    });

    // 3. Remove from meal plan if scheduled
    setMealPlan((prev) => {
      const next = prev.map((day) => {
        const newMeals = { ...day.meals };
        (['فطور', 'غداء', 'عشاء'] as MealType[]).forEach((m) => {
          if (newMeals[m]?.id === recipeId) {
            delete newMeals[m];
          }
        });
        return { ...day, meals: newMeals };
      });


      return next;
    });

    // 4. Close modals if currently open on this recipe
    if (selectedRecipeForDetail?.id === recipeId) {
      setSelectedRecipeForDetail(null);
    }
    if (selectedRecipeForPlan?.id === recipeId) {
      setSelectedRecipeForPlan(null);
    }

    showToast('🗑️ تم حذف الأكلة/الوصفة بنجاح', 'info');
  };

  const restoreDefaultRecipes = () => {


    setDeletedRecipeCount(0);
    setRecipes(previous => [...previous.filter(r => r.id.startsWith('custom-')), ...INITIAL_RECIPES]);
    showToast('✨ تم استعادة جميع وصفات التطبيق الافتراضية بنجاح!', 'success');
  };

  const clearFavorites = () => {
    setFavorites([]);


    showToast('تم تفريغ قائمة المفضلة بالكامل', 'info');
  };

  const clearMealPlan = () => {
    const emptyPlan: DayMealPlan[] = DAYS_OF_WEEK.map((day) => ({
      day,
      meals: {},
    }));
    setMealPlan(emptyPlan);


    showToast('تم تفريغ جدول الطبخ بالكامل', 'info');
  };

  const clearMyRecipes = () => {
    setRecipes((prev) => {
      const remaining = prev.filter((r) => !r.id.startsWith('custom-') && (!user?.uid || r.authorId !== user.uid));

      return remaining;
    });
    showToast('تم حذف كافة وصفاتك الخاصة', 'info');
  };

  const deleteAllRecipes = () => {
    // Record all IDs in deleted list
    const allIds = recipes.map((r) => r.id);
    setRecipes([]);
    setFavorites([]);
    setDeletedRecipeCount(count => count + allIds.length);
    clearMealPlan();
    setSelectedRecipeForDetail(null);

    showToast('🗑️ تم حذف جميع الأكلات والطبخات من التطبيق بنجاح', 'info');
  };

  const resetAllUserData = () => {







    const emptyPlan: DayMealPlan[] = DAYS_OF_WEEK.map((day) => ({
      day,
      meals: {},
    }));

    setRecipes(INITIAL_RECIPES);
    setFavorites([]);
    setMealPlan(emptyPlan);
    setShoppingList([]);
    setDeletedRecipeCount(0);



    showToast('⚠️ تم مسح وتصفير كافة تفاصيل وبيانات الحساب', 'warning');
  };

  const myRecipes = recipes.filter(
    (r) => r.id.startsWith('custom-') || (user?.uid && r.authorId === user.uid)
  );

  const addMealToPlan = (day: string, mealType: MealType, recipe: Recipe) => {
    setMealPlan((prev) => {
      const updated = prev.map((d) => {
        if (d.day === day) {
          return {
            ...d,
            meals: {
              ...d.meals,
              [mealType]: recipe,
            },
          };
        }
        return d;
      });

      showToast(`تمت إضافة ${recipe.title} لـ ${mealType} يوم ${day}`, 'success');
      return updated;
    });
  };

  const removeMealFromPlan = (day: string, mealType: MealType) => {
    setMealPlan((prev) => {
      const updated = prev.map((d) => {
        if (d.day === day) {
          const nextMeals = { ...d.meals };
          delete nextMeals[mealType];
          return {
            ...d,
            meals: nextMeals,
          };
        }
        return d;
      });

      showToast('تم حذف الوجبة من الجدول', 'info');
      return updated;
    });
  };

  const autoGenerateWeeklyPlan = () => {
    // Intelligently distribute balanced dishes
    const breakfasts = recipes.filter((r) => r.category === 'فطور' || r.category === 'وجبات سريعة');
    const mains = recipes.filter((r) => r.category === 'أطباق رئيسية' || r.category === 'أطباق خليجية وسعودية');
    const lights = recipes.filter((r) => r.category === 'شوربات' || r.category === 'مقبلات وسلطات' || r.category === 'وجبات سريعة');

    const poolB = breakfasts.length > 0 ? breakfasts : recipes;
    const poolM = mains.length > 0 ? mains : recipes;
    const poolL = lights.length > 0 ? lights : recipes;

    const newPlan: DayMealPlan[] = DAYS_OF_WEEK.map((day, idx) => ({
      day,
      meals: {
        فطور: poolB[idx % poolB.length],
        غداء: poolM[idx % poolM.length],
        عشاء: poolL[(idx + 1) % poolL.length],
      },
    }));

    setMealPlan(newPlan);

    showToast('✨ تم اقتراح جدول أسبوعي متكامل ومتنوع!', 'success');
  };

  const exportWeekToShoppingList = () => {
    const collectedIngredients: { name: string; amount?: string; category?: IngredientCategory; recipeTitle?: string }[] = [];

    mealPlan.forEach((dayPlan) => {
      (['فطور', 'غداء', 'عشاء'] as MealType[]).forEach((meal) => {
        const recipe = dayPlan.meals[meal];
        if (recipe) {
          recipe.ingredients.forEach((ing) => {
            collectedIngredients.push({
              name: ing.name,
              amount: `${ing.amount} ${ing.unit}`,
              category: ing.category,
              recipeTitle: recipe.title,
            });
          });
        }
      });
    });

    if (collectedIngredients.length === 0) {
      showToast('لا توجد وجبات مضافة للجدول بعد لتصدير مقاديرها', 'warning');
      return;
    }

    addIngredientsToShoppingList(collectedIngredients);
    showToast(`🛒 تم تصدير ${collectedIngredients.length} صنف إلى قائمة المشتريات!`, 'success');
  };

  const addIngredientsToShoppingList = (
    items: { name: string; amount?: string; category?: IngredientCategory; recipeTitle?: string }[]
  ) => {
    const newItems: ShoppingItem[] = items.map((item) => ({
      id: 'sh-' + Math.random().toString(36).substring(2, 9),
      name: item.name,
      amount: item.amount,
      category: item.category || 'أخرى',
      completed: false,
      recipeTitle: item.recipeTitle,
      addedAt: Date.now(),
    }));

    setShoppingList((prev) => {
      // Append non-duplicate or keep list
      const combined = [...newItems, ...prev];

      return combined;
    });
  };

  const addManualShoppingItem = (name: string, category: IngredientCategory, amount?: string) => {
    const newItem: ShoppingItem = {
      id: 'sh-' + Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      amount: amount?.trim(),
      category,
      completed: false,
      addedAt: Date.now(),
    };

    setShoppingList((prev) => {
      const next = [newItem, ...prev];

      return next;
    });
    showToast(`تمت إضافة "${name}" للمشتريات`, 'success');
  };

  const toggleShoppingItem = (id: string) => {
    setShoppingList((prev) => {
      const next = prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item));

      return next;
    });
  };

  const removeShoppingItem = (id: string) => {
    setShoppingList((prev) => {
      const next = prev.filter((item) => item.id !== id);

      return next;
    });
  };

  const clearCompletedShoppingItems = () => {
    setShoppingList((prev) => {
      const next = prev.filter((item) => !item.completed);

      showToast('تم حذف الأصناف المكتملة', 'info');
      return next;
    });
  };

  const clearAllShoppingList = () => {
    setShoppingList([]);

    showToast('تم مسح قائمة المشتريات بالكامل', 'info');
  };

  const openWhatsAppUrl = (text: string) => {
    const encoded = encodeURIComponent(text);
    const waUrl = `https://api.whatsapp.com/send?text=${encoded}`;
    const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = waUrl;
    } else {
      window.open(waUrl, '_blank');
    }
  };

  const shareShoppingListViaWhatsApp = () => {
    if (shoppingList.length === 0) {
      showToast('قائمة المشتريات فارغة!', 'warning');
      return;
    }

    // Group items by recipe and by general items
    const byRecipe: Record<string, ShoppingItem[]> = {};
    shoppingList.forEach((item) => {
      const key = item.recipeTitle ? `وجبة: ${item.recipeTitle}` : 'طلبات عامة إضافية';
      if (!byRecipe[key]) byRecipe[key] = [];
      byRecipe[key].push(item);
    });

    let text = `🛒 *قائمة مشتريات طبخات - Tabkhat*\n`;
    text += `📅 التاريخ: ${new Date().toLocaleDateString('ar-SA')}\n`;
    text += `─────────────────\n\n`;

    Object.entries(byRecipe).forEach(([groupName, items]) => {
      text += `🍲 *${groupName}:*\n`;
      items.forEach((item) => {
        const mark = item.completed ? '✅' : '▫️';
        const amt = item.amount ? ` (${item.amount})` : '';
        text += `${mark} ${item.name}${amt}\n`;
      });
      text += `\n`;
    });

    text += `📱 أُرسلت عبر تطبيق طبخات`;

    openWhatsAppUrl(text);
  };

  const shareRecipeItemsViaWhatsApp = (recipeTitle: string, customItems?: ShoppingItem[]) => {
    const targetItems = customItems || shoppingList.filter((i) => i.recipeTitle === recipeTitle);
    if (!targetItems || targetItems.length === 0) {
      showToast(`لا توجد طلبات مسجلة لوصفة ${recipeTitle}`, 'warning');
      return;
    }

    let text = `🍲 *طلبات مقادير وجبة: ${recipeTitle}*\n`;
    text += `🛒 تطبيق طبخات - قائمة النواقص:\n`;
    text += `─────────────────\n\n`;

    targetItems.forEach((item) => {
      const mark = item.completed ? '✅' : '▫️';
      const amt = item.amount ? ` (${item.amount})` : '';
      text += `${mark} ${item.name}${amt}\n`;
    });

    text += `\n📱 أُرسلت عبر تطبيق طبخات 🍲`;

    openWhatsAppUrl(text);
  };

  const startTimer = (name: string, minutes: number, recipeTitle?: string, stepNumber?: number) => {
    const totalSeconds = Math.round(minutes * 60);
    const newTimer: ActiveTimer = {
      id: 'timer-' + Date.now(),
      name,
      recipeTitle,
      totalSeconds,
      remainingSeconds: totalSeconds,
      isRunning: true,
      stepNumber,
    };

    setActiveTimers((prev) => [newTimer, ...prev.filter((t) => t.name !== name)]);
    showToast(`⏱️ تم بدء مؤقت (${minutes} دقيقة) لـ "${name}"`, 'success');
  };

  const toggleTimerPause = (id: string) => {
    setActiveTimers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isRunning: !t.isRunning } : t))
    );
  };

  const cancelTimer = (id: string) => {
    setActiveTimers((prev) => prev.filter((t) => t.id !== id));
    showToast('تم إلغاء المؤقت', 'info');
  };

  return (
    <RecipeContext.Provider
      value={{
        dataSyncStatus,
        isUserDataLoading,
        userDataError, dataSyncError, retryUserData, flushPendingChanges, exportBackup,
        recipes,
        myRecipes,
        favorites,
        toggleFavorite,
        isFavorite,
        addRecipe,
        updateRecipe,
        deleteRecipe,
        mealPlan,
        addMealToPlan,
        removeMealFromPlan,
        autoGenerateWeeklyPlan,
        exportWeekToShoppingList,
        shoppingList,
        addIngredientsToShoppingList,
        addManualShoppingItem,
        toggleShoppingItem,
        removeShoppingItem,
        clearCompletedShoppingItems,
        clearAllShoppingList,
        shareShoppingListViaWhatsApp,
        shareRecipeItemsViaWhatsApp,
        activeTimers,
        startTimer,
        toggleTimerPause,
        cancelTimer,
        toast,
        showToast,
        selectedRecipeForDetail,
        setSelectedRecipeForDetail,
        selectedRecipeForPlan,
        setSelectedRecipeForPlan,
        clearFavorites,
        clearMealPlan,
        clearMyRecipes,
        deleteAllRecipes,
        restoreDefaultRecipes,
        resetAllUserData,
        deletedRecipeCount,
      }}
    >
      {children}
    </RecipeContext.Provider>
  );
};

export const useRecipes = () => {
  const context = useContext(RecipeContext);
  if (!context) {
    throw new Error('useRecipes must be used within a RecipeProvider');
  }
  return context;
};
