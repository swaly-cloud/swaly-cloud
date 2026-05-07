const express = require('express');
const router = express.Router();
const db = require('../db/setup');

function makeRef() {
  return 'RDV-' + Date.now().toString(36).toUpperCase();
}

// POST /api/appointments
router.post('/', (req, res) => {
  const { service, boutique, date, time, name, phone, note } = req.body;

  if (!service || !boutique || !date || !time || !name || !phone) {
    return res.status(400).json({ error: 'Données manquantes' });
  }

  const ref = makeRef();
  db.prepare(`
    INSERT INTO appointments (ref, service, boutique, date, time, name, phone, note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(ref, service, boutique, date, time, name, phone, note || null);

  const appt = db.prepare('SELECT * FROM appointments WHERE ref = ?').get(ref);
  res.status(201).json(appt);
});

// GET /api/appointments
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM appointments ORDER BY date ASC, time ASC').all();
  res.json(rows);
});

// PATCH /api/appointments/:ref/status
router.patch('/:ref/status', (req, res) => {
  const { status } = req.body;
  const valid = ['confirmé', 'annulé', 'terminé'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Statut invalide' });

  db.prepare('UPDATE appointments SET status = ? WHERE ref = ?').run(status, req.params.ref);
  const updated = db.prepare('SELECT * FROM appointments WHERE ref = ?').get(req.params.ref);
  if (!updated) return res.status(404).json({ error: 'Rendez-vous introuvable' });

  res.json(updated);
});

module.exports = router;
