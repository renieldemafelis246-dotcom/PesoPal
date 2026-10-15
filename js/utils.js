/* Utility functions */

/**
 * Create and show a modal
 * @param {Object} options - Modal options
 * @param {string} options.title - Modal title
 * @param {string} options.content - Modal content HTML
 * @param {Array} options.buttons - Array of button objects {text, class, callback, isPrimary}
 * @param {string} options.size - Modal size ('small', 'medium', 'large')
 * @returns {Object} Modal object with close method
 */
function showModal({ title, content, buttons = [], size = 'medium', onClose } = {}) {
    const returnFocus = document.activeElement;
    // Create modal elements
    const modalContainer = document.createElement('div');
    modalContainer.className = 'modal-container';

    const modalContent = document.createElement('div');
    modalContent.className = `modal-content ${size}`;
    modalContent.setAttribute('role', 'dialog');
    modalContent.setAttribute('aria-modal', 'true');

    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';

    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';

    const modalTitle = document.createElement('h2');
    modalTitle.textContent = title;

    const modalCloseBtn = document.createElement('button');
    modalCloseBtn.className = 'modal-close';
    modalCloseBtn.setAttribute('aria-label', 'Close dialog');
    modalCloseBtn.innerHTML = '<i data-lucide="x"></i>';

    const modalBody = document.createElement('div');
    modalBody.className = 'modal-body';
    modalBody.innerHTML = content;

    const modalFooter = document.createElement('div');
    modalFooter.className = 'modal-footer';

    // Build buttons
    buttons.forEach(buttonConfig => {
        const btn = document.createElement('button');
        btn.textContent = buttonConfig.text;
        btn.className = `btn ${buttonConfig.class || ''} ${buttonConfig.isPrimary ? 'btn-primary' : 'btn-outline'}`;
        if (buttonConfig.callback) {
            btn.addEventListener('click', event => {
                if (modalContainer.dataset.closing === 'true') return;
                buttonConfig.callback(event);
            });
        }
        modalFooter.appendChild(btn);
    });

    // Assemble modal
    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(modalCloseBtn);
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modalContent.appendChild(modalFooter);
    modalContainer.appendChild(modalOverlay);
    modalContainer.appendChild(modalContent);

    // Add to DOM
    document.body.appendChild(modalContainer);
    document.body.classList.add('modal-open');

    // Force reflow for animation
    modalContainer.offsetHeight;

    // Show modal
    modalContainer.classList.add('active');

    // Update Lucide icons
    lucide.createIcons();

    // Close modal when clicking overlay or close button
    const closeModal = () => {
        if (!modalContainer.isConnected || modalContainer.dataset.closing === 'true') return;
        modalContainer.dataset.closing = 'true';
        modalContainer.classList.remove('active');
        document.removeEventListener('keydown', escapeHandler);
        if (typeof onClose === 'function') onClose();
        setTimeout(() => {
            modalContainer.remove();
            if (!document.querySelector('.modal-container.active')) document.body.classList.remove('modal-open');
            if (returnFocus?.isConnected) returnFocus.focus();
        }, 300);
    };

    modalOverlay.addEventListener('click', closeModal);
    modalCloseBtn.addEventListener('click', closeModal);

    // Close modal with Escape key
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);

    // Return modal object with close method
    return {
        close: closeModal,
        container: modalContainer
    };
}

/**
 * Format number as Philippine Peso currency
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
function formatPHP(amount) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

/** Escape untrusted text before placing it in a generated HTML template. */
function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
}

/**
 * Generate a unique ID (simple version)
 * @returns {string} A unique ID
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * Debounce function to limit rate of execution
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function to limit rate of execution
 * @param {Function} func - Function to throttle
 * @param {number} limit - Limit time in ms
 * @returns {Function} Throttled function
 */
function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Get current date in YYYY-MM-DD format
 * @returns {string} Current date string
 */
function getCurrentDate() {
    const today = new Date();
    const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000);
    return localDate.toISOString().split('T')[0];
}

function getDateInputValue(date) {
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().split('T')[0];
}

/**
 * Parse date string to Date object
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {Date} Date object
 */
function parseDate(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
}

/**
 * Format date to display string (MM/DD/YYYY)
 * @param {Date} date - Date object
 * @returns {string} Formatted date string
 */
function formatDate(date) {
    const format = localStorage.getItem('dateFormat') || 'MM/DD/YYYY';
    if (format === 'YYYY-MM-DD') return getDateInputValue(date);
    if (format === 'DD/MM/YYYY') return new Intl.DateTimeFormat('en-PH', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
    return new Intl.DateTimeFormat('en-PH', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
    }).format(date);
}

/**
 * Calculate difference in days between two dates
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {number} Difference in days
 */
