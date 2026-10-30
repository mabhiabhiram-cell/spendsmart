export const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export const roundCurrency = (value) => {
  const safeValue = Number.isFinite(value) ? Number(value) : 0
  return Math.round((safeValue + Number.EPSILON) * 100) / 100
}

export const safeNumber = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export const formatCurrency = (value) => currencyFormatter.format(roundCurrency(value || 0))

export const getLocalMonthKey = (date = new Date()) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export const monthKeyFromDate = (dateValue) => {
  if (!dateValue) return null
  const date = new Date(`${dateValue}T12:00:00`)
  if (Number.isNaN(date.getTime())) return null
  return getLocalMonthKey(date)
}

export const isSameMonth = (dateValue, monthKey) => monthKeyFromDate(dateValue) === monthKey

export const getMonthRangeStart = (monthKey) => {
  if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) return null
  const [year, month] = monthKey.split('-').map(Number)
  return new Date(year, month - 1, 1)
}

export const getMonthRangeEnd = (monthKey) => {
  if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) return null
  const [year, month] = monthKey.split('-').map(Number)
  return new Date(year, month, 0, 23, 59, 59, 999)
}

export const monthOptions = (count = 12) => {
  const options = []
  const today = new Date()
  const base = new Date(today.getFullYear(), today.getMonth(), 1)
  for (let i = count - 1; i >= 0; i -= 1) {
    const monthDate = new Date(base.getFullYear(), base.getMonth() - i, 1)
    const year = monthDate.getFullYear()
    const month = String(monthDate.getMonth() + 1).padStart(2, '0')
    options.push(`${year}-${month}`)
  }
  return options
}

export const getSelectedMonthLabel = (monthKey) => {
  if (!monthKey) return 'No month selected'
  const [year, month] = monthKey.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleString('en-IN', {
    month: 'long',
    year: 'numeric',
  })
}

export const getFilteredTransactions = (transactions, filters = {}) => {
  const {
    monthKey,
    type,
    category,
    search = '',
  } = filters

  return transactions.filter((transaction) => {
    const matchesMonth = !monthKey || isSameMonth(transaction.date, monthKey)
    const matchesType = !type || type === 'all' || transaction.type === type
    const matchesCategory = !category || category === 'all' || transaction.category === category
    const searchValue = search.trim().toLowerCase()
    const matchesSearch =
      !searchValue ||
      transaction.description.toLowerCase().includes(searchValue) ||
      (transaction.notes || '').toLowerCase().includes(searchValue)

    return matchesMonth && matchesType && matchesCategory && matchesSearch
  })
}

export const getTransactionTotals = (transactions) => {
  const income = transactions
    .filter((entry) => entry.type === 'income')
    .reduce((sum, entry) => sum + safeNumber(entry.amount), 0)

  const expense = transactions
    .filter((entry) => entry.type === 'expense')
    .reduce((sum, entry) => sum + safeNumber(entry.amount), 0)

  return { income, expense, balance: income - expense }
}

export const getMonthlySummary = (transactions, monthKey) => {
  const monthlyTransactions = transactions.filter((entry) => isSameMonth(entry.date, monthKey))
  const { income, expense, balance } = getTransactionTotals(monthlyTransactions)
  const savingsRate = income > 0 ? (balance / income) * 100 : 0

  return {
    income,
    expense,
    balance,
    savingsRate,
    transactions: monthlyTransactions,
  }
}

export const getCategoryTotals = (transactions, monthKey) => {
  const byCategory = {}
  const monthlyTransactions = transactions.filter((entry) => isSameMonth(entry.date, monthKey))

  monthlyTransactions.forEach((transaction) => {
    if (transaction.type !== 'expense') return
    byCategory[transaction.category] = (byCategory[transaction.category] || 0) + safeNumber(transaction.amount)
  })

  return Object.entries(byCategory)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)
}

export const getMonthlyComparison = (transactions, months = 6) => {
  const result = []
  const lastMonthDate = new Date()
  lastMonthDate.setDate(1)

  for (let index = months - 1; index >= 0; index -= 1) {
    const date = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth() - index, 1)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const { income, expense } = getMonthlySummary(transactions, monthKey)
    result.push({
      monthKey,
      name: date.toLocaleString('en-IN', { month: 'short' }),
      income,
      expense,
      balance: income - expense,
    })
  }

  return result
}

export const getBudgetUsage = (budgetState = {}, transactions = [], monthKey) => {
  const monthlyBudget = budgetState[monthKey] || { totalBudget: 0, categoryBudgets: {} }
  const spent = transactions
    .filter((entry) => entry.type === 'expense' && isSameMonth(entry.date, monthKey))
    .reduce((sum, entry) => sum + safeNumber(entry.amount), 0)

  const totalBudget = safeNumber(monthlyBudget.totalBudget)
  const remaining = totalBudget - spent
  const percentageUsed = totalBudget > 0 ? (spent / totalBudget) * 100 : 0

  return {
    totalBudget,
    spent,
    remaining,
    percentageUsed,
  }
}

export const getBudgetStatus = (spent, limit) => {
  if (!limit || limit <= 0) return { label: 'No budget set', tone: 'neutral' }
  const pct = (spent / limit) * 100

  if (pct >= 100) return { label: 'Budget exceeded', tone: 'danger' }
  if (pct >= 75) return { label: 'Approaching limit', tone: 'warning' }
  return { label: 'On track', tone: 'success' }
}

export const getCategoryBudgetMetrics = (budgetState = {}, transactions = [], monthKey, category) => {
  const categoryBudget = (budgetState[monthKey]?.categoryBudgets || {})[category] || 0
  const spent = transactions
    .filter((entry) => entry.type === 'expense' && entry.category === category && isSameMonth(entry.date, monthKey))
    .reduce((sum, entry) => sum + safeNumber(entry.amount), 0)

  return {
    limit: safeNumber(categoryBudget),
    spent,
    remaining: safeNumber(categoryBudget) - spent,
    percentageUsed: safeNumber(categoryBudget) > 0 ? (spent / safeNumber(categoryBudget)) * 100 : 0,
  }
}

export const validateAmount = (value) => {
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount <= 0) {
    return 'Enter a valid amount greater than zero.'
  }
  return ''
}

export const createUniqueId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `tx-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export const isValidDateString = (value) => {
  if (!value) return false
  const date = new Date(value + 'T12:00:00')
  return !Number.isNaN(date.getTime())
}

export const toNumberInput = (value) => Number.isFinite(Number(value)) ? Number(value) : 0
