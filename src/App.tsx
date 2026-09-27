import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RecipeProvider, useRecipes } from './context/RecipeContext';
import { PotLogo } from './components/PotLogo';
import { Navbar } from './components/Navbar';
import { BottomNav, TabType } from './components/BottomNav';
import { HomeScreen } from './components/HomeScreen';
import { SearchDiscover } from './components/SearchDiscover';
import { FavoritesScreen } from './components/FavoritesScreen';
import { WeeklyPlanner } from './components/WeeklyPlanner';
import { ShoppingList } from './components/ShoppingList';
import { ProfileModal } from './components/ProfileModal';
import { MyRecipesScreen } from './components/MyRecipesScreen';
import { RecipeDetailModal } from './components/RecipeDetailModal';
import { FridgeIngredientSelector } from './components/FridgeIngredientSelector';
import { VoiceRecipeModal } from './components/VoiceRecipeModal';
import { AddToPlanModal } from './components/AddToPlanModal';
import { CookingTimerWidget } from './components/CookingTimerWidget';
import { NotificationToast } from './components/NotificationToast';
import { Recipe, RecipeCategory } from './types/recipe';

const authErrorMessage = (error: unknown) => {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  if (code.includes('invalid-credential') || code.includes('wrong-password')) return 'البريد أو كلمة المرور غير صحيحة.';
  if (code.includes('email-already-in-use')) return 'هذا البريد مسجل مسبقاً، جرّب تسجيل الدخول.';
  if (code.includes('weak-password')) return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.';
  if (code.includes('invalid-email')) return 'صيغة البريد الإلكتروني غير صحيحة.';
  if (code.includes('operation-not-allowed') || code.includes('password-login-disabled')) return 'تسجيل البريد وكلمة المرور غير مفعّل بعد في Firebase. استخدم Google مؤقتًا أو فعّل مزوّد Email/Password.';
  if (code.includes('too-many-requests')) return 'توجد محاولات كثيرة. انتظر قليلًا ثم حاول مرة أخرى.';
  if (code.includes('network-request-failed')) return 'تعذر الاتصال بخدمة التسجيل. تحقق من الإنترنت وحاول مجددًا.';
  if (code.includes('unauthorized-domain')) return 'رابط التطبيق غير مصرح به في Firebase.';
  if (code.includes('popup-closed')) return 'أُغلقت نافذة تسجيل Google قبل اكتمال العملية.';
  return 'تعذر إكمال العملية الآن. تحقق من الاتصال وحاول مرة أخرى.';
};

const SplashScreen: React.FC = () => (
  <div dir="rtl" className="min-h-screen bg-[#FAF8F5] flex items-center justify-center px-6">
    <div className="text-center">
      <PotLogo size={104} className="mx-auto rounded-[2rem] shadow-lg" />
      <h1 className="mt-5 font-heading text-3xl font-black text-[#2D5A46]">طبخات</h1>
      <p className="mt-2 text-sm text-stone-500">نجهّز وصفاتك وبيانات حسابك...</p>
      <div className="mx-auto mt-5 h-1.5 w-36 overflow-hidden rounded-full bg-stone-200">
        <div className="h-full w-1/2 animate-pulse rounded-full bg-[#E26D46]" />
      </div>
    </div>
  </div>
);

