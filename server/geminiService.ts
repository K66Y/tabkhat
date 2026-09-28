import { GoogleGenAI, Type } from '@google/genai';
import { parseVoiceRecipe } from '../src/utils/voiceRecipeParser.ts';
import { validateVoiceRecipe } from '../src/utils/validateVoiceRecipe.ts';

// Initialize the Google Gen AI client with environment key
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export interface ParsedRecipeResult {
  title: string;
  description: string;
  category: string;
  cuisine: string;
  prepTime: number;
  cookTime: number;
  difficulty: 'سهل' | 'متوسط' | 'متقدم';
  baseServings: number;
  calories: number;
  imageUrl: string;
  ingredients: {
    name: string;
    amount: number;
    unit: string;
    category: 'خضار وفواكه' | 'لحوم ودواجن' | 'توابل وبهارات' | 'معلبات ومؤونة' | 'ألبان وأجبان' | 'أخرى';
  }[];
  steps: {
    stepNumber: number;
    instruction: string;
    timerMinutes?: number;
  }[];
  tags: string[];
}

export async function parseRecipeFromSpokenText(spokenText: string) {
  if (!ai || !apiKey) {
    // High quality intelligent heuristic fallback if API key is not configured
    return parseVoiceRecipe(spokenText);
  }

  const prompt = `أنت شيف وخبير طهي محترف ومحلل وصفات ذكي لتطبيق "طبخات".
قام المستخدم بسرد أو إملاء وصفة طبخ بصوته أو بلهجة عامية أو عربية غير مرتبة:
"""${spokenText}"""

مهمتك:
1. استخراج اسم الطبخة الجذاب بدقة.
2. كتابة وصف شهي مختصر للطبخة (سطرين).
3. تحديد التصنيف الأنسب: (أطباق رئيسية، أطباق خليجية وسعودية، شوربات، مقبلات وسلطات، حلا وحلويات، فطور، وجبات سريعة، وجبات صحية، مشروبات).
4. تحديد المطبخ/الأصل (سعودي، خليجي، شامي، مصري، مغربي، أو عالمي).
5. تقدير وقت التحضير بالدقائق (prepTime) ووقت الطهي بالدقائق (cookTime).
6. تحديد الصعوبة: (سهل أو متوسط أو متقدم).
7. تحديد عدد الحصص (baseServings - رقم مثل 4) والسعرات التقريبية للحصة (calories).
8. استخراج كل المقادير بدقة مع تقسيمها إلى: name (اسم المكون فقط بدون كمية)، amount (رقم مثل 1 أو 2 أو 0.5)، unit (الوحدة مثل كوب، ملعقة كبيرة، حبة، جرام، كيلو، رشة)، category (من: خضار وفواكه، لحوم ودواجن، توابل وبهارات، معلبات ومؤونة، ألبان وأجبان، أخرى).
9. ترتيب خطوات التحضير رقمياً بنظام متسلسل وواضح، وإذا كانت أي خطوة تتطلب وقتاً (مثل "اتركه يغلي 20 دقيقة" أو "حمره 10 دقائق") ضع timerMinutes بدقة.
10. لا تغيّر صورة المستخدم ولا تخترع روابط صور.
قواعد ملزمة: استخرج المقادير والكميات والخطوات المذكورة فقط. لا تضف مكونات أو خطوات عامة أو بدائل غير مذكورة. اترك مصفوفة المقادير أو الخطوات فارغة عند غيابها. الوصف له تسجيل مستقل فلا تضع الإملاء في الوصف. لا تخترع وقتًا أو سعرات أو حصصًا: استخدم 0 للأرقام غير المذكورة وسلسلة فارغة للنصوص غير المذكورة.
افهم العامية السعودية: «طبخت كبسة دجاج» اسم طبق وليس مكونًا. «حطيت» و«ضفت» تفصل إضافات المقادير. «ثلاث كاسات موية على أربع كاسات رز» تعني ماء 3 أكواب ورز 4 أكواب. لا تستنتج كمية دجاج من اسم الطبق. الكسر المشوّه مثل «4\\1» غير مؤكد، استخدم null لكمية هذا المكون. «ربع ملعقة» تعني 0.25. لا تفترض حجم الملعقة إن لم يذكره المستخدم. إذا لم تُذكر كمية فضع null. لا تضع «حطيت» أو اسم الطبخة أو جملة كاملة في name.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            category: { type: Type.STRING },
            cuisine: { type: Type.STRING },
            prepTime: { type: Type.NUMBER },
            cookTime: { type: Type.NUMBER },
            difficulty: { type: Type.STRING, enum: ['سهل', 'متوسط', 'متقدم'] },
            baseServings: { type: Type.NUMBER },
            calories: { type: Type.NUMBER },
            imageUrl: { type: Type.STRING },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            ingredients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  amount: { type: Type.NUMBER, nullable: true },
                  unit: { type: Type.STRING },
                  category: {
                    type: Type.STRING,
                    enum: ['خضار وفواكه', 'لحوم ودواجن', 'توابل وبهارات', 'معلبات ومؤونة', 'ألبان وأجبان', 'أخرى'],
                  },
                },
                required: ['name', 'amount', 'unit', 'category'],
              },
            },
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  stepNumber: { type: Type.NUMBER },
                  instruction: { type: Type.STRING },
                  timerMinutes: { type: Type.NUMBER },
                },
                required: ['stepNumber', 'instruction'],
              },
            },
          },
          required: [
            'title',
            'description',
            'category',
            'cuisine',
            'prepTime',
            'cookTime',
            'difficulty',
            'baseServings',
            'calories',
            'ingredients',
            'steps',
          ],
        },
      },
    });

    return validateVoiceRecipe(JSON.parse(response.text || '{}'), spokenText);
  } catch (err) {
    console.error('Gemini recipe parse error, using heuristic fallback:', err);
    return parseVoiceRecipe(spokenText);
  }
}

export async function suggestRecipeFromIngredients(ingredientsList: string[]): Promise<ParsedRecipeResult> {
  if (!ai || !apiKey) {
    return fallbackFridgeRecipe(ingredientsList);
  }

  const prompt = `أنت شيف ماهر وذكي في تطبيق "طبخات".
المستخدم يمتلك في ثلاجته ومطبخه المكونات التالية:
${ingredientsList.join('، ')}

ابتكر وصفة عربية أو عالمية ممتازة ولذيذة تستغل هذه المكونات بشكل أساسي مع أساسيات المطبخ البسيطة (مثل الملح والزيت والماء).
قم بملء تفاصيل الوصفة كاملة بدقة عالية باللغة العربية:
الاسم، الوصف، التصنيف، المطبخ، وقت التحضير، وقت الطهي، الصعوبة، الحصص، السعرات، المقادير مع الكميات والوحدات والأقسام، وخطوات التحضير مع المؤقتات بالدقائق.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            category: { type: Type.STRING },
            cuisine: { type: Type.STRING },
            prepTime: { type: Type.NUMBER },
            cookTime: { type: Type.NUMBER },
            difficulty: { type: Type.STRING, enum: ['سهل', 'متوسط', 'متقدم'] },
            baseServings: { type: Type.NUMBER },
            calories: { type: Type.NUMBER },
            imageUrl: { type: Type.STRING },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            ingredients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  amount: { type: Type.NUMBER },
                  unit: { type: Type.STRING },
                  category: {
                    type: Type.STRING,
                    enum: ['خضار وفواكه', 'لحوم ودواجن', 'توابل وبهارات', 'معلبات ومؤونة', 'ألبان وأجبان', 'أخرى'],
                  },
                },
                required: ['name', 'amount', 'unit', 'category'],
              },
            },
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  stepNumber: { type: Type.NUMBER },
                  instruction: { type: Type.STRING },
                  timerMinutes: { type: Type.NUMBER },
                },
                required: ['stepNumber', 'instruction'],
              },
            },
          },
          required: ['title', 'description', 'category', 'cuisine', 'prepTime', 'cookTime', 'difficulty', 'baseServings', 'calories', 'ingredients', 'steps'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    if (!parsed.imageUrl) {
      parsed.imageUrl = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80';
    }
    return parsed as ParsedRecipeResult;
  } catch (err) {
    console.error('Gemini fridge suggestion error:', err);
    return fallbackFridgeRecipe(ingredientsList);
  }
}


