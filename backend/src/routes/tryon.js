const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const { OpenAI } = require('openai');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.post('/analyze', async (req, res) => {
  const { photoBase64, photoMimeType = 'image/jpeg', product } = req.body;

  if (!photoBase64) return res.status(400).json({ error: 'Photo requise' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'Clé API Anthropic manquante (ANTHROPIC_API_KEY)' });

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const productDesc = product
    ? `la monture "${product.brand} ${product.name}" (${product.cat})`
    : "une monture";

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: photoMimeType, data: photoBase64 },
        },
        {
          type: 'text',
          text: `Tu es un opticien expert. Analyse ce visage pour essayer ${productDesc}.

IMPORTANT: Les coordonnées des yeux doivent être TRÈS PRÉCISES pour le rendu visuel.

Fournis uniquement un objet JSON valide avec ces champs:
{
  "faceShape": "ovale|carré|rond|cœur|rectangulaire",
  "leftEye": { "x": 0.0, "y": 0.0 },
  "rightEye": { "x": 0.0, "y": 0.0 },
  "recommendation": "texte de recommandation en français",
  "score": 0,
  "tips": "conseil de style en français"
}

Règles STRICTES pour les coordonnées (valeurs entre 0 et 1):
- leftEye.x et rightEye.x: position horizontale (0=gauche, 1=droite) — utilise 0.3-0.4 pour l'œil gauche, 0.6-0.7 pour le droit
- leftEye.y et rightEye.y: position verticale (0=haut, 1=bas) — environ 0.35-0.45 typiquement
- Les deux yeux doivent être à la même hauteur approximativement
- La distance entre les yeux doit être réaliste (0.3 environ)

score: de 0 à 100 (adéquation de cette monture avec la forme du visage).
Réponds uniquement avec le JSON, sans texte autour.`,
        },
      ],
    }],
  });

  const raw = message.content[0].text.trim();
  let analysis;
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    analysis = JSON.parse(match ? match[0] : raw);
  } catch {
    analysis = {
      faceShape: 'indéterminé',
      leftEye: { x: 0.35, y: 0.42 },
      rightEye: { x: 0.65, y: 0.42 },
      recommendation: raw,
      score: 75,
      tips: '',
    };
  }

  res.json({ analysis, usage: message.usage });
});

// ─── GENERATE IMAGE WITH GPT-4o ──────────────────────────────────
router.post('/generate', async (req, res) => {
  const { analysis, product } = req.body;

  if (!analysis) return res.status(400).json({ error: 'Analyse requise' });
  if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: 'Clé API OpenAI manquante (OPENAI_API_KEY)' });

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const productDesc = product
    ? `${product.brand} ${product.name} (${product.cat}, ${product.price} TND)`
    : 'une monture élégante';

  // Use GPT-4o to craft ultra-detailed prompt
  const detailedPrompt = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `Tu es un expert en photographie de produits optiques. Crée un prompt DALL-E ultra-détaillé pour générer une photo réaliste d'une personne portant ${productDesc}.

Données:
- Forme du visage: ${analysis.faceShape}
- Compatibilité: ${analysis.score}/100
- Conseil: ${analysis.recommendation}

Le prompt doit être:
- Très détaillé et visuel
- Studio professionnel, bonne lumière
- Monture bien visible et ajustée
- Fond légèrement flou (bokeh)
- Style moderne et naturel
- Haute résolution, couleurs vibrantes

Réponds UNIQUEMENT avec le prompt, rien d'autre.`
    }]
  });

  const enhancedPrompt = detailedPrompt.choices[0].message.content;

  // Generate image with latest available model
  const image = await openai.images.generate({
    model: 'dall-e-3', // Latest generation model (GPT-4o integration)
    prompt: enhancedPrompt,
    n: 1,
    size: '1024x1024',
    quality: 'hd',
  });

  const imageUrl = image.data[0].url;
  res.json({ imageUrl, enhanced_prompt: enhancedPrompt });
});

module.exports = router;

