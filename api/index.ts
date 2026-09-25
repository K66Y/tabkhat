import type { Request, Response } from 'express';
import { parseRecipeFromSpokenText, suggestRecipeFromIngredients } from '../server/geminiService.ts';

export default async function handler(req: Request, res: Response) {
  // CORS & JSON headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = req.url || '';

  try {
    if (url.includes('/api/parse-recipe') && req.method === 'POST') {
      const { text } = req.body || {};
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Text prompt or speech transcript is required' });
      }
      const recipe = await parseRecipeFromSpokenText(text);
      return res.status(200).json({ success: true, recipe });
    }

    if (url.includes('/api/fridge-suggest') && req.method === 'POST') {
      const { ingredients } = req.body || {};
      if (!Array.isArray(ingredients) || ingredients.length === 0) {
        return res.status(400).json({ error: 'Ingredients array is required' });
      }
      const recipe = await suggestRecipeFromIngredients(ingredients);
      return res.status(200).json({ success: true, recipe });
    }

    if (url.includes('/api/health')) {
      return res.status(200).json({ status: 'ok', app: 'Tabkhat App API' });
    }

    return res.status(404).json({ error: 'Endpoint not found' });
  } catch (err: any) {
    console.error('API Handler Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
