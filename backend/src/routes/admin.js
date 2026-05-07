const express = require('express');
const https = require('https');
const http = require('http');
const { authMiddleware } = require('../middleware/auth');
const { readDB, writeDB } = require('../db/setup');

const router = express.Router();

// All admin routes require auth
router.use(authMiddleware);

// ─── DASHBOARD ─────────────────────────────────────────────────────
router.get('/dashboard', (req, res) => {
  const db = readDB();
  res.json({
    products:     db.products.length,
    orders:       db.orders.length,
    appointments: db.appointments.length,
    revenue:      db.orders.filter(o => o.status !== 'annulé').reduce((s, o) => s + (o.total || 0), 0),
    pendingOrders: db.orders.filter(o => o.status === 'confirmé').length,
  });
});

// ─── PRODUCTS CRUD ─────────────────────────────────────────────────
router.get('/products', (req, res) => {
  res.json(readDB().products);
});

router.post('/products', (req, res) => {
  const { brand, name, cat, genre, price, img, accent, is_new } = req.body;
  if (!brand || !name || !cat || !genre || !price) {
    return res.status(400).json({ error: 'Champs obligatoires manquants' });
  }
  const db = readDB();
  const maxId = db.products.reduce((m, p) => Math.max(m, p.id), 0);
  const product = { id: maxId + 1, brand, name, cat, genre, price: Number(price), img: img || '', accent: accent || '#D4AF37', is_new: !!is_new };
  db.products.push(product);
  writeDB(db);
  res.status(201).json(product);
});

router.put('/products/:id', (req, res) => {
  const db = readDB();
  const idx = db.products.findIndex(p => p.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Produit introuvable' });
  db.products[idx] = { ...db.products[idx], ...req.body, id: db.products[idx].id };
  writeDB(db);
  res.json(db.products[idx]);
});

router.delete('/products/:id', (req, res) => {
  const db = readDB();
  const idx = db.products.findIndex(p => p.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Produit introuvable' });
  db.products.splice(idx, 1);
  writeDB(db);
  res.json({ success: true });
});

// ─── ORDERS MANAGEMENT ─────────────────────────────────────────────
router.get('/orders', (req, res) => {
  res.json(readDB().orders);
});

router.patch('/orders/:ref/status', (req, res) => {
  const { status } = req.body;
  const valid = ['confirmé', 'en préparation', 'livré', 'annulé'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Statut invalide' });
  const db = readDB();
  const order = db.orders.find(o => o.ref === req.params.ref);
  if (!order) return res.status(404).json({ error: 'Commande introuvable' });
  order.status = status;
  writeDB(db);
  res.json(order);
});

// ─── APPOINTMENTS MANAGEMENT ───────────────────────────────────────
router.get('/appointments', (req, res) => {
  res.json(readDB().appointments);
});

router.patch('/appointments/:ref/status', (req, res) => {
  const { status } = req.body;
  const valid = ['confirmé', 'annulé', 'terminé'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Statut invalide' });
  const db = readDB();
  const appt = db.appointments.find(a => a.ref === req.params.ref);
  if (!appt) return res.status(404).json({ error: 'Rendez-vous introuvable' });
  appt.status = status;
  writeDB(db);
  res.json(appt);
});

// ─── WOOCOMMERCE SYNC ──────────────────────────────────────────────
function wcFetch(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error('Réponse WooCommerce invalide')); }
      });
    }).on('error', reject);
  });
}

router.post('/sync/woocommerce', async (req, res) => {
  const WC_URL = process.env.WC_URL;
  const WC_KEY = process.env.WC_CONSUMER_KEY;
  const WC_SECRET = process.env.WC_CONSUMER_SECRET;

  if (!WC_URL || !WC_KEY || !WC_SECRET) {
    return res.status(400).json({ error: 'Variables WooCommerce manquantes (WC_URL, WC_CONSUMER_KEY, WC_CONSUMER_SECRET)' });
  }

  try {
    const apiUrl = `${WC_URL}/wp-json/wc/v3/products?per_page=100&consumer_key=${WC_KEY}&consumer_secret=${WC_SECRET}`;
    const wcProducts = await wcFetch(apiUrl);

    if (!Array.isArray(wcProducts)) {
      return res.status(502).json({ error: 'Réponse WooCommerce invalide', detail: wcProducts });
    }

    const db = readDB();
    let added = 0, updated = 0;

    for (const wp of wcProducts) {
      const img = wp.images?.[0]?.src || '';
      const price = Math.round(parseFloat(wp.price || wp.regular_price || '0'));
      const cat = wp.categories?.[0]?.name?.toLowerCase().includes('soleil') ? 'soleil'
                : wp.categories?.[0]?.name?.toLowerCase().includes('vue')    ? 'vue'
                : wp.categories?.[0]?.name?.toLowerCase().includes('lentill') ? 'lentilles'
                : 'soleil';

      const existing = db.products.find(p => p.wc_id === wp.id);
      if (existing) {
        Object.assign(existing, { name: wp.name, price, img, is_new: wp.featured, wc_id: wp.id });
        updated++;
      } else {
        const maxId = db.products.reduce((m, p) => Math.max(m, p.id), 0);
        db.products.push({
          id: maxId + 1,
          wc_id: wp.id,
          brand: wp.brands?.[0]?.name || wp.tags?.[0]?.name || 'Azzabi Optic',
          name: wp.name,
          cat,
          genre: 'unisexe',
          price,
          img,
          accent: '#D4AF37',
          is_new: wp.featured,
        });
        added++;
      }
    }

    writeDB(db);
    res.json({ success: true, added, updated, total: wcProducts.length });
  } catch (err) {
    res.status(502).json({ error: `Erreur WooCommerce: ${err.message}` });
  }
});

module.exports = router;
