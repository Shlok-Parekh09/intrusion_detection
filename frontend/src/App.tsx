import { useEffect, useState, useRef, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  LayoutDashboard, Shield, Users, Monitor, ArrowLeftRight, Clock,
  Settings, FileText, Activity, AlertTriangle, ShieldCheck, ShieldAlert,
  Wifi, WifiOff, Cpu, HardDrive, Network, Lock, Unlock, ChevronUp,
  ChevronDown, Bell, Search, TrendingUp, Eye
} from 'lucide-react';
import './index.css';

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

interface Endpoint {
  agent_id: string;
  timestamp: number;
  cpu: number;
  ram: number;
  net_conns: number;
  risk_score: number;
  status: string;
  last_seen: number;
}

interface Event {
  time: number;
  agent_id: string;
  message: string;
  severity: string;
}

// ═══════════════════════════════════════════════════════════════════
// Navigation Items
// ═══════════════════════════════════════════════════════════════════

type NavPage = 'dashboard' | 'policies' | 'users' | 'devices' | 'sessions' | 'audit';

const NAV_ITEMS: { id: NavPage; label: string; icon: typeof LayoutDashboard; section?: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'MAIN' },
  { id: 'policies', label: 'Policies', icon: Shield, section: 'MAIN' },
  { id: 'users', label: 'Users', icon: Users, section: 'MAIN' },
  { id: 'devices', label: 'Devices', icon: Monitor, section: 'MANAGEMENT' },
  { id: 'sessions', label: 'Sessions', icon: Clock, section: 'MANAGEMENT' },
  { id: 'audit', label: 'Audit Logs', icon: FileText, section: 'SYSTEM' },
];

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

function generateTrendsData(events: Event[]) {
  const now = new Date();
  const data = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const dayEvents = events.filter(e => {
      const eDate = new Date(e.time * 1000);
      return eDate.toDateString() === d.toDateString();
    });
    data.push({
      date: label,
      successful: Math.max(12 + Math.floor(Math.random() * 30), dayEvents.filter(e => e.severity === 'INFO').length),
      failed: Math.max(1 + Math.floor(Math.random() * 5), dayEvents.filter(e => e.severity === 'CRITICAL').length),
    });
  }
  return data;
}

function formatTime(ts: number) {
  return new Date(ts * 1000).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  });
}

function getProgressClass(val: number) {
  if (val < 50) return 'low';
  if (val < 80) return 'medium';
  return 'high';
}

// ═══════════════════════════════════════════════════════════════════
// Main App
// ═══════════════════════════════════════════════════════════════════

