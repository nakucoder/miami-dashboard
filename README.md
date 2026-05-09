# Miami Data Dashboard

A live data dashboard displaying real-time weather, crypto, and stock market data for Miami, FL.

## Features

- **Live Weather** — Current conditions, feels like, humidity, wind, high/low, sunrise/sunset, and 6-hour hourly forecast for Miami, FL
- **Crypto Prices** — Real-time BTC, ETH, and SOL prices with 24h change, high/low, and volume
- **Stock Market** — Live prices for NVDA, AAPL, MSFT, VOO, and AMZN with change % and volume. Shows Friday's closing prices on weekends with a market closed banner.
- **Historical Trends** — Interactive charts showing the last 7 days of weather, crypto, and stock data pulled live from AWS S3. Includes temperature vs feels like over time, BTC/ETH/SOL price comparisons, normalized % change chart, and a stock performance snapshot.

## Tech Stack

- **Frontend** — React, Vite, inline styles, Bento Grid layout
- **Backend** — Three FastAPI microservices running in Docker containers
- **Data Sources** — Open-Meteo (weather), CoinGecko (crypto), Alpha Vantage (stocks)
- **Storage** — AWS S3 for persistent data snapshots
- **Scheduling** — APScheduler runs each pipeline every 60 minutes
- **Recharts** — charting library for the Historical Trends section

## Architecture

Live data flow:

```
Open-Meteo / CoinGecko / Alpha Vantage
    ↓
FastAPI pipelines (Docker)
    ↓
AWS S3 (snapshots) + in-memory latest
    ↓
nginx routes /weather, /crypto, /stocks
    ↓
Dashboard (React + Vite)
```

Historical data flow:

```
S3 (historical JSON files)
    ↓
/history endpoints on each pipeline
    ↓
nginx routes /weather/history, /crypto/history, /stocks/history
    ↓
Dashboard Historical Trends section (Recharts)
```

## Historical Trends

The bottom section of the dashboard displays 7 days of historical data fetched from S3 via `/history` endpoints on each pipeline. Three tabs:

- **weather** — Temperature vs feels like over time (line chart)
- **crypto** — BTC vs ETH, BTC vs SOL, SOL vs ETH, and all 3 normalized to % change from start
- **stocks** — All 5 tickers by daily % change (horizontal bar chart, green/red)

## Running Locally

Start the three pipeline containers:

```bash
cd ~/weather-pipeline && docker-compose up -d
cd ~/crypto-pipeline && docker-compose up -d
cd ~/stock-pipeline && docker-compose up -d
```

Start the dashboard:

```bash
cd ~/miami-dashboard && npm run dev
```

Open http://localhost:5173

## Live URLs

- **Dashboard:** https://miami-dashboard-plum.vercel.app
- **API:** https://miami-dashboard.duckdns.org

## Related Repositories

- [weather-pipeline](https://github.com/nakucoder/weather-pipeline)
- [crypto-pipeline](https://github.com/nakucoder/crypto-pipeline)
- [stock-pipeline](https://github.com/nakucoder/stock-pipeline)
- [miami-data-pipeline](https://github.com/nakucoder/miami-data-pipeline)

## Author

Built by **Juan Spinelli** · FastAPI + Docker + AWS S3
