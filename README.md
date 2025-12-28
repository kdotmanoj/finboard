# FinBoard : Real-time Financial Dashboard

FinBoard is a customizable, high-performance financial dashboard built with **Next.js 16**. It allows users to connect to any JSON-based API (AlphaVantage, Finnhub, CoinGecko, etc.) and visualize data through a drag-and-drop grid system.

<img width="1920" height="1165" alt="image" src="https://github.com/user-attachments/assets/8a2c9885-a914-4a37-99bf-4e2d95913e91" />


## Features

* **Universal API Support:** Connect to any public JSON API. The builder auto-detects schema structures.
* **Drag-and-Drop Layout:** Fully customizable grid using `@dnd-kit`.
* **3 Visualization Modes:**
    * **Cards:** For single metrics (e.g., "Current Price").
    * **Tables:** Smart pagination for large datasets.
    * **Charts:** Interactive line graphs for time-series data.
* **Intelligent Caching:** Global deduplication prevents API rate limiting.
* **Persistent Config:** Layouts and settings are saved automatically (Local Storage).
* **Import/Export:** Backup your entire dashboard configuration to a JSON file.
* **Dark Mode:** Fully responsive UI with a polished dark theme.

## Tech Stack

* **Framework:** Next.js 16 (App Router)
* **Styling:** Tailwind CSS v4 + Lucide React (Icons)
* **State Management:** Zustand + Immer
* **Charts:** Recharts
* **Drag & Drop:** @dnd-kit/core

---

## Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/kdotmanoj/finboard.git
cd finboard
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## User Guide: Creating Widgets

FinBoard features a unique "Schema Explorer" that lets you visually select data from complex JSON responses without writing code.

### Try it yourself

Use this test URL to see how it works:
```text
https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=IBM&apikey=(your_api_key)
```

### 1. Creating a "Card" (Summary View)

Use cards to display single data points like the current price, volume, or metadata.
<img width="781" height="994" alt="image" src="https://github.com/user-attachments/assets/d4ac1b14-15dc-4d3e-8df2-2428fd9ccbd6" />

### 2. Creating a "Table" or "Chart" (List View)

Use tables and charts to visualize arrays or lists of data (e.g., historical prices).

<img width="781" height="618" alt="image" src="https://github.com/user-attachments/assets/966be669-2c8b-48c8-aeb0-e7b9abb7022f" />


## Other Features

### Dark Mode

Toggle between Light and Dark themes using the Sun/Moon icon in the header. The preference is saved locally.

### Backup & Restore

* **Export:** Downloads a `.json` file containing your entire dashboard layout and API settings.
* **Import:** Upload a config file to instantly restore your workspace.

### Data Caching

To respect API rate limits (especially for free tiers like AlphaVantage), FinBoard caches responses for 60 seconds. Duplicate widgets share the same network request.

---

## 📄 License

This project is open-source and available under the MIT License.