const LoginGate: React.FC = () => {
  const { loginWithGoogle, loginWithEmail, registerWithEmail, resetPassword } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await action();
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (isRegistering && !name.trim()) {
      setError('اكتب اسم المستخدم أولاً.');
      return;
    }
    void run(() => isRegistering
      ? registerWithEmail(name.trim(), email.trim(), password)
      : loginWithEmail(email.trim(), password));
  };

  const sendReset = () => {
    if (!email.trim()) {
      setError('اكتب بريدك الإلكتروني أولاً ثم اضغط نسيت كلمة المرور.');
      return;
    }
    void run(async () => {
      await resetPassword(email);
      setNotice('أرسلنا رابط إعادة تعيين كلمة المرور إلى بريدك.');
    });
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-[2rem] border border-stone-200 bg-white p-6 sm:p-8 shadow-xl">
        <PotLogo size={82} className="mx-auto rounded-3xl" />
        <h1 className="mt-4 text-center font-heading text-2xl font-black text-[#2D5A46]">أهلاً بك في طبخات</h1>
      <p className="mt-2 text-center text-sm text-stone-500">سجّل دخولك أولاً لحفظ وصفاتك واسترجاعها على حسابك.</p>

        <button
          type="button"
          onClick={() => void run(loginWithGoogle)}
          disabled={busy}
          className="mt-6 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold text-stone-700 hover:bg-stone-50 disabled:opacity-60"
        >
          المتابعة باستخدام Google — الأسرع
        </button>

        <div className="my-4 flex items-center gap-3 text-xs text-stone-400"><span className="h-px flex-1 bg-stone-200" /><span>أو بالبريد</span><span className="h-px flex-1 bg-stone-200" /></div>

        <form onSubmit={submit} className="space-y-3">
          {isRegistering && (
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم المستخدم" className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E26D46]/30" />
          )}
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="البريد الإلكتروني" className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E26D46]/30" dir="ltr" />
          <input required minLength={6} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="كلمة المرور" className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E26D46]/30" dir="ltr" />
          {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700">{error}</p>}
          {notice && <p className="rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">{notice}</p>}
          <button disabled={busy} className="w-full rounded-2xl bg-[#2D5A46] px-4 py-3 text-sm font-black text-white hover:bg-[#234837] disabled:opacity-60">
            {busy ? 'جاري التحقق...' : isRegistering ? 'إنشاء الحساب والدخول' : 'تسجيل الدخول'}
          </button>
        </form>

        {!isRegistering && <button type="button" onClick={sendReset} disabled={busy} className="mt-3 w-full text-xs font-bold text-[#E26D46]">نسيت كلمة المرور؟</button>}
        <button type="button" onClick={() => { setIsRegistering((value) => !value); setError(''); setNotice(''); }} className="mt-4 w-full text-sm font-bold text-[#2D5A46]">
          {isRegistering ? 'لديك حساب؟ سجل الدخول' : 'مستخدم جديد؟ أنشئ حساباً'}
        </button>
      </div>
    </div>
  );
};

const AppGate: React.FC = () => {
  const { firebaseUser, isLoading } = useAuth();
  const { isUserDataLoading } = useRecipes();
  if (isLoading || (firebaseUser && isUserDataLoading)) return <SplashScreen />;
  if (!firebaseUser) return <LoginGate />;
  return <TabkhatMain />;
};

