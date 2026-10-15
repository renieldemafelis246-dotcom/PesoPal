/* Budgets page logic */

/**
 * Initialize budgets page
 */
function initBudgetsPage() {
    // Render budget list
    renderBudgetList();

    // Setup event listeners
    setupBudgetListeners();
}

/**
 * Render the budget list
 */
function renderBudgetList() {
    const budgets = storage.getBudgets();
    const transactions = storage.getTransactions();
    const budgetsContainer = document.getElementById('budgets-content');
    if (!budgetsContainer) return;

    if (budgets.length === 0) {
        budgetsContainer.innerHTML = `
            <div class="empty-state">
                <i data-lucide="pie-chart"></i>
                <h2>No budgets yet</h2>
                <p>Create your first budget to start tracking your spending limits.</p>
                <button class="btn btn-primary" id="addBudgetBtn">Add Budget</button>
            </div>
        `;
        const addBudgetBtn = budgetsContainer.querySelector('#addBudgetBtn');
        if (addBudgetBtn) {
            addBudgetBtn.addEventListener('click', openAddBudgetModal);
        }
        lucide.createIcons();
        return;
    }

    // Sort budgets by name
    const sortedBudgets = [...budgets].sort((a, b) => a.name.localeCompare(b.name));

    // Build budget items HTML
    let html = '';
    sortedBudgets.forEach(budget => {
        const usage = calculations.calculateBudgetUsage(transactions, budget);
        const percentage = usage.percentage;
        let progressClass = '';
        if (percentage >= 100) progressClass = 'error';
        else if (percentage >= 75) progressClass = 'warning';
        const progressWidth = Math.max(0, Math.min(100, percentage));

        html += `
            <div class="budget-card" data-id="${utils.escapeHtml(budget.id)}">
                <div class="budget-header">
                    <div class="budget-title-group">
                        <span class="budget-icon"><i data-lucide="wallet"></i></span>
                        <div><h3>${utils.escapeHtml(budget.name)}</h3><span class="budget-caption">Spending plan</span></div>
                    </div>
                    <span class="budget-category">${utils.escapeHtml(budget.category)}</span>
                </div>
                <div class="budget-details">
                    <div class="budget-stat budget-amount">
                        <span class="budget-stat-label">Budget limit</span>
                        <strong>${utils.formatPHP(budget.amount)}</strong>
                    </div>
                    <div class="budget-stat budget-spent">
                        <span class="budget-stat-label">Spent so far</span>
                        <strong>${utils.formatPHP(usage.spent)}</strong>
                    </div>
                    <div class="budget-stat budget-remaining">
                        <span class="budget-stat-label">Remaining</span>
                        <strong>${utils.formatPHP(usage.remaining)}</strong>
                    </div>
                </div>
                <div class="progress-container">
                    <div class="progress-bar ${progressClass}" style="width: ${progressWidth}%"></div>
                </div>
                <div class="budget-footer">
                    <span class="budget-progress-label"><strong>${percentage.toFixed(1)}%</strong> of budget used</span>
                    <div class="budget-actions">
                        <button class="btn btn-icon btn-edit" data-id="${utils.escapeHtml(budget.id)}" title="Edit" aria-label="Edit ${utils.escapeHtml(budget.name)}">
                            <i data-lucide="pencil"></i>
                        </button>
                        <button class="btn btn-icon btn-delete" data-id="${utils.escapeHtml(budget.id)}" title="Delete" aria-label="Delete ${utils.escapeHtml(budget.name)}">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });

    budgetsContainer.innerHTML = `<div class="budget-list">${html}</div>`;

    // Add event listeners to edit and delete buttons
    budgetsContainer.querySelectorAll('.btn-edit').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            openEditBudgetModal(id);
        });
    });

    budgetsContainer.querySelectorAll('.btn-delete').forEach(button => {
        button.addEventListener('click', async (e) => {
            const id = e.currentTarget.dataset.id;
            await deleteBudget(id);
        });
    });

    // Update Lucide icons
    lucide.createIcons();
}

/**
 * Setup event listeners for budgets page
 */
function setupBudgetListeners() {
    const addBudgetBtn = document.getElementById('addBudgetBtn');
    if (addBudgetBtn) {
        addBudgetBtn.addEventListener('click', openAddBudgetModal);
    }
}

/**
 * Open add budget modal
 */
function openAddBudgetModal() {
    const modalContent = `
        <form id="budgetForm">
            <div class="form-group">
                <label for="budgetName">Budget Name</label>
                <input type="text" id="budgetName" placeholder="Enter budget name" required>
            </div>

            <div class="form-group">
                <label for="budgetCategory">Category</label>
                <select id="budgetCategory" required>
                    <option value="">Select category</option>
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

            <div class="form-group">
                <label for="budgetAmount">Amount (₱)</label>
                <input type="number" id="budgetAmount" min="0.01" step="0.01" placeholder="Enter budget amount" required>
            </div>

            <div class="form-group">
                <label for="budgetStartDate">Start Date</label>
                <input type="date" id="budgetStartDate" required>
            </div>

            <div class="form-group">
                <label for="budgetEndDate">End Date</label>
                <input type="date" id="budgetEndDate" required>
            </div>

            <div class="form-group">
                <label for="budgetDescription">Description</label>
                <textarea id="budgetDescription" rows="3" placeholder="Enter budget description"></textarea>
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
            text: 'Add Budget',
            class: 'btn-primary',
            isPrimary: true,
            callback: () => {
                // Get form values
                const name = document.getElementById('budgetName').value.trim();
                const category = document.getElementById('budgetCategory').value;
                const amount = parseFloat(document.getElementById('budgetAmount').value);
                const startDate = document.getElementById('budgetStartDate').value;
                const endDate = document.getElementById('budgetEndDate').value;
                const description = document.getElementById('budgetDescription').value.trim();

                // Validate
                if (!name) {
                    utils.showToast({ message: 'Please enter a budget name', type: 'error' });
                    return;
                }

                if (!category) {
                    utils.showToast({ message: 'Please select a category', type: 'error' });
                    return;
                }

                if (!Number.isFinite(amount) || amount <= 0) {
                    utils.showToast({ message: 'Please enter a valid amount', type: 'error' });
                    return;
                }

                if (!startDate) {
                    utils.showToast({ message: 'Please select a start date', type: 'error' });
                    return;
                }

                if (!endDate) {
                    utils.showToast({ message: 'Please select an end date', type: 'error' });
                    return;
                }

                if (new Date(endDate) < new Date(startDate)) {
                    utils.showToast({ message: 'End date must be after start date', type: 'error' });
                    return;
                }

                // Create budget object
                const budgetData = {
                    name,
                    category,
                    amount,
                    startDate,
                    endDate,
                    description
                };

                // Save budget
                const savedBudget = storage.addBudget(budgetData);

                if (savedBudget) {
                    utils.showToast({ message: 'Budget added successfully', type: 'success' });
                    modal.close();
                    // Update budget list
                    renderBudgetList();
                    // Update dashboard if we're on overview page
                    if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/')) {
                        // Dispatch event to update dashboard
                        document.dispatchEvent(new CustomEvent('budgets:updated'));
                    }
                } else {
                    utils.showToast({ message: 'Failed to add budget', type: 'error' });
                }
            }
        }
    ];

    const modal = utils.showModal({
        title: 'Add Budget',
        content: modalContent,
        buttons: buttons
    });

    // Set default dates (first day of current month to last day of current month)
    setTimeout(() => {
        const startDateInput = document.getElementById('budgetStartDate');
        const endDateInput = document.getElementById('budgetEndDate');
        if (startDateInput && endDateInput) {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

            startDateInput.value = utils.getDateInputValue(startOfMonth);
            endDateInput.value = utils.getDateInputValue(endOfMonth);
        }

        // Focus on name field
        const nameInput = document.getElementById('budgetName');
        if (nameInput) {
            nameInput.focus();
        }
    }, 100);
}

