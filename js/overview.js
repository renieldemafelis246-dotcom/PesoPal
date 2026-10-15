/* Overview (Dashboard) page logic */

/**
 * Initialize overview page
 */
function initOverviewPage() {
    // Render dashboard content
    renderDashboard();

    // Setup event listeners
    setupOverviewListeners();
}

/**
 * Render the dashboard content
 */
function renderDashboard() {
    const dashboardContainer = document.getElementById('dashboard-content');
    if (!dashboardContainer) return;

    const transactions = storage.getTransactions();
    const budgets = storage.getBudgets();
    const goals = storage.getSavingsGoals();

    // Calculate summary stats
    const totalBalance = calculations.calculateAvailableBalance(transactions);
    const totalIncome = calculations.calculateTotalIncome(transactions);
    const totalExpenses = calculations.calculateTotalExpenses(transactions);
    // For remaining monthly budget, we need to calculate based on current month budgets
    // For simplicity, we'll calculate the remaining budget as total balance minus expenses?
    // Actually, remaining monthly budget should be the sum of budget limits minus expenses in current month.
    // We'll implement a simplified version: sum of budget limits for current month minus expenses in current month.
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const monthlyBudgets = budgets.filter(budget => {
        const budgetStart = utils.parseDate(budget.startDate);
        const budgetEnd = utils.parseDate(budget.endDate);
        return (budgetStart <= endOfMonth && budgetEnd >= startOfMonth);
    });

    const remainingMonthlyBudget = monthlyBudgets.reduce((sum, budget) =>
        sum + calculations.calculateBudgetUsage(transactions, budget).remaining, 0);

    // Build dashboard HTML
    let html = `
        <!-- Welcome section -->
        <section class="welcome-section">
            <span class="overview-eyebrow">PERSONAL FINANCE OVERVIEW</span>
            <h2>Good ${getTimeOfDay()}!</h2>
            <p>Your money at a glance <span class="overview-date">${utils.formatDate(new Date())}</span></p>
        </section>

        <!-- Financial summary cards -->
        <div class="dashboard-grid">
            <div class="card metric-card metric-balance">
                <div class="card-header">
                    <div class="card-title">Total Balance</div>
                    <div class="card-icon">
                        <i data-lucide="wallet"></i>
                    </div>
                </div>
                <div class="card-body">
                    <div class="card-value">${utils.formatPHP(totalBalance)}</div>
                    <div class="card-subtext">Overall balance</div>
                </div>
            </div>
            <div class="card metric-card metric-income">
                <div class="card-header">
                    <div class="card-title">Total Income</div>
                    <div class="card-icon">
                        <i data-lucide="arrow-up-circle"></i>
                    </div>
                </div>
                <div class="card-body">
                    <div class="card-value">${utils.formatPHP(totalIncome)}</div>
                    <div class="card-subtext">All time</div>
                </div>
            </div>
            <div class="card metric-card metric-expenses">
                <div class="card-header">
                    <div class="card-title">Total Expenses</div>
                    <div class="card-icon">
                        <i data-lucide="arrow-down-circle"></i>
                    </div>
                </div>
                <div class="card-body">
                    <div class="card-value">${utils.formatPHP(totalExpenses)}</div>
                    <div class="card-subtext">All time</div>
                </div>
            </div>
            <div class="card metric-card metric-budget">
                <div class="card-header">
                    <div class="card-title">Remaining Monthly Budget</div>
                    <div class="card-icon">
                        <i data-lucide="piggy-bank"></i>
                    </div>
                </div>
                <div class="card-body">
                    <div class="card-value">${utils.formatPHP(remainingMonthlyBudget)}</div>
                    <div class="card-subtext">This month</div>
                </div>
            </div>
        </div>

        <!-- Charts section -->
        <section class="dashboard-charts">
            <div class="chart-container">
                <h3>Income vs Expenses</h3>
                <canvas id="dashboardIncomeExpensesChart"></canvas>
            </div>
            <div class="chart-container">
                <h3>Income &amp; Expenses</h3>
                <canvas id="dashboardExpenseBreakdownChart"></canvas>
            </div>
        </section>

        <!-- Recent transactions -->
        <section class="dashboard-detail-card recent-transactions">
            <h3>Recent Transactions <a href="pages/transactions.html" class="view-all-link">View All</a></h3>
            <div id="recent-transactions-list">
                <!-- Transactions will be rendered here -->
            </div>
        </section>

        <!-- Budget progress -->
        <section class="dashboard-detail-card budget-progress">
            <h3>Budget Progress <a href="pages/budgets.html" class="view-all-link">View All</a></h3>
            <div id="budget-progress-list">
                <!-- Budget progress bars will be rendered here -->
            </div>
        </section>

        <!-- Savings goal preview -->
        <section class="dashboard-detail-card savings-preview">
            <h3>Savings Goals <a href="pages/savings.html" class="view-all-link">View All</a></h3>
            <div id="savings-preview-list">
                <!-- Savings goal cards will be rendered here -->
            </div>
        </section>
    `;

    dashboardContainer.innerHTML = html;

    // Initialize charts
    const incomeExpensesChartConfig = charts.createIncomeExpensesChart(transactions, 'monthly');
    const expenseBreakdownChartConfig = charts.createIncomeExpensesBreakdownChart(transactions);

    if (incomeExpensesChartConfig) {
        charts.initChart('dashboardIncomeExpensesChart', incomeExpensesChartConfig);
    }
    if (expenseBreakdownChartConfig) {
        charts.initChart('dashboardExpenseBreakdownChart', expenseBreakdownChartConfig);
    }

    // Render recent transactions
    renderRecentTransactions();

    // Render budget progress
    renderBudgetProgress();

    // Render savings goal preview
    renderSavingsPreview();

    // Update Lucide icons
    lucide.createIcons();
}

