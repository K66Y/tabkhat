import React, { useState, useEffect, useRef } from 'react';
import { useRecipes } from '../context/RecipeContext';
import {
  Recipe,
  RecipeCategory,
  DifficultyLevel,
  IngredientCategory,
} from '../types/recipe';
import { parseArabicRecipeLocally } from '../utils/arabicRecipeParser';
import {
  X,
  Plus,
  Mic,
  Square,
  Camera,
  Trash2,
  Loader2,
  Check,
  Edit3,
  Sparkles,
  Link,
  Wand2,
} from 'lucide-react';

interface VoiceRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipeToEdit?: Recipe | null;
}

const PRESET_IMAGES = [
  {
    id: 'rice-mandi',
    url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
    label: 'كبسة ومندي أرز',
  },
  {
    id: 'ribs',
    url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    label: 'مشويات ولحوم',
  },
  {
    id: 'chicken',
    url: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=800&q=80',
    label: 'دجاج محمر',
  },
  {
    id: 'seafood',
    url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80',
    label: 'سمك ومأكولات بحرية',
  },
  {
    id: 'pizza',
    url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
    label: 'بيتزا ومعجنات',
  },
  {
    id: 'burger',
    url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    label: 'برجر وسريع',
  },
  {
    id: 'pasta',
    url: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281292?auto=format&fit=crop&w=800&q=80',
    label: 'مكرونة وباستا',
  },
  {
    id: 'soup',
    url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80',
    label: 'شوربة ساخنة',
  },
  {
    id: 'bowl',
    url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    label: 'سلطة وصحي',
  },
  {
    id: 'pancakes',
    url: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=800&q=80',
    label: 'بان كيك وحلويات',
  },
  {
    id: 'breakfast',
    url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
    label: 'فطور وبيض',
  },
  {
    id: 'drinks',
    url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
    label: 'مشروبات وعصائر',
  },
];

