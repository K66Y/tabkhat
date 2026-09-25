import {
  IngredientCategory,
  RecipeCategory,
  DifficultyLevel,
} from '../types/recipe';

export interface ParsedIngredient {
  id: string;
  name: string;
  amount: number | string;
  unit: string;
  category: IngredientCategory;
}

export interface ParsedStep {
  stepNumber: number;
  instruction: string;
  timerMinutes?: number | string;
}

export interface ParsedRecipeOutput {
  title?: string;
  description?: string;
  category?: RecipeCategory;
  prepTime?: number;
  cookTime?: number;
  baseServings?: number;
  calories?: number;
  difficulty?: DifficultyLevel;
  ingredients: ParsedIngredient[];
  steps: ParsedStep[];
}

// Convert Eastern Arabic numerals (١، ٢، ٣) to Western (1, 2, 3)
export function normalizeArabicNumbers(text: string): string {
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let normalized = text;
  arabicNumerals.forEach((num, index) => {
    normalized = normalized.replaceAll(num, String(index));
  });
  return normalized;
}

// Map Arabic text numbers to numerical values
const WORD_NUMBER_MAP: Record<string, number> = {
  'نصف': 0.5,
  'نص': 0.5,
  'ربع': 0.25,
  'ثلث': 0.33,
  'واحد': 1,
  'واحدة': 1,
  'حبه': 1,
  'حبة': 1,
  'بيضه': 1,
  'بيضة': 1,
  'بصله': 1,
  'بصلة': 1,
  'طماطمه': 1,
  'طماطمة': 1,
  'دجاجه': 1,
  'دجاجة': 1,
  'اثنين': 2,
  'إثنين': 2,
  'حبتين': 2,
  'بيضتين': 2,
  'بصلتين': 2,
  'طماطمتين': 2,
  'كوبين': 2,
  'كوبان': 2,
  'كاستين': 2,
  'ملعقتين': 2,
  'ملعقتان': 2,
  'فصين': 2,
  'ثلاثة': 3,
  'ثلاث': 3,
  'اربعة': 4,
  'أربعة': 4,
  'اربع': 4,
  'أربع': 4,
  'خمسة': 5,
  'خمس': 5,
  'ستة': 6,
  'ست': 6,
  'سبعة': 7,
  'سبع': 7,
  'ثمانية': 8,
  'ثماني': 8,
  'ثمان': 8,
  'تسعة': 9,
  'تسع': 9,
  'عشرة': 10,
  'عشر': 10,
  'كيلو': 1,
  'كيلوين': 2,
};

// Known common units in cooking
const UNITS = [
  'ملعقة كبيرة',
  'ملعقة طعام',
  'ملاعق كبيرة',
  'ملعقة صغيرة',
  'ملعقة شاي',
  'ملاعق صغيرة',
  'كوب ونصف',
  'كوب وربع',
  'كوب',
  'أكواب',
  'اكواب',
  'كاسات',
  'كاسة',
  'حبة',
  'حبات',
  'بيضات',
  'بيض',
  'فصوص',
  'فص',
  'رشة',
  'رشة خفيفة',
  'علبة',
  'علب',
  'غرام',
  'جرام',
  'غم',
  'كيلو',
  'كغ',
  'مل',
  'لتر',
  'شريحة',
  'شرائح',
  'قطعة',
  'قطع',
  'عود',
  'أعواد',
  'ربطة',
  'حزمة',
  'باقة',
];

