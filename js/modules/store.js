/**
 * Reactive State Management
 */
import { db } from './db.js';

class Store {
    constructor() {
        this.state = {
            activeProfileId: localStorage.getItem('smarttrack_active_profile') || 'default',
            profiles: [],
            expenses: [],
            budgets: [],
            recurring: [],
            categories: []
        };
        this.listeners = new Set();
    }

    // Subscribe to state changes
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener); // Return unsubscribe function
    }

    // Notify listeners
    notify() {
        for (const listener of this.listeners) {
            listener(this.state);
        }
    }

    // --- Initial Load ---
    async init() {
        // Load profiles first to ensure we have one
        let profiles = await db.getAll('profiles');
        if (profiles.length === 0) {
            const defaultProfile = { id: 'default', name: 'Personal', currency: 'INR' };
            await db.add('profiles', defaultProfile);
            profiles = [defaultProfile];
        }
        
        // Ensure active profile exists, if not fallback to first
        if (!profiles.find(p => p.id === this.state.activeProfileId)) {
            this.state.activeProfileId = profiles[0].id;
            localStorage.setItem('smarttrack_active_profile', this.state.activeProfileId);
        }

        this.state.profiles = profiles;
        await this.loadProfileData(this.state.activeProfileId);
    }

    async loadProfileData(profileId) {
        const [expenses, budgets, recurring, customCategories] = await Promise.all([
            db.getByIndex('expenses', 'profileId', profileId),
            db.getByIndex('budgets', 'profileId', profileId),
            db.getByIndex('recurring', 'profileId', profileId),
            db.getByIndex('categories', 'profileId', profileId)
        ]);

        // Default categories
        const defaultCats = [
            { id: 'food', name: 'Food', color: 'var(--cat-food)', isDefault: true },
            { id: 'transport', name: 'Transport', color: 'var(--cat-transport)', isDefault: true },
            { id: 'bills', name: 'Bills', color: 'var(--cat-bills)', isDefault: true },
            { id: 'shopping', name: 'Shopping', color: 'var(--cat-shopping)', isDefault: true },
            { id: 'entertainment', name: 'Entertainment', color: 'var(--cat-entertainment)', isDefault: true },
            { id: 'health', name: 'Health', color: 'var(--cat-health)', isDefault: true },
            { id: 'education', name: 'Education', color: 'var(--cat-education)', isDefault: true },
            { id: 'other', name: 'Other', color: 'var(--cat-other)', isDefault: true }
        ];

        this.state.categories = [...defaultCats, ...customCategories];

        // Sort expenses by date descending
        expenses.sort((a, b) => new Date(b.date) - new Date(a.date));

        this.state.expenses = expenses;
        this.state.budgets = budgets;
        this.state.recurring = recurring;
        
        this.notify();
    }

    // --- Profile Actions ---
    async setActiveProfile(profileId) {
        if (this.state.activeProfileId !== profileId) {
            this.state.activeProfileId = profileId;
            localStorage.setItem('smarttrack_active_profile', profileId);
            await this.loadProfileData(profileId);
        }
    }

    async addProfile(profile) {
        const newProfile = await db.add('profiles', profile);
        this.state.profiles.push(newProfile);
        this.notify();
        return newProfile;
    }

    getActiveProfileDetails() {
        return this.state.profiles.find(p => p.id === this.state.activeProfileId) || this.state.profiles[0];
    }

    // --- Expense Actions ---
    async addExpense(expense) {
        const newExpense = await db.add('expenses', { ...expense, profileId: this.state.activeProfileId });
        this.state.expenses.unshift(newExpense);
        // Resort just in case
        this.state.expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
        this.notify();
        return newExpense;
    }

    async updateExpense(id, updates) {
        const expense = await db.get('expenses', id);
        if (expense && expense.profileId === this.state.activeProfileId) {
            const updated = await db.put('expenses', { ...expense, ...updates });
            const index = this.state.expenses.findIndex(e => e.id === id);
            if (index !== -1) {
                this.state.expenses[index] = updated;
                this.state.expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
                this.notify();
            }
            return updated;
        }
        throw new Error("Expense not found or does not belong to active profile");
    }

    async deleteExpense(id) {
        const expense = await db.get('expenses', id);
        if (expense && expense.profileId === this.state.activeProfileId) {
            await db.delete('expenses', id);
            // Also delete associated receipt if exists
            try {
                const receipts = await db.getByIndex('receipts', 'expenseId', id);
                if (receipts.length > 0) {
                    await db.delete('receipts', receipts[0].id);
                }
            } catch (e) {
                console.error("Failed to delete associated receipt", e);
            }
            this.state.expenses = this.state.expenses.filter(e => e.id !== id);
            this.notify();
            return true;
        }
        return false;
    }

    // --- Budget Actions ---
    async saveBudget(budget) {
        // Check if budget for category already exists
        const existing = this.state.budgets.find(b => b.category === budget.category);
        if (existing) {
            const updated = await db.put('budgets', { ...existing, limit: budget.limit, period: budget.period || existing.period });
            const index = this.state.budgets.findIndex(b => b.id === existing.id);
            this.state.budgets[index] = updated;
        } else {
            const newBudget = await db.add('budgets', { ...budget, profileId: this.state.activeProfileId });
            this.state.budgets.push(newBudget);
        }
        this.notify();
    }

    async deleteBudget(id) {
        await db.delete('budgets', id);
        this.state.budgets = this.state.budgets.filter(b => b.id !== id);
        this.notify();
    }

    // --- Category Actions ---
    async addCategory(category) {
        const newCat = await db.add('categories', { ...category, profileId: this.state.activeProfileId });
        this.state.categories.push(newCat);
        this.notify();
        return newCat;
    }

    async deleteCategory(id) {
        await db.delete('categories', id);
        this.state.categories = this.state.categories.filter(c => c.id !== id);
        this.notify();
    }

    // --- Receipt Actions ---
    async addReceipt(expenseId, base64Image) {
        // Delete existing receipt for this expense if any
        const existing = await db.getByIndex('receipts', 'expenseId', expenseId);
        if (existing.length > 0) {
            await db.delete('receipts', existing[0].id);
        }
        
        await db.add('receipts', { expenseId, image: base64Image });
        
        // Mark expense as having a receipt
        const expense = await db.get('expenses', expenseId);
        if (expense) {
            expense.hasReceipt = true;
            await db.put('expenses', expense);
            
            const index = this.state.expenses.findIndex(e => e.id === expenseId);
            if (index !== -1) {
                this.state.expenses[index] = expense;
                this.notify();
            }
        }
    }

    async getReceipt(expenseId) {
        const receipts = await db.getByIndex('receipts', 'expenseId', expenseId);
        return receipts.length > 0 ? receipts[0] : null;
    }

    // --- Computed Values ---
    getTotalExpenses(startDate = null, endDate = null) {
        let filtered = this.state.expenses;
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            // Include end date fully
            end.setHours(23, 59, 59, 999);
            filtered = filtered.filter(e => {
                const d = new Date(e.date);
                return d >= start && d <= end;
            });
        }
        return filtered.reduce((total, exp) => total + exp.amount, 0);
    }

    getExpensesByCategory(startDate = null, endDate = null) {
        let filtered = this.state.expenses;
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            filtered = filtered.filter(e => {
                const d = new Date(e.date);
                return d >= start && d <= end;
            });
        }

        const totals = {};
        filtered.forEach(exp => {
            if (!totals[exp.category]) totals[exp.category] = 0;
            totals[exp.category] += exp.amount;
        });
        
        return totals;
    }
}

// Singleton instance
export const store = new Store();