function fallbackFridgeRecipe(ingredientsList: string[]): ParsedRecipeResult {
  const mainIng = ingredientsList[0] || 'الخضار المتوفرة';
  return {
    title: `صينية ${mainIng} المبتكرة بالفرن`,
    description: `وجبة شهية ومبتكرة مصممة خصيصاً من المكونات المتوفرة لديك: ${ingredientsList.join('، ')}.`,
    category: 'وجبات سريعة',
    cuisine: 'عربي',
    prepTime: 10,
    cookTime: 25,
    difficulty: 'سهل',
    baseServings: 3,
    calories: 360,
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80',
    tags: ['ماذا أطبخ اليوم', 'اقتراح الثلاجة', 'سريع'],
    ingredients: ingredientsList.map((ing, idx) => ({
      name: ing,
      amount: idx === 0 ? 2 : 1,
      unit: 'حبة أو مقدار مناسب',
      category: 'خضار وفواكه',
    })),
    steps: [
      { stepNumber: 1, instruction: 'تقطيع المكونات المتوفرة إلى قطع متساوية وتتبيلها بالملح وزيت الزيتون والبهارات المفضلة.', timerMinutes: 5 },
      { stepNumber: 2, instruction: 'وضع المكونات في صينية مدهونة وإدخالها الفرن الساخن على حرارة 190 مئوية.', timerMinutes: 20 },
      { stepNumber: 3, instruction: 'تقديمها دافئة كوجبة مغذية وسريعة.' },
    ],
  };
}