/**
 * Open edit budget modal
 * @param {string} id - Budget ID to edit
 */
function openEditBudgetModal(id) {
    // Get the budget to edit
    const budgets = storage.getBudgets();
    const budget = budgets.find(b => b.id === id);

    if (!budget) {
        utils.showToast({ message: 'Budget not found', type: 'error' });
        return;
    }

    const modalContent = `
        <form id="editBudgetForm">
            <div class="form-group">
                <label for="editBudgetName">Budget Name</label>
                <input type="text" id="editBudgetName" value="${utils.escapeHtml(budget.name)}" required>
            </div>

            <div class="form-group">
                <label for="editBudgetCategory">Category</label>
                <select id="editBudgetCategory" required>
                    <option value="">Select category</option>
                    <option value="Food & Drinks" ${budget.category === 'Food & Drinks' ? 'selected' : ''}>Food & Drinks</option>
                    <option value="Transportation" ${budget.category === 'Transportation' ? 'selected' : ''}>Transportation</option>
                    <option value="School Expenses" ${budget.category === 'School Expenses' ? 'selected' : ''}>School Expenses</option>
                    <option value="Bills & Utilities" ${budget.category === 'Bills & Utilities' ? 'selected' : ''}>Bills & Utilities</option>
                    <option value="Entertainment" ${budget.category === 'Entertainment' ? 'selected' : ''}>Entertainment</option>
                    <option value="Shopping" ${budget.category === 'Shopping' ? 'selected' : ''}>Shopping</option>
                    <option value="Health & Wellness" ${budget.category === 'Health & Wellness' ? 'selected' : ''}>Health & Wellness</option>
                    <option value="Other" ${budget.category === 'Other' ? 'selected' : ''}>Other</option>
                </select>
            </div>

            <div class="form-group">
                <label for="editBudgetAmount">Amount (₱)</label>
                <input type="number" id="editBudgetAmount" value="${parseFloat(budget.amount)}" min="0.01" step="0.01" required>
            </div>

            <div class="form-group">
                <label for="editBudgetStartDate">Start Date</label>
                <input type="date" id="editBudgetStartDate" value="${budget.startDate}" required>
            </div>

            <div class="form-group">
                <label for="editBudgetEndDate">End Date</label>
                <input type="date" id="editBudgetEndDate" value="${budget.endDate}" required>
            </div>

            <div class="form-group">
                <label for="editBudgetDescription">Description</label>
                <textarea id="editBudgetDescription" rows="3">${utils.escapeHtml(budget.description)}</textarea>
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
            text: 'Update Budget',
            class: 'btn-primary',
            isPrimary: true,
            callback: () => {
                // Get form values
                const name = document.getElementById('editBudgetName').value.trim();
                const category = document.getElementById('editBudgetCategory').value;
                const amount = parseFloat(document.getElementById('editBudgetAmount').value);
                const startDate = document.getElementById('editBudgetStartDate').value;
                const endDate = document.getElementById('editBudgetEndDate').value;
                const description = document.getElementById('editBudgetDescription').value.trim();

                // Validate
                if (!name) {
                    utils.showToast({ message: 'Please enter a budget name', type: 'error' });
                    return;
                }

                if (!category) {
                    utils.showToast({ message: 'Please select a category', type: 'error' });
                    return;
                }

                if (!Number.isFinite(amount) || amount <= 0) {
                    utils.showToast({ message: 'Please enter a valid amount', type: 'error' });
                    return;
                }

                if (!startDate) {
                    utils.showToast({ message: 'Please select a start date', type: 'error' });
                    return;
                }

                if (!endDate) {
                    utils.showToast({ message: 'Please select an end date', type: 'error' });
                    return;
                }

                if (new Date(endDate) < new Date(startDate)) {
                    utils.showToast({ message: 'End date must be after start date', type: 'error' });
                    return;
                }

                // Create budget updates object
                const budgetUpdates = {
                    name,
                    category,
                    amount,
                    startDate,
                    endDate,
                    description
                };

                // Update budget
                const success = storage.updateBudget(id, budgetUpdates);

                if (success) {
                    utils.showToast({ message: 'Budget updated successfully', type: 'success' });
                    modal.close();
                    // Update budget list
                    renderBudgetList();
                    // Update dashboard if we're on overview page
                    if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/')) {
                        // Dispatch event to update dashboard
                        document.dispatchEvent(new CustomEvent('budgets:updated'));
                    }
                } else {
                    utils.showToast({ message: 'Failed to update budget', type: 'error' });
                }
            }
        }
    ];

    const modal = utils.showModal({
        title: 'Edit Budget',
        content: modalContent,
        buttons: buttons
    });

    // Focus on name field
    setTimeout(() => {
        const nameInput = document.getElementById('editBudgetName');
        if (nameInput) {
            nameInput.focus();
        }
    }, 100);
}

/**
 * Delete a budget
 * @param {string} id - Budget ID to delete
 */
async function deleteBudget(id) {
    const confirmed = await utils.confirmAction('Are you sure you want to delete this budget?');
    if (!confirmed) {
        return;
    }

    const success = storage.deleteBudget(id);
    if (success) {
        utils.showToast({ message: 'Budget deleted successfully', type: 'success' });
        renderBudgetList();
        // Update dashboard if needed
        document.dispatchEvent(new CustomEvent('budgets:updated'));
    } else {
        utils.showToast({ message: 'Failed to delete budget', type: 'error' });
    }
}

// Export functions for use in other modules (if needed)
window.budgets = {
    initBudgetsPage,
    renderBudgetList,
    openAddBudgetModal,
    openEditBudgetModal,
    deleteBudget
};

// Initialize the page when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBudgetsPage);
} else {
    initBudgetsPage();
}
