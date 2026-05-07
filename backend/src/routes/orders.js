const express = require('express');
const router = express.Router();
const db = require('../db/setup');

function makeRef() {
  return 'AZ-' + Date.now().toString(36).toUpperCase();
}

// POST /api/orders
router.post('/', (req, res) => {
  const { cart, delivery, boutique, contact, payment, total } = req.body;

  if (!cart?.length || !contact?.name || !contact?.phone || !payment) {
    return res.status(400).json({ error: 'Données manquantes' });
  }

  const ref = makeRef();
  db.prepare(`
    INSERT INTO orders (ref, cart, delivery, boutique, contact, payment, total)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(ref, JSON.stringify(cart), delivery, boutique || null, JSON.stringify(contact), payment, total);

  const order = db.prepare('SELECT * FROM orders WHERE ref = ?').get(ref);
  res.status(201).json({
    ...order,
    ref,
    cart: JSON.parse(order.cart),
    contact: JSON.parse(order.contact),
  });
});

// GET /api/orders
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
  res.json(rows.map(r => ({
    ...r,
    cart: JSON.parse(r.cart),
    contact: JSON.parse(r.contact),
  })));
});

// PATCH /api/orders/:ref/status
router.patch('/:ref/status', (req, res) => {
  const { status } = req.body;
  const valid = ['confirmé', 'en préparation', 'livré', 'annulé'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Statut invalide' });

  db.prepare('UPDATE orders SET status = ? WHERE ref = ?').run(status, req.params.ref);
  const updated = db.prepare('SELECT * FROM orders WHERE ref = ?').get(req.params.ref);
  if (!updated) return res.status(404).json({ error: 'Commande introuvable' });

  res.json({ ...updated, cart: JSON.parse(updated.cart), contact: JSON.parse(updated.contact) });
});

module.exports = router;
