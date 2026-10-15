/* Form validation */

/**
 * Validate transaction form
 * @param {Object} formData - Form data object
 * @returns {Object} Object with isValid boolean and errors array
 */
function validateTransaction(formData) {
    const errors = [];

    if (!formData.type || !(formData.type === 'income' || formData.type === 'expense')) {
        errors.push('Transaction type is required');
    }

    if (!formData.description || formData.description.trim() === '') {
        errors.push('Description is required');
    }

    const amount = parseFloat(formData.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
        errors.push('Amount must be a positive number');
    }

    if (!formData.category || formData.category.trim() === '') {
        errors.push('Category is required');
    }

    if (!formData.date) {
        errors.push('Date is required');
    } else {
        const date = new Date(formData.date);
        if (isNaN(date.getTime())) {
            errors.push('Invalid date');
        }
    }

    // Payment method is optional, but if provided, validate
    if (formData.paymentMethod && formData.paymentMethod.trim() === '') {
        errors.push('Payment method cannot be empty if provided');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validate budget form
 * @param {Object} formData - Form data object
 * @returns {Object} Object with isValid boolean and errors array
 */
function validateBudget(formData) {
    const errors = [];

    if (!formData.name || formData.name.trim() === '') {
        errors.push('Budget name is required');
    }

    if (!formData.category || formData.category.trim() === '') {
        errors.push('Category is required');
    }

    const amount = parseFloat(formData.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
        errors.push('Budget amount must be a positive number');
    }

    if (!formData.startDate) {
        errors.push('Start date is required');
    } else {
        const date = new Date(formData.startDate);
        if (isNaN(date.getTime())) {
            errors.push('Invalid start date');
        }
    }

    // End date is optional, but if provided, validate
    if (formData.endDate) {
        const date = new Date(formData.endDate);
        if (isNaN(date.getTime())) {
            errors.push('Invalid end date');
        } else if (formData.startDate) {
            const startDate = new Date(formData.startDate);
            if (date < startDate) {
                errors.push('End date must be after start date');
            }
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validate savings goal form
 * @param {Object} formData - Form data object
 * @returns {Object} Object with isValid boolean and errors array
 */
function validateSavingsGoal(formData) {
    const errors = [];

    if (!formData.name || formData.name.trim() === '') {
        errors.push('Goal name is required');
    }

    const target = parseFloat(formData.targetAmount);
    if (!Number.isFinite(target) || target <= 0) {
        errors.push('Target amount must be a positive number');
    }

    const saved = parseFloat(formData.savedAmount);
    if (!Number.isFinite(saved) || saved < 0) {
        errors.push('Saved amount must be a non-negative number');
    }

    if (saved > target) {
        errors.push('Saved amount cannot exceed target amount');
    }

    // Target date is optional, but if provided, validate
    if (formData.targetDate) {
        const date = new Date(formData.targetDate);
        if (isNaN(date.getTime())) {
            errors.push('Invalid target date');
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Show form errors in the UI
 * @param {HTMLElement} formElement - Form element
 * @param {Array} errors - Array of error messages
 */
function showFormErrors(formElement, errors) {
    // Remove existing error messages
    const existingErrors = formElement.querySelectorAll('.validation-error');
    existingErrors.forEach(el => el.remove());

    // Add error messages after each relevant input
    errors.forEach(error => {
        // For simplicity, we'll show all errors at the top of the form
        // In a more refined approach, we'd associate errors with specific fields
        const errorDiv = document.createElement('div');
        errorDiv.className = 'validation-error';
        errorDiv.style.color = 'var(--error)';
        errorDiv.style.marginTop = '0.25rem';
        errorDiv.style.display = 'block';
        errorDiv.textContent = error;
        formElement.prepend(errorDiv);
    });
}

/**
 * Clear form errors
 * @param {HTMLElement} formElement - Form element
 */
function clearFormErrors(formElement) {
    const existingErrors = formElement.querySelectorAll('.validation-error');
    existingErrors.forEach(el => el.remove());
}

// Export validation functions for use in other modules
window.validation = {
    validateTransaction,
    validateBudget,
    validateSavingsGoal,
    showFormErrors,
    clearFormErrors
};
