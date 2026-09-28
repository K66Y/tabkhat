import { deduceIngredientCategory, normalizeArabicNumbers, type ParsedRecipeOutput, type ParsedIngredient } from './arabicRecipeParser.ts';

const numbers: Record<string, number> = { واحد: 1, واحدة: 1, اثنين: 2, اثنان: 2, ثنتين: 2, ثلاث: 3, ثلاثة: 3, اربع: 4, اربعة: 4, خمس: 5, خمسة: 5, ست: 6, ستة: 6, سبع: 7, سبعة: 7, ثمان: 8, ثمانية: 8, تسع: 9, تسعة: 9, عشر: 10, عشرة: 10, عشرين: 20, ثلاثين: 30, اربعين: 40, خمسين: 50, نصف: 0.5, نص: 0.5, ربع: 0.25, ثلث: 1 / 3 };
const normalize = (s: string) => normalizeArabicNumbers(s).replace(/[أإآ]/g, 'ا').replace(/[\u064B-\u065Fـ]/g, '').replace(/٫/g, '.').replace(/\b½\b/g, 'نصف');
const quantity = `(?:\\d+\\/\\d+|\\d+(?:\\.\\d+)?|${Object.keys(numbers).sort((a,b) => b.length-a.length).join('|')})`;
const units: [string, string, number][] = [
  ['ملعقتين صغيرتين|ملعقتان صغيرتان', 'ملعقة صغيرة', 2],
  ['ملعقتين كبيرتين|ملعقتان كبيرتان', 'ملعقة كبيرة', 2],
  ['ملاعق صغيرة|ملعقة صغيرة|ملعقة شاي', 'ملعقة صغيرة', 1],
  ['ملاعق كبيرة|ملعقة كبيرة|ملعقة طعام', 'ملعقة كبيرة', 1],
  ['كوبين|كوبان|كاستين', 'كوب', 2], ['ملعقتين|ملعقتان', 'ملعقة كبيرة', 2],
  ['كيلوين', 'كيلو', 2], ['فصين|فصان', 'فص', 2], ['حبتين|حبتان', 'حبة', 2],
  ['اكواب|كاسات|كاسة|كوب', 'كوب', 1], ['ملعقة|ملاعق', 'ملعقة', 1],
  ['كيلوجرام|كيلوغرام|كيلو|كجم|كغ', 'كيلو', 1], ['جرام|غرام|غم', 'جرام', 1],
  ['حبات|حبة', 'حبة', 1], ['فصوص|فص', 'فص', 1], ['علب|علبة', 'علبة', 1],
  ['لتر', 'لتر', 1], ['مليلتر|مل', 'مل', 1], ['رشة', 'رشة', 1], ['قطع|قطعة', 'قطعة', 1],
];
const unitPattern = units.map(([pattern]) => pattern).join('|');
const foods = 'بيضتين|بصلتين|دجاجتين|بيضات|بيضة|بيض|بصلة|بصل|دجاجة|دجاج|طماطم|بطاطس|ثوم|رز|ارز|طحين|دقيق|سكر|حليب|ملح|فلفل|زيت|ماء|بهارات|لحم|زبدة|زبادي|كمون|كركم|قرفة|هيل|خميرة|فانيلا|نشا';
const value = (s: string): number => s.includes('/') ? Number(s.split('/')[0]) / Number(s.split('/')[1]) : numbers[s] ?? Number(s);
const addition = 'حطيت|حطينا|اضفت|اضفنا|ضفت|وضعت|نحتاج|نضيف|اضيف|حطي|ضيفي|عندي|عندنا';
const titlePrefix = 'اسم\\s+(?:الوصفة|الطبخة)|اسمها|طبخت|طبخنا|سويت|سوينا|بسوي|بنسوي|وصفة|طبخة';
const titleStop = `(?=[،,\\n]|\\s+(?:و?(?:${addition})|المقادير|المكونات)|$)`;
const categoryFor = (name: string) => /^(ماء|مويه|موية|ميه)$/.test(name) ? 'معلبات ومؤونة' as const : deduceIngredientCategory(name.replace(/اسود/g, 'أسود'));

