import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { RecipeProvider, useRecipes } from './context/RecipeContext';
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
        <TabkhatMain />
      </RecipeProvider>
    </AuthProvider>
  );
}