function daysDifference(date1, date2) {
    const timeDiff = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
}

/**
 * Clone an object (deep copy for simple objects)
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
function cloneObject(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Remove item from array by ID
 * @param {Array} array - Array of objects with id property
 * @param {string|number} id - ID to remove
 * @returns {Array} New array without the item
 */
function removeById(array, id) {
    return array.filter(item => item.id !== id);
}

/**
 * Find item in array by ID
 * @param {Array} array - Array of objects with id property
 * @param {string|number} id - ID to find
 * @returns {Object|null} Found item or null
 */
function findById(array, id) {
    return array.find(item => item.id === id) || null;
}

/**
 * Show toast notification
 * @param {Object} options - Toast options
 * @param {string} options.message - Message to display
 * @param {string} options.type - Type of toast (success, error, warning, info)
 * @param {number} options.duration - Duration in ms (default 3000)
 */
function showToast({ message, type = 'success', duration = 3000 } = {}) {
    const toastContainer = document.querySelector('.toast-container') || createToastContainer();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i data-lucide="check-circle"></i>
        <div class="toast-content">
            <h3></h3>
            <p></p>
        </div>
        <div class="toast-progress"></div>
    `;

    // Set icon based on type
    const iconMap = {
        success: 'check-circle',
        error: 'alert-triangle',
        warning: 'alert-triangle',
        info: 'info'
    };
    toast.querySelector('i').dataset.lucide = iconMap[type] || 'check-circle';
    toast.querySelector('h3').textContent = message;

    toastContainer.appendChild(toast);

    // Trigger reflow to enable transition
    toast.offsetHeight;

    // Show toast
    toast.classList.add('active');

    // Hide after duration
    setTimeout(() => {
        toast.classList.remove('active');
        setTimeout(() => {
            toast.remove();
        }, 200); // Match transition duration
    }, duration);

    // Update Lucide icons
    lucide.createIcons();
}

/**
 * Create toast container if it doesn't exist
 * @returns {HTMLElement} Toast container element
 */
function createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

function dispatchDataUpdated() {
    document.dispatchEvent(new CustomEvent('data:updated'));
}

function loadProfile() {
    try {
        const profile = JSON.parse(localStorage.getItem('pesoPalProfile') || '{}');
        const photo = typeof profile.photo === 'string' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(profile.photo) ? profile.photo : '';
        const position = profile.photoPosition || {};
        return {
            name: typeof profile.name === 'string' && profile.name.trim() ? profile.name.trim().slice(0, 40) : 'Student',
            photo,
            photoPosition: { x: clampPhotoPosition(position.x), y: clampPhotoPosition(position.y) }
        };
    } catch (error) {
        return { name: 'Student', photo: '' };
    }
}

function saveProfile(profile) {
    try {
        const nextProfile = {
            name: String(profile.name || '').trim().slice(0, 40) || 'Student',
            photo: typeof profile.photo === 'string' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(profile.photo) ? profile.photo : '',
            photoPosition: {
                x: clampPhotoPosition(profile.photoPosition?.x),
                y: clampPhotoPosition(profile.photoPosition?.y)
            }
        };
        localStorage.setItem('pesoPalProfile', JSON.stringify(nextProfile));
        document.dispatchEvent(new CustomEvent('profile:updated'));
        return true;
    } catch (error) {
        showToast({ message: 'Unable to save your profile. Try a smaller image.', type: 'error' });
        return false;
    }
}

function clampPhotoPosition(value) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(0, Math.min(100, number)) : 50;
}

/**
 * Confirm action with user
 * @param {string} message - Confirmation message
 * @returns {Promise<boolean>} True if confirmed
 */
function confirmAction(message) {
    return new Promise((resolve) => {
        let settled = false;
        let modal;
        const settle = confirmed => {
            if (settled) return;
            settled = true;
            resolve(confirmed);
            modal?.close();
        };
        modal = showModal({
            title: 'Please confirm',
            content: `<p>${escapeHtml(message)}</p>`,
            size: 'small',
            buttons: [
                { text: 'Cancel', class: 'btn-outline', callback: () => settle(false) },
                { text: 'Confirm', class: 'btn-primary', isPrimary: true, callback: () => settle(true) }
            ],
            onClose: () => {
                if (!settled) {
                    settled = true;
                    resolve(false);
                }
            }
        });
        const cancelButton = modal.container.querySelector('.modal-footer button');
        cancelButton?.focus();
    });
}

/**
 * Export data as CSV
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Filename for download
 */
function exportToCSV(data, filename = 'export.csv') {
    if (!data.length) {
        showToast({ message: 'No data to export', type: 'warning' });
        return;
    }

    const headers = Object.keys(data[0]);
    const csvRows = [];

    // Add headers
    csvRows.push(headers.join(','));

    // Add data rows
    data.forEach(row => {
        const values = headers.map(header => {
            const value = row[header];
            let text = value == null ? '' : String(value);
            if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
            // Escape quotes and wrap in quotes if contains comma or quote
            const escaped = text.replace(/"/g, '""');
            if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')) {
                return `"${escaped}"`;
            }
            return escaped;
        });
        csvRows.push(values.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Load sample data for demonstration
 * @returns {Object} Sample data object
 */
function loadSampleData() {
    return {
        transactions: [
            {
                id: '1',
                type: 'income',
                description: 'Weekly allowance',
                amount: 2000,
                category: 'Allowance',
                date: '2026-10-01',
                paymentMethod: 'Cash',
                notes: '',
                createdAt: '2026-10-01T08:00:00Z',
                updatedAt: '2026-10-01T08:00:00Z'
            },
            {
                id: '2',
                type: 'expense',
                description: 'Lunch',
                amount: 120,
                category: 'Food & Drinks',
                date: '2026-10-02',
                paymentMethod: 'Cash',
                notes: '',
                createdAt: '2026-10-02T12:30:00Z',
                updatedAt: '2026-10-02T12:30:00Z'
            },
            {
                id: '3',
                type: 'expense',
                description: 'Transportation',
                amount: 80,
                category: 'Transportation',
                date: '2026-10-02',
                paymentMethod: 'Cash',
                notes: 'Jeepney fare',
                createdAt: '2026-10-02T07:15:00Z',
                updatedAt: '2026-10-02T07:15:00Z'
            },
            {
                id: '4',
                type: 'expense',
                description: 'School printing',
                amount: 150,
                category: 'School Expenses',
                date: '2026-10-03',
                paymentMethod: 'Cash',
                notes: 'Research paper',
                createdAt: '2026-10-03T14:00:00Z',
                updatedAt: '2026-10-03T14:00:00Z'
            },
            {
                id: '5',
                type: 'expense',
                description: 'Mobile data',
                amount: 99,
                category: 'Bills & Utilities',
                date: '2026-10-03',
                paymentMethod: 'E-wallet',
                notes: 'Monthly load',
                createdAt: '2026-10-03T19:00:00Z',
                updatedAt: '2026-10-03T19:00:00Z'
            },
            {
                id: '6',
                type: 'income',
                description: 'Part-time job',
                amount: 1500,
                category: 'Allowance',
                date: '2026-10-05',
                paymentMethod: 'Bank transfer',
                notes: 'Weekend tutoring',
                createdAt: '2026-10-05T16:00:00Z',
                updatedAt: '2026-10-05T16:00:00Z'
            },
            {
                id: '7',
                type: 'expense',
                description: 'Groceries',
                amount: 350,
                category: 'Food & Drinks',
                date: '2026-10-06',
                paymentMethod: 'Cash',
                notes: 'Weekend market',
                createdAt: '2026-10-06T10:00:00Z',
                updatedAt: '2026-10-06T10:00:00Z'
            }
        ],
        budgets: [
            {
                id: '1',
                name: 'Monthly Food Budget',
                category: 'Food & Drinks',
                amount: 3000,
                startDate: '2026-10-01',
                endDate: '2026-10-31'
            },
            {
                id: '2',
                name: 'Monthly Transport Budget',
                category: 'Transportation',
                amount: 1500,
                startDate: '2026-10-01',
                endDate: '2026-10-31'
            },
            {
                id: '3',
                name: 'Monthly School Budget',
                category: 'School Expenses',
                amount: 2000,
                startDate: '2026-10-01',
                endDate: '2026-10-31'
            },
            {
                id: '4',
                name: 'Monthly Entertainment Budget',
                category: 'Entertainment',
                amount: 800,
                startDate: '2026-10-01',
                endDate: '2026-10-31'
            }
        ],
        savingsGoals: [
            {
                id: '1',
                name: 'Emergency Fund',
                targetAmount: 5000,
                savedAmount: 1500,
                targetDate: '2026-12-31',
                description: 'For unexpected expenses'
            },
            {
                id: '2',
                name: 'New Laptop',
                targetAmount: 30000,
                savedAmount: 5000,
                targetDate: '2027-06-30',
                description: 'For school projects'
            }
        ]
    };
}

// Export utility functions for use in other modules
window.utils = {
    formatPHP,
    escapeHtml,
    generateId,
    debounce,
    throttle,
    getCurrentDate,
    getDateInputValue,
    parseDate,
    formatDate,
    daysDifference,
    cloneObject,
    removeById,
    findById,
    showToast,
    dispatchDataUpdated,
    loadProfile,
    saveProfile,
    confirmAction,
    exportToCSV,
    loadSampleData,
    showModal
};