// Deduce ingredient category based on name keywords
export function deduceIngredientCategory(name: string): IngredientCategory {
  const lower = name.toLowerCase();

  // Dairy & Eggs
  if (
    lower.includes('بيض') ||
    lower.includes('حليب') ||
    lower.includes('جبن') ||
    lower.includes('جبنة') ||
    lower.includes('قشطة') ||
    lower.includes('زبادي') ||
    lower.includes('لبن') ||
    lower.includes('زبدة') ||
    lower.includes('كريمة')
  ) {
    return 'ألبان وأجبان';
  }

  // Meats & Poultry & Fish
  if (
    lower.includes('لحم') ||
    lower.includes('دجاج') ||
    lower.includes('سمك') ||
    lower.includes('روبيان') ||
    lower.includes('جمبري') ||
    lower.includes('كفتة') ||
    lower.includes('ستيك') ||
    lower.includes('تونة')
  ) {
    return 'لحوم ودواجن';
  }

  // Vegetables & Fruits
  if (
    lower.includes('بصل') ||
    lower.includes('ثوم') ||
    lower.includes('طماطم') ||
    lower.includes('بطاطس') ||
    lower.includes('بطاطا') ||
    lower.includes('جزر') ||
    lower.includes('كوسا') ||
    lower.includes('خيار') ||
    lower.includes('خس') ||
    lower.includes('ليمون') ||
    lower.includes('فلفل رومي') ||
    lower.includes('بقدونس') ||
    lower.includes('كزبرة') ||
    lower.includes('نعناع') ||
    lower.includes('تفاح') ||
    lower.includes('موز') ||
    lower.includes('فراولة')
  ) {
    return 'خضار وفواكه';
  }

  // Spices & Condiments
  if (
    lower.includes('ملح') ||
    lower.includes('فلفل أسود') ||
    lower.includes('كمون') ||
    lower.includes('كركم') ||
    lower.includes('قرفة') ||
    lower.includes('هيل') ||
    lower.includes('زعفران') ||
    lower.includes('بهارات') ||
    lower.includes('كاري') ||
    lower.includes('بابريكا') ||
    lower.includes('كزبرة ناشفة') ||
    lower.includes('قرنفل') ||
    lower.includes('زنجبيل') ||
    lower.includes('فانيلا') ||
    lower.includes('خل')
  ) {
    return 'توابل وبهارات';
  }

  // Canned & Pantry & Grains
  if (
    lower.includes('طحين') ||
    lower.includes('دقيق') ||
    lower.includes('سكر') ||
    lower.includes('أرز') ||
    lower.includes('رز') ||
    lower.includes('زيت') ||
    lower.includes('زيت زيتون') ||
    lower.includes('معكرونة') ||
    lower.includes('مكرونة') ||
    lower.includes('شعرية') ||
    lower.includes('صلصة') ||
    lower.includes('معجون طماطم') ||
    lower.includes('بيكنج بودر') ||
    lower.includes('خميرة') ||
    lower.includes('نشا') ||
    lower.includes('شوفان') ||
    lower.includes('مكسرات') ||
    lower.includes('لوز') ||
    lower.includes('فستق') ||
    lower.includes('سميد')
  ) {
    return 'معلبات ومؤونة';
  }

  return 'أخرى';
}

/**
 * Parses a single ingredient line or phrase into:
 * { name, amount, unit, category }
 */
