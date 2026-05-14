'use strict';

const express = require('express');
const { store } = require('../data/store');

const router = express.Router();

// GET /api/audit — newest-first, optional ?eventId= filter
router.get('/', (req, res) => {
  let log = [...store.auditLog];

  if (req.query.eventId) {
    log = log.filter((entry) => entry.resourceRef === req.query.eventId);
  }

  log.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  res.json(log);
});

module.exports = router;
