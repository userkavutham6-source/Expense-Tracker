/**
 * Budgets View
 */
import { store } from '../modules/store.js';
import { formatCurrency, getCategoryLabel } from '../modules/utils.js';
import { validateBudget, sanitizeHTML } from '../modules/validator.js';
import { showToast } from './expenses.js';

export const renderBudgets = (container) => {
    const state = store.state;
    const currency = store.getActiveProfileDetails().currency;

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Calculate current month spending
    const monthExpensesByCategory = store.getExpensesByCategory(startOfMonth, today);
    const totalMonth = store.getTotalExpenses(startOfMonth, today);

    let budgetsHTML = '';
    
    if (state.budgets.length === 0) {
        budgetsHTML = `
            <div class="text-center card" style="padding: var(--space-8); color: var(--text-muted);">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="margin-bottom: var(--space-4); opacity: 0.5;">
                    <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path>
                </svg>
                <h3>No Budgets Set</h3>
                <p style="margin-top: var(--space-2); margin-bottom: var(--space-4);">Set budgets to track your spending limits.</p>
            </div>
        `;
    } else {
        budgetsHTML = `<div class="grid-cards">`;
        
        state.budgets.forEach(budget => {
            const spent = budget.category === 'total' ? totalMonth : (monthExpensesByCategory[budget.category] || 0);
            const limit = budget.limit;
            const percentage = Math.min(100, (spent / limit) * 100);
            const isOver = spent > limit;
            
            let colorVar = 'var(--success)';
            if (percentage >= 90) colorVar = 'var(--danger)';
            else if (percentage >= 75) colorVar = 'var(--warning)';

            budgetsHTML += `
                <div class="card">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-4);">
                        <div>
                            <h3 style="font-size: 1.125rem;">${budget.category === 'total' ? 'Overall Budget' : sanitizeHTML(getCategoryLabel(budget.category))}</h3>
                            <div style="color: var(--text-secondary); font-size: 0.875rem;">Monthly</div>
                        </div>
                        <button class="icon-btn delete-budget-btn text-danger" data-id="${budget.id}" title="Delete Budget">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                    
                    <div style="font-size: 1.5rem; font-weight: 600; margin-bottom: var(--space-2);">
                        ${formatCurrency(spent, currency)} <span style="font-size: 1rem; color: var(--text-muted); font-weight: 400;">/ ${formatCurrency(limit, currency)}</span>
                    </div>
                    
                    <div class="progress-wrapper">
                        <div class="progress-fill" style="width: ${percentage}%; background-color: ${colorVar};"></div>
                    </div>
                    
                    <div class="budget-info">
                        <span>${percentage.toFixed(0)}% used</span>
                        <span style="color: ${isOver ? 'var(--danger)' : 'inherit'}">${isOver ? 'Over budget by ' + formatCurrency(spent - limit, currency) : formatCurrency(limit - spent, currency) + ' left'}</span>
                    </div>
                </div>
            `;
        });
        
        budgetsHTML += `</div>`;
    }

    container.innerHTML = `
        <div style="display: flex; justify-content: flex-end; margin-bottom: var(--space-6);">
            <button class="btn btn-primary" id="add-budget-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                <span>Set Budget</span>
            </button>
        </div>
        ${budgetsHTML}
    `;

    // Events
    const addBtn = document.getElementById('add-budget-btn');
    if (addBtn) addBtn.addEventListener('click', showBudgetModal);

    document.querySelectorAll('.delete-budget-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            if (confirm("Delete this budget?")) {
                await store.deleteBudget(id);
                renderBudgets(container);
                showToast("Budget deleted", "success");
            }
        });
    });
};

const showBudgetModal = () => {
    const modalContainer = document.getElementById('modal-container');
    const modalContent = document.getElementById('modal-content');

    modalContent.innerHTML = `
        <div class="modal-header">
            <h3>Set Budget</h3>
            <button class="icon-btn" id="close-budget-modal">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </div>
        <div class="modal-body">
            <form id="budget-form">
                <div class="form-group">
                    <label class="form-label">Category</label>
                    <select id="budget-category" class="form-control" required>
                        <option value="total">Overall (All Categories)</option>
                        <option value="food">Food</option>
                        <option value="transport">Transport</option>
                        <option value="bills">Bills</option>
                        <option value="shopping">Shopping</option>
                        <option value="entertainment">Entertainment</option>
                        <option value="health">Health</option>
                        <option value="education">Education</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Monthly Limit</label>
                    <input type="number" id="budget-limit" class="form-control" step="1" min="1" required>
                </div>
                <div id="budget-errors" class="text-danger" style="margin-bottom: var(--space-3); font-size: 0.875rem;"></div>
            </form>
        </div>
        <div class="modal-footer">
            <button class="btn btn-outline" id="cancel-budget-modal">Cancel</button>
            <button class="btn btn-primary" id="save-budget-btn">Save Budget</button>
        </div>
    `;

    modalContainer.classList.remove('hidden');

    const closeModal = () => modalContainer.classList.add('hidden');
    document.getElementById('close-budget-modal').addEventListener('click', closeModal);
    document.getElementById('cancel-budget-modal').addEventListener('click', closeModal);

    document.getElementById('save-budget-btn').addEventListener('click', async () => {
        const budget = {
            category: document.getElementById('budget-category').value,
            limit: parseFloat(document.getElementById('budget-limit').value),
            period: 'monthly'
        };

        const validation = validateBudget(budget);
        const errorDiv = document.getElementById('budget-errors');

        if (!validation.isValid) {
            errorDiv.innerHTML = validation.errors.map(e => `<div>• ${e}</div>`).join('');
            return;
        }

        try {
            await store.saveBudget(budget);
            closeModal();
            showToast("Budget saved", "success");
            renderBudgets(document.querySelector('.view-section.active'));
        } catch (error) {
            errorDiv.textContent = "Error saving budget.";
        }
    });
};
