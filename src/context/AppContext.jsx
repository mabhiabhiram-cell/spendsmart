import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { demoBudgets, demoTransactions, STORAGE_KEY, STORAGE_VERSION } from '../data/defaults'
import { createUniqueId, getLocalMonthKey, isValidDateString, safeNumber } from '../utils/finance'

const AppContext = createContext(null)

const validateTransaction = (transaction) => {
  if (!transaction || !transaction.type || !transaction.category || !transaction.description) {
    return false
  }

  if (!isValidDateString(transaction.date)) {
    return false
  }

  return Number.isFinite(Number(transaction.amount)) && Number(transaction.amount) > 0
}

const normalizeTransactions = (payload = []) => {
  if (!Array.isArray(payload)) return []

  return payload
    .filter(Boolean)
    .map((item, index) => ({
      id: item.id || `tx-${index + 1}`,
      type: item.type === 'expense' ? 'expense' : 'income',
      category: item.category || 'Other',
      description: String(item.description || 'Untitled transaction'),
      amount: safeNumber(item.amount),
      date: isValidDateString(item.date) ? item.date : getLocalMonthKey(),
      notes: String(item.notes || ''),
    }))
    .filter((item) => validateTransaction(item))
}

const normalizeBudgets = (payload = {}) => {
  if (!payload || typeof payload !== 'object') return {}

  return Object.entries(payload).reduce((collection, [monthKey, budget]) => {
    if (!monthKey || typeof budget !== 'object') return collection
    const totalBudget = safeNumber(budget.totalBudget)
    const categoryBudgets = Object.entries(budget.categoryBudgets || {}).reduce((acc, [category, value]) => {
      const amount = safeNumber(value)
      if (category && amount >= 0) acc[category] = amount
      return acc
    }, {})

    collection[monthKey] = { totalBudget, categoryBudgets }
    return collection
  }, {})
}

const parseStoredData = (rawValue) => {
  if (!rawValue) return { transactions: [], budgets: {} }

  try {
    const parsed = JSON.parse(rawValue)
    if (!parsed || typeof parsed !== 'object') return { transactions: [], budgets: {} }
    return {
      transactions: normalizeTransactions(parsed.transactions || []),
      budgets: normalizeBudgets(parsed.budgets || {}),
    }
} catch {
    return { transactions: [], budgets: {} }
  }
}

const readStorage = () => {
  if (typeof window === 'undefined') return { transactions: [], budgets: {} }
  try {
    return parseStoredData(window.localStorage.getItem(STORAGE_KEY))
} catch {
    return { transactions: [], budgets: {} }
  }
}

const writeStorage = (transactions, budgets) => {
  if (typeof window === 'undefined') return
  try {
    const payload = { version: STORAGE_VERSION, transactions, budgets }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
} catch {
  console.warn('Local storage is not available.')
  }
}

export function AppProvider({ children }) {
  const [transactions, setTransactions] = useState(() => readStorage().transactions)
  const [budgets, setBudgets] = useState(() => readStorage().budgets)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const stored = readStorage()
    return stored.transactions[0]?.date ? stored.transactions[0].date.slice(0, 7) : getLocalMonthKey()
  })

  useEffect(() => {
    writeStorage(transactions, budgets)
  }, [transactions, budgets])

  const addTransaction = (transaction) => {
    const next = {
      ...transaction,
      id: transaction.id || createUniqueId(),
      amount: safeNumber(transaction.amount),
      description: String(transaction.description || '').trim(),
      notes: String(transaction.notes || ''),
      date: transaction.date || getLocalMonthKey(),
      type: transaction.type === 'income' ? 'income' : 'expense',
      category: transaction.category || 'Other',
    }

    if (!validateTransaction(next)) return false

    setTransactions((current) => [next, ...current])
    return true
  }

  const updateTransaction = (id, updated) => {
    const next = {
      ...updated,
      id,
      amount: safeNumber(updated.amount),
      description: String(updated.description || '').trim(),
      notes: String(updated.notes || ''),
      date: updated.date || getLocalMonthKey(),
      type: updated.type === 'income' ? 'income' : 'expense',
      category: updated.category || 'Other',
    }

    if (!validateTransaction(next)) return false

    setTransactions((current) => current.map((item) => (item.id === id ? next : item)))
    return true
  }

  const deleteTransaction = (id) => {
    setTransactions((current) => current.filter((item) => item.id !== id))
  }

  const setBudgetMonth = (monthKey, partialBudget) => {
    setBudgets((current) => ({
      ...current,
      [monthKey]: {
        totalBudget: safeNumber(partialBudget?.totalBudget ?? 0),
        categoryBudgets: partialBudget?.categoryBudgets || {},
      },
    }))
  }

  const clearAll = () => {
    setTransactions([])
    setBudgets({})
  }

  const loadDemoData = () => {
    setTransactions(demoTransactions)
    setBudgets(demoBudgets)
    setSelectedMonth('2026-10')
  }

  const importData = (incomingData) => {
    if (!incomingData || typeof incomingData !== 'object') return false

    const nextTransactions = normalizeTransactions(incomingData.transactions || [])
    const nextBudgets = normalizeBudgets(incomingData.budgets || {})

    if (!Array.isArray(incomingData.transactions)) return false

    setTransactions(nextTransactions)
    setBudgets(nextBudgets)
    return true
  }

  const value = useMemo(
    () => ({
      transactions,
      budgets,
      selectedMonth,
      setSelectedMonth,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      setBudgetMonth,
      clearAll,
      loadDemoData,
      importData,
    }),
    [transactions, budgets, selectedMonth]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useAppContext must be used inside AppProvider')
  return context
}
