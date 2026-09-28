import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseVoiceIngredient, parseVoiceRecipe } from './voiceRecipeParser';

for (const [text, name, amount, unit] of [
  ['٣ بيضات', 'بيض', 3, 'حبة'], ['كوبين طحين', 'طحين', 2, 'كوب'],
  ['نصف كوب سكر', 'سكر', 0.5, 'كوب'], ['1/2 كيلو لحم', 'لحم', 0.5, 'كيلو'],
  ['كوب ونصف حليب', 'حليب', 1.5, 'كوب'], ['ملعقتين صغيرتين ملح', 'ملح', 2, 'ملعقة صغيرة'],
  ['بيضتين', 'بيض', 2, 'حبة'], ['500 جرام دجاج', 'دجاج', 500, 'جرام'],
] as const) test(text, () => {
  const parsed = parseVoiceIngredient(text, 0);
  assert.ok(parsed);
  assert.deepEqual([parsed.name, parsed.amount, parsed.unit], [name, amount, unit]);
});
test('spoken recipe without punctuation separates quantities, title, steps and timers', () => {
  const recipe = parseVoiceRecipe('اسم الوصفة كبسة دجاج المقادير كوبين رز ونصف كيلو دجاج وملعقة صغيرة ملح الطريقة نغسل الرز ثم نطبخ لمدة 30 دقيقة');
  assert.equal(recipe.title, 'كبسة دجاج');
  assert.deepEqual(recipe.ingredients.map(i => [i.name, i.amount, i.unit]), [['رز', 2, 'كوب'], ['دجاج', 0.5, 'كيلو'], ['ملح', 1, 'ملعقة صغيرة']]);
  assert.equal(recipe.steps.length, 2);
  assert.equal(recipe.steps[1].timerMinutes, 30);
});
test('quantities without conjunction and explicit metadata', () => {
  const r = parseVoiceRecipe('3 بيضات 2 كوب حليب، وقت الطبخ 20 دقيقة، تكفي 4 اشخاص');
  assert.equal(r.ingredients.length, 2);
  assert.equal(r.cookTime, 20);
  assert.equal(r.baseServings, 4);
});
test('unrelated speech does not produce fake ingredients', () => {
  assert.equal(parseVoiceRecipe('السلام عليكم كيف الحال').ingredients.length, 0);
});
