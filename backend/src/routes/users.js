const express = require('express');
const router = express.Router();
const { userAuthMiddleware } = require('../middleware/auth');
const { getUserOrders, getUserAppointments } = require('../db/setup');

// GET /api/users/me/orders
router.get('/me/orders', userAuthMiddleware, async (req, res) => {
  try {
    const orders = await getUserOrders(req.user.email);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/me/appointments
router.get('/me/appointments', userAuthMiddleware, async (req, res) => {
  try {
    const appointments = await getUserAppointments(req.user.email);
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
