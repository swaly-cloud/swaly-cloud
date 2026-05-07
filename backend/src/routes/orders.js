const express = require('express');
const router = express.Router();
const db = require('../db/setup');

const makeRef = () => 'AZ-' + Date.now().toString(36).toUpperCase();

// POST /api/orders
router.post('/', async (req, res) => {
  const { cart, delivery, boutique, contact, payment, total } = req.body;

  if (!cart?.length || !contact?.name || !contact?.phone || !payment) {
    return res.status(400).json({ error: 'Données manquantes' });
  }

  await db.read();

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

  db.data.orders.unshift(order);
  await db.write();

  res.status(201).json(order);
});

// GET /api/orders
router.get('/', async (req, res) => {
  await db.read();
  res.json(db.data.orders);
});

// PATCH /api/orders/:ref/status
router.patch('/:ref/status', async (req, res) => {
  const { status } = req.body;
  const valid = ['confirmé', 'en préparation', 'livré', 'annulé'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Statut invalide' });

  await db.read();
  const order = db.data.orders.find(o => o.ref === req.params.ref);
  if (!order) return res.status(404).json({ error: 'Commande introuvable' });

  order.status = status;
  await db.write();

  res.json(order);
});

module.exports = router;
