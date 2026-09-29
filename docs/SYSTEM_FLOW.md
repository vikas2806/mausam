# Mausam — System Architecture & Data Flow

> A complete technical walkthrough of how data moves from the OpenWeatherMap API
> all the way to a ranked, persona-filtered card on the user's screen.

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         BROWSER (React SPA)                         │
│                                                                     │
│  ┌─────────────┐    ┌──────────────────┐    ┌────────────────────┐ │
│  │  Onboarding │    │    Homepage       │    │  SettingsModal     │ │
│  │  (step 1-2) │    │  (main dashboard) │    │  (persona + loc)   │ │
│  └──────┬──────┘    └────────┬─────────┘    └────────┬───────────┘ │
│         │                   │                        │             │
│         └───────────────────┴────────────────────────┘             │
│                             │                                       │
│                    profileStorage.js (localStorage)                 │
│              { locationId, personas[], onboardingDone }             │
└─────────────────────────────────────────────────────────────────────┘
                             │
              ┌──────────────▼──────────────┐
              │       Provider Factory       │
              │       factory.js             │
              │  VITE_USE_REAL_WEATHER=true  │
              │  VITE_OPENWEATHER_API_KEY=…  │
              └──────────────┬──────────────┘
                             │
          ┌──────────────────┴──────────────────┐
          │                                     │
  ┌───────▼────────┐                  ┌─────────▼────────┐
  │ OpenWeather    │                  │  MockWeather      │
  │ Provider       │  (fallback) ───► │  Provider         │
  │ (real API)     │                  │  (hardcoded data) │
  └───────┬────────┘                  └──────────────────┘
          │
  ┌───────▼────────────────────────────────────┐
  │           OpenWeatherMap REST API           │
  │  /data/2.5/weather  (current)               │
  │  /data/2.5/forecast (5-day / 3hr)           │
  │  /data/2.5/air_pollution (AQI)              │
  └────────────────────────────────────────────┘
```

---

## 2. Layer-by-Layer Breakdown

### Layer 1 — Configuration (`src/config/`)

| File | Purpose |
|---|---|
| `personas.json` | Defines all 9 built-in personas (Default + 8 lifestyle types). Each has `cards[]`, `cardWeights{}`, `dangerRules[]`, `timeRules[]`, and `searchTerms[]` for NL search |
| `cardConfig.json` | Maps every card ID to the weather data fields it needs (e.g. `uvIndex` needs `uvIndex`, `uvCategory`) |

**Personas are pure data** — no logic lives here. Changing a persona is a JSON edit, not a code change.

---

### Layer 2 — Weather Provider (`src/providers/` + `src/data/`)

```
factory.js
  ├── VITE_USE_REAL_WEATHER=true  → OpenWeatherProvider  (real API)
  ├── VITE_USE_REAL_WEATHER=false → MockWeatherProvider  (hardcoded)
  └── VITE_WEATHER_PROVIDER=open-meteo → RealWeatherProvider (Open-Meteo free API)
```

#### OpenWeatherProvider (`src/providers/openWeatherProvider.js`)

Three API calls per location refresh:

```
1. GET /data/2.5/weather?lat={lat}&lon={lon}&appid={key}&units=metric
   → current temp, humidity, wind speed, visibility, weather condition

2. GET /data/2.5/forecast?lat={lat}&lon={lon}&appid={key}&units=metric
   → 5-day / 3-hour forecast for hourly + daily bars

3. GET /data/2.5/air_pollution?lat={lat}&lon={lon}&appid={key}
   → AQI (1-5 scale), PM2.5, PM10, NO2, O3
