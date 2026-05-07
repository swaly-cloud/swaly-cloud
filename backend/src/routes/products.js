const express = require('express');
const router = express.Router();
const { readDB } = require('../db/setup');

// GET /api/products
router.get('/', (req, res) => {
  const { cat, genre, q, sort } = req.query;
  const db = readDB();

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
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
  const db = readDB();
  const product = db.products.find(p => p.id === Number(req.params.id));
  if (!product) return res.status(404).json({ error: 'Produit introuvable' });
  res.json(product);
});

module.exports = router;
