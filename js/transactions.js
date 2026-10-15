/* Transactions page logic */

/**
 * Initialize transactions page
 */
function initTransactionsPage() {
    // Render transaction list
    renderTransactionList();

    // Setup event listeners
    setupTransactionListeners();
}

/**
 * Render the transaction list based on current filters and search
 */
const transactionFilters = { query: '', type: 'all', category: 'all', sort: 'date-desc', startDate: '', endDate: '' };

function renderTransactionList() {
    const transactions = storage.getTransactions();
    const transactionListContainer = document.getElementById('transactions-content');
    if (!transactionListContainer) return;

    const categories = [...new Set(transactions.map(transaction => transaction.category).filter(Boolean))].sort();
    const filteredTransactions = transactions.filter(transaction =>
        (!transactionFilters.query || `${transaction.description} ${transaction.notes || ''}`.toLowerCase().includes(transactionFilters.query.toLowerCase())) &&
        (transactionFilters.type === 'all' || transaction.type === transactionFilters.type) &&
        (transactionFilters.category === 'all' || transaction.category === transactionFilters.category) &&
        (!transactionFilters.startDate || utils.parseDate(transaction.date) >= utils.parseDate(transactionFilters.startDate)) &&
        (!transactionFilters.endDate || utils.parseDate(transaction.date) <= utils.parseDate(transactionFilters.endDate))
    );
    filteredTransactions.sort((a, b) => {
        if (transactionFilters.sort === 'amount-asc') return Number(a.amount) - Number(b.amount);
        if (transactionFilters.sort === 'amount-desc') return Number(b.amount) - Number(a.amount);
        if (transactionFilters.sort === 'description') return String(a.description).localeCompare(String(b.description));
        return utils.parseDate(b.date) - utils.parseDate(a.date);
    });

    const controls = `<div class="transaction-filters">
        <label>Search <input id="transactionSearch" type="search" value="${utils.escapeHtml(transactionFilters.query)}" placeholder="Search descriptions"></label>
        <label>Type <select id="transactionTypeFilter"><option value="all">All types</option><option value="income" ${transactionFilters.type === 'income' ? 'selected' : ''}>Income</option><option value="expense" ${transactionFilters.type === 'expense' ? 'selected' : ''}>Expense</option></select></label>
        <label>Category <select id="transactionCategoryFilter"><option value="all">All categories</option>${categories.map(category => `<option value="${utils.escapeHtml(category)}" ${transactionFilters.category === category ? 'selected' : ''}>${utils.escapeHtml(category)}</option>`).join('')}</select></label>
        <label>From <input id="transactionStartDate" type="date" value="${utils.escapeHtml(transactionFilters.startDate)}"></label>
        <label>To <input id="transactionEndDate" type="date" value="${utils.escapeHtml(transactionFilters.endDate)}"></label>
        <label>Sort <select id="transactionSort"><option value="date-desc" ${transactionFilters.sort === 'date-desc' ? 'selected' : ''}>Newest</option><option value="amount-desc" ${transactionFilters.sort === 'amount-desc' ? 'selected' : ''}>Amount: high to low</option><option value="amount-asc" ${transactionFilters.sort === 'amount-asc' ? 'selected' : ''}>Amount: low to high</option><option value="description" ${transactionFilters.sort === 'description' ? 'selected' : ''}>Description</option></select></label>
    </div>`;

    if (filteredTransactions.length === 0) {
        transactionListContainer.innerHTML = `
            ${controls}
            <div class="empty-state">
                <i data-lucide="credit-card"></i>
                <h2>${transactions.length ? 'No matching transactions' : 'No transactions yet'}</h2>
                <p>${transactions.length ? 'Try changing your search or filters.' : 'Start by adding your first transaction to see your spending habits.'}</p>
                ${transactions.length ? '' : '<button class="btn btn-primary" id="emptyQuickAddBtn">Add Transaction</button>'}
            </div>
        `;
        // Add event listener to the button in the empty state
        setupTransactionFilters(transactionListContainer);
        const quickAddBtn = transactionListContainer.querySelector('#emptyQuickAddBtn');
        if (quickAddBtn) {
            quickAddBtn.addEventListener('click', openQuickAddModal);
        }
        lucide.createIcons();
        return;
    }

    // Build transaction items HTML
    let html = '';
    filteredTransactions.forEach(transaction => {
        const transactionType = transaction.type === 'income' ? 'income' : 'expense';
        const amount = utils.formatPHP(parseFloat(transaction.amount));
        const date = utils.formatDate(utils.parseDate(transaction.date));
        html += `
            <div class="transaction-item ${transactionType}" data-id="${utils.escapeHtml(transaction.id)}">
                <div class="transaction-info">
                    <div class="transaction-description">${utils.escapeHtml(transaction.description)}</div>
                    <div class="transaction-category">${utils.escapeHtml(transaction.category)}</div>
                    <div class="transaction-date">${date}</div>
                </div>
                <div class="transaction-amount ${transactionType}">${amount}</div>
                <div class="transaction-actions">
                    <button class="btn btn-icon btn-edit" data-id="${utils.escapeHtml(transaction.id)}" title="Edit" aria-label="Edit ${utils.escapeHtml(transaction.description)}">
                        <i data-lucide="pencil"></i>
                    </button>
                    <button class="btn btn-icon btn-delete" data-id="${utils.escapeHtml(transaction.id)}" title="Delete" aria-label="Delete ${utils.escapeHtml(transaction.description)}">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>
        `;
    });

    transactionListContainer.innerHTML = `
        ${controls}
        <div class="transaction-list">
            ${html}
        </div>
    `;
    setupTransactionFilters(transactionListContainer);

    // Add event listeners to edit and delete buttons
    transactionListContainer.querySelectorAll('.btn-edit').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            openEditTransactionModal(id);
        });
    });

    transactionListContainer.querySelectorAll('.btn-delete').forEach(button => {
        button.addEventListener('click', async (e) => {
            const id = e.currentTarget.dataset.id;
            await deleteTransaction(id);
        });
    });

    // Update Lucide icons
    lucide.createIcons();
}

