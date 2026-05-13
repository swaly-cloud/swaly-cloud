const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { SECRET, userAuthMiddleware } = require('../middleware/auth');
const { createUser, findUserByEmail } = require('../db/setup');

const router = express.Router();

// Admin credentials from env (set these in Railway)
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'admin@azzabioptic.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'azzabi2026';

// Hash stored at startup (so plain text never lives in memory after boot)
const HASHED_PASSWORD = bcrypt.hashSync(ADMIN_PASSWORD, 10);

// POST /api/auth/login  (admin)
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });

  if (email !== ADMIN_EMAIL || !bcrypt.compareSync(password, HASHED_PASSWORD)) {
    return res.status(401).json({ error: 'Identifiants incorrects' });
  }

  const token = jwt.sign({ email, role: 'admin' }, SECRET, { expiresIn: '24h' });
  res.json({ token, admin: { email, role: 'admin' } });
});

// GET /api/auth/me  (admin)
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

// POST /api/auth/user/register
router.post('/user/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nom, email et mot de passe requis' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Mot de passe trop court (6 caractères minimum)' });
  }
  try {
    const existing = await findUserByEmail(email.toLowerCase());
    if (existing) return res.status(409).json({ error: 'Email déjà utilisé' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser({ name, email: email.toLowerCase(), passwordHash });
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: 'user' },
      SECRET,
      { expiresIn: '30d' }
    );
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/auth/user/login
router.post('/user/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });

  try {
    const user = await findUserByEmail(email.toLowerCase());
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: 'user' },
      SECRET,
      { expiresIn: '30d' }
    );
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/auth/user/me
router.get('/user/me', userAuthMiddleware, (req, res) => {
  res.json({ user: { id: req.user.id, email: req.user.email, name: req.user.name } });
});

module.exports = router;
