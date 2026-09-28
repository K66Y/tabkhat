import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseVoiceIngredient, parseVoiceRecipe } from './voiceRecipeParser';
import { validateVoiceRecipe } from './validateVoiceRecipe';

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

test('exact user screenshot: conversational title, ratio, repeated additions and corrupted fractions', () => {
  const r = parseVoiceRecipe('طبخت كبسة دجاج حطيت ثلاث كاسات موية على أربع كاسات رز حطيت 4\\1 ملعقة ملح حطيت 4\\1 ملعقة بهارات وحطيت حبة فلفل رومي');
  assert.equal(r.title, 'كبسة دجاج');
  assert.deepEqual(r.ingredients.map(i => [i.name, i.amount, i.unit]), [
    ['ماء', 3, 'كوب'], ['رز', 4, 'كوب'], ['ملح', '', 'ملعقة'], ['بهارات', '', 'ملعقة'], ['فلفل رومي', 1, 'حبة'],
  ]);
  assert.equal(r.ingredients.filter(i => i.reviewReason).length, 2);
  assert.equal(r.category, 'أطباق خليجية وسعودية');
});
test('same natural speech with clear quarter quantities', () => {
  const r = parseVoiceRecipe('سويت كبسة دجاج حطيت ثلاث كاسات موية على اربع كاسات رز حطيت ربع ملعقة ملح وضفت ربع ملعقة بهارات وحطيت حبة فلفل رومي');
  assert.equal(r.title, 'كبسة دجاج');
  assert.deepEqual(r.ingredients.map(i => i.amount), [3, 4, 0.25, 0.25, 1]);
  assert.equal(r.warnings?.length, 0);
});
test('mixed speech and punctuation never treats title or sentence as ingredient', () => {
  const r = parseVoiceRecipe('طبخة كبسة الدجاج، حطيت كوبين رز، وحطيت نصف كيلو دجاج، وضفت حبة فلفل رومي');
  assert.equal(r.title, 'كبسة الدجاج');
  assert.deepEqual(r.ingredients.map(i => i.name), ['رز', 'دجاج', 'فلفل رومي']);
  assert.equal(parseVoiceIngredient('طبخت كبسة دجاج حطيت', 0), null);
});
test('unspoken quantities require review instead of defaulting to one', () => {
  assert.equal(parseVoiceIngredient('رز', 0)?.amount, '');
  assert.ok(parseVoiceIngredient('رز', 0)?.reviewReason);
});
test('food words in unrelated sentences are rejected', () => {
  assert.equal(parseVoiceIngredient('اليوم طبخت كبسة الدجاج', 0), null);
});
test('AI cannot turn a corrupted fraction into a confident quantity', () => {
  const result = validateVoiceRecipe({ ingredients: [{ name: 'ملح', amount: 4, unit: 'ملعقة' }], steps: [] }, 'حطيت 4\\1 ملعقة ملح');
  assert.equal(result.ingredients[0].amount, '');
  assert.ok(result.ingredients[0].reviewReason);
});
test('AI sentences masquerading as ingredient names are rejected', () => {
  const result = validateVoiceRecipe({ ingredients: [{ name: 'طبخت كبسة الدجاج', amount: 1, unit: 'حبة' }], steps: [] }, 'طبخت كبسة الدجاج حطيت كوبين رز');
  assert.deepEqual(result.ingredients.map(i => i.name), ['رز']);
});
test('AI missing quantity remains blank instead of being coerced into one', () => {
  const result = validateVoiceRecipe({ ingredients: [{ name: 'ملح', amount: null, unit: 'ملعقة' }], steps: [] }, 'حطيت ملح');
  assert.equal(result.ingredients[0].amount, '');
});