export const VoiceRecipeModal: React.FC<VoiceRecipeModalProps> = ({
  isOpen,
  onClose,
  recipeToEdit,
}) => {
  const { addRecipe, updateRecipe, showToast } = useRecipes();

  // Recipe form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<RecipeCategory>('أطباق رئيسية');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('سهل');
  const [prepTime, setPrepTime] = useState<number>(15);
  const [cookTime, setCookTime] = useState<number>(25);
  const [baseServings, setBaseServings] = useState<number>(4);
  const [calories, setCalories] = useState<number>(350);
  const [imageUrl, setImageUrl] = useState(PRESET_IMAGES[0].url);
  const [customImageUrlInput, setCustomImageUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  // Quick ingredient bulk text distributor box
  const [showBulkIngredientBox, setShowBulkIngredientBox] = useState(false);
  const [bulkIngredientText, setBulkIngredientText] = useState('');

  // Ingredients matching screenshot: Name on Right -> Amount -> Unit -> Delete on Left
  const [ingredients, setIngredients] = useState<
    { id: string; name: string; amount: number | string; unit: string; category: IngredientCategory }[]
  >([
    { id: '1', name: '', amount: 1, unit: 'كوب', category: 'معلبات ومؤونة' },
    { id: '2', name: '', amount: 2, unit: 'ملعقة كبيرة', category: 'توابل وبهارات' },
  ]);

  // Steps matching screenshot
  const [steps, setSteps] = useState<
    { stepNumber: number; instruction: string; timerMinutes?: number | string }[]
  >([
    { stepNumber: 1, instruction: '', timerMinutes: '' },
    { stepNumber: 2, instruction: '', timerMinutes: '' },
  ]);

  // Sync form with recipeToEdit or reset on open
  useEffect(() => {
    if (recipeToEdit) {
      setTitle(recipeToEdit.title || '');
      setDescription(recipeToEdit.description || '');
      setCategory(recipeToEdit.category || 'أطباق رئيسية');
      setDifficulty(recipeToEdit.difficulty || 'سهل');
      setPrepTime(recipeToEdit.prepTime || 15);
      setCookTime(recipeToEdit.cookTime || 25);
      setBaseServings(recipeToEdit.baseServings || 4);
      setCalories(recipeToEdit.calories || 350);
      setImageUrl(recipeToEdit.imageUrl || PRESET_IMAGES[0].url);

      if (recipeToEdit.ingredients && recipeToEdit.ingredients.length > 0) {
        setIngredients(
          recipeToEdit.ingredients.map((ing, idx) => ({
            id: ing.id || String(idx + 1),
            name: ing.name,
            amount: ing.amount,
            unit: ing.unit,
            category: ing.category,
          }))
        );
      }

      if (recipeToEdit.steps && recipeToEdit.steps.length > 0) {
        setSteps(
          recipeToEdit.steps.map((st) => ({
            stepNumber: st.stepNumber,
            instruction: st.instruction,
            timerMinutes: st.timerMinutes !== undefined ? st.timerMinutes : '',
          }))
        );
      }
    } else if (isOpen) {
      setTitle('');
      setDescription('');
      setCategory('أطباق رئيسية');
      setDifficulty('سهل');
      setPrepTime(15);
      setCookTime(25);
      setBaseServings(4);
      setCalories(350);
      setImageUrl(PRESET_IMAGES[0].url);
      setIngredients([
        { id: '1', name: '', amount: 1, unit: 'كوب', category: 'معلبات ومؤونة' },
        { id: '2', name: '', amount: 2, unit: 'ملعقة كبيرة', category: 'توابل وبهارات' },
      ]);
      setSteps([
        { stepNumber: 1, instruction: '', timerMinutes: '' },
        { stepNumber: 2, instruction: '', timerMinutes: '' },
      ]);
    }
  }, [recipeToEdit, isOpen]);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Web Speech API
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'ar-SA';

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript + ' ';
          }
          setTranscript(currentTranscript);
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      // Fallback: prompt for input or simulate speech recognition
      const simulatedText = window.prompt(
        'المتصفح لا يدعم الميكروفون المباشر. اكتب أو الصق وصف الطبخة وسيقوم النظام بفرز المقادير والأعداد وتعبئتها فوراً في الخانات:',
        '3 بيضات، كوبين طحين، نصف كوب سكر، ملعقة فانيلا، رشة ملح...'
      );
      if (simulatedText) {
        handleAnalyzeWithAI(simulatedText);
      }
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      if (transcript.trim()) {
        handleAnalyzeWithAI(transcript);
      }
    } else {
      try {
        setTranscript('');
        recognitionRef.current.start();
        setIsRecording(true);
        showToast('جاري الاستماع... اذكر المقادير والكميات (مثال: 3 بيضات، كوبين طحين...)', 'info');
      } catch {
        setIsRecording(false);
      }
    }
  };

  // Analyze spoken or written text and auto-fill every field (name, amount, unit, category)
  const handleAnalyzeWithAI = async (text: string) => {
    if (!text.trim()) return;
    setIsAnalyzing(true);
    showToast('جاري استخراج المقادير والأعداد وتوزيعها في الخانات المخصصة...', 'info');

    // 1. Instantly parse locally using intelligent Arabic extractor
    const localResult = parseArabicRecipeLocally(text);
    if (localResult.title && !title) setTitle(localResult.title);

    if (localResult.ingredients && localResult.ingredients.length > 0) {
      setIngredients(localResult.ingredients);
    }

    if (localResult.steps && localResult.steps.length > 0) {
      setSteps(localResult.steps);
    }

    // 2. Also query backend if available for enhanced rich metadata
    try {
      const res = await fetch('/api/parse-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.recipe) {
          const r = data.recipe;
          if (r.title) setTitle(r.title);
          if (r.description) setDescription(r.description);
          if (r.category) setCategory(r.category as RecipeCategory);
          if (r.prepTime) setPrepTime(Number(r.prepTime));
          if (r.cookTime) setCookTime(Number(r.cookTime));
          if (r.baseServings) setBaseServings(Number(r.baseServings));
          if (r.calories) setCalories(Number(r.calories));
          if (r.difficulty) setDifficulty(r.difficulty as DifficultyLevel);

          if (Array.isArray(r.ingredients) && r.ingredients.length > 0) {
            setIngredients(
              r.ingredients.map((ing: any, i: number) => ({
                id: 'ing-' + (i + 1),
                name: ing.name || '',
                amount: ing.amount !== undefined ? ing.amount : 1,
                unit: ing.unit || 'حبة',
                category: ing.category || 'معلبات ومؤونة',
              }))
            );
          }

          if (Array.isArray(r.steps) && r.steps.length > 0) {
            setSteps(
              r.steps.map((st: any, i: number) => ({
                stepNumber: i + 1,
                instruction: st.instruction || '',
                timerMinutes: st.timerMinutes || '',
              }))
            );
          }
        }
      }
      showToast('✨ تم توزيع وفرز المقادير والأعداد في الخانات بنجاح!', 'success');
    } catch {
      // Local extraction succeeded and populated all inputs
      showToast('✨ تم تفريغ وتوزيع المقادير والأعداد في الخانات بنجاح!', 'success');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Quick manual paste-and-distribute handler
  const handleDistributeBulkIngredients = () => {
    if (!bulkIngredientText.trim()) return;
    const parsed = parseArabicRecipeLocally(bulkIngredientText);
    if (parsed.ingredients.length > 0) {
      setIngredients(parsed.ingredients);
      showToast(`✨ تم فرز وتعبئة ${parsed.ingredients.length} مكون في الخانات تلقائياً`, 'success');
      setShowBulkIngredientBox(false);
      setBulkIngredientText('');
    } else {
      showToast('لم نتمكن من استخراج مقادير من هذا النص. اكتب مثلاً: 3 بيضات، كوب حليب', 'warning');
    }
  };

  // Handle local image upload
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setImageUrl(uploadEvent.target.result as string);
          showToast('تم رفع وتحديث صورة وصفتك بنجاح', 'success');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle apply custom image URL
  const handleApplyCustomImageUrl = () => {
    if (!customImageUrlInput.trim()) return;
    setImageUrl(customImageUrlInput.trim());
    showToast('تم اعتماد رابط الصورة بنجاح', 'success');
    setShowUrlInput(false);
    setCustomImageUrlInput('');
  };

  // Add ingredient row
  const addIngredientRow = () => {
    setIngredients((prev) => [
      ...prev,
      {
        id: 'ing-' + Date.now(),
        name: '',
        amount: 1,
        unit: 'حبة',
        category: 'خضار وفواكه',
      },
    ]);
  };

  // Remove ingredient row
  const removeIngredientRow = (id: string) => {
    if (ingredients.length <= 1) {
      showToast('يجب أن تحتوي الوصفة على مكون واحد على الأقل', 'warning');
      return;
    }
    setIngredients((prev) => prev.filter((item) => item.id !== id));
  };

  // Add step row
  const addStepRow = () => {
    setSteps((prev) => [
      ...prev,
      {
        stepNumber: prev.length + 1,
        instruction: '',
        timerMinutes: '',
      },
    ]);
  };

  // Remove step row
  const removeStepRow = (idx: number) => {
    if (steps.length <= 1) {
      showToast('يجب أن تحتوي الوصفة على خطوة تحضير واحدة على الأقل', 'warning');
      return;
    }
    const updated = steps.filter((_, i) => i !== idx);
    setSteps(updated.map((s, i) => ({ ...s, stepNumber: i + 1 })));
  };

  // Submit recipe
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast('الرجاء كتابة اسم الطبخة / الوصفة', 'warning');
      return;
    }

    const validIngredients = ingredients
      .filter((i) => i.name.trim())
      .map((i, idx) => ({
        id: 'ing-' + (idx + 1),
        name: i.name.trim(),
        amount: Number(i.amount) || 1,
        unit: i.unit || 'حبة',
        category: i.category || 'معلبات ومؤونة',
      }));

    if (validIngredients.length === 0) {
      showToast('الرجاء كتابة اسم مكون واحد على الأقل', 'warning');
      return;
    }

    const validSteps = steps
      .filter((s) => s.instruction.trim())
      .map((s, idx) => ({
        stepNumber: idx + 1,
        instruction: s.instruction.trim(),
        timerMinutes: s.timerMinutes ? Number(s.timerMinutes) : undefined,
      }));

    if (validSteps.length === 0) {
      showToast('الرجاء كتابة خطوة تحضير واحدة على الأقل', 'warning');
      return;
    }

    if (recipeToEdit) {
      updateRecipe(recipeToEdit.id, {
        title: title.trim(),
        description: description.trim() || 'وصفة خاصة لذيذة ومبتكرة مضافة في دفتر وصفاتي.',
        category,
        prepTime: Number(prepTime) || 15,
        cookTime: Number(cookTime) || 25,
        difficulty,
        baseServings: Number(baseServings) || 4,
        calories: Number(calories) || 350,
        imageUrl,
        ingredients: validIngredients,
        steps: validSteps,
      });
      onClose();
      return;
    }

    addRecipe({
      title: title.trim(),
      description: description.trim() || 'وصفة خاصة لذيذة ومبتكرة مضافة في دفتر وصفاتي.',
      category,
      cuisine: 'سعودي',
      prepTime: Number(prepTime) || 15,
      cookTime: Number(cookTime) || 25,
      difficulty,
      baseServings: Number(baseServings) || 4,
      calories: Number(calories) || 350,
      imageUrl,
      ingredients: validIngredients,
      steps: validSteps,
      tags: ['وصفاتي', category],
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FAF8F5] w-full max-w-xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-stone-200">
        {/* Top Header matching IMG_2071: Right: [+] or [Check]  Center: Title  Left: [X] */}
        <div className="px-5 py-3.5 bg-white border-b border-stone-200/90 flex items-center justify-between shrink-0">
          {/* Right Plus or Check Button in RTL */}
          <button
            onClick={handleSubmit}
            type="button"
            className="w-9 h-9 rounded-full bg-orange-100 hover:bg-orange-200 text-[#E26D46] flex items-center justify-center transition-colors"
            title={recipeToEdit ? 'حفظ التعديلات' : 'حفظ الوصفة'}
          >
            {recipeToEdit ? (
              <Check className="w-5 h-5 stroke-[2.5]" />
            ) : (
              <Plus className="w-5 h-5 stroke-[2.5]" />
            )}
          </button>

          {/* Center Title in RTL */}
          <h2 className="font-heading font-black text-base sm:text-lg text-[#242A26] flex items-center gap-1.5">
            {recipeToEdit ? (
              <>
                <Edit3 className="w-4 h-4 text-[#E26D46]" />
                <span>تعديل الطبخة والمقادير والصور</span>
              </>
            ) : (
              <span>إضافة وصفة جديدة</span>
            )}
          </h2>

          {/* Left Close Button in RTL */}
          <button
            onClick={onClose}
            type="button"
            aria-label="إغلاق"
            className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* 🎙️ Voice Recording Banner (Matches IMG_2071: Right: Mic + Texts | Left: 'فتح المايك') */}
          <div className="bg-[#FFF6F0] rounded-2xl p-4 border border-orange-200/70 shadow-2xs relative">
            <div className="flex items-center justify-between gap-3">
              {/* Right Side in RTL: Mic Icon & Texts */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors ${
                    isRecording
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-[#E26D46] text-white shadow-sm'
                  }`}
                >
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-xs sm:text-sm text-[#242A26] flex items-center gap-1.5">
                    <span>فرز المقادير والأعداد بالصوت تلقائياً</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  </h3>
                  <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">
                    تحدث بلهجتك (مثال: 3 بيضات، كوبين طحين...) وسيقوم النظام بتوزيعها في الخانات
                  </p>
                </div>
              </div>

              {/* Left Side in RTL: Action Button */}
              <button
                type="button"
                onClick={toggleRecording}
                disabled={isAnalyzing}
                className={`px-3.5 py-2 rounded-xl font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-sm transition-all active:scale-95 ${
                  isRecording
                    ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                    : 'bg-[#2D5A46] hover:bg-[#234837] text-white'
                }`}
              >
                {isRecording ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-white" />
                    <span>إيقاف وتفريغ</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5" />
                    <span>تحدث الآن</span>
                  </>
                )}
              </button>
            </div>

            {/* Loading / Analyzing status */}
            {isAnalyzing && (
              <div className="mt-3 pt-3 border-t border-orange-200/50 flex items-center justify-center gap-2 text-xs font-bold text-[#E26D46]">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري فرز المقادير والأعداد في الخانات المخصصة...</span>
              </div>
            )}

            {/* Transcript Preview */}
            {transcript && !isAnalyzing && (
              <div className="mt-3 p-2.5 rounded-xl bg-white/80 border border-orange-200 text-xs text-stone-700">
                <span className="font-bold text-[#E26D46]">النص الملتقط: </span>
                {transcript}
              </div>
            )}
          </div>

          {/* 📷 Image Section (Matches IMG_2071) */}
          <div className="space-y-2 text-right">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#242A26]">
                صورة الوصفة (تعديل أو اختيار):
              </label>
              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="text-[11px] font-bold text-[#E26D46] hover:underline flex items-center gap-1"
              >
                <Link className="w-3 h-3" />
                <span>{showUrlInput ? 'إخفاء رابط الصورة' : 'وضع رابط صورة مباشر'}</span>
              </button>
            </div>

            {/* Custom URL Input if toggled */}
            {showUrlInput && (
              <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-stone-200">
                <input
                  type="url"
                  value={customImageUrlInput}
                  onChange={(e) => setCustomImageUrlInput(e.target.value)}
                  placeholder="https://example.com/food-photo.jpg"
                  className="flex-1 px-3 py-1.5 text-xs text-left bg-stone-50 rounded-lg border border-stone-200 focus:outline-none focus:bg-white"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={handleApplyCustomImageUrl}
                  className="px-3 py-1.5 bg-[#E26D46] text-white text-xs font-bold rounded-lg shrink-0"
                >
                  تطبيق
                </button>
              </div>
            )}

            {/* Big Preview Image */}
            <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-stone-200/90 shadow-2xs bg-stone-100">
              <img
                src={imageUrl}
                alt="معاينة الوصفة"
                className="w-full h-full object-cover"
              />

              {/* Upload from device / Camera button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-3 left-3 px-3 py-1.5 rounded-xl bg-black/75 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 backdrop-blur-xs"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>رفع صورة من جهازك / الكاميرا</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="hidden"
              />
            </div>

            {/* Preset Thumbnails */}
            <div className="pt-1">
              <span className="text-[11px] text-stone-500 font-medium block mb-1.5">
                أو اختر صورة جاهزة عالية الدقة بنقرة واحدة:
              </span>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {PRESET_IMAGES.map((preset) => {
                  const isSelected = imageUrl === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setImageUrl(preset.url)}
                      title={preset.label}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all active:scale-90 group ${
                        isSelected
                          ? 'border-[#E26D46] ring-2 ring-[#E26D46]/30 scale-105'
                          : 'border-transparent opacity-85 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-white text-center py-0.5 truncate px-1">
                        {preset.label}
                      </span>
                      {isSelected && (
                        <div className="absolute inset-0 bg-[#E26D46]/25 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 🏷️ Title Input (Matches IMG_2071) */}
          <div className="space-y-1.5 text-right">
            <label className="block text-xs font-bold text-[#242A26]">
              اسم الطبخة / الوصفة *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: مندي لحم مع الأرز المدخن أو كيكة الشوكولاتة"
              className="w-full px-4 py-2.5 rounded-2xl bg-white border border-stone-200/90 text-xs sm:text-sm text-[#242A26] placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#E26D46]/40 shadow-2xs text-right"
            />
          </div>

          {/* 📝 Short Description (Matches IMG_2071) */}
          <div className="space-y-1.5 text-right">
            <label className="block text-xs font-bold text-[#242A26]">
              وصف الطبخة:
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف شهي ومختصر للطبخة ونكهاتها المميزة..."
              className="w-full px-4 py-2 rounded-2xl bg-white border border-stone-200/90 text-xs sm:text-sm text-[#242A26] placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#E26D46]/40 shadow-2xs text-right resize-none"
            />
          </div>

          {/* 🍽️ Category & Difficulty Selectors (Matches IMG_2071) */}
          <div className="grid grid-cols-2 gap-3 text-right">
            {/* Category */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-stone-600">
                التصنيف
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as RecipeCategory)}
                className="w-full p-2.5 rounded-xl bg-white border border-stone-200/90 text-xs font-bold text-[#242A26] shadow-2xs focus:outline-none text-right"
              >
                <option value="أطباق رئيسية">أطباق رئيسية</option>
                <option value="أطباق خليجية وسعودية">أطباق خليجية وسعودية</option>
                <option value="شوربات">شوربات</option>
                <option value="مقبلات وسلطات">مقبلات وسلطات</option>
                <option value="حلا وحلويات">حلا وحلويات</option>
                <option value="فطور">فطور</option>
                <option value="وجبات سريعة">وجبات سريعة</option>
                <option value="وجبات صحية">وجبات صحية</option>
                <option value="مشروبات">مشروبات</option>
              </select>
            </div>

            {/* Difficulty */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-stone-600">
                مستوى الصعوبة
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                className="w-full p-2.5 rounded-xl bg-white border border-stone-200/90 text-xs font-bold text-[#242A26] shadow-2xs focus:outline-none text-right"
              >
                <option value="سهل">سهل</option>
                <option value="متوسط">متوسط</option>
                <option value="متقدم">متقدم</option>
              </select>
            </div>
          </div>

          {/* ⏱️ 4 Metrics (Prep Time, Cook Time, Servings, Calories) */}
          <div className="grid grid-cols-4 gap-2 text-center">
            {/* Prep Time */}
            <div className="space-y-1">
              <span className="block text-[11px] font-bold text-stone-600">التحضير (د)</span>
              <input
                type="number"
                min={1}
                value={prepTime}
                onChange={(e) => setPrepTime(Number(e.target.value) || 0)}
                className="w-full py-2 px-1 text-center font-bold text-xs sm:text-sm rounded-xl bg-white border border-stone-200/90 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#E26D46]/40"
              />
            </div>

            {/* Cook Time */}
            <div className="space-y-1">
              <span className="block text-[11px] font-bold text-stone-600">الطبخ (د)</span>
              <input
                type="number"
                min={0}
                value={cookTime}
                onChange={(e) => setCookTime(Number(e.target.value) || 0)}
                className="w-full py-2 px-1 text-center font-bold text-xs sm:text-sm rounded-xl bg-white border border-stone-200/90 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#E26D46]/40"
              />
            </div>

            {/* Servings */}
            <div className="space-y-1">
              <span className="block text-[11px] font-bold text-stone-600">الأشخاص</span>
              <input
                type="number"
                min={1}
                value={baseServings}
                onChange={(e) => setBaseServings(Number(e.target.value) || 1)}
                className="w-full py-2 px-1 text-center font-bold text-xs sm:text-sm rounded-xl bg-white border border-stone-200/90 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#E26D46]/40"
              />
            </div>

            {/* Calories (Leftmost in RTL) */}
            <div className="space-y-1">
              <span className="block text-[11px] font-bold text-stone-600">السعرات</span>
              <input
                type="number"
                min={0}
                value={calories}
                onChange={(e) => setCalories(Number(e.target.value) || 0)}
                className="w-full py-2 px-1 text-center font-bold text-xs sm:text-sm rounded-xl bg-white border border-stone-200/90 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#E26D46]/40"
              />
            </div>
          </div>

          {/* 🧂 Ingredients Section (Matches IMG_2072: Right: Title | Left: '+ إضافة مكون') */}
          <div className="bg-white p-4 rounded-3xl border border-stone-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              {/* Right: Section Title */}
              <h3 className="font-heading font-bold text-xs sm:text-sm text-[#242A26] flex items-center gap-1.5">
                <span>المقادير والأعداد ({ingredients.length})</span>
                <span>🧂</span>
              </h3>

              {/* Action buttons on left */}
              <div className="flex items-center gap-2">
                {/* Quick Paste & Auto-distribute button */}
                <button
                  type="button"
                  onClick={() => setShowBulkIngredientBox(!showBulkIngredientBox)}
                  className="text-xs font-bold text-[#E26D46] hover:text-[#D15B35] flex items-center gap-1 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200 active:scale-95"
                  title="لصق أو كتابة نص وتوزيعه في الخانات فوراً"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>توزيع تلقائي</span>
                </button>

                {/* Add single ingredient button */}
                <button
                  type="button"
                  onClick={addIngredientRow}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>مكون جديد</span>
                </button>
              </div>
            </div>

            {/* Quick bulk paste / text distribute box */}
            {showBulkIngredientBox && (
              <div className="p-3 bg-orange-50/70 border border-orange-200 rounded-2xl space-y-2">
                <p className="text-[11px] text-stone-600 font-semibold">
                  الصق أو اكتب المقادير وسيتولى النظام فرز الاسم والعدد والوحدة في الخانات:
                </p>
                <textarea
                  rows={2}
                  value={bulkIngredientText}
                  onChange={(e) => setBulkIngredientText(e.target.value)}
                  placeholder="مثال: 3 بيضات، كوبين طحين، نصف كوب سكر، ملعقة فانيلا، رشة ملح"
                  className="w-full p-2.5 text-xs rounded-xl bg-white border border-stone-200 text-[#242A26] focus:outline-none focus:ring-1 focus:ring-[#E26D46]"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleDistributeBulkIngredients}
                    className="px-3.5 py-1.5 bg-[#E26D46] hover:bg-[#D15B35] text-white text-xs font-bold rounded-lg shadow-sm"
                  >
                    توزيع المقادير في الخانات الآن ✨
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBulkIngredientBox(false)}
                    className="px-2.5 py-1.5 bg-stone-100 text-stone-600 text-xs rounded-lg"
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            )}

            {/* Column Labels */}
            <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-stone-500 px-1 pt-1">
              <span className="col-span-5 text-right">اسم المكون</span>
              <span className="col-span-2 text-center">العدد/الكمية</span>
              <span className="col-span-4 text-right">الوحدة</span>
              <span className="col-span-1 text-center">حذف</span>
            </div>

            {/* Ingredients rows: Name on Right -> Amount -> Unit -> Delete on Left */}
            <div className="space-y-2.5">
              {ingredients.map((ing) => (
                <div key={ing.id} className="grid grid-cols-12 gap-2 items-center">
                  {/* Ingredient name input (Right in RTL: 5 cols) */}
                  <div className="col-span-5">
                    <input
                      type="text"
                      value={ing.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setIngredients((prev) =>
                          prev.map((i) => (i.id === ing.id ? { ...i, name: val } : i))
                        );
                      }}
                      placeholder="مثال: بيض"
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs text-[#242A26] placeholder-stone-400 focus:outline-none focus:bg-white focus:border-[#E26D46] text-right"
                    />
                  </div>

                  {/* Amount/Count input (2 cols, e.g. 3) */}
                  <div className="col-span-2">
                    <input
                      type="number"
                      min={0.1}
                      step={0.5}
                      value={ing.amount}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        setIngredients((prev) =>
                          prev.map((i) => (i.id === ing.id ? { ...i, amount: val } : i))
                        );
                      }}
                      title="العدد أو الكمية (مثلاً 3 بيضات)"
                      className="w-full py-2 text-center rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-[#242A26] focus:outline-none"
                    />
                  </div>

                  {/* Unit select (4 cols) */}
                  <div className="col-span-4">
                    <select
                      value={ing.unit}
                      onChange={(e) => {
                        const val = e.target.value;
                        setIngredients((prev) =>
                          prev.map((i) => (i.id === ing.id ? { ...i, unit: val } : i))
                        );
                      }}
                      className="w-full px-2 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold text-[#242A26] focus:outline-none text-right"
                    >
                      <option value="حبة">حبة</option>
                      <option value="كوب">كوب</option>
                      <option value="ملعقة كبيرة">ملعقة كبيرة</option>
                      <option value="ملعقة صغيرة">ملعقة صغيرة</option>
                      <option value="جرام">جرام</option>
                      <option value="كيلو">كيلو</option>
                      <option value="فص">فص</option>
                      <option value="رشة">رشة</option>
                      <option value="علبة">علبة</option>
                      <option value="لتر">لتر</option>
                      <option value="مل">مل</option>
                    </select>
                  </div>

                  {/* Delete button (Left in RTL: 1 col) */}
                  <div className="col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => removeIngredientRow(ing.id)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="حذف المكون"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 👨‍🍳 Steps Section (Matches IMG_2072: Right: Title | Left: '+ إضافة خطوة') */}
          <div className="bg-white p-4 rounded-3xl border border-stone-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              {/* Right: Section Title */}
              <h3 className="font-heading font-bold text-xs sm:text-sm text-[#242A26] flex items-center gap-1">
                <span>خطوات التحضير ({steps.length})</span>
                <span>👨‍🍳</span>
              </h3>

              {/* Left: Add step button */}
              <button
                type="button"
                onClick={addStepRow}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة خطوة</span>
              </button>
            </div>

            {/* Steps list */}
            <div className="space-y-3">
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  className="bg-stone-50/70 p-3.5 rounded-2xl border border-stone-200/80 space-y-2 text-right"
                >
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-full bg-[#E26D46] text-white text-xs font-bold flex items-center justify-center">
                      {step.stepNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeStepRow(idx)}
                      className="text-stone-400 hover:text-rose-600 text-xs p-1"
                      title="حذف الخطوة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Instruction Input */}
                  <textarea
                    rows={2}
                    value={step.instruction}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSteps((prev) =>
                        prev.map((s, i) => (i === idx ? { ...s, instruction: val } : s))
                      );
                    }}
                    placeholder={`اكتب تفاصيل الخطوة ${step.stepNumber}...`}
                    className="w-full p-2.5 rounded-xl bg-white border border-stone-200 text-xs text-[#242A26] placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#E26D46] text-right"
                  />

                  {/* Optional Timer: Right: Label | Left: Input */}
                  <div className="flex items-center justify-start gap-2 text-xs">
                    <span className="text-stone-500 font-medium">مؤقت اختياري (دقائق):</span>
                    <input
                      type="number"
                      min={1}
                      value={step.timerMinutes}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSteps((prev) =>
                          prev.map((s, i) => (i === idx ? { ...s, timerMinutes: val } : s))
                        );
                      }}
                      placeholder="مثال: 15"
                      className="w-24 px-2 py-1.5 text-center rounded-xl bg-white border border-stone-200 text-xs text-[#242A26] focus:outline-none focus:border-[#E26D46]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Submit Button */}
          <div className="pt-2 pb-1">
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-[#E26D46] hover:bg-[#D15B35] text-white font-bold text-sm sm:text-base shadow-lg shadow-[#E26D46]/35 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {recipeToEdit ? (
                <>
                  <Check className="w-5 h-5 stroke-[2.5]" />
                  <span>حفظ التعديلات على الطبخة والمقادير ✨</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                  <span>حفظ الوصفة في وصفاتي</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
