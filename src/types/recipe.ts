export type DifficultyLevel = 'سهل' | 'متوسط' | 'متقدم';

export type RecipeCategory =
  | 'الكل'
  | 'أطباق رئيسية'
  | 'أطباق خليجية وسعودية'
  | 'شوربات'
  | 'مقبلات وسلطات'
  | 'حلا وحلويات'
  | 'فطور'
  | 'وجبات سريعة'
  | 'وجبات صحية'
  | 'مشروبات';

export type IngredientCategory =
  | 'خضار وفواكه'
  | 'لحوم ودواجن'
  | 'توابل وبهارات'
  | 'معلبات ومؤونة'
  | 'ألبان وأجبان'
  | 'أخرى';

export interface Ingredient {
  id: string;
  name: string;
  amount: number; // base amount for baseServings
  unit: string;   // e.g. "كوب", "ملعقة كبيرة", "حبة", "جرام", "كيلو"
  category: IngredientCategory;
}

export interface RecipeStep {
  stepNumber: number;
  instruction: string;
  timerMinutes?: number; // if the step requires a timer (e.g. 20)
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  category: RecipeCategory;
  cuisine: string; // e.g. "سعودي", "شامي", "خليجي", "مصري", "عالمي"
  prepTime: number; // minutes
  cookTime: number; // minutes
  difficulty: DifficultyLevel;
  baseServings: number;
  calories: number; // approx kcal per serving
  imageUrl: string;
  ingredients: Ingredient[];
  steps: RecipeStep[];
  tags: string[];
  isFeatured?: boolean;
  authorId?: string;
  authorName?: string;
  createdAt?: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  amount?: string;
  category: IngredientCategory;
  completed: boolean;
  recipeId?: string;
  recipeTitle?: string;
  addedAt: number;
}

export type MealType = 'فطور' | 'غداء' | 'عشاء';

export interface DayMealPlan {
  day: string; // 'السبت' | 'الأحد' | 'الإثنين' | 'الثلاثاء' | 'الأربعاء' | 'الخميس' | 'الجمعة'
  meals: {
    [key in MealType]?: Recipe | null;
  };
}

export interface UserPreferences {
  dietary: string[]; // e.g. "نباتي", "قليل الكارب", "خالي من الجلوتين", "أكلات حارة"
  favoriteCuisines: string[];
  defaultServings: number;
}

export interface UserProfile {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  isGuest?: boolean;
  preferences: UserPreferences;
}
