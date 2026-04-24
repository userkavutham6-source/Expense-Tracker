/**
 * Input validation and sanitization
 */

/**
 * Basic HTML sanitization to prevent XSS.
 * Replaces < > & " ' with HTML entities.
 */
export const sanitizeHTML = (str) => {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>"']/g, function(match) {
        const entities = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return entities[match];
    });
};

/**
 * Safely sets text content on an element, avoiding innerHTML
 */
export const setSafeText = (element, text) => {
    if (!element) return;
    element.textContent = text;
};

/**
 * Safely creates an element with attributes and children
 */
export const createElement = (tag, attributes = {}, ...children) => {
    const el = document.createElement(tag);
    
    for (const [key, value] of Object.entries(attributes)) {
        if (key === 'className') {
            el.className = value;
        } else if (key.startsWith('data-')) {
            el.setAttribute(key, value);
        } else if (key === 'onclick') {
            el.addEventListener('click', value);
        } else if (key === 'onchange') {
            el.addEventListener('change', value);
        } else {
            el[key] = value;
        }
    }
    
    children.forEach(child => {
        if (typeof child === 'string' || typeof child === 'number') {
            el.appendChild(document.createTextNode(child));
        } else if (child instanceof Node) {
            el.appendChild(child);
        }
    });
    
    return el;
};

/**
 * Validates an expense object
 */
export const validateExpense = (expense) => {
    const errors = [];

    if (!expense.amount || isNaN(expense.amount) || expense.amount <= 0) {
        errors.push('Amount must be a positive number');
    }

    if (!expense.date) {
        errors.push('Date is required');
    }

    if (!expense.category) {
        errors.push('Category is required');
    }

    if (!expense.description || expense.description.trim() === '') {
        errors.push('Description is required');
    } else if (expense.description.length > 200) {
        errors.push('Description must be less than 200 characters');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Validates a budget object
 */
export const validateBudget = (budget) => {
    const errors = [];

    if (!budget.limit || isNaN(budget.limit) || budget.limit <= 0) {
        errors.push('Budget limit must be a positive number');
    }

    if (!budget.category) {
        errors.push('Category is required');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};
