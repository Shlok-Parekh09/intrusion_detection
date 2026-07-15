import { useEffect, useState, useRef, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from 'recharts';
import {
  LayoutDashboard, Shield, Users, Monitor, Clock, FileText, Activity,
  AlertTriangle, ShieldCheck, ShieldAlert, Cpu, Network, Lock, Unlock,
  ChevronUp, ChevronDown, Bell, TrendingUp, Eye, WifiOff, Search,
  UserX, UserCheck, KeyRound, RotateCcw, Ban, ToggleLeft, ToggleRight,
  Trash2, X
} from 'lucide-react';
import './index.css';

const API = 'http://127.0.0.1:8000';

// ═══ Types ═══
interface Endpoint { agent_id: string; timestamp: number; cpu: number; ram: number; net_conns: number; risk_score: number; status: string; last_seen: number; }
interface Event { time: number; agent_id: string; message: string; severity: string; category?: string; }
interface ManagedUser { id: string; name: string; role: string; group: string; department: string; access_level: string; status: string; mfa: boolean; risk_score: number; login_count_today: number; failed_logins_today: number; files_accessed_today: number; after_hours_activity: boolean; usb_attempts: number; last_login: number; }
interface Policy { id: string; name: string; enabled: boolean; scope: string; enforcement: string; category: string; violations: number; }
interface Session { id: string; agent_id: string; started: number; last_activity: number; status: string; protocol: string; bytes_transferred: number; duration_seconds: number; idle_seconds: number; }

type NavPage = 'dashboard' | 'policies' | 'users' | 'devices' | 'sessions' | 'audit';
const NAV_ITEMS: { id: NavPage; label: string; icon: any; section?: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'MAIN' },
  { id: 'users', label: 'Users & Access', icon: Users, section: 'MAIN' },
  { id: 'policies', label: 'Policies', icon: Shield, section: 'MANAGEMENT' },
  { id: 'devices', label: 'Devices', icon: Monitor, section: 'MANAGEMENT' },
  { id: 'sessions', label: 'Sessions', icon: Clock, section: 'MONITORING' },
  { id: 'audit', label: 'Audit Logs', icon: FileText, section: 'MONITORING' },
];

function fmtTime(ts: number) { return new Date(ts * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }); }
function fmtBytes(b: number) { if (b < 1024) return b + ' B'; if (b < 1048576) return (b / 1024).toFixed(1) + ' KB'; return (b / 1048576).toFixed(1) + ' MB'; }
function progClass(v: number) { return v < 50 ? 'low' : v < 80 ? 'medium' : 'high'; }
function riskColor(r: number) { return r >= 0.8 ? '#ef4444' : r >= 0.5 ? '#f59e0b' : r >= 0.3 ? '#3b82f6' : '#22c55e'; }
function riskLabel(r: number) { return r >= 0.8 ? 'Critical' : r >= 0.5 ? 'High' : r >= 0.3 ? 'Medium' : 'Low'; }
function riskBadge(r: number) { return r >= 0.8 ? 'badge-danger' : r >= 0.5 ? 'badge-warning' : r >= 0.3 ? 'badge-info' : 'badge-success'; }
function statusBadge(s: string) { return s === 'active' ? 'badge-success' : s === 'locked' ? 'badge-danger' : s === 'under_investigation' ? 'badge-warning' : s === 'revoked' ? 'badge-danger' : 'badge-neutral'; }