/**
 * Get time of day for greeting
 * @returns {string} Morning, Afternoon, Evening, or Night
 */
function getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    if (hour < 21) return 'Evening';
    return 'Night';
}

/**
 * Setup event listeners for overview page
 */
function setupOverviewListeners() {
    const quickAddBtn = document.getElementById('dashboardQuickAddBtn');
    if (quickAddBtn) {
        quickAddBtn.addEventListener('click', () => {
            window.transactions?.openQuickAddModal();
        });
    }
    ['data:updated', 'transactions:updated', 'savings:updated', 'theme:changed'].forEach(eventName => {
        document.addEventListener(eventName, renderDashboard);
    });
}

/**
 * Render recent transactions list
 */
function renderRecentTransactions() {
    const container = document.getElementById('recent-transactions-list');
    if (!container) return;

    const transactions = storage.getTransactions();
    const sortedTransactions = [...transactions].sort((a, b) => utils.parseDate(b.date) - utils.parseDate(a.date)).slice(0, 5); // Latest 5

    if (sortedTransactions.length === 0) {
        container.innerHTML = '<p class="empty-state-text">No transactions yet.</p>';
        return;
    }

    let html = '';
    sortedTransactions.forEach(transaction => {
        const transactionType = transaction.type === 'income' ? 'income' : 'expense';
        const amount = utils.formatPHP(parseFloat(transaction.amount));
        const date = utils.formatDate(utils.parseDate(transaction.date));
        html += `
            <div class="recent-transaction-item">
                <div class="transaction-info">
                    <div class="transaction-description">${utils.escapeHtml(transaction.description)}</div>
                    <div class="transaction-category">${transaction.category}</div>
                </div>
                <div class="transaction-amount ${transactionType}">${amount}</div>
                <div class="transaction-date">${date}</div>
            </div>
        `;
    });

    container.innerHTML = html;
}

/**
 * Render budget progress list
 */
function renderBudgetProgress() {
    const container = document.getElementById('budget-progress-list');
    if (!container) return;

    const budgets = storage.getBudgets();
    const transactions = storage.getTransactions();
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    // Filter budgets that are active in the current month
    const activeBudgets = budgets.filter(budget => {
        const budgetStart = new Date(budget.startDate);
        const budgetEnd = new Date(budget.endDate);
        return (budgetStart <= endOfMonth && budgetEnd >= startOfMonth);
    });

    if (activeBudgets.length === 0) {
        container.innerHTML = '<p class="empty-state-text">No active budgets for this month.</p>';
        return;
    }

    let html = '';
    activeBudgets.forEach(budget => {
        const usage = calculations.calculateBudgetUsage(transactions, budget);
        const percentage = usage.percentage;
        let progressClass = '';
        if (percentage >= 100) progressClass = 'error';
        else if (percentage >= 75) progressClass = 'warning';

        html += `
            <div class="budget-progress-item">
                <div class="budget-info">
                    <h4>${utils.escapeHtml(budget.name)}</h4>
                    <p>${budget.category}</p>
                </div>
                <div class="budget-details">
                    <span>${utils.formatPHP(usage.spent)} / ${utils.formatPHP(budget.amount)}</span>
                </div>
                <div class="progress-container">
                    <div class="progress-bar ${progressClass}" style="width: ${Math.min(percentage, 100)}%"></div>
                </div>
                <div class="budget-percentage">${percentage.toFixed(1)}% used</div>
            </div>
        `;
    });

    container.innerHTML = html;
}

/**
 * Render savings goal preview list
 */
function renderSavingsPreview() {
    const container = document.getElementById('savings-preview-list');
    if (!container) return;

    const goals = storage.getSavingsGoals();

    if (goals.length === 0) {
        container.innerHTML = '<p class="empty-state-text">No savings goals yet.</p>';
        return;
    }

    // Show up to 3 goals
    const previewGoals = goals.slice(0, 3);

    let html = '';
    previewGoals.forEach(goal => {
        const progress = calculations.calculateSavingsProgress(goal);
        const percentage = progress.percentage;

        html += `
            <div class="savings-preview-item">
                <div class="savings-info">
                    <h4>${utils.escapeHtml(goal.name)}</h4>
                    ${goal.targetDate ? `<p>Target date: ${utils.formatDate(new Date(goal.targetDate))}</p>` : ''}
                </div>
                <div class="savings-details">
                    <span>${utils.formatPHP(progress.saved)} / ${utils.formatPHP(goal.targetAmount)}</span>
                </div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${Math.min(percentage, 100)}%"></div>
                </div>
                <div class="savings-percentage">${percentage.toFixed(1)}% saved</div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// Export functions for use in other modules (if needed)
window.overview = {
    initOverviewPage,
    renderDashboard,
    renderRecentTransactions,
    renderBudgetProgress,
    renderSavingsPreview
};

// Initialize the page when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOverviewPage);
} else {
    initOverviewPage();
}
