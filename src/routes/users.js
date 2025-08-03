const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/:id', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM users WHERE user_id = ?', [req.params.id]);
  res.json(rows[0]);
});

module.exports = router;