function App() {
  const [page, setPage] = useState<NavPage>('dashboard');
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [graphData, setGraphData] = useState({ nodes: [] as any[], links: [] as any[] });
  const [clock, setClock] = useState(new Date());
  const [toast, setToast] = useState<string | null>(null);
  const fgRef = useRef<any>();

  // Clock
  useEffect(() => { const t = setInterval(() => setClock(new Date()), 1000); return () => clearInterval(t); }, []);

  // Toast auto-dismiss
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); } }, [toast]);

  // Fetch live data
  useEffect(() => {
    const tick = () => {
      fetch(`${API}/api/v1/endpoints`).then(r => r.json()).then(d => { if (Array.isArray(d)) setEndpoints(d); }).catch(() => {});
      fetch(`${API}/api/v1/events?limit=50`).then(r => r.json()).then(d => { if (Array.isArray(d)) setEvents(d); }).catch(() => {});
      fetch(`${API}/api/v1/users`).then(r => r.json()).then(d => { if (Array.isArray(d)) setUsers(d); }).catch(() => {});
      fetch(`${API}/api/v1/policies`).then(r => r.json()).then(d => { if (Array.isArray(d)) setPolicies(d); }).catch(() => {});
      fetch(`${API}/api/v1/sessions`).then(r => r.json()).then(d => { if (Array.isArray(d)) setSessions(d); }).catch(() => {});
    };
    tick();
    const iv = setInterval(tick, 3000);
    return () => clearInterval(iv);
  }, []);

  // Graph once
  useEffect(() => { fetch(`${API}/api/graph`).then(r => r.json()).then(d => { if (d.nodes) setGraphData(d); }).catch(() => {}); }, []);

  const onEngineStop = useCallback(() => { fgRef.current?.zoomToFit(400, 30); }, []);

  // API actions
  const userAction = async (uid: string, action: string, reason?: string) => {
    const r = await fetch(`${API}/api/v1/users/${uid}/action`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, reason }) });
    const d = await r.json();
    setToast(d.message || `Action ${action} completed`);
    // Refresh users
    fetch(`${API}/api/v1/users`).then(r => r.json()).then(d => { if (Array.isArray(d)) setUsers(d); });
    fetch(`${API}/api/v1/events?limit=50`).then(r => r.json()).then(d => { if (Array.isArray(d)) setEvents(d); });
  };

  const togglePolicy = async (pid: string, enabled: boolean) => {
    await fetch(`${API}/api/v1/policies/${pid}/toggle`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled }) });
    setToast(`Policy ${enabled ? 'enabled' : 'disabled'}`);
    fetch(`${API}/api/v1/policies`).then(r => r.json()).then(d => { if (Array.isArray(d)) setPolicies(d); });
    fetch(`${API}/api/v1/events?limit=50`).then(r => r.json()).then(d => { if (Array.isArray(d)) setEvents(d); });
  };

  const killSession = async (agentId: string) => {
    await fetch(`${API}/api/v1/sessions/${agentId}/kill`, { method: 'POST' });
    setToast(`Session ${agentId} terminated`);
    fetch(`${API}/api/v1/sessions`).then(r => r.json()).then(d => { if (Array.isArray(d)) setSessions(d); });
    fetch(`${API}/api/v1/events?limit=50`).then(r => r.json()).then(d => { if (Array.isArray(d)) setEvents(d); });
  };

  const locked = endpoints.filter(e => e.status === 'LOCKED').length;
  const criticals = events.filter(e => e.severity === 'CRITICAL').length;
  const highRiskUsers = users.filter(u => u.risk_score >= 0.5).length;
  let curSection = '';

  return (
    <div className="app-layout">
      {/* ═══ SIDEBAR ═══ */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon"><ShieldCheck size={18} /></div>
          <div className="logo-text">
            <span className="logo-name">VORTEX</span>
            <span className="logo-sub">XPAM Security</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => {
            const show = item.section && item.section !== curSection;
            if (show) curSection = item.section!;
            const Icon = item.icon;
            return (<div key={item.id}>
              {show && <div className="nav-section-label">{item.section}</div>}
              <div className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => setPage(item.id)}>
                <Icon className="nav-icon" size={16} />
                {item.label}
                {item.id === 'users' && highRiskUsers > 0 && <span className="nav-badge">{highRiskUsers}</span>}
                {item.id === 'audit' && criticals > 0 && <span className="nav-badge">{criticals}</span>}
              </div>
            </div>);
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="user-avatar">SP</div>
          <div className="user-info">
            <span className="user-name">Shlok Parekh</span>
            <span className="user-role">SOC Admin</span>
          </div>
        </div>
      </aside>

      {/* ═══ MAIN ═══ */}
      <div className="main-area">
        <header className="top-bar">
          <div className="top-bar-left">
            <span className="page-title">{NAV_ITEMS.find(n => n.id === page)?.label || 'Dashboard'}</span>
          </div>
          <div className="top-bar-right">
            <div className={`top-bar-badge ${locked > 0 ? 'danger' : 'secure'}`}>
              {locked > 0 ? <ShieldAlert size={13} /> : <ShieldCheck size={13} />}
              {locked > 0 ? `${locked} Threat(s)` : 'Secure'}
            </div>
            <div className="top-bar-badge secure"><Lock size={11} /> QPC</div>
            <span className="system-time">{clock.toLocaleTimeString('en-US', { hour12: false })}</span>
          </div>
        </header>

        <div className="dashboard-content">
          {page === 'dashboard' && <PageDashboard endpoints={endpoints} events={events} graphData={graphData} fgRef={fgRef} onEngineStop={onEngineStop} users={users} locked={locked} criticals={criticals} sessions={sessions} />}
          {page === 'users' && <PageUsers users={users} userAction={userAction} />}
          {page === 'policies' && <PagePolicies policies={policies} togglePolicy={togglePolicy} />}
          {page === 'devices' && <PageDevices endpoints={endpoints} />}
          {page === 'sessions' && <PageSessions sessions={sessions} killSession={killSession} />}
          {page === 'audit' && <PageAudit events={events} />}
        </div>

        {/* Toast */}
        {toast && <div className="toast">{toast}</div>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════
function PageDashboard({ endpoints, events, graphData, fgRef, onEngineStop, users, locked, criticals, sessions }: any) {
  const trends = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    trends.push({ date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), successful: 15 + Math.floor(Math.random() * 25), failed: 1 + Math.floor(Math.random() * 6) });
  }
  const riskDist = [
    { name: 'Low', value: users.filter((u: any) => u.risk_score < 0.3).length, color: '#22c55e' },
    { name: 'Medium', value: users.filter((u: any) => u.risk_score >= 0.3 && u.risk_score < 0.5).length, color: '#3b82f6' },
    { name: 'High', value: users.filter((u: any) => u.risk_score >= 0.5 && u.risk_score < 0.8).length, color: '#f59e0b' },
    { name: 'Critical', value: users.filter((u: any) => u.risk_score >= 0.8).length, color: '#ef4444' },
  ];

  return (<>
    {/* Stats */}
    <div className="stats-row">
      <StatCard icon={<Monitor size={18} />} iconClass="blue" label="Active Endpoints" value={endpoints.length} sub={<><Cpu size={11} /> QPC Encrypted</>} />
      <StatCard icon={<AlertTriangle size={18} />} iconClass="red" label="Active Threats" value={locked} valueColor={locked > 0 ? '#ef4444' : undefined} sub={locked > 0 ? <><ChevronUp size={11} /> RBAC Lockout</> : <><ChevronDown size={11} /> Clear</>} subClass={locked > 0 ? 'up' : 'down'} />
      <StatCard icon={<Users size={18} />} iconClass="yellow" label="High-Risk Users" value={users.filter((u: any) => u.risk_score >= 0.5).length} valueColor={users.filter((u: any) => u.risk_score >= 0.5).length > 0 ? '#f59e0b' : undefined} sub={<><Eye size={11} /> Behavioral AI</>} />
      <StatCard icon={<Bell size={18} />} iconClass="red" label="Critical Alerts" value={criticals} valueColor={criticals > 0 ? '#ef4444' : undefined} sub={criticals > 0 ? <><ChevronUp size={11} /> Needs attention</> : <>All clear</>} subClass={criticals > 0 ? 'up' : 'neutral'} />
    </div>

    {/* Charts row */}
    <div className="grid-main">
      <div className="panel">
        <div className="panel-header"><span className="panel-title"><Activity size={14} /> Login Trends</span><span className="panel-subtitle">7 days</span></div>
        <div className="panel-body"><div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trends} barGap={1} barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill: '#8892a4', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8892a4', fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={{ background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 11, color: '#e8eaed' }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="successful" name="Success" fill="#22c55e" radius={[2, 2, 0, 0]} />
              <Bar dataKey="failed" name="Failed" fill="#ef4444" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div></div>
      </div>
      <div className="panel">
        <div className="panel-header"><span className="panel-title"><Shield size={14} /> Risk Distribution</span></div>
        <div className="panel-body"><div className="chart-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={riskDist} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, value }: any) => value > 0 ? `${name}: ${value}` : ''} labelLine={false}>
                {riskDist.map((e: any, i: number) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 11, color: '#e8eaed' }} />
            </PieChart>
          </ResponsiveContainer>
        </div></div>
      </div>
    </div>

    {/* Graph + Activity */}
    <div className="grid-2col">
      <div className="panel">
        <div className="panel-header"><span className="panel-title"><Network size={14} /> Threat Topology</span><span className="panel-subtitle">{graphData.nodes.length} nodes</span></div>
        <div className="panel-body"><div className="graph-container" style={{ minHeight: 280 }}>
          <ForceGraph2D ref={fgRef} graphData={graphData} nodeRelSize={3} backgroundColor="transparent"
            nodeCanvasObjectMode={() => 'after'}
            nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, gs: number) => {
              const r = node.is_red ? 3.5 : 2.5;
              ctx.beginPath(); ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
              ctx.fillStyle = node.is_red ? '#ef4444' : '#3b82f6'; ctx.fill();
              if (node.is_red) { ctx.strokeStyle = 'rgba(239,68,68,0.3)'; ctx.lineWidth = 1.5; ctx.stroke(); }
              if (gs > 1.5) { ctx.font = `${8 / gs}px Inter`; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillText(node.label, node.x, node.y + r + 1); }
            }}
            linkColor={() => 'rgba(255,255,255,0.04)'} linkWidth={0.4} d3VelocityDecay={0.3} cooldownTicks={80} onEngineStop={onEngineStop}
          />
        </div></div>
      </div>
      <div className="panel">
        <div className="panel-header"><span className="panel-title"><FileText size={14} /> Live Activity</span><span className="panel-subtitle">{events.length}</span></div>
        <div className="panel-body"><div className="activity-feed">
          {events.length === 0 && <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>Awaiting events...</div>}
          {events.slice(0, 12).map((ev: Event, i: number) => (
            <div className="activity-item" key={i}>
              <div className={`activity-icon ${ev.severity === 'CRITICAL' ? 'danger' : 'info'}`}>
                {ev.severity === 'CRITICAL' ? <AlertTriangle size={12} /> : <Activity size={12} />}
              </div>
              <div className="activity-text">
                <div className="activity-msg"><span className="activity-agent">{ev.agent_id}</span> {ev.message}</div>
                <div className="activity-time">{fmtTime(ev.time)}</div>
              </div>
              <span className={`badge ${ev.severity === 'CRITICAL' ? 'badge-danger' : 'badge-info'}`} style={{ fontSize: 9, alignSelf: 'flex-start' }}>{ev.severity}</span>
            </div>
          ))}
        </div></div>
      </div>
    </div>

    {/* Devices row */}
    {endpoints.length > 0 && <div className="panel">
      <div className="panel-header"><span className="panel-title"><Cpu size={14} /> Endpoint Telemetry</span><span className="panel-subtitle">{endpoints.length} online</span></div>
      <div className="panel-body"><div className="devices-grid">
        {endpoints.map((ep: Endpoint, i: number) => (
          <div className="device-card" key={i}>
            <div className="device-header">
              <span className="device-name">{ep.agent_id}</span>
              <span className={`badge ${ep.status === 'LOCKED' ? 'badge-danger' : 'badge-success'}`}>{ep.status === 'LOCKED' ? <Lock size={9} /> : <Unlock size={9} />} {ep.status}</span>
            </div>
            <div className="device-metrics">
              <div className="device-metric"><span className="device-metric-label">CPU</span><span className="device-metric-value">{ep.cpu?.toFixed(0)}%</span><div className="progress-bar"><div className={`progress-fill ${progClass(ep.cpu)}`} style={{ width: `${Math.min(ep.cpu, 100)}%` }} /></div></div>
              <div className="device-metric"><span className="device-metric-label">RAM</span><span className="device-metric-value">{ep.ram?.toFixed(0)}%</span><div className="progress-bar"><div className={`progress-fill ${progClass(ep.ram)}`} style={{ width: `${Math.min(ep.ram, 100)}%` }} /></div></div>
              <div className="device-metric"><span className="device-metric-label">Conns</span><span className="device-metric-value">{ep.net_conns}</span></div>
              <div className="device-metric"><span className="device-metric-label">Risk</span><span className="device-metric-value" style={{ color: ep.risk_score > 1.5 ? '#ef4444' : '#22c55e' }}>{ep.risk_score?.toFixed(1)}</span></div>
            </div>
          </div>
        ))}
      </div></div>
    </div>}
  </>);
}

