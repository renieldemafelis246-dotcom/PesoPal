/* Help & About page logic */

/**
 * Initialize help page
 */
function initHelpPage() {
    // Render help content
    renderHelpContent();

    // Setup event listeners
    setupHelpListeners();
}

/**
 * Render help content
 */
function renderHelpContent() {
    const helpContainer = document.getElementById('help-content');
    if (!helpContainer) return;

    helpContainer.innerHTML = `
        <div class="help-section">
            <h2>About PesoPal</h2>
            <p>PesoPal is a personal finance and expense-tracking web application specifically designed for college students. Its purpose is to help students manage their allowances, record expenses, monitor spending habits, create budgets, track savings goals, and understand where their money goes.</p>
            <p><strong>Tagline:</strong> Your Money. Your Goals. Your Future.</p>
            <p><strong>Version:</strong> 1.0.0</p>
        </div>

        <div class="help-section">
            <h2>Getting Started</h2>
            <div class="help-steps">
                <div class="step">
                    <h3>1. Adding Income</h3>
                    <p>Click the "Add Transaction" button on the dashboard or go to the Transactions page. Select "Income" as the transaction type, enter the amount, description, category (e.g., Allowance, Part-time Job), date, and payment method.</p>
                </div>
                <div class="step">
                    <h3>2. Recording Expenses</h3>
                    <p>Similarly, select "Expense" as the transaction type when you spend money. Categorize your expenses correctly to see where your money goes in the reports.</p>
                </div>
                <div class="step">
                    <h3>3. Creating Budgets</h3>
                    <p>Go to the Budgets page and click "Add Budget". Set a monthly limit for categories like Food, Transportation, etc. PesoPal will track your spending against these limits.</p>
                </div>
                <div class="step">
                    <h3>4. Setting Savings Goals</h3>
                    <p>Go to the Savings Goals page and click "Add Goal". Enter your goal name, target amount, and optionally a target date. Record contributions to see your progress.</p>
                </div>
            </div>
        </div>

        <div class="help-section">
            <h2>Features Overview</h2>
            <div class="help-grid">
                <div class="help-card">
                    <h3>📊 Dashboard</h3>
                    <p>Get an overview of your financial health with summary cards, charts, recent transactions, budget progress, and savings goal preview.</p>
                </div>
                <div class="help-card">
                    <h3>💳 Transactions</h3>
                    <p>Manage all your income and expense transactions. Add, edit, delete, search, and filter your financial activities.</p>
                </div>
                <div class="help-card">
                    <h3>📈 Budgets</h3>
                    <p>Create and track monthly budgets by category. See how much you've spent and how much you have left.</p>
                </div>
                <div class="help-card">
                    <h3>🎯 Savings Goals</h3>
                    <p>Set and track savings goals for things like a new laptop, emergency fund, or school expenses.</p>
                </div>
                <div class="help-card">
                    <h3>📋 Reports</h3>
                    <p>View detailed reports on your income, expenses, and spending trends. Export your data as CSV for further analysis.</p>
                </div>
                <div class="help-card">
                    <h3>⚙️ Settings</h3>
                    <p>Customize the app theme, manage your data with backups, and configure preferences.</p>
                </div>
            </div>
        </div>

        <div class="help-section">
            <h2>Frequently Asked Questions</h2>
            <div class="faq">
                <div class="faq-item">
                    <button type="button" class="faq-question" aria-expanded="false">Is my data safe?</button>
                    <p>PesoPal uses your browser's local storage to save data. This means your data stays on your device and is not transmitted to any server. However, if you clear your browser data or use a different device, your data will not be available unless you have exported a backup.</p>
                </div>
                <div class="faq-item">
                    <button type="button" class="faq-question" aria-expanded="false">Can I use PesoPal on multiple devices?</button>
                    <p>Currently, PesoPal stores data locally in your browser. To use it on multiple devices, you would need to export your data from one device and import it on another. We plan to add cloud synchronization in future versions.</p>
                </div>
                <div class="faq-item">
                    <button type="button" class="faq-question" aria-expanded="false">Is PesoPal free to use?</button>
                    <p>Yes, PesoPal is completely free and open-source. There are no hidden fees or premium features.</p>
                </div>
                <div class="faq-item">
                    <button type="button" class="faq-question" aria-expanded="false">What currencies does PesoPal support?</button>
                    <p>Currently, PesoPal supports Philippine Peso (PHP). We plan to add support for other currencies in the future.</p>
                </div>
                <div class="faq-item">
                    <button type="button" class="faq-question" aria-expanded="false">How do I export my data?</button>
                    <p>Go to the Settings page and click the "Export Data" button under Data Management. This will download a JSON file containing all your transactions, budgets, and savings goals.</p>
                </div>
            </div>
        </div>

        <div class="help-section">
            <h2>Technology Stack</h2>
            <ul>
                <li>HTML5, CSS3, JavaScript (ES6+)</li>
                <li>Chart.js for data visualization</li>
                <li>Lucide icons for consistent icons</li>
                <li>Google Fonts (Inter)</li>
                <li>LocalStorage for data persistence</li>
            </ul>
        </div>

        <div class="help-section">
            <h2>Disclaimer</h2>
            <p>PesoPal is an educational personal finance tool and not a bank, financial institution, or professional financial adviser. The information provided by PesoPal is for general informational purposes only and should not be considered professional financial advice.</p>
        </div>
    `;

    const featureIcons = ['layout-dashboard', 'credit-card', 'bar-chart-3', 'target', 'file-text', 'settings'];
    const featureNames = ['Dashboard', 'Transactions', 'Budgets', 'Savings Goals', 'Reports', 'Settings'];
    helpContainer.querySelectorAll('.help-card h3').forEach((heading, index) => {
        heading.textContent = featureNames[index];
        const icon = document.createElement('i');
        icon.dataset.lucide = featureIcons[index];
        heading.prepend(icon);
    });

    // Update Lucide icons
    lucide.createIcons();
}

/**
 * Setup event listeners for help page
 */
function setupHelpListeners() {
    // Add event listeners for any interactive elements in the help page
    // For example, we could make FAQ items accordion-style
    const faqItems = document.querySelectorAll('.faq-question');
    faqItems.forEach(item => {
        item.addEventListener('click', () => {
            const faqItem = item.parentElement;
            faqItem.classList.toggle('active');
            item.setAttribute('aria-expanded', faqItem.classList.contains('active') ? 'true' : 'false');
            const answer = faqItem.querySelector('p');
            if (answer) {
                if (answer.style.display === 'block') {
                    answer.style.display = 'none';
                } else {
                    answer.style.display = 'block';
                }
            }
        });
    });

    // Initially hide FAQ answers
    const faqAnswers = document.querySelectorAll('.faq-item p');
    faqAnswers.forEach(answer => {
        answer.style.display = 'none';
    });
}

// Export functions for use in other modules (if needed)
window.help = {
    initHelpPage,
    renderHelpContent,
    setupHelpListeners
};

// Initialize the page when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHelpPage);
} else {
    initHelpPage();
}
