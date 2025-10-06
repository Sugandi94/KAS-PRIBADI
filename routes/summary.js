// routes/summary.js
const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const transactions = await db.getTransactions();

    const totalPemasukan = transactions
      .filter(tx => tx.type === 'pemasukan')
      .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

    const totalPengeluaran = transactions
      .filter(tx => tx.type === 'pengeluaran')
      .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
    
    const saldo = totalPemasukan - totalPengeluaran;

    res.json({
      totalPemasukan,
      totalPengeluaran,
      saldo
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;