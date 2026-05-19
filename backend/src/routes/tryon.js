const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const { OpenAI } = require('openai');
const sharp = require('sharp');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// Create PNG transparency mask for images.edit()
// Transparent areas (alpha=0) = editable (eyes), Opaque areas (alpha=255) = preserved (face)
async function createEyeMask(leftEye, rightEye) {
  const size = 1024;
  const eyeRadius = 120; // pixels, controls editable region size around each eye

  // Create RGBA buffer: white background with transparent eye circles
  const buffer = Buffer.alloc(size * size * 4);

  // Convert normalized coordinates (0-1) to pixel coordinates
  const leftEyeX = Math.round(leftEye.x * size);
  const leftEyeY = Math.round(leftEye.y * size);
  const rightEyeX = Math.round(rightEye.x * size);
  const rightEyeY = Math.round(rightEye.y * size);

  // Fill buffer: white opaque for face, transparent for eye regions
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      // Check if pixel is in eye circle regions
      const distToLeftEye = Math.hypot(x - leftEyeX, y - leftEyeY);
      const distToRightEye = Math.hypot(x - rightEyeX, y - rightEyeY);
      const inEyeRegion = distToLeftEye <= eyeRadius || distToRightEye <= eyeRadius;

      if (inEyeRegion) {
        // Transparent (editable) - for eye regions
        buffer[idx] = 255;
        buffer[idx + 1] = 255;
        buffer[idx + 2] = 255;
        buffer[idx + 3] = 0; // alpha = 0 (transparent)
      } else {
        // Opaque (preserve) - for face regions
        buffer[idx] = 255;
        buffer[idx + 1] = 255;
        buffer[idx + 2] = 255;
        buffer[idx + 3] = 255; // alpha = 255 (opaque)
      }
    }
  }

  // Create PNG from raw RGBA buffer
  const maskPng = await sharp(buffer, {
    raw: { width: size, height: size, channels: 4 },
  })
    .png()
    .toBuffer();

  return maskPng;
}

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

Fournis uniquement un objet JSON valide avec ces champs:
{
  "faceShape": "ovale|carré|rond|cœur|rectangulaire",
  "leftEye": { "x": 0.0, "y": 0.0 },
  "rightEye": { "x": 0.0, "y": 0.0 },
  "glassesWidthRatio": 0.0,
  "recommendation": "texte de recommandation en français",
  "score": 0,
  "tips": "conseil de style en français"
}

Règles pour les coordonnées (valeurs entre 0 et 1, proportion de la taille de l'image):
- leftEye.x et rightEye.x: position horizontale du centre de chaque œil
- leftEye.y et rightEye.y: position verticale du centre de chaque œil
- glassesWidthRatio: largeur idéale des montures = distance entre les yeux * 1.4

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
      glassesWidthRatio: 0.42,
      recommendation: raw,
      score: 75,
      tips: '',
    };
  }

  res.json({ analysis, usage: message.usage });
});

// ─── EDIT REAL PHOTO WITH gpt-image-1 + TRANSPARENCY MASK ─────────────────────────────
router.post('/generate', async (req, res) => {
  const { photoBase64, photoMimeType = 'image/jpeg', product, analysis } = req.body;

  if (!photoBase64) return res.status(400).json({ error: 'Photo requise' });
  if (!analysis?.leftEye || !analysis?.rightEye) {
    return res.status(400).json({ error: 'Analyse du visage requise (eye coordinates)' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Clé API OpenAI manquante' });

  const openai = new OpenAI({ apiKey });

  const productDesc = product
    ? `${product.brand} ${product.name}`
    : 'une monture élégante';

  try {
    // Create user photo File
    const photoBuffer = Buffer.from(photoBase64, 'base64');
    const photoFile = new File([photoBuffer], 'photo.jpg', { type: photoMimeType });

    // Create PNG transparency mask: transparent eye regions, opaque face regions
    console.log('🎨 Creating transparency mask from eye coordinates...');
    const maskBuffer = await createEyeMask(analysis.leftEye, analysis.rightEye);
    const maskFile = new File([maskBuffer], 'mask.png', { type: 'image/png' });
    console.log('✅ Mask created (transparent eye regions, opaque face)');

    const prompt = `Place ${productDesc} on the eyes ONLY.
CRITICAL: Use the provided transparency mask to constrain edits to the eye regions only.
- Transparent areas (eyes) = editable
- Opaque areas (face, hair, body) = MUST remain 100% unchanged

Preserve EVERYTHING except the eye regions:
- Face shape, skin tone, facial features, hair, facial hair, lighting, background - ALL must stay identical
- ONLY place glasses on the transparent eye areas
- Do NOT modify opaque regions under any circumstances
Photorealistic. Ultra-precise.`;

    console.log('🖼️ Calling gpt-image-1 images.edit with transparency mask...');
    const imageResponse = await openai.images.edit({
      model: 'gpt-image-1',
      image: photoFile,
      mask: maskFile,
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
