import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRightLeft,
  ChevronUp,
  FileDown,
  FileUp,
  LayoutGrid,
  PiggyBank,
  Plus,
  Wallet,
  X,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Sidebar from './components/layout/Sidebar'
import { useAppContext } from './context/AppContext'
import { allCategories, expenseCategories, incomeCategories } from './data/defaults'
import {
  formatCurrency,
  getBudgetUsage,
  getCategoryTotals,
  getFilteredTransactions,
  getMonthlyComparison,
  getMonthlySummary,
  getSelectedMonthLabel,
  monthKeyFromDate,
  monthOptions,
  validateAmount,
} from './utils/finance'

const chartColors = ['#10b981', '#34d399', '#fbbf24', '#f97316', '#f43f5e', '#a78bfa', '#60a5fa']

function App() {
  const { transactions, budgets, selectedMonth, setSelectedMonth, addTransaction, updateTransaction, deleteTransaction, setBudgetMonth, clearAll, loadDemoData, importData } = useAppContext()
  const [page, setPage] = useState('dashboard')
  const [showTransactionForm, setShowTransactionForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [historyMonth, setHistoryMonth] = useState(selectedMonth)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortField, setSortField] = useState('date')
  const [sortDirection, setSortDirection] = useState('desc')
  const [budgetDraft, setBudgetDraft] = useState({ totalBudget: '', categoryBudgets: {} })
  const [formData, setFormData] = useState({
    type: 'expense',
    category: expenseCategories[0],
    description: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    notes: '',
  })
  const [validationMessage, setValidationMessage] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [backupText, setBackupText] = useState('')

  const summary = useMemo(() => getMonthlySummary(transactions, selectedMonth), [transactions, selectedMonth])
  const monthlyComparison = useMemo(() => getMonthlyComparison(transactions, 6), [transactions])
  const categoryTotals = useMemo(() => getCategoryTotals(transactions, selectedMonth), [transactions, selectedMonth])
  const monthBudget = budgets[selectedMonth] || { totalBudget: 0, categoryBudgets: {} }
  const monthlyBudgetUsage = useMemo(() => getBudgetUsage(budgets, transactions, selectedMonth), [budgets, transactions, selectedMonth])

  const historyTransactions = useMemo(() => {
    const filtered = getFilteredTransactions(transactions, {
      monthKey: historyMonth,
      type: typeFilter,
      category: categoryFilter,
      search,
    })

    return filtered.sort((a, b) => {
      const aValue = sortField === 'amount' ? Number(a.amount) : new Date(a.date).getTime()
      const bValue = sortField === 'amount' ? Number(b.amount) : new Date(b.date).getTime()
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [transactions, historyMonth, typeFilter, categoryFilter, search, sortField, sortDirection])

  const totalHistoryIncome = transactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + Number(item.amount), 0)
  const totalHistoryExpense = transactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + Number(item.amount), 0)

  const openNewTransaction = () => {
    setEditingId(null)
    setFormData({
      type: 'expense',
      category: expenseCategories[0],
      description: '',
      amount: '',
      date: new Date().toISOString().slice(0, 10),
      notes: '',
    })
    setValidationMessage('')
    setShowTransactionForm(true)
  }

  const openEditTransaction = (transaction) => {
    setEditingId(transaction.id)
    setFormData({
      type: transaction.type,
      category: transaction.category,
      description: transaction.description,
      amount: String(transaction.amount),
      date: transaction.date,
      notes: transaction.notes || '',
    })
    setValidationMessage('')
    setShowTransactionForm(true)
  }

  const handleFormChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const handleSubmitTransaction = (event) => {
    event.preventDefault()
    const amountError = validateAmount(formData.amount)
    if (amountError) {
      setValidationMessage(amountError)
      return
    }

    const payload = {
      ...formData,
      amount: Number(formData.amount),
      description: formData.description.trim(),
      notes: formData.notes.trim(),
      date: formData.date || new Date().toISOString().slice(0, 10),
      category: formData.category || (formData.type === 'income' ? incomeCategories[0] : expenseCategories[0]),
    }

    const success = editingId
      ? updateTransaction(editingId, payload)
      : addTransaction(payload)

    if (!success) {
      setValidationMessage('Complete the transaction fields with a valid positive amount.')
      return
    }

    setShowTransactionForm(false)
    setValidationMessage('')
    setFormData({
      type: 'expense',
      category: expenseCategories[0],
      description: '',
      amount: '',
      date: new Date().toISOString().slice(0, 10),
      notes: '',
    })
  }

  const saveBudget = () => {
    const totalBudget = Number(budgetDraft.totalBudget || 0)
    const categoryMap = Object.entries(budgetDraft.categoryBudgets || {}).reduce((acc, [category, value]) => {
      const parsed = Number(value || 0)
      if (Number.isFinite(parsed) && parsed >= 0) acc[category] = parsed
      return acc
    }, {})

    setBudgetMonth(selectedMonth, { totalBudget, categoryBudgets: categoryMap })
    setStatusMessage('Monthly budget saved.')
  }

  const handleExport = () => {
    const csv = [
      ['id', 'type', 'category', 'description', 'amount', 'date', 'notes'],
      ...transactions.map((item) => [item.id, item.type, item.category, item.description, item.amount, item.date, item.notes || '']),
    ]
      .map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anker = document.createElement('a')
    anker.href = url
    anker.download = 'spendsmart-transactions.csv'
    anker.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    if (!backupText.trim()) {
      setStatusMessage('Paste a valid JSON backup before importing.')
      return
    }

    try {
      const parsed = JSON.parse(backupText)
      const ok = importData(parsed)
      if (!ok) {
        setStatusMessage('The JSON structure is not supported.')
        return
      }
      setBackupText('')
      setStatusMessage('Import successful.')
    } catch (error) {
      setStatusMessage('Import failed. Please provide valid JSON.')
    }
  }

  const handleResetAll = () => {
    const shouldReset = typeof window !== 'undefined' && window.confirm('Clear all saved data from this browser?')
    if (shouldReset) {
      clearAll()
      setStatusMessage('All app data cleared.')
    }
  }

  const resetFilters = () => {
    setSearch('')
    setTypeFilter('all')
    setCategoryFilter('all')
    setSortField('date')
    setSortDirection('desc')
  }

  const infoCards = [
    { label: 'Total income', value: formatCurrency(summary.income), accent: 'emerald', icon: Wallet },
    { label: 'Total expenses', value: formatCurrency(summary.expense), accent: 'rose', icon: ArrowRightLeft },
    { label: 'Remaining monthly balance', value: formatCurrency(summary.balance), accent: 'sky', icon: LayoutGrid },
    { label: 'Savings rate', value: `${summary.income > 0 ? ((summary.balance / summary.income) * 100).toFixed(1) : '0.0'}%`, accent: 'amber', icon: PiggyBank },
  ]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="mx-auto flex max-w-7xl flex-col lg:flex-row">
        <Sidebar currentPage={page} onNavigate={setPage} />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">SpendSmart</p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">
                {page === 'dashboard' && 'Dashboard'}
                {page === 'transactions' && 'Transactions'}
                {page === 'budgets' && 'Budgets'}
                {page === 'reports' && 'Reports'}
              </h1>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                <span className="font-medium text-slate-600">Month</span>
                <select
                  value={selectedMonth}
                  onChange={(event) => {
                    setSelectedMonth(event.target.value)
                    setHistoryMonth(event.target.value)
                  }}
                  className="bg-transparent font-medium text-slate-800 outline-none"
                >
                  {monthOptions(18).map((monthKey) => (
                    <option key={monthKey} value={monthKey}>{getSelectedMonthLabel(monthKey)}</option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={openNewTransaction}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
              >
                <Plus className="h-4 w-4" />
                Add transaction
              </button>
            </div>
          </header>

          {page === 'dashboard' && (
            <div className="space-y-6">
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {infoCards.map((card) => (
                  <MetricCard key={card.label} {...card} />
                ))}
              </section>

              <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
                <Panel title="Income vs expense">
                  <div className="h-72 w-full">
                    <ResponsiveContainer>
                      <LineChart data={monthlyComparison}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                        <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} name="Income" />
                        <Line type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4 }} name="Expenses" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Panel>

                <Panel title="Expense breakdown">
                  <ExpenseDonutChart data={categoryTotals} />
                </Panel>
              </section>

              <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
                <Panel title="Recent transactions">
                  <div className="space-y-3">
                    {transactions.slice(0, 5).length ? (
                      transactions.slice(0, 5).map((item) => (
                        <div key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3">
                          <div>
                            <div className="font-medium text-slate-800">{item.description}</div>
                            <div className="text-xs text-slate-500">{item.category} • {item.date}</div>
                          </div>
                          <div className="text-right">
                            <div className={item.type === 'income' ? 'font-semibold text-emerald-600' : 'font-semibold text-rose-500'}>
                              {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                            </div>
                            <button type="button" className="text-xs text-slate-500" onClick={() => openEditTransaction(item)}>Edit</button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <EmptyState text="No transactions yet. Add a few entries to see your dashboard fill up." />
                    )}
                  </div>
                </Panel>

                <div className="space-y-6">
                  <Panel title="Monthly budget">
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between text-slate-600"><span>Spent</span><span className="font-semibold text-slate-800">{formatCurrency(monthlyBudgetUsage.spent)}</span></div>
                      <div className="flex items-center justify-between text-slate-600"><span>Budget</span><span className="font-semibold text-slate-800">{formatCurrency(monthlyBudgetUsage.totalBudget)}</span></div>
                      <div className="flex items-center justify-between text-slate-600"><span>Left</span><span className="font-semibold text-slate-800">{formatCurrency(monthlyBudgetUsage.remaining)}</span></div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, monthlyBudgetUsage.percentageUsed)}%` }} />
                      </div>
                    </div>
                  </Panel>

                  <Panel title="Top spending categories">
                    <div className="space-y-3">
                      {categoryTotals.length ? (
                        categoryTotals.slice(0, 5).map((item) => (
                          <div key={item.category}>
                            <div className="mb-1 flex items-center justify-between text-sm">
                              <span className="text-slate-600">{item.category}</span>
                              <span className="font-medium text-slate-800">{formatCurrency(item.total)}</span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-100">
                              <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${Math.min(100, (item.total / Math.max(...categoryTotals.map((cat) => cat.total), 1)) * 100)}%` }} />
                            </div>
                          </div>
                        ))
                      ) : (
                        <EmptyState text="Spend on categories to build insights." />
                      )}
                    </div>
                  </Panel>
                </div>
              </section>
            </div>
          )}

          {page === 'transactions' && (
            <div className="space-y-6">
              <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-1 flex-col gap-3 md:flex-row">
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search description or notes"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 md:max-w-xs"
                    />
                    <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-300">
                      <option value="all">All types</option>
                      <option value="income">Income</option>
                      <option value="expense">Expense</option>
                    </select>
                    <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-300">
                      <option value="all">All categories</option>
                      {allCategories.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    <select value={historyMonth} onChange={(event) => setHistoryMonth(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-300">
                      {monthOptions(18).map((monthKey) => (
                        <option key={monthKey} value={monthKey}>{getSelectedMonthLabel(monthKey)}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <button type="button" onClick={resetFilters} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">Clear</button>
                    <button type="button" onClick={handleExport} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-white">
                      <FileDown className="h-4 w-4" />
                      Export CSV
                    </button>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">History</h2>
                    <p className="text-sm text-slate-500">{historyTransactions.length} results • {formatCurrency(totalHistoryIncome)} income • {formatCurrency(totalHistoryExpense)} expenses</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <label className="text-slate-500">Sort</label>
                    <select value={sortField} onChange={(event) => setSortField(event.target.value)} className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm">
                      <option value="date">Date</option>
                      <option value="amount">Amount</option>
                    </select>
                    <button type="button" className="rounded-lg border border-slate-200 px-2 py-1.5" onClick={() => setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))}>{sortDirection === 'asc' ? 'Asc' : 'Desc'}</button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-200 text-sm text-slate-500">
                        <th className="px-3 py-3 font-medium">Description</th>
                        <th className="px-3 py-3 font-medium">Type</th>
                        <th className="px-3 py-3 font-medium">Category</th>
                        <th className="px-3 py-3 font-medium">Date</th>
                        <th className="px-3 py-3 font-medium">Amount</th>
                        <th className="px-3 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyTransactions.length ? (
                        historyTransactions.map((item) => (
                          <tr key={item.id} className="border-b border-slate-100 align-middle">
                            <td className="px-3 py-3">
                              <div className="font-medium text-slate-800">{item.description}</div>
                              <div className="text-xs text-slate-500">{item.notes || 'No notes'}</div>
                            </td>
                            <td className="px-3 py-3">
                              <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${item.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{item.type}</span>
                            </td>
                            <td className="px-3 py-3 text-slate-600">{item.category}</td>
                            <td className="px-3 py-3 text-slate-600">{item.date}</td>
                            <td className={`px-3 py-3 font-semibold ${item.type === 'income' ? 'text-emerald-600' : 'text-rose-500'}`}>{item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}</td>
                            <td className="px-3 py-3">
                              <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => openEditTransaction(item)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700">Edit</button>
                                <button type="button" onClick={() => { if (typeof window !== 'undefined' && window.confirm('Delete this transaction?')) deleteTransaction(item.id) }} className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-medium text-rose-600">Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="px-3 py-8">
                            <EmptyState text="No transaction matches the current search and filters." />
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {page === 'budgets' && (
            <div className="space-y-6">
              <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                <Panel title="Budget planner">
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-slate-700">
                      Total monthly budget
                      <input
                        type="number"
                        min="0"
                        value={budgetDraft.totalBudget}
                        onChange={(event) => setBudgetDraft((current) => ({ ...current, totalBudget: event.target.value }))}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-emerald-300 focus:outline-none"
                      />
                    </label>

                    <div className="space-y-3">
                      {expenseCategories.map((category) => (
                        <label key={category} className="block text-sm font-medium text-slate-700">
                          {category}
                          <input
                            type="number"
                            min="0"
                            value={budgetDraft.categoryBudgets[category] ?? ''}
                            onChange={(event) => setBudgetDraft((current) => ({
                              ...current,
                              categoryBudgets: {
                                ...current.categoryBudgets,
                                [category]: event.target.value,
                              },
                            }))}
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-emerald-300 focus:outline-none"
                          />
                        </label>
                      ))}
                    </div>

                    <button type="button" onClick={saveBudget} className="w-full rounded-xl bg-emerald-500 px-4 py-2.5 font-semibold text-white">Save budget</button>
                    {statusMessage && <p className="text-sm text-emerald-700">{statusMessage}</p>}
                  </div>
                </Panel>

                <Panel title="Budget status for this month">
                  <div className="space-y-4">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <div className="flex items-center justify-between text-sm text-slate-500">
                        <span>Monthly total</span>
                        <span className="font-semibold text-slate-800">{formatCurrency(monthBudget.totalBudget || 0)}</span>
                      </div>
                      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, monthlyBudgetUsage.percentageUsed)}%` }} />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                        <span>Spent {formatCurrency(monthlyBudgetUsage.spent)}</span>
                        <span>Remaining {formatCurrency(monthlyBudgetUsage.remaining)}</span>
                      </div>
                    </div>

                    {expenseCategories.map((category) => {
                      const limit = monthBudget.categoryBudgets?.[category] || 0
                      const spent = transactions.filter((item) => item.type === 'expense' && item.category === category && monthKeyFromDate(item.date) === selectedMonth).reduce((sum, item) => sum + Number(item.amount), 0)
                      const remaining = limit - spent
                      const percent = limit > 0 ? (spent / limit) * 100 : 0
                      const state = percent >= 100 ? 'Overspent' : percent >= 75 ? 'Approaching limit' : 'On track'

                      return (
                        <div key={category} className="rounded-2xl border border-slate-200 p-3">
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-slate-800">{category}</div>
                            <span className={`rounded-full px-2 py-1 text-xs font-medium ${percent >= 100 ? 'bg-rose-100 text-rose-700' : percent >= 75 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{state}</span>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                            <span>Spent {formatCurrency(spent)}</span>
                            <span>Limit {formatCurrency(limit)}</span>
                          </div>
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, percent)}%` }} />
                          </div>
                          <div className="mt-2 text-xs text-slate-500">Remaining: {formatCurrency(remaining)}</div>
                        </div>
                      )
                    })}
                  </div>
                </Panel>
              </section>
            </div>
          )}

          {page === 'reports' && (
            <div className="space-y-6">
              <section className="grid gap-6 xl:grid-cols-2">
                <Panel title="Monthly income vs expense">
                  <div className="h-72 w-full">
                    <ResponsiveContainer>
                      <BarChart data={monthlyComparison}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                        <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Income" />
                        <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Expenses" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Panel>

                <Panel title="Balance trend">
                  <div className="h-72 w-full">
                    <ResponsiveContainer>
                      <AreaChart data={monthlyComparison}>
                        <defs>
                          <linearGradient id="balanceFill" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.7} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Area type="monotone" dataKey="balance" stroke="#3b82f6" fill="url(#balanceFill)" name="Balance" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Panel>
              </section>

              <Panel title="Selected period totals">
                <div className="grid gap-4 md:grid-cols-3">
                  <StatCard label="Income" value={formatCurrency(summary.income)} tone="emerald" />
                  <StatCard label="Expense" value={formatCurrency(summary.expense)} tone="rose" />
                  <StatCard label="Balance" value={formatCurrency(summary.balance)} tone="sky" />
                </div>
              </Panel>
            </div>
          )}
        </main>
      </div>

      {showTransactionForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">{editingId ? 'Edit transaction' : 'Add transaction'}</h2>
              <button type="button" onClick={() => setShowTransactionForm(false)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitTransaction} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  Type
                  <select name="type" value={formData.type} onChange={(event) => {
                    const nextType = event.target.value
                    setFormData((current) => ({
                      ...current,
                      type: nextType,
                      category: nextType === 'income' ? incomeCategories[0] : expenseCategories[0],
                    }))
                  }} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-emerald-300 focus:outline-none">
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Category
                  <select name="category" value={formData.category} onChange={handleFormChange} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-emerald-300 focus:outline-none">
                    {(formData.type === 'income' ? incomeCategories : expenseCategories).map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block text-sm font-medium text-slate-700">
                Description
                <input type="text" name="description" value={formData.description} onChange={handleFormChange} placeholder="Groceries, salary, rent" className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-emerald-300 focus:outline-none" />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  Amount
                  <input type="number" min="0.01" step="0.01" name="amount" value={formData.amount} onChange={handleFormChange} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-emerald-300 focus:outline-none" />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Date
                  <input type="date" name="date" value={formData.date} onChange={handleFormChange} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-emerald-300 focus:outline-none" />
                </label>
              </div>

              <label className="block text-sm font-medium text-slate-700">
                Notes (optional)
                <textarea name="notes" value={formData.notes} onChange={handleFormChange} rows="3" className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-emerald-300 focus:outline-none" />
              </label>

              {validationMessage && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  {validationMessage}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowTransactionForm(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700">Cancel</button>
                <button type="submit" className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white">{editingId ? 'Save changes' : 'Add entry'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="fixed bottom-5 right-5 z-30 flex flex-col gap-2">
        <button type="button" onClick={handleResetAll} className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">Reset all data</button>
        <button type="button" onClick={loadDemoData} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">Load demo</button>
      </div>

      <div className="backup-import-drawer fixed bottom-5 right-5 z-30 w-80">
        <section className="backup-import-drawer__panel rounded-2xl border border-slate-200 bg-white p-3 shadow-soft">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">Backup & import</h3>
            <ChevronUp className="backup-import-drawer__indicator h-4 w-4 text-slate-500" aria-hidden="true" />
          </div>
          <textarea value={backupText} onChange={(event) => setBackupText(event.target.value)} rows="3" placeholder="Paste a JSON export" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-emerald-300" />
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={handleImport} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold text-white">
              <FileUp className="h-3.5 w-3.5" />
              Import
            </button>
            <button type="button" onClick={handleExport} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">
              <FileDown className="h-3.5 w-3.5" />
              Export
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

function MetricCard({ label, value, accent, icon: Icon }) {
  const toneMap = {
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
    sky: 'bg-sky-50 text-sky-600',
    amber: 'bg-amber-50 text-amber-600',
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${toneMap[accent]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

function Panel({ title, children }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">{title}</h2>
      {children}
    </div>
  )
}

function EmptyState({ text }) {
  return <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">{text}</div>
}

function ExpenseDonutChart({ data }) {
  const total = data.reduce((sum, item) => sum + item.total, 0)
  if (!data.length || total === 0) return <EmptyState text="No expense data for the selected timeframe." />

  const pieData = data.map((item, index) => ({ ...item, color: chartColors[index % chartColors.length] }))

  return (
    <div className="flex flex-col items-center gap-4 xl:flex-row xl:items-start">
      <div className="h-52 w-full max-w-[220px]">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={pieData} dataKey="total" nameKey="category" innerRadius={42} outerRadius={74} paddingAngle={2}>
              {pieData.map((entry) => (
                <Cell key={entry.category} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(value)} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="w-full space-y-2">
        {pieData.map((entry, index) => (
          <div key={entry.category} className="flex items-center justify-between gap-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} />
              <span className="text-slate-600">{entry.category}</span>
            </div>
            <span className="font-medium text-slate-800">{formatCurrency(entry.total)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatCard({ label, value, tone }) {
  const toneMap = {
    emerald: 'text-emerald-600',
    rose: 'text-rose-600',
    sky: 'text-sky-600',
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${toneMap[tone]}`}>{value}</p>
    </div>
  )
}

export default App
