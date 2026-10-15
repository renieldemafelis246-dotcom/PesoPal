/* Chart.js integration */

/**
 * Initialize a chart with given configuration
 * @param {string} canvasId - ID of the canvas element
 * @param {Object} config - Chart.js configuration object
 * @returns {Chart} Chart instance
 */
function initChart(canvasId, config) {
    if (typeof Chart === 'undefined') {
        utils.showToast({ message: 'Charts are unavailable. Check your internet connection and reload.', type: 'warning', duration: 5000 });
        return null;
    }
    const styles = getComputedStyle(document.documentElement);
    Chart.defaults.color = styles.getPropertyValue('--secondary-text').trim();
    Chart.defaults.borderColor = styles.getPropertyValue('--border').trim();
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error(`Canvas element with id ${canvasId} not found`);
        return null;
    }

    // Destroy existing chart if any
    if (canvas.chart) {
        canvas.chart.destroy();
    }

    const chart = new Chart(canvas, config);
    canvas.chart = chart;
    return chart;
}

/**
 * Create income vs expenses chart for dashboard
 * @param {Array} transactions - Array of transaction objects
 * @param {string} period - 'weekly', 'monthly', or 'yearly'
 * @returns {Object} Chart configuration
 */
function createIncomeExpensesChart(transactions, period = 'monthly') {
    const { months, income, expenses } = calculations.getMonthlyTotals(transactions);

    // Limit data based on period
    let labels = months;
    let incomeData = income;
    let expensesData = expenses;

    if (period === 'weekly') {
        // For weekly, we'd need to group by week - simplified: last 4 weeks
        labels = months.slice(-4);
        incomeData = income.slice(-4);
        expensesData = expenses.slice(-4);
    } else if (period === 'yearly') {
        // For yearly, we'd group by year - simplified: last 3 years
        // We'll just use all data for now
        labels = months;
        incomeData = income;
        expensesData = expenses;
    }

    return {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Income',
                    data: incomeData,
                    backgroundColor: 'rgba(22, 163, 74, 0.5)',
                    borderColor: 'rgba(22, 163, 74, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Expenses',
                    data: expensesData,
                    backgroundColor: 'rgba(239, 68, 68, 0.5)',
                    borderColor: 'rgba(239, 68, 68, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return utils.formatPHP(value);
                        }
                    }
                }
            }
        }
    };
}

/**
 * Create expense breakdown doughnut chart
 * @param {Array} transactions - Array of transaction objects
 * @param {Object} filters - Optional filters (date range, etc.)
 * @returns {Object} Chart configuration
 */
function createIncomeExpensesBreakdownChart(transactions) {
    const income = calculations.calculateTotalIncome(transactions);
    const expenses = calculations.calculateTotalExpenses(transactions);
    const hasData = income > 0 || expenses > 0;
    return {
        type: 'doughnut',
        data: {
            labels: hasData ? ['Income', 'Expenses'] : ['No transactions'],
            datasets: [{
                data: hasData ? [income, expenses] : [1],
                backgroundColor: hasData ? ['#16A34A', '#EF4444'] : ['#64748B'],
                borderColor: getComputedStyle(document.documentElement).getPropertyValue('--main-surface').trim(),
                borderWidth: 3,
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '66%',
            plugins: {
                legend: {
                    display: hasData,
                    position: 'right',
                    labels: { padding: 16, usePointStyle: true, pointStyle: 'circle', font: { size: 12 } }
                },
                tooltip: {
                    enabled: hasData,
                    callbacks: {
                        label: context => `${context.label}: ${utils.formatPHP(context.parsed || 0)}`
                    }
                }
            }
        }
    };
}

function createExpenseBreakdownChart(transactions, filters = {}) {
    const expensesByCategory = calculations.getExpensesByCategory(transactions, filters);
    const labels = Object.keys(expensesByCategory);
    const data = Object.values(expensesByCategory);

    if (labels.length === 0) {
        return {
            type: 'doughnut',
            data: {
                labels: ['No expenses'],
                datasets: [{ data: [1], backgroundColor: ['#E2E8F0'], borderWidth: 0 }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: false } }
            }
        };
    }

    return {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: ['#16A34A', '#166534', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#6B7280'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { padding: 20, font: { size: 12 } } },
                tooltip: { callbacks: { label: context => `${context.label || ''}: ${utils.formatPHP(context.parsed || 0)}` } }
            }
        }
    };
}

/**
 * Create savings progress chart (could be a progress bar or pie)
 * @param {Array} goals - Array of savings goal objects
 * @returns {Object} Chart configuration (for multiple goals, we might use a bar chart)
 */
function createSavingsProgressChart(goals) {
    if (goals.length === 0) {
        return {
            type: 'bar',
            data: {
                labels: ['No goals'],
                datasets: [{
                    label: 'Progress',
                    data: [0],
                    backgroundColor: '#E2E8F0',
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        };
    }

    const labels = goals.map(g => g.name);
    const data = goals.map(g => {
        const progress = calculations.calculateSavingsProgress(g);
        return progress.percentage;
    });

    return {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Progress %',
                data: data,
                backgroundColor: '#16A34A',
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            return `${label}: ${value}%`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    };
}

/**
 * Create budget usage chart (horizontal bar)
 * @param {Array} budgets - Array of budget objects
 * @param {Array} transactions - Array of transaction objects
 * @returns {Object} Chart configuration
 */
function createBudgetUsageChart(budgets, transactions) {
    if (budgets.length === 0) {
        return {
            type: 'bar',
            data: {
                labels: ['No budgets'],
                datasets: [{
                    label: 'Usage',
                    data: [0],
                    backgroundColor: '#E2E8F0',
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        };
    }

    const labels = budgets.map(b => b.name);
    const usageData = budgets.map(b => {
        const usage = calculations.calculateBudgetUsage(transactions, b);
        return usage.percentage;
    });

    // Determine colors based on usage percentage
    const backgroundColors = usageData.map(percentage => {
        if (percentage >= 100) return '#EF4444';
        if (percentage >= 75) return '#F59E0B';
        return '#16A34A';
    });

    return {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Budget Usage %',
                data: usageData,
                backgroundColor: backgroundColors,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            return `${label}: ${value}%`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    };
}

// Export chart functions for use in other modules
window.charts = {
    initChart,
    createIncomeExpensesChart,
    createIncomeExpensesBreakdownChart,
    createExpenseBreakdownChart,
    createSavingsProgressChart,
    createBudgetUsageChart
};
