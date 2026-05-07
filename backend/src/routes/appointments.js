const express = require('express');
const router = express.Router();
const db = require('../db/setup');

const makeRef = () => 'RDV-' + Date.now().toString(36).toUpperCase();

// POST /api/appointments
router.post('/', (req, res) => {
  const { service, boutique, date, time, name, phone, note } = req.body;

  if (!service || !boutique || !date || !time || !name || !phone) {
    return res.status(400).json({ error: 'Données manquantes' });
  }

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
  db.write();

  res.status(201).json(appt);
});

// GET /api/appointments
router.get('/', (req, res) => {
  res.json(db.data.appointments);
});

// PATCH /api/appointments/:ref/status
router.patch('/:ref/status', (req, res) => {
  const { status } = req.body;
  const valid = ['confirmé', 'annulé', 'terminé'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Statut invalide' });

  const appt = db.data.appointments.find(a => a.ref === req.params.ref);
  if (!appt) return res.status(404).json({ error: 'Rendez-vous introuvable' });

  appt.status = status;
  db.write();

  res.json(appt);
});

module.exports = router;