function setupTransactionFilters(container) {
    const update = event => {
        const control = event.currentTarget;
        const selectionStart = control.id === 'transactionSearch' ? control.selectionStart : null;
        if (control.id === 'transactionSearch') transactionFilters.query = control.value;
        if (control.id === 'transactionTypeFilter') transactionFilters.type = control.value;
        if (control.id === 'transactionCategoryFilter') transactionFilters.category = control.value;
        if (control.id === 'transactionSort') transactionFilters.sort = control.value;
        if (control.id === 'transactionStartDate') transactionFilters.startDate = control.value;
        if (control.id === 'transactionEndDate') transactionFilters.endDate = control.value;
        renderTransactionList();
        const replacement = document.getElementById(control.id);
        replacement?.focus();
        if (selectionStart !== null && replacement?.setSelectionRange) replacement.setSelectionRange(selectionStart, selectionStart);
    };
    container.querySelector('#transactionSearch')?.addEventListener('input', utils.debounce(update, 120));
    ['#transactionTypeFilter', '#transactionCategoryFilter', '#transactionSort', '#transactionStartDate', '#transactionEndDate'].forEach(selector => container.querySelector(selector)?.addEventListener('change', update));
}

/**
 * Setup event listeners for transactions page
 */
function setupTransactionListeners() {
    // Quick add button in header
    const quickAddBtn = document.getElementById('quickAddBtn');
    if (quickAddBtn) {
        quickAddBtn.addEventListener('click', openQuickAddModal);
    }

    // Search and filter inputs (if present)
    // We'll implement these later
}

/**
 * Open quick-add transaction modal
 */
