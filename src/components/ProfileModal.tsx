import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRecipes } from '../context/RecipeContext';
import {
  User,
  LogIn,
  LogOut,
  Mail,
  Lock,
  Sparkles,
  Download,
  Heart,
  Calendar,
  ShoppingCart,
  Check,
  ShieldCheck,
  Edit2,
  Bookmark,
  BookOpen,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Edit3,
  Camera,
  Globe,
  Users as UsersIcon,
} from 'lucide-react';

interface ProfileModalProps {
  onOpenFavorites: () => void;
  onOpenShopping: () => void;
  onOpenPlanner: () => void;
  onOpenMyRecipes: () => void;
}

interface ConfirmAction {
  title: string;
  description: string;
  confirmText: string;
  isDestructive?: boolean;
  onConfirm: () => void | Promise<void>;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  onOpenFavorites,
  onOpenShopping,
  onOpenPlanner,
  onOpenMyRecipes,
}) => {
  const {
    user,
    isGuest,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    logout,
    updatePreferences,
    updateProfileName,
    updateProfilePhoto,
    clearDietaryPreferences,
    deleteAccountDetails,
  } = useAuth();

  const {
    recipes,
    myRecipes,
    favorites,
    shoppingList,
    mealPlan,
    showToast,
    deleteAllRecipes,
    clearFavorites,
    clearMealPlan,
    clearMyRecipes,
    clearAllShoppingList,
    restoreDefaultRecipes,
    resetAllUserData,
    deletedRecipeCount,
  } = useRecipes();

  // Auth form modal tabs
  const [authMode, setAuthMode] = useState<'none' | 'login' | 'register'>('none');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit name state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(user?.displayName || '');

  // Edit Profile Details Modal
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [editFormName, setEditFormName] = useState(user?.displayName || '');
  const [editFormAvatar, setEditFormAvatar] = useState(user?.photoURL || '');
  const [editFormServings, setEditFormServings] = useState(user?.preferences?.defaultServings || 4);
  const [editFormCuisines, setEditFormCuisines] = useState<string[]>(
    user?.preferences?.favoriteCuisines || ['سعودي', 'خليجي']
  );
  const [customAvatarInput, setCustomAvatarInput] = useState('');

  const AVATAR_PRESETS = [
    { id: 'chef1', url: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=300&q=80', label: 'شيف محترف' },
    { id: 'chef2', url: 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?auto=format&fit=crop&w=300&q=80', label: 'طاهية مبدعة' },
    { id: 'chef3', url: 'https://images.unsplash.com/photo-1607631568010-a87245c0daf8?auto=format&fit=crop&w=300&q=80', label: 'شيف شاب' },
    { id: 'chef4', url: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=300&q=80', label: 'محب للطبخ' },
    { id: 'chef5', url: 'https://images.unsplash.com/photo-1512485694743-9c9538b4e6e0?auto=format&fit=crop&w=300&q=80', label: 'طاهي هاوٍ' },
    { id: 'chef6', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80', label: 'طاهية بيت' },
  ];

  const CUISINES_OPTIONS = ['سعودي', 'خليجي', 'شامي', 'مصري', 'مغربي', 'إيطالي', 'هندي', 'عالمي'];

  // Confirm action modal
  const [confirmModalAction, setConfirmModalAction] = useState<ConfirmAction | null>(null);

  // Dietary options
  const dietaryOptions = [
    'نباتي',
    'قليل الكارب (كيتو)',
    'خالي من الجلوتين',
    'أكلات حارة ومبهرة',
    'غني بالبروتين',
    'قليل السعرات',
  ];

  const handleGoogleLogin = async () => {
    setAuthError('');
    try {
      await loginWithGoogle();
      setAuthMode('none');
      showToast('🎉 تم تسجيل الدخول بنجاح عبر حساب Google!', 'success');
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || 'تعذر تسجيل الدخول عبر Google');
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmitting(true);
    try {
      if (authMode === 'register') {
        await registerWithEmail(name, email, password);
        showToast('🎉 تم إنشاء حسابك الجديد في طبخات بنجاح!', 'success');
      } else {
        await loginWithEmail(email, password);
        showToast('🎉 أهلاً بعودتك، تم تسجيل الدخول بنجاح!', 'success');
      }
      setAuthMode('none');
      setEmail('');
      setPassword('');
      setName('');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setAuthError('بيانات الدخول غير صحيحة، يرجى التحقق من البريد وكلمة المرور');
      } else if (err.code === 'auth/email-already-in-use') {
        setAuthError('هذا البريد الإلكتروني مسجل بالفعل');
      } else {
        setAuthError(err.message || 'حدث خطأ أثناء المحاولة');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveName = async () => {
    if (!editNameValue.trim()) return;
    await updateProfileName(editNameValue.trim());
    setIsEditingName(false);
    showToast('تم تحديث الاسم بنجاح', 'success');
  };

  const handleSaveProfileChanges = async () => {
    if (editFormName.trim()) {
      await updateProfileName(editFormName.trim());
    }
    if (editFormAvatar) {
      await updateProfilePhoto(editFormAvatar);
    }
    await updatePreferences({
      defaultServings: Number(editFormServings) || 4,
      favoriteCuisines: editFormCuisines,
    });
    setIsEditProfileModalOpen(false);
    showToast('🎉 تم حفظ وتحديث بيانات وملف الحساب بنجاح!', 'success');
  };

  const toggleDietaryPref = (diet: string) => {
    const current = user?.preferences?.dietary || [];
    const next = current.includes(diet)
      ? current.filter((d) => d !== diet)
      : [...current, diet];
    updatePreferences({ dietary: next });
  };

  // Export JSON backup of all user data
  const handleExportJSON = () => {
    const backupData = {
      app: 'Tabkhat App',
      exportDate: new Date().toISOString(),
      user: {
        displayName: user?.displayName,
        email: user?.email,
        preferences: user?.preferences,
      },
      customRecipes: recipes.filter((r) => r.id.startsWith('custom-')),
      favorites,
      mealPlan,
      shoppingList,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `tabkhat-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast('📥 تم تحميل نسخة احتياطية من بياناتك بنجاح!', 'success');
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Profile Header Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/90 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 text-center sm:text-right">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#E26D46] to-[#2D5A46] p-1 shadow-md">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'المستخدم'}
                    className="w-full h-full rounded-[22px] object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-[22px] bg-white flex items-center justify-center text-[#E26D46] font-extrabold text-2xl font-heading">
                    {user?.displayName ? user.displayName.slice(0, 1) : 'ط'}
                  </div>
                )}
              </div>
              <span className="absolute -bottom-1 -left-1 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold border-2 border-white">
                {isGuest ? 'زائر' : 'حساب سحابي'}
              </span>
            </div>

            {/* User details */}
            <div>
              {isEditingName ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={editNameValue}
                    onChange={(e) => setEditNameValue(e.target.value)}
                    className="p-1.5 rounded-lg border border-stone-300 text-sm font-bold"
                  />
                  <button
                    onClick={handleSaveName}
                    className="px-3 py-1 bg-[#E26D46] text-white rounded-lg text-xs font-bold"
                  >
                    حفظ
                  </button>
                  <button
                    onClick={() => setIsEditingName(false)}
                    className="px-2 py-1 bg-stone-100 text-stone-600 rounded-lg text-xs"
                  >
                    إلغاء
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h1 className="font-heading font-extrabold text-lg sm:text-xl text-[#242A26]">
                    {user?.displayName || 'طاهٍ مبدع'}
                  </h1>
                  <button
                    onClick={() => {
                      setEditNameValue(user?.displayName || '');
                      setIsEditingName(true);
                    }}
                    className="text-stone-400 hover:text-[#E26D46] p-1"
                    title="تعديل الاسم"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <p className="text-xs text-stone-500 mt-0.5">
                {user?.email || 'يتم حفظ بياناتك محلياً على هذا الجهاز'}
              </p>

              {isGuest && (
                <div className="inline-flex items-center gap-1 mt-2 text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  سجل دخولك لحفظ بياناتك في سحابة Firebase بشكل دائم
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditFormName(user?.displayName || '');
                    setEditFormAvatar(user?.photoURL || '');
                    setEditFormServings(user?.preferences?.defaultServings || 4);
                    setEditFormCuisines(user?.preferences?.favoriteCuisines || ['سعودي', 'خليجي']);
                    setIsEditProfileModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#E26D46] border border-orange-200 text-xs font-bold transition-all active:scale-95 shadow-2xs"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>تعديل بيانات الحساب والملف الشخصي</span>
                </button>
              </div>
            </div>
          </div>

          {/* Auth buttons */}
          <div className="flex items-center gap-2">
            {isGuest ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setAuthMode('login')}
                  className="px-4 py-2 rounded-xl bg-[#E26D46] hover:bg-[#D15B35] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  تسجيل الدخول
                </button>
                <button
                  onClick={handleGoogleLogin}
                  className="px-3 py-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                  title="تسجيل سريع عبر Google"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  Google
                </button>
              </div>
            ) : (
              <button
                onClick={logout}
                className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                تسجيل الخروج
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={onOpenMyRecipes}
          className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-sm flex flex-col items-center text-center hover:border-amber-300 hover:bg-amber-50/20 transition-all active:scale-95"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-2 shadow-sm">
            <BookOpen className="w-5 h-5 text-[#E26D46]" />
          </div>
          <span className="font-heading font-bold text-base text-[#242A26]">{myRecipes.length}</span>
          <span className="text-[11px] text-stone-500 font-semibold">وصفاتي</span>
        </button>

        <button
          onClick={onOpenFavorites}
          className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-sm flex flex-col items-center text-center hover:border-rose-200 transition-all active:scale-95"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-2 shadow-sm">
            <Heart className="w-5 h-5 fill-rose-500" />
          </div>
          <span className="font-heading font-bold text-base text-[#242A26]">{favorites.length}</span>
          <span className="text-[11px] text-stone-500 font-semibold">المفضلة</span>
        </button>

        <button
          onClick={onOpenPlanner}
          className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-sm flex flex-col items-center text-center hover:border-emerald-200 transition-all active:scale-95"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#2D5A46] flex items-center justify-center mb-2 shadow-sm">
            <Calendar className="w-5 h-5" />
          </div>
          <span className="font-heading font-bold text-base text-[#242A26]">7 أيام</span>
          <span className="text-[11px] text-stone-500 font-semibold">جدول الطبخ</span>
        </button>

        <button
          onClick={onOpenShopping}
          className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-sm flex flex-col items-center text-center hover:border-orange-200 transition-all active:scale-95"
        >
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#E26D46] flex items-center justify-center mb-2 shadow-sm">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <span className="font-heading font-bold text-base text-[#242A26]">{shoppingList.length}</span>
          <span className="text-[11px] text-stone-500 font-semibold">المشتريات</span>
        </button>
      </div>

      {/* Food Preferences Section */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold text-base text-[#242A26] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#E26D46]" />
              تفضيلاتي الغذائية
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              حدد خياراتك لمساعدتنا في تخصيص الاقتراحات الذكية لك
            </p>
          </div>

          {(user?.preferences?.dietary?.length || 0) > 0 && (
            <button
              onClick={() => {
                clearDietaryPreferences();
                showToast('تم تفريغ التفضيلات الغذائية', 'info');
              }}
              className="px-2.5 py-1 rounded-xl bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-rose-600 text-xs font-semibold flex items-center gap-1 transition-colors"
              title="مسح كافة التفضيلات المحددة"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>مسح التحديد</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {dietaryOptions.map((diet) => {
            const isSelected = user?.preferences?.dietary?.includes(diet);
            return (
              <button
                key={diet}
                onClick={() => toggleDietaryPref(diet)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  isSelected
                    ? 'bg-[#2D5A46] text-white shadow-sm'
                    : 'bg-stone-50 text-stone-700 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5" />}
                {diet}
              </button>
            );
          })}
        </div>
      </div>

      {/* 🗑️ قسم إدارة وحذف تفاصيل الحساب والطبخات (Delete Account Details & Meals) */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading font-black text-base text-[#242A26] flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-500" />
              <span>إدارة وحذف تفاصيل الحساب والطبخات</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              تحكم كامل في مسح تفاصيل حسابك وحذف الأكلات والمفضلات
            </p>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-100">
            خيارات الحذف
          </span>
        </div>

        {/* 1. حذف تفاصيل الحساب والملف الشخصي */}
        <div className="bg-stone-50/80 rounded-2xl p-4 border border-stone-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#2D5A46]" />
              <span className="text-xs font-bold text-[#242A26]">تفاصيل الحساب والتفضيلات</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {/* حذف / تصفير تفاصيل الملف الشخصي */}
            <div className="bg-white p-3 rounded-xl border border-stone-200/80 flex items-center justify-between gap-3 shadow-2xs">
              <div>
                <p className="text-xs font-bold text-[#242A26]">حذف تفاصيل الحساب</p>
                <p className="text-[11px] text-stone-500">مسح الاسم والبيانات المخصصة</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setConfirmModalAction({
                    title: 'حذف تفاصيل الحساب',
                    description: 'هل تريد مسح تفاصيل حسابك المخصصة (الاسم والبيانات) وإعادتها للوضع النظيف؟',
                    confirmText: 'نعم، احذف التفاصيل',
                    onConfirm: async () => {
                      await deleteAccountDetails();
                      showToast('تم مسح وحذف تفاصيل الحساب بنجاح', 'info');
                    },
                  })
                }
                className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-rose-50 text-rose-600 font-bold text-xs flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف</span>
              </button>
            </div>

            {/* تفريغ التفضيلات الغذائية */}
            <div className="bg-white p-3 rounded-xl border border-stone-200/80 flex items-center justify-between gap-3 shadow-2xs">
              <div>
                <p className="text-xs font-bold text-[#242A26]">تفريغ التفضيلات الغذائية</p>
                <p className="text-[11px] text-stone-500">{user?.preferences?.dietary?.length || 0} تفضيلات محددة</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setConfirmModalAction({
                    title: 'تفريغ التفضيلات الغذائية',
                    description: 'هل تريد إلغاء تحديد كافة التفضيلات والحميات الغذائية لحسابك؟',
                    confirmText: 'نعم، أفرغ التفضيلات',
                    onConfirm: async () => {
                      await clearDietaryPreferences();
                      showToast('تم تفريغ كافة التفضيلات الغذائية', 'info');
                    },
                  })
                }
                className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-rose-50 text-rose-600 font-bold text-xs flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>تفريغ</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. حذف وإدارة الطبخات والأكلات */}
        <div className="bg-stone-50/80 rounded-2xl p-4 border border-stone-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#E26D46]" />
              <span className="text-xs font-bold text-[#242A26]">حذف وإدارة الطبخات والأكلات</span>
            </div>
            <span className="text-[11px] text-stone-500 font-medium">
              إجمالي الطبخات المتاحة: {recipes.length}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            {/* حذف جميع أكلات وصفاتي */}
            <div className="bg-white p-3 rounded-xl border border-stone-200/80 flex flex-col justify-between gap-2 shadow-2xs">
              <div>
                <p className="text-xs font-bold text-[#242A26]">حذف أكلات "وصفاتي"</p>
                <p className="text-[11px] text-stone-500">حذف {myRecipes.length} وصفة مضافة بواسطتك</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setConfirmModalAction({
                    title: 'حذف جميع وصفاتي الخاصة',
                    description: `هل أنت متأكد من رغبتك في حذف جميع الطبخات التي أضفتها في "وصفاتي" (${myRecipes.length} وصفة)؟`,
                    confirmText: 'نعم، احذف وصفاتي',
                    onConfirm: () => {
                      clearMyRecipes();
                    },
                  })
                }
                disabled={myRecipes.length === 0}
                className="w-full py-1.5 rounded-lg bg-stone-100 hover:bg-rose-50 text-rose-600 disabled:opacity-40 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف وصفاتي</span>
              </button>
            </div>

            {/* حذف كل أكلة وطبخة من التطبيق */}
            <div className="bg-white p-3 rounded-xl border border-stone-200/80 flex flex-col justify-between gap-2 shadow-2xs">
              <div>
                <p className="text-xs font-bold text-[#242A26]">حذف جميع الأكلات والطبخات</p>
                <p className="text-[11px] text-stone-500">تفريغ كافة الطبخات والبدء من الصفر</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setConfirmModalAction({
                    title: 'حذف جميع الأكلات والطبخات',
                    description:
                      'هل أنت متأكد من رغبتك في مسح وحذف كافة الأكلات والطبخات من التطبيق؟ يمكنك استعادتها لاحقاً بزر الاستعادة.',
                    confirmText: 'نعم، احذف كل الأكلات',
                    isDestructive: true,
                    onConfirm: () => {
                      deleteAllRecipes();
                    },
                  })
                }
                disabled={recipes.length === 0}
                className="w-full py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 disabled:opacity-40 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف كل الطبخات</span>
              </button>
            </div>

            {/* استعادة طبخات التطبيق الأصلية */}
            <div className="bg-white p-3 rounded-xl border border-stone-200/80 flex flex-col justify-between gap-2 shadow-2xs">
              <div>
                <p className="text-xs font-bold text-[#242A26]">استعادة أكلات التطبيق</p>
                <p className="text-[11px] text-stone-500">
                  {deletedRecipeCount > 0
                    ? `تم حذف ${deletedRecipeCount} طبخة سابقاً`
                    : 'استرجاع الوصفات الأساسية'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  restoreDefaultRecipes();
                }}
                className="w-full py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1 transition-colors border border-emerald-200"
              >
                <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                <span>استعادة الطبخات</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. حذف وتفريغ القوائم الملحقة */}
        <div className="bg-stone-50/80 rounded-2xl p-4 border border-stone-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#242A26]">حذف وتفريغ القوائم المحفوظة</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* تفريغ المفضلة */}
            <div className="bg-white p-3 rounded-xl border border-stone-200/80 flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-[#242A26]">تفريغ المفضلة</p>
                <p className="text-[11px] text-stone-500">{favorites.length} أكلات</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setConfirmModalAction({
                    title: 'تفريغ قائمة المفضلة',
                    description: 'هل تريد حذف جميع الوصفات المحفوظة في المفضلة؟',
                    confirmText: 'نعم، فرّغ المفضلة',
                    onConfirm: () => clearFavorites(),
                  })
                }
                disabled={favorites.length === 0}
                className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-rose-50 text-rose-600 disabled:opacity-40 font-bold text-xs"
              >
                مسح
              </button>
            </div>

            {/* تفريغ جدول الطبخ */}
            <div className="bg-white p-3 rounded-xl border border-stone-200/80 flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-[#242A26]">تفريغ جدول الطبخ</p>
                <p className="text-[11px] text-stone-500">مسح الوجبات الأسبوعية</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setConfirmModalAction({
                    title: 'تفريغ جدول الطبخ',
                    description: 'هل تريد حذف جميع الوجبات المجدولة في الأسبوع؟',
                    confirmText: 'نعم، فرّغ الجدول',
                    onConfirm: () => clearMealPlan(),
                  })
                }
                className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-rose-50 text-rose-600 font-bold text-xs"
              >
                مسح
              </button>
            </div>

            {/* تفريغ قائمة المشتريات */}
            <div className="bg-white p-3 rounded-xl border border-stone-200/80 flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-[#242A26]">تفريغ المشتريات</p>
                <p className="text-[11px] text-stone-500">{shoppingList.length} مقادير</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setConfirmModalAction({
                    title: 'تفريغ قائمة المشتريات',
                    description: 'هل تريد مسح جميع الأصناف والمقادير في قائمة المشتريات؟',
                    confirmText: 'نعم، مسح المشتريات',
                    onConfirm: () => clearAllShoppingList(),
                  })
                }
                disabled={shoppingList.length === 0}
                className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-rose-50 text-rose-600 disabled:opacity-40 font-bold text-xs"
              >
                مسح
              </button>
            </div>
          </div>
        </div>

        {/* 4. منطقة التصفير الشامل للحساب (Danger Zone) */}
        <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-heading font-black text-sm text-rose-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>حذف وتصفير شامل لكافة تفاصيل وبيانات الحساب</span>
              </h3>
              <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">
                مسح كافة التفاصيل (الاسم، التفضيلات، المفضلة، جدول الطبخ، والمشتريات) وإعادة تعيين الحساب كأول مرة.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setConfirmModalAction({
                  title: 'تأكيد الحذف والتصفير الشامل للحساب',
                  description:
                    'تحذير: سيتم حذف كافة تفاصيل الحساب، التفضيلات، المفضلة، جدول الطبخ، والمشتريات نهائياً وإعادة التطبيق للوضع الافتراضي. هل تريد المتابعة؟',
                  confirmText: 'نعم، احذف وصفّر كل شيء',
                  isDestructive: true,
                  onConfirm: async () => {
                    await deleteAccountDetails();
                    resetAllUserData();
                    showToast('⚠️ تم تصفير وحذف جميع تفاصيل وبيانات الحساب بنجاح', 'warning');
                  },
                })
              }
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shrink-0 shadow-md transition-all active:scale-95"
            >
              تصفير وحذف كل التفاصيل
            </button>
          </div>
        </div>
      </div>

      {/* Backup & Export Section */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-sm flex items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-bold text-sm text-[#242A26] flex items-center gap-2">
            <Download className="w-4 h-4 text-[#E26D46]" />
            نسخة احتياطية من الوصفات والبيانات
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            تصدير جميع وصفاتك ومفضلاتك وجدولك في ملف JSON
          </p>
        </div>

        <button
          onClick={handleExportJSON}
          className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-[#242A26] font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors"
        >
          <Download className="w-4 h-4" />
          تصدير JSON
        </button>
      </div>

      {/* Confirmation Dialog Modal */}
      {confirmModalAction && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl border border-stone-200 text-right">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${
                confirmModalAction.isDestructive
                  ? 'bg-rose-100 text-rose-600'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {confirmModalAction.isDestructive ? (
                <Trash2 className="w-6 h-6" />
              ) : (
                <AlertTriangle className="w-6 h-6" />
              )}
            </div>

            <div>
              <h3 className="font-heading font-black text-base text-[#242A26]">
                {confirmModalAction.title}
              </h3>
              <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                {confirmModalAction.description}
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={async () => {
                  await confirmModalAction.onConfirm();
                  setConfirmModalAction(null);
                }}
                className={`flex-1 py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition-colors ${
                  confirmModalAction.isDestructive
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-[#E26D46] hover:bg-[#D15B35]'
                }`}
              >
                {confirmModalAction.confirmText}
              </button>
              <button
                type="button"
                onClick={() => setConfirmModalAction(null)}
                className="flex-1 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal Popup */}
      {authMode !== 'none' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#FAF8F5] w-full max-w-md rounded-3xl shadow-2xl p-6 border border-stone-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-lg text-[#242A26]">
                {authMode === 'login' ? 'تسجيل الدخول إلى طبخات' : 'إنشاء حساب جديد'}
              </h3>
              <button
                onClick={() => setAuthMode('none')}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                ✕
              </button>
            </div>

            {/* Quick Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full py-3 px-4 rounded-xl bg-white border border-stone-300 hover:bg-stone-50 font-bold text-xs sm:text-sm text-stone-700 flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              متابعة بنقرة واحدة عبر حساب Google
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-stone-200"></div>
              <span className="flex-shrink mx-3 text-stone-400 text-xs">أو عبر البريد</span>
              <div className="flex-grow border-t border-stone-200"></div>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
                {authError}
              </div>
            )}

            <form onSubmit={handleEmailAuth} className="space-y-3">
              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-[#242A26] mb-1">الاسم الكامل</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: سارة محمد"
                    className="w-full p-2.5 rounded-xl bg-white border border-stone-200 text-xs"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#242A26] mb-1">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@mail.com"
                    className="w-full pr-9 pl-3 py-2.5 rounded-xl bg-white border border-stone-200 text-xs text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#242A26] mb-1">كلمة المرور</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pr-9 pl-3 py-2.5 rounded-xl bg-white border border-stone-200 text-xs text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-[#E26D46] hover:bg-[#D15B35] disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md transition-all mt-2"
              >
                {isSubmitting
                  ? 'جاري التحقق...'
                  : authMode === 'login'
                  ? 'تسجيل الدخول'
                  : 'إنشاء الحساب'}
              </button>
            </form>

            <div className="text-center pt-2">
              {authMode === 'login' ? (
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className="text-xs text-[#2D5A46] font-bold hover:underline"
                >
                  ليس لديك حساب؟ اضغط لإنشاء حساب جديد
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="text-xs text-[#2D5A46] font-bold hover:underline"
                >
                  لديك حساب بالفعل؟ تسجيل الدخول
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile & Account Data Modal */}
      {isEditProfileModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-[#FAF8F5] rounded-3xl p-5 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 text-right space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="font-heading font-black text-base sm:text-lg text-[#242A26] flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#E26D46]" />
                <span>تعديل بيانات الحساب والملف الشخصي</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditProfileModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Display Name */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#242A26]">
                  اسم الحساب / الشيف:
                </label>
                <input
                  type="text"
                  value={editFormName}
                  onChange={(e) => setEditFormName(e.target.value)}
                  placeholder="مثال: سارة محمد أو الشيف عبد الله"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-xs sm:text-sm font-bold text-[#242A26] focus:outline-none focus:ring-2 focus:ring-[#E26D46]/40"
                />
              </div>

              {/* Avatar Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#242A26]">
                  الصورة الرمزية / صورة الملف الشخصي:
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {AVATAR_PRESETS.map((preset) => {
                    const isSelected = editFormAvatar === preset.url;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setEditFormAvatar(preset.url)}
                        title={preset.label}
                        className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all ${
                          isSelected
                            ? 'border-[#E26D46] ring-2 ring-[#E26D46]/30 scale-105'
                            : 'border-transparent opacity-80 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.label}
                          className="w-full h-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-[#E26D46]/30 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Image URL */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="url"
                    value={customAvatarInput}
                    onChange={(e) => setCustomAvatarInput(e.target.value)}
                    placeholder="أو ضع رابط صورة مخصص (URL)..."
                    className="flex-1 px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs text-left"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customAvatarInput.trim()) {
                        setEditFormAvatar(customAvatarInput.trim());
                        setCustomAvatarInput('');
                        showToast('تم اعتماد رابط الصورة', 'info');
                      }
                    }}
                    className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-[#242A26] text-xs font-bold rounded-xl shrink-0"
                  >
                    تطبيق
                  </button>
                </div>
              </div>

              {/* Default Servings */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#242A26] flex items-center gap-1.5">
                  <UsersIcon className="w-3.5 h-3.5 text-[#2D5A46]" />
                  <span>عدد الحصص الافتراضي للوجبات (حجم الأسرة):</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[2, 4, 6, 8].map((servings) => (
                    <button
                      key={servings}
                      type="button"
                      onClick={() => setEditFormServings(servings)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${
                        editFormServings === servings
                          ? 'bg-[#2D5A46] text-white shadow-sm'
                          : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      {servings} أشخاص
                    </button>
                  ))}
                </div>
              </div>

              {/* Favorite Cuisines */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#242A26] flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#E26D46]" />
                  <span>المطابخ والأكلات المفضلة لديك:</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {CUISINES_OPTIONS.map((cuisine) => {
                    const isSelected = editFormCuisines.includes(cuisine);
                    return (
                      <button
                        key={cuisine}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setEditFormCuisines(editFormCuisines.filter((c) => c !== cuisine));
                          } else {
                            setEditFormCuisines([...editFormCuisines, cuisine]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                          isSelected
                            ? 'bg-[#E26D46] text-white shadow-xs'
                            : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                        <span>{cuisine}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={handleSaveProfileChanges}
                className="flex-1 py-3 rounded-2xl bg-[#E26D46] hover:bg-[#D15B35] text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>حفظ التعديلات على البيانات</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditProfileModalOpen(false)}
                className="px-5 py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition-colors"
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