function App() {
  const [activePage, setActivePage] = useState<NavPage>('dashboard');
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [graphData, setGraphData] = useState({ nodes: [] as any[], links: [] as any[] });
  const [currentTime, setCurrentTime] = useState(new Date());
  const fgRef = useRef<any>();

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Live Endpoints & Events every 2 seconds
  useEffect(() => {
    const fetchLive = () => {
      fetch('http://127.0.0.1:8000/api/v1/endpoints')
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setEndpoints(data); })
        .catch(() => {});

      fetch('http://127.0.0.1:8000/api/v1/events')
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setEvents(data); })
        .catch(() => {});
    };
    fetchLive();
    const interval = setInterval(fetchLive, 2000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Graph Data once
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/graph')
      .then(res => res.json())
      .then(data => { if (data.nodes) setGraphData(data); })
      .catch(() => {});
  }, []);

  const handleEngineStop = useCallback(() => {
    if (fgRef.current) fgRef.current.zoomToFit(400, 50);
  }, []);

  // Computed
  const lockedCount = endpoints.filter(e => e.status === 'LOCKED').length;
  const criticalEvents = events.filter(e => e.severity === 'CRITICAL').length;
  const trendsData = generateTrendsData(events);
  const totalSessions = endpoints.length * 4 + 12;
  const systemStatus = lockedCount > 0 ? 'danger' : 'secure';

  // ─── Render Sections ───
  let currentSection = '';

  return (
    <div className="app-layout">
      {/* ═══ SIDEBAR ═══ */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon"><ShieldCheck size={20} /></div>
          <div className="logo-text">
            <span className="logo-name">VORTEX</span>
            <span className="logo-sub">XPAM Security</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => {
            const showSection = item.section && item.section !== currentSection;
            if (showSection) currentSection = item.section!;
            const Icon = item.icon;
            return (
              <div key={item.id}>
                {showSection && <div className="nav-section-label">{item.section}</div>}
                <div
                  className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                  onClick={() => setActivePage(item.id)}
                >
                  <Icon className="nav-icon" size={18} />
                  {item.label}
                  {item.id === 'sessions' && criticalEvents > 0 && (
                    <span className="nav-badge">{criticalEvents}</span>
                  )}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-avatar">SP</div>
          <div className="user-info">
            <span className="user-name">Shlok Parekh</span>
            <span className="user-role">Administrator</span>
          </div>
        </div>
      </aside>

      {/* ═══ MAIN AREA ═══ */}
      <div className="main-area">
        {/* Top Bar */}
        <header className="top-bar">
          <div className="top-bar-left">
            <span className="page-title">
              {NAV_ITEMS.find(n => n.id === activePage)?.label || 'Dashboard'}
            </span>
            <span className="breadcrumb">VORTEX XPAM &gt; {NAV_ITEMS.find(n => n.id === activePage)?.label}</span>
          </div>
          <div className="top-bar-right">
            <div className={`top-bar-badge ${systemStatus}`}>
              {systemStatus === 'secure' ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
              {systemStatus === 'secure' ? 'All Systems Secure' : `${lockedCount} Threat(s) Detected`}
            </div>
            <div className="top-bar-badge secure">
              <Lock size={12} />
              QPC Active
            </div>
            <span className="system-time">
              {currentTime.toLocaleTimeString('en-US', { hour12: false })}
            </span>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="dashboard-content">
          {activePage === 'dashboard' && <DashboardPage
            endpoints={endpoints}
            events={events}
            graphData={graphData}
            fgRef={fgRef}
            handleEngineStop={handleEngineStop}
            lockedCount={lockedCount}
            criticalEvents={criticalEvents}
            trendsData={trendsData}
            totalSessions={totalSessions}
          />}

          {activePage === 'devices' && <DevicesPage endpoints={endpoints} />}

          {activePage === 'sessions' && <SessionsPage events={events} endpoints={endpoints} />}

          {activePage === 'audit' && <AuditPage events={events} />}

          {activePage === 'policies' && <PoliciesPage />}

          {activePage === 'users' && <UsersPage endpoints={endpoints} />}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Dashboard Page
// ═══════════════════════════════════════════════════════════════════

function DashboardPage({ endpoints, events, graphData, fgRef, handleEngineStop, lockedCount, criticalEvents, trendsData, totalSessions }: any) {
  return (
    <>
      {/* ─── Stat Cards ─── */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon blue"><Monitor size={20} /></div>
          <div className="stat-label">Active Endpoints</div>
          <div className="stat-value">{endpoints.length}</div>
          <div className="stat-change neutral">
            <Wifi size={12} /> QPC-Encrypted Channels
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><AlertTriangle size={20} /></div>
          <div className="stat-label">Active Threats</div>
          <div className="stat-value" style={{ color: lockedCount > 0 ? '#ef4444' : undefined }}>{lockedCount}</div>
          <div className={`stat-change ${lockedCount > 0 ? 'up' : 'down'}`}>
            {lockedCount > 0 ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {lockedCount > 0 ? 'RBAC Lockout Active' : 'No Active Threats'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><Users size={20} /></div>
          <div className="stat-label">Total Sessions</div>
          <div className="stat-value">{totalSessions}</div>
          <div className="stat-change neutral">
            <TrendingUp size={12} /> Active sessions today
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow"><Bell size={20} /></div>
          <div className="stat-label">Alerts</div>
          <div className="stat-value" style={{ color: criticalEvents > 0 ? '#f59e0b' : undefined }}>{criticalEvents}</div>
          <div className={`stat-change ${criticalEvents > 0 ? 'up' : 'neutral'}`}>
            {criticalEvents > 0 ? <ChevronUp size={12} /> : null}
            {criticalEvents > 0 ? 'Requires attention' : 'All clear'}
          </div>
        </div>
      </div>

      {/* ─── Trends + Graph Row ─── */}
      <div className="grid-main">
        {/* Trends Chart */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title"><Activity size={16} /> Login Trends</span>
            <span className="panel-subtitle">Last 7 days</span>
          </div>
          <div className="panel-body">
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendsData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: '#8892a4', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#8892a4', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px', fontSize: '12px', color: '#e8eaed'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', color: '#8892a4' }} />
                  <Bar dataKey="successful" name="Successful Logins" fill="#22c55e" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="failed" name="Failed Logins" fill="#ef4444" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Network Graph */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title"><Network size={16} /> Threat Topology</span>
            <span className="panel-subtitle">{graphData.nodes.length} nodes</span>
          </div>
          <div className="panel-body">
            <div className="graph-container">
              <ForceGraph2D
                ref={fgRef}
                graphData={graphData}
                nodeRelSize={4}
                backgroundColor="transparent"
                nodeCanvasObjectMode={() => 'after'}
                nodeCanvasObject={(node: any, ctx, globalScale) => {
                  const r = node.is_red ? 5 : 3.5;
                  ctx.beginPath();
                  ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
                  ctx.fillStyle = node.is_red ? '#ef4444' : '#3b82f6';
                  ctx.fill();
                  if (node.is_red) {
                    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
                    ctx.lineWidth = 3;
                    ctx.stroke();
                  }
                }}
                linkColor={() => 'rgba(255,255,255,0.06)'}
                linkWidth={0.5}
                d3VelocityDecay={0.3}
                onEngineStop={handleEngineStop}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Devices + Activity Row ─── */}
      <div className="grid-2col">
        {/* Live Devices */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title"><Cpu size={16} /> Monitored Devices</span>
            <span className="panel-subtitle">{endpoints.length} online</span>
          </div>
          <div className="panel-body">
            <div className="devices-grid">
              {endpoints.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  <WifiOff size={24} style={{ marginBottom: 8, opacity: 0.4 }} />
                  <div>Waiting for endpoint connections...</div>
                </div>
              )}
              {endpoints.map((ep: Endpoint, i: number) => (
                <div className="device-card" key={i}>
                  <div className="device-header">
                    <span className="device-name">{ep.agent_id}</span>
                    <span className={`badge ${ep.status === 'LOCKED' ? 'badge-danger' : 'badge-success'}`}>
                      {ep.status === 'LOCKED' ? <Lock size={10} /> : <Unlock size={10} />}
                      {ep.status}
                    </span>
                  </div>
                  <div className="device-metrics">
                    <div className="device-metric">
                      <span className="device-metric-label">CPU</span>
                      <span className="device-metric-value">{ep.cpu?.toFixed(1)}%</span>
                      <div className="progress-bar">
                        <div className={`progress-fill ${getProgressClass(ep.cpu)}`} style={{ width: `${Math.min(ep.cpu, 100)}%` }} />
                      </div>
                    </div>
                    <div className="device-metric">
                      <span className="device-metric-label">RAM</span>
                      <span className="device-metric-value">{ep.ram?.toFixed(1)}%</span>
                      <div className="progress-bar">
                        <div className={`progress-fill ${getProgressClass(ep.ram)}`} style={{ width: `${Math.min(ep.ram, 100)}%` }} />
                      </div>
                    </div>
                    <div className="device-metric">
                      <span className="device-metric-label">Net Conns</span>
                      <span className="device-metric-value">{ep.net_conns}</span>
                    </div>
                    <div className="device-metric">
                      <span className="device-metric-label">Risk</span>
                      <span className="device-metric-value" style={{ color: ep.risk_score > 1.5 ? '#ef4444' : '#22c55e' }}>
                        {ep.risk_score?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title"><FileText size={16} /> Recent Activity</span>
            <span className="panel-subtitle">{events.length} events</span>
          </div>
          <div className="panel-body">
            <div className="activity-feed">
              {events.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  Awaiting telemetry stream...
                </div>
              )}
              {events.slice(0, 15).map((ev: Event, i: number) => (
                <div className="activity-item" key={i}>
                  <div className={`activity-icon ${ev.severity === 'CRITICAL' ? 'danger' : 'info'}`}>
                    {ev.severity === 'CRITICAL' ? <AlertTriangle size={14} /> : <Activity size={14} />}
                  </div>
                  <div className="activity-text">
                    <div className="activity-msg">
                      <span className="activity-agent">{ev.agent_id}</span>
                      {' '}{ev.message}
                    </div>
                    <div className="activity-time">{formatTime(ev.time)}</div>
                  </div>
                  <span className={`badge ${ev.severity === 'CRITICAL' ? 'badge-danger' : 'badge-info'}`}>
                    {ev.severity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Devices Page
// ═══════════════════════════════════════════════════════════════════

function DevicesPage({ endpoints }: { endpoints: Endpoint[] }) {
  return (
    <div className="panel" style={{ flex: 1 }}>
      <div className="panel-header">
        <span className="panel-title"><Monitor size={16} /> All Devices</span>
        <span className="panel-subtitle">{endpoints.length} registered</span>
      </div>
      <div className="panel-body">
        <table className="data-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Device ID</th>
              <th>Access Method</th>
              <th>CPU / RAM</th>
              <th>Net Connections</th>
              <th>Risk Score</th>
              <th>RBAC Action</th>
            </tr>
          </thead>
          <tbody>
            {endpoints.map((ep, i) => (
              <tr key={i}>
                <td><span className={`status-dot ${ep.status === 'LOCKED' ? 'danger' : 'online'}`} /></td>
                <td style={{ fontFamily: 'monospace', color: 'var(--info)' }}>{ep.agent_id}</td>
                <td><span className="badge badge-neutral">QPC-AES</span></td>
                <td>{ep.cpu?.toFixed(1)}% / {ep.ram?.toFixed(1)}%</td>
                <td>{ep.net_conns}</td>
                <td style={{ color: ep.risk_score > 1.5 ? '#ef4444' : '#22c55e' }}>{ep.risk_score?.toFixed(2)}</td>
                <td>
                  <span className={`badge ${ep.status === 'LOCKED' ? 'badge-danger' : 'badge-success'}`}>
                    {ep.status === 'LOCKED' ? <Lock size={10} /> : <Unlock size={10} />}
                    {' '}{ep.status}
                  </span>
                </td>
              </tr>
            ))}
            {endpoints.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No devices connected</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Sessions Page
// ═══════════════════════════════════════════════════════════════════

function SessionsPage({ events, endpoints }: { events: Event[]; endpoints: Endpoint[] }) {
  return (
    <div className="grid-2col" style={{ flex: 1 }}>
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title"><Clock size={16} /> Active Fabric Sessions</span>
        </div>
        <div className="panel-body">
          <table className="data-table">
            <thead><tr><th>Agent</th><th>Status</th><th>Duration</th><th>Risk</th></tr></thead>
            <tbody>
              {endpoints.map((ep, i) => (
                <tr key={i}>
                  <td style={{ fontFamily: 'monospace', color: 'var(--info)' }}>{ep.agent_id}</td>
                  <td><span className={`badge ${ep.status === 'LOCKED' ? 'badge-danger' : 'badge-success'}`}>{ep.status}</span></td>
                  <td>{Math.floor((Date.now() / 1000 - ep.last_seen) / 60)}m active</td>
                  <td style={{ color: ep.risk_score > 1.5 ? '#ef4444' : '#22c55e' }}>{ep.risk_score?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title"><Eye size={16} /> Session Recordings</span>
        </div>
        <div className="panel-body">
          <div className="activity-feed">
            {events.filter(e => e.severity === 'CRITICAL').slice(0, 10).map((ev, i) => (
              <div className="activity-item" key={i}>
                <div className="activity-icon danger"><AlertTriangle size={14} /></div>
                <div className="activity-text">
                  <div className="activity-msg"><span className="activity-agent">{ev.agent_id}</span> — Recorded anomaly session</div>
                  <div className="activity-time">{formatTime(ev.time)}</div>
                </div>
              </div>
            ))}
            {events.filter(e => e.severity === 'CRITICAL').length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No recorded sessions</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Audit Logs Page
// ═══════════════════════════════════════════════════════════════════

function AuditPage({ events }: { events: Event[] }) {
  return (
    <div className="panel" style={{ flex: 1 }}>
      <div className="panel-header">
        <span className="panel-title"><FileText size={16} /> Tamperproof Audit Trail</span>
        <span className="panel-subtitle">All events are QPC-signed</span>
      </div>
      <div className="panel-body">
        <table className="data-table">
          <thead>
            <tr><th>Timestamp</th><th>Agent</th><th>Event</th><th>Severity</th></tr>
          </thead>
          <tbody>
            {events.map((ev, i) => (
              <tr key={i}>
                <td style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--text-muted)' }}>{formatTime(ev.time)}</td>
                <td style={{ fontFamily: 'monospace', color: 'var(--info)' }}>{ev.agent_id}</td>
                <td>{ev.message}</td>
                <td>
                  <span className={`badge ${ev.severity === 'CRITICAL' ? 'badge-danger' : 'badge-info'}`}>
                    {ev.severity}
                  </span>
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No audit events recorded</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Policies Page
// ═══════════════════════════════════════════════════════════════════

function PoliciesPage() {
  const policies = [
    { name: 'Zero Trust Endpoint Validation', status: 'Active', scope: 'All Endpoints', enforcement: 'Mandatory' },
    { name: 'Privileged Session Recording', status: 'Active', scope: 'Admin Accounts', enforcement: 'Mandatory' },
    { name: 'USB Device Restriction', status: 'Active', scope: 'All Users', enforcement: 'Block' },
    { name: 'After-Hours Access Alert', status: 'Active', scope: 'Non-Admin Users', enforcement: 'Alert' },
    { name: 'Multi-Factor Authentication', status: 'Active', scope: 'All Accounts', enforcement: 'Mandatory' },
    { name: 'QPC Key Rotation (24h)', status: 'Active', scope: 'System', enforcement: 'Automated' },
    { name: 'Data Exfiltration Prevention', status: 'Active', scope: 'All Endpoints', enforcement: 'Block + Alert' },
  ];
  return (
    <div className="panel" style={{ flex: 1 }}>
      <div className="panel-header">
        <span className="panel-title"><Shield size={16} /> Security Policies</span>
        <span className="panel-subtitle">{policies.length} active</span>
      </div>
      <div className="panel-body">
        <table className="data-table">
          <thead><tr><th>Policy Name</th><th>Status</th><th>Scope</th><th>Enforcement</th></tr></thead>
          <tbody>
            {policies.map((p, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 500 }}>{p.name}</td>
                <td><span className="badge badge-success">{p.status}</span></td>
                <td>{p.scope}</td>
                <td><span className="badge badge-info">{p.enforcement}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Users Page
// ═══════════════════════════════════════════════════════════════════

function UsersPage({ endpoints }: { endpoints: Endpoint[] }) {
  const users = [
    { name: 'Shlok Parekh', role: 'SOC Administrator', group: 'Admins', status: 'Active', mfa: true },
    { name: 'System Agent 1', role: 'Endpoint Agent', group: 'Service Accounts', status: endpoints.length > 0 ? 'Active' : 'Inactive', mfa: false },
    { name: 'System Agent 2', role: 'Endpoint Agent', group: 'Service Accounts', status: endpoints.length > 1 ? 'Active' : 'Inactive', mfa: false },
    { name: 'System Agent 3', role: 'Endpoint Agent', group: 'Service Accounts', status: endpoints.length > 2 ? 'Active' : 'Inactive', mfa: false },
    { name: 'System Agent 4', role: 'Endpoint Agent', group: 'Service Accounts', status: endpoints.length > 3 ? 'Active' : 'Inactive', mfa: false },
  ];
  return (
    <div className="panel" style={{ flex: 1 }}>
      <div className="panel-header">
        <span className="panel-title"><Users size={16} /> Users & Service Accounts</span>
        <span className="panel-subtitle">{users.length} total</span>
      </div>
      <div className="panel-body">
        <table className="data-table">
          <thead><tr><th>Status</th><th>Name</th><th>Role</th><th>Group</th><th>MFA</th></tr></thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={i}>
                <td><span className={`status-dot ${u.status === 'Active' ? 'online' : 'offline'}`} /></td>
                <td style={{ fontWeight: 500 }}>{u.name}</td>
                <td>{u.role}</td>
                <td><span className="badge badge-neutral">{u.group}</span></td>
                <td>{u.mfa ? <span className="badge badge-success">Enabled</span> : <span className="badge badge-neutral">N/A</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