function openQuickAddModal() {
    const modalContent = `
        <form id="transactionForm">
            <div class="form-group">
                <label for="transactionType">Type</label>
                <select id="transactionType" required>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                </select>
            </div>

            <div class="form-group">
                <label for="transactionDescription">Description</label>
                <input type="text" id="transactionDescription" placeholder="Enter description" required>
            </div>

            <div class="form-group">
                <label for="transactionAmount">Amount (₱)</label>
                <input type="number" id="transactionAmount" min="0.01" step="0.01" placeholder="Enter amount" required>
            </div>

            <div class="form-group">
                <label for="transactionCategory">Category</label>
                <select id="transactionCategory" required>
                    <option value="">Select category</option>
                    <option value="Allowance">Allowance</option>
                    <option value="Part-time Job">Part-time Job</option>
                    <option value="Food & Drinks">Food & Drinks</option>
                    <option value="Transportation">Transportation</option>
                    <option value="School Expenses">School Expenses</option>
                    <option value="Bills & Utilities">Bills & Utilities</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Health & Wellness">Health & Wellness</option>
                    <option value="Other">Other</option>
                </select>
            </div>

            <div class="form-group custom-category-group" id="customTransactionCategoryGroup" hidden>
                <label for="customTransactionCategory">Specify category</label>
                <input type="text" id="customTransactionCategory" maxlength="40" placeholder="Enter category" autocomplete="off">
            </div>

            <div class="form-group">
                <label for="transactionDate">Date</label>
                <input type="date" id="transactionDate" required>
            </div>

            <div class="form-group">
                <label for="transactionPaymentMethod">Payment Method</label>
                <select id="transactionPaymentMethod" required>
                    <option value="">Select payment method</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank transfer">Bank transfer</option>
                    <option value="E-wallet">E-wallet</option>
                    <option value="Credit/Debit Card">Credit/Debit Card</option>
                    <option value="Check">Check</option>
                    <option value="Other">Other</option>
                </select>
            </div>

            <div class="form-group">
                <label for="transactionNotes">Notes</label>
                <textarea id="transactionNotes" rows="3" placeholder="Enter any additional notes"></textarea>
            </div>
        </form>
    `;

    const buttons = [
        {
            text: 'Cancel',
            class: 'btn-outline',
            callback: () => { modal.close(); }
        },
        {
            text: 'Save Transaction',
            class: 'btn-primary',
            isPrimary: true,
            callback: () => {
                // Get form values
                const type = document.getElementById('transactionType').value;
                const description = document.getElementById('transactionDescription').value.trim();
                const amount = parseFloat(document.getElementById('transactionAmount').value);
                const selectedCategory = document.getElementById('transactionCategory').value;
                const customCategory = document.getElementById('customTransactionCategory').value.trim();
                const category = selectedCategory === 'Other' ? customCategory : selectedCategory;
                const date = document.getElementById('transactionDate').value;
                const paymentMethod = document.getElementById('transactionPaymentMethod').value;
                const notes = document.getElementById('transactionNotes').value.trim();

                // Validate
                if (!description) {
                    utils.showToast({ message: 'Please enter a description', type: 'error' });
                    return;
                }

                if (!Number.isFinite(amount) || amount <= 0) {
                    utils.showToast({ message: 'Please enter a valid amount', type: 'error' });
                    return;
                }

                if (!category) {
                    utils.showToast({ message: selectedCategory === 'Other' ? 'Please enter the category name' : 'Please select a category', type: 'error' });
                    return;
                }

                if (!date) {
                    utils.showToast({ message: 'Please select a date', type: 'error' });
                    return;
                }

                if (!paymentMethod) {
                    utils.showToast({ message: 'Please select a payment method', type: 'error' });
                    return;
                }

                // Create transaction object
                const transactionData = {
                    type,
                    description,
                    amount,
                    category,
                    date,
                    paymentMethod,
                    notes
                };

                // Save transaction
                const savedTransaction = storage.addTransaction(transactionData);

                if (savedTransaction) {
                    utils.showToast({ message: 'Transaction saved successfully', type: 'success' });
                    modal.close();
                    // Update transaction list
                    renderTransactionList();
                    // Update dashboard if we're on overview page
                    if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/')) {
                        // Dispatch event to update dashboard
                        document.dispatchEvent(new CustomEvent('transactions:updated'));
                    }
                } else {
                    utils.showToast({ message: 'Failed to save transaction', type: 'error' });
                }
            }
        }
    ];

    const modal = utils.showModal({
        title: 'Add Transaction',
        content: modalContent,
        buttons: buttons
    });

    const categorySelect = modal.container.querySelector('#transactionCategory');
    const customCategoryGroup = modal.container.querySelector('#customTransactionCategoryGroup');
    categorySelect.addEventListener('change', () => {
        customCategoryGroup.hidden = categorySelect.value !== 'Other';
        if (categorySelect.value === 'Other') modal.container.querySelector('#customTransactionCategory').focus();
    });

    // Set today's date as default
    setTimeout(() => {
        const dateInput = document.getElementById('transactionDate');
        if (dateInput) {
            dateInput.value = utils.getCurrentDate();
        }

        // Focus on description field
        const descInput = document.getElementById('transactionDescription');
        if (descInput) {
            descInput.focus();
        }
    }, 100);
}

/**
 * Open edit transaction modal
 * @param {string} id - Transaction ID to edit
 */
