import { useState, useEffect } from "react";
import axios from "axios";

const W = "https://miami-dashboard.duckdns.org/weather";
const C = "https://miami-dashboard.duckdns.org/crypto";
const S = "https://miami-dashboard.duckdns.org/stocks";

export default function App() {
  const [weather, setWeather] = useState(null);
  const [crypto, setCrypto] = useState(null);
  const [stocks, setStocks] = useState(null);
  const [updated, setUpdated] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try { const r = await axios.get(W, { timeout: 8000 }); setWeather(r.data); } catch { setWeather(null); }
    try { const r = await axios.get(C, { timeout: 8000 }); setCrypto(r.data); } catch { setCrypto(null); }
    try { const r = await axios.get(S, { timeout: 8000 }); setStocks(r.data); } catch { setStocks(null); }
    setUpdated(new Date().toLocaleTimeString());
    setLoading(false);
  };

  useEffect(() => { fetchAll(); const i = setInterval(fetchAll, 60000); return () => clearInterval(i); }, []);

  const feelsLike = (f, kmh) => { const v = kmh / 1.60934; return (v >= 3 && f <= 50) ? Math.round(35.74 + 0.6215*f - 35.75*Math.pow(v,0.16) + 0.4275*f*Math.pow(v,0.16)) : f; };
  const wmoCondition = (code) => { const m={0:"Clear Sky",1:"Mainly Clear",2:"Partly Cloudy",3:"Overcast",45:"Foggy",48:"Icy Fog",51:"Light Drizzle",53:"Drizzle",55:"Heavy Drizzle",61:"Light Rain",63:"Rain",65:"Heavy Rain",71:"Light Snow",73:"Snow",75:"Heavy Snow",80:"Rain Showers",81:"Rain Showers",82:"Heavy Showers",95:"Thunderstorm",96:"Thunderstorm",99:"Thunderstorm"}; return (code != null && m[code]) ? m[code] : (code == null ? "Clear Sky" : "Partly Cloudy"); };
  const wmoIcon = (code, isDay) => { if (!code || code <= 1) return isDay ? "☀️" : "🌙"; if (code === 2) return isDay ? "⛅" : "🌥"; if (code === 3) return "☁️"; if (code >= 45 && code <= 48) return "🌫️"; if (code >= 51 && code <= 67) return "🌧️"; if (code >= 71 && code <= 77) return "❄️"; if (code >= 80 && code <= 82) return "🌦️"; if (code >= 95) return "⛈️"; return isDay ? "☀️" : "🌙"; };
  const formatHour = (t) => { const d = new Date(t); if (isNaN(d.getTime())) return t; const h = d.getHours(); return h === 0 ? "12AM" : h < 12 ? h + "AM" : h === 12 ? "12PM" : (h - 12) + "PM"; };
  const todayHighLow = (hourly) => { if (!hourly || !hourly.length) return { high: null, low: null }; const temps = hourly.map(h => h.temperature_fahrenheit).filter(t => t != null); return temps.length ? { high: Math.max(...temps), low: Math.min(...temps) } : { high: null, low: null }; };
  const windDesc = (kmh) => kmh < 2 ? "Calm" : kmh < 12 ? "Light breeze" : kmh < 29 ? "Gentle breeze" : kmh < 50 ? "Moderate wind" : kmh < 75 ? "Strong wind" : "Storm";
  const formatTime = (t) => { if (!t) return null; const d = new Date(t); if (isNaN(d.getTime())) return t; return d.toLocaleTimeString("en-US", {hour:"numeric", minute:"2-digit", hour12:true}); };

  const wxHL = todayHighLow(weather?.data?.hourly_forecast);
  const isWeekend = () => { const d = new Date().getDay(); return d === 0 || d === 6; };
  const lastTradingDay = () => { const d = new Date(); const day = d.getDay(); if (day === 6) return "Friday"; if (day === 0) return "Friday"; return "Today"; };
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
    background: "#0d1526",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.06)",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    minHeight: 0,
    ...extra,
  });

  const cryptoCoins = [["bitcoin","Bitcoin","BTC"],["ethereum","Ethereum","ETH"],["solana","Solana","SOL"]];

  return (
    <div style={{
      background: "#0a0f1e",
      color: "#e2e8f0",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}>
      {/* HEADER */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "10px 20px", flexShrink: 0,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ position: "relative", width: 10, height: 10 }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#00ff88", animation: "ping 1.5s infinite" }} />
            <div style={{ position: "absolute", inset: 1, borderRadius: "50%", background: "#00ff88" }} />
          </div>
          <span style={{ color: "#00ff88", fontSize: 10, fontWeight: 600, letterSpacing: 1 }}>LIVE</span>
          <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: -0.3 }}>Miami Data Dashboard</h1>
          <span style={{ fontSize: 11, color: "#64748b" }}>weather · crypto · markets</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {updated && <span style={{ fontSize: 11, color: "#64748b" }}>{updated}</span>}
          <button onClick={fetchAll} style={{
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
            color: "#e2e8f0", padding: "4px 12px", borderRadius: 8, cursor: "pointer",
            fontSize: 12, fontWeight: 500,
          }}>↻ {loading ? "..." : "Refresh"}</button>
        </div>
      </div>

      {/* TOP SECTION: 3 EQUAL CARDS (60% height) */}
      <div style={{
        height: "60%",
        display: "flex",
        gap: "12px",
        padding: "12px 20px",
        minHeight: 0,
      }} className="top-section">
        {/* WEATHER CARD */}
        <div style={tile({ flex: 1, justifyContent: "space-between" })} className="weather-card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexShrink: 0 }}>
            <span style={{ color: "#3b82f6", fontWeight: 700, fontSize: 12 }}>⛅ Weather</span>
            <span style={{ fontSize: 10, color: "#64748b" }}>Miami, FL</span>
          </div>
          {!weather ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 8 }}>
              <Skeleton w="56px" h="56px" br="50%" />
              <Skeleton w="100px" h="32px" />
              <Skeleton w="80px" h="12px" />
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
              <div style={{ fontSize: 48, lineHeight: 1, marginBottom: 8 }} className="icon">{wmoIcon(weather.data.weather_code, weather.data.is_day)}</div>
              <div style={{ fontSize: 44, fontWeight: 800, lineHeight: 1, letterSpacing: -1, fontFamily: "monospace" }} className="temperature">{weather.data.temperature_fahrenheit}°</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{wmoCondition(weather.data.weather_code)}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Feels like {feelsLike(weather.data.temperature_fahrenheit, weather.data.wind_speed_kmh)}°F</div>
            </div>
          )}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 8, flexShrink: 0 }}>
            {!weather ? (
              <>
                <Skeleton w="100%" h="10px" mb="4px" />
                <Skeleton w="100%" h="10px" mb="4px" />
                <Skeleton w="100%" h="10px" />
              </>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 10, color: "#64748b", marginBottom: 4 }}>
                  <span><span style={{ color: "#ff6b6b" }}>H</span> {wxHL.high != null ? wxHL.high : "—"}°</span>
                  <span><span style={{ color: "#3b82f6" }}>L</span> {wxHL.low != null ? wxHL.low : "—"}°</span>
                  <span>☀ {formatTime(weather.data.sunrise) || "6:32 AM"}</span>
                  <span>🌙 {formatTime(weather.data.sunset) || "7:48 PM"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 10, color: "#64748b" }} className="details">
                  <span>💧 {weather.data.relative_humidity ?? weather.data.humidity ?? "—"}%</span>
                  <span>💨 {weather.data.wind_speed_kmh} km/h</span>
                </div>
              </>
            )}
          </div>
          {/* Hourly Forecast Compact */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 8, marginTop: 8, flexShrink: 0 }} className="hourly">
            {!weather?.data?.hourly_forecast ? (
              <div style={{ display: "flex", gap: 6, justifyContent: "space-around" }}>
                {[0,1,2,3,4,5].map(i => <Skeleton key={i} w="22px" h="32px" br="4px" />)}
              </div>
            ) : (
              <div style={{ display: "flex", gap: 6, justifyContent: "space-around" }}>
                {weather.data.hourly_forecast.slice(0, 6).map((h, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, fontSize: 9, minWidth: 0 }}>
                    <span style={{ color: "#64748b", whiteSpace: "nowrap" }}>{i === 0 ? "Now" : formatHour(h.time)}</span>
                    <span style={{ fontSize: 14 }}>{(h.precipitation_probability || 0) > 30 ? "🌧" : "☀"}</span>
                    <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{h.temperature_fahrenheit}°</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CRYPTO CARD */}
        <div style={tile({ flex: 1, justifyContent: "space-evenly", overflow: "auto" })}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexShrink: 0 }}>
            <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: 12 }}>₿ Crypto</span>
          </div>
          {cryptoCoins.map(([k, name, sym]) => {
            const coin = crypto?.data?.prices?.[k];
            if (!coin) {
              return (
                <div key={k} style={{
                  flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-around",
                  padding: "10px", borderRadius: 10,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(248,165,194,0.1)",
                }}>
                  <div><Skeleton w="48px" h="48px" br="50%" /></div>
                  <Skeleton w="100%" h="20px" />
                  <Skeleton w="100%" h="40px" />
                </div>
              );
            }
            const isUp = coin.change_24h_percent >= 0;
            const sparklineData = [30, 65, 45, 72, 55, 80, 50];
            return (
              <div key={k} style={{
                flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-around",
                padding: "12px", borderRadius: 10,
                background: "rgba(255,255,255,0.02)",
                border: `2px solid ${isUp ? "rgba(0,255,136,0.3)" : "rgba(255,71,87,0.3)"}`,
                boxShadow: `0 0 12px ${isUp ? "rgba(0,255,136,0.1)" : "rgba(255,71,87,0.1)"}, inset 0 0 20px ${isUp ? "rgba(0,255,136,0.05)" : "rgba(255,71,87,0.05)"}`,
                animation: `glow 2s ease-in-out infinite`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: "50%",
                    background: `linear-gradient(135deg, ${isUp ? "#00ff88" : "#ff4757"}, ${isUp ? "rgba(0,255,136,0.3)" : "rgba(255,71,87,0.3)"})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18, fontWeight: 700, color: "#fff", flexShrink: 0,
                    boxShadow: `0 0 16px ${isUp ? "rgba(0,255,136,0.4)" : "rgba(255,71,87,0.4)"}`,
                  }}>{sym[0]}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#cbd5e1" }}>{sym}</div>
                    <div style={{ fontSize: 10, color: "#64748b" }}>{name}</div>
                  </div>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "monospace", color: "#f1f5f9" }}>${coin.price_usd.toLocaleString()}</div>
                <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 32, justifyContent: "space-between" }}>
                  {sparklineData.map((h, i) => (
                    <div key={i} style={{
                      flex: 1, height: `${(h / 80) * 100}%`,
                      background: `linear-gradient(180deg, ${isUp ? "#00ff88" : "#ff4757"}, ${isUp ? "rgba(0,255,136,0.3)" : "rgba(255,71,87,0.3)"})`,
                      borderRadius: "2px 2px 0 0",
                      opacity: 0.7,
                    }} />
                  ))}
                </div>
                <div style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  background: isUp ? "rgba(0,255,136,0.15)" : "rgba(255,71,87,0.15)",
                  color: isUp ? "#00ff88" : "#ff4757",
                  padding: "6px 12px", borderRadius: 20,
                  fontSize: 13, fontWeight: 700, fontFamily: "monospace",
                  border: `1px solid ${isUp ? "rgba(0,255,136,0.3)" : "rgba(255,71,87,0.3)"}`,
                  width: "fit-content", margin: "0 auto",
                }}>{isUp?"▲":"▼"} {Math.abs(coin.change_24h_percent).toFixed(2)}%</div>
              </div>
            );
          })}
        </div>

        {/* STOCKS CARD */}
        <div style={tile({ flex: 1, justifyContent: "space-evenly", overflow: "auto" })}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexShrink: 0 }}>
            <span style={{ color: "#a855f7", fontWeight: 700, fontSize: 12 }}>📈 Stocks</span>
            {marketClosed && !hasStockData ? (
              <span style={{ background: "rgba(168,85,247,0.15)", color: "#a855f7", padding: "2px 6px", borderRadius: 4, fontSize: 9, fontWeight: 600 }}>Closed</span>
            ) : (
              <span style={{ fontSize: 9, color: "#64748b" }}>{hasStockData ? lastTradingDay() : "—"}</span>
            )}
          </div>

          {marketClosed && (
            <div style={{
              background: "rgba(168,85,247,0.06)", borderRadius: 6, padding: "6px 8px",
              display: "flex", alignItems: "center", gap: 6, marginBottom: 8, flexShrink: 0, fontSize: 9,
            }}>
              <span>🔒</span>
              <div>
                <div style={{ fontWeight: 600, color: "#a855f7" }}>Market Closed</div>
                <div style={{ color: "#64748b", lineHeight: 1.2 }}>Showing {lastTradingDay()}'s data</div>
              </div>
            </div>
          )}

          {!hasStockData ? (
            <>
              {["NVDA","AAPL","MSFT","VOO","AMZN"].map(sym => (
                <div key={sym} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-around", padding: "10px", borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(168,85,247,0.1)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 6, background: "rgba(168,85,247,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#a855f7" }}>{sym[0]}</div>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{sym}</span>
                  </div>
                  <Skeleton w="100%" h="20px" />
                  <Skeleton w="100%" h="8px" />
                </div>
              ))}
            </>
          ) : (
            Object.entries(stocks.data.stocks).map(([sym, stock]) => {
              const change = parseFloat(stock.change_percent);
              const isUp = change >= 0;
              return (
                <div key={sym} style={{
                  flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-around",
                  padding: "10px", borderRadius: 8,
                  background: "rgba(255,255,255,0.02)",
                  borderLeft: `4px solid ${isUp ? "#00ff88" : "#ff4757"}`,
                  border: `1px solid ${isUp ? "rgba(0,255,136,0.2)" : "rgba(255,71,87,0.2)"}`,
                  borderLeftWidth: "4px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 6,
                        background: isUp ? "rgba(0,255,136,0.15)" : "rgba(255,71,87,0.15)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, fontWeight: 700, color: isUp ? "#00ff88" : "#ff4757",
                        border: `1px solid ${isUp ? "rgba(0,255,136,0.3)" : "rgba(255,71,87,0.3)"}`,
                      }}>{sym[0]}</div>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{sym}</span>
                    </div>
                    <div style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      background: isUp ? "rgba(0,255,136,0.15)" : "rgba(255,71,87,0.15)",
                      color: isUp ? "#00ff88" : "#ff4757",
                      padding: "4px 10px", borderRadius: 16,
                      fontSize: 11, fontWeight: 700, fontFamily: "monospace",
                      border: `1px solid ${isUp ? "rgba(0,255,136,0.3)" : "rgba(255,71,87,0.3)"}`,
                    }}>{isUp?"▲":"▼"} {Math.abs(change).toFixed(2)}%</div>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "monospace", color: "#f1f5f9" }}>${stock.price_usd.toFixed(2)}</div>
                  <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                    <div style={{
                      width: `${Math.min(100, Math.max(5, 50 + Math.abs(change) * 8))}%`,
                      height: "100%", borderRadius: 3,
                      background: isUp ? "linear-gradient(90deg, #00ff88, #00dd77)" : "linear-gradient(90deg, #ff4757, #ff2a40)",
                      opacity: 0.8,
                    }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* BOTTOM SECTION: ANALYTICS CARD (40% height) */}
      <div style={{
        height: "40%",
        padding: "12px 20px",
        minHeight: 0,
      }} className="bottom-section">
        <div style={tile({ height: "100%", overflow: "auto" })}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexShrink: 0 }}>
            <span style={{ color: "#06b6d4", fontWeight: 700, fontSize: 12 }}>📊 Historical Trends</span>
          </div>
          <div style={{
            display: "flex", gap: 16, height: "calc(100% - 32px)", alignItems: "flex-end", justifyContent: "space-around",
          }}>
            {/* Placeholder skeleton charts */}
            {[0,1,2,3,4,5,6,7,8,9].map(i => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1 }}>
                <div style={{
                  width: "100%", height: `${30 + Math.random() * 60}%`,
                  background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(59,130,246,0.4))",
                  borderRadius: "4px 4px 0 0",
                  border: "1px solid rgba(59,130,246,0.3)",
                }}/>
                <div style={{ fontSize: 10, color: "#64748b" }}>
                  Historical data coming soon
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{
        textAlign: "center", padding: "6px 10px 8px", fontSize: 11, color: "#475569", flexShrink: 0,
      }}>
        Built by Juan Spinelli · FastAPI + Docker + AWS S3
      </div>

      <style>{`
        @keyframes ping{0%{transform:scale(1);opacity:0.4}100%{transform:scale(2.5);opacity:0}}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes glow{0%{box-shadow:0 0 12px rgba(0,255,136,0.1), inset 0 0 20px rgba(0,255,136,0.05)}50%{box-shadow:0 0 20px rgba(0,255,136,0.2), inset 0 0 30px rgba(0,255,136,0.1)}100%{box-shadow:0 0 12px rgba(0,255,136,0.1), inset 0 0 20px rgba(0,255,136,0.05)}}
        *::-webkit-scrollbar{width:3px}
        *::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:3px}
        *::-webkit-scrollbar-track{background:transparent}
        
        /* TABLET: 768px - 1024px */
        @media (max-width: 1024px) {
          .top-section {
            gap: 10px !important;
            padding: 12px 16px !important;
          }
        }
        
        /* MOBILE: below 768px - STACK VERTICALLY */
        @media (max-width: 768px) {
          .top-section {
            height: 55% !important;
            flex-direction: column !important;
            gap: 10px !important;
            padding: 10px 16px !important;
          }
          .top-section > div {
            flex: 1 !important;
            min-height: 110px;
          }
          .weather-card .icon {
            font-size: 36px !important;
          }
          .weather-card .temperature {
            font-size: 32px !important;
          }
          .weather-card .hourly {
            font-size: 8px !important;
          }
          .weather-card .details {
            font-size: 9px !important;
          }
          .weather-card {
            overflow-y: auto !important;
          }
        }
        
        /* SMALL MOBILE: below 480px */
        @media (max-width: 480px) {
          .top-section {
            height: 50% !important;
            padding: 8px 12px !important;
            gap: 8px !important;
          }
          .top-section > div {
            min-height: 90px;
          }
        }
        
        /* LANDSCAPE MOBILE: max-height 500px and landscape orientation */
        @media (max-height: 500px) and (orientation: landscape) {
          .top-section {
            height: 70% !important;
            flex-direction: row !important;
            gap: 8px !important;
            padding: 8px !important;
          }
          .top-section > div {
            overflow-y: auto !important;
          }
          .bottom-section {
            height: 30% !important;
          }
        }
      `}</style>
    </div>
  );
}
