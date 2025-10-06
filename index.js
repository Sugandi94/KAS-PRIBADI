// index.js
const express = require('express');
const cors = require('cors');

const transactionRoutes = require('./routes/transactions');
const summaryRoutes = require('./routes/summary');
const categoryRoutes = require('./routes/categories');
const detailsRoutes = require('./routes/details');
const authRoutes = require('./routes/auth');
const dataRoutes = require('./routes/data'); // <-- Import route data

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.use('/api/transactions', transactionRoutes);
app.use('/api/summary', summaryRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/details', detailsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes); // <-- Gunakan route data

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});