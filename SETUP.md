# Setup & Installation Guide

## 1. Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

---

## 2. Environment Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. Configure settings in `.env` as needed:
   - `VITE_ENABLE_MOCK_DATA`: Set to `true` (default for development/demo).
   - `VITE_DEFAULT_LOCATION`: Initial location (e.g. `Noida`).

---

## 3. Installation

Install project dependencies:
```bash
npm install
```

---

## 4. Running Locally

Start the Vite development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

---

## 5. Running Tests

Run unit tests (ranking engine, derived metrics, pure utilities):
```bash
npm test
```

To run tests in watch mode:
```bash
npm run test:watch
```

---

## 6. Component Preview Page

Access `/dev/components` in your browser while the dev server is running to view the reusable UI kit showcase.

---

## 7. Production Build

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

---

## 8. Troubleshooting

- **Node version error**: Run `node -v` to ensure you are on Node 18+.
- **Missing dependencies**: Run `npm ci` to reinstall exact lockfile dependencies.
