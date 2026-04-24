/**
 * Expenses List and Form View
 */
import { store } from '../modules/store.js';
import { formatCurrency, formatDate, getCategoryLabel } from '../modules/utils.js';
import { validateExpense, sanitizeHTML } from '../modules/validator.js';

let currentFilter = { category: '', search: '' };

export const renderExpenses = (container) => {
    const currency = store.getActiveProfileDetails().currency;
    let filteredExpenses = store.state.expenses;

    if (currentFilter.category) {
        filteredExpenses = filteredExpenses.filter(e => e.category === currentFilter.category);
    }
    if (currentFilter.search) {
        const query = currentFilter.search.toLowerCase();
        filteredExpenses = filteredExpenses.filter(e => 
            e.description.toLowerCase().includes(query) || 
            e.amount.toString().includes(query)
        );
    }

    container.innerHTML = `
        <div class="card" style="margin-bottom: var(--space-6);">
            <div style="display: flex; flex-wrap: wrap; gap: var(--space-4); align-items: center; justify-content: space-between;">
                <div style="display: flex; gap: var(--space-4); flex: 1; min-width: 250px;">
                    <input type="text" id="expense-search" class="form-control" placeholder="Search expenses..." value="${currentFilter.search}" style="flex: 2;">
                    <select id="expense-filter-cat" class="form-control" style="flex: 1;">
                        <option value="">All Categories</option>
                        ${store.state.categories.map(c => `<option value="${c.id}" ${currentFilter.category === c.id ? 'selected' : ''}>${sanitizeHTML(c.name)}</option>`).join('')}
                    </select>
                </div>
                <button class="btn btn-primary" id="add-expense-btn-main">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    <span>Add New</span>
                </button>
            </div>
        </div>

        <div class="card" style="padding: 0; overflow: hidden;">
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Description</th>
                            <th>Category</th>
                            <th class="text-right">Amount</th>
                            <th class="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="expense-list-body">
                        ${filteredExpenses.length > 0 ? filteredExpenses.map(exp => `
                            <tr>
                                <td>
                                    ${formatDate(exp.date)}
                                    ${exp.isRecurring ? `<span class="badge" style="background-color: var(--primary-light); color: var(--primary); margin-left: 4px;" title="Recurring">R</span>` : ''}
                                    ${exp.hasReceipt ? `<button class="icon-btn view-receipt-btn" data-id="${exp.id}" title="View Receipt" style="width:20px; height:20px; padding:0; margin-left:4px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg></button>` : ''}
                                </td>
                                <td>${sanitizeHTML(exp.description)}</td>
                                <td>
                                    <span class="badge" style="background-color: var(--cat-${exp.category}); color: white;">
                                        ${sanitizeHTML(getCategoryLabel(exp.category))}
                                    </span>
                                </td>
                                <td class="text-right font-medium">${formatCurrency(exp.amount, currency)}</td>
                                <td class="text-right">
                                    <button class="icon-btn edit-expense-btn" data-id="${exp.id}" title="Edit">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                    </button>
                                    <button class="icon-btn delete-expense-btn text-danger" data-id="${exp.id}" title="Delete">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                    </button>
                                </td>
                            </tr>
                        `).join('') : `<tr><td colspan="5" class="text-center text-muted" style="padding: var(--space-8);">No expenses found.</td></tr>`}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // Event Listeners
    const searchInput = document.getElementById('expense-search');
    const catSelect = document.getElementById('expense-filter-cat');
    const addBtn = document.getElementById('add-expense-btn-main');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentFilter.search = e.target.value;
            renderExpenses(container);
            
            // Restore focus and cursor position
            const newSearchInput = document.getElementById('expense-search');
            if (newSearchInput) {
                newSearchInput.focus();
                const len = newSearchInput.value.length;
                newSearchInput.setSelectionRange(len, len);
            }
        });
    }

    if (catSelect) {
        catSelect.addEventListener('change', (e) => {
            currentFilter.category = e.target.value;
            renderExpenses(container);
        });
    }

    if (addBtn) {
        addBtn.addEventListener('click', () => showExpenseModal());
    }

    // Edit/Delete buttons
    document.querySelectorAll('.edit-expense-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const expense = store.state.expenses.find(ex => ex.id === id);
            if (expense) showExpenseModal(expense);
        });
    });

    document.querySelectorAll('.delete-expense-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            if (confirm("Are you sure you want to delete this expense?")) {
                await store.deleteExpense(id);
                renderExpenses(container);
                showToast("Expense deleted successfully", "success");
            }
        });
    });

    document.querySelectorAll('.view-receipt-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const receipt = await store.getReceipt(id);
            if (receipt) {
                showReceiptModal(receipt.image);
            } else {
                showToast("Receipt not found", "error");
            }
        });
    });
};

const showReceiptModal = (base64Image) => {
    const modalContainer = document.getElementById('modal-container');
    const modalContent = document.getElementById('modal-content');
    
    modalContent.innerHTML = `
        <div class="modal-header">
            <h3>Receipt Image</h3>
            <button class="icon-btn" id="close-receipt-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </div>
        <div class="modal-body" style="text-align: center; background: #000;">
            <img src="${base64Image}" style="max-width: 100%; max-height: 70vh; object-fit: contain;">
        </div>
    `;
    
    modalContainer.classList.remove('hidden');
    const close = () => modalContainer.classList.add('hidden');
    document.getElementById('close-receipt-btn').addEventListener('click', close);
};

// Global function to show modal (used by topbar button too)
export const showExpenseModal = (expense = null) => {
    const modalContainer = document.getElementById('modal-container');
    const modalContent = document.getElementById('modal-content');
    
    const isEdit = !!expense;
    const today = new Date().toISOString().split('T')[0];

    modalContent.innerHTML = `
        <div class="modal-header">
            <h3>${isEdit ? 'Edit Expense' : 'Add Expense'}</h3>
            <button class="icon-btn" id="close-modal-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </div>
        <div class="modal-body">
            <form id="expense-form">
                <input type="hidden" id="expense-id" value="${isEdit ? expense.id : ''}">
                
                <div class="form-group">
                    <label class="form-label">Amount</label>
                    <input type="number" id="expense-amount" class="form-control" step="0.01" min="0.01" required value="${isEdit ? expense.amount : ''}">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Category</label>
                    <select id="expense-category" class="form-control" required>
                        ${store.state.categories.map(c => `<option value="${c.id}" ${isEdit && expense.category === c.id ? 'selected' : (!isEdit && c.id === 'other' ? 'selected' : '')}>${sanitizeHTML(c.name)}</option>`).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Receipt Image</label>
                    <input type="file" id="expense-receipt" class="form-control" accept="image/*">
                    <div class="text-muted" style="font-size: 0.75rem; margin-top: 4px;">Optional. Max size 2MB recommended.</div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Date</label>
                    <input type="date" id="expense-date" class="form-control" required value="${isEdit ? expense.date : today}">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Description</label>
                    <input type="text" id="expense-desc" class="form-control" required value="${isEdit ? sanitizeHTML(expense.description) : ''}">
                </div>

                <div id="form-errors" class="text-danger" style="margin-bottom: var(--space-3); font-size: 0.875rem;"></div>
            </form>
        </div>
        <div class="modal-footer">
            <button class="btn btn-outline" id="cancel-modal-btn">Cancel</button>
            <button class="btn btn-primary" id="save-expense-btn">Save Expense</button>
        </div>
    `;

    modalContainer.classList.remove('hidden');

    // Close logic
    const closeModal = () => modalContainer.classList.add('hidden');
    document.getElementById('close-modal-btn').addEventListener('click', closeModal);
    document.getElementById('cancel-modal-btn').addEventListener('click', closeModal);
    modalContainer.querySelector('.modal-backdrop').addEventListener('click', closeModal);

    // Save logic
    document.getElementById('save-expense-btn').addEventListener('click', async () => {
        const newExpense = {
            amount: parseFloat(document.getElementById('expense-amount').value),
            category: document.getElementById('expense-category').value,
            date: document.getElementById('expense-date').value,
            description: document.getElementById('expense-desc').value.trim()
        };

        const validation = validateExpense(newExpense);
        const errorDiv = document.getElementById('form-errors');
        
        if (!validation.isValid) {
            errorDiv.innerHTML = validation.errors.map(e => `<div>• ${e}</div>`).join('');
            return;
        }

        const fileInput = document.getElementById('expense-receipt');
        const file = fileInput.files[0];
        
        // Simple file size check (approx 5MB)
        if (file && file.size > 5 * 1024 * 1024) {
            errorDiv.innerHTML = "<div>• Receipt image must be less than 5MB</div>";
            return;
        }

        let receiptBase64 = null;
        if (file) {
            receiptBase64 = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = e => resolve(e.target.result);
                reader.readAsDataURL(file);
            });
        }

        try {
            let savedExpense;
            if (isEdit) {
                savedExpense = await store.updateExpense(expense.id, newExpense);
                showToast("Expense updated successfully", "success");
            } else {
                newExpense.isRecurring = false;
                savedExpense = await store.addExpense(newExpense);
                showToast("Expense added successfully", "success");
            }
            
            if (receiptBase64 && savedExpense) {
                await store.addReceipt(savedExpense.id, receiptBase64);
            }
            
            closeModal();
            
            // Re-render if we are on the expenses view
            if (window.location.hash === '#/expenses') {
                renderExpenses(document.querySelector('.view-section.active'));
            } else {
                // If on dashboard or other view, a simple hash change will re-render
                const currentHash = window.location.hash;
                window.dispatchEvent(new HashChangeEvent('hashchange', { newURL: currentHash, oldURL: currentHash }));
            }
        } catch (error) {
            errorDiv.textContent = "Error saving expense.";
            console.error(error);
        }
    });
};

export const showToast = (message, type = 'info') => {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast`;
    
    let icon = '';
    if (type === 'success') {
        icon = `<svg class="text-success" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
    } else if (type === 'error') {
        icon = `<svg class="text-danger" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
    }

    toast.innerHTML = `
        ${icon}
        <div style="flex: 1;">${sanitizeHTML(message)}</div>
    `;

    container.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Remove after delay
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};
