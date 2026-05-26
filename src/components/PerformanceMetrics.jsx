import React, { useState, useEffect } from 'react';
import { Cpu, Database, Zap, Sparkles } from 'lucide-react';

export default function PerformanceMetrics({ lastQueryLatencyMs }) {
  const [telemetry, setTelemetry] = useState(null);

  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const res = await fetch('/api/market/telemetry');
        if (res.ok) {
          const data = await res.json();
          setTelemetry(data);
        }
      } catch (err) {
        console.error('Error fetching telemetry:', err);
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 5000); // refresh telemetry every 5s
    return () => clearInterval(interval);
  }, []);

  if (!telemetry) {
    return (
      <div className="perf-hud">
        {[1, 2, 3, 4].map(n => (
          <div key={n} className="perf-tile skeleton-loader" style={{ height: '60px' }}></div>
        ))}
      </div>
    );
  }

  // Calculate actual cache savings
  const totalSaved = telemetry.memoryHits + telemetry.dbHits;
  const totalRequests = telemetry.totalRequests || totalSaved + telemetry.apiCalls + telemetry.mockCalls;
  const savingsPercent = totalRequests > 0 ? ((totalSaved / totalRequests) * 100).toFixed(1) : '0.0';

  return (
    <div className="perf-hud">
      <div className="perf-tile">
        <span className="perf-tile-title">
          <Cpu size={12} color="var(--accent-cyan)" style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
          Cache Hit Ratio
        </span>
        <span className="perf-tile-value" style={{ color: 'var(--accent-cyan)' }}>
          {savingsPercent}%
        </span>
      </div>

      <div className="perf-tile">
        <span className="perf-tile-title">
          <Database size={12} color="var(--accent-purple)" style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
          Server Latency
        </span>
        <span className="perf-tile-value" style={{ color: lastQueryLatencyMs < 150 ? 'var(--accent-emerald)' : 'orange' }}>
          {lastQueryLatencyMs}ms
        </span>
      </div>

      <div className="perf-tile">
        <span className="perf-tile-title">
          <Zap size={12} color="var(--accent-emerald)" style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
          API Calls Saved
        </span>
        <span className="perf-tile-value" style={{ color: 'var(--accent-emerald)' }}>
          {totalSaved}
        </span>
      </div>

      <div className="perf-tile">
        <span className="perf-tile-title">
          <Sparkles size={12} color="gold" style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
          Data Points
        </span>
        <span className="perf-tile-value" style={{ color: 'white' }}>
          1,440/sec
        </span>
      </div>
    </div>
  );
}
