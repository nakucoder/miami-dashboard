# Miami Data Dashboard

A live data dashboard displaying real-time weather, crypto, and stock market data for Miami, FL.

## Features

- **Live Weather** — Current conditions, feels like, humidity, wind, high/low, sunrise/sunset, and 6-hour hourly forecast for Miami, FL
- **Crypto Prices** — Real-time BTC, ETH, and SOL prices with 24h change, high/low, and volume
- **Stock Market** — Live prices for NVDA, AAPL, MSFT, VOO, and AMZN with change % and volume. Shows Friday's closing prices on weekends with a market closed banner.

## Tech Stack

- **Frontend** — React, Vite, inline styles, Bento Grid layout
- **Backend** — Three FastAPI microservices running in Docker containers
- **Data Sources** — Open-Meteo (weather), CoinGecko (crypto), Alpha Vantage (stocks)
- **Storage** — AWS S3 for persistent data snapshots
- **Scheduling** — APScheduler runs each pipeline every 60 minutes

## Architecture
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

## Related Repositories

- [weather-pipeline](https://github.com/nakucoder/weather-pipeline)
- [crypto-pipeline](https://github.com/nakucoder/crypto-pipeline)
- [stock-pipeline](https://github.com/nakucoder/stock-pipeline)
- [miami-data-pipeline](https://github.com/nakucoder/miami-data-pipeline)

## Author

Built by **Juan Spinelli** · FastAPI + Docker + AWS S3
