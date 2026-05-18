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

Règles STRICTES pour les coordonnées (0=gauche/haut, 1=droite/bas):
- leftEye.x: 0.33-0.38 (tiers gauche du visage)
- rightEye.x: 0.62-0.67 (tiers droit du visage)
- leftEye.y et rightEye.y: 0.38-0.45 (légèrement au-dessus du centre)
- Les deux yeux DOIVENT avoir la même y (hauteur identique)
- Distance entre yeux: 0.25-0.35 (typiquement 0.30)
- CES VALEURS SONT CRITIQUES - sois ultra-précis!

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

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY not found in environment');
    return res.status(500).json({ error: 'Clé API OpenAI manquante (OPENAI_API_KEY)' });
  }

  console.log('🔑 Using OpenAI API key (length:', apiKey.length, ')');
  const openai = new OpenAI({ apiKey });

  const productDesc = product
    ? `${product.brand} ${product.name} (${product.cat}, ${product.price} TND)`
    : 'une monture élégante';

  try {
    // Use GPT-4o to craft ultra-detailed prompt
    console.log('📝 Calling GPT-4o to enhance prompt...');
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

    if (!detailedPrompt.choices?.[0]?.message?.content) {
      console.error('❌ GPT-4o returned empty content:', detailedPrompt);
      return res.status(500).json({ error: 'GPT-4o returned empty response' });
    }

    const enhancedPrompt = detailedPrompt.choices[0].message.content;
    console.log('✅ GPT-4o prompt ready, calling DALL-E...');

    // Generate image with latest available model
    const image = await openai.images.generate({
      model: 'dall-e-3',
      prompt: enhancedPrompt,
      n: 1,
      size: '1024x1024',
      quality: 'hd',
    });

    if (!image.data?.[0]?.url) {
      console.error('❌ DALL-E returned no image URL:', image);
      return res.status(500).json({ error: 'DALL-E returned no image URL' });
    }

    const imageUrl = image.data[0].url;
    console.log('✅ DALL-E image generated successfully');
    res.json({ imageUrl, enhanced_prompt: enhancedPrompt });
  } catch (openaiErr) {
    console.error('🚨 OpenAI Error:', openaiErr.message);
    console.error('🚨 Error details:', openaiErr.error || openaiErr.response?.data || openaiErr);
    res.status(500).json({ error: `OpenAI Error: ${openaiErr.message}` });
  }
});

module.exports = router;

