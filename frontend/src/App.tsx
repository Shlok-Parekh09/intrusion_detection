import { useEffect, useState, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from 'recharts';
import { Shield, Activity, Users, Monitor, Lock, Unlock, AlertTriangle, ChevronUp, ChevronDown, Bell, Eye, Cpu, Network, FileText, ToggleLeft, ToggleRight, X, Clock, Plus, Search, TrendingUp, Trash2, ShieldOff, ShieldAlert, RefreshCw, LayoutDashboard, Circle, ChevronRight, ShieldCheck } from 'lucide-react';
import './index.css';

// Import components
import { StatCard, Button, Table, Skeleton, Breadcrumbs, ErrorBoundary, NotificationBell, UserMenu, useCommandPalette, ForceGraphEnhanced } from './components';
import { useToast, ToastContainer } from './components/Toast';

import { Client } from "@gradio/client";


let gradioClient: any = null;
const getClient = async () => {
  if (!gradioClient) {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const backendUrl = import.meta.env.VITE_BACKEND_URL || (isLocal ? "http://127.0.0.1:7860/" : "https://shlok0829-vortex-siem-backend.hf.space/");
    gradioClient = await Client.connect(backendUrl);
  }
  return gradioClient;
};

const gradioFetch = async (endpoint: string, args: any[] = []) => {
  try {
    const client = await getClient();
    const result = await client.predict(`/${endpoint}`, args);
    return result.data ? result.data[0] : null;
  } catch (err) {
    console.error(`Gradio fetch failed for ${endpoint}:`, err);
    return null;
  }
};

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

function fmtTime(ts: number) { return new Date(ts * 1000).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }); }
function fmtBytes(b: number) { if (b < 1024) return b + ' B'; if (b < 1048576) return (b / 1024).toFixed(1) + ' KB'; return (b / 1048576).toFixed(1) + ' MB'; }
function progClass(v: number) { return v < 50 ? 'low' : v < 80 ? 'medium' : 'high'; }
function riskColor(r: number) { return r >= 0.8 ? '#ef4444' : r >= 0.5 ? '#f59e0b' : r >= 0.3 ? '#3b82f6' : '#22c55e'; }
function riskLabel(r: number) { return r >= 0.8 ? 'Critical' : r >= 0.5 ? 'High' : r >= 0.3 ? 'Medium' : 'Low'; }
function riskBadge(r: number) { return r >= 0.8 ? 'badge-danger' : r >= 0.5 ? 'badge-warning' : r >= 0.3 ? 'badge-info' : 'badge-success'; }
function statusBadge(s: string) { return s === 'active' ? 'badge-success' : s === 'locked' ? 'badge-danger' : s === 'under_investigation' ? 'badge-warning' : s === 'revoked' ? 'badge-danger' : 'badge-neutral'; }

const generateMockState = () => {
  const users = Array.from({length: 40}, (_, i) => ({
    id: `u${i+1000}`, name: `User ${i}`, role: ['Software Engineer', 'Data Scientist', 'IT Admin', 'HR Manager'][Math.floor(Math.random()*4)], department: ['Engineering', 'IT', 'HR'][Math.floor(Math.random()*3)], risk_score: Math.random() * 0.2, files_accessed_today: Math.floor(Math.random()*50), login_count_today: 1, access_level: 'Standard', status: 'active', mfa: true, failed_logins_today: 0
  }));
  const endpoints = Array.from({length: 35}, (_, i) => ({
    id: `ep-${i}`, agent_id: `ep-${i}`, status: 'SECURE', last_seen: Date.now() / 1000 - Math.random()*10, cpu: 20 + Math.random()*40, ram: 30 + Math.random()*40, net_conns: 10 + Math.random()*50, risk_score: Math.random() * 0.2
  }));
  const events = Array.from({length: 20}, (_, i) => ({
    time: Date.now() / 1000 - i * 60, category: ['system', 'file', 'network'][Math.floor(Math.random()*3)], severity: 'INFO', message: `Routine telemetry check ${i}`
  }));
  
  const nodes: any[] = [];
  const links: any[] = [];
  
  for(let i=0; i<40; i++) {
    const isUser = Math.random() > 0.4;
    const id = isUser ? users[Math.floor(Math.random()*users.length)].id : `file_${Math.floor(Math.random()*100)}.txt`;
    if (!nodes.find(n => n.id === id)) {
      nodes.push({ id, label: id, type: isUser ? 'user' : 'file', risk: Math.random() * 0.2, is_red: false });
    }
  }
  for(let i=0; i<35; i++) {
    const s = nodes[Math.floor(Math.random()*nodes.length)].id;
    const t = nodes[Math.floor(Math.random()*nodes.length)].id;
    if (s !== t) links.push({ source: s, target: t });
  }

  return {
    endpoints,
    events,
    users,
    policies: [
      { id: 'pol-001', name: 'USB Mass Storage Block', category: 'DLP', enabled: true, scope: 'Global', enforcement: 'Block', enforced_count: 0 },
      { id: 'pol-002', name: 'After-hours Login Restriction', category: 'IAM', enabled: true, scope: 'Global', enforcement: 'Alert', enforced_count: 0 },
      { id: 'pol-003', name: 'Mass Download Prevention', category: 'DLP', enabled: true, scope: 'Global', enforcement: 'Block', enforced_count: 0 }
    ],
    sessions: [
      { id: 'sess-001', agent_id: 'ep-0', status: 'active', protocol: 'QPC-AES-256', duration_seconds: 300, idle_seconds: 5, bytes_transferred: 500 }
    ],
    graphData: { nodes, links },
    trends: []
  };
};

