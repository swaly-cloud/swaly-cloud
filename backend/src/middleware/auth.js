const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'azzabi-optic-secret-2026';

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Non autorisé' });
  }
  try {
    const token = header.slice(7);
    req.admin = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide ou expiré' });
  }
}

function userAuthMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Non autorisé' });
  }
  try {
    const decoded = jwt.verify(header.slice(7), SECRET);
    if (decoded.role !== 'user') return res.status(403).json({ error: 'Accès refusé' });
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide ou expiré' });
  }
}

function optionalUserAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next();
  try {
    const decoded = jwt.verify(header.slice(7), SECRET);
    if (decoded.role === 'user') req.user = decoded;
  } catch {}
  next();
}

module.exports = { authMiddleware, userAuthMiddleware, optionalUserAuth, SECRET };
