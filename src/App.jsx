import { useState, useEffect } from "react";
import axios from "axios";
import {
  LineChart, Line, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LabelList,
} from "recharts";

const W = "https://miami-dashboard.duckdns.org/weather";
const C = "https://miami-dashboard.duckdns.org/crypto";
const S = "https://miami-dashboard.duckdns.org/stocks";
const WH = "https://miami-dashboard.duckdns.org/weather/history";
const CH = "https://miami-dashboard.duckdns.org/crypto/history";
const SH = "https://miami-dashboard.duckdns.org/stocks/history";

export default function App() {
  const [weather, setWeather] = useState(null);
  const [crypto, setCrypto] = useState(null);
  const [stocks, setStocks] = useState(null);
  const [updated, setUpdated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);
  const [isMobilePortrait, setIsMobilePortrait] = useState(
    window.innerWidth <= 768 && window.innerHeight > window.innerWidth
  );
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [weatherHistory, setWeatherHistory] = useState(null);
  const [cryptoHistory, setCryptoHistory] = useState(null);
  const [stocksHistory, setStocksHistory] = useState(null);
  const [historyTab, setHistoryTab] = useState("crypto");
  const [isFlipped, setIsFlipped] = useState(false);

  const monoFont = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";

  const fetchAll = async () => {
    setLoading(true);
    try { const r = await axios.get(W, { timeout: 8000 }); setWeather(r.data); } catch { setWeather(null); }
    try { const r = await axios.get(C, { timeout: 8000 }); setCrypto(r.data); } catch { setCrypto(null); }
    try { const r = await axios.get(S, { timeout: 8000 }); setStocks(r.data); } catch { setStocks(null); }
    setUpdated(new Date().toLocaleTimeString());
    setLoading(false);
  };

  useEffect(() => { fetchAll(); const i = setInterval(fetchAll, 60000); return () => clearInterval(i); }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobilePortrait(window.innerWidth <= 768 && window.innerHeight > window.innerWidth);
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      try { const r = await axios.get(WH, { timeout: 10000 }); setWeatherHistory(r.data); } catch { setWeatherHistory(null); }
      try { const r = await axios.get(CH, { timeout: 10000 }); setCryptoHistory(r.data); } catch { setCryptoHistory(null); }
      try { const r = await axios.get(SH, { timeout: 10000 }); setStocksHistory(r.data); } catch { setStocksHistory(null); }
    };
    fetchHistory();
  }, []);

  const feelsLike = (f, kmh) => {
    const v = (kmh ?? 0) / 1.60934;
    return (v >= 3 && f <= 50)
      ? Math.round(35.74 + 0.6215 * f - 35.75 * Math.pow(v, 0.16) + 0.4275 * f * Math.pow(v, 0.16))
      : f;
  };

  const wmoCondition = (code) => {
    const m = {
      0: "Clear Sky", 1: "Mainly Clear", 2: "Partly Cloudy", 3: "Overcast",
      45: "Foggy", 48: "Icy Fog",
      51: "Light Drizzle", 53: "Drizzle", 55: "Heavy Drizzle",
      61: "Light Rain", 63: "Rain", 65: "Heavy Rain",
      71: "Light Snow", 73: "Snow", 75: "Heavy Snow",
      80: "Rain Showers", 81: "Rain Showers", 82: "Heavy Showers",
      95: "Thunderstorm", 96: "Thunderstorm", 99: "Thunderstorm",
    };
    return (code != null && m[code]) ? m[code] : (code == null ? "Clear Sky" : "Partly Cloudy");
  };

  const wmoIcon = (code, isDay) => {
    if (!code || code <= 1) return isDay ? "☀️" : "🌙";
    if (code === 2) return isDay ? "⛅" : "🌥";
    if (code === 3) return "☁️";
    if (code >= 45 && code <= 48) return "🌫️";
    if (code >= 51 && code <= 67) return "🌧️";
    if (code >= 71 && code <= 77) return "❄️";
    if (code >= 80 && code <= 82) return "🌦️";
    if (code >= 95) return "⛈️";
    return isDay ? "☀️" : "🌙";
  };

  const formatHour = (t) => {
    const d = new Date(t);
    if (isNaN(d.getTime())) return t;
    const h = d.getHours();
    return h === 0 ? "12AM" : h < 12 ? `${h}AM` : h === 12 ? "12PM" : `${h - 12}PM`;
  };

  const todayHighLow = (hourly) => {
    if (!hourly || !hourly.length) return { high: null, low: null };
    const temps = hourly.map(h => h.temperature_fahrenheit).filter(t => t != null);
    return temps.length ? { high: Math.max(...temps), low: Math.min(...temps) } : { high: null, low: null };
  };

  const formatTime = (t) => {
    if (!t) return null;
    const d = new Date(t);
    if (isNaN(d.getTime())) return t;
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  };

  const wxHL = todayHighLow(weather?.data?.hourly_forecast);
  const isWeekend = () => { const d = new Date().getDay(); return d === 0 || d === 6; };
  const lastTradingDay = () => { const d = new Date(); const day = d.getDay(); return day === 6 || day === 0 ? "Friday" : "Today"; };
  const hasStockData = stocks?.data?.stocks && Object.keys(stocks.data.stocks).length > 0;
  const marketClosed = isWeekend();

  const Skeleton = ({ w = "100%", h = "14px", mb = "0", br = "6px" }) => (
    <div style={{
      width: w, height: h, marginBottom: mb, borderRadius: br,
      background: "linear-gradient(90deg, #1a2340 25%, #243054 50%, #1a2340 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.5s infinite",
    }} />
  );

  const tile = (extra) => ({
    background: "rgba(15, 23, 42, 0.7)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "22px",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    minHeight: 0,
    ...extra,
  });

  const cryptoCoins = [["bitcoin", "Bitcoin", "BTC"], ["ethereum", "Ethereum", "ETH"], ["solana", "Solana", "SOL"]];
  const stockColors = { NVDA: "#14532d", AAPL: "#64748b", MSFT: "#1d4ed8", VOO: "#1e3a5f", AMZN: "#c2410c" };

  const handleTouchStart = (e) => setTouchStartX(e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      setActiveIndex((prev) => (diff > 0 ? (prev + 1) % 3 : (prev - 1 + 3) % 3));
      setIsFlipped(false);
    }
  };

  // ─── MOBILE FLIP BACK FACES ───────────────────────────────────────────────
  const mobileBackNav = (active) => (
    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#334155" }}>
      <span style={{ color: active === "weather" ? "#e2e8f0" : undefined, fontWeight: active === "weather" ? 700 : undefined }}>weather</span>
      <span>·</span>
      <span style={{ color: active === "crypto" ? "#e2e8f0" : undefined, fontWeight: active === "crypto" ? 700 : undefined }}>crypto</span>
      <span>·</span>
      <span style={{ color: active === "stocks" ? "#e2e8f0" : undefined, fontWeight: active === "stocks" ? 700 : undefined }}>stocks</span>
    </div>
  );

  const renderMobileWeatherBack = () => {
    const data = (weatherHistory?.data ?? []).filter(d => d.temp != null);
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1, height: "100%" }}>
        <div style={{ flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", fontFamily: monoFont }}>temperature history</span>
          {mobileBackNav("weather")}
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <Legend wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} formatter={v => v === "temp" ? "Temp" : "Feels Like"} />
              <Line type="monotone" dataKey="temp" stroke="#f97316" strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />
              <Line type="monotone" dataKey="feels_like" stroke="#eab308" strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flexShrink: 0, textAlign: "center", fontSize: 9, color: "#334155", marginTop: 6, fontFamily: monoFont }}>tap to flip back</div>
      </div>
    );
  };

  const renderMobileCryptoBack = () => {
    const raw = (cryptoHistory?.data ?? []).filter(d => d.btc != null && d.eth != null && d.sol != null);
    const first = raw[0];
    const normData = first ? raw.map(d => ({
      time: d.time,
      BTC: parseFloat(((d.btc - first.btc) / first.btc * 100).toFixed(2)),
      ETH: parseFloat(((d.eth - first.eth) / first.eth * 100).toFixed(2)),
      SOL: parseFloat(((d.sol - first.sol) / first.sol * 100).toFixed(2)),
    })) : [];
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1, height: "100%" }}>
        <div style={{ flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", fontFamily: monoFont }}>% change from start</span>
          {mobileBackNav("crypto")}
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={normData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <Legend wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} />
              <Line type="monotone" dataKey="BTC" stroke="#f97316" strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />
              <Line type="monotone" dataKey="ETH" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />
              <Line type="monotone" dataKey="SOL" stroke="#a855f7" strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flexShrink: 0, textAlign: "center", fontSize: 9, color: "#334155", marginTop: 6, fontFamily: monoFont }}>tap to flip back</div>
      </div>
    );
  };

  const renderMobileStocksBack = () => {
    const history = stocksHistory?.data ?? [];
    const last = history[history.length - 1];
    const stocksObj = last?.stocks ?? last ?? {};
    const barData = Object.entries(stocksObj)
      .filter(([k]) => k !== "time" && k !== "timestamp")
      .map(([sym, val]) => {
        const pct = typeof val === "object" ? parseFloat(val.change_percent) : parseFloat(val);
        return { sym, change: isNaN(pct) ? null : pct };
      })
      .filter(d => d.change != null)
      .sort((a, b) => b.change - a.change);
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1, height: "100%" }}>
        <div style={{ flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", fontFamily: monoFont }}>daily % change</span>
          {mobileBackNav("stocks")}
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} layout="vertical" margin={{ top: 4, right: 44, left: 10, bottom: 0 }}>
              <XAxis type="number" hide domain={[dataMin => Math.min(dataMin, -0.1), dataMax => Math.max(dataMax, 0.1)]} />
              <YAxis type="category" dataKey="sym" tick={{ fill: "#64748b", fontSize: 10, fontFamily: monoFont }} axisLine={false} tickLine={false} width={36} />
              <Bar dataKey="change" radius={[0, 3, 3, 0]}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={entry.change >= 0 ? "#00c853" : "#ff5252"} />
                ))}
                <LabelList
                  dataKey="change"
                  position="right"
                  formatter={v => `${v > 0 ? "+" : ""}${v.toFixed(2)}%`}
                  style={{ fill: "#94a3b8", fontSize: 10, fontFamily: monoFont }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flexShrink: 0, textAlign: "center", fontSize: 9, color: "#334155", marginTop: 6, fontFamily: monoFont }}>tap to flip back</div>
      </div>
    );
  };

  // ─── WEATHER — desktop ────────────────────────────────────────────────────
  const renderWeatherCard = () => {
    if (!weather) {
      return (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
          <Skeleton w="90px" h="11px" br="4px" />
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
            <Skeleton w="52px" h="52px" br="50%" />
            <Skeleton w="80px" h="44px" br="8px" />
          </div>
          <Skeleton w="70px" h="11px" br="4px" />
          <Skeleton w="100%" h="11px" br="4px" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <Skeleton w="100%" h="28px" br="8px" />
            <Skeleton w="100%" h="28px" br="8px" />
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 12, display: "flex", gap: 8, justifyContent: "space-around" }}>
            {[0, 1, 2, 3, 4, 5].map(i => <Skeleton key={i} w="22px" h="36px" br="4px" />)}
          </div>
        </div>
      );
    }

    const windKmh = weather.data.wind_speed_kmh;
    const fl = weather.data.feels_like_fahrenheit ?? feelsLike(weather.data.temperature_fahrenheit, windKmh);
    const humidity = weather.data.hourly_forecast?.[0]?.humidity;
    const windMph = windKmh != null ? Math.round(windKmh * 0.621371) : null;
    const high = weather.data.high_fahrenheit ?? wxHL.high;
    const low = weather.data.low_fahrenheit ?? wxHL.low;

    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
        <div style={{ flexShrink: 0, textAlign: "center", fontSize: 11, fontWeight: 600, letterSpacing: 1, color: "#94a3b8", textTransform: "uppercase" }}>
          {weather.data.condition ?? wmoCondition(weather.data.weather_code)}
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 14 }}>
          <div style={{ fontSize: 54, lineHeight: 1, flexShrink: 0 }}>{wmoIcon(weather.data.weather_code, weather.data.is_day)}</div>
          <div style={{ fontSize: 58, fontWeight: 800, lineHeight: 1, letterSpacing: -2, fontFamily: monoFont }}>{weather.data.temperature_fahrenheit}°</div>
        </div>
        <div style={{ flexShrink: 0, textAlign: "center", fontSize: 11, color: "#64748b" }}>Feels like {fl}°</div>
        <div style={{ flexShrink: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 12, fontSize: 10, color: "#94a3b8" }}>
          {high != null && <span>H: {high}°&nbsp;&nbsp;L: {low}°</span>}
          {weather.data.sunrise && <span>🌅 {formatTime(weather.data.sunrise)}</span>}
          {weather.data.sunset && <span>🌇 {formatTime(weather.data.sunset)}</span>}
        </div>
        <div style={{ flexShrink: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          <div style={{ textAlign: "center", fontSize: 10, color: "#94a3b8", background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "6px 4px" }}>
            💧 {humidity != null ? `${humidity}%` : "—"}
          </div>
          <div style={{ textAlign: "center", fontSize: 10, color: "#94a3b8", background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "6px 4px" }}>
            💨 {windMph != null ? `${windMph} mph` : "—"}
          </div>
        </div>
        <div style={{ flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 12 }}>
          {!weather.data.hourly_forecast ? (
            <div style={{ display: "flex", gap: 8, justifyContent: "space-around" }}>
              {[0, 1, 2, 3, 4, 5].map(i => <Skeleton key={i} w="22px" h="36px" br="4px" />)}
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8, justifyContent: "space-around" }}>
              {weather.data.hourly_forecast.slice(0, 6).map((h, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, fontSize: 9, minWidth: 0 }}>
                  <span style={{ color: "#64748b", whiteSpace: "nowrap" }}>{i === 0 ? "Now" : formatHour(h.time)}</span>
                  <span style={{ fontSize: 14 }}>{(h.precipitation_probability || 0) > 30 ? "🌧" : "☀"}</span>
                  <span style={{ fontFamily: monoFont, fontWeight: 600 }}>{h.temperature_fahrenheit}°</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─── WEATHER — portrait mobile (full detail, compact sizes) ───────────────
  const renderMobileWeatherCard = () => {
    if (!weather) {
      return (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
          <Skeleton w="90px" h="11px" br="4px" />
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
            <Skeleton w="52px" h="52px" br="50%" />
            <Skeleton w="80px" h="44px" br="8px" />
          </div>
          <Skeleton w="70px" h="11px" br="4px" />
          <Skeleton w="100%" h="11px" br="4px" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <Skeleton w="100%" h="28px" br="8px" />
            <Skeleton w="100%" h="28px" br="8px" />
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 12, display: "flex", gap: 8, justifyContent: "space-around" }}>
            {[0, 1, 2, 3, 4, 5].map(i => <Skeleton key={i} w="22px" h="36px" br="4px" />)}
          </div>
        </div>
      );
    }

    const windKmh = weather.data.wind_speed_kmh;
    const fl = feelsLike(weather.data.temperature_fahrenheit, windKmh);
    const humidity = weather.data.humidity;
    const windMph = windKmh != null ? Math.round(windKmh / 1.60934) : null;

    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
        <div style={{ flexShrink: 0, textAlign: "center", fontSize: 11, fontWeight: 600, letterSpacing: 1, color: "#94a3b8", textTransform: "uppercase" }}>
          {wmoCondition(weather.data.weather_code)}
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 14 }}>
          <div style={{ fontSize: 54, lineHeight: 1, flexShrink: 0 }}>{wmoIcon(weather.data.weather_code, weather.data.is_day)}</div>
          <div style={{ fontSize: 58, fontWeight: 800, lineHeight: 1, letterSpacing: -2, fontFamily: monoFont }}>{weather.data.temperature_fahrenheit}°</div>
        </div>
        <div style={{ flexShrink: 0, textAlign: "center", fontSize: 11, color: "#64748b" }}>Feels like {fl}°</div>
        <div style={{ flexShrink: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 12, fontSize: 10, color: "#94a3b8" }}>
          {wxHL.high != null && <span>H: {wxHL.high}°&nbsp;&nbsp;L: {wxHL.low}°</span>}
          {weather.data.sunrise && <span>🌅 {formatTime(weather.data.sunrise)}</span>}
          {weather.data.sunset && <span>🌇 {formatTime(weather.data.sunset)}</span>}
        </div>
        <div style={{ flexShrink: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          <div style={{ textAlign: "center", fontSize: 10, color: "#94a3b8", background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "6px 4px" }}>
            💧 {humidity != null ? `${humidity}%` : "—"}
          </div>
          <div style={{ textAlign: "center", fontSize: 10, color: "#94a3b8", background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "6px 4px" }}>
            💨 {windMph != null ? `${windMph} mph` : "—"}
          </div>
        </div>
        <div style={{ flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 12 }}>
          {!weather.data.hourly_forecast ? (
            <div style={{ display: "flex", gap: 8, justifyContent: "space-around" }}>
              {[0, 1, 2, 3, 4, 5].map(i => <Skeleton key={i} w="22px" h="32px" br="4px" />)}
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8, justifyContent: "space-around" }}>
              {weather.data.hourly_forecast.slice(0, 6).map((h, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, fontSize: 9, minWidth: 0 }}>
                  <span style={{ color: "#64748b", whiteSpace: "nowrap" }}>{i === 0 ? "Now" : formatHour(h.time)}</span>
                  <span style={{ fontSize: 13 }}>{(h.precipitation_probability || 0) > 30 ? "🌧" : "☀"}</span>
                  <span style={{ fontFamily: monoFont, fontWeight: 600 }}>{h.temperature_fahrenheit}°</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─── CRYPTO ───────────────────────────────────────────────────────────────
  const renderCryptoCard = () => (
    <>
      <div style={{ flexShrink: 0, display: "flex", justifyContent: "center", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 48, lineHeight: 1 }}>₿</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, gap: 6 }}>
        {cryptoCoins.map(([k, name, sym]) => {
          const coin = crypto?.data?.prices?.[k];
          if (!coin) {
            return (
              <div key={k} style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", justifyContent: "space-evenly", padding: 10, borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(248,165,194,0.1)" }}>
                <Skeleton w="44px" h="44px" br="50%" />
                <Skeleton w="100%" h="14px" />
                <Skeleton w="100%" h="24px" />
              </div>
            );
          }
          const isUp = coin.change_24h_percent >= 0;
          const sparklineData = [30, 65, 45, 72, 55, 80, 50];
          return (
            <div key={k} style={{
              flex: 1, minHeight: 0,
              display: "flex", flexDirection: "column", justifyContent: "space-evenly",
              padding: 12, borderRadius: 12,
              background: "rgba(255,255,255,0.05)",
              border: `1px solid ${isUp ? "rgba(0,255,136,0.2)" : "rgba(255,71,87,0.2)"}`,
              boxShadow: `0 0 12px ${isUp ? "rgba(0,255,136,0.06)" : "rgba(255,71,87,0.06)"}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%",
                  background: `linear-gradient(135deg, ${isUp ? "#00ff88" : "#ff4757"}, ${isUp ? "rgba(0,255,136,0.2)" : "rgba(255,71,87,0.2)"})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, fontWeight: 700, color: "#fff", flexShrink: 0,
                  boxShadow: `0 0 16px ${isUp ? "rgba(0,255,136,0.3)" : "rgba(255,71,87,0.3)"}`,
                }}>{sym === "BTC" ? "₿" : sym === "ETH" ? "Ξ" : "◎"}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#cbd5e1" }}>{sym}</div>
                  <div style={{ fontSize: 10, color: "#64748b" }}>{name}</div>
                </div>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, fontFamily: monoFont, color: "#f1f5f9" }}>${coin.price_usd.toLocaleString()}</div>
              <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 24, justifyContent: "space-between" }}>
                {sparklineData.map((h, i) => (
                  <div key={i} style={{
                    flex: 1, height: `${(h / 80) * 100}%`,
                    background: `linear-gradient(180deg, ${isUp ? "#00ff88" : "#ff4757"}, ${isUp ? "rgba(0,255,136,0.2)" : "rgba(255,71,87,0.2)"})`,
                    borderRadius: "2px 2px 0 0", opacity: 0.75,
                  }} />
                ))}
              </div>
              <div style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                background: isUp ? "rgba(0,255,136,0.15)" : "rgba(255,71,87,0.15)",
                color: isUp ? "#00ff88" : "#ff4757",
                padding: "5px 8px", borderRadius: 14,
                fontSize: 10, fontWeight: 700, fontFamily: monoFont,
                border: `1px solid ${isUp ? "rgba(0,255,136,0.3)" : "rgba(255,71,87,0.3)"}`,
                width: "fit-content",
              }}>{isUp ? "▲" : "▼"} {Math.abs(coin.change_24h_percent).toFixed(2)}%</div>
            </div>
          );
        })}
      </div>
    </>
  );

  // ─── STOCKS ───────────────────────────────────────────────────────────────
  const renderStocksCard = () => (
    <>
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
          <rect x="1" y="11" width="3" height="8" rx="1" fill="#475569" />
          <rect x="6" y="7" width="3" height="12" rx="1" fill="#64748b" />
          <rect x="11" y="4" width="3" height="15" rx="1" fill="#94a3b8" />
          <rect x="16" y="1" width="3" height="18" rx="1" fill="#cbd5e1" />
        </svg>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, color: "#94a3b8", textTransform: "uppercase" }}>Stocks</span>
      </div>

      {marketClosed && (
        <div style={{
          background: "rgba(168,85,247,0.06)", borderRadius: 8, padding: "10px 12px",
          display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexShrink: 0, fontSize: 10,
        }}>
          <span>🔒</span>
          <div>
            <div style={{ fontWeight: 600, color: "#a855f7" }}>Market Closed</div>
            <div style={{ color: "#64748b", lineHeight: 1.3 }}>Showing {lastTradingDay()}'s data</div>
          </div>
        </div>
      )}

      {!hasStockData ? (
        ["NVDA", "AAPL", "MSFT", "VOO", "AMZN"].map(sym => (
          <div key={sym} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-around", padding: 12, borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(168,85,247,0.1)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: stockColors[sym] ?? "#334155", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0, fontFamily: monoFont }}>{sym[0]}</div>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{sym}</span>
            </div>
            <Skeleton w="100%" h="20px" />
            <Skeleton w="100%" h="8px" />
          </div>
        ))
      ) : (
        Object.entries(stocks.data.stocks).map(([sym, stock]) => {
          const change = parseFloat(stock.change_percent);
          const isUp = change >= 0;
          return (
            <div key={sym} style={{
              flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between",
              padding: 14, borderRadius: 16,
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${isUp ? "rgba(0,255,136,0.16)" : "rgba(255,71,87,0.16)"}`,
              borderLeft: `4px solid ${isUp ? "#00ff88" : "#ff4757"}`,
              gap: 10,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, overflow: "hidden" }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%",
                    background: stockColors[sym] ?? "#334155",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0, fontFamily: monoFont,
                  }}>{sym[0]}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{sym}</span>
                    <svg width="60" height="24" viewBox="0 0 60 24" style={{ flexShrink: 0 }}>
                      <path d="M2 18 L12 12 L20 15 L28 8 L36 10 L44 6 L52 10 L58 8" fill="none" stroke={isUp ? "#00ff88" : "#ff4757"} strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
                <div style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  background: isUp ? "rgba(0,255,136,0.15)" : "rgba(255,71,87,0.15)",
                  color: isUp ? "#00ff88" : "#ff4757",
                  padding: "5px 10px", borderRadius: 16,
                  fontSize: 11, fontWeight: 700, fontFamily: monoFont,
                  border: `1px solid ${isUp ? "rgba(0,255,136,0.25)" : "rgba(255,71,87,0.25)"}`,
                  flexShrink: 0,
                }}>{isUp ? "▲" : "▼"} {Math.abs(change).toFixed(2)}%</div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, fontFamily: monoFont, color: "#f1f5f9" }}>${stock.price_usd.toFixed(2)}</div>
              <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                <div style={{
                  width: `${Math.min(100, Math.max(5, 50 + Math.abs(change) * 8))}%`,
                  height: "100%", borderRadius: 3,
                  background: isUp ? "linear-gradient(90deg, #00ff88, #00dd77)" : "linear-gradient(90deg, #ff4757, #ff2a40)",
                  opacity: 0.85,
                }} />
              </div>
            </div>
          );
        })
      )}
    </>
  );

  // ─── HISTORICAL ───────────────────────────────────────────────────────────
  const renderHistorySection = () => {
    const smartFmt = (v) =>
      Math.abs(v) >= 10000 ? `$${(v / 1000).toFixed(0)}k`
      : Math.abs(v) >= 1000  ? `$${(v / 1000).toFixed(1)}k`
      :                        `$${v.toFixed(0)}`;

    const fmtXTick = (val) => {
      const d = new Date(val);
      if (isNaN(d.getTime())) return "";
      return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", hour12: true });
    };

    const gridProps = { stroke: "rgba(255,255,255,0.06)", strokeDasharray: "3 3" };
    const axisProps = {
      tick: { fill: "#64748b", fontSize: 10, fontFamily: monoFont },
      axisLine: { stroke: "rgba(255,255,255,0.1)" },
      tickLine: false,
    };
    const ttProps = {
      contentStyle: { background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 11 },
      labelStyle: { color: "#94a3b8" },
      itemStyle: { color: "#e2e8f0" },
    };
    const panelBox = { background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "10px 4px 4px", flex: 1, minWidth: 0, height: "100%", display: "flex", flexDirection: "column" };
    const empty = (msg) => <div style={{ color: "#64748b", fontSize: 12, textAlign: "center", padding: 60 }}>{msg}</div>;

    const renderWeatherTab = () => {
      if (!weatherHistory) return empty("Loading weather history…");
      return (
        <div style={{ flex: 1, minHeight: 0, height: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weatherHistory?.data} margin={{ top: 8, right: 24, left: 4, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="time" tickFormatter={fmtXTick} {...axisProps} interval="preserveStartEnd" />
                <YAxis {...axisProps} tickFormatter={v => `${v}°`} domain={[40, 'auto']} />
                <Tooltip {...ttProps} formatter={(v, name) => [`${v}°`, name === "temp" ? "Temp" : "Feels Like"]} labelFormatter={fmtXTick} />
                <Legend formatter={v => v === "temp" ? "Temp" : "Feels Like"} wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
                <Line type="monotone" dataKey="temp" stroke="#f97316" strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />
                <Line type="monotone" dataKey="feels_like" stroke="#eab308" strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />
              </LineChart>
            </ResponsiveContainer>
        </div>
      );
    };

    const renderCryptoTab = () => {
      if (!cryptoHistory) return empty("Loading crypto history…");

      const dualPanel = (k1, k2, c1, c2, l1, l2) => {
        const data = cryptoHistory?.data ?? [];
        return (
          <div style={panelBox}>
            <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, fontFamily: monoFont, marginBottom: 6, paddingLeft: 8 }}>
              <span style={{ color: c1 }}>{l1}</span><span style={{ color: "#475569" }}> vs </span><span style={{ color: c2 }}>{l2}</span>
            </div>
            <div style={{ flex: 1, minHeight: 0, height: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="time" hide />
                  <YAxis yAxisId="l" {...axisProps} width={52} tickFormatter={smartFmt} />
                  <YAxis yAxisId="r" orientation="right" {...axisProps} width={52} tickFormatter={smartFmt} />
                  <Tooltip {...ttProps} formatter={(v, name) => [`$${v.toLocaleString()}`, name === k1 ? l1 : l2]} labelFormatter={fmtXTick} />
                  <Line yAxisId="l" type="monotone" dataKey={k1} stroke={c1} strokeWidth={2} dot={false} isAnimationActive={false} connectNulls name={k1} />
                  <Line yAxisId="r" type="monotone" dataKey={k2} stroke={c2} strokeWidth={2} dot={false} isAnimationActive={false} connectNulls name={k2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      };

      const allData = cryptoHistory?.data ?? [];
      const first = allData[0];
      const normData = first ? allData.map(d => ({
        time: d.time,
        BTC: parseFloat(((d.btc - first.btc) / first.btc * 100).toFixed(2)),
        ETH: parseFloat(((d.eth - first.eth) / first.eth * 100).toFixed(2)),
        SOL: parseFloat(((d.sol - first.sol) / first.sol * 100).toFixed(2)),
      })) : [];

      return (
        <div style={{ display: "flex", gap: 12, flex: 1, minHeight: 0, height: "100%" }}>
          {dualPanel("btc", "eth", "#f97316", "#3b82f6", "BTC", "ETH")}
          {dualPanel("btc", "sol", "#f97316", "#a855f7", "BTC", "SOL")}
          {dualPanel("sol", "eth", "#a855f7", "#3b82f6", "SOL", "ETH")}
          <div style={panelBox}>
            <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, fontFamily: monoFont, marginBottom: 6, paddingLeft: 8 }}>
              % Change from start
            </div>
            <div style={{ flex: 1, minHeight: 0, height: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={normData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="time" hide />
                  <YAxis {...axisProps} tickFormatter={v => `${v}%`} />
                  <Tooltip {...ttProps} formatter={(v, name) => [`${v}%`, name]} labelFormatter={fmtXTick} />
                  <Legend wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} />
                  <Line type="monotone" dataKey="BTC" stroke="#f97316" strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />
                  <Line type="monotone" dataKey="ETH" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />
                  <Line type="monotone" dataKey="SOL" stroke="#a855f7" strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      );
    };

    const renderStocksTab = () => {
      if (!stocksHistory) return empty("Loading stocks history…");
      const history = stocksHistory.data ?? [];
      const last = history[history.length - 1];
      const stocksObj = last?.stocks ?? last ?? {};
      const barData = Object.entries(stocksObj)
        .filter(([k]) => k !== "time" && k !== "timestamp")
        .map(([sym, val]) => {
          const pct = typeof val === "object" ? parseFloat(val.change_percent) : parseFloat(val);
          return { sym, change: isNaN(pct) ? null : pct };
        })
        .filter(d => d.change != null)
        .sort((a, b) => b.change - a.change);

      return (
        <div style={{ flex: 1, minHeight: 0, height: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} layout="vertical" margin={{ top: 8, right: 70, left: 10, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" {...axisProps} tickFormatter={v => `${v}%`} domain={[dataMin => Math.min(dataMin, -0.1), dataMax => Math.max(dataMax, 0.1)]} />
              <YAxis type="category" dataKey="sym" {...axisProps} width={45} />
              <Tooltip {...ttProps} formatter={v => [`${v.toFixed(2)}%`, "Change"]} />
              <Bar dataKey="change" radius={[0, 4, 4, 0]}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={entry.change >= 0 ? "#00ff88" : "#ff4757"} />
                ))}
                <LabelList
                  dataKey="change"
                  position="right"
                  formatter={v => `${v > 0 ? "+" : ""}${v.toFixed(2)}%`}
                  style={{ fill: "#94a3b8", fontSize: 11, fontFamily: monoFont }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    };

    return (
      <>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 16, flexShrink: 0 }}>
          <div>
            <div style={{ color: "#06b6d4", fontWeight: 700, fontSize: 12 }}>📊 Historical Trends</div>
            <div style={{ color: "#94a3b8", fontSize: 10, marginTop: 4 }}>SaaS metrics and market pulse</div>
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            {["weather", "crypto", "stocks"].map(tab => (
              <span key={tab} onClick={() => setHistoryTab(tab)} style={{
                fontSize: 11, fontWeight: 700, cursor: "pointer",
                letterSpacing: 0.3, fontFamily: monoFont,
                color: historyTab === tab ? "#fff" : "rgba(255,255,255,0.25)",
                paddingBottom: 2,
                borderBottom: historyTab === tab ? "2px solid #00ff88" : "2px solid transparent",
                transition: "color 0.2s ease",
              }}>{tab}</span>
            ))}
          </div>
          <span style={{ fontFamily: monoFont, color: "#cbd5e1", fontSize: 11 }}>{loading ? "Syncing..." : "Live insights"}</span>
        </div>
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          {historyTab === "weather" && renderWeatherTab()}
          {historyTab === "crypto" && renderCryptoTab()}
          {historyTab === "stocks" && renderStocksTab()}
        </div>
      </>
    );
  };

  return (
    <div style={{ background: "#050b1a", color: "#e2e8f0", minHeight: "100vh", overflowX: "hidden", fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{ width: "95%", maxWidth: 1400, margin: "0 auto", padding: "16px 20px 24px", boxSizing: "border-box", display: "flex", flexDirection: "column", minHeight: "100vh" }}>

        {/* ── HEADER ── */}
        <header style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <div className="pulse-dot" />
            <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
              <span style={{ color: "#00ff88", fontSize: 10, letterSpacing: 1.5, fontWeight: 700 }}>LIVE</span>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: -0.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Miami Data Dashboard</h1>
            </div>
          </div>

          {!isMobilePortrait && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#64748b", fontSize: 11 }}>
              <span>weather</span><span>·</span><span>crypto</span><span>·</span><span>stocks</span>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            {isMobilePortrait && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {[["weather", 0], ["crypto", 1], ["stocks", 2]].map(([label, i]) => (
                  <span key={i} onClick={() => setActiveIndex(i)} style={{
                    fontSize: 11, fontWeight: 700, cursor: "pointer",
                    color: activeIndex === i ? "#fff" : "rgba(255,255,255,0.25)",
                    letterSpacing: 0.3,
                    transition: "color 0.2s ease",
                    paddingBottom: 2,
                    borderBottom: activeIndex === i ? "2px solid #00ff88" : "2px solid transparent",
                  }}>{label}</span>
                ))}
              </div>
            )}
            {updated && <span style={{ fontFamily: monoFont, color: "#94a3b8", fontSize: 11 }}>{updated}</span>}
            <button onClick={fetchAll} className="refresh-button" style={{
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.14)",
              color: "#e2e8f0", padding: "10px 14px", borderRadius: 14, cursor: "pointer",
              fontSize: 12, fontWeight: 700,
              transition: "transform 0.15s ease, background 0.2s ease",
              boxShadow: "0 16px 40px rgba(0,0,0,0.18)",
            }}>↻ {loading ? "Refreshing" : "Refresh"}</button>
          </div>
        </header>

        {/* ── MAIN ── */}
        <main style={{ display: "flex", flexDirection: "column", gap: 20, flex: 1, minHeight: 0, paddingTop: 16 }}>
          {isMobilePortrait ? (
            /* Portrait mobile: single-card carousel */
            <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
              {/* Flip card */}
              <div style={{ flex: 1, minHeight: 0, perspective: 1200 }} onClick={() => setIsFlipped(f => !f)}>
                <div style={{
                  position: "relative", width: "100%", height: "100%",
                  transformStyle: "preserve-3d",
                  transition: "transform 0.6s",
                  transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                }}>
                  {/* Front face */}
                  <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                    backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
                    display: "flex", flexDirection: "column", overflow: "hidden",
                    background: "rgba(15, 23, 42, 0.7)", backdropFilter: "blur(12px)",
                    borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)", padding: 20,
                  }}>
                    {activeIndex === 0 && renderMobileWeatherCard()}
                    {activeIndex === 1 && renderCryptoCard()}
                    {activeIndex === 2 && renderStocksCard()}
                  </div>
                  {/* Back face */}
                  <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                    backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                    display: "flex", flexDirection: "column", overflow: "hidden",
                    background: "rgba(15, 23, 42, 0.7)", backdropFilter: "blur(12px)",
                    borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)", padding: 20,
                  }}>
                    {activeIndex === 0 && renderMobileWeatherBack()}
                    {activeIndex === 1 && renderMobileCryptoBack()}
                    {activeIndex === 2 && renderMobileStocksBack()}
                  </div>
                </div>
              </div>
              <div style={{ flexShrink: 0, display: "flex", justifyContent: "center", gap: 10, padding: "14px 0" }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} onClick={() => setActiveIndex(i)} style={{ width: 10, height: 10, borderRadius: "50%", background: i === activeIndex ? "#fff" : "rgba(255,255,255,0.25)", cursor: "pointer" }} />
                ))}
              </div>
            </div>
          ) : isDesktop ? (
            /* Desktop: 3-col grid + historical row */
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gridTemplateRows: "minmax(0, 1fr) minmax(0, 1fr)", gap: 24, flex: 1, minHeight: 0 }}>
              <div style={tile({})}>{renderWeatherCard()}</div>
              <div style={tile({ overflow: "hidden" })}>{renderCryptoCard()}</div>
              <div style={tile({ overflow: "auto" })}>{renderStocksCard()}</div>
              <div style={{ ...tile({ padding: 24, minHeight: 400 }), gridColumn: "1 / -1", display: "flex", flexDirection: "column" }}>{renderHistorySection()}</div>
            </div>
          ) : (
            /* Landscape: 3-column, scrollable wrapper so tiles aren't crushed */
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                <div style={tile({ minHeight: 360, overflow: "hidden" })}>{renderMobileWeatherCard()}</div>
                <div style={tile({ minHeight: 360, overflow: "hidden" })}>{renderCryptoCard()}</div>
                <div style={tile({ minHeight: 360, overflow: "hidden" })}>{renderStocksCard()}</div>
              </div>
            </div>
          )}
        </main>

        {/* ── FOOTER ── */}
        <footer style={{ textAlign: "center", padding: "10px 0 4px", fontSize: 11, color: "#64748b", flexShrink: 0 }}>
          Built by Juan Spinelli · FastAPI + Docker + AWS S3
        </footer>
      </div>

      <style>{`
        body { background: #050b1a; color: #e2e8f0; min-height: 100vh; }
        .pulse-dot { width: 10px; height: 10px; border-radius: 50%; background: #00ff88; box-shadow: 0 0 18px rgba(0,255,136,0.35); animation: pulse 1.6s ease-in-out infinite; }
        .refresh-button:active { transform: scale(0.96); }
        @keyframes pulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.35); opacity: 0.65; } }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>
    </div>
  );
}
