import { test } from 'node:test';
import assert from 'node:assert/strict';
import { requiredRecipeFields } from './recipeFormValidation';
import { stepsFromDescription } from './voiceRecipeParser';

test('empty required fields cannot be silently replaced with defaults', () => {
  assert.deepEqual(requiredRecipeFields('', '', ''), { prepTime: true, cookTime: true, servings: true });
  assert.equal(requiredRecipeFields(10, '', 4).cookTime, true);
  assert.equal(requiredRecipeFields(10, 20, '').servings, true);
});
test('explicit zero time is accepted but people must be positive integers', () => {
  assert.deepEqual(requiredRecipeFields(0, 0, 2), { prepTime: false, cookTime: false, servings: false });
  for (const servings of [0, -1, 1.5, NaN, Infinity]) assert.equal(requiredRecipeFields(10, 20, servings).servings, true);
  assert.equal(requiredRecipeFields(-1, 20, 4).prepTime, true);
});
test('description produces only spoken cooking steps and timers', () => {
  const steps = stepsFromDescription('كبسة لذيذة للعائلة، نغسل الرز ثم نشوح البصل بعدين نضيف الدجاج ثم نتركه نصف ساعة');
  assert.deepEqual(steps.map(s => s.instruction), ['نغسل الرز', 'نشوح البصل', 'نضيف الدجاج', 'نتركه نصف ساعة']);
  assert.equal(steps[3].timerMinutes, 30);
  assert.deepEqual(steps.map(s => s.stepNumber), [1, 2, 3, 4]);
});
test('ordinary description is not fabricated into preparation steps', () => {
  assert.deepEqual(stepsFromDescription('طبخة شهية بنكهة البهارات ومناسبة للعائلة'), []);
  assert.deepEqual(stepsFromDescription(''), []);
});
