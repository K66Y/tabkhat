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
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

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

const INITIAL_EMPTY_PLAN: DayMealPlan[] = DAYS_OF_WEEK.map((day) => ({
  day,
  meals: {},
}));

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export const RecipeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, firebaseUser } = useAuth();

  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    let custom: Recipe[] = [];
    const saved = localStorage.getItem('tabkhat_custom_recipes');
    if (saved) {
      try {
        custom = JSON.parse(saved);
      } catch {
        custom = [];
      }
    } else {
      // Seed initial personal recipe for "وصفاتي"
      const sampleMyRecipe: Recipe = {
        id: 'custom-sample-1',
        title: 'صينية دجاج بالبطاطس والثوم والليمون',
        description: 'وصفة عائلية خاصة وسريعة، دجاج متبل بخلطة الليمون وزيت الزيتون والكزبرة والبطاطس المحمرة بالفرن.',
        category: 'أطباق رئيسية',
        cuisine: 'سعودي',
        prepTime: 15,
        cookTime: 35,
        difficulty: 'سهل',
        baseServings: 4,
        calories: 460,
        imageUrl: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=1200&q=80',
        isFeatured: false,
        tags: ['وصفاتي', 'عائلية', 'دجاج', 'صينية بالفرن'],
        authorName: 'أنا',
        createdAt: new Date().toISOString(),
        ingredients: [
          { id: 'my1', name: 'صدور أو أفخاذ دجاج نظيفة', amount: 800, unit: 'جرام', category: 'لحوم ودواجن' },
          { id: 'my2', name: 'بطاطس مقطعة شرائح سميكة', amount: 3, unit: 'حبة', category: 'خضار وفواكه' },
          { id: 'my3', name: 'عصير ليمون طازج وبشر ليمونة', amount: 4, unit: 'ملعقة كبيرة', category: 'خضار وفواكه' },
          { id: 'my4', name: 'زيت زيتون بكر ممتاز', amount: 3, unit: 'ملعقة كبيرة', category: 'معلبات ومؤونة' },
          { id: 'my5', name: 'ثوم مهروس مع كزبرة يابسة', amount: 1, unit: 'ملعقة كبيرة', category: 'توابل وبهارات' },
        ],
        steps: [
          { stepNumber: 1, instruction: 'خلط زيت الزيتون مع عصير الليمون والثوم والكزبرة والملح والفلفل الأسود في وعاء لتجهيز التتبيلة.', timerMinutes: 3 },
          { stepNumber: 2, instruction: 'رص شرائح البطاطس وقطع الدجاج في صينية بايركس وتوزيع التتبيلة فوقها بالتساوي.', timerMinutes: 5 },
          { stepNumber: 3, instruction: 'تغطية الصينية بورق قصدير وإدخالها فرناً ساخناً على 200 مئوية لمدة 30 دقيقة.', timerMinutes: 30 },
          { stepNumber: 4, instruction: 'رفع القصدير وتحمير الوجه تحت الشواية لمدة 5 دقائق حتى يكتسب لوناً ذهبياً شهياً.', timerMinutes: 5 },
        ],
      };
      custom = [sampleMyRecipe];
      localStorage.setItem('tabkhat_custom_recipes', JSON.stringify(custom));
    }

    const deletedIds: string[] = JSON.parse(localStorage.getItem('tabkhat_deleted_recipe_ids') || '[]');
    const editedMap: Record<string, Partial<Recipe>> = JSON.parse(
      localStorage.getItem('tabkhat_edited_recipes') || '{}'
    );
    const all = [...custom, ...INITIAL_RECIPES].map((r) =>
      editedMap[r.id] ? { ...r, ...editedMap[r.id] } : r
    );
    return all.filter((r) => !deletedIds.includes(r.id));
  });

  const [deletedRecipeCount, setDeletedRecipeCount] = useState<number>(() => {
    try {
      const ids: string[] = JSON.parse(localStorage.getItem('tabkhat_deleted_recipe_ids') || '[]');
      return ids.length;
    } catch {
      return 0;
    }
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('tabkhat_favorites');
    return saved ? JSON.parse(saved) : ['kabsa-chicken-1', 'saleeg-taifi-2'];
  });

  const [mealPlan, setMealPlan] = useState<DayMealPlan[]>(() => {
    const saved = localStorage.getItem('tabkhat_meal_plan');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_EMPTY_PLAN;
      }
    }
    // Seed initial plan with 3 realistic entries for rich immediate impression
    const seeded = [...INITIAL_EMPTY_PLAN];
    seeded[0].meals['غداء'] = INITIAL_RECIPES[0]; // السبت غداء كبسة
    seeded[1].meals['فطور'] = INITIAL_RECIPES[3]; // الأحد فطور شكشوكة
    seeded[2].meals['عشاء'] = INITIAL_RECIPES[8]; // الإثنين عشاء مطبق
    return seeded;
  });

  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>(() => {
    const saved = localStorage.getItem('tabkhat_shopping_list');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    // Initial sample items
    return [
      { id: 'sh-1', name: 'أرز بسمتي', amount: '2 كيلو', category: 'معلبات ومؤونة', completed: false, addedAt: Date.now() - 3600000 },
      { id: 'sh-2', name: 'طماطم طازجة', amount: '1 كيلو', category: 'خضار وفواكه', completed: true, addedAt: Date.now() - 7200000 },
      { id: 'sh-3', name: 'بهارات كبسة مشكلة', amount: 'علبة', category: 'توابل وبهارات', completed: false, addedAt: Date.now() - 1000000 },
    ];
  });

  const [activeTimers, setActiveTimers] = useState<ActiveTimer[]>([]);
  const [toast, setToast] = useState<ToastInfo | null>(null);
  const [selectedRecipeForDetail, setSelectedRecipeForDetail] = useState<Recipe | null>(null);
  const [selectedRecipeForPlan, setSelectedRecipeForPlan] = useState<Recipe | null>(null);

  // Show Toast helper
  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    const id = Math.random().toString(36).substring(2, 7);
    setToast({ id, message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.id === id ? null : curr));
    }, 3200);
  };

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('tabkhat_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('tabkhat_meal_plan', JSON.stringify(mealPlan));
  }, [mealPlan]);

  useEffect(() => {
    localStorage.setItem('tabkhat_shopping_list', JSON.stringify(shoppingList));
  }, [shoppingList]);

  // Load from Firestore if user is authenticated
  useEffect(() => {
    const firestore = db;
    if (!firebaseUser || !firestore) return;

    const loadUserData = async () => {
      try {
        // Load favorites
        const favDoc = await getDoc(doc(firestore, 'favorites', firebaseUser.uid));
        if (favDoc.exists() && favDoc.data().ids) {
          setFavorites(favDoc.data().ids);
        }

        // Load meal plan
        const planDoc = await getDoc(doc(firestore, 'mealPlans', firebaseUser.uid));
        if (planDoc.exists() && planDoc.data().plan) {
          setMealPlan(planDoc.data().plan);
        }

        // Load shopping list
        const shopDoc = await getDoc(doc(firestore, 'shoppingList', firebaseUser.uid));
        if (shopDoc.exists() && shopDoc.data().items) {
          setShoppingList(shopDoc.data().items);
        }
      } catch (err) {
        console.warn('Error loading user cloud data:', err);
      }
    };

    loadUserData();
  }, [firebaseUser]);

  // Sync favorites to Firestore when changed
  const saveFavoritesToCloud = async (newFavs: string[]) => {
    const firestore = db;
    if (firebaseUser && firestore) {
      try {
        await setDoc(doc(firestore, 'favorites', firebaseUser.uid), { ids: newFavs, updatedAt: new Date().toISOString() });
      } catch (e) {
        console.warn('Cloud sync error for favorites', e);
      }
    }
  };

  // Sync meal plan to Firestore
  const savePlanToCloud = async (newPlan: DayMealPlan[]) => {
    const firestore = db;
    if (firebaseUser && firestore) {
      try {
        await setDoc(doc(firestore, 'mealPlans', firebaseUser.uid), { plan: newPlan, updatedAt: new Date().toISOString() });
      } catch (e) {
        console.warn('Cloud sync error for meal plan', e);
      }
    }
  };

  // Sync shopping list to Firestore
  const saveShoppingToCloud = async (newItems: ShoppingItem[]) => {
    const firestore = db;
    if (firebaseUser && firestore) {
      try {
        await setDoc(doc(firestore, 'shoppingList', firebaseUser.uid), { items: newItems, updatedAt: new Date().toISOString() });
      } catch (e) {
        console.warn('Cloud sync error for shopping list', e);
      }
    }
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
      saveFavoritesToCloud(next);
      showToast(exists ? 'تمت الإزالة من المفضلة' : '❤️ تم الحفظ في المفضلة', 'success');
      return next;
    });
  };

  const isFavorite = (recipeId: string) => favorites.includes(recipeId);

  const addRecipe = (recipeData: Omit<Recipe, 'id'>): Recipe => {
    const newId = 'custom-' + Date.now();
    const newRecipe: Recipe = {
      ...recipeData,
      id: newId,
      authorId: user?.uid,
      authorName: user?.displayName || 'طاهٍ مبدع',
      createdAt: new Date().toISOString(),
    };

    setRecipes((prev) => {
      const updated = [newRecipe, ...prev];
      const customOnly = updated.filter((r) => r.id.startsWith('custom-'));
      localStorage.setItem('tabkhat_custom_recipes', JSON.stringify(customOnly));
      return updated;
    });

    showToast('🎉 تم حفظ الوصفة بنجاح في مجموعتك!', 'success');
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

      // Save custom recipes if applicable
      const customOnly = updated.filter((r) => r.id.startsWith('custom-'));
      localStorage.setItem('tabkhat_custom_recipes', JSON.stringify(customOnly));

      // Persist edited map for all recipes
      const editedMap: Record<string, Partial<Recipe>> = JSON.parse(
        localStorage.getItem('tabkhat_edited_recipes') || '{}'
      );
      editedMap[recipeId] = { ...(editedMap[recipeId] || {}), ...updatedFields };
      localStorage.setItem('tabkhat_edited_recipes', JSON.stringify(editedMap));

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
      localStorage.setItem('tabkhat_meal_plan', JSON.stringify(next));
      savePlanToCloud(next);
      return next;
    });

    showToast('✨ تم تعديل وحفظ بيانات الطبخة بنجاح!', 'success');
  };

  const deleteRecipe = (recipeId: string) => {
    // 1. Remove from recipes and persist deletion
    setRecipes((prev) => {
      const updated = prev.filter((r) => r.id !== recipeId);
      const customOnly = updated.filter((r) => r.id.startsWith('custom-'));
      localStorage.setItem('tabkhat_custom_recipes', JSON.stringify(customOnly));

      const deletedIds: string[] = JSON.parse(localStorage.getItem('tabkhat_deleted_recipe_ids') || '[]');
      if (!deletedIds.includes(recipeId)) {
        deletedIds.push(recipeId);
        localStorage.setItem('tabkhat_deleted_recipe_ids', JSON.stringify(deletedIds));
        setDeletedRecipeCount(deletedIds.length);
      }
      return updated;
    });

    // 2. Remove from favorites
    setFavorites((prev) => {
      const next = prev.filter((id) => id !== recipeId);
      localStorage.setItem('tabkhat_favorites', JSON.stringify(next));
      saveFavoritesToCloud(next);
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
      localStorage.setItem('tabkhat_meal_plan', JSON.stringify(next));
      savePlanToCloud(next);
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
    localStorage.removeItem('tabkhat_deleted_recipe_ids');
    localStorage.removeItem('tabkhat_edited_recipes');
    setDeletedRecipeCount(0);
    let custom: Recipe[] = [];
    const saved = localStorage.getItem('tabkhat_custom_recipes');
    if (saved) {
      try {
        custom = JSON.parse(saved);
      } catch {
        custom = [];
      }
    }
    setRecipes([...custom, ...INITIAL_RECIPES]);
    showToast('✨ تم استعادة جميع وصفات التطبيق الافتراضية بنجاح!', 'success');
  };

  const clearFavorites = () => {
    setFavorites([]);
    localStorage.setItem('tabkhat_favorites', JSON.stringify([]));
    saveFavoritesToCloud([]);
    showToast('تم تفريغ قائمة المفضلة بالكامل', 'info');
  };

  const clearMealPlan = () => {
    const emptyPlan: DayMealPlan[] = DAYS_OF_WEEK.map((day) => ({
      day,
      meals: {},
    }));
    setMealPlan(emptyPlan);
    localStorage.setItem('tabkhat_meal_plan', JSON.stringify(emptyPlan));
    savePlanToCloud(emptyPlan);
    showToast('تم تفريغ جدول الطبخ بالكامل', 'info');
  };

  const clearMyRecipes = () => {
    setRecipes((prev) => {
      const remaining = prev.filter((r) => !r.id.startsWith('custom-') && (!user?.uid || r.authorId !== user.uid));
      localStorage.setItem('tabkhat_custom_recipes', JSON.stringify([]));
      return remaining;
    });
    showToast('تم حذف كافة وصفاتك الخاصة', 'info');
  };

  const deleteAllRecipes = () => {
    // Record all IDs in deleted list
    const allIds = recipes.map((r) => r.id);
    const existingDeleted: string[] = JSON.parse(localStorage.getItem('tabkhat_deleted_recipe_ids') || '[]');
    const merged = Array.from(new Set([...existingDeleted, ...allIds, ...INITIAL_RECIPES.map((r) => r.id)]));
    localStorage.setItem('tabkhat_deleted_recipe_ids', JSON.stringify(merged));
    localStorage.setItem('tabkhat_custom_recipes', JSON.stringify([]));
    localStorage.setItem('tabkhat_favorites', JSON.stringify([]));
    setRecipes([]);
    setFavorites([]);
    setDeletedRecipeCount(merged.length);
    saveFavoritesToCloud([]);
    showToast('🗑️ تم حذف جميع الأكلات والطبخات من التطبيق بنجاح', 'info');
  };

  const resetAllUserData = () => {
    localStorage.removeItem('tabkhat_custom_recipes');
    localStorage.removeItem('tabkhat_favorites');
    localStorage.removeItem('tabkhat_meal_plan');
    localStorage.removeItem('tabkhat_shopping_list');
    localStorage.removeItem('tabkhat_deleted_recipe_ids');
    localStorage.removeItem('tabkhat_edited_recipes');

    const emptyPlan: DayMealPlan[] = DAYS_OF_WEEK.map((day) => ({
      day,
      meals: {},
    }));

    setRecipes(INITIAL_RECIPES);
    setFavorites([]);
    setMealPlan(emptyPlan);
    setShoppingList([]);
    setDeletedRecipeCount(0);
    saveFavoritesToCloud([]);
    savePlanToCloud(emptyPlan);
    saveShoppingToCloud([]);
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
      savePlanToCloud(updated);
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
      savePlanToCloud(updated);
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
    savePlanToCloud(newPlan);
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
      saveShoppingToCloud(combined);
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
      saveShoppingToCloud(next);
      return next;
    });
    showToast(`تمت إضافة "${name}" للمشتريات`, 'success');
  };

  const toggleShoppingItem = (id: string) => {
    setShoppingList((prev) => {
      const next = prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item));
      saveShoppingToCloud(next);
      return next;
    });
  };

  const removeShoppingItem = (id: string) => {
    setShoppingList((prev) => {
      const next = prev.filter((item) => item.id !== id);
      saveShoppingToCloud(next);
      return next;
    });
  };

  const clearCompletedShoppingItems = () => {
    setShoppingList((prev) => {
      const next = prev.filter((item) => !item.completed);
      saveShoppingToCloud(next);
      showToast('تم حذف الأصناف المكتملة', 'info');
      return next;
    });
  };

  const clearAllShoppingList = () => {
    setShoppingList([]);
    saveShoppingToCloud([]);
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