function openEditTransactionModal(id) {
    // Get the transaction to edit
    const transactions = storage.getTransactions();
    const transaction = transactions.find(t => t.id === id);

    if (!transaction) {
        utils.showToast({ message: 'Transaction not found', type: 'error' });
        return;
    }

    const modalContent = `
        <form id="editTransactionForm">
            <div class="form-group">
                <label for="editTransactionType">Type</label>
                <select id="editTransactionType" required>
                    <option value="income" ${transaction.type === 'income' ? 'selected' : ''}>Income</option>
                    <option value="expense" ${transaction.type === 'expense' ? 'selected' : ''}>Expense</option>
                </select>
            </div>

            <div class="form-group">
                <label for="editTransactionDescription">Description</label>
                <input type="text" id="editTransactionDescription" value="${utils.escapeHtml(transaction.description)}" required>
            </div>

            <div class="form-group">
                <label for="editTransactionAmount">Amount (₱)</label>
                <input type="number" id="editTransactionAmount" value="${parseFloat(transaction.amount)}" min="0.01" step="0.01" required>
            </div>

            <div class="form-group">
                <label for="editTransactionCategory">Category</label>
                <select id="editTransactionCategory" required>
                    <option value="">Select category</option>
                    <option value="Allowance" ${transaction.category === 'Allowance' ? 'selected' : ''}>Allowance</option>
                    <option value="Part-time Job" ${transaction.category === 'Part-time Job' ? 'selected' : ''}>Part-time Job</option>
                    <option value="Food & Drinks" ${transaction.category === 'Food & Drinks' ? 'selected' : ''}>Food & Drinks</option>
                    <option value="Transportation" ${transaction.category === 'Transportation' ? 'selected' : ''}>Transportation</option>
                    <option value="School Expenses" ${transaction.category === 'School Expenses' ? 'selected' : ''}>School Expenses</option>
                    <option value="Bills & Utilities" ${transaction.category === 'Bills & Utilities' ? 'selected' : ''}>Bills & Utilities</option>
                    <option value="Entertainment" ${transaction.category === 'Entertainment' ? 'selected' : ''}>Entertainment</option>
                    <option value="Shopping" ${transaction.category === 'Shopping' ? 'selected' : ''}>Shopping</option>
                    <option value="Health & Wellness" ${transaction.category === 'Health & Wellness' ? 'selected' : ''}>Health & Wellness</option>
                    <option value="Other" ${transaction.category === 'Other' || !['Allowance', 'Part-time Job', 'Food & Drinks', 'Transportation', 'School Expenses', 'Bills & Utilities', 'Entertainment', 'Shopping', 'Health & Wellness'].includes(transaction.category) ? 'selected' : ''}>Other</option>
                </select>
            </div>

            <div class="form-group custom-category-group" id="editCustomTransactionCategoryGroup" ${transaction.category === 'Other' || ['Allowance', 'Part-time Job', 'Food & Drinks', 'Transportation', 'School Expenses', 'Bills & Utilities', 'Entertainment', 'Shopping', 'Health & Wellness'].includes(transaction.category) ? 'hidden' : ''}>
                <label for="editCustomTransactionCategory">Specify category</label>
                <input type="text" id="editCustomTransactionCategory" maxlength="40" placeholder="Enter category" autocomplete="off" value="${transaction.category === 'Other' || ['Allowance', 'Part-time Job', 'Food & Drinks', 'Transportation', 'School Expenses', 'Bills & Utilities', 'Entertainment', 'Shopping', 'Health & Wellness'].includes(transaction.category) ? '' : utils.escapeHtml(transaction.category)}">
            </div>

            <div class="form-group">
                <label for="editTransactionDate">Date</label>
                <input type="date" id="editTransactionDate" value="${transaction.date}" required>
            </div>

            <div class="form-group">
                <label for="editTransactionPaymentMethod">Payment Method</label>
                <select id="editTransactionPaymentMethod" required>
                    <option value="">Select payment method</option>
                    <option value="Cash" ${transaction.paymentMethod === 'Cash' ? 'selected' : ''}>Cash</option>
                    <option value="Bank transfer" ${transaction.paymentMethod === 'Bank transfer' ? 'selected' : ''}>Bank transfer</option>
                    <option value="E-wallet" ${transaction.paymentMethod === 'E-wallet' ? 'selected' : ''}>E-wallet</option>
                    <option value="Credit/Debit Card" ${transaction.paymentMethod === 'Credit/Debit Card' ? 'selected' : ''}>Credit/Debit Card</option>
                    <option value="Check" ${transaction.paymentMethod === 'Check' ? 'selected' : ''}>Check</option>
                    <option value="Other" ${transaction.paymentMethod === 'Other' ? 'selected' : ''}>Other</option>
                </select>
            </div>

            <div class="form-group">
                <label for="editTransactionNotes">Notes</label>
                <textarea id="editTransactionNotes" rows="3">${utils.escapeHtml(transaction.notes)}</textarea>
            </div>
        </form>
    `;

    const buttons = [
        {
            text: 'Cancel',
            class: 'btn-outline',
            callback: () => { modal.close(); }
        },
        {
            text: 'Update Transaction',
            class: 'btn-primary',
            isPrimary: true,
            callback: () => {
                // Get form values
                const type = document.getElementById('editTransactionType').value;
                const description = document.getElementById('editTransactionDescription').value.trim();
                const amount = parseFloat(document.getElementById('editTransactionAmount').value);
                const selectedCategory = document.getElementById('editTransactionCategory').value;
                const customCategory = document.getElementById('editCustomTransactionCategory').value.trim();
                const category = selectedCategory === 'Other' ? customCategory : selectedCategory;
                const date = document.getElementById('editTransactionDate').value;
                const paymentMethod = document.getElementById('editTransactionPaymentMethod').value;
                const notes = document.getElementById('editTransactionNotes').value.trim();

                // Validate
                if (!description) {
                    utils.showToast({ message: 'Please enter a description', type: 'error' });
                    return;
                }

                if (!Number.isFinite(amount) || amount <= 0) {
                    utils.showToast({ message: 'Please enter a valid amount', type: 'error' });
                    return;
                }

                if (!category) {
                    utils.showToast({ message: selectedCategory === 'Other' ? 'Please enter the category name' : 'Please select a category', type: 'error' });
                    return;
                }

                if (!date) {
                    utils.showToast({ message: 'Please select a date', type: 'error' });
                    return;
                }

                if (!paymentMethod) {
                    utils.showToast({ message: 'Please select a payment method', type: 'error' });
                    return;
                }

                // Create transaction updates object
                const transactionUpdates = {
                    type,
                    description,
                    amount,
                    category,
                    date,
                    paymentMethod,
                    notes,
                    updatedAt: new Date().toISOString()
                };

                // Update transaction
                const success = storage.updateTransaction(id, transactionUpdates);

                if (success) {
                    utils.showToast({ message: 'Transaction updated successfully', type: 'success' });
                    modal.close();
                    // Update transaction list
                    renderTransactionList();
                    // Update dashboard if we're on overview page
                    if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/')) {
                        // Dispatch event to update dashboard
                        document.dispatchEvent(new CustomEvent('transactions:updated'));
                    }
                } else {
                    utils.showToast({ message: 'Failed to update transaction', type: 'error' });
                }
            }
        }
    ];

    const modal = utils.showModal({
        title: 'Edit Transaction',
        content: modalContent,
        buttons: buttons
    });

    const categorySelect = modal.container.querySelector('#editTransactionCategory');
    const customCategoryGroup = modal.container.querySelector('#editCustomTransactionCategoryGroup');
    categorySelect.addEventListener('change', () => {
        customCategoryGroup.hidden = categorySelect.value !== 'Other';
        if (categorySelect.value === 'Other') modal.container.querySelector('#editCustomTransactionCategory').focus();
    });

    // Focus on description field
    setTimeout(() => {
        const descInput = document.getElementById('editTransactionDescription');
        if (descInput) {
            descInput.focus();
        }
    }, 100);
}

/**
 * Delete a transaction
 * @param {string} id - Transaction ID to delete
 */
async function deleteTransaction(id) {
    const confirmed = await utils.confirmAction('Are you sure you want to delete this transaction?');
    if (!confirmed) {
        return;
    }

    const success = storage.deleteTransaction(id);
    if (success) {
        utils.showToast({ message: 'Transaction deleted successfully', type: 'success' });
        renderTransactionList(); // Re-render the list
        // Also update dashboard if we're on the overview page
        if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/')) {
            // Dispatch an event to update the dashboard
            document.dispatchEvent(new CustomEvent('transactions:updated'));
        }
    } else {
        utils.showToast({ message: 'Failed to delete transaction', type: 'error' });
    }
}

// Export functions for use in other modules (if needed)
window.transactions = {
    initTransactionsPage,
    renderTransactionList,
    openQuickAddModal,
    openEditTransactionModal,
    deleteTransaction
};

// Initialize the page when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTransactionsPage);
} else {
    initTransactionsPage();
}
