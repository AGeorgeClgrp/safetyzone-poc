'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authMiddleware = require('./middleware/auth');
const eventsRouter = require('./routes/events');
const auditRouter = require('./routes/audit');
const sessionRouter = require('./routes/session');
const vrmRouter = require('./routes/vrm');
const policyRouter = require('./routes/policy');
const trendsRouter = require('./routes/trends');

const app = express();
const PORT = 3001;

app.use(
  cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-User-Id', 'X-User-Role'],
  })
);

app.use(express.json());
app.use(authMiddleware);

app.use('/api/events', eventsRouter);
app.use('/api/audit', auditRouter);
app.use('/api/session', sessionRouter);
app.use('/api/vrm', vrmRouter);
app.use('/api/policy', policyRouter);
app.use('/api/trends', trendsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`SafetyZone server running on http://localhost:${PORT}`);
});

module.exports = app;
