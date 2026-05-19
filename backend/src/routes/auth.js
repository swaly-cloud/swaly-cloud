const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { SECRET } = require('../middleware/auth');

const router = express.Router();

// Admin credentials from env (set these in Railway)
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'admin@azzabioptic.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'azzabi2026';

// Hash stored at startup (so plain text never lives in memory after boot)
const HASHED_PASSWORD = bcrypt.hashSync(ADMIN_PASSWORD, 10);

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });

  if (email !== ADMIN_EMAIL || !bcrypt.compareSync(password, HASHED_PASSWORD)) {
    return res.status(401).json({ error: 'Identifiants incorrects' });
  }

  const token = jwt.sign({ email, role: 'admin' }, SECRET, { expiresIn: '7d' });
  res.json({ token, admin: { email, role: 'admin' } });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Non autorisé' });
  try {
    const admin = jwt.verify(header.slice(7), SECRET);
    res.json({ admin });
  } catch {
    res.status(401).json({ error: 'Token invalide' });
  }
});

module.exports = router;
