# PesoPal

PesoPal is a browser based personal finance tracker for students. It records income and expenses, category budgets, savings goals, and date filtered reports. The app is built with plain HTML, CSS, and JavaScript; it has no server or account system.

## Features

- Overview dashboard with balance, income, expenses, budget remaining, recent transactions, budget progress, savings progress, and charts.
- Transactions with add, edit, confirm before delete, description search, type and category filters, and sorting.
- Category budgets with date periods, spent and remaining amounts, and progress warnings.
- Savings goals with target amounts and recorded contributions.
- Reports with date range selection, income and expense summaries, spending categories, and date filtered CSV export.
- Light and dark themes, date display preferences, JSON backup and restore, and confirmed data clearing. Currency is Philippine peso.
- Editable profile name and photo, stored in the current browser.
- Responsive layout for desktop, tablet, and mobile.

## Technology

- HTML5, CSS3, and browser JavaScript (no build framework or package manager).
- Chart.js, Lucide icons, and Inter are loaded from CDNs.
- LocalStorage is used for financial records and browser local storage for theme and display preferences.

## Project structure

```text
index.html              Overview
pages/                  Transactions, budgets, savings, reports, settings, help
css/                    Shared and responsive styles
js/                     Page logic, storage, calculations, validation, charts
assets/                 Static assets
```

## Run locally

Open `index.html` in a modern browser, or serve the project directory with any static web server. No dependency installation or build step is required. For example, with Python installed:

```sh
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Data and privacy

Financial data is stored in the browser under `pesoPalData`. New installations start with empty records. Data remains in that browser profile and is not synchronized or sent to a backend. Use Settings to export a JSON backup or restore a valid backup. Clear All Data deletes financial records after confirmation. Corrupt stored data is not silently replaced: editing is paused until you import a backup or confirm clearing the unreadable records.

## Pages

- **Overview:** financial totals and summaries based on saved records.
- **Transactions:** manage, search, filter, and sort transactions.
- **Budgets:** create and manage category limits for date periods.
- **Savings:** create goals and record contributions.
- **Reports:** view totals and charts for a selected date range; export transaction data as CSV.
- **Settings:** theme and date display preferences, JSON backup/restore, and data clearing. Currency is Philippine peso (PHP).
- **Help:** usage guidance and application information.

## Checks and limitations

The project has no configured package scripts, lint command, or automated test suite. The app requires network access for CDN hosted fonts, icons, and Chart.js. Storage is local to one browser; there is no sync, authentication, or backend. See the final implementation report for checks performed during the current repair.
