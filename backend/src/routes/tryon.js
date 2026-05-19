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

// ─── EDIT REAL PHOTO WITH gpt-image-1 ─────────────────────────────
router.post('/generate', async (req, res) => {
  const { photoBase64, photoMimeType = 'image/jpeg', product, analysis } = req.body;

  if (!photoBase64) return res.status(400).json({ error: 'Photo requise' });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Clé API OpenAI manquante' });

  const openai = new OpenAI({ apiKey });

  const productDesc = product
    ? `${product.brand} ${product.name}`
    : 'une monture élégante';

  try {
    const photoBuffer = Buffer.from(photoBase64, 'base64');
    const photoFile = new File([photoBuffer], 'photo.jpg', { type: photoMimeType });

    // Get product image for reference
    const images = [photoFile];
    if (req.body.productImageUrl) {
      try {
        console.log('📥 Fetching product image:', req.body.productImageUrl);
        const productRes = await fetch(req.body.productImageUrl);
        if (productRes.ok) {
          const productBuffer = Buffer.from(await productRes.arrayBuffer());
          const productFile = new File([productBuffer], 'glasses.jpg', { type: 'image/jpeg' });
          images.push(productFile);
          console.log('✅ Product image added as reference');
        }
      } catch (e) {
        console.warn('⚠️ Could not fetch product image');
      }
    }

    const prompt = images.length > 1
      ? `IMPORTANT: Place EXACTLY the glasses from the second image on the person's face in the first image.
The person's face, identity, skin tone, hair color, facial hair, lighting, background - EVERYTHING must remain 100% identical.
ONLY change: add the exact glasses from image 2 on the eyes.
Do NOT modify anything else. Do NOT change skin. Do NOT change hair. Do NOT change face shape.
Photorealistic. Ultra-precise. Only the glasses change.`
      : `Place ${productDesc} on the eyes ONLY.
Keep: face shape, skin tone, hair, facial hair, lighting, background - everything identical.
ONLY add the glasses. Do NOT modify the face at all.
Photorealistic.`;

    console.log('🖼️ Calling gpt-image-1 images.edit with product reference...');
    const imageResponse = await openai.images.edit({
      model: 'gpt-image-1',
      image: images.length === 1 ? images[0] : images,
      prompt,
      n: 1,
      size: '1024x1024',
    });

    console.log('🖼️ Response keys:', Object.keys(imageResponse?.data?.[0] || {}));

    const b64 = imageResponse?.data?.[0]?.b64_json;
    if (b64) {
      console.log('✅ Got edited image as base64');
      return res.json({ imageUrl: `data:image/png;base64,${b64}` });
    }

    const url = imageResponse?.data?.[0]?.url;
    if (url) {
      console.log('✅ Got URL:', url);
      return res.json({ imageUrl: url });
    }

    res.status(500).json({ error: 'No image returned', data: imageResponse?.data });
  } catch (err) {
    console.error('🚨 Error:', err.message, err.error || '');
    res.status(500).json({ error: `OpenAI Error: ${err.message}` });
  }
});

module.exports = router;

