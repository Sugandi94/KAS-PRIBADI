// script.js
document.addEventListener('DOMContentLoaded', () => {
    // ... (deklarasi variabel yang sama) ...
    const transactionForm = document.getElementById('transaction-form');
    const transactionList = document.getElementById('transaction-list');
    const categorySelect = document.getElementById('category');
    const totalIncomeEl = document.getElementById('total-income');
    const totalExpenseEl = document.getElementById('total-expense');
    const balanceEl = document.getElementById('balance');

    const filterMonthSelect = document.getElementById('filter-month');
    const filterCategorySelect = document.getElementById('filter-category');

    const incomeDetailsList = document.getElementById('income-details-list');
    const expenseDetailsList = document.getElementById('expense-details-list');

    const actionModal = document.getElementById('action-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');

    const itemsPerPageSelect = document.getElementById('items-per-page');
    const paginationButtons = document.getElementById('pagination-buttons');
    const paginationInfoText = document.getElementById('pagination-info-text');

    // --- TAMBAHKAN VARIABEL UNTUK TOGGLE FORM ---
    const toggleFormBtn = document.getElementById('toggle-form-btn');
    const formContainer = document.getElementById('form-container');

    let pendingAction = null;
    let pendingId = null;

    let currentPage = 1;
    let itemsPerPage = 10;
    let totalPages = 1;
    let totalItems = 0;

    const API_URL = 'http://localhost:3000/api';

    // ... (semua fungsi sebelum `initializeApp` tetap sama) ...
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR'
        }).format(amount);
    };

    const fetchCategoriesForForm = async () => {
        const res = await fetch(`${API_URL}/categories`);
        const categories = await res.json();
        categorySelect.innerHTML = '<option value="" disabled selected>Pilih Kategori</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });
    };

    const populateFilters = async () => {
        const res = await fetch(`${API_URL}/transactions?all=true`);
        const transactions = await res.json();
        
        const monthsSet = new Set();
        transactions.forEach(tx => {
            monthsSet.add(tx.date.substring(0, 7));
        });

        const sortedMonths = Array.from(monthsSet).sort().reverse();

        filterMonthSelect.innerHTML = '<option value="">Semua Bulan</option>';
        sortedMonths.forEach(month => {
            const option = document.createElement('option');
            option.value = month;
            const [year, monthNum] = month.split('-');
            const monthName = new Date(year, monthNum - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
            option.textContent = monthName;
            filterMonthSelect.appendChild(option);
        });

        const resCat = await fetch(`${API_URL}/categories`);
        const categories = await resCat.json();
        filterCategorySelect.innerHTML = '<option value="">Semua Kategori</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            filterCategorySelect.appendChild(option);
        });
    };

    const fetchAndRenderDetails = async (month = '', category = '') => {
        let url = `${API_URL}/details?`;
        const params = new URLSearchParams();
        if (month) params.append('month', month);
        if (category) params.append('category', category);
        url += params.toString();

        const res = await fetch(url);
        const { incomeDetails, expenseDetails } = await res.json();

        incomeDetailsList.innerHTML = '';
        if (incomeDetails.length > 0) {
            incomeDetails.forEach(item => {
                const div = document.createElement('div');
                div.className = 'detail-item income';
                div.innerHTML = `
                    <span class="category-name">${item.category}</span>
                    <span class="amount">+ ${formatCurrency(item.totalAmount)}</span>
                `;
                incomeDetailsList.appendChild(div);
            });
        } else {
            incomeDetailsList.innerHTML = '<p class="no-data-message">Tidak ada pemasukan.</p>';
        }

        expenseDetailsList.innerHTML = '';
        if (expenseDetails.length > 0) {
            expenseDetails.forEach(item => {
                const div = document.createElement('div');
                div.className = 'detail-item expense';
                div.innerHTML = `
                    <span class="category-name">${item.category}</span>
                    <span class="amount">- ${formatCurrency(item.totalAmount)}</span>
                `;
                expenseDetailsList.appendChild(div);
            });
        } else {
            expenseDetailsList.innerHTML = '<p class="no-data-message">Tidak ada pengeluaran.</p>';
        }
    };

    const fetchTransactions = async (page = 1, limit = itemsPerPage) => {
        const selectedMonth = filterMonthSelect.value;
        const selectedCategory = filterCategorySelect.value;
        
        let url = `${API_URL}/transactions?`;
        const params = new URLSearchParams();
        if (selectedMonth) params.append('month', selectedMonth);
        if (selectedCategory) params.append('category', selectedCategory);
        params.append('page', page);
        params.append('limit', limit);
        url += params.toString();

        const res = await fetch(url);
        const { transactions, pagination } = await res.json();
        
        currentPage = pagination.currentPage;
        totalPages = pagination.totalPages;
        totalItems = pagination.totalItems;
        itemsPerPage = pagination.itemsPerPage;

        transactionList.innerHTML = '';
        if (transactions.length === 0) {
            transactionList.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#999; padding: 20px;">Tidak ada data untuk ditampilkan.</td></tr>';
        } else {
            transactions.forEach(tx => {
                const row = document.createElement('tr');
                const formattedDate = new Date(tx.date).toLocaleDateString('id-CA');
                
                row.innerHTML = `
                    <td>${formattedDate}</td>
                    <td>${tx.category}</td>
                    <td>${tx.description || '-'}</td>
                    <td class="amount ${tx.type}">${tx.type === 'pemasukan' ? '+' : '-'} ${formatCurrency(tx.amount)}</td>
                    <td>
                        <button class="edit-btn" onclick="promptAction('edit', ${tx.id})">Edit</button>
                        <button class="delete-btn" onclick="promptAction('delete', ${tx.id})">Hapus</button>
                    </td>
                `;
                transactionList.appendChild(row);
            });
        }

        renderPaginationControls();
    };

    const renderPaginationControls = () => {
        const startItem = totalItems > 0 ? 1 : 0;
        const endItem = totalItems;
        paginationInfoText.textContent = `Menampilkan ${startItem}-${endItem} dari ${totalItems} data`;

        if (itemsPerPage >= 999999) {
            paginationButtons.innerHTML = '';
            return;
        }

        paginationButtons.innerHTML = '';
        
        const prevBtn = document.createElement('button');
        prevBtn.textContent = 'Previous';
        prevBtn.className = 'page-btn';
        prevBtn.disabled = currentPage === 1;
        prevBtn.onclick = () => goToPage(currentPage - 1);
        paginationButtons.appendChild(prevBtn);

        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
            pageBtn.onclick = () => goToPage(i);
            paginationButtons.appendChild(pageBtn);
        }

        const nextBtn = document.createElement('button');
        nextBtn.textContent = 'Next';
        nextBtn.className = 'page-btn';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.onclick = () => goToPage(currentPage + 1);
        paginationButtons.appendChild(nextBtn);
    };
    
    window.goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            fetchTransactions(page, itemsPerPage);
        }
    };

    const fetchSummary = async () => {
        const res = await fetch(`${API_URL}/summary`);
        const data = await res.json();
        
        totalIncomeEl.textContent = formatCurrency(data.totalPemasukan);
        totalExpenseEl.textContent = formatCurrency(data.totalPengeluaran);
        balanceEl.textContent = formatCurrency(data.saldo);
    };

    window.promptAction = (action, id) => {
        pendingAction = action;
        pendingId = id;
        
        modalTitle.textContent = 'Konfirmasi Password';
        modalBody.innerHTML = `
            <form id="password-form">
                <div class="form-group">
                    <label for="password-input">Masukkan Password</label>
                    <input type="password" id="password-input" required>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-cancel" onclick="closeModal()">Batal</button>
                    <button type="submit" class="btn-save">Konfirmasi</button>
                </div>
            </form>
        `;
        actionModal.style.display = 'block';
        document.getElementById('password-input').focus();
    };

    window.closeModal = () => {
        actionModal.style.display = 'none';
        pendingAction = null;
        pendingId = null;
    };

    const showEditForm = async () => {
        modalTitle.textContent = 'Edit Transaksi';
        
        const res = await fetch(`${API_URL}/transactions?all=true`);
        const transactions = await res.json();
        const transactionToEdit = transactions.find(tx => tx.id === pendingId);

        if (transactionToEdit) {
            const resCat = await fetch(`${API_URL}/categories`);
            const categories = await resCat.json();
            
            let categoryOptions = '';
            categories.forEach(category => {
                const selected = category === transactionToEdit.category ? 'selected' : '';
                categoryOptions += `<option value="${category}" ${selected}>${category}</option>`;
            });

            modalBody.innerHTML = `
                <form id="edit-form">
                    <input type="hidden" id="edit-id" value="${transactionToEdit.id}">
                    <div class="form-group">
                        <label for="edit-date">Tanggal</label>
                        <input type="date" id="edit-date" value="${transactionToEdit.date}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-type">Tipe</label>
                        <select id="edit-type" required>
                            <option value="pemasukan" ${transactionToEdit.type === 'pemasukan' ? 'selected' : ''}>Pemasukan</option>
                            <option value="pengeluaran" ${transactionToEdit.type === 'pengeluaran' ? 'selected' : ''}>Pengeluaran</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="edit-category">Kategori</label>
                        <select id="edit-category" required>
                            ${categoryOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="edit-amount">Jumlah (Rp)</label>
                        <input type="number" id="edit-amount" value="${transactionToEdit.amount}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-description">Deskripsi</label>
                        <input type="text" id="edit-description" value="${transactionToEdit.description || ''}" placeholder="opsional">
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-cancel" onclick="closeModal()">Batal</button>
                        <button type="submit" class="btn-save">Simpan Perubahan</button>
                    </div>
                </form>
            `;
        }
    };
    
    modalBody.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formId = e.target.id;

        if (formId === 'password-form') {
            const password = document.getElementById('password-input').value;
            const res = await fetch(`${API_URL}/auth/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            const result = await res.json();

            if (result.success) {
                if (pendingAction === 'edit') {
                    showEditForm();
                } else if (pendingAction === 'delete') {
                    const idToDelete = pendingId;
                    closeModal();
                    deleteTransaction(idToDelete);
                }
            } else {
                alert(result.message || 'Password salah.');
                document.getElementById('password-input').value = '';
                document.getElementById('password-input').focus();
            }
        } else if (formId === 'edit-form') {
            const id = document.getElementById('edit-id').value;
            const updatedData = {
                date: document.getElementById('edit-date').value,
                type: document.getElementById('edit-type').value,
                category: document.getElementById('edit-category').value,
                amount: parseFloat(document.getElementById('edit-amount').value),
                description: document.getElementById('edit-description').value,
            };

            const res = await fetch(`${API_URL}/transactions/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });

            if (res.ok) {
                closeModal();
                fetchTransactions(currentPage, itemsPerPage);
                fetchSummary();
                fetchAndRenderDetails();
                populateFilters();
            } else {
                alert('Gagal memperbarui transaksi');
            }
        }
    });

    const handleFilterChange = () => {
        currentPage = 1;
        fetchTransactions(currentPage, itemsPerPage);
        fetchAndRenderDetails();
    };

    filterMonthSelect.addEventListener('change', handleFilterChange);
    filterCategorySelect.addEventListener('change', handleFilterChange);

    itemsPerPageSelect.addEventListener('change', () => {
        itemsPerPage = parseInt(itemsPerPageSelect.value);
        currentPage = 1;
        fetchTransactions(currentPage, itemsPerPage);
    });

    transactionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const date = document.getElementById('date').value;
        const type = document.getElementById('type').value;
        const amount = parseFloat(document.getElementById('amount').value);
        const category = document.getElementById('category').value;
        const description = document.getElementById('description').value;

        const res = await fetch(`${API_URL}/transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date, type, amount, category, description })
        });

        if (res.ok) {
            transactionForm.reset();
            document.getElementById('date').value = new Date().toISOString().split('T')[0];
            currentPage = 1;
            fetchTransactions(currentPage, itemsPerPage);
            fetchSummary();
            fetchAndRenderDetails();
            populateFilters();
            
            // --- PERBAIKAN: Setelah berhasil tambah, sembunyikan form dan reset tombol ---
            formContainer.classList.add('hidden');
            toggleFormBtn.textContent = '+ Tambah Transaksi Baru';
            toggleFormBtn.classList.remove('close');
        } else {
            alert('Gagal menambah transaksi');
        }
    });

    window.deleteTransaction = async (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
            const res = await fetch(`${API_URL}/transactions/${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                if (totalItems === 1 && currentPage > 1) {
                    currentPage--;
                }
                fetchTransactions(currentPage, itemsPerPage);
                fetchSummary();
                fetchAndRenderDetails();
                populateFilters();
            } else {
                alert('Gagal menghapus transaksi');
            }
        }
    };

    // --- FUNGSI BARU UNTUK TOGGLE FORM ---
    toggleFormBtn.addEventListener('click', () => {
        if (formContainer.classList.contains('hidden')) {
            // Jika form sedang disembunyikan, tampilkan form
            formContainer.classList.remove('hidden');
            toggleFormBtn.textContent = '- Tutup Form';
            toggleFormBtn.classList.add('close');
        } else {
            // Jika form sedang ditampilkan, sembunyikan form
            formContainer.classList.add('hidden');
            toggleFormBtn.textContent = '+ Tambah Transaksi Baru';
            toggleFormBtn.classList.remove('close');
        }
    });

    const initializeApp = async () => {
        await fetchCategoriesForForm();
        await populateFilters();
        
        itemsPerPageSelect.value = itemsPerPage.toString();
        fetchTransactions(1, itemsPerPage);
        fetchSummary();
        fetchAndRenderDetails();
    };

    initializeApp();
    document.getElementById('date').value = new Date().toISOString().split('T')[0];
});
