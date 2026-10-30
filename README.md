# SpendSmart — Personal Finance Tracker

SpendSmart is a responsive personal finance tracker built with React, Vite, Tailwind CSS, and Recharts. It helps you manage income, expenses, budgets, and reporting in a clean dashboard without requiring a backend or API keys.

## Features

- Dashboard with total income, expenses, balance, and savings-rate cards
- Responsive transaction form for income and expense entries
- Editable and deletable transaction history with search and filters
- Monthly budget tracking with category limits and overspending states
- Recharts-based reports for income comparisons and balance trends
- localStorage persistence with safe JSON import/export
- Demo data loading and quick reset controls

## Technology stack

- React + Vite
- JavaScript JSX
- Tailwind CSS
- Recharts
- Lucide React
- localStorage

## Prerequisites

- Node.js 18+
- npm 9+

## Installation

```bash
npm install
```

## Development server

```bash
npm run dev -- --host 0.0.0.0 --port 4173
```

## Production build

```bash
npm run build
```

## Test command

```bash
npm test
```

## Project structure

```text
src/
  components/
    layout/
  context/
  data/
  utils/
  App.jsx
  main.jsx
  index.css
```

## How localStorage works

The app saves transactions and budgets in the browser using a stable storage key and versioned payload. On startup it safely reads the saved JSON and falls back to an empty state if the data is missing or malformed.

## Data backup and privacy

- Data is stored only in the current browser.
- There is no cloud sync or encryption.
- Backup files are JSON/CSV exports and should be kept on a trusted device.
- Do not import files from unknown sources.

## Manual testing checklist

- Add an income and expense transaction.
- Edit a transaction and confirm totals update.
- Delete a transaction and confirm dashboard values change.
- Combine month, type, and category filters together.
- Save total and category budgets for a month.
- Check overspending and warning thresholds.
- Export and import a JSON backup file.

## Troubleshooting

- If the app does not start, run `npm install` and confirm Node.js is installed.
- If data disappears after a refresh, verify localStorage is enabled in the browser.
- If the build fails, make sure dependencies are installed and you are using a supported Node.js version.

