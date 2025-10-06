// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const fs = require('fs').promises;
const path = require('path');

const PASSWORD_FILE = path.join(__dirname, '..', 'db', 'password.json');

router.post('/verify', async (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ success: false, message: 'Password diperlukan.' });
  }

  try {
    const data = await fs.readFile(PASSWORD_FILE, 'utf8');
    const { hash } = JSON.parse(data);

    const isMatch = await bcrypt.compare(password, hash);

    if (isMatch) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: 'Password salah.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
});

module.exports = router;