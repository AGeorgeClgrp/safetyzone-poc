'use strict';

const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const POLICY_PATH = path.join(__dirname, '../policies/FALL_PREVENTION_POLICY.txt');

router.get('/', (req, res) => {
  try {
    const content = fs.readFileSync(POLICY_PATH, 'utf8');
    res.json({ name: 'FALL_PREVENTION_POLICY.txt', title: 'Fall Prevention Policy — FP-001', content });
  } catch (err) {
    res.status(404).json({ error: 'Policy file not found' });
  }
});

module.exports = router;
