# Mausam - Personalized Weather Homepage (IMD Style)

An intelligent, persona-driven homepage extension for the official India Meteorological Department (IMD) style weather app.

![Mausam Personalized Weather](https://img.shields.io/badge/IMD-Mausam-0066cc)
![React](https://img.shields.io/badge/React-18.x-blue)
![Vite](https://img.shields.io/badge/Vite-5.x-purple)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 🌟 Overview

The **Personalized Homepage** feature dynamically reshapes the Mausam home screen around the specific user persona(s) selected—such as commuters, parents, health-conscious individuals, beachgoers, or farmers—using a single pool of reusable cards, a pure ranking engine, and pinned severe warning banners.

---

## ✨ Key Features

- **8 Multi-Select Personas**: Health-conscious, Outdoor fitness, Beachgoers & surfers, Travelers, Parents & families, Agriculture & gardeners, Commuters, Event planners.
- **Config-Driven Pure Ranking Engine**: Dynamic scoring with `personaWeight`, `dangerBoost` (+50 for extreme conditions), and `timeBoost` (+20 for relevant time windows).
- **Pinned Severe Alert Banners**: Immediate visibility for Red/Orange warnings (IMD color standards).
- **Derived Weather Metrics**: `bestRunningHours`, `comfortIndex`, `commuteRisk`, and `packingSuggestion`.
- **IMD Aesthetic Compliance**: Pixel-perfect adherence to official IMD Mausam design tokens (Day/Dark glassmorphism, weather icons, pill buttons).
- **Bilingual Support (i18n)**: Instant English and Hindi language switching.
- **Mobile-First UX**: Responsive max-width 390px phone container with accessible tap targets (>= 44px).

---

## 🚀 Quick Start

Ensure Node.js 18+ is installed.

```bash
# 1. Clone repository
git clone https://github.com/user/mausam.git
cd mausam

# 2. Copy environment file
cp .env.example .env

# 3. Install dependencies
npm install

# 4. Start local development server
npm run dev
```

Open `http://localhost:5173` to view the application.

---

## 📁 Repository Map

```
mausam/
├── docs/
│   ├── ARCHITECTURE.md    # System design, Mermaid diagrams & ranking formula
│   ├── API.md             # Normalized data schema & provider contracts
│   └── DESIGN_TOKENS.md   # Colors, typography, spacing extracted from IMD app
├── REQUIREMENTS.md        # ID-based functional & non-functional requirements
├── SETUP.md               # Detailed installation & troubleshooting guide
├── PROGRESS.md            # Live phase execution & handoff status (Key doc)
├── CONTRIBUTING.md        # Commit convention & guidelines
├── .env.example           # Configuration template
└── .gitignore             # Standard git exclusions
```

---

## 📚 Documentation Links

- [Requirements Specification](REQUIREMENTS.md)
- [Setup & Install Guide](SETUP.md)
- [API & Schema Spec](docs/API.md)
- [Architecture & Ranking Engine](docs/ARCHITECTURE.md)
- [Design Tokens](docs/DESIGN_TOKENS.md)
- [Progress Tracker](PROGRESS.md)

---

## 📄 License
Distributed under the MIT License.