// Reject sentences as ingredient names; even the AI response must pass this guard.
export function isIngredientName(name: string): boolean {
  const text = normalize(name).trim();
  return !!text && text.length < 90 && text.split(/\s+/).length <= 7
    && !new RegExp(`(?:^|\\s)(?:${addition}|${titlePrefix}|ثم|بعدين|على|لمدة|تكفي|الطريقة)(?:\\s|$)`).test(text)
    && !/[\d،,:;\\/]/.test(text);
}

export function parseVoiceIngredient(input: string, index: number): ParsedIngredient | null {
  let text = normalize(input).replace(/^\s*[-•*]\s*/, '').trim();
  text = text.replace(new RegExp(`^(?:و\\s*)?(?:${addition}|مع|المقادير|المكونات)\\s*[:：]?\\s*`), '').trim();
  if (!text || /^(?:اسم|وقت|مدة|الطبخ|التحضير|تكفي|عدد|المطبخ|التصنيف|الوصف)/.test(text)) return null;
  let amount: number | string = '';
  let unit = 'حبة';
  let reviewReason: string | undefined;
  let explicit = false;
  const damaged = text.match(/^(\d+\s*\\\s*\d+)(?:\s+|$)/);
  if (damaged) {
    reviewReason = `الكمية في التسجيل «${damaged[1]}» غير واضحة؛ أدخل الكمية الصحيحة.`;
    text = text.slice(damaged[0].length).trim();
  }
  const count = text.match(new RegExp(`^(${quantity})(?:\\s+|(?=[^0-9]))`));
  if (count) { amount = value(count[1]); explicit = true; text = text.slice(count[0].length).trim(); }
  for (const [pattern, canonical, implicit] of units) {
    const match = text.match(new RegExp(`^(?:${pattern})(?=\\s|$)`));
    if (match) { unit = canonical; if (!explicit) amount = implicit; explicit = true; text = text.slice(match[0].length).trim(); break; }
  }
  const fraction = text.match(/^(?:و\s*)(نصف|نص|ربع|ثلث)(?:\s+|$)/);
  if (fraction) { amount = Number(amount) + value(fraction[1]); text = text.slice(fraction[0].length); }
  text = text.replace(/^من\s+/, '').trim();
  const dual = text.match(/^(بيضتين|بصلتين|دجاجتين)(?=\s|$)/);
  if (dual) { if (!explicit) amount = 2; text = text.replace(dual[1], { بيضتين: 'بيض', بصلتين: 'بصل', دجاجتين: 'دجاج' }[dual[1]]!); }
  text = text.replace(/^(بيضات|بيضة)(?=\s|$)/, 'بيض').replace(/^بصلة(?=\s|$)/, 'بصل').replace(/^دجاجة(?=\s|$)/, 'دجاج');
  const trailingFraction = text.match(/\s+و?(نصف|نص|ربع|ثلث)$/);
  if (trailingFraction && explicit) { amount = Number(amount) + value(trailingFraction[1]); text = text.slice(0, trailingFraction.index).trim(); }
  // Countable nouns carry a quantity in the singular/dual; bulk foods do not.
  if (!explicit && !dual && /^(?:بيضة|بصلة|دجاجة)(?:\s|$)/.test(normalize(input).trim())) amount = 1;
  if (!isIngredientName(text)) return null;
  text = text.replace(/^(?:موية|مويه|ميه)$/, 'ماء');
  if (!explicit && !dual && categoryFor(text) === 'أخرى') return null;
  if (damaged) amount = '';
  if (amount !== '' && (!Number.isFinite(Number(amount)) || Number(amount) <= 0)) return null;
  if (amount === '' && !reviewReason) reviewReason = 'لم تُذكر كمية واضحة؛ أدخل الكمية قبل الحفظ.';
  return { id: `ing-${index+1}`, name: text, amount, unit, category: categoryFor(text), ...(reviewReason ? { reviewReason } : {}) };
}

