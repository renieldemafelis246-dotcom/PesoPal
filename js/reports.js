/* Reports & Analytics page logic */

/**
 * Initialize reports page
 */
let reportDateRange = null;

function initReportsPage() {
    // Render reports overview
    renderReportsOverview();

    // Setup event listeners
    setupReportsListeners();
}

/**
 * Render reports overview (summary cards and charts)
 */
function renderReportsOverview() {
    const reportsContainer = document.getElementById('reports-content');
    if (!reportsContainer) return;

    const transactions = storage.getTransactions();
    const currentDate = new Date();
    const startOfMonth = reportDateRange ? utils.parseDate(reportDateRange.startDate) : new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = reportDateRange ? utils.parseDate(reportDateRange.endDate) : new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const filters = { startDate: utils.getDateInputValue(startOfMonth), endDate: utils.getDateInputValue(endOfMonth) };
    const rangeLabel = document.querySelector('#dateRangeBtn span');
    if (rangeLabel) rangeLabel.textContent = reportDateRange ? `${filters.startDate} – ${filters.endDate}` : 'This Month';

    // Calculate summary stats for current month
    const income = calculations.calculateTotalIncome(transactions, {
        ...filters
    });
    const expenses = calculations.calculateTotalExpenses(transactions, {
        ...filters
    });
    const netCashFlow = calculations.calculateNetCashFlow(transactions, filters);
    const transactionCount = transactions.filter(t => {
        const date = utils.parseDate(t.date);
        return date >= startOfMonth && date <= endOfMonth;
    }).length;

    // Get highest spending category
    const expensesByCategory = calculations.getExpensesByCategory(transactions, {
        ...filters
    });
    let highestCategory = 'N/A';
    let highestAmount = 0;
    for (const [category, amount] of Object.entries(expensesByCategory)) {
        if (amount > highestAmount) {
            highestAmount = amount;
            highestCategory = category;
        }
    }

    // Build summary cards HTML
    let html = `
        <section class="report-summary-grid">
            <div class="card report-metric report-income">
                <div class="card-header">
                    <div class="card-title">Total Income</div>
                    <div class="card-icon">
                        <i data-lucide="arrow-up-circle"></i>
                    </div>
                </div>
                <div class="card-body">
                    <div class="card-value">${utils.formatPHP(income)}</div>
                    <div class="card-subtext">${filters.startDate} – ${filters.endDate}</div>
                </div>
            </div>
            <div class="card report-metric report-expenses">
                <div class="card-header">
                    <div class="card-title">Total Expenses</div>
                    <div class="card-icon">
                        <i data-lucide="arrow-down-circle"></i>
                    </div>
                </div>
                <div class="card-body">
                    <div class="card-value">${utils.formatPHP(expenses)}</div>
                    <div class="card-subtext">${filters.startDate} – ${filters.endDate}</div>
                </div>
            </div>
            <div class="card report-metric report-net">
                <div class="card-header">
                    <div class="card-title">Net Cash Flow</div>
                    <div class="card-icon">
                        <i data-lucide="scale"></i>
                    </div>
                </div>
                <div class="card-body">
                    <div class="card-value">${utils.formatPHP(netCashFlow)}</div>
                    <div class="card-subtext">Income - Expenses</div>
                </div>
            </div>
            <div class="card report-metric report-count">
                <div class="card-header">
                    <div class="card-title">Transaction Count</div>
                    <div class="card-icon">
                        <i data-lucide="file-text"></i>
                    </div>
                </div>
                <div class="card-body">
                    <div class="card-value">${transactionCount}</div>
                    <div class="card-subtext">Selected period</div>
                </div>
            </div>
        </section>

        ${transactionCount === 0 ? '<p class="empty-state-text report-empty">No transactions are available for this date range. Add transactions or choose a different period.</p>' : ''}
        ${highestAmount > 0 ? `<p class="report-insight"><i data-lucide="lightbulb"></i><span>Highest expense category: <strong>${utils.escapeHtml(highestCategory)}</strong><b>${utils.formatPHP(highestAmount)}</b></span></p>` : ''}
        <section class="report-charts">
            <div class="chart-container report-chart-card">
                <h2>Income vs. expenses</h2>
                <p>Monthly cash flow for the selected period</p>
                <canvas id="incomeExpensesChart"></canvas>
            </div>
            <div class="chart-container report-chart-card">
                <h2>Expense breakdown</h2>
                <p>Spending by category for the selected period</p>
                <canvas id="expenseBreakdownChart"></canvas>
            </div>
        </section>
    `;

    reportsContainer.innerHTML = html;

    // Initialize charts
    const periodTransactions = calculations.filterTransactionsByDate(transactions, filters);
    const incomeExpensesChartConfig = charts.createIncomeExpensesChart(periodTransactions, 'monthly');
    const expenseBreakdownChartConfig = charts.createExpenseBreakdownChart(transactions, filters);

    if (incomeExpensesChartConfig) {
        charts.initChart('incomeExpensesChart', incomeExpensesChartConfig);
    }
    if (expenseBreakdownChartConfig) {
        charts.initChart('expenseBreakdownChart', expenseBreakdownChartConfig);
    }

    // Update Lucide icons
    lucide.createIcons();
}

