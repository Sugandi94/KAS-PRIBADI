// routes/categories.js
const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

const CATEGORIES_FILE = path.join(__dirname, '..', 'db', 'category.json');

router.get('/', async (req, res) => {
  try {
    const data = await fs.readFile(CATEGORIES_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.json([]);
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;