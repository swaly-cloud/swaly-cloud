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

🔴 CRITIQUE: Les coordonnées des yeux DOIVENT être EXACTES - c'est pour placer les lunettes sur le visage!

Fournis UNIQUEMENT un objet JSON valide (aucun texte avant ou après):
{
  "faceShape": "ovale|carré|rond|cœur|rectangulaire",
  "leftEye": { "x": 0.0, "y": 0.0 },
  "rightEye": { "x": 0.0, "y": 0.0 },
  "recommendation": "texte de recommandation en français",
  "score": 0,
  "tips": "conseil de style en français"
}

Système de coordonnées (0=haut/gauche, 1=bas/droite):
Si l'image fait 1000x1000px:
- x=0.35 = 350px depuis la gauche
- y=0.40 = 400px depuis le haut

Règles ABSOLUES pour les yeux (respecter au pixel près):
- La position Y doit placer les yeux DANS LE VISAGE, pas sur le front/cheveux!
- Typiquement: y doit être entre 0.35-0.48 (les yeux sont au-dessus du centre du visage)
- Pour ce visage précisément: identifier les yeux RÉELS et leur position exacte
- leftEye.x: 0.32-0.40 (tiers gauche)
- rightEye.x: 0.60-0.68 (tiers droit)
- leftEye.y: 0.36-0.48 (dans la zone des yeux visibles)
- rightEye.y: DOIT être identique à leftEye.y (même hauteur)
- Distance entre les yeux en x: doit être 0.22-0.38 (typiquement ~0.28)
- VÉRIFIER: Les yeux doivent être visiblement sur le visage, pas ailleurs!

score: 0-100 (adéquation monture/forme visage).
Réponds SEULEMENT le JSON, pas d'autres mots!`,
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

    // Generate image with gpt-image-1
    console.log('🖼️ Calling images.generate with gpt-image-1...');
    const imageResponse = await openai.images.generate({
      model: 'gpt-image-1',
      prompt: enhancedPrompt,
      n: 1,
      size: '1024x1024',
    });

    console.log('🖼️ Raw response:', imageResponse);
    console.log('🖼️ Response type:', typeof imageResponse);
    console.log('🖼️ Response keys:', Object.keys(imageResponse || {}));
    console.log('🖼️ Response as JSON:', JSON.stringify(imageResponse));

    // Extract URL from various possible locations
    let imageUrl = null;
    if (imageResponse?.data?.[0]?.url) {
      imageUrl = imageResponse.data[0].url;
    } else if (typeof imageResponse === 'string') {
      imageUrl = imageResponse;
    } else if (imageResponse?.url) {
      imageUrl = imageResponse.url;
    } else if (imageResponse?.[0]?.url) {
      imageUrl = imageResponse[0].url;
    }

    console.log('🖼️ Extracted imageUrl:', imageUrl);

    if (!imageUrl) {
      console.error('❌ Could not extract image URL from response');
      return res.status(500).json({
        error: 'Could not extract image URL',
        response_keys: Object.keys(imageResponse || {}),
        response_type: typeof imageResponse
      });
    }

    console.log('✅ Image generated successfully:', imageUrl);
    res.json({ imageUrl, enhanced_prompt: enhancedPrompt });
  } catch (openaiErr) {
    console.error('🚨 OpenAI Error:', openaiErr.message);
    console.error('🚨 Error details:', openaiErr.error || openaiErr.response?.data || openaiErr);
    res.status(500).json({ error: `OpenAI Error: ${openaiErr.message}` });
  }
});

module.exports = router;

