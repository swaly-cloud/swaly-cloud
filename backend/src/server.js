const express = require('express');
const cors = require('cors');

const productsRouter     = require('./routes/products');
const ordersRouter       = require('./routes/orders');
const appointmentsRouter = require('./routes/appointments');
const authRouter         = require('./routes/auth');
const adminRouter        = require('./routes/admin');
const tryonRouter        = require('./routes/tryon');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json({ limit: '20mb' }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'azzabi-optic-api', version: '2.3.0' }));

app.use('/api/auth',         authRouter);
app.use('/api/admin',        adminRouter);
app.use('/api/products',     productsRouter);
app.use('/api/orders',       ordersRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/tryon',        tryonRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Erreur serveur' });
});

app.listen(PORT, () => {
  console.log(`Azzabi Optic API → http://localhost:${PORT}`);
});
