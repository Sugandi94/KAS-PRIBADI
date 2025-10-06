// belakang.js
document.addEventListener('DOMContentLoaded', () => {
    const dataTableBody = document.getElementById('data-table-body');
    const exportBtn = document.getElementById('export-btn');
    const downloadTemplateBtn = document.getElementById('download-template-btn'); // Tambahkan ini
    const importForm = document.getElementById('import-form');

    const API_URL = 'http://localhost:3000/api';

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR'
        }).format(amount);
    };

    const fetchAndDisplayData = async () => {
        try {
            const res = await fetch(`${API_URL}/transactions?all=true`);
            const transactions = await res.json();
            
            dataTableBody.innerHTML = '';
            if (transactions.length === 0) {
                dataTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#999;">Belum ada data.</td></tr>';
                return;
            }

            transactions.forEach(tx => {
                const row = document.createElement('tr');
                const formattedDate = new Date(tx.date).toLocaleDateString('id-CA');
                
                row.innerHTML = `
                    <td>${formattedDate}</td>
                    <td>${tx.type}</td>
                    <td>${tx.category}</td>
                    <td>${tx.description || '-'}</td>
                    <td class="amount ${tx.type}">${tx.type === 'pemasukan' ? '+' : '-'} ${formatCurrency(tx.amount)}</td>
                `;
                dataTableBody.appendChild(row);
            });
        } catch (error) {
            alert('Gagal memuat data.');
            console.error(error);
        }
    };

    exportBtn.addEventListener('click', () => {
        window.location.href = `${API_URL}/data/export`;
    });

    // --- TAMBAHKAN EVENT LISTENER UNTUK DOWNLOAD TEMPLATE ---
    downloadTemplateBtn.addEventListener('click', () => {
        window.location.href = `${API_URL}/data/template`;
    });

    importForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const fileInput = document.getElementById('import-file');
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);

        try {
            const res = await fetch(`${API_URL}/data/import`, {
                method: 'POST',
                body: formData
            });

            const result = await res.json();

            if (res.ok) {
                alert(result.message);
                importForm.reset();
                fetchAndDisplayData();
            } else {
                alert('Error: ' + result.error);
            }
        } catch (error) {
            alert('Gagal mengimpor data.');
            console.error(error);
        }
    });

    fetchAndDisplayData();
});