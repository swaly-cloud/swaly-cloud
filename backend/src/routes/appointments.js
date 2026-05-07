const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../db/setup');

const makeRef = () => 'RDV-' + Date.now().toString(36).toUpperCase();

// POST /api/appointments
router.post('/', (req, res) => {
  const { service, boutique, date, time, name, phone, note } = req.body;

  if (!service || !boutique || !date || !time || !name || !phone) {
    return res.status(400).json({ error: 'Données manquantes' });
  }

  const db = readDB();
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

  db.appointments.unshift(appt);
  writeDB(db);

  res.status(201).json(appt);
});

// GET /api/appointments
router.get('/', (req, res) => {
  const db = readDB();
  res.json(db.appointments);
});

// PATCH /api/appointments/:ref/status
router.patch('/:ref/status', (req, res) => {
  const { status } = req.body;
  const valid = ['confirmé', 'annulé', 'terminé'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Statut invalide' });

  const db = readDB();
  const appt = db.appointments.find(a => a.ref === req.params.ref);
  if (!appt) return res.status(404).json({ error: 'Rendez-vous introuvable' });

  appt.status = status;
  writeDB(db);

  res.json(appt);
});

module.exports = router;
