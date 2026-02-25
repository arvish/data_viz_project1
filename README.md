# 🌍 Food, Environment & Longevity: A Global Exploration Dashboard

**Author:** Arvish Pandey  
**Course Project:** Data Visualization (D3.js / HTML / CSS / JavaScript)  
**Data Source:** [Our World in Data (OWID)](https://ourworldindata.org/)  
**Shared Analysis Year:** **2018** (common year across selected indicators after preprocessing)

---

## ✨ Project Overview

This interactive dashboard helps a general audience explore how **life expectancy** varies across countries in relation to:

- 🌫️ **PM2.5 air pollution exposure** (environment)
- 🍽️ **Prevalence of undernourishment** (food/health condition)
- 💰 **GDP per capita** (economic context/control)

The goal is **not to prove causation**, but to support **exploratory reasoning** through coordinated visualizations and interactions.

---

## 🧠 Why this theme?

Rather than building a generic “country metrics” dashboard, this project is framed around a human-centered question:

> **How do food-related and environmental conditions relate to longevity across countries?**

This makes the dashboard more meaningful, interpretable, and engaging for a general audience.

---

## 📊 Dashboard Features (Implemented)

### Core Views
- 🗺️ **Choropleth world map** (selectable metric)
- 📈 **Scatterplot** for correlation exploration (X/Y selectable metrics)
- 📉 **Two histograms** for distribution analysis of selected X and Y metrics
- 🧾 **Details panel** for hovered/selected country information

### Interactions
- ✅ Hover tooltips on map, scatterplot, and histograms
- ✅ Linked highlighting across views
- ✅ Scatterplot brushing (select multiple countries)
- ✅ Reset selection control
- ✅ Metric selectors for X-axis, Y-axis, and map metric

---

## 🧪 Data & Preprocessing Summary

### Selected OWID Indicators
- **Life expectancy**
- **PM2.5 air pollution exposure**
- **Prevalence of undernourishment**
- **GDP per capita (Maddison Project Database)**

### Preprocessing Steps
- Downloaded indicator CSVs from OWID
- Filtered to **country-level rows only** (ISO3 codes)
- Removed aggregates/regions
- Selected a **shared common year (2018)** for comparability
- Inner-joined all selected metrics into a single merged CSV
- Final merged dataset: **~154 countries** (country rows with complete values)

---

## ✅ Project Requirements Coverage (Levels)

## ✅ Level 1 — Completed
- ✅ D3.js + JavaScript + HTML + CSS web application
- ✅ Project title, author name, and data source shown
- ✅ Two+ quantitative country-level metrics selected
- ✅ Year(s) used are shown
- ✅ Data preprocessing / merged CSV created
- ✅ Distribution visualizations (histograms)
- ✅ Correlation visualization (scatterplot)

## ✅ Level 2 — Completed
- ✅ Spatial distribution via choropleth world map
- ✅ Comparison-friendly dashboard layout (multiple views visible together)
- ✅ Intentional color use for quantitative encoding

## ✅ Level 3 — Completed
- ✅ Expanded beyond 2 attributes (4 total metrics)
- ✅ User-selectable metrics (X, Y, Map)
- ✅ Views update dynamically based on user selections
- ✅ Clear UI controls for interaction

## ✅ Level 4 — Completed
- ✅ Detail-on-demand for map (hover tooltips + details panel)
- ✅ Detail-on-demand for distributions (bin hover details)
- ✅ Detail-on-demand for correlation view (point hover details)

## 🟡 Level 5 — Partially Completed
- ✅ Scatterplot brushing with linked updates across views
- ✅ Highlight-based coordinated interaction (instead of full filtering)
- ❌ Histogram brushing (not yet implemented)

---

## 🎨 Creative / “Out-of-the-Box” Design Choices

This project emphasizes creativity through **dashboard composition and interaction design** rather than a novel chart type:

- 🧭 **Human-centered analytical framing** (food + environment + longevity)
- 🧩 **Coordinated multi-view dashboard** (map + scatter + distributions + details)
- 🎛️ **Independent metric controls** (X, Y, and map metric can be explored separately)
- 🌙 **Polished dark UI** designed for readability and comparison
- 🔍 **Exploratory workflow** via brushing + linked highlighting + tooltips

---

## 🛠️ Tech Stack

- **D3.js (v7)**
- **HTML**
- **CSS**
- **Vanilla JavaScript**
- **Python (pandas)** for preprocessing OWID data

---

## 🚀 How to Run Locally

1. Clone the repository
2. Start a local server (required for loading CSV/GeoJSON)
3. Open the app in your browser

```bash
python -m http.server 8000