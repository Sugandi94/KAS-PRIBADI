// routes/transactions.js
const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const { month, category, page, limit, all } = req.query;
    
    let transactions = await db.getTransactions();

    // Terapkan filter
    if (month) {
      transactions = transactions.filter(tx => tx.date.startsWith(month));
    }
    if (category) {
      transactions = transactions.filter(tx => tx.category === category);
    }
    
    // Urutkan dari yang terbaru
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Jika 'all' adalah true, kembalikan semua transaksi (digunakan untuk mengisi filter)
    if (all === 'true') {
      return res.json(transactions);
    }

    // Jika tidak, terapkan pagination
    const currentPage = parseInt(page) || 1;
    const itemsPerPage = parseInt(limit) || 10;
    
    const totalItems = transactions.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    const paginatedTransactions = transactions.slice(startIndex, endIndex);

    res.json({
      transactions: paginatedTransactions,
      pagination: {
        currentPage,
        totalPages,
        totalItems,
        itemsPerPage
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const newTransaction = await db.addTransaction(req.body);
    res.status(201).json(newTransaction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;
    
    let transactions = await db.getTransactions();
    const index = transactions.findIndex(tx => tx.id === parseInt(id));

    if (index !== -1) {
      transactions[index] = { ...transactions[index], ...updatedData };
      await db.saveTransactions(transactions);
      res.json(transactions[index]);
    } else {
      res.status(404).json({ error: 'Transaksi tidak ditemukan' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const success = await db.deleteTransaction(req.params.id);
    if (success) {
      res.status(200).json({ message: 'Transaksi dihapus' });
    } else {
      res.status(404).json({ error: 'Transaksi tidak ditemukan' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;