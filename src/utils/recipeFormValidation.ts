export type NumericField = number | '';

export function requiredRecipeFields(prepTime: NumericField, cookTime: NumericField, servings: NumericField) {
  return {
    prepTime: prepTime === '' || !Number.isFinite(prepTime) || prepTime < 0,
    cookTime: cookTime === '' || !Number.isFinite(cookTime) || cookTime < 0,
    servings: servings === '' || !Number.isInteger(servings) || servings < 1,
  };
}
