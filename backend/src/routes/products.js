const express = require('express');
const router = express.Router();
const db = require('../db/setup');

// GET /api/products
router.get('/', (req, res) => {
  const { cat, genre, q, sort } = req.query;

  let sql = 'SELECT * FROM products WHERE 1=1';
  const params = [];

  if (cat && cat !== 'all') {
    sql += ' AND cat = ?';
    params.push(cat);
  }
  if (genre && genre !== 'all') {
    sql += ' AND genre = ?';
    params.push(genre);
  }
  if (q) {
    sql += ' AND (brand LIKE ? OR name LIKE ?)';
    params.push(`%${q}%`, `%${q}%`);
  }

  if (sort === 'asc')   sql += ' ORDER BY price ASC';
  else if (sort === 'desc') sql += ' ORDER BY price DESC';
  else if (sort === 'brand') sql += ' ORDER BY brand ASC';
  else sql += ' ORDER BY is_new DESC, id ASC';

  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(r => ({ ...r, new: !!r.is_new })));
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Produit introuvable' });
  res.json({ ...row, new: !!row.is_new });
});

module.exports = router;
