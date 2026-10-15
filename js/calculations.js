/* Financial calculations */

/**
 * Calculate total income from transactions
 * @param {Array} transactions - Array of transaction objects
 * @param {Object} filters - Optional filters (date range, etc.)
 * @returns {number} Total income
 */
function filterTransactionsByDate(transactions, filters = {}) {
    const parseLocal = value => {
        if (!value) return null;
        const [year, month, day] = String(value).split('-').map(Number);
        return new Date(year, month - 1, day);
    };
    const start = parseLocal(filters.startDate);
    const endDate = parseLocal(filters.endDate);
    const end = endDate ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999) : null;
    return (Array.isArray(transactions) ? transactions : []).filter(transaction => {
        const date = parseLocal(transaction.date);
        if (!Number.isFinite(date.getTime())) return false;
        return (!start || date >= start) && (!end || date <= end);
    });
}

function calculateTotalIncome(transactions, filters = {}) {
    const filtered = filterTransactionsByDate(transactions, filters);
    return filtered
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (Number.isFinite(Number(t.amount)) ? Number(t.amount) : 0), 0);
}

/**
 * Calculate total expenses from transactions
 * @param {Array} transactions - Array of transaction objects
 * @param {Object} filters - Optional filters (date range, etc.)
 * @returns {number} Total expenses
 */
function calculateTotalExpenses(transactions, filters = {}) {
    const filtered = filterTransactionsByDate(transactions, filters);
    return filtered
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (Number.isFinite(Number(t.amount)) ? Number(t.amount) : 0), 0);
}

/**
 * Calculate net cash flow (income - expenses)
 * @param {Array} transactions - Array of transaction objects
 * @param {Object} filters - Optional filters (date range, etc.)
 * @returns {number} Net cash flow
 */
function calculateNetCashFlow(transactions, filters = {}) {
    const income = calculateTotalIncome(transactions, filters);
    const expenses = calculateTotalExpenses(transactions, filters);
    return income - expenses;
}

/**
 * Calculate available balance (sum of all transactions)
 * @param {Array} transactions - Array of transaction objects
 * @returns {number} Available balance
 */
function calculateAvailableBalance(transactions) {
    return (Array.isArray(transactions) ? transactions : []).reduce((sum, t) => {
        const amount = Number.isFinite(Number(t.amount)) ? Number(t.amount) : 0;
        return sum + (t.type === 'income' ? amount : -amount);
    }, 0);
}

/**
 * Calculate budget usage for a specific category and period
 * @param {Array} transactions - Array of transaction objects
 * @param {Object} budget - Budget object with category, startDate, endDate, amount
 * @returns {Object} Object with spent, remaining, percentage
 */
function calculateBudgetUsage(transactions, budget) {
    const spent = filterTransactionsByDate(transactions, { startDate: budget.startDate, endDate: budget.endDate })
        .filter(t => t.type === 'expense' && t.category === budget.category)
        .reduce((sum, t) => sum + (Number.isFinite(Number(t.amount)) ? Number(t.amount) : 0), 0);

    const budgetAmount = parseFloat(budget.amount) || 0;
    const remaining = budgetAmount - spent;
    const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;

    return {
        spent: spent >= 0 ? spent : 0,
        remaining,
        percentage: percentage > 100 ? 100 : percentage
    };
}

/**
 * Calculate savings goal progress
 * @param {Object} goal - Savings goal object with targetAmount and savedAmount
 * @returns {Object} Object with progress percentage and remaining amount
 */
function calculateSavingsProgress(goal) {
    const target = parseFloat(goal.targetAmount) || 0;
    const saved = parseFloat(goal.savedAmount) || 0;
    const remaining = target - saved;
    const percentage = target > 0 ? (saved / target) * 100 : 0;

    return {
        saved: saved >= 0 ? saved : 0,
        remaining,
        percentage: percentage > 100 ? 100 : percentage
    };
}

/**
 * Get expenses by category for a given period
 * @param {Array} transactions - Array of transaction objects
 * @param {Object} filters - Optional filters (date range, etc.)
 * @returns {Object} Map of category to total expense
 */
function getExpensesByCategory(transactions, filters = {}) {
    const filtered = filterTransactionsByDate(transactions, filters);

    const expenses = filtered
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
            const category = t.category;
            const amount = parseFloat(t.amount) || 0;
            acc[category] = (acc[category] || 0) + amount;
            return acc;
        }, {});

    return expenses;
}

/**
 * Get income by category for a given period
 * @param {Array} transactions - Array of transaction objects
 * @param {Object} filters - Optional filters (date range, etc.)
 * @returns {Object} Map of category to total income
 */
function getIncomeByCategory(transactions, filters = {}) {
    const filtered = filterTransactionsByDate(transactions, filters);

    const income = filtered
        .filter(t => t.type === 'income')
        .reduce((acc, t) => {
            const category = t.category;
            const amount = parseFloat(t.amount) || 0;
            acc[category] = (acc[category] || 0) + amount;
            return acc;
        }, {});

    return income;
}

/**
 * Get monthly totals for income and expenses for the last 12 months
 * @param {Array} transactions - Array of transaction objects
 * @returns {Object} Object with months, income, expenses arrays
 */
function getMonthlyTotals(transactions) {
    const now = new Date();
    const months = [];
    const income = [];
    const expenses = [];

    // Generate last 12 months including current
    for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        months.push(monthKey);

        const start = new Date(date.getFullYear(), date.getMonth(), 1);
        const end = new Date(date.getFullYear(), date.getMonth() + 1, 0); // last day of month

        const monthTransactions = transactions.filter(t => {
            const tDate = utils.parseDate(t.date);
            return tDate >= start && tDate <= end;
        });

        const monthIncome = monthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

        const monthExpenses = monthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

        income.push(monthIncome);
        expenses.push(monthExpenses);
    }

    return { months, income, expenses };
}

/**
 * Format number to 2 decimal places (for internal calculations)
 * @param {number} num - Number to format
 * @returns {number} Formatted number
 */
function toFixedTwo(num) {
    return Math.round(num * 100) / 100;
}

// Export calculation functions for use in other modules
window.calculations = {
    filterTransactionsByDate,
    calculateTotalIncome,
    calculateTotalExpenses,
    calculateNetCashFlow,
    calculateAvailableBalance,
    calculateBudgetUsage,
    calculateSavingsProgress,
    getExpensesByCategory,
    getIncomeByCategory,
    getMonthlyTotals,
    toFixedTwo
};