export function parseSingleIngredient(phrase: string, index: number): ParsedIngredient | null {
  let text = normalizeArabicNumbers(phrase.trim());
  if (!text || text.length < 2) return null;

  // Clean common noise prefixes like: "المقادير:", "- ", "* ", "نحتاج", "حطي", "ضيفي", "نضيف", "مع", "و"
  text = text
    .replace(/^[-*•\d.)\s]+/, '')
    .replace(/^(المقادير|المكونات|نحتاج|نضيف|حطي|ضيفي|ضع|ضعي|مع|ثم)\s+/i, '')
    .replace(/^و\s+/, '')
    .trim();

  if (!text) return null;

  let amount: number | string = 1;
  let unit = 'حبة';
  let name = text;

  // 1. Check for specific dual forms first (حبتين، بيضتين، كوبين، ملعقتين)
  if (/\b(بيضتين|حبتين بيض)\b/i.test(text)) {
    amount = 2;
    unit = 'حبة';
    name = 'بيض';
    return {
      id: 'ing-' + (index + 1),
      name,
      amount,
      unit,
      category: 'ألبان وأجبان',
    };
  }

  if (/\b(حبتين طماطم|طماطمتين)\b/i.test(text)) {
    return {
      id: 'ing-' + (index + 1),
      name: 'طماطم',
      amount: 2,
      unit: 'حبة',
      category: 'خضار وفواكه',
    };
  }

  if (/\b(حبتين بصل|بصلتين)\b/i.test(text)) {
    return {
      id: 'ing-' + (index + 1),
      name: 'بصل',
      amount: 2,
      unit: 'حبة',
      category: 'خضار وفواكه',
    };
  }

  if (/\b(كوبين|كوبان|كاستين)\b/i.test(text)) {
    amount = 2;
    unit = 'كوب';
    name = text.replace(/\b(كوبين|كوبان|كاستين)\b/i, '').replace(/^(من|طحين)/i, (m) => (m === 'طحين' ? 'طحين' : '')).trim();
  } else if (/\b(ملعقتين|ملعقتان)\s*(كبيرة|طعام)?\b/i.test(text)) {
    amount = 2;
    unit = 'ملعقة كبيرة';
    name = text.replace(/\b(ملعقتين|ملعقتان)\s*(كبيرة|طعام)?\b/i, '').replace(/^من\s+/, '').trim();
  } else if (/\b(ملعقتين|ملعقتان)\s*(صغيرة|شاي)?\b/i.test(text)) {
    amount = 2;
    unit = 'ملعقة صغيرة';
    name = text.replace(/\b(ملعقتين|ملعقتان)\s*(صغيرة|شاي)?\b/i, '').replace(/^من\s+/, '').trim();
  } else if (/\b(فصين|فصان)\s*(ثوم)?\b/i.test(text)) {
    amount = 2;
    unit = 'فص';
    name = 'ثوم';
  } else if (/\b(نصف|نص)\s*كوب\b/i.test(text)) {
    amount = 0.5;
    unit = 'كوب';
    name = text.replace(/\b(نصف|نص)\s*كوب\b/i, '').replace(/^من\s+/, '').trim();
  } else if (/\b(ربع)\s*كوب\b/i.test(text)) {
    amount = 0.25;
    unit = 'كوب';
    name = text.replace(/\b(ربع)\s*كوب\b/i, '').replace(/^من\s+/, '').trim();
  } else if (/\b(كوب\s*ونصف|كوب\s*ونص)\b/i.test(text)) {
    amount = 1.5;
    unit = 'كوب';
    name = text.replace(/\b(كوب\s*ونصف|كوب\s*ونص)\b/i, '').replace(/^من\s+/, '').trim();
  } else {
    // 2. Search for numeric or word-based quantity at the beginning or middle
    // Matches: "3 بيضات", "3 حبات بيض", "2.5 كجم", "1/2 كوب"
    const numberMatch = text.match(/^(\d+(?:\.\d+)?|\d+\/\d+)\s*(.*)$/);

    if (numberMatch) {
      let rawNum = numberMatch[1];
      if (rawNum.includes('/')) {
        const [num, den] = rawNum.split('/');
        amount = Number(num) / Number(den);
      } else {
        amount = Number(rawNum) || 1;
      }

      let remainder = numberMatch[2].trim();

      // Check for unit in remainder
      let foundUnit = false;
      for (const u of UNITS) {
        if (remainder.startsWith(u) || remainder.startsWith('من ' + u)) {
          unit = u.includes('كوب') || u.includes('كاس') ? 'كوب' : u.includes('ملعقة صغيرة') ? 'ملعقة صغيرة' : u.includes('ملعقة كبيرة') ? 'ملعقة كبيرة' : u;
          name = remainder.replace(new RegExp(`^(من\\s+)?${u}\\s*(من\\s+)?`, 'i'), '').trim();
          foundUnit = true;
          break;
        }
      }

      if (!foundUnit) {
        // If next word is "بيضات" or "بيض" or "حبات"
        if (/^(بيضات|بيض|حبات|حبة)\b/i.test(remainder)) {
          unit = 'حبة';
          name = remainder.replace(/^(حبات|حبة)\s*(من\s+)?/i, '').trim();
          if (name === 'بيضات') name = 'بيض';
        } else {
          name = remainder.replace(/^من\s+/, '').trim();
          // If name starts with an ingredient that is naturally countable
          unit = 'حبة / مقدار';
        }
      }
    } else {
      // 3. Search for word numbers ("ثلاث بيضات", "أربع حبات طماطم", "كيلو لحم")
      let matchedWordNum = false;
      for (const [wNum, val] of Object.entries(WORD_NUMBER_MAP)) {
        const regex = new RegExp(`^${wNum}\\s+(.*)$`, 'i');
        const match = text.match(regex);
        if (match) {
          amount = val;
          matchedWordNum = true;
          let rest = match[1].trim();

          // Check if rest contains unit
          let foundU = false;
          for (const u of UNITS) {
            if (rest.startsWith(u)) {
              unit = u;
              name = rest.replace(new RegExp(`^${u}\\s*(من\\s+)?`, 'i'), '').trim();
              foundU = true;
              break;
            }
          }
          if (!foundU) {
            if (/^(بيضات|حبات|فصوص|علب|قطع)\b/i.test(rest)) {
              unit = 'حبة';
              name = rest.replace(/^(حبات|فصوص|علب|قطع)\s*(من\\s+)?/i, '').trim();
              if (name === 'بيضات') name = 'بيض';
            } else {
              name = rest.replace(/^من\s+/, '').trim();
            }
          }
          break;
        }
      }

      if (!matchedWordNum) {
        // Check if starts with a unit without explicit number (e.g. "ملعقة سكر", "كوب طحين", "رشة ملح")
        for (const u of UNITS) {
          if (text.startsWith(u)) {
            amount = 1;
            unit = u;
            name = text.replace(new RegExp(`^${u}\\s*(من\\s+)?`, 'i'), '').trim();
            break;
          }
        }
      }
    }
  }

  // Cleanup name
  name = name
    .replace(/^(من\s+|حبات\s+|حبة\s+)/i, '')
    .replace(/^(مطحون|مفروم|مقطع|مبشور|طازج)\s+/i, '')
    .trim();

  if (!name) name = text;

  // Standardize unit
  if (unit === 'بيضات' || unit === 'حبات') unit = 'حبة';
  if (unit === 'اكواب' || unit === 'أكواب' || unit === 'كاسات' || unit === 'كاسة') unit = 'كوب';
  if (unit === 'ملاعق كبيرة' || unit === 'ملعقة طعام') unit = 'ملعقة كبيرة';
  if (unit === 'ملاعق صغيرة' || unit === 'ملعقة شاي') unit = 'ملعقة صغيرة';

  // If user says "3 بيضات", name should be "بيض", amount: 3, unit: "حبة"
  if (name === 'بيضات' || name === 'بيضة') {
    name = 'بيض';
    unit = 'حبة';
  }

  const category = deduceIngredientCategory(name);

  return {
    id: 'ing-' + (index + 1),
    name,
    amount: amount || 1,
    unit: unit || 'حبة',
    category,
  };
}

