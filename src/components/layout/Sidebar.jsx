import { ArrowUpRight, BarChart3, CreditCard, LayoutGrid, PiggyBank, ReceiptText } from 'lucide-react'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
  { id: 'transactions', label: 'Transactions', icon: ReceiptText },
  { id: 'budgets', label: 'Budgets', icon: PiggyBank },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
]

export default function Sidebar({ currentPage, onNavigate }) {
  return (
    <aside className="w-full border-b border-slate-200 bg-white/90 p-4 backdrop-blur-sm lg:w-72 lg:border-b-0 lg:border-r">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-sm">
          <CreditCard className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xl font-semibold text-slate-900">SpendSmart</p>
          <p className="text-xs text-slate-500">Finance tracker</p>
        </div>
      </div>

      <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
        {navItems.map(({ id, label, icon: Icon }) => {
          const active = currentPage === id
          return (
            <button
              type="button"
              key={id}
              onClick={() => onNavigate(id)}
              className={[
                'flex min-w-[160px] items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-all',
                active
                  ? 'bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-100'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
              ].join(' ')}
            >
              <Icon className="h-4 w-4" />
              {label}
              {active && <ArrowUpRight className="ml-auto h-4 w-4" />}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
