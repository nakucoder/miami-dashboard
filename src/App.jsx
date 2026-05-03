import { useState, useEffect } from "react";
import axios from "axios";

const W = "http://18.118.107.138:8000/weather";
const C = "http://18.118.107.138:8001/prices";
const S = "http://18.118.107.138:8002/prices";

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

  const renderCoinTile = (k, name, sym) => {
    const coin = crypto?.data?.prices?.[k];
    if (!coin) {
      return (
        <div key={k} style={tile({ flex: 1, justifyContent: "space-between" })}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Skeleton w="32px" h="32px" br="50%" />
              <div><Skeleton w="55px" h="13px" mb="5px" /><Skeleton w="28px" h="10px" /></div>
            </div>
            <div style={{ textAlign: "right" }}><Skeleton w="72px" h="16px" mb="5px" /><Skeleton w="44px" h="11px" /></div>
          </div>
          <Skeleton w="100%" h="3px" br="2px" />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
            <Skeleton w="40%" h="10px" /><Skeleton w="25%" h="10px" />
          </div>
        </div>
      );
    }
    const isUp = coin.change_24h_percent >= 0;
    return (
      <div key={k} style={tile({ flex: 1, justifyContent: "space-between" })}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: `linear-gradient(135deg, ${isUp ? "#00ff88" : "#ff4757"}, rgba(0,0,0,0.4))`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, color: "#fff",
            }}>{sym[0]}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{name}</div>
              <div style={{ fontSize: 10, color: "#64748b" }}>{sym}</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace" }}>${coin.price_usd.toLocaleString()}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: isUp ? "#00ff88" : "#ff4757" }}>{isUp?"▲":"▼"} {Math.abs(coin.change_24h_percent).toFixed(2)}%</div>
          </div>
        </div>
        <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.05)", overflow: "hidden", marginBottom: 6 }}>
          <div style={{ width: `${Math.min(95, Math.max(5, 50 + coin.change_24h_percent * 3))}%`, height: "100%", borderRadius: 2, background: isUp ? "#00ff88" : "#ff4757" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#64748b" }}>
          <span><span style={{ color: "#ff6b6b" }}>H</span> ${coin.high_24h_usd?.toLocaleString()} · <span style={{ color: "#3b82f6" }}>L</span> ${coin.low_24h_usd?.toLocaleString()}</span>
          <span>Vol {coin.volume_24h_usd > 1e9 ? (coin.volume_24h_usd/1e9).toFixed(1)+"B" : (coin.volume_24h_usd/1e6).toFixed(0)+"M"}</span>
        </div>
      </div>
    );
  };

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

      {/* BENTO GRID */}
      <div style={{
        flex: 1,
        display: "grid",
        gridTemplateAreas: `
          "wx-hero btc  stocks stocks"
          "wx-hero eth  stocks stocks"
          "humid   wind sol    hourly"
        `,
        gridTemplateColumns: "1.4fr 1.2fr 1.2fr 1.2fr",
        gridTemplateRows: "3fr 3fr 1.5fr",
        gap: "10px",
        padding: "10px 20px 20px",
        minHeight: 0,
      }}>

        {/* WEATHER HERO */}
        <div style={tile({ gridArea: "wx-hero", justifyContent: "center", alignItems: "center", position: "relative" })}>
          <div style={{ position: "absolute", top: 12, left: 16, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: "#3b82f6", fontSize: 12, fontWeight: 700 }}>⛅ Weather</span>
            <span style={{ fontSize: 10, color: "#64748b" }}>Miami, FL</span>
          </div>
          {!weather ? (
            <div style={{ textAlign: "center" }}>
              <Skeleton w="64px" h="64px" br="50%" mb="12px" />
              <Skeleton w="120px" h="48px" mb="8px" />
              <Skeleton w="80px" h="14px" mb="6px" />
              <Skeleton w="100px" h="12px" />
            </div>
          ) : (
            <div style={{ textAlign: "center", marginTop: 10 }}>
              <div style={{ fontSize: 56, lineHeight: 1, marginBottom: 4 }}>{wmoIcon(weather.data.weather_code, weather.data.is_day)}</div>
              <div style={{ fontSize: 52, fontWeight: 800, lineHeight: 1, letterSpacing: -2 }}>{weather.data.temperature_fahrenheit}°</div>
              <div style={{ fontSize: 14, color: "#94a3b8", marginTop: 4 }}>{wmoCondition(weather.data.weather_code)}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Feels like {feelsLike(weather.data.temperature_fahrenheit, weather.data.wind_speed_kmh)}°F</div>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 10, fontSize: 11, color: "#64748b" }}>
                {wxHL.high != null && <span><span style={{ color: "#ff6b6b" }}>▲</span> {wxHL.high}°</span>}
                {wxHL.low != null && <span><span style={{ color: "#3b82f6" }}>▼</span> {wxHL.low}°</span>}
                <span>☀ {formatTime(weather.data.sunrise) || "6:32 AM"}</span>
                <span>🌙 {formatTime(weather.data.sunset) || "7:48 PM"}</span>
              </div>
            </div>
          )}
        </div>

        {/* HUMIDITY */}
        <div style={tile({ gridArea: "humid", justifyContent: "center" })}>
          {!weather ? (
            <><Skeleton w="50%" h="10px" mb="6px" /><Skeleton w="60%" h="20px" /></>
          ) : (
            <>
              <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>💧 Humidity</div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "monospace", color: "#3b82f6" }}>{weather.data.relative_humidity ?? weather.data.humidity ?? "—"}%</div>
            </>
          )}
        </div>

        {/* WIND */}
        <div style={tile({ gridArea: "wind", justifyContent: "center" })}>
          {!weather ? (
            <><Skeleton w="50%" h="10px" mb="6px" /><Skeleton w="70%" h="20px" /></>
          ) : (
            <>
              <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>💨 Wind</div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{windDesc(weather.data.wind_speed_kmh)}</div>
              <div style={{ fontSize: 10, color: "#64748b", fontFamily: "monospace" }}>{weather.data.wind_speed_kmh} km/h</div>
            </>
          )}
        </div>

        {/* CRYPTO */}
        <div style={{ gridArea: "btc" }}>{renderCoinTile("bitcoin", "Bitcoin", "BTC")}</div>
        <div style={{ gridArea: "eth" }}>{renderCoinTile("ethereum", "Ethereum", "ETH")}</div>
        <div style={{ gridArea: "sol" }}>{renderCoinTile("solana", "Solana", "SOL")}</div>

        {/* HOURLY FORECAST */}
        <div style={tile({ gridArea: "hourly", flexDirection: "row", alignItems: "center", gap: 8, overflow: "auto" })}>
          {!weather?.data?.hourly_forecast ? (
            <div style={{ display: "flex", gap: 12, flex: 1 }}>
              {[0,1,2,3,4,5].map(i => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 40 }}>
                  <Skeleton w="28px" h="10px" />
                  <Skeleton w="18px" h="18px" br="50%" />
                  <Skeleton w="24px" h="12px" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div style={{ fontSize: 10, color: "#64748b", flexShrink: 0, writingMode: "vertical-rl", transform: "rotate(180deg)", letterSpacing: 1, fontWeight: 600 }}>HOURLY</div>
              {weather.data.hourly_forecast.slice(0, 6).map((h, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, minWidth: 38, flex: 1 }}>
                  <span style={{ fontSize: 10, color: "#64748b" }}>{i === 0 ? "Now" : formatHour(h.time)}</span>
                  <span style={{ fontSize: 16 }}>{(h.precipitation_probability || 0) > 30 ? "🌧" : "☀"}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "monospace" }}>{h.temperature_fahrenheit}°</span>
                  {(h.precipitation_probability || 0) > 0 && <span style={{ fontSize: 9, color: "#3b82f6" }}>{h.precipitation_probability}%</span>}
                </div>
              ))}
            </>
          )}
        </div>

        {/* STOCKS */}
        <div style={tile({ gridArea: "stocks" })}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexShrink: 0 }}>
            <span style={{ color: "#a855f7", fontWeight: 700, fontSize: 13 }}>📈 Stocks</span>
            {marketClosed && !hasStockData ? (
              <span style={{ background: "rgba(168,85,247,0.15)", color: "#a855f7", padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 600 }}>Market Closed</span>
            ) : (
              <span style={{ fontSize: 11, color: "#64748b" }}>{hasStockData ? lastTradingDay() : "Market"}</span>
            )}
          </div>

          {marketClosed && (
            <div style={{
              background: "rgba(168,85,247,0.06)", borderRadius: 8, padding: "8px 10px",
              display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexShrink: 0,
            }}>
              <span style={{ fontSize: 16 }}>🔒</span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#a855f7" }}>Weekend — Market Closed</div>
                <div style={{ fontSize: 10, color: "#64748b" }}>Showing {lastTradingDay()}'s closing · Opens Monday</div>
              </div>
            </div>
          )}

          <div style={{
            display: "grid", gridTemplateColumns: "1.8fr 1.2fr 1.2fr 0.8fr",
            padding: "4px 6px", fontSize: 9, color: "#475569",
            textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600, flexShrink: 0,
          }}>
            <span>Symbol</span><span>Price</span><span>Change</span><span>Vol</span>
          </div>

          <div style={{ flex: 1, overflow: "auto", minHeight: 0, display: "flex", flexDirection: "column", justifyContent: "space-evenly" }}>
            {!hasStockData ? (
              <>
                {["NVDA","AAPL","MSFT","VOO","AMZN"].map(sym => (
                  <div key={sym} style={{ display: "grid", gridTemplateColumns: "1.8fr 1.2fr 1.2fr 0.8fr", alignItems: "center", padding: "10px 6px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: 5,
                        background: "rgba(168,85,247,0.15)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, fontWeight: 700, color: "#a855f7",
                      }}>{sym[0]}</div>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{sym}</span>
                    </div>
                    <Skeleton w="65%" h="13px" />
                    <Skeleton w="55%" h="13px" />
                    <Skeleton w="45%" h="13px" />
                  </div>
                ))}
                <div style={{ textAlign: "center", padding: "10px 0", fontSize: 11, color: "#64748b" }}>● No cached data · will populate on market open</div>
              </>
            ) : (
              Object.entries(stocks.data.stocks).map(([sym, stock]) => {
                const change = parseFloat(stock.change_percent);
                const isUp = change >= 0;
                return (
                  <div key={sym} style={{ padding: "8px 6px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1.2fr 1.2fr 0.8fr", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: 5,
                          background: isUp ? "rgba(0,255,136,0.12)" : "rgba(255,71,87,0.12)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 10, fontWeight: 700, color: isUp ? "#00ff88" : "#ff4757",
                        }}>{sym[0]}</div>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{sym}</span>
                      </div>
                      <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 600 }}>${stock.price_usd.toFixed(2)}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: isUp ? "#00ff88" : "#ff4757" }}>{isUp?"▲":"▼"} {Math.abs(change).toFixed(2)}%</span>
                      <span style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>{(stock.volume/1e6).toFixed(1)}M</span>
                    </div>
                    <div style={{ marginTop: 4, height: 2, borderRadius: 2, background: "rgba(255,255,255,0.04)", overflow: "hidden" }}>
                      <div style={{ width: `${Math.min(95, Math.max(5, 50 + change * 5))}%`, height: "100%", borderRadius: 2, background: isUp ? "#00ff88" : "#ff4757", opacity: 0.6 }} />
                    </div>
                  </div>
                );
              })
            )}
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
        *::-webkit-scrollbar{width:3px}
        *::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:3px}
        *::-webkit-scrollbar-track{background:transparent}
      `}</style>
    </div>
  );
}
