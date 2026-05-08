const express = require('express');
const router = express.Router();
const { readDB } = require('../db/setup');

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { cat, genre, q, sort } = req.query;
    const db = await readDB();

    let results = db.products;

    if (cat && cat !== 'all')   results = results.filter(p => p.cat === cat);
    if (genre && genre !== 'all') results = results.filter(p => p.genre === genre);
    if (q) {
      const lq = q.toLowerCase();
      results = results.filter(p =>
        p.brand.toLowerCase().includes(lq) || p.name.toLowerCase().includes(lq)
      );
    }

    if (sort === 'asc')   results = [...results].sort((a, b) => a.price - b.price);
    else if (sort === 'desc') results = [...results].sort((a, b) => b.price - a.price);
    else if (sort === 'brand') results = [...results].sort((a, b) => a.brand.localeCompare(b.brand));
    else results = [...results].sort((a, b) => (b.is_new ? 1 : 0) - (a.is_new ? 1 : 0));

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const db = await readDB();
    const product = db.products.find(p => p.id === Number(req.params.id));
    if (!product) return res.status(404).json({ error: 'Produit introuvable' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
