const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../db/setup');
const { optionalUserAuth } = require('../middleware/auth');

const makeRef = () => 'RDV-' + Date.now().toString(36).toUpperCase();

// POST /api/appointments
router.post('/', optionalUserAuth, async (req, res) => {
  try {
    const { service, boutique, date, time, name, phone, note } = req.body;

    if (!service || !boutique || !date || !time || !name || !phone) {
      return res.status(400).json({ error: 'Données manquantes' });
    }

    const db = await readDB();
    const appt = {
      id: Date.now(),
      ref: makeRef(),
      service,
      boutique,
      date,
      time,
      name,
      phone,
      note: note || null,
      status: 'confirmé',
      created_at: new Date().toISOString(),
      ...(req.user ? { user_email: req.user.email } : {}),
    };

    db.appointments.unshift(appt);
    await writeDB(db);

    res.status(201).json(appt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/appointments
router.get('/', async (req, res) => {
  try {
    const db = await readDB();
    res.json(db.appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/appointments/:ref/status
router.patch('/:ref/status', async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['confirmé', 'annulé', 'terminé'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Statut invalide' });

    const db = await readDB();
    const appt = db.appointments.find(a => a.ref === req.params.ref);
    if (!appt) return res.status(404).json({ error: 'Rendez-vous introuvable' });

    appt.status = status;
    await writeDB(db);

    res.json(appt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
