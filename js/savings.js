/* Savings goals page logic */

/**
 * Initialize savings goals page
 */
function initSavingsPage() {
    // Render savings goals list
    renderSavingsList();

    // Setup event listeners
    setupSavingsListeners();
}

/**
 * Render the savings goals list
 */
function renderSavingsList() {
    const goals = storage.getSavingsGoals();
    const savingsContainer = document.getElementById('savings-content');
    if (!savingsContainer) return;

    if (goals.length === 0) {
        savingsContainer.innerHTML = `
            <div class="empty-state">
                <i data-lucide="piggy-bank"></i>
                <h2>No savings goals yet</h2>
                <p>Set your first savings goal to start tracking your progress.</p>
                <button class="btn btn-primary" id="addGoalBtn">Add Goal</button>
            </div>
        `;
        const addGoalBtn = savingsContainer.querySelector('#addGoalBtn');
        if (addGoalBtn) {
            addGoalBtn.addEventListener('click', openAddSavingsGoalModal);
        }
        lucide.createIcons();
        return;
    }

    // Sort goals by name
    const sortedGoals = [...goals].sort((a, b) => a.name.localeCompare(b.name));

    // Build savings goal items HTML
    let html = '';
    sortedGoals.forEach(goal => {
        const progress = calculations.calculateSavingsProgress(goal);
        const percentage = progress.percentage;
        const progressClass = percentage >= 100 ? 'complete' : percentage >= 75 ? 'warning' : '';
        const progressWidth = Math.max(0, Math.min(100, percentage));

        html += `
            <div class="savings-card" data-id="${utils.escapeHtml(goal.id)}">
                <div class="savings-header">
                    <h3>${utils.escapeHtml(goal.name)}</h3>
                    ${goal.targetDate ? `<span class="goal-date">${utils.formatDate(utils.parseDate(goal.targetDate))}</span>` : ''}
                </div>
                <div class="savings-details">
                    <div class="savings-target">
                        <span>Target:</span>
                        <span>${utils.formatPHP(goal.targetAmount)}</span>
                    </div>
                    <div class="savings-saved">
                        <span>Saved:</span>
                        <span>${utils.formatPHP(goal.savedAmount)}</span>
                    </div>
                    <div class="savings-remaining">
                        <span>Remaining:</span>
                        <span>${utils.formatPHP(progress.remaining)}</span>
                    </div>
                    ${Array.isArray(goal.contributions) && goal.contributions.length ? `<details class="goal-contributions"><summary>Contributions (${goal.contributions.length})</summary><ul>${goal.contributions.slice().reverse().map(item => `<li>${utils.formatDate(utils.parseDate(item.date))} · ${utils.formatPHP(item.amount)}${item.description ? ` · ${utils.escapeHtml(item.description)}` : ''}</li>`).join('')}</ul></details>` : ''}
                </div>
                <div class="progress-container">
                    <div class="progress-bar ${progressClass}" style="width: ${progressWidth}%"></div>
                </div>
                <div class="savings-footer">
                    <span>${percentage.toFixed(1)}% saved</span>
                    <div class="savings-actions">
                        <button class="btn btn-icon btn-edit" data-id="${utils.escapeHtml(goal.id)}" title="Edit" aria-label="Edit ${utils.escapeHtml(goal.name)}">
                            <i data-lucide="pencil"></i>
                        </button>
                        <button class="btn btn-icon btn-add" data-id="${utils.escapeHtml(goal.id)}" title="Add Savings" aria-label="Add savings to ${utils.escapeHtml(goal.name)}">
                            <i data-lucide="plus-circle"></i>
                        </button>
                        <button class="btn btn-icon btn-delete" data-id="${utils.escapeHtml(goal.id)}" title="Delete" aria-label="Delete ${utils.escapeHtml(goal.name)}">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });

    savingsContainer.innerHTML = `<div class="savings-list">${html}</div>`;

    // Add event listeners to edit, add savings, and delete buttons
    savingsContainer.querySelectorAll('.btn-edit').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            openEditSavingsGoalModal(id);
        });
    });

    savingsContainer.querySelectorAll('.btn-add').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            openAddSavingsModal(id);
        });
    });

    savingsContainer.querySelectorAll('.btn-delete').forEach(button => {
        button.addEventListener('click', async (e) => {
            const id = e.currentTarget.dataset.id;
            await deleteSavingsGoal(id);
        });
    });

    // Update Lucide icons
    lucide.createIcons();
}

/**
 * Setup event listeners for savings page
 */
function setupSavingsListeners() {
    const addGoalBtn = document.getElementById('addGoalBtn');
    if (addGoalBtn) {
        addGoalBtn.addEventListener('click', openAddSavingsGoalModal);
    }
}

/**
 * Open add savings goal modal
 */
function openAddSavingsGoalModal() {
    const modalContent = `
        <form id="savingsGoalForm">
            <div class="form-group">
                <label for="goalName">Goal Name</label>
                <input type="text" id="goalName" placeholder="Enter goal name" required>
            </div>

            <div class="form-group">
                <label for="goalTargetAmount">Target Amount (₱)</label>
                <input type="number" id="goalTargetAmount" min="0.01" step="0.01" placeholder="Enter target amount" required>
            </div>

            <div class="form-group">
                <label for="goalTargetDate">Target Date (Optional)</label>
                <input type="date" id="goalTargetDate">
            </div>

            <div class="form-group">
                <label for="goalDescription">Description</label>
                <textarea id="goalDescription" rows="3" placeholder="Enter goal description"></textarea>
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
            text: 'Add Goal',
            class: 'btn-primary',
            isPrimary: true,
            callback: () => {
                // Get form values
                const name = document.getElementById('goalName').value.trim();
                const targetAmount = parseFloat(document.getElementById('goalTargetAmount').value);
                const targetDate = document.getElementById('goalTargetDate').value;
                const description = document.getElementById('goalDescription').value.trim();

                // Validate
                if (!name) {
                    utils.showToast({ message: 'Please enter a goal name', type: 'error' });
                    return;
                }

                if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
                    utils.showToast({ message: 'Please enter a valid target amount', type: 'error' });
                    return;
                }

                // Create savings goal object
                const goalData = {
                    name,
                    targetAmount,
                    savedAmount: 0, // Start with 0 saved
                    contributions: [],
                    targetDate: targetDate || null,
                    description
                };

                // Save savings goal
                const savedGoal = storage.addSavingsGoal(goalData);

                if (savedGoal) {
                    utils.showToast({ message: 'Savings goal added successfully', type: 'success' });
                    modal.close();
                    // Update savings goals list
                    renderSavingsList();
                    // Update dashboard if we're on overview page
                    if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/')) {
                        // Dispatch event to update dashboard
                        document.dispatchEvent(new CustomEvent('savings:updated'));
                    }
                } else {
                    utils.showToast({ message: 'Failed to add savings goal', type: 'error' });
                }
            }
        }
    ];

    const modal = utils.showModal({
        title: 'Add Savings Goal',
        content: modalContent,
        buttons: buttons
    });

    // Focus on name field
    setTimeout(() => {
        const nameInput = document.getElementById('goalName');
        if (nameInput) {
            nameInput.focus();
        }
    }, 100);
}

