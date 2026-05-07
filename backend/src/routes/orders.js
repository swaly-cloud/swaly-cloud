const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../db/setup');

const makeRef = () => 'AZ-' + Date.now().toString(36).toUpperCase();

// POST /api/orders
router.post('/', (req, res) => {
  const { cart, delivery, boutique, contact, payment, total } = req.body;

  if (!cart?.length || !contact?.name || !contact?.phone || !payment) {
    return res.status(400).json({ error: 'Données manquantes' });
  }

  const db = readDB();
  const order = {
    id: Date.now(),
    ref: makeRef(),
    cart,
    delivery,
    boutique: boutique || null,
    contact,
    payment,
    total,
    status: 'confirmé',
    created_at: new Date().toISOString(),
  };

  db.orders.unshift(order);
  writeDB(db);

  res.status(201).json(order);
});

// GET /api/orders
router.get('/', (req, res) => {
  const db = readDB();
  res.json(db.orders);
});

// PATCH /api/orders/:ref/status
router.patch('/:ref/status', (req, res) => {
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

module.exports = router;
