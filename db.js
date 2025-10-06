// db.js
const fs = require('fs').promises;
const path = require('path');

const DB_FILE = path.join(__dirname, 'db', 'transactions.json');

const getTransactions = async () => {
  try {
    const data = await fs.readFile(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
};

const saveTransactions = async (transactions) => {
  await fs.writeFile(DB_FILE, JSON.stringify(transactions, null, 2), 'utf8');
};

const addTransaction = async (transactionData) => {
  const transactions = await getTransactions();
  const newTransaction = {
    id: Date.now(),
    ...transactionData
  };
  transactions.push(newTransaction);
  await saveTransactions(transactions);
  return newTransaction;
};

const deleteTransaction = async (id) => {
  let transactions = await getTransactions();
  const initialLength = transactions.length;
  transactions = transactions.filter(tx => tx.id !== parseInt(id));
  
  if (transactions.length < initialLength) {
    await saveTransactions(transactions);
    return true;
  }
  return false;
};

module.exports = {
  getTransactions,
  addTransaction,
  deleteTransaction
};