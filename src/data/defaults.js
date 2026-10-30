export const STORAGE_KEY = 'spendsmart-budget-data'
export const STORAGE_VERSION = 1

export const incomeCategories = [
  'Salary',
  'Freelance',
  'Business',
  'Investment',
  'Gift',
  'Other',
]

export const expenseCategories = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Bills & Utilities',
  'Entertainment',
  'Healthcare',
  'Education',
  'Travel',
  'Housing',
  'Other',
]

export const allCategories = [...incomeCategories, ...expenseCategories]

export const createEmptyBudgetState = () => ({
  totalBudget: 0,
  categoryBudgets: {},
})

export const getDefaultMonthKey = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export const demoTransactions = [
  {
    id: 'demo-1',
    type: 'income',
    category: 'Salary',
    description: 'Monthly salary',
    amount: 68000,
    date: '2026-10-02',
    notes: 'Primary income',
  },
  {
    id: 'demo-2',
    type: 'expense',
    category: 'Housing',
    description: 'Apartment rent',
    amount: 18000,
    date: '2026-10-04',
    notes: 'Monthly rent',
  },
  {
    id: 'demo-3',
    type: 'expense',
    category: 'Food & Dining',
    description: 'Groceries and snacks',
    amount: 5200,
    date: '2026-10-08',
    notes: 'Weekly groceries',
  },
  {
    id: 'demo-4',
    type: 'expense',
    category: 'Transportation',
    description: 'Fuel and commute',
    amount: 2400,
    date: '2026-10-11',
    notes: 'Metro and fuel',
  },
  {
    id: 'demo-5',
    type: 'income',
    category: 'Freelance',
    description: 'Design project',
    amount: 12000,
    date: '2026-10-18',
    notes: 'Side project payout',
  },
  {
    id: 'demo-6',
    type: 'expense',
    category: 'Shopping',
    description: 'Office essentials',
    amount: 3600,
    date: '2026-10-20',
    notes: 'Desk supplies',
  },
  {
    id: 'demo-7',
    type: 'expense',
    category: 'Entertainment',
    description: 'Streaming and outings',
    amount: 2500,
    date: '2026-10-24',
    notes: 'Weekend plan',
  },
  {
    id: 'demo-8',
    type: 'income',
    category: 'Investment',
    description: 'Dividend payout',
    amount: 4500,
    date: '2026-09-28',
    notes: 'Quarterly dividend',
  },
]

export const demoBudgets = {
  '2026-10': {
    totalBudget: 42000,
    categoryBudgets: {
      'Food & Dining': 7000,
      'Transportation': 4000,
      Shopping: 5000,
      'Bills & Utilities': 6500,
      Entertainment: 4000,
      Healthcare: 3500,
      Education: 2000,
      Travel: 5000,
      Housing: 18000,
      Other: 2000,
    },
  },
}
