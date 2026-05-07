const express = require('express');
const router = express.Router();
const db = require('../db/setup');

const makeRef = () => 'RDV-' + Date.now().toString(36).toUpperCase();

// POST /api/appointments
router.post('/', async (req, res) => {
  const { service, boutique, date, time, name, phone, note } = req.body;

  if (!service || !boutique || !date || !time || !name || !phone) {
    return res.status(400).json({ error: 'Données manquantes' });
  }

  await db.read();

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
  };

  db.data.appointments.unshift(appt);
  await db.write();

  res.status(201).json(appt);
});

// GET /api/appointments
router.get('/', async (req, res) => {
  await db.read();
  res.json(db.data.appointments);
});

// PATCH /api/appointments/:ref/status
router.patch('/:ref/status', async (req, res) => {
  const { status } = req.body;
  const valid = ['confirmé', 'annulé', 'terminé'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Statut invalide' });

  await db.read();
  const appt = db.data.appointments.find(a => a.ref === req.params.ref);
  if (!appt) return res.status(404).json({ error: 'Rendez-vous introuvable' });

  appt.status = status;
  await db.write();

  res.json(appt);
});

module.exports = router;
