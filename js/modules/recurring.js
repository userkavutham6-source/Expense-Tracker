/**
 * Recurring expenses engine
 */
import { store } from './store.js';
import { db } from './db.js';

export const processRecurringExpenses = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const recurringRules = store.state.recurring;
    
    for (const rule of recurringRules) {
        if (!rule.isActive) continue;

        let nextDueDate = new Date(rule.nextDue);
        
        // If the rule is due today or was due in the past
        while (nextDueDate <= today) {
            // Create the expense
            const newExpense = {
                amount: rule.amount,
                category: rule.category,
                description: rule.description,
                date: nextDueDate.toISOString().split('T')[0], // format YYYY-MM-DD
                isRecurring: true,
                recurringId: rule.id
            };
            
            await store.addExpense(newExpense);

            // Calculate next due date
            nextDueDate = calculateNextDueDate(nextDueDate, rule.frequency);
        }

        // Update the rule with the new nextDue date if it changed
        if (new Date(rule.nextDue).getTime() !== nextDueDate.getTime()) {
            rule.nextDue = nextDueDate.toISOString().split('T')[0];
            await db.put('recurring', rule);
        }
    }
};

const calculateNextDueDate = (currentDate, frequency) => {
    const nextDate = new Date(currentDate);
    switch (frequency) {
        case 'daily':
            nextDate.setDate(nextDate.getDate() + 1);
            break;
        case 'weekly':
            nextDate.setDate(nextDate.getDate() + 7);
            break;
        case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
        case 'yearly':
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
    }
    return nextDate;
};

export const addRecurringRule = async (ruleData) => {
    const rule = {
        ...ruleData,
        profileId: store.state.activeProfileId,
        isActive: true,
        nextDue: ruleData.startDate // Initially next due is start date
    };
    
    const newRule = await db.add('recurring', rule);
    store.state.recurring.push(newRule);
    
    // Process immediately in case it's due today or in the past
    await processRecurringExpenses();
    
    store.notify();
    return newRule;
};