/**
 * Intelligent full Arabic recipe & ingredient extraction from spoken or pasted text
 */
export function parseArabicRecipeLocally(inputText: string): ParsedRecipeOutput {
  const normalized = normalizeArabicNumbers(inputText);

  // 1. Separate ingredients from steps/instructions if present
  // Common dividers in Arabic: "الطريقة:", "خطوات التحضير:", "الخطوات:", "طريقة التحضير:"
  let ingredientsSection = normalized;
  let stepsSection = '';

  const stepDividers = [
    'طريقة التحضير:',
    'طريقة العمل:',
    'خطوات التحضير:',
    'الخطوات:',
    'الطريقة:',
    'طريقة التحضير',
    'خطوات التحضير',
  ];

  for (const div of stepDividers) {
    if (normalized.includes(div)) {
      const parts = normalized.split(div);
      ingredientsSection = parts[0];
      stepsSection = parts[1] || '';
      break;
    }
  }

  // 2. Extract lines or phrases from ingredientsSection
  // Could be split by newlines, commas (، or ,), bullet points, or "و"
  let rawPhrases: string[] = [];

  if (ingredientsSection.includes('\n')) {
    rawPhrases = ingredientsSection
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 1);
  } else if (ingredientsSection.includes('،') || ingredientsSection.includes(',')) {
    rawPhrases = ingredientsSection
      .split(/[،,]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 1);
  } else {
    // Split by "و" followed by a space and a quantity or common ingredient
    rawPhrases = ingredientsSection
      .split(/(?<=\s)و(?=\s*(?:\d+|نصف|ربع|كوب|ملعقة|حبة|بيض|طحين|سكر|حليب|طماطم|بصل|لحم|دجاج|زيت|ملح|بهارات|ثوم|ماء))/gi)
      .map((s) => s.trim())
      .filter((s) => s.length > 1);
  }

  const parsedIngredients: ParsedIngredient[] = [];
  rawPhrases.forEach((phrase, idx) => {
    const item = parseSingleIngredient(phrase, parsedIngredients.length);
    if (item && item.name.length > 1) {
      // Don't add header lines like "المقادير"
      if (!['المقادير', 'المكونات', 'الوصفة'].includes(item.name)) {
        parsedIngredients.push(item);
      }
    }
  });

  // 3. Extract Steps
  const parsedSteps: ParsedStep[] = [];
  if (stepsSection) {
    const rawSteps = stepsSection
      .split(/\n|(?<=\.)\s+|(?<=\d[.)])\s+/)
      .map((s) => s.replace(/^[-*•\d.)\s]+/, '').trim())
      .filter((s) => s.length > 4);

    rawSteps.forEach((instruction, idx) => {
      // Detect timer in step: e.g. "لمدة 20 دقيقة" أو "نتركه يغلي 15 دقيقة"
      let timerMinutes: number | undefined;
      const timerMatch = instruction.match(/(\d+)\s*(?:دقيقة|دقائق)/i);
      if (timerMatch) {
        timerMinutes = Number(timerMatch[1]);
      }

      parsedSteps.push({
        stepNumber: idx + 1,
        instruction,
        timerMinutes,
      });
    });
  }

  // 4. Extract Title if not provided
  let detectedTitle: string | undefined;
  const firstLine = normalized.split('\n')[0]?.trim();
  if (firstLine && firstLine.length < 50 && !firstLine.includes(':') && !firstLine.includes('المقادير')) {
    detectedTitle = firstLine.replace(/^(طريقة عمل|وصفة|طبخة)\s+/i, '');
  }

  return {
    title: detectedTitle,
    ingredients: parsedIngredients,
    steps: parsedSteps,
  };
}
