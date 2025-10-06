// routes/details.js
const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const { month, category } = req.query;
    let transactions = await db.getTransactions();

    if (month) {
      transactions = transactions.filter(tx => tx.date.startsWith(month));
    }
    if (category) {
      transactions = transactions.filter(tx => tx.category === category);
    }

    const incomeTransactions = transactions.filter(tx => tx.type === 'pemasukan');
    const expenseTransactions = transactions.filter(tx => tx.type === 'pengeluaran');

    const groupByCategory = (transactions) => {
      return transactions.reduce((acc, tx) => {
        const existingCategory = acc.find(item => item.category === tx.category);
        if (existingCategory) {
          existingCategory.totalAmount += parseFloat(tx.amount);
        } else {
          acc.push({
            category: tx.category,
            totalAmount: parseFloat(tx.amount)
          });
        }
        return acc;
      }, []);
    };

    const incomeDetails = groupByCategory(incomeTransactions);
    const expenseDetails = groupByCategory(expenseTransactions);

    res.json({
      incomeDetails,
      expenseDetails
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;