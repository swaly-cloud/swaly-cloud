const express = require('express');
const zlib = require('zlib');
const { promisify } = require('util');
const Anthropic = require('@anthropic-ai/sdk');
const { OpenAI } = require('openai');
const { authMiddleware } = require('../middleware/auth');

const deflate = promisify(zlib.deflate);

const router = express.Router();

router.use(authMiddleware);

// Pure Node.js CRC32 for PNG chunks
function crc32(buf) {
  if (!crc32.table) {
    crc32.table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crc32.table[i] = c;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = crc32.table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type);
  const len = Buffer.allocUnsafe(4);
  len.writeUInt32BE(data.length);
  const crcVal = Buffer.allocUnsafe(4);
  crcVal.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])));
  return Buffer.concat([len, typeBytes, data, crcVal]);
}

// Create PNG transparency mask using pure Node.js (no native deps)
// Transparent areas (alpha=0) = editable (eyes), Opaque (alpha=255) = preserved (face)
async function createEyeMask(leftEye, rightEye) {
  const size = 1024;
  const eyeRadius = 120;

  const leftEyeX = Math.round(leftEye.x * size);
  const leftEyeY = Math.round(leftEye.y * size);
  const rightEyeX = Math.round(rightEye.x * size);
  const rightEyeY = Math.round(rightEye.y * size);

  // Build scanlines: 1 filter byte (0=None) + 4 bytes RGBA per pixel
  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.allocUnsafe(1 + size * 4);
    row[0] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      const i = 1 + x * 4;
      const inEye = Math.hypot(x - leftEyeX, y - leftEyeY) <= eyeRadius ||
                    Math.hypot(x - rightEyeX, y - rightEyeY) <= eyeRadius;
      row[i] = 255; row[i + 1] = 255; row[i + 2] = 255;
      row[i + 3] = inEye ? 0 : 255; // 0=transparent(editable), 255=opaque(preserved)
    }
    rows.push(row);
  }

  const compressed = await deflate(Buffer.concat(rows));

  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
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

// ─── RECOMMEND BEST FRAMES ─────────────────────────────────────────
router.post('/recommend', async (req, res) => {
  const { faceShape, products } = req.body;

  if (!faceShape || !products?.length) {
    return res.status(400).json({ error: 'Forme du visage et catalogue requis' });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'Clé API Anthropic manquante' });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const productList = products.map((p, i) => `${i + 1}. ${p.brand} ${p.name}`).join('\n');

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `Tu es un expert en optique et morphologie. Une personne avec un visage ${faceShape} cherche les meilleures montures.

Voici le catalogue disponible:
${productList}

Recommande les 3 meilleures montures NUMÉROTÉES de ce catalogue qui s'adapteraient le mieux à cette morphologie, et explique pourquoi en 2-3 mots par monture.

Réponds UNIQUEMENT au format JSON (aucun texte avant/après):
{
  "recommendations": [
    { "number": 1, "reason": "explication courte" },
    { "number": 2, "reason": "explication courte" },
    { "number": 3, "reason": "explication courte" }
  ]
}`,
    }],
  });

  const raw = message.content[0].text.trim();
  let recommendations;
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    recommendations = JSON.parse(match ? match[0] : raw);
  } catch {
    recommendations = { recommendations: [] };
  }

  // Convert recommendation numbers to actual product indices
  const topProducts = recommendations.recommendations
    .slice(0, 3)
    .map(rec => ({
      product: products[rec.number - 1],
      reason: rec.reason,
    }))
    .filter(r => r.product);

  res.json({ recommendations: topProducts });
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
    const photoBuffer = Buffer.from(photoBase64, 'base64');

    // Create PNG transparency mask
    console.log('🎨 Creating transparency mask from eye coordinates...');
    const maskBuffer = await createEyeMask(analysis.leftEye, analysis.rightEye);
    console.log('✅ Mask created');

    const prompt = `Place ${productDesc} on the eyes ONLY. Preserve face, hair, skin - only modify the eye areas. Photorealistic.`;

    console.log('🖼️ Calling gpt-image-1 images.edit...');
    const imageResponse = await openai.images.edit({
      image: new File([photoBuffer], 'photo.jpg', { type: photoMimeType }),
      mask: new File([maskBuffer], 'mask.png', { type: 'image/png' }),
      model: 'gpt-image-1',
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
