/* Storage handling using localStorage */

const STORAGE_KEY = 'pesoPalData';
let storageCorrupted = false;

/** Initialize an empty account without replacing existing financial records. */
function initStorage() {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (!storedData) {
        const emptyData = { transactions: [], budgets: [], savingsGoals: [] };
        saveData(emptyData);
        return emptyData;
    }
    try {
        const parsed = JSON.parse(storedData);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid data format');
        return {
            ...parsed,
            transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
            budgets: Array.isArray(parsed.budgets) ? parsed.budgets : [],
            savingsGoals: Array.isArray(parsed.savingsGoals) ? parsed.savingsGoals : []
        };
    } catch (error) {
        storageCorrupted = true;
        console.error('Error parsing storage data:', error);
        utils.showToast({ message: 'Saved data could not be read. Import a backup or clear the data before making changes.', type: 'error', duration: 6000 });
        return { transactions: [], budgets: [], savingsGoals: [] };
    }
}

/**
 * Load all data from storage
 * @returns {Object} Data object with transactions, budgets, savingsGoals
 */
function loadData() {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (!storedData) {
        return initStorage();
    }
    try {
        const parsed = JSON.parse(storedData);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid data format');
        return {
            ...parsed,
            transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
            budgets: Array.isArray(parsed.budgets) ? parsed.budgets : [],
            savingsGoals: Array.isArray(parsed.savingsGoals) ? parsed.savingsGoals : []
        };
    } catch (error) {
        storageCorrupted = true;
        console.error('Error parsing storage data:', error);
        utils.showToast({ message: 'Saved data could not be read. Import a backup or clear the data before making changes.', type: 'error', duration: 6000 });
        return { transactions: [], budgets: [], savingsGoals: [] };
    }
}

/**
 * Save data to storage
 * @param {Object} data - Data object to save
 */
function saveData(data, allowReplaceCorrupted = false) {
    if (storageCorrupted && !allowReplaceCorrupted) {
        utils.showToast({ message: 'Data was not saved because the stored records are unreadable. Import a backup or clear the data first.', type: 'error', duration: 6000 });
        return false;
    }
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        storageCorrupted = false;
        utils.dispatchDataUpdated();
        return true;
    } catch (error) {
        console.error('Error saving to storage:', error);
        utils.showToast({ message: 'Failed to save data', type: 'error' });
        return false;
    }
}

/**
 * Get transactions array
 * @returns {Array} Transactions array
 */
function getTransactions() {
    const data = loadData();
    return data.transactions || [];
}

/**
 * Save transactions array
 * @param {Array} transactions - Transactions array to save
 */
function saveTransactions(transactions) {
    const data = loadData();
    data.transactions = transactions;
    return saveData(data);
}

/**
 * Add a transaction
 * @param {Object} transaction - Transaction object to add
 * @returns {Object} The saved transaction with ID
 */
