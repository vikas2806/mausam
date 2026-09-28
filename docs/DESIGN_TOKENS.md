# Mausam Design Tokens

Extracted from official IMD Mausam app screenshots (Day, Dark, Map, and Navigation Drawer states).

## 1. Color Palette

### 1.1 Brand & Sky Themes
| Token Name | Value | Usage / Context |
|---|---|---|
| `--color-sky-day-top` | `#0072ce` | Daytime top gradient |
| `--color-sky-day-bottom` | `#004b93` | Daytime bottom background |
| `--color-sky-dark-bg` | `#121820` | Dark theme page background |
| `--color-sky-dark-card` | `#252d3c` | Dark theme card container background |
| `--color-glass-bg-day` | `rgba(255, 255, 255, 0.18)` | Daytime semi-transparent glass card |
| `--color-glass-border-day` | `rgba(255, 255, 255, 0.25)` | Glass container borders in light mode |
| `--color-glass-bg-dark` | `rgba(44, 44, 46, 0.85)` | Glass container in dark mode |
| `--color-glass-border-dark` | `rgba(255, 255, 255, 0.08)` | Dark theme card borders |

### 1.2 Text Colors
| Token Name | Value | Usage |
|---|---|---|
| `--color-text-primary` | `#ffffff` | Main titles, temperatures, primary status |
| `--color-text-secondary` | `rgba(255, 255, 255, 0.75)` | Subheaders, dates, secondary labels |
| `--color-text-muted` | `rgba(255, 255, 255, 0.55)` | Unit labels, timestamps |
| `--color-text-dark-primary` | `#1c1c1e` | Drawer menu primary text |
| `--color-text-dark-secondary` | `#636366` | Drawer menu secondary text |

### 1.3 Warning & Severity Colors (IMD Standard)
| Severity Level | Color Name | Hex Code | Usage |
|---|---|---|---|
| **Red (Severe)** | `--color-alert-red` | `#e53935` | Severe warnings, extreme heat, flood/cyclone alerts |
| **Orange (Moderate)** | `--color-alert-orange` | `#fb8c00` | Moderate warnings, thunderstorm, heavy rain watch |
| **Yellow (Watch)** | `--color-alert-yellow` | `#fdd835` | Weather watch, fog alert, mild risk |
| **Green (Normal)** | `--color-alert-green` | `#4caf50` | Good conditions, clear sky, normal marine/AQI |

### 1.4 Temperature Range Gradients
- Range Bar Gradient: `linear-gradient(90deg, #ffcc00 0%, #ff9500 50%, #e53935 100%)`

---

## 2. Typography

| Token Name | Font Size | Weight | Line Height | Usage |
|---|---|---|---|---|
| `--font-hero-temp` | `64px / 4rem` | 300 (Light) | `1.0` | Main temperature display (`11.4°c`) |
| `--font-title-lg` | `24px / 1.5rem` | 600 (SemiBold)| `1.2` | Location name (`Sector 2, Noida`) |
| `--font-title-md` | `18px / 1.125rem`| 600 (SemiBold)| `1.3` | Card headers & drawer section titles |
| `--font-body` | `14px / 0.875rem`| 400 (Regular) | `1.4` | Condition description, hourly items |
| `--font-caption` | `12px / 0.75rem` | 400 (Regular) | `1.4` | Dates, secondary details, humidity levels |

**Font Family**: `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`

---

## 3. Container & Layout Specs

- **Mobile Viewport Target**: 390px max-width, centered frame on desktop.
- **Card Border Radius**: `20px` (`1.25rem`)
- **Pill Button Radius**: `9999px` (Fully rounded pills like `3 Hourly >` button)
- **Container Padding**: `16px` (`1rem`)
- **Interactive Minimum Tap Target**: `44px x 44px`

---

## 4. Iconography & Badges

- Line-art icons with weather specific glyphs (Sun, Rain Cloud, Lightning, Wind, Humidity Drop).
- Thumbs up/down interactive feedback buttons on cards.
- Compact persona chips with icon + label + rounded border.