function StatCard({ icon, iconClass, label, value, valueColor, sub, subClass }: any) {
  return (<div className="stat-card">
    <div className={`stat-icon ${iconClass}`}>{icon}</div>
    <div className="stat-label">{label}</div>
    <div className="stat-value" style={{ color: valueColor }}>{value}</div>
    <div className={`stat-change ${subClass || 'neutral'}`}>{sub}</div>
  </div>);
}

// ═══════════════════════════════════════════════════════════════════
// USERS PAGE — Full Insider Threat Management
// ═══════════════════════════════════════════════════════════════════
function PageUsers({ users, userAction }: { users: ManagedUser[]; userAction: (uid: string, action: string, reason?: string) => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [behaviorData, setBehaviorData] = useState<any>(null);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(filter.toLowerCase()) ||
    u.id.toLowerCase().includes(filter.toLowerCase()) ||
    u.role.toLowerCase().includes(filter.toLowerCase())
  );

  const loadBehavior = async (uid: string) => {
    setSelected(uid);
    try {
      const r = await fetch(`${API}/api/v1/analytics/behavior/${uid}`);
      setBehaviorData(await r.json());
    } catch { setBehaviorData(null); }
  };

  return (<div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0 }}>
    {/* User List */}
    <div className="panel" style={{ flex: selected ? 3 : 1, minWidth: 0 }}>
      <div className="panel-header">
        <span className="panel-title"><Users size={14} /> User & Access Management</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 8, top: 7, color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Search users..." value={filter} onChange={e => setFilter(e.target.value)}
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 4, padding: '5px 8px 5px 28px', color: 'var(--text-primary)', fontSize: 12, width: 180, outline: 'none' }} />
          </div>
        </div>
      </div>
      <div className="panel-body">
        <table className="data-table">
          <thead><tr><th>Risk</th><th>User</th><th>Role</th><th>Dept</th><th>Access</th><th>Status</th><th>MFA</th><th>Files</th><th>Logins</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} onClick={() => loadBehavior(u.id)} style={{ cursor: 'pointer', background: selected === u.id ? 'rgba(59,130,246,0.08)' : undefined }}>
                <td><span className={`badge ${riskBadge(u.risk_score)}`} style={{ minWidth: 50, justifyContent: 'center' }}>{(u.risk_score * 100).toFixed(0)}%</span></td>
                <td><div style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.id}</div></td>
                <td style={{ fontSize: 12 }}>{u.role}</td>
                <td style={{ fontSize: 12 }}>{u.department}</td>
                <td><span className={`badge ${u.access_level === 'Privileged' ? 'badge-warning' : u.access_level === 'None' ? 'badge-danger' : 'badge-neutral'}`}>{u.access_level}</span></td>
                <td><span className={`badge ${statusBadge(u.status)}`}>{u.status}</span></td>
                <td>{u.mfa ? <span className="badge badge-success">On</span> : <span className="badge badge-danger">Off</span>}</td>
                <td style={{ fontVariantNumeric: 'tabular-nums' }}>{u.files_accessed_today}</td>
                <td style={{ fontVariantNumeric: 'tabular-nums' }}>{u.login_count_today} <span style={{ color: u.failed_logins_today >= 3 ? '#ef4444' : 'var(--text-muted)', fontSize: 11 }}>({u.failed_logins_today}F)</span></td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {u.status === 'active' && <ActionBtn icon={<Lock size={11} />} color="#ef4444" title="Lock Account" onClick={e => { e.stopPropagation(); userAction(u.id, 'lock', 'Manual lock by admin'); }} />}
                    {u.status !== 'active' && u.status !== 'revoked' && <ActionBtn icon={<Unlock size={11} />} color="#22c55e" title="Unlock" onClick={e => { e.stopPropagation(); userAction(u.id, 'unlock'); }} />}
                    {u.status === 'active' && <ActionBtn icon={<Eye size={11} />} color="#f59e0b" title="Investigate" onClick={e => { e.stopPropagation(); userAction(u.id, 'investigate', 'Suspicious behavior'); }} />}
                    {!u.mfa && <ActionBtn icon={<KeyRound size={11} />} color="#3b82f6" title="Force MFA" onClick={e => { e.stopPropagation(); userAction(u.id, 'force_mfa'); }} />}
                    {u.status !== 'revoked' && <ActionBtn icon={<Ban size={11} />} color="#ef4444" title="Revoke All Access" onClick={e => { e.stopPropagation(); userAction(u.id, 'revoke_access', 'Insider threat confirmed'); }} />}
                    <ActionBtn icon={<RotateCcw size={11} />} color="#8892a4" title="Reset Risk" onClick={e => { e.stopPropagation(); userAction(u.id, 'reset_risk'); }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* Behavioral Analysis Panel */}
    {selected && behaviorData && <div className="panel" style={{ flex: 2, minWidth: 280 }}>
      <div className="panel-header">
        <span className="panel-title"><TrendingUp size={14} /> Behavioral Analysis</span>
        <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}><X size={14} /></button>
      </div>
      <div className="panel-body padded" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 12, borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: riskColor(behaviorData.risk_score), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff' }}>
            {(behaviorData.risk_score * 100).toFixed(0)}
          </div>
          <div><div style={{ fontWeight: 600, fontSize: 15 }}>{behaviorData.name}</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Risk: {riskLabel(behaviorData.risk_score)}</div></div>
        </div>

        {/* Anomaly indicators */}
        {behaviorData.anomalies && Object.entries(behaviorData.anomalies).map(([key, data]: [string, any]) => (
          <div key={key} style={{ background: data.flagged ? 'rgba(239,68,68,0.06)' : 'rgba(0,0,0,0.15)', border: `1px solid ${data.flagged ? 'rgba(239,68,68,0.2)' : 'var(--border-color)'}`, borderRadius: 6, padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'capitalize', color: data.flagged ? '#ef4444' : 'var(--text-primary)' }}>
                {key.replace(/_/g, ' ')}
              </span>
              {data.flagged ? <span className="badge badge-danger" style={{ fontSize: 9 }}>FLAGGED</span> : <span className="badge badge-success" style={{ fontSize: 9 }}>NORMAL</span>}
            </div>
            {data.current !== undefined && <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              Current: <strong>{data.current}</strong> | Baseline: {data.baseline}
              {data.deviation !== undefined && <span style={{ color: data.deviation > 100 ? '#ef4444' : 'var(--text-muted)', marginLeft: 4 }}>({data.deviation > 0 ? '+' : ''}{data.deviation}%)</span>}
            </div>}
            {data.failed !== undefined && <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Failed: <strong style={{ color: data.failed >= 3 ? '#ef4444' : 'inherit' }}>{data.failed}</strong></div>}
            {data.detected !== undefined && <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Detected: <strong>{data.detected ? 'Yes' : 'No'}</strong></div>}
            {data.count !== undefined && <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Attempts: <strong>{data.count}</strong></div>}
            {data.enabled !== undefined && <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Enabled: <strong>{data.enabled ? 'Yes' : 'No'}</strong></div>}
          </div>
        ))}
      </div>
    </div>}
  </div>);
}

function ActionBtn({ icon, color, title, onClick }: any) {
  return <button onClick={onClick} title={title} style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${color}33`, borderRadius: 4, padding: '3px 6px', cursor: 'pointer', color, display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}>{icon}</button>;
}

// ═══════════════════════════════════════════════════════════════════
// POLICIES PAGE
// ═══════════════════════════════════════════════════════════════════
function PagePolicies({ policies, togglePolicy }: { policies: Policy[]; togglePolicy: (pid: string, enabled: boolean) => void }) {
  return (<div className="panel" style={{ flex: 1 }}>
    <div className="panel-header"><span className="panel-title"><Shield size={14} /> Security Policies</span><span className="panel-subtitle">{policies.filter(p => p.enabled).length}/{policies.length} active</span></div>
    <div className="panel-body">
      <table className="data-table">
        <thead><tr><th>Enabled</th><th>Policy</th><th>Category</th><th>Scope</th><th>Enforcement</th><th>Violations</th></tr></thead>
        <tbody>
          {policies.map(p => (
            <tr key={p.id}>
              <td>
                <button onClick={() => togglePolicy(p.id, !p.enabled)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: p.enabled ? '#22c55e' : '#ef4444', padding: 2, display: 'flex' }} title={p.enabled ? 'Disable' : 'Enable'}>
                  {p.enabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                </button>
              </td>
              <td style={{ fontWeight: 500, opacity: p.enabled ? 1 : 0.5 }}>{p.name}</td>
              <td><span className="badge badge-neutral">{p.category}</span></td>
              <td style={{ fontSize: 12 }}>{p.scope}</td>
              <td><span className="badge badge-info">{p.enforcement}</span></td>
              <td>{p.violations > 0 ? <span className="badge badge-danger">{p.violations}</span> : <span style={{ color: 'var(--text-muted)' }}>0</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>);
}

// ═══════════════════════════════════════════════════════════════════
// DEVICES PAGE
// ═══════════════════════════════════════════════════════════════════
function PageDevices({ endpoints }: { endpoints: Endpoint[] }) {
  return (<div className="panel" style={{ flex: 1 }}>
    <div className="panel-header"><span className="panel-title"><Monitor size={14} /> Device Registry</span><span className="panel-subtitle">{endpoints.length} connected</span></div>
    <div className="panel-body">
      <table className="data-table">
        <thead><tr><th></th><th>Device ID</th><th>Protocol</th><th>CPU</th><th>RAM</th><th>Connections</th><th>Risk</th><th>RBAC</th></tr></thead>
        <tbody>
          {endpoints.map((ep, i) => (
            <tr key={i}>
              <td><span className={`status-dot ${ep.status === 'LOCKED' ? 'danger' : 'online'}`} /></td>
              <td style={{ fontFamily: 'monospace', color: 'var(--info)', fontWeight: 600 }}>{ep.agent_id}</td>
              <td><span className="badge badge-neutral">QPC-AES-256</span></td>
              <td>{ep.cpu?.toFixed(1)}%<div className="progress-bar" style={{ width: 60 }}><div className={`progress-fill ${progClass(ep.cpu)}`} style={{ width: `${Math.min(ep.cpu, 100)}%` }} /></div></td>
              <td>{ep.ram?.toFixed(1)}%<div className="progress-bar" style={{ width: 60 }}><div className={`progress-fill ${progClass(ep.ram)}`} style={{ width: `${Math.min(ep.ram, 100)}%` }} /></div></td>
              <td>{ep.net_conns}</td>
              <td style={{ color: ep.risk_score > 1.5 ? '#ef4444' : '#22c55e', fontWeight: 600 }}>{ep.risk_score?.toFixed(2)}</td>
              <td><span className={`badge ${ep.status === 'LOCKED' ? 'badge-danger' : 'badge-success'}`}>{ep.status === 'LOCKED' ? <Lock size={10} /> : <Unlock size={10} />} {ep.status}</span></td>
            </tr>
          ))}
          {endpoints.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}><WifiOff size={20} style={{ marginBottom: 4, opacity: 0.4 }} /><br />No devices connected</td></tr>}
        </tbody>
      </table>
    </div>
  </div>);
}

// ═══════════════════════════════════════════════════════════════════
// SESSIONS PAGE
// ═══════════════════════════════════════════════════════════════════
function PageSessions({ sessions, killSession }: { sessions: Session[]; killSession: (agentId: string) => void }) {
  return (<div className="panel" style={{ flex: 1 }}>
    <div className="panel-header"><span className="panel-title"><Clock size={14} /> Active Sessions</span><span className="panel-subtitle">{sessions.filter(s => s.status === 'active').length} active</span></div>
    <div className="panel-body">
      <table className="data-table">
        <thead><tr><th></th><th>Session</th><th>Agent</th><th>Protocol</th><th>Duration</th><th>Idle</th><th>Data</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>
          {sessions.map(s => (
            <tr key={s.id}>
              <td><span className={`status-dot ${s.status === 'active' ? 'online' : s.status === 'killed' ? 'danger' : 'offline'}`} /></td>
              <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{s.id}</td>
              <td style={{ fontFamily: 'monospace', color: 'var(--info)' }}>{s.agent_id}</td>
              <td><span className="badge badge-neutral">{s.protocol}</span></td>
              <td style={{ fontVariantNumeric: 'tabular-nums' }}>{Math.floor(s.duration_seconds / 60)}m {s.duration_seconds % 60}s</td>
              <td style={{ fontVariantNumeric: 'tabular-nums', color: s.idle_seconds > 30 ? '#f59e0b' : 'var(--text-muted)' }}>{s.idle_seconds}s</td>
              <td>{fmtBytes(s.bytes_transferred)}</td>
              <td><span className={`badge ${s.status === 'active' ? 'badge-success' : 'badge-danger'}`}>{s.status}</span></td>
              <td>{s.status === 'active' && <ActionBtn icon={<Trash2 size={11} />} color="#ef4444" title="Kill Session" onClick={() => killSession(s.agent_id)} />}</td>
            </tr>
          ))}
          {sessions.length === 0 && <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No sessions</td></tr>}
        </tbody>
      </table>
    </div>
  </div>);
}

// ═══════════════════════════════════════════════════════════════════
// AUDIT PAGE
// ═══════════════════════════════════════════════════════════════════
function PageAudit({ events }: { events: Event[] }) {
  const [filter, setFilter] = useState('');
  const [sevFilter, setSevFilter] = useState('all');
  const filtered = events.filter(e => {
    if (sevFilter !== 'all' && e.severity !== sevFilter) return false;
    if (filter && !e.message.toLowerCase().includes(filter.toLowerCase()) && !e.agent_id.toLowerCase().includes(filter.toLowerCase())) return false;
    return true;
  });

  return (<div className="panel" style={{ flex: 1 }}>
    <div className="panel-header">
      <span className="panel-title"><FileText size={14} /> QPC-Signed Audit Trail</span>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <select value={sevFilter} onChange={e => setSevFilter(e.target.value)} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 4, padding: '4px 8px', color: 'var(--text-primary)', fontSize: 11, outline: 'none' }}>
          <option value="all">All Severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="WARNING">Warning</option>
          <option value="INFO">Info</option>
        </select>
        <div style={{ position: 'relative' }}>
          <Search size={12} style={{ position: 'absolute', left: 7, top: 6, color: 'var(--text-muted)' }} />
          <input type="text" placeholder="Search..." value={filter} onChange={e => setFilter(e.target.value)}
            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 4, padding: '4px 8px 4px 24px', color: 'var(--text-primary)', fontSize: 11, width: 160, outline: 'none' }} />
        </div>
      </div>
    </div>
    <div className="panel-body">
      <table className="data-table">
        <thead><tr><th>Time</th><th>Source</th><th>Event</th><th>Category</th><th>Severity</th></tr></thead>
        <tbody>
          {filtered.map((ev, i) => (
            <tr key={i}>
              <td style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>{fmtTime(ev.time)}</td>
              <td style={{ fontFamily: 'monospace', color: 'var(--info)', fontSize: 12 }}>{ev.agent_id}</td>
              <td style={{ fontSize: 12 }}>{ev.message}</td>
              <td><span className="badge badge-neutral" style={{ fontSize: 9 }}>{ev.category || 'system'}</span></td>
              <td><span className={`badge ${ev.severity === 'CRITICAL' ? 'badge-danger' : ev.severity === 'WARNING' ? 'badge-warning' : 'badge-info'}`}>{ev.severity}</span></td>
            </tr>
          ))}
          {filtered.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No matching events</td></tr>}
        </tbody>
      </table>
    </div>
  </div>);
}

export default App;