function addTransaction(transaction) {
    const transactions = getTransactions();
    const newTransaction = {
        ...transaction,
        id: utils.generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    const updatedTransactions = [...transactions, newTransaction];
    if (saveTransactions(updatedTransactions)) {
        return newTransaction;
    }
    return null;
}

/**
 * Update a transaction
 * @param {string} id - Transaction ID
 * @param {Object} updates - Object with fields to update
 * @returns {boolean} True if successful
 */
function updateTransaction(id, updates) {
    const transactions = getTransactions();
    const index = transactions.findIndex(t => t.id === id);
    if (index === -1) return false;

    const updatedTransaction = {
        ...transactions[index],
        ...updates,
        updatedAt: new Date().toISOString()
    };

    const updatedTransactions = [
        ...transactions.slice(0, index),
        updatedTransaction,
        ...transactions.slice(index + 1)
    ];

    return saveTransactions(updatedTransactions);
}

/**
 * Delete a transaction
 * @param {string} id - Transaction ID to delete
 * @returns {boolean} True if successful
 */
function deleteTransaction(id) {
    const transactions = getTransactions();
    const updatedTransactions = transactions.filter(t => t.id !== id);
    if (updatedTransactions.length === transactions.length) return false; // Not found
    return saveTransactions(updatedTransactions);
}

/**
 * Get budgets array
 * @returns {Array} Budgets array
 */
function getBudgets() {
    const data = loadData();
    return data.budgets || [];
}

/**
 * Save budgets array
 * @param {Array} budgets - Budgets array to save
 */
function saveBudgets(budgets) {
    const data = loadData();
    data.budgets = budgets;
    return saveData(data);
}

/**
 * Add a budget
 * @param {Object} budget - Budget object to add
 * @returns {Object} The saved budget with ID
 */
function addBudget(budget) {
    const budgets = getBudgets();
    const newBudget = {
        ...budget,
        id: utils.generateId()
    };
    const updatedBudgets = [...budgets, newBudget];
    if (saveBudgets(updatedBudgets)) {
        return newBudget;
    }
    return null;
}

/**
 * Update a budget
 * @param {string} id - Budget ID
 * @param {Object} updates - Object with fields to update
 * @returns {boolean} True if successful
 */
function updateBudget(id, updates) {
    const budgets = getBudgets();
    const index = budgets.findIndex(b => b.id === id);
    if (index === -1) return false;

    const updatedBudget = {
        ...budgets[index],
        ...updates
    };

    const updatedBudgets = [
        ...budgets.slice(0, index),
        updatedBudget,
        ...budgets.slice(index + 1)
    ];

    return saveBudgets(updatedBudgets);
}

/**
 * Delete a budget
 * @param {string} id - Budget ID to delete
 * @returns {boolean} True if successful
 */
function deleteBudget(id) {
    const budgets = getBudgets();
    const updatedBudgets = budgets.filter(b => b.id !== id);
    if (updatedBudgets.length === budgets.length) return false; // Not found
    return saveBudgets(updatedBudgets);
}

/**
 * Get savings goals array
 * @returns {Array} Savings goals array
 */
function getSavingsGoals() {
    const data = loadData();
    return data.savingsGoals || [];
}

/**
 * Save savings goals array
 * @param {Array} goals - Savings goals array to save
 */
function saveSavingsGoals(goals) {
    const data = loadData();
    data.savingsGoals = goals;
    return saveData(data);
}

/**
 * Add a savings goal
 * @param {Object} goal - Savings goal object to add
 * @returns {Object} The saved goal with ID
 */
function addSavingsGoal(goal) {
    const goals = getSavingsGoals();
    const newGoal = {
        ...goal,
        id: utils.generateId()
    };
    const updatedGoals = [...goals, newGoal];
    if (saveSavingsGoals(updatedGoals)) {
        return newGoal;
    }
    return null;
}

/**
 * Update a savings goal
 * @param {string} id - Savings goal ID
 * @param {Object} updates - Object with fields to update
 * @returns {boolean} True if successful
 */
function updateSavingsGoal(id, updates) {
    const goals = getSavingsGoals();
    const index = goals.findIndex(g => g.id === id);
    if (index === -1) return false;

    const updatedGoal = {
        ...goals[index],
        ...updates
    };

    const updatedGoals = [
        ...goals.slice(0, index),
        updatedGoal,
        ...goals.slice(index + 1)
    ];

    return saveSavingsGoals(updatedGoals);
}

/**
 * Delete a savings goal
 * @param {string} id - Savings goal ID to delete
 * @returns {boolean} True if successful
 */
function deleteSavingsGoal(id) {
    const goals = getSavingsGoals();
    const updatedGoals = goals.filter(g => g.id !== id);
    if (updatedGoals.length === goals.length) return false; // Not found
    return saveSavingsGoals(updatedGoals);
}

/**
 * Clear all data (reset to sample data)
 */
function clearAllData() {
    const cleared = saveData({ transactions: [], budgets: [], savingsGoals: [] }, true);
    if (cleared) utils.dispatchDataUpdated();
    return cleared;
}

// Export storage functions for use in other modules
window.storage = {
    initStorage,
    loadData,
    saveData,
    getTransactions,
    saveTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getBudgets,
    saveBudgets,
    addBudget,
    updateBudget,
    deleteBudget,
    getSavingsGoals,
    saveSavingsGoals,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    clearAllData
};
