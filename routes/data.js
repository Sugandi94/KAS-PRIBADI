// routes/data.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const xlsx = require('xlsx');

const upload = multer({ storage: multer.memoryStorage() });

// GET: Download template untuk import data
router.get('/template', (req, res) => {
  try {
    // Buat data contoh untuk template
    const templateData = [
      { date: '2023-10-27', type: 'pemasukan', category: 'Gaji', amount: 5000000, description: 'Gaji bulan Oktober' },
      { date: '2023-10-28', type: 'pengeluaran', category: 'Makanan', amount: 150000, description: 'Belanja mingguan' }
    ];

    // Buat worksheet dari data template
    const ws = xlsx.utils.json_to_sheet(templateData);
    
    // Buat workbook dan tambahkan worksheet
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Template');

    // Tulis workbook ke buffer
    const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Set header untuk forced download
    res.setHeader('Content-Disposition', 'attachment; filename="template_import.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    res.send(buf);
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengunduh template.' });
  }
});

// GET: Export semua transaksi ke file .xlsx
router.get('/export', async (req, res) => {
  try {
    const transactions = await db.getTransactions();
    
    // Urutkan dari yang terbaru
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Buat worksheet dari data transaksi
    const ws = xlsx.utils.json_to_sheet(transactions);
    
    // Buat workbook dan tambahkan worksheet
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Transaksi');

    // Tulis workbook ke buffer
    const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Set header untuk forced download
    res.setHeader('Content-Disposition', 'attachment; filename="transaksi.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    res.send(buf);
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengekspor data.' });
  }
});

// POST: Import data dari file .xlsx
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Tidak ada file yang diunggah.' });
    }

    // Baca file buffer
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Konversi worksheet ke JSON
    const jsonData = xlsx.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
      return res.status(400).json({ error: 'File Excel kosong atau format tidak sesuai.' });
    }

    // Validasi dan tambahkan transaksi
    for (const row of jsonData) {
      // Pastikan kolom yang diperlukan ada
      if (!row.date || !row.type || !row.category || !row.amount) {
        return res.status(400).json({ error: 'Format data tidak valid. Pastikan kolom: date, type, category, amount ada.' });
      }

      // Format data sesuai kebutuhan
      const transactionData = {
        date: row.date,
        type: row.type,
        category: row.category,
        amount: parseFloat(row.amount),
        description: row.description || ''
      };
      
      await db.addTransaction(transactionData);
    }

    res.status(201).json({ message: `${jsonData.length} transaksi berhasil diimpor.` });
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengimpor data. Pastikan format file benar.' });
  }
});

module.exports = router;