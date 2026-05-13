const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../db/setup');
const { optionalUserAuth } = require('../middleware/auth');

const makeRef = () => 'AZ-' + Date.now().toString(36).toUpperCase();

// POST /api/orders
router.post('/', optionalUserAuth, async (req, res) => {
  try {
    const { cart, delivery, boutique, contact, payment, total } = req.body;

    if (!cart?.length || !contact?.name || !contact?.phone || !payment) {
      return res.status(400).json({ error: 'Données manquantes' });
    }

    const db = await readDB();
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
      ...(req.user ? { user_email: req.user.email } : {}),
    };

    db.orders.unshift(order);
    await writeDB(db);

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders
router.get('/', async (req, res) => {
  try {
    const db = await readDB();
    res.json(db.orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/orders/:ref/status
router.patch('/:ref/status', async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['confirmé', 'en préparation', 'livré', 'annulé'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Statut invalide' });

    const db = await readDB();
    const order = db.orders.find(o => o.ref === req.params.ref);
    if (!order) return res.status(404).json({ error: 'Commande introuvable' });

    order.status = status;
    await writeDB(db);

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