```

**Cache**: Results are stored in `localStorage` under `owm_cache_{locationId}` with a 10-minute TTL. If a cached entry is fresh, the API is skipped entirely.

**Fallback**: If the API call fails (network error, 401, rate limit), the provider silently falls back to `MockWeatherProvider` and logs a warning to the console.

#### Normalized Schema (output of every provider)

Every provider — real or mock — returns the **same shape**:

```js
{
  location: { name, lat, lon },
  current: {
    temp, feelsLike, humidity, windSpeed, visibility,
    uvIndex, aqi, condition, icon
  },
  hourly: [{ hour, temp, icon }],           // next 24 hrs
  daily:  [{ day, high, low, icon }],        // next 7 days
  alerts: [{ title, severity, description }] // active weather alerts
}
```

This contract means the UI never knows or cares whether data is real or mocked.

---

### Layer 3 — Ranking Engine (`src/engine/`)

This is the **brain** of the app. It runs as a pure function — no side effects, fully testable.

#### `metrics.js` — Derive computed fields

Takes normalized weather data and computes:
- `commuteRisk` score (fog + rain + time of day)
- `bestRunningHours` (temperature + UV + wind composite)
- `pollen` estimate (humidity + wind proxy)
- `comfortIndex` (feels-like + humidity)
- `packingSuggestion` (rain probability + wind)
- `frostAlert` (temp ≤ 2°C threshold)
- `soilMoisture` (recent rain proxy)
- `marine` swell proxy (wind speed)

#### `ranking.js` — Score and sort cards

```
For each card in persona.cards[]:

  score = personaWeight
        + dangerBoost   (if weather crosses a danger threshold)
        + timeBoost     (if current hour falls in a relevant window)

Cards sorted descending by score.
Top 3-4 → "For You" section (always visible)
Rest     → "More For You" section (collapsible)
```

**Formula example — AQI card for Health persona:**
```
personaWeight = 40   (from personas.json cardWeights)
dangerBoost   = +50  (if AQI > 150 — dangerRules)
timeBoost     = 0    (no timeRules for AQI)
──────────────────
score         = 90   → floated to top of "For You"
```

**The Default persona** sets all `cardWeights` to `10` with no danger or time rules — producing an unranked, flat view of every card.

---

### Layer 4 — User Profile (`src/utils/profileStorage.js`)

All user preferences are persisted in **`localStorage`** under the key `mausam_profile`:

```js
{
  locationId:     "mumbai-01",   // selected location
  personas:       ["fitness"],   // active persona IDs (array)
  onboardingDone: true           // skips onboarding on next load
}
```

`saveProfile(patch)` deep-merges a partial update and writes back immediately. `resetProfile()` clears the flag so onboarding re-runs on next reload.

---

### Layer 5 — Persona Matching (`src/utils/personaMatcher.js`)

Powers the **"Describe yourself"** natural-language search on both the Onboarding screen and the Settings modal.

```
Input:  "I run every morning"
         ↓
Tokenize → ["run", "every", "morning"]  (stop words removed)
         ↓
Score each persona:
  fitness:  label match "run" (+10) + searchTerm "running" (+4) = 14
  health:   no match = 0
  default:  no match = 0
  ...
         ↓
Return personas sorted by score descending → ["fitness", ...]
         ↓
Show as confirmation chips (user must tap to confirm — never auto-select)
         ↓
confirmSuggestion(id) → saveProfile({ personas: [id] })  ← full replacement
```

**Scoring weights:**
- Label contains token: **+10**
- `searchTerms[]` exact match: **+8**
- `searchTerms[]` partial match: **+4**
- `desc` contains token: **+2**

---

### Layer 6 — UI (`src/pages/` + `src/components/`)

```
App.jsx
 ├── checks onboardingDone flag
 ├── if false → <Onboarding />   (2-step wizard: location → persona)
 └── if true  → <Homepage />
                 ├── fetches weather via getWeatherProvider()
                 ├── derives metrics via computeMetrics()
                 ├── ranks cards via rankCards()
                 ├── <AlertBanner />         pinned danger alerts
                 ├── <PersonaChip /> bar     quick-toggle strip
                 ├── "For You" grid          top ranked cards
                 ├── "More For You"          collapsible remainder
                 ├── <HourlyForecast />      next 24hr temperature bar
                 └── <DailyForecast />       7-day high/low strip
