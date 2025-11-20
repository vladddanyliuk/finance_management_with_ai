# Finance Management with AI

A Next.js 14 application for planning monthly finances, tracking transactions, and experimenting with AI-generated savings plans. Data stays in the browser via localStorage with optional auto-backups, and everything runs entirely on the client except for the optional OpenAI-powered month planner endpoint.

## Features
- **Custom months**: Create any month (YYYY-MM) and view income/expense summaries with seasonal visual cues.
- **Recurring expenses & defaults**: Configure default monthly income and recurring costs (mandatory or optional) that roll into each month’s summary.
- **Transaction tracking**: Add, edit, filter, and delete income/expense transactions with categories and notes.
- **AI month plans (optional)**: Generate markdown budgeting plans by sending context to `/api/month-plan` using your own OpenAI API key stored in settings.
- **PDF export**: Download AI-generated month plans directly from the month detail page.
- **Auto-backups**: Maintain a rolling history of state snapshots based on your configurable backup limit.
- **Offline-friendly**: All state (settings, transactions, backups, and plans) persists locally in the browser; no external database required.

## Tech stack
- **Framework**: Next.js App Router with React 18 client components.
- **Styling**: Tailwind CSS and Heroicons.
- **Date & utilities**: date-fns for formatting plus custom summary and storage helpers.
- **PDF**: jsPDF for exporting generated plans.

## Project structure
- `app/` – Next.js routes, including the dashboard (`page.tsx`), month details (`months/[month]/page.tsx`), transactions, settings, backups, and API routes.
- `components/` – Reusable UI elements such as cards, navigation, transaction forms, and modals.
- `lib/` – Domain logic for state management (`useFinanceData`), persistence (`storage`), summarization (`summary`), and shared types/constants.
- `public/` – Static assets such as icons and animations.

## Getting started
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the development server:
   ```bash
   npm run dev
   ```
3. Open http://localhost:3000 in your browser.

### Optional: enable AI month plans
1. Obtain an OpenAI API key.
2. Open **Settings** in the app and enter the key; it is stored only in localStorage.
3. Choose an AI behavior or scenario on a month page and generate the plan.

## Data & backups
- State is stored in `localStorage` under a versioned key; hydration occurs on first load.
- Auto-backups create timestamped snapshots of settings, transactions, and month plans up to your configured limit.
- Backup exports use a JSON file that includes version metadata for future compatibility.

## Scripts
- `npm run dev` – Start the development server.
- `npm run build` – Create an optimized production build.
- `npm run start` – Run the production server.
- `npm run lint` – Lint the project with ESLint.

## License
This project is licensed under the **Creative Commons Attribution-NonCommercial 4.0 International License**. You may use and adapt the code for non-commercial purposes with proper attribution. Commercial use of any kind is not permitted. See [LICENSE](LICENSE) for full details.
