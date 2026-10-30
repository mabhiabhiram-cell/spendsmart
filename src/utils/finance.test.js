import { describe, expect, it } from 'vitest'
import {
  getBudgetUsage,
  getCategoryTotals,
  getFilteredTransactions,
  getMonthlySummary,
  getTransactionTotals,
  monthKeyFromDate,
  validateAmount,
} from './finance'

describe('finance utilities', () => {
  it('calculates monthly totals and balance correctly', () => {
    const transactions = [
      { type: 'income', amount: 60000, date: '2026-10-01', category: 'Salary', description: 'Pay' },
      { type: 'income', amount: 5000, date: '2026-10-12', category: 'Freelance', description: 'Gig' },
      { type: 'expense', amount: 18000, date: '2026-10-04', category: 'Housing', description: 'Rent' },
      { type: 'expense', amount: 3500, date: '2026-10-08', category: 'Food & Dining', description: 'Groceries' },
      { type: 'expense', amount: 1000, date: '2026-09-30', category: 'Shopping', description: 'Previous' },
    ]

    const totals = getTransactionTotals(transactions)
    expect(totals.income).toBe(65000)
    expect(totals.expense).toBe(22500)
    expect(totals.balance).toBe(42500)

    const monthly = getMonthlySummary(transactions, '2026-10')
    expect(monthly.income).toBe(65000)
    expect(monthly.expense).toBe(21500)
    expect(monthly.balance).toBe(43500)
  })

  it('handles zero-income savings rate safely', () => {
    const summary = getMonthlySummary([
      { type: 'expense', amount: 5000, date: '2026-10-03', category: 'Housing', description: 'Rent' },
    ], '2026-10')

    expect(summary.income).toBe(0)
    expect(summary.balance).toBe(-5000)
    expect(summary.savingsRate).toBe(0)
  })

  it('aggregates spend by category', () => {
    const totals = getCategoryTotals([
      { type: 'expense', amount: 2000, date: '2026-10-01', category: 'Food & Dining', description: 'Groceries' },
      { type: 'expense', amount: 1500, date: '2026-10-02', category: 'Food & Dining', description: 'Meals' },
      { type: 'expense', amount: 4000, date: '2026-10-03', category: 'Transportation', description: 'Fuel' },
      { type: 'income', amount: 7000, date: '2026-10-04', category: 'Salary', description: 'Pay' },
    ], '2026-10')

    expect(totals).toEqual([
      { category: 'Transportation', total: 4000 },
      { category: 'Food & Dining', total: 3500 },
    ])
  })

  it('filters transactions by month, type, category, and search', () => {
    const entries = [
      { type: 'income', amount: 1200, date: '2026-10-01', category: 'Salary', description: 'Pay', notes: 'Main' },
      { type: 'expense', amount: 400, date: '2026-10-13', category: 'Food & Dining', description: 'Coffee', notes: 'Cafe' },
      { type: 'expense', amount: 250, date: '2026-09-20', category: 'Travel', description: 'Tickets', notes: 'Flight' },
    ]

    const filtered = getFilteredTransactions(entries, {
      monthKey: '2026-10',
      type: 'expense',
      category: 'Food & Dining',
      search: 'coffee',
    })

    expect(filtered).toHaveLength(1)
    expect(filtered[0].description).toBe('Coffee')
  })

  it('validates invalid amounts', () => {
    expect(validateAmount('0')).toMatch(/greater than zero/i)
    expect(validateAmount('abc')).toMatch(/valid amount/i)
    expect(validateAmount('1500')).toBe('')
  })

  it('handles month boundaries correctly', () => {
    expect(monthKeyFromDate('2026-01-31')).toBe('2026-01')
    expect(monthKeyFromDate('2026-02-28')).toBe('2026-02')
    expect(monthKeyFromDate('2024-02-29')).toBe('2024-02')
  })

  it('tracks budget usage thresholds', () => {
    const budgetState = {
      '2026-10': {
        totalBudget: 8000,
        categoryBudgets: { 'Food & Dining': 2000 },
      },
    }

    const usage = getBudgetUsage(budgetState, [
      { type: 'expense', amount: 1800, date: '2026-10-05', category: 'Food & Dining', description: 'Groceries' },
      { type: 'expense', amount: 3000, date: '2026-10-09', category: 'Bills & Utilities', description: 'Electricity' },
    ], '2026-10')

    expect(usage.spent).toBe(4800)
    expect(usage.remaining).toBe(3200)
    expect(usage.percentageUsed).toBeCloseTo(60)
  })
})