```

Cards are rendered dynamically from `CardRegistry` — adding a new card type requires:
1. A new entry in `cardConfig.json`
2. A new card component in `src/components/cards/`
3. A weight entry in the relevant persona(s) in `personas.json`

No changes needed anywhere else.

---

## 3. Complete Data Flow — End to End

```
User opens app
      │
      ▼
App.jsx reads localStorage (profileStorage)
      │
      ├─ onboardingDone = false ──► Onboarding.jsx
      │     Step 1: pick location (saves locationId)
      │     Step 2: NL search or chip select (saves personas[])
      │             └─ personaMatcher.js scores & returns chips
      │     onboardingDone = true → navigate to Homepage
      │
      └─ onboardingDone = true ──► Homepage.jsx
            │
            ▼
      factory.js → OpenWeatherProvider (or Mock)
            │
            ▼
      3 API calls to OpenWeatherMap (with 10-min localStorage cache)
            │
            ▼
      Normalized weather object  { current, hourly, daily, alerts }
            │
            ▼
      metrics.js — computeMetrics(weather)
      → adds derived fields (commuteRisk, runScore, comfortIndex…)
            │
            ▼
      ranking.js — rankCards(metrics, activePersonas, personas.json)
      → scores every card: personaWeight + dangerBoost + timeBoost
      → sorts descending
            │
            ▼
      Homepage renders:
        top 3-4 cards → "For You"
        rest          → "More For You" (collapsed)
        alerts        → AlertBanner (pinned)
            │
            ▼
      User opens Settings → SettingsModal
        ├─ NL search → personaMatcher → chips → confirmSuggestion()
        │              → saveProfile({ personas: [newId] })  FULL REPLACE
        ├─ Manual toggle → togglePersona() → additive multi-select
        └─ Custom builder → saveCustomPersona() → auto-activate
            │
            ▼
      Homepage re-fetches + re-ranks with new personas
```

---

## 4. Test Coverage

| File | Tests | What's covered |
|---|---|---|
| `personaMatcher.test.js` | 5 | NL keyword scoring, stop-word filtering, empty input |
| `ranking.test.js` | 32 | persona weights, danger boost, time boost, default persona |
| `metrics.test.js` | 24 | every derived metric computation |
| `profileStorage.test.js` | 5 | save/load/reset, onboarding bypass flag |
| `openWeatherProvider.test.js` | 4 | API call, cache hit, fallback to mock |
| `factory.test.js` | 5 | env flag switching between providers |
| `CardRegistry.test.jsx` | 20 | every card renders without crash |
| `WeatherCard.test.jsx` | 3 | loading/error/data states |
| `AlertBanner.test.jsx` | 3 | severity levels |
| `EmptyState.test.jsx` | 2 | empty state render |
| **Total** | **120** | |

---

## 5. Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_OPENWEATHER_API_KEY` | Yes (for real data) | — | OpenWeatherMap API key |
| `VITE_USE_REAL_WEATHER` | No | `false` | `true` → live API, `false` → mock |
| `VITE_WEATHER_PROVIDER` | No | `openweather` | `openweather` \| `open-meteo` \| `mock` |

---

## 6. Key Design Decisions

| Decision | Reason |
|---|---|
| Provider interface / factory pattern | Swap real ↔ mock without touching UI code |
| Pure functions in ranking engine | 100% testable, zero React dependency |
| Personas as JSON config | Add/edit personas without any code changes |
| `searchTerms[]` per persona | Enables NL search without ML — pure keyword matching |
| 10-min cache for API responses | Avoids rate limits on free OWM tier (60 req/min) |
| Full replacement on chip confirm | Avoids confusing multi-persona blends from NL input |
| localStorage for profile | Zero backend needed — fully client-side prototype |