/**
 * Open edit savings goal modal
 * @param {string} id - Savings goal ID to edit
 */
function openEditSavingsGoalModal(id) {
    // Get the savings goal to edit
    const goals = storage.getSavingsGoals();
    const goal = goals.find(g => g.id === id);

    if (!goal) {
        utils.showToast({ message: 'Savings goal not found', type: 'error' });
        return;
    }

    const modalContent = `
        <form id="editSavingsGoalForm">
            <div class="form-group">
                <label for="editGoalName">Goal Name</label>
                <input type="text" id="editGoalName" value="${utils.escapeHtml(goal.name)}" required>
            </div>

            <div class="form-group">
                <label for="editGoalTargetAmount">Target Amount (₱)</label>
                <input type="number" id="editGoalTargetAmount" value="${parseFloat(goal.targetAmount)}" min="0.01" step="0.01" required>
            </div>

            <div class="form-group">
                <label for="editGoalTargetDate">Target Date (Optional)</label>
                <input type="date" id="editGoalTargetDate" value="${goal.targetDate || ''}">
            </div>

            <div class="form-group">
                <label for="editGoalDescription">Description</label>
                <textarea id="editGoalDescription" rows="3">${utils.escapeHtml(goal.description)}</textarea>
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
            text: 'Update Goal',
            class: 'btn-primary',
            isPrimary: true,
            callback: () => {
                // Get form values
                const name = document.getElementById('editGoalName').value.trim();
                const targetAmount = parseFloat(document.getElementById('editGoalTargetAmount').value);
                const targetDate = document.getElementById('editGoalTargetDate').value;
                const description = document.getElementById('editGoalDescription').value.trim();

                // Validate
                if (!name) {
                    utils.showToast({ message: 'Please enter a goal name', type: 'error' });
                    return;
                }

                if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
                    utils.showToast({ message: 'Please enter a valid target amount', type: 'error' });
                    return;
                }

                // Create savings goal updates object
                const goalUpdates = {
                    name,
                    targetAmount,
                    targetDate: targetDate || null,
                    description
                };

                // Update savings goal
                const success = storage.updateSavingsGoal(id, goalUpdates);

                if (success) {
                    utils.showToast({ message: 'Savings goal updated successfully', type: 'success' });
                    modal.close();
                    // Update savings goals list
                    renderSavingsList();
                    // Update dashboard if we're on overview page
                    if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/')) {
                        // Dispatch event to update dashboard
                        document.dispatchEvent(new CustomEvent('savings:updated'));
                    }
                } else {
                    utils.showToast({ message: 'Failed to update savings goal', type: 'error' });
                }
            }
        }
    ];

    const modal = utils.showModal({
        title: 'Edit Savings Goal',
        content: modalContent,
        buttons: buttons
    });

    // Focus on name field
    setTimeout(() => {
        const nameInput = document.getElementById('editGoalName');
        if (nameInput) {
            nameInput.focus();
        }
    }, 100);
}

/**
 * Open add savings modal (to contribute to a goal)
 * @param {string} id - Savings goal ID
 */
function openAddSavingsModal(id) {
    // Get the savings goal
    const goals = storage.getSavingsGoals();
    const goal = goals.find(g => g.id === id);

    if (!goal) {
        utils.showToast({ message: 'Savings goal not found', type: 'error' });
        return;
    }

    const modalContent = `
        <form id="addSavingsForm">
            <div class="form-group">
                <label for="savingsAmount">Amount to Add (₱)</label>
                <input type="number" id="savingsAmount" min="0.01" step="0.01" placeholder="Enter amount to add" required>
            </div>

            <div class="form-group">
                <label for="savingsDate">Date</label>
                <input type="date" id="savingsDate" required>
            </div>

            <div class="form-group">
                <label for="savingsDescription">Description (Optional)</label>
                <input type="text" id="savingsDescription" placeholder="Enter description for this contribution">
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
            text: 'Add Savings',
            class: 'btn-primary',
            isPrimary: true,
            callback: () => {
                // Get form values
                const amount = parseFloat(document.getElementById('savingsAmount').value);
                const date = document.getElementById('savingsDate').value;
                const description = document.getElementById('savingsDescription').value.trim();

                // Validate
                if (!Number.isFinite(amount) || amount <= 0) {
                    utils.showToast({ message: 'Please enter a valid amount', type: 'error' });
                    return;
                }

                if (!date) {
                    utils.showToast({ message: 'Please select a date', type: 'error' });
                    return;
                }

                // Update savings goal
                const updatedGoal = {
                    ...goal,
                    savedAmount: (Number(goal.savedAmount) || 0) + amount,
                    contributions: [...(Array.isArray(goal.contributions) ? goal.contributions : []), {
                        id: utils.generateId(), amount, date, description
                    }]
                };

                const success = storage.updateSavingsGoal(id, updatedGoal);

                if (success) {
                    utils.showToast({ message: 'Savings added successfully', type: 'success' });
                    modal.close();
                    // Update savings goals list
                    renderSavingsList();
                    // Update dashboard if we're on overview page
                    if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/')) {
                        // Dispatch event to update dashboard
                        document.dispatchEvent(new CustomEvent('savings:updated'));
                    }
                } else {
                    utils.showToast({ message: 'Failed to add savings', type: 'error' });
                }
            }
        }
    ];

    const modal = utils.showModal({
        title: `Add Savings to ${goal.name}`,
        content: modalContent,
        buttons: buttons
    });

    // Set today's date as default and focus on amount field
    setTimeout(() => {
        const dateInput = document.getElementById('savingsDate');
        if (dateInput) {
            dateInput.value = utils.getCurrentDate();
        }

        const amountInput = document.getElementById('savingsAmount');
        if (amountInput) {
            amountInput.focus();
        }
    }, 100);
}

/**
 * Delete a savings goal
 * @param {string} id - Savings goal ID to delete
 */
async function deleteSavingsGoal(id) {
    const confirmed = await utils.confirmAction('Are you sure you want to delete this savings goal?');
    if (!confirmed) {
        return;
    }

    const success = storage.deleteSavingsGoal(id);
    if (success) {
        utils.showToast({ message: 'Savings goal deleted successfully', type: 'success' });
        renderSavingsList();
        // Update dashboard if needed
        document.dispatchEvent(new CustomEvent('savings:updated'));
    } else {
        utils.showToast({ message: 'Failed to delete savings goal', type: 'error' });
    }
}

// Export functions for use in other modules (if needed)
window.savings = {
    initSavingsPage,
    renderSavingsList,
    openAddSavingsGoalModal,
    openEditSavingsGoalModal,
    openAddSavingsModal,
    deleteSavingsGoal
};

// Initialize the page when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSavingsPage);
} else {
    initSavingsPage();
}