const MOCK_INITIAL_STATE = generateMockState();

function App() {
  const [page, setPage] = useState<NavPage>('dashboard');
  const [endpoints, setEndpoints] = useState<any[]>(MOCK_INITIAL_STATE.endpoints);
  const [events, setEvents] = useState<any[]>(MOCK_INITIAL_STATE.events);
  const [users, setUsers] = useState<any[]>(MOCK_INITIAL_STATE.users);
  const [policies, setPolicies] = useState<any[]>(MOCK_INITIAL_STATE.policies);
  const [sessions, setSessions] = useState<any[]>(MOCK_INITIAL_STATE.sessions);
  const [graphData, setGraphData] = useState<any>(MOCK_INITIAL_STATE.graphData);
  const [loginTrends, setLoginTrends] = useState<any[]>([]);
  const [clock, setClock] = useState(new Date());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const tickCount = useRef(0);
  const lastEventTime = useRef<number>(0);

  // Toast hook
  const { toasts, removeToast, toast } = useToast();

  // Command palette
  const commandItems = [
    { id: 'dashboard', label: 'Dashboard', category: 'page' as const, onSelect: () => setPage('dashboard') },
    { id: 'users', label: 'Users & Access', category: 'page' as const, onSelect: () => setPage('users') },
    { id: 'policies', label: 'Policies', category: 'page' as const, onSelect: () => setPage('policies') },
    { id: 'devices', label: 'Devices', category: 'page' as const, onSelect: () => setPage('devices') },
    { id: 'sessions', label: 'Sessions', category: 'page' as const, onSelect: () => setPage('sessions') },
    { id: 'audit', label: 'Audit Logs', category: 'page' as const, onSelect: () => setPage('audit') },
  ];
  const { CommandPaletteComponent } = useCommandPalette(commandItems);

  // Clock
  useEffect(() => { const t = setInterval(() => setClock(new Date()), 1000); return () => clearInterval(t); }, []);

  // Load sidebar state
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved) setSidebarCollapsed(JSON.parse(saved));
  }, []);

  // Save sidebar state
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Fetch live data
  useEffect(() => {
    const tick = async () => {
      tickCount.current += 1;
      
      try {
        const state = await gradioFetch('get_dashboard_state');
        if (state && typeof state === 'object' && 'endpoints' in state) {
          setIsConnecting(false);
          setEndpoints(state.endpoints);
          setEvents(state.events);
          setUsers(state.users);
          setPolicies(state.policies);
          setSessions(state.sessions);
          setLoginTrends(state.trends);
          
          if (lastEventTime.current === 0 && state.events.length > 0) {
            lastEventTime.current = Math.max(...state.events.map((e: any) => e.time));
          } else if (state.events.length > 0) {
            const newEvents = state.events.filter((e: any) => e.time > lastEventTime.current);
            if (newEvents.length > 0) {
              lastEventTime.current = Math.max(...state.events.map((e: any) => e.time));
              newEvents.forEach((e: any) => {
                if (e.severity === 'CRITICAL') {
                  const match = e.message.match(/user (u\d+)/i) || e.message.match(/(u\d+)/i);
                  const uid = match ? match[1] : (e.agent_id ? e.agent_id.replace('ep-', '') : null);
                  toast.error(`CRITICAL THREAT: ${e.message}`, 5000, () => {
                    if (uid) {
                      setPage('users');
                      setSelectedUserId(uid);
                    }
                  });
                }
              });
            }
          }
          
          if (state.graph && state.graph.nodes) {
            setGraphData((prev: any) => {
              const existingNodeMap = new Map<string, any>();
              for (const n of (prev?.nodes || [])) {
                existingNodeMap.set(n.id, n);
              }
              const mergedNodes = state.graph.nodes.map((n: any) => {
                const existing = existingNodeMap.get(n.id);
                if (existing) {
                  // Mutate existing object so D3 maintains the exact object reference
                  existing.risk = n.risk;
                  existing.is_red = n.is_red;
                  existing.type = n.type;
                  return existing; 
                }
                
                // Spawn logic based on threat level for best visual effect
                if (n.is_red) {
                  // Spawn red nodes directly in the center of the viewport
                  return { 
                    ...n, 
                    x: (Math.random() * 50) - 25, 
                    y: (Math.random() * 50) - 25 
                  };
                } else {
                  // Spawn normal nodes far away in a ring, letting them drift into view
                  const angle = Math.random() * Math.PI * 2;
                  const radius = 600 + Math.random() * 400; // Between 600 and 1000 units away
                  return { 
                    ...n, 
                    x: Math.cos(angle) * radius, 
                    y: Math.sin(angle) * radius 
                  };
                }
              });
              const existingLinkMap = new Map<string, any>();
              for (const l of (prev?.links || [])) {
                const srcId = typeof l.source === 'object' ? l.source.id : l.source;
                const tgtId = typeof l.target === 'object' ? l.target.id : l.target;
                existingLinkMap.set(`${srcId}-${tgtId}`, l);
              }
              
              const mergedLinks = state.graph.links.map((l: any) => {
                const id = `${l.source}-${l.target}`;
                const existing = existingLinkMap.get(id);
                if (existing) {
                  return existing;
                }
                return { ...l };
              });
              
              return { nodes: mergedNodes, links: mergedLinks };
            });
          }
        }
      } catch (err) {
        console.error("Dashboard state fetch failed:", err);
      }
    };
    tick();
    
    // Poll every 2000ms to reduce UI flicker/glitches on dropdowns
    const iv = setInterval(tick, 2000);
    return () => clearInterval(iv);
  }, []);

  // API actions
  const userAction = async (uid: string, action: string, reason?: string) => {
    await gradioFetch('user_action', [uid, action, reason || '']);
    const [uData, eData] = await Promise.all([
      gradioFetch('get_users'),
      gradioFetch('get_events')
    ]);
    if (Array.isArray(uData)) setUsers(uData);
    if (Array.isArray(eData)) setEvents(eData);
  };

  const togglePolicy = async (pid: string, enabled: boolean) => {
    await gradioFetch('toggle_policy', [pid, enabled]);
    gradioFetch('get_policies').then(d => { if (Array.isArray(d)) setPolicies(d); });
    gradioFetch('get_events').then(d => { if (Array.isArray(d)) setEvents(d); });
  };

  const deletePolicy = async (pid: string) => {
    await gradioFetch('delete_policy', [pid]);
    gradioFetch('get_policies').then(d => { if (Array.isArray(d)) setPolicies(d); });
    gradioFetch('get_events').then(d => { if (Array.isArray(d)) setEvents(d); });
  };

  const killSession = async (agentId: string) => {
    await gradioFetch('kill_session', [agentId]);
    // toast.warning(`Session ${agentId} terminated`);
    gradioFetch('get_sessions').then(d => { if (Array.isArray(d)) setSessions(d); });
    gradioFetch('get_events').then(d => { if (Array.isArray(d)) setEvents(d); });
  };

  const locked = endpoints.filter(e => e.status === 'LOCKED').length;
  const criticals = events.filter(e => e.severity === 'CRITICAL').length;
  const highRiskUsers = users.filter(u => u.risk_score >= 0.5).length;
  let curSection = '';

  const getPageBreadcrumb = () => {
    const pageItem = NAV_ITEMS.find(n => n.id === page);
    return [
      { label: 'Home', onClick: () => setPage('dashboard') },
      { label: pageItem?.label || 'Dashboard' }
    ];
  };

  return (
    <div className="app-layout">
      {/* ═══ SIDEBAR ═══ */}
      <aside className={`sidebar ${sidebarCollapsed ? 'sidebar--collapsed' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon"><Circle size={sidebarCollapsed ? 24 : 18} /></div>
          {!sidebarCollapsed && (
            <div className="logo-text">
              <span className="logo-name">VORTEX</span>
            </div>
          )}
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => {
            const show = item.section && item.section !== curSection;
            if (show) curSection = item.section!;
            const Icon = item.icon;
            return (<div key={item.id}>
              {show && !sidebarCollapsed && <div className="nav-section-label">{item.section}</div>}
              <div className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => setPage(item.id)} title={sidebarCollapsed ? item.label : undefined}>
                <Icon className="nav-icon" size={16} />
                {!sidebarCollapsed && item.label}
                {item.id === 'users' && highRiskUsers > 0 && !sidebarCollapsed && <span className="nav-badge">{highRiskUsers}</span>}
                {item.id === 'audit' && criticals > 0 && !sidebarCollapsed && <span className="nav-badge">{criticals}</span>}
              </div>
            </div>);
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="user-avatar">SP</div>
          {!sidebarCollapsed && (
            <div className="user-info">
              <span className="user-name">Shlok Parekh</span>
              <span className="user-role">SOC Admin</span>
            </div>
          )}
        </div>
        <button className="sidebar-collapse-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} title={sidebarCollapsed ? 'Expand' : 'Collapse'}>
          <ChevronRight size={16} className={sidebarCollapsed ? 'sidebar-collapse-btn__icon--rotated' : ''} />
        </button>
      </aside>

      {/* ═══ MAIN ═══ */}
      <div className="main-area">
        <header className="top-bar">
          <div className="top-bar-left">
            <Breadcrumbs items={getPageBreadcrumb()} />
          </div>
          <div className="top-bar-right">
            {isConnecting ? (
              <div className="top-bar-badge warning" style={{ background: 'rgba(234,179,8,0.2)', color: '#facc15' }}>
                <span className="relative flex h-2 w-2 mr-2" style={{ display: 'inline-block' }}>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                </span>
                Waking up AI Cloud...
              </div>
            ) : (
              <div className="top-bar-badge secure" style={{ background: 'rgba(34,197,94,0.2)', color: '#4ade80' }}>
                <span className="relative flex h-2 w-2 mr-2" style={{ display: 'inline-block' }}>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Connected
              </div>
            )}
            <div className={`top-bar-badge ${locked > 0 ? 'danger' : 'secure'}`}>
              {locked > 0 ? <ShieldAlert size={13} /> : <ShieldCheck size={13} />}
              {locked > 0 ? `${locked} Threat(s)` : 'Secure'}
            </div>
            <div className="top-bar-badge secure"><Lock size={11} /> QPC</div>
            <NotificationBell notifications={events.slice(0, 5).map(e => ({
              id: `${e.time}-${e.agent_id}`,
              title: e.severity,
              message: e.message,
              severity: e.severity === 'CRITICAL' ? 'error' : e.severity === 'WARNING' ? 'warning' : 'info' as any,
              timestamp: e.time * 1000,
              read: false,
            }))} />
            <UserMenu userName="Shlok Parekh" userRole="SOC Admin" />
            <span className="system-time">{clock.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour12: false })} IST</span>
          </div>
        </header>

        <div className="dashboard-content">
          <ErrorBoundary name="PageContent">
            {page === 'dashboard' && <PageDashboard endpoints={endpoints} events={events} graphData={graphData} users={users} locked={locked} criticals={criticals} loginTrends={loginTrends} />}
            {page === 'users' && <PageUsers users={users} userAction={userAction} initialSelected={selectedUserId} />}
            {page === 'policies' && <PagePolicies policies={policies} togglePolicy={togglePolicy} deletePolicy={deletePolicy} />}
            {page === 'devices' && <PageDevices endpoints={endpoints} />}
            {page === 'sessions' && <PageSessions sessions={sessions} killSession={killSession} />}
            {page === 'audit' && <PageAudit events={events} />}
          </ErrorBoundary>
        </div>

        {/* Toast Container */}
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        
        {/* Command Palette */}
        <CommandPaletteComponent />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════
function PageDashboard({ endpoints, events, graphData, users, locked, criticals, loginTrends }: any) {
  const trends = loginTrends && loginTrends.length > 0 ? loginTrends : [];
  
  // Strictly filter users to only those with currently active (non-OFFLINE) endpoints
  const activeEndpointUserIds = new Set(
    endpoints
      .filter((e: any) => e.status !== 'OFFLINE')
      .map((e: any) => e.agent_id?.replace('ep-', ''))
  );
  const activeUsers = users.filter((u: any) => activeEndpointUserIds.has(u.id));

  const riskDist = [
    { name: 'Low', value: activeUsers.filter((u: any) => u.risk_score < 0.3).length, color: '#22c55e' },
    { name: 'Medium', value: activeUsers.filter((u: any) => u.risk_score >= 0.3 && u.risk_score < 0.5).length, color: '#3b82f6' },
    { name: 'High', value: activeUsers.filter((u: any) => u.risk_score >= 0.5 && u.risk_score < 0.8).length, color: '#f59e0b' },
    { name: 'Critical', value: activeUsers.filter((u: any) => u.risk_score >= 0.8).length, color: '#ef4444' },
  ];

  return (<>
    {/* Stats - Using new StatCard component */}
    <div className="stats-row">
      <StatCard icon={<Monitor size={18} />} iconClass="blue" label="Active Endpoints" value={endpoints.filter((e: any) => e.status !== 'OFFLINE').length} sub={<><Cpu size={11} /> QPC Encrypted</>} />
      <StatCard icon={<AlertTriangle size={18} />} iconClass="red" label="Active Threats" value={locked} sub={locked > 0 ? <><ChevronUp size={11} /> RBAC Lockout</> : <><ChevronDown size={11} /> Clear</>} subClass={locked > 0 ? 'up' : 'down'} />
      <StatCard icon={<Users size={18} />} iconClass="yellow" label="High-Risk Users" value={activeUsers.filter((u: any) => u.risk_score >= 0.5).length} sub={<><Eye size={11} /> Behavioral AI</>} />
      <StatCard icon={<Bell size={18} />} iconClass="red" label="Critical Alerts" value={criticals} sub={criticals > 0 ? <><ChevronUp size={11} /> Needs attention</> : <>All clear</>} subClass={criticals > 0 ? 'up' : 'neutral'} />
    </div>

    {/* Charts row */}
    <div className="grid-main">
      <div className="panel">
        <div className="panel-header"><span className="panel-title"><Activity size={14} /> Login Trends</span><span className="panel-subtitle">Today (Live)</span></div>
        <div className="panel-body"><div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trends} barGap={1} barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="time" tick={{ fill: '#8892a4', fontSize: 10 }} axisLine={false} tickLine={false} />
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
        <div className="panel-body"><div className="graph-container" style={{ minHeight: 400 }}>
          <ForceGraphEnhanced
            data={graphData}
            height={400}
            onNodeClick={() => {}}
          />
        </div></div>
      </div>
      <div className="panel">
        <div className="panel-header"><span className="panel-title"><FileText size={14} /> Live Activity</span><span className="panel-subtitle">{events.length}</span></div>
        <div className="panel-body"><div className="activity-feed">
          {events.length === 0 && <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}><Skeleton variant="text" lines={3} /></div>}
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
              <div className="device-metric"><span className="device-metric-label">CPU</span><span className="device-metric-value numeric-display">{ep.cpu?.toFixed(0)}%</span><div className="progress-bar"><div className={`progress-fill ${progClass(ep.cpu)}`} style={{ width: `${Math.min(ep.cpu, 100)}%` }} /></div></div>
              <div className="device-metric"><span className="device-metric-label">RAM</span><span className="device-metric-value numeric-display">{ep.ram?.toFixed(0)}%</span><div className="progress-bar"><div className={`progress-fill ${progClass(ep.ram)}`} style={{ width: `${Math.min(ep.ram, 100)}%` }} /></div></div>
              <div className="device-metric"><span className="device-metric-label">Conns</span><span className="device-metric-value numeric-display">{ep.net_conns}</span></div>
              <div className="device-metric"><span className="device-metric-label">Risk</span><span className="device-metric-value numeric-display" style={{ color: ep.risk_score > 1.5 ? '#ef4444' : '#22c55e' }}>{ep.risk_score?.toFixed(1)}</span></div>
            </div>
          </div>
        ))}
      </div></div>
    </div>}
  </>);
}

// ═══════════════════════════════════════════════════════════════════
// USERS PAGE
// ═══════════════════════════════════════════════════════════════════
function PageUsers({ users, userAction, initialSelected }: { users: ManagedUser[]; userAction?: (uid: string, action: string, reason?: string) => Promise<void>; initialSelected?: string | null }) {
  const [selected, setSelected] = useState<string | null>(initialSelected || null);
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
      const d = await gradioFetch('user_behavior', [uid]);
      setBehaviorData(d);
    } catch { setBehaviorData(null); }
  };
  
  // Reload behavior when initialSelected changes (e.g. from clicking a Toast)
  useEffect(() => {
    if (initialSelected) {
      loadBehavior(initialSelected);
    }
  }, [initialSelected]);
  
  const handleUserAction = async (uid: string, action: string, reason?: string) => {
    if (userAction) {
      await userAction(uid, action, reason);
      if (selected === uid) {
        await loadBehavior(uid);
      }
    }
  };

  const userColumns = [
    { key: 'risk', header: 'Risk', width: 80, render: (u: ManagedUser) => <span className={`badge ${riskBadge(u.risk_score)}`} style={{ minWidth: 50, justifyContent: 'center' }}>{(u.risk_score * 100).toFixed(0)}%</span> },
    { key: 'name', header: 'User', width: 200, render: (u: ManagedUser) => <div><div style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.id}</div></div> },
    { key: 'role', header: 'Role', width: 120 },
    { key: 'department', header: 'Dept', width: 100 },
    { key: 'access_level', header: 'Access', width: 100, render: (u: ManagedUser) => (
      <select 
        value={u.access_level} 
        onChange={(e) => {
          e.target.blur(); // Remove focus after selecting to prevent UI glitch
          handleUserAction(u.id, 'update_access', e.target.value);
        }}
        onClick={(e) => e.stopPropagation()}
        className={`badge ${['Privileged', 'Admin'].includes(u.access_level) ? 'badge-warning' : u.access_level === 'None' ? 'badge-danger' : 'badge-neutral'}`}
        style={{ cursor: 'pointer', outline: 'none', appearance: 'none', border: 'none', WebkitAppearance: 'none' }}
      >
        <option value="Minimal">Minimal</option>
        <option value="Standard">Standard</option>
        <option value="Limited">Limited</option>
        <option value="Privileged">Privileged</option>
        <option value="Admin">Admin</option>
        <option value="Restricted">Restricted</option>
        <option value="None">None</option>
      </select>
    ) },
    { key: 'status', header: 'Status', width: 120, render: (u: ManagedUser) => <span className={`badge ${statusBadge(u.status)}`}>{u.status}</span> },
    { key: 'mfa', header: 'MFA', width: 60, render: (u: ManagedUser) => u.mfa ? <span className="badge badge-success">On</span> : <span className="badge badge-danger">Off</span> },
    { key: 'files_accessed_today', header: 'Files', width: 60 },
    { key: 'logins', header: 'Logins', width: 80, render: (u: ManagedUser) => <span>{u.login_count_today} <span style={{ color: u.failed_logins_today >= 3 ? '#ef4444' : 'var(--text-muted)', fontSize: 11 }}>({u.failed_logins_today}F)</span></span> },
    { key: 'actions', header: 'Actions', width: 140, render: (u: ManagedUser) => (
      <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
        {u.status === 'locked' || u.status === 'revoked' ? (
          <div style={{ padding: '0 4px', height: 24, display: 'flex' }}><Button variant="ghost" size="sm" onClick={() => handleUserAction(u.id, 'unlock', 'Admin override')} title="Unlock Account"><Unlock size={12} color="#22c55e" /></Button></div>
        ) : (
          <div style={{ padding: '0 4px', height: 24, display: 'flex' }}><Button variant="ghost" size="sm" onClick={() => handleUserAction(u.id, 'lock', 'Admin lock')} title="Lock Account"><Lock size={12} color="#f59e0b" /></Button></div>
        )}
        <div style={{ padding: '0 4px', height: 24, display: 'flex' }}><Button variant="ghost" size="sm" onClick={() => handleUserAction(u.id, 'revoke_access', 'Admin revoked')} title="Revoke All Access"><ShieldOff size={12} color="#ef4444" /></Button></div>
        {!u.mfa && <div style={{ padding: '0 4px', height: 24, display: 'flex' }}><Button variant="ghost" size="sm" onClick={() => handleUserAction(u.id, 'force_mfa', 'Enforce MFA')} title="Force MFA"><ShieldAlert size={12} color="#3b82f6" /></Button></div>}
        <div style={{ padding: '0 4px', height: 24, display: 'flex' }}><Button variant="ghost" size="sm" onClick={() => handleUserAction(u.id, 'reset_risk', 'Admin reset')} title="Reset Risk Indicators"><RefreshCw size={12} color="#8892a4" /></Button></div>
      </div>
    )}
  ];

  return (<div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0 }}>
    <div className="panel" style={{ flex: selected ? 3 : 1, minWidth: 0 }}>
      <div className="panel-header">
        <span className="panel-title"><Users size={14} /> User & Access Management</span>
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 8, top: 7, color: 'var(--text-muted)' }} />
          <input type="text" placeholder="Search users..." value={filter} onChange={e => setFilter(e.target.value)}
            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 4, padding: '5px 8px 5px 28px', color: 'var(--text-primary)', fontSize: 12, width: 180, outline: 'none' }} />
        </div>
      </div>
      <div className="panel-body">
        <Table
          data={filtered}
          columns={userColumns as any}
          emptyMessage="No users found"
          pageSize={15}
          virtualScroll={false}
          virtualScrollHeight={400}
          onRowClick={(u: ManagedUser) => loadBehavior(u.id)}
        />
      </div>
    </div>

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
          </div>
        ))}
      </div>
    </div>}
  </div>);
}

// ═══════════════════════════════════════════════════════════════════
// POLICIES PAGE
// ═══════════════════════════════════════════════════════════════════
function PagePolicies({ policies, togglePolicy, deletePolicy }: { policies: Policy[]; togglePolicy: (pid: string, enabled: boolean) => void, deletePolicy?: (pid: string) => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newPol, setNewPol] = useState({ name: '', category: 'General', scope: 'Global', enforcement: 'Alert' });

  const policyColumns = [
    { key: 'enabled', header: 'Enabled', width: 80, render: (p: Policy) => (
      <button onClick={() => togglePolicy(p.id, !p.enabled)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: p.enabled ? '#22c55e' : '#ef4444', padding: 2, display: 'flex' }} title={p.enabled ? 'Disable' : 'Enable'}>
        {p.enabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
      </button>
    )},
    { key: 'name', header: 'Policy', width: 250, render: (p: Policy) => <span style={{ fontWeight: 500, opacity: p.enabled ? 1 : 0.5 }}>{p.name}</span> },
    { key: 'category', header: 'Category', width: 120, render: (p: Policy) => <span className="badge badge-neutral">{p.category}</span> },
    { key: 'scope', header: 'Scope', width: 150 },
    { key: 'enforcement', header: 'Enforcement', width: 120, render: (p: Policy) => <span className="badge badge-info">{p.enforcement}</span> },
    { key: 'violations', header: 'Violations', width: 100, render: (p: Policy) => p.violations > 0 ? <span className="badge badge-danger" style={{ width: 24, textAlign: 'center', display: 'inline-block' }}>{p.violations}</span> : <span className="badge badge-neutral" style={{ width: 24, textAlign: 'center', display: 'inline-block' }}>0</span> },
    { key: 'actions', header: '', width: 50, render: (p: Policy) => (
      <div style={{ padding: '0 4px', height: 24, display: 'flex' }}>
        <Button variant="ghost" size="sm" onClick={() => deletePolicy && deletePolicy(p.id)} title="Delete Policy" className="destructive">
          <Trash2 size={12} />
        </Button>
      </div>
    )},
  ];

  return (<div className="panel" style={{ flex: 1 }}>
    <div className="panel-header">
      <span className="panel-title"><Shield size={14} /> Security Policies</span>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <span className="panel-subtitle">{policies.filter(p => p.enabled).length}/{policies.length} active</span>
        <Button variant="primary" size="sm" onClick={() => setShowAdd(!showAdd)}><Plus size={14} /> Add Policy</Button>
      </div>
    </div>
    
    {showAdd && (
      <div style={{ background: 'var(--bg-secondary)', padding: 16, borderBottom: '1px solid var(--border-color)', display: 'flex', gap: 12, alignItems: 'flex-end' }}>
        <div style={{ flex: 2 }}>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Policy Name</label>
          <input type="text" value={newPol.name} onChange={e => setNewPol({...newPol, name: e.target.value})} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 4, padding: '6px 8px', color: 'var(--text-primary)', fontSize: 12, outline: 'none' }} placeholder="e.g. Block USB Storage" />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Category</label>
          <select value={newPol.category} onChange={e => setNewPol({...newPol, category: e.target.value})} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 4, padding: '6px 8px', color: 'var(--text-primary)', fontSize: 12, outline: 'none' }}>
            <option>Data Protection</option><option>Authentication</option><option>Behavior</option><option>Cryptography</option><option>General</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Enforcement</label>
          <select value={newPol.enforcement} onChange={e => setNewPol({...newPol, enforcement: e.target.value})} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 4, padding: '6px 8px', color: 'var(--text-primary)', fontSize: 12, outline: 'none' }}>
            <option>Block</option><option>Alert</option><option>Quarantine</option><option>MFA Step-up</option>
          </select>
        </div>
        <Button variant="primary" size="sm" onClick={() => {
          if (newPol.name) {
            gradioFetch('add_policy', [newPol.name, newPol.category, newPol.scope, newPol.enforcement]).then(d => {
              if (d && d.policy) policies.push(d.policy);
              setShowAdd(false);
              setNewPol({ name: '', category: 'General', scope: 'Global', enforcement: 'Alert' });
            });
          }
        }}>Save Policy</Button>
      </div>
    )}

    <div className="panel-body">
      <Table data={policies} columns={policyColumns as any} emptyMessage="No policies configured" pageSize={20} />
    </div>
  </div>);
}

// ═══════════════════════════════════════════════════════════════════
// DEVICES PAGE
// ═══════════════════════════════════════════════════════════════════
function PageDevices({ endpoints }: { endpoints: Endpoint[] }) {
  const deviceColumns = [
    { key: 'status', header: '', width: 40, render: (ep: Endpoint) => <span className={`status-dot ${ep.status === 'LOCKED' ? 'danger' : 'online'}`} /> },
    { key: 'agent_id', header: 'Device ID', width: 180, render: (ep: Endpoint) => <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--info)', fontWeight: 600 }}>{ep.agent_id}</span> },
    { key: 'protocol', header: 'Protocol', width: 120, render: () => <span className="badge badge-neutral">QPC-AES-256</span> },
    { key: 'cpu', header: 'CPU', width: 120, render: (ep: Endpoint) => <span>{ep.cpu?.toFixed(1)}%<div className="progress-bar" style={{ width: 60 }}><div className={`progress-fill ${progClass(ep.cpu)}`} style={{ width: `${Math.min(ep.cpu, 100)}%` }} /></div></span> },
    { key: 'ram', header: 'RAM', width: 120, render: (ep: Endpoint) => <span>{ep.ram?.toFixed(1)}%<div className="progress-bar" style={{ width: 60 }}><div className={`progress-fill ${progClass(ep.ram)}`} style={{ width: `${Math.min(ep.ram, 100)}%` }} /></div></span> },
    { key: 'net_conns', header: 'Connections', width: 100 },
    { key: 'risk_score', header: 'Risk', width: 80, render: (ep: Endpoint) => <span style={{ color: ep.risk_score > 1.5 ? '#ef4444' : '#22c55e', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{ep.risk_score?.toFixed(2)}</span> },
    { key: 'status', header: 'RBAC', width: 120, render: (ep: Endpoint) => <span className={`badge ${ep.status === 'LOCKED' ? 'badge-danger' : 'badge-success'}`}>{ep.status === 'LOCKED' ? <Lock size={10} /> : <Unlock size={10} />} {ep.status}</span> },
  ];

  const sortedEndpoints = [...endpoints].sort((a, b) => {
    const aUsage = a.status === 'OFFLINE' ? -1 : (a.cpu + a.ram);
    const bUsage = b.status === 'OFFLINE' ? -1 : (b.cpu + b.ram);
    return bUsage - aUsage;
  });

  return (<div className="panel" style={{ flex: 1 }}>
    <div className="panel-header"><span className="panel-title"><Monitor size={14} /> Device Registry</span><span className="panel-subtitle">{endpoints.length} connected</span></div>
    <div className="panel-body">
      <Table data={sortedEndpoints} columns={deviceColumns as any} emptyMessage="No devices connected" pageSize={15} />
    </div>
  </div>);
}

// ═══════════════════════════════════════════════════════════════════
// SESSIONS PAGE
// ═══════════════════════════════════════════════════════════════════
function PageSessions({ sessions, killSession }: { sessions: Session[]; killSession: (agentId: string) => void }) {
  const sessionColumns = [
    { key: 'status', header: '', width: 40, render: (s: Session) => <span className={`status-dot ${s.status === 'active' ? 'online' : s.status === 'killed' ? 'danger' : 'offline'}`} /> },
    { key: 'id', header: 'Session', width: 200, render: (s: Session) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{s.id}</span> },
    { key: 'agent_id', header: 'Agent', width: 150, render: (s: Session) => <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--info)' }}>{s.agent_id}</span> },
    { key: 'protocol', header: 'Protocol', width: 100, render: (s: Session) => <span className="badge badge-neutral">{s.protocol}</span> },
    { key: 'duration', header: 'Duration', width: 100, render: (s: Session) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{Math.floor(s.duration_seconds / 60)}m {s.duration_seconds % 60}s</span> },
    { key: 'idle', header: 'Idle', width: 80, render: (s: Session) => <span style={{ fontVariantNumeric: 'tabular-nums', color: s.idle_seconds > 30 ? '#f59e0b' : 'var(--text-muted)' }}>{s.idle_seconds}s</span> },
    { key: 'bytes', header: 'Data', width: 100, render: (s: Session) => fmtBytes(s.bytes_transferred) },
    { key: 'status', header: 'Status', width: 100, render: (s: Session) => <span className={`badge ${s.status === 'active' ? 'badge-success' : 'badge-danger'}`}>{s.status}</span> },
    { key: 'action', header: 'Action', width: 80, render: (s: Session) => s.status === 'active' && <Button               variant="ghost"
              size="sm"
              onClick={() => killSession(s.agent_id)}
              title="Kill Session"
              className="destructive"
            >
              <Trash2 size={11} />
            </Button> },
  ];

  return (<div className="panel" style={{ flex: 1 }}>
    <div className="panel-header"><span className="panel-title"><Clock size={14} /> Active Sessions</span><span className="panel-subtitle">{sessions.filter(s => s.status === 'active').length} active</span></div>
    <div className="panel-body">
      <Table data={sessions} columns={sessionColumns as any} emptyMessage="No active sessions" pageSize={15} />
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

  const auditColumns = [
    { key: 'time', header: 'Time', width: 120, render: (e: Event) => <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>{fmtTime(e.time)}</span> },
    { key: 'agent_id', header: 'Source', width: 150, render: (e: Event) => <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--info)', fontSize: 12 }}>{e.agent_id}</span> },
    { key: 'message', header: 'Event', width: 400 },
    { key: 'category', header: 'Category', width: 120, render: (e: Event) => <span className="badge badge-neutral" style={{ fontSize: 9 }}>{e.category || 'system'}</span> },
    { key: 'severity', header: 'Severity', width: 100, render: (e: Event) => <span className={`badge ${e.severity === 'CRITICAL' ? 'badge-danger' : e.severity === 'WARNING' ? 'badge-warning' : 'badge-info'}`}>{e.severity}</span> },
  ];

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
      <Table data={filtered} columns={auditColumns as any} emptyMessage="No matching events" pageSize={20} />
    </div>
  </div>);
}

export default App;
