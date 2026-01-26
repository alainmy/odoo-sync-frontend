# WooCommerce-Odoo Sync Frontend

Frontend application built with React + TypeScript + Tailwind CSS + shadcn/ui for managing WooCommerce-Odoo synchronization.

## Features

- 🔐 **Authentication** - Secure login with JWT
- 📊 **Dashboard** - Real-time sync statistics
- 📦 **Products Management** - View product sync status
- 📁 **Categories Management** - View category sync status
- 🔔 **Webhook Logs** - Monitor incoming webhooks
- ✅ **Task Logs** - Track Celery task execution
- ⚙️ **Settings** - Configure WooCommerce and Odoo connections

## Installation

```bash
cd frontend
npm install
```

## Development

```bash
npm run dev
```

Visit `http://localhost:3000`

## Build

```bash
npm run build
```

## Environment Variables

Create a `.env` file:

```env
VITE_API_URL=http://localhost:8001
```

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **React Query** - Data fetching
- **Zustand** - State management
- **React Router** - Navigation
- **Axios** - HTTP client
- **date-fns** - Date formatting

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── layouts/
│   │   │   └── DashboardLayout.tsx
│   │   └── ui/              # shadcn/ui components
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── Dashboard.tsx
│   │   ├── ProductsSync.tsx
│   │   ├── CategoriesSync.tsx
│   │   ├── WebhookLogs.tsx
│   │   ├── TaskLogs.tsx
│   │   └── Settings.tsx
│   ├── stores/
│   │   └── authStore.ts
│   ├── lib/
│   │   ├── api.ts
│   │   └── utils.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## Default Credentials (Development)

```
Email: admin@example.com
Password: admin123
```
