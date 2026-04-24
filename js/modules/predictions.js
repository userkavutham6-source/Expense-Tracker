/**
 * Spending predictions and insights
 */
import { store } from './store.js';

export const getSpendingInsights = () => {
    const expenses = store.state.expenses;
    if (expenses.length === 0) return null;

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const currentMonthStart = new Date(currentYear, currentMonth, 1);
    const lastMonthStart = new Date(currentYear, currentMonth - 1, 1);
    const lastMonthEnd = new Date(currentYear, currentMonth, 0);

    let currentMonthTotal = 0;
    let lastMonthTotal = 0;
    
    expenses.forEach(exp => {
        const d = new Date(exp.date);
        if (d >= currentMonthStart && d <= today) {
            currentMonthTotal += exp.amount;
        } else if (d >= lastMonthStart && d <= lastMonthEnd) {
            lastMonthTotal += exp.amount;
        }
    });

    // Calculate daily average for current month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysPassed = today.getDate();
    
    const dailyAverageCurrent = currentMonthTotal / daysPassed;
    const projectedTotal = dailyAverageCurrent * daysInMonth;
    
    const isProjectedHigher = projectedTotal > lastMonthTotal;
    const percentageDiff = lastMonthTotal > 0 ? 
        ((projectedTotal - lastMonthTotal) / lastMonthTotal * 100).toFixed(1) : 0;

    return {
        currentMonthTotal,
        lastMonthTotal,
        projectedTotal,
        isProjectedHigher,
        percentageDiff: Math.abs(percentageDiff)
    };
};
