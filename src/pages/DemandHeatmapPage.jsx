import React, { useState, useEffect, useRef, useCallback } from 'react';
import client from '../api/client';

const MOGADISHU = { lat: 8.4737, lng: 47.1208 };

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  };
  const toHex = (x) => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

function getHeatColor(intensity) {
  // 0 = cool blue, 0.5 = yellow, 1 = hot red
  if (intensity < 0.5) {
    const t = intensity * 2;
    return hslToHex(240 - t * 120, 80, 50);
  }
  const t = (intensity - 0.5) * 2;
  return hslToHex(120 - t * 120, 90, 45 + t * 10);
}

export default function DemandHeatmapPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: result } = await client.get(`/admin/demand-heatmap?days=${days}`);
      setData(result);
    } catch (e) {
      console.error('Heatmap fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const points = data?.points || [];
  const meta = data?.meta || {};
  const center = meta.center || MOGADISHU;

  // Compute map bounds from data
  const bounds = points.length > 0 ? {
    minLat: Math.min(...points.map(p => p.lat)) - 0.005,
    maxLat: Math.max(...points.map(p => p.lat)) + 0.005,
    minLng: Math.min(...points.map(p => p.lng)) - 0.005,
    maxLng: Math.max(...points.map(p => p.lng)) + 0.005,
  } : {
    minLat: center.lat - 0.05,
    maxLat: center.lat + 0.05,
    minLng: center.lng - 0.05,
    maxLng: center.lng + 0.05,
  };

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const dpr = window.devicePixelRatio || 1;

    ctx.clearRect(0, 0, w, h);

    // Draw background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, w, h);

    // Draw grid lines
    ctx.strokeStyle = '#2a2a3e';
    ctx.lineWidth = 0.5;
    const latRange = bounds.maxLat - bounds.minLat;
    const lngRange = bounds.maxLng - bounds.minLng;

    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * w;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      const y = (i / 10) * h;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Draw coordinate labels
    ctx.fillStyle = '#666';
    ctx.font = `${10 * dpr}px monospace`;
    ctx.textAlign = 'left';
    ctx.fillText(`${bounds.maxLat.toFixed(4)}°N`, 4, 14);
    ctx.fillText(`${bounds.minLat.toFixed(4)}°N`, 4, h - 4);
    ctx.textAlign = 'right';
    ctx.fillText(`${bounds.maxLng.toFixed(4)}°E`, w - 4, 14);
    ctx.fillText(`${bounds.minLng.toFixed(4)}°E`, w - 4, h - 4);

    // Convert lat/lng to pixel
    const toPixel = (lat, lng) => ({
      x: ((lng - bounds.minLng) / lngRange) * w,
      y: ((bounds.maxLat - lat) / latRange) * h,
    });

    // Draw heatmap circles
    points.forEach((point) => {
      const pos = toPixel(point.lat, point.lng);
      const baseRadius = Math.max(8, Math.min(30, (point.rides + point.orders) * 2));
      const radius = baseRadius * dpr;
      const color = getHeatColor(point.intensity);

      // Glow effect
      const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, radius * 2);
      gradient.addColorStop(0, color + 'AA');
      gradient.addColorStop(0.5, color + '55');
      gradient.addColorStop(1, color + '00');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius * 2, 0, Math.PI * 2);
      ctx.fill();

      // Core circle
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius * 0.6, 0, Math.PI * 2);
      ctx.fill();

      // Count label
      if (point.rides + point.orders >= 3) {
        ctx.fillStyle = '#FFF';
        ctx.font = `bold ${9 * dpr}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.round(point.rides + point.orders)}`, pos.x, pos.y + 3);
      }
    });

    // Draw center marker if no points
    if (points.length === 0) {
      const centerPos = toPixel(center.lat, center.lng);
      ctx.fillStyle = '#0A8E4E';
      ctx.beginPath();
      ctx.arc(centerPos.x, centerPos.y, 6 * dpr, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#AAA';
      ctx.font = `${11 * dpr}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('No demand data yet', centerPos.x, centerPos.y + 20);
    }
  }, [points, bounds, center]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    drawCanvas();
  }, [drawCanvas]);

  const handleCanvasMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const x = (e.clientX - rect.left);
    const y = (e.clientY - rect.top);
    setMousePos({ x: e.clientX, y: e.clientY });

    // Find nearest point
    const lngRange = bounds.maxLng - bounds.minLng;
    const latRange = bounds.maxLat - bounds.minLat;
    const w = rect.width;
    const h = rect.height;

    const clickLng = bounds.minLng + (x / w) * lngRange;
    const clickLat = bounds.maxLat - (y / h) * latRange;

    let closest = null;
    let closestDist = Infinity;
    points.forEach((p) => {
      const dist = Math.sqrt(Math.pow(p.lat - clickLat, 2) + Math.pow(p.lng - clickLng, 2));
      if (dist < closestDist && dist < 0.01) {
        closestDist = dist;
        closest = p;
      }
    });
    setHoveredPoint(closest);
  };

  const totalRides = meta.totalRides || 0;
  const totalOrders = meta.totalOrders || 0;
  const totalRevenue = points.reduce((s, p) => s + p.revenue, 0);
  const hotspots = [...points].sort((a, b) => (b.rides + b.orders) - (a.rides + a.orders)).slice(0, 10);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={styles.title}>Demand Heatmap</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {[7, 14, 30, 90].map((d) => (
            <button key={d} onClick={() => setDays(d)} style={{
              ...styles.rangeBtn,
              ...(days === d ? styles.rangeBtnActive : {}),
            }}>{d}d</button>
          ))}
        </div>
      </div>

      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: '#0A8E4E' }}>{totalRides}</div>
          <div style={styles.statLabel}>Ride Requests</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: '#FF9500' }}>{totalOrders}</div>
          <div style={styles.statLabel}>Food Orders</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: '#FFF' }}>{points.length}</div>
          <div style={styles.statLabel}>Demand Clusters</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: '#34C759' }}>${totalRevenue.toFixed(0)}</div>
          <div style={styles.statLabel}>Revenue</div>
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <div
          ref={containerRef}
          style={{ background: '#1A1A2E', borderRadius: 14, overflow: 'hidden', border: '1px solid #2A2A2A' }}
        >
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: 450, cursor: 'crosshair' }}
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={() => setHoveredPoint(null)}
          />
        </div>

        {hoveredPoint && (
          <div style={{
            position: 'absolute',
            left: mousePos.x - containerRef.current?.getBoundingClientRect().left + 12,
            top: mousePos.y - containerRef.current?.getBoundingClientRect().top - 12,
            background: '#2A2A2A',
            border: '1px solid #444',
            borderRadius: 10,
            padding: '10px 14px',
            pointerEvents: 'none',
            zIndex: 10,
            minWidth: 160,
          }}>
            <div style={{ color: '#FFF', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
              📍 {hoveredPoint.lat.toFixed(4)}, {hoveredPoint.lng.toFixed(4)}
            </div>
            <div style={{ color: '#0A8E4E', fontSize: 11 }}>🛺 {Math.round(hoveredPoint.rides)} rides</div>
            <div style={{ color: '#FF9500', fontSize: 11 }}>🍔 {Math.round(hoveredPoint.orders)} orders</div>
            <div style={{ color: '#AAA', fontSize: 11 }}>💰 ${hoveredPoint.revenue.toFixed(0)} revenue</div>
          </div>
        )}

        {/* Legend */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 12, padding: '8px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 14, height: 14, borderRadius: 4, background: getHeatColor(0) }} />
            <span style={{ color: '#AAA', fontSize: 12 }}>Low</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 14, height: 14, borderRadius: 4, background: getHeatColor(0.5) }} />
            <span style={{ color: '#AAA', fontSize: 12 }}>Medium</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 14, height: 14, borderRadius: 4, background: getHeatColor(1) }} />
            <span style={{ color: '#AAA', fontSize: 12 }}>High</span>
          </div>
        </div>
      </div>

      {hotspots.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={styles.subTitle}>Top Demand Hotspots</h3>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Location</th>
                  <th style={styles.th}>Rides</th>
                  <th style={styles.th}>Orders</th>
                  <th style={styles.th}>Revenue</th>
                  <th style={styles.th}>Intensity</th>
                </tr>
              </thead>
              <tbody>
                {hotspots.map((p, i) => (
                  <tr key={i}>
                    <td style={styles.td}>{i + 1}</td>
                    <td style={styles.td}>{p.lat.toFixed(4)}, {p.lng.toFixed(4)}</td>
                    <td style={{ ...styles.td, color: '#0A8E4E' }}>{Math.round(p.rides)}</td>
                    <td style={{ ...styles.td, color: '#FF9500' }}>{Math.round(p.orders)}</td>
                    <td style={styles.td}>${p.revenue.toFixed(2)}</td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 60, height: 8, borderRadius: 4, background: '#2A2A2A', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.round(p.intensity * 100)}%`, height: '100%', borderRadius: 4, background: getHeatColor(p.intensity) }} />
                        </div>
                        <span style={{ color: '#AAA', fontSize: 11 }}>{Math.round(p.intensity * 100)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  title: { fontSize: 28, fontWeight: 800, color: '#FFF', margin: 0 },
  rangeBtn: { background: '#2A2A2A', color: '#AAA', border: '1px solid #333', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13 },
  rangeBtnActive: { background: '#0A8E4E', color: '#FFF', borderColor: '#0A8E4E' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 },
  statCard: { background: '#1A1A1A', borderRadius: 14, padding: 20 },
  statValue: { fontSize: 28, fontWeight: 800, marginBottom: 4 },
  statLabel: { color: '#AAA', fontSize: 12, textTransform: 'uppercase' },
  subTitle: { fontSize: 16, fontWeight: 700, color: '#FFF', marginBottom: 12 },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '10px 12px', color: '#AAA', fontSize: 12, textTransform: 'uppercase', borderBottom: '1px solid #2A2A2A' },
  td: { padding: '10px 12px', borderBottom: '1px solid #2A2A2A', fontSize: 14, color: '#FFF' },
};