/**
 * Setup event listeners for reports page
 */
function setupReportsListeners() {
    const dateRangeBtn = document.getElementById('dateRangeBtn');
    if (dateRangeBtn) {
        dateRangeBtn.addEventListener('click', openDateRangePicker);
    }
    document.getElementById('exportCsvBtn')?.addEventListener('click', exportReportCSV);
}

function exportReportCSV() {
    const today = new Date();
    const filters = reportDateRange || {
        startDate: utils.getDateInputValue(new Date(today.getFullYear(), today.getMonth(), 1)),
        endDate: utils.getDateInputValue(new Date(today.getFullYear(), today.getMonth() + 1, 0))
    };
    const records = calculations.filterTransactionsByDate(storage.getTransactions(), filters).map(({ description, type, amount, category, date, paymentMethod, notes }) => ({
        description, type, amount, category, date, paymentMethod: paymentMethod || '', notes: notes || ''
    }));
    utils.exportToCSV(records, 'pesoPal-transactions.csv');
}

/**
 * Open date range picker modal
 */
function openDateRangePicker() {
    const modalContent = `
        <form id="dateRangeForm">
            <div class="form-group">
                <label for="startDate">Start Date</label>
                <input type="date" id="startDate" required>
            </div>

            <div class="form-group">
                <label for="endDate">End Date</label>
                <input type="date" id="endDate" required>
            </div>

            <div class="form-group">
                <label for="periodType">Period Type</label>
                <select id="periodType">
                    <option value="custom">Custom Range</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="quarter">This Quarter</option>
                    <option value="year">This Year</option>
                </select>
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
            text: 'Apply Filter',
            class: 'btn-primary',
            isPrimary: true,
            callback: () => {
                // Get form values
                const startDate = document.getElementById('startDate').value;
                const endDate = document.getElementById('endDate').value;
                const periodType = document.getElementById('periodType').value;

                // Validate
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

                reportDateRange = { startDate, endDate };
                utils.showToast({ message: 'Date range filter applied', type: 'success' });
                modal.close();

                // Re-render reports with the selected date range
                renderReportsOverview();
            }
        }
    ];

    // Set default dates (last 30 days to today)
    setTimeout(() => {
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
        const periodSelect = document.getElementById('periodType');
        const applyPeriod = () => {
            if (!periodSelect || periodSelect.value === 'custom') return;
            const today = new Date();
            let start;
            let end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            if (periodSelect.value === 'week') {
                start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - ((today.getDay() + 6) % 7));
            } else if (periodSelect.value === 'month') {
                start = new Date(today.getFullYear(), today.getMonth(), 1);
            } else if (periodSelect.value === 'quarter') {
                start = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
            } else {
                start = new Date(today.getFullYear(), 0, 1);
            }
            startDateInput.value = utils.getDateInputValue(start);
            endDateInput.value = utils.getDateInputValue(end);
        };
        periodSelect?.addEventListener('change', applyPeriod);
        if (startDateInput && endDateInput) {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - 30); // Last 30 days

            startDateInput.value = utils.getDateInputValue(startDate);
            endDateInput.value = utils.getDateInputValue(endDate);
        }

        // Focus on start date field
        if (startDateInput) {
            startDateInput.focus();
        }
    }, 100);

    const modal = utils.showModal({
        title: 'Select Date Range',
        content: modalContent,
        buttons: buttons
    });
}

// Export functions for use in other modules (if needed)
window.reports = {
    initReportsPage,
    renderReportsOverview,
    openDateRangePicker,
    exportReportCSV
};

document.addEventListener('data:updated', () => {
    if (document.getElementById('reports-content')) renderReportsOverview();
});
document.addEventListener('theme:changed', () => {
    if (document.getElementById('reports-content')) renderReportsOverview();
});

// Initialize the page when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReportsPage);
} else {
    initReportsPage();
}
