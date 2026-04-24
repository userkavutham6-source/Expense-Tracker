/**
 * Utility functions for formatting and date manipulation
 */

import { store } from './store.js';

export const formatCurrency = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
};

export const formatDate = (dateString, options = {}) => {
    const defaultOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    const date = new Date(dateString);
    // Adjust for timezone offset to prevent off-by-one day errors
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
    return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(adjustedDate);
};

export const generateId = () => {
    return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
};

export const getCategoryColor = (categoryId) => {
    if (!store.state.categories) return 'var(--cat-other)';
    const cat = store.state.categories.find(c => c.id === categoryId);
    return cat ? cat.color : 'var(--cat-other)';
};

export const getCategoryLabel = (categoryId) => {
    if (!categoryId) return 'Other';
    if (!store.state.categories) return categoryId.charAt(0).toUpperCase() + categoryId.slice(1);
    
    const cat = store.state.categories.find(c => c.id === categoryId);
    return cat ? cat.name : categoryId.charAt(0).toUpperCase() + categoryId.slice(1);
};

export const debounce = (func, delay) => {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
};

export const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
};

export const getStartOfMonth = (date) => {
    const d = new Date(date);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
};

export const isSameDay = (d1, d2) => {
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
};
