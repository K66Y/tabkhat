import type { ParsedIngredient, ParsedRecipeOutput } from './arabicRecipeParser';
import { deduceIngredientCategory } from './arabicRecipeParser.ts';
import { isIngredientName, parseVoiceRecipe } from './voiceRecipeParser.ts';

/** Provider output is untrusted: never let it override ambiguous source quantities. */
export function validateVoiceRecipe(raw: unknown, source: string): ParsedRecipeOutput {
  const fallback = parseVoiceRecipe(source);
  if (!raw || typeof raw !== 'object') return fallback;
  const data = raw as Record<string, unknown>;
  if (!Array.isArray(data.ingredients) || !Array.isArray(data.steps)) return fallback;
  const ingredients: ParsedIngredient[] = [];
  const warnings: string[] = [];
  for (const [index, item] of data.ingredients.entries()) {
    if (!item || typeof item.name !== 'string' || !isIngredientName(item.name)) {
      warnings.push('لم أعتمد عبارة غير واضحة كمكوّن. راجع النص الملتقط.');
      continue;
    }
    const name = item.name.trim();
    const local = fallback.ingredients.find(i => i.name === name);
    const uncertain = local?.reviewReason;
    const amount = !uncertain && typeof item.amount === 'number' && Number.isFinite(item.amount) && item.amount > 0 ? item.amount : '';
    ingredients.push({
      id: `ing-${index + 1}`, name, amount,
      unit: typeof item.unit === 'string' && item.unit.trim() ? item.unit.trim() : 'حبة',
      category: deduceIngredientCategory(name),
      ...(amount === '' ? { reviewReason: uncertain || 'لم تتضح الكمية؛ حددها قبل الحفظ.' } : {}),
    });
  }
  if (!ingredients.length) return fallback;
  const result: ParsedRecipeOutput = {
    ...fallback,
    analysisMode: 'ai',
    ingredients,
    steps: data.steps.filter(s => s && typeof s.instruction === 'string' && s.instruction.trim()).map((s, index) => ({
      stepNumber: index + 1,
      instruction: s.instruction.trim(),
      ...(typeof s.timerMinutes === 'number' && Number.isFinite(s.timerMinutes) && s.timerMinutes > 0 ? { timerMinutes: s.timerMinutes } : {}),
    })),
    warnings: [...warnings, ...ingredients.filter(i => i.reviewReason).map(i => `${i.name}: ${i.reviewReason}`)],
  };
  if (typeof data.title === 'string' && data.title.trim().length <= 80) result.title = data.title.trim() || fallback.title;
  for (const key of ['prepTime', 'cookTime', 'baseServings'] as const) {
    const n = data[key];
    if (typeof n === 'number' && Number.isFinite(n) && n > 0) result[key] = n;
  }
  return result;
}
