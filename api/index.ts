import type { Request, Response } from 'express';
import { parseRecipeFromSpokenText, suggestRecipeFromIngredients } from '../server/geminiService.ts';
import { verifyAccount } from '../server/verifyAccount.ts';

export default async function handler(req: Request, res: Response) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const url = req.url || '';

  try {
    if (url.includes('/api/health')) return res.status(200).json({ status: 'ok', app: 'Tabkhat App API' });
    if (!(await verifyAccount(req.headers.authorization))) return res.status(401).json({ error: 'سجّل الدخول مجددًا لاستخدام تحليل الوصفات.' });
    if (url.includes('/api/parse-recipe') && req.method === 'POST') {
      const { text } = req.body || {};
      if (!text || typeof text !== 'string' || text.length > 12000) {
        return res.status(400).json({ error: 'Text prompt or speech transcript is required' });
      }
      const recipe = await parseRecipeFromSpokenText(text);
      return res.status(200).json({ success: true, recipe });
    }

    if (url.includes('/api/fridge-suggest') && req.method === 'POST') {
      const { ingredients } = req.body || {};
      if (!Array.isArray(ingredients) || ingredients.length === 0 || ingredients.length > 60 || ingredients.some(item => typeof item !== 'string' || item.length > 120)) {
        return res.status(400).json({ error: 'Ingredients array is required' });
      }
      const recipe = await suggestRecipeFromIngredients(ingredients);
      return res.status(200).json({ success: true, recipe });
    }

    return res.status(404).json({ error: 'Endpoint not found' });
  } catch (err: any) {
    console.error('API Handler Error:', err?.name || 'UnknownError');
    return res.status(500).json({ error: 'تعذر تحليل الوصفة الآن. حاول مجددًا.' });
  }
}