export function parseVoiceRecipe(input: string): ParsedRecipeOutput {
  const text = normalize(input);
  const result: ParsedRecipeOutput = { ingredients: [], steps: [], warnings: [], analysisMode: 'local' };
  const title = text.match(new RegExp(`(?:^|\\s)(?:${titlePrefix})\\s*[:：]?\\s*(.+?)${titleStop}`));
  if (title) result.title = title[1].trim();
  let ingredientText = title ? text.replace(title[0], '') : text;
  const stepStart = ingredientText.search(/(?:طريقة التحضير|طريقة العمل|الطريقة|الخطوات|خطوات التحضير)\s*[:：]?|(?:بعدين|ثم)\s+(?:ن|ا|ح|ض)/);
  if (stepStart >= 0) {
    const stepText = ingredientText.slice(stepStart).replace(/^(?:طريقة التحضير|طريقة العمل|الطريقة|الخطوات|خطوات التحضير)\s*[:：]?\s*/, '');
    ingredientText = ingredientText.slice(0, stepStart);
    result.steps = stepText.split(/\s*(?:ثم|بعدين|بعد ذلك|[،,\n؛])\s*/).filter(s => s.trim().length > 2).map((s, i) => {
      const time = s.match(new RegExp(`(${quantity})\\s*(دقيقة|دقائق|ساعة)`));
      return { stepNumber: i+1, instruction: s.trim(), ...(time ? { timerMinutes: value(time[1]) * (time[2] === 'ساعة' ? 60 : 1) } : {}) };
    });
  }
  const metadata = /(?:و?\s*)(?:وقت|مدة)\s*(?:الطبخ|التحضير)\s*[:：]?\s*[^،,\n]+|(?:و?\s*)تكفي\s*[^،,\n]+/g;
  ingredientText = ingredientText.replace(metadata, '').replace(/(?:المقادير|المكونات)\s*[:：]?/g, '');
  // Spoken additions and ratios are boundaries, even without punctuation.
  ingredientText = ingredientText.replace(new RegExp(`(?:^|\\s)و?(?:${addition})\\s+`, 'g'), '،');
  ingredientText = ingredientText.replace(new RegExp(`\\s+(?:على|مع)\\s+(?=${quantity}\\s+(?:${unitPattern})(?:\\s|$))`, 'g'), '،');
  const separator = new RegExp(`\\s+و\\s*(?=(?:${quantity}|${unitPattern}|${foods})(?:\\s|$))`, 'g');
  ingredientText = ingredientText.replace(separator, '،');
  // Speech recognition often omits punctuation between consecutive quantities.
  ingredientText = ingredientText.replace(new RegExp(`(?<![\\d\\\\/])\\s+(?=${quantity}\\s+(?:${unitPattern}|${foods})(?:\\s|$))`, 'g'), '،');
  result.ingredients = ingredientText.split(/[،,\n؛]+/).map((s,i) => parseVoiceIngredient(s,i)).filter((s): s is ParsedIngredient => !!s);
  result.warnings = result.ingredients.filter(i => i.reviewReason).map(i => `${i.name}: ${i.reviewReason}`);
  for (const phrase of ingredientText.split(/[،,\n؛]+/).filter(s => s.trim())) {
    if (!parseVoiceIngredient(phrase, 0)) result.warnings.push(`لم أستطع توزيع العبارة «${phrase.trim()}». راجعها في النص.`);
  }
  for (const [label, key] of [['التحضير', 'prepTime'], ['الطبخ', 'cookTime']] as const) {
    const match = text.match(new RegExp(`(?:وقت|مدة)\\s*${label}\\s*[:：]?\\s*(${quantity})\\s*(دقيقة|دقائق|ساعة)`));
    if (match) result[key] = value(match[1]) * (match[2] === 'ساعة' ? 60 : 1);
  }
  const servings = text.match(new RegExp(`(?:تكفي|عدد الاشخاص)\\s*(${quantity})`));
  if (servings) result.baseServings = value(servings[1]);
  if (result.title) result.category = /كبسة|مندي|مضغوط|سليق/.test(result.title) ? 'أطباق خليجية وسعودية' : /كيك|حلا|بسكويت/.test(result.title) ? 'حلا وحلويات' : /شوربة/.test(result.title) ? 'شوربات' : /سلطة/.test(result.title) ? 'مقبلات وسلطات' : 'أطباق رئيسية';
  return result;
}
