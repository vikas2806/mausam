# Requirements Specification: Mausam Personalized Homepage

## 1. Functional Requirements (FR)

| ID | Title | Description | Status |
|---|---|---|---|
| **FR-1** | Multi-Select Persona Selection | Users can select one or multiple personas during onboarding or settings: Health, Outdoor Fitness, Beachgoers & Surfers, Travelers, Parents & Families, Agriculture & Gardeners, Commuters, Event Planners. | Planned |
| **FR-2** | Pure Ranking Engine | Pure function scoring algorithm: `score = personaWeight + dangerBoost (+50) + timeBoost (+20)`. Ranks cards dynamically based on active personas and real-time conditions. | Planned |
| **FR-3** | Config-Driven Thresholds | Card scoring, persona mappings, and danger thresholds stored in external JSON configuration (`src/config/personas.json`). | Planned |
| **FR-4** | Pinned Severe Alert Banner | Pinned severe alert banner rendered at top of homepage whenever Red/Orange warning criteria are met. | Planned |
| **FR-5** | Normalized Data Interface | Abstract `WeatherDataProvider` interface with normalized schema supporting current, forecast, air quality, marine, agriculture, and warning metrics. | Planned |
| **FR-6** | Graceful Card Degradation | Individual weather cards gracefully show fallback states or missing data notices without breaking UI execution. | Planned |
| **FR-7** | Live Persona Switcher | Homepage banner chip row allows instant live switching and editing of active user personas. | Planned |
| **FR-8** | Derived Weather Metrics | Pure testable functions calculating `bestRunningHours`, `comfortIndex`, `commuteRisk`, and `packingSuggestion`. | Planned |
| **FR-9** | Local Persona Persistence | Save user persona preferences and health/location inputs to `localStorage`. | Planned |
| **FR-10** | Card Utility Feedback | "Was this helpful?" thumbs up/down action on cards, persisted locally and sent to analytics stub. | Planned |
| **FR-11** | i18n Localization | Complete UI text internationalization supporting English (`en`) and Hindi (`hi`). | Planned |
| **FR-12** | Component Preview Page | `/dev/components` route for inspecting and testing UI cards in isolation. | Planned |

---

## 2. Non-Functional Requirements (NFR)

| ID | Category | Requirement | Status |
|---|---|---|---|
| **NFR-1** | Layout | Mobile-first design, max-width 390px centered in mobile phone frame on desktop displays. | Planned |
| **NFR-2** | Accessibility | Touch targets >= 44px, WCAG AA contrast ratio compliance, proper ARIA labels. | Planned |
| **NFR-3** | UX & Loading | Loading skeleton screens, empty states, and error states for all components. | Planned |
| **NFR-4** | Code Quality | Pure functions with unit tests for ranking engine and derived metric functions. | Planned |
| **NFR-5** | Security | No hardcoded API keys or secrets in source code; use `.env` configuration. | Planned |
| **NFR-6** | Visual Alignment | Replicate exact IMD Mausam visual aesthetic extracted in `docs/DESIGN_TOKENS.md`. | Planned |

---

## 3. Technology Stack & Dependencies

- **Framework**: React 18+ (Vite)
- **Styling**: Vanilla CSS with CSS Variables / Design System Tokens
- **Icons**: Lucide React / SVG Icons matching IMD style
- **Internationalization**: `i18next` / `react-i18next`
- **Testing**: Vitest / React Testing Library
- **Build Tool**: Vite