const TabkhatMain: React.FC = () => {
  const {
    favorites,
    selectedRecipeForDetail,
    setSelectedRecipeForDetail,
    selectedRecipeForPlan,
    setSelectedRecipeForPlan,
  } = useRecipes();

  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [isFridgeOpen, setIsFridgeOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [recipeToEdit, setRecipeToEdit] = useState<Recipe | null>(null);

  // Register service worker gracefully in supported environments
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // In dev server iframe environments, registering a service worker can sometimes trigger origin/SSL script load warnings.
      // We safely register and handle unregister/updates without throwing unhandled exceptions.
      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
          });

          // Check for updates when returning to the app from background on iOS
          const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
              registration.update().catch(() => {});
            }
          };
          document.addEventListener('visibilitychange', onVisibilityChange);
        } catch (err) {
          // Gracefully suppress dev iframe / runner script load errors
          console.debug('Service worker registration note:', err);
        }
      };

      registerSW();
    }
  }, []);

  const handleSelectRecipe = (recipe: Recipe) => {
    setSelectedRecipeForDetail(recipe);
  };

  const handleAddToPlan = (recipe: Recipe) => {
    setSelectedRecipeForPlan(recipe);
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setRecipeToEdit(recipe);
    setSelectedRecipeForDetail(null);
  };

  const handleNavigateToCategory = (_cat: RecipeCategory) => {
    setCurrentTab('search');
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#FAF8F5] text-[#242A26] flex flex-col selection:bg-[#E26D46]/20 selection:text-[#E26D46]">
      {/* Top Navigation Bar matching IMG_2067 */}
      <Navbar
        onOpenFridge={() => setIsFridgeOpen(true)}
        onOpenVoiceRecipe={() => setIsVoiceModalOpen(true)}
        onOpenFavorites={() => setCurrentTab('favorites')}
        onOpenProfile={() => setCurrentTab('profile')}
        onOpenShopping={() => setCurrentTab('shopping')}
        activeFavoritesCount={favorites.length}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-3 sm:py-5">
        {/* 1. الرئيسية */}
        {currentTab === 'home' && (
          <HomeScreen
            onSelectRecipe={handleSelectRecipe}
            onOpenFridge={() => setIsFridgeOpen(true)}
            onOpenVoiceRecipe={() => setIsVoiceModalOpen(true)}
            onAddToPlan={handleAddToPlan}
            onNavigateToCategory={handleNavigateToCategory}
            onNavigateToSearch={() => setCurrentTab('search')}
            onNavigateToPlanner={() => setCurrentTab('planner')}
            onNavigateToShopping={() => setCurrentTab('shopping')}
          />
        )}

        {/* 2. البحث والاستكشاف */}
        {currentTab === 'search' && (
          <SearchDiscover
            onSelectRecipe={handleSelectRecipe}
            onAddToPlan={handleAddToPlan}
          />
        )}

        {/* 3. المفضلة (Matches IMG_2069) */}
        {currentTab === 'favorites' && (
          <FavoritesScreen
            onSelectRecipe={handleSelectRecipe}
            onAddToPlan={handleAddToPlan}
            onExplore={() => setCurrentTab('search')}
          />
        )}

        {/* 4. وصفاتي (My Recipes & Dashboard) */}
        {currentTab === 'my-recipes' && (
          <MyRecipesScreen
            onSelectRecipe={handleSelectRecipe}
            onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
            onAddToPlan={handleAddToPlan}
            onEditRecipe={handleEditRecipe}
          />
        )}

        {/* 5. جدول الطبخ */}
        {currentTab === 'planner' && (
          <WeeklyPlanner onSelectRecipe={handleSelectRecipe} />
        )}

        {/* 6. قائمة المشتريات */}
        {currentTab === 'shopping' && <ShoppingList />}

        {/* 7. الحساب والملف الشخصي */}
        {currentTab === 'profile' && (
          <ProfileModal
            onOpenFavorites={() => setCurrentTab('favorites')}
            onOpenShopping={() => setCurrentTab('shopping')}
            onOpenPlanner={() => setCurrentTab('planner')}
            onOpenMyRecipes={() => setCurrentTab('my-recipes')}
          />
        )}
      </main>

      {/* Active Floating Cooking Timer */}
      <CookingTimerWidget />

      {/* Toast Notification Container */}
      <NotificationToast />

      {/* Bottom Sticky Navigation: [الرئيسية | البحث | + إضافة | المفضلة | الحساب] */}
      <BottomNav
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenAddRecipe={() => setIsVoiceModalOpen(true)}
      />

      {/* Interactive Modals */}
      {selectedRecipeForDetail && (
        <RecipeDetailModal
          recipe={selectedRecipeForDetail}
          onClose={() => setSelectedRecipeForDetail(null)}
          onAddToPlanModal={handleAddToPlan}
          onEditRecipe={handleEditRecipe}
        />
      )}

      {selectedRecipeForPlan && (
        <AddToPlanModal
          recipe={selectedRecipeForPlan}
          onClose={() => setSelectedRecipeForPlan(null)}
        />
      )}

      {isFridgeOpen && (
        <FridgeIngredientSelector
          isOpen={isFridgeOpen}
          onClose={() => setIsFridgeOpen(false)}
          onSelectRecipe={handleSelectRecipe}
        />
      )}

      {/* إضافة أو تعديل وصفة وطبخة (Voice & Manual Recipe Modal) */}
      {(isVoiceModalOpen || recipeToEdit) && (
        <VoiceRecipeModal
          isOpen={isVoiceModalOpen || !!recipeToEdit}
          recipeToEdit={recipeToEdit}
          onClose={() => {
            setIsVoiceModalOpen(false);
            setRecipeToEdit(null);
          }}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <RecipeProvider>
        <AppGate />
      </RecipeProvider>
    </AuthProvider>
  );
}
