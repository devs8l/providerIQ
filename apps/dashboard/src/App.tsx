import { useState, useEffect } from 'react';
import { Shield, Activity, Heart, TrendingUp, AlertTriangle, Zap, Clock, Search, Building2, MapPin, Database, Users, Bot, Cpu, Globe, CheckCircle2, RefreshCw, KeyRound, Wifi, ArrowUpRight, ArrowDownRight, Minus, Info, Sparkles } from 'lucide-react';
import './App.css';

const API = 'http://localhost:4000/trpc';

interface Fac {
  id: string; name: string; city: string; state: string;
  bedCount?: number; nabhStatus?: string; nabhGrade?: string; specialties?: string; tier?: string;
  piiScore?: number; trustScore?: number; operationalScore?: number; billingStabilityScore?: number;
  clinicalQualityScore?: number; patientExperienceScore?: number; fraudRiskScore?: number;
  fraudRiskLevel?: string; scoreUpdatedAt?: string; abdmReadiness?: boolean; cghsEmpanelled?: boolean; echsEmpanelled?: boolean;
}
interface FacDetail extends Fac { reviews: any[]; newsItems: any[]; scoreHistory: any[]; signals: any[]; }

const AGENTS = [
  { name: 'Orchestrator Agent', icon: <Cpu size={16}/>, desc: 'Plans the research pipeline, dispatches sub-agents, merges results, and enforces scoring rules.', lastActivity: 'Consolidated Medanta scoring matrix & pushed clinical quality rating.', status: 'Idle (Listening)', lastRun: '2 mins ago' },
  { name: 'Registry Agent', icon: <Database size={16}/>, desc: 'Pulls and validates structured data from ABDM, NABH, and CGHS registries.', lastActivity: 'Validated ABDM Hospital Facility Registry (HFR) credentials & beds registry.', status: 'Active (Monitoring)', lastRun: '12 mins ago' },
  { name: 'Web Research Agent', icon: <Globe size={16}/>, desc: 'Crawls unstructured news sources, consumer court filings, and official portals.', lastActivity: 'Completed Tavily search for recent media disputes & local coverage reports.', status: 'Idle (Listening)', lastRun: '1 hr ago' },
  { name: 'Sentiment Agent', icon: <Heart size={16}/>, desc: 'Applies NLP to patient reviews, Practo comments, and public feedback networks.', lastActivity: 'NLP parsed 142 recent Google Maps review sentiment vectors.', status: 'Active (Crawling)', lastRun: '15 mins ago' },
  { name: 'Billing Analyst', icon: <TrendingUp size={16}/>, desc: 'Scans NHCX data feeds for cost variances, length-of-stay outliers, and package disputes.', lastActivity: 'Matched 145 claims lines against procedural averages (package variance: 4.2%).', status: 'Active (Monitoring)', lastRun: '5 mins ago' },
  { name: 'Supervisor Agent', icon: <Shield size={16}/>, desc: 'Cross-checks findings across agents, validates fraud risk levels, and signs PII indices.', lastActivity: 'Certified Medanta compliance rating. Signed off fraud risk level as LOW.', status: 'Active (Validating)', lastRun: 'Just now' },
];

const DATA_SOURCES = [
  { name: 'ABDM Health Facility Registry', type: 'Objective', agent: 'Registry Agent', lastCheck: '12 mins ago', status: 'Active API', cost: 'Free', compliance: 'Verified' },
  { name: 'NABH India', type: 'Objective', agent: 'Registry Agent', lastCheck: '1 hr ago', status: 'Active API', cost: 'Free', compliance: 'Verified' },
  { name: 'NMC India', type: 'Objective', agent: 'Registry Agent', lastCheck: '4 hrs ago', status: 'Crawled', cost: 'Free', compliance: 'Verified' },
  { name: 'CGHS / ECHS portal', type: 'Objective', agent: 'Web Research Agent', lastCheck: '1 day ago', status: 'Crawled', cost: 'Free', compliance: 'Verified' },
  { name: 'OpenStreetMap / Overpass API', type: 'Objective', agent: 'Registry Agent', lastCheck: '3 hrs ago', status: 'Active API', cost: 'Free', compliance: 'Verified' },
  { name: 'National Consumer Helpline (NCH)', type: 'Subjective', agent: 'Web Research Agent', lastCheck: '6 hrs ago', status: 'Data Portal', cost: 'Free', compliance: 'Verified' },
  { name: 'Google Maps Places API', type: 'Subjective', agent: 'Sentiment Agent', lastCheck: '15 mins ago', status: 'Active API', cost: 'Paid ~$17/1k', compliance: 'Live' },
  { name: 'SerpAPI', type: 'Subjective', agent: 'Web Research Agent', lastCheck: '2 hrs ago', status: 'Active API', cost: 'Paid $50/mo+', compliance: 'Live' },
  { name: 'Tavily Search API', type: 'Subjective', agent: 'Web Research Agent', lastCheck: '1 hr ago', status: 'Active API', cost: 'Free tier then $', compliance: 'Live' },
  { name: 'Firecrawl', type: 'Subjective', agent: 'Web Research Agent', lastCheck: '30 mins ago', status: 'Active API', cost: 'Free tier (500)', compliance: 'Live' },
  { name: 'Twitter / X API v2', type: 'Subjective', agent: 'Sentiment Agent', lastCheck: '45 mins ago', status: 'Active API', cost: 'Paid $100/mo', compliance: 'Live' },
  { name: 'Practo / Lybrate', type: 'Subjective', agent: 'Sentiment Agent', lastCheck: '3 hrs ago', status: 'Crawled', cost: 'Free (crawl)', compliance: 'Live' },
  { name: 'Justdial', type: 'Subjective', agent: 'Sentiment Agent', lastCheck: '5 hrs ago', status: 'Crawled', cost: 'Free (crawl)', compliance: 'Live' },
  { name: 'Indeed / Naukri postings', type: 'Subjective', agent: 'Web Research Agent', lastCheck: '2 days ago', status: 'Crawled/API', cost: 'Free', compliance: 'Live' },
  { name: 'NHCX (NHA) Claims', type: 'Objective', agent: 'Billing Analyst', lastCheck: '5 mins ago', status: 'Institutional API', cost: 'Partnership', compliance: 'Verified' },
  { name: 'Anthropic Claude API', type: 'Processing', agent: 'Orchestrator Agent', lastCheck: 'Just now', status: 'Active API', cost: 'Paid per token', compliance: 'Live' },
  { name: 'Exa.ai', type: 'Subjective', agent: 'Web Research Agent', lastCheck: '4 hrs ago', status: 'Active API', cost: 'Free tier + $', compliance: 'Live' },
  { name: 'BrightData / Oxylabs', type: 'Infrastructure', agent: 'Web Research Agent', lastCheck: '15 mins ago', status: 'Active Proxy', cost: 'Paid $0.001/req', compliance: 'Live' }
];

const CONNECTIONS = [
  { id: 'abdm', name: 'ABDM Sandbox API', type: 'OAuth 2.0', status: 'Connected', desc: 'Used by Registry Agent for Health Facility validation.' },
  { id: 'nhcx', name: 'NHCX Institutional', type: 'mTLS Certificate', status: 'Pending Auth', desc: 'Secure claims clearinghouse for Billing Analyst.' },
  { id: 'nabh', name: 'NABH Registry', type: 'Bearer Token', status: 'Connected', desc: 'Retrieves official accreditation statuses.' },
  { id: 'tavily', name: 'Tavily Search', type: 'API Key', status: 'Connected', desc: 'Optimized search indexing for the Web Research Agent.' },
  { id: 'firecrawl', name: 'Firecrawl Extract', type: 'Bearer Token', status: 'Connected', desc: 'Extracts structured Markdown from raw web pages.' },
  { id: 'google', name: 'Google Maps Places API', type: 'API Key', status: 'Configured', desc: 'Powers Sentiment Agent review ingestion.' },
  { id: 'claude', name: 'Anthropic Claude API', type: 'API Key', status: 'Connected', desc: 'Substrate for Orchestrator and NLP Agents.' },
  { id: 'brightdata', name: 'BrightData Residential', type: 'Proxy Credentials', status: 'Connected', desc: 'IP rotation infrastructure for heavy scrapes.' },
  { id: 'exa', name: 'Exa.ai', type: 'API Key', status: 'Configured', desc: 'Neural search for deep medical news context.' },
  { id: 'twitter', name: 'X / Twitter API v2', type: 'OAuth 2.0', status: 'Connected', desc: 'Real-time consumer dispute monitoring.' },
];

const DeltaBadge = ({ val, suffix='' }: { val?: number, suffix?: string }) => {
  if (val === undefined) return null;
  if (val > 0) return <span className="delta-badge up"><ArrowUpRight size={10}/> {val}{suffix}</span>;
  if (val < 0) return <span className="delta-badge down"><ArrowDownRight size={10}/> {Math.abs(val)}{suffix}</span>;
  return <span className="delta-badge neutral"><Minus size={10}/> Flat</span>;
};

const getColor = (score: number) => {
  if (score >= 80) return 'var(--green)';
  if (score >= 50) return 'var(--orange)';
  return 'var(--red)';
};

export default function App() {
  const [facs, setFacs] = useState<Fac[]>([]);
  const [selId, setSelId] = useState('');
  const [detail, setDetail] = useState<FacDetail | null>(null);
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<'intelligence'|'swarm'|'sources'|'connections'>('intelligence');
  
  // Auditing Animation State
  const [auditing, setAuditing] = useState(false);
  const [animScore, setAnimScore] = useState<number | null>(null);
  const [showConfig, setShowConfig] = useState(false);

  // Delta states to simulate score changes (Credit Karma style)
  const [deltas, setDeltas] = useState<{ [key: string]: number }>({});
  // Volumetric states to simulate data point scans per card
  const [vols, setVols] = useState<{ [key: string]: { total: number, new: number } }>({});

  const load = async (query = '') => {
    try {
      const r = await fetch(`${API}/searchFacilities?input=${encodeURIComponent(JSON.stringify({ query }))}`);
      const d = await r.json();
      if (d.result?.data?.facilities) {
        setFacs(d.result.data.facilities);
        if (!selId && d.result.data.facilities.length) {
          setSelId(d.result.data.facilities[0].id);
        }
      }
    } catch (e) {}
  };

  const loadDetail = async (id: string, triggerAnimation = false) => {
    try {
      const r = await fetch(`${API}/getFacilityProfile?input=${encodeURIComponent(JSON.stringify({ id }))}`);
      const d = await r.json();
      if (d.result?.data?.facility) {
        setDetail(d.result.data.facility);
        
        if (triggerAnimation) {
          setAnimScore(0);
          setTimeout(() => setAnimScore(null), 50); // Setting null triggers CSS transition from 0 to real score
        } else {
          setAnimScore(null);
        }

        // Set some dummy deltas when loading detail
        setDeltas({
          pii: Math.floor(Math.random() * 8) - 2, // -2 to +5
          trust: Math.floor(Math.random() * 4) - 1,
          op: Math.floor(Math.random() * 6) - 2,
          bill: Math.floor(Math.random() * 4) - 1,
          clin: Math.floor(Math.random() * 5) - 2,
          pat: Math.floor(Math.random() * 8) - 4,
          fraud: Math.floor(Math.random() * 2) - 1,
        });

        // Set simulated volumetrics for the cards
        setVols({
          trust: { total: Math.floor(Math.random()*40+20), new: Math.floor(Math.random()*5+1) },
          op: { total: Math.floor(Math.random()*150+50), new: Math.floor(Math.random()*12+3) },
          bill: { total: Math.floor(Math.random()*2500+800), new: Math.floor(Math.random()*150+20) },
          clin: { total: Math.floor(Math.random()*120+40), new: Math.floor(Math.random()*8+1) },
          pat: { total: Math.floor(Math.random()*800+200), new: Math.floor(Math.random()*45+5) },
          fraud: { total: Math.floor(Math.random()*300+100), new: Math.floor(Math.random()*15+2) },
        });
      }
    } catch (e) {}
  };

  const runAudit = async () => {
    if (!selId || !detail) return;
    setAuditing(true);
    setAnimScore(0); // Start ring from 0
    
    // Animate score randomly around current score but bounded between 0 and 100
    const baseScore = detail.piiScore ?? 80;
    const animInterval = setInterval(() => {
      let r = Math.floor(baseScore - 15 + Math.random() * 30);
      r = Math.min(100, Math.max(0, r)); // Bound between 0 and 100
      setAnimScore(r);
    }, 120);

    try {
      await fetch(`${API}/triggerResearch`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer piq_live_inquantic_admin_secret_key_2026' }, body: JSON.stringify({ facilityId: selId }) });
      setTimeout(() => { 
        clearInterval(animInterval);
        loadDetail(selId, true); 
        load(); 
        setAuditing(false); 
      }, 3000);
    } catch { 
      clearInterval(animInterval);
      setAuditing(false); 
      setAnimScore(null);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { if (selId) loadDetail(selId, true); }, [selId]);

  const d = detail;
  const riskLvl = (d?.fraudRiskLevel ?? 'LOW').toLowerCase();

  const displayScore = animScore !== null ? animScore : (d?.piiScore ?? 0);
  const ringColor = auditing ? 'var(--blue)' : getColor(displayScore);

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-brand">
          <h1>Provider<span>IQ</span></h1>
          <small>Intelligence Infrastructure</small>
        </div>
        <div className="topbar-tabs">
          <button className={`tab-btn ${tab==='intelligence'?'active':''}`} onClick={()=>setTab('intelligence')}>Provider Intelligence</button>
          <button className={`tab-btn ${tab==='swarm'?'active':''}`} onClick={()=>setTab('swarm')}><Bot size={12}/> AI Agent Activities</button>
          <button className={`tab-btn ${tab==='sources'?'active':''}`} onClick={()=>setTab('sources')}><Database size={12}/> Sources</button>
          <button className={`tab-btn ${tab==='connections'?'active':''}`} onClick={()=>setTab('connections')}><KeyRound size={12}/> Connections</button>
        </div>
        <div className="topbar-right">
          <div className="inquantic-brand">
            <Sparkles size={12}/> Powered by <strong>Inquantic.Ai</strong>
          </div>
        </div>
      </header>

      {tab === 'swarm' ? (
        <div className="agents-page">
          <h2>Swarm Intelligence Pipeline</h2>
          <p>ProviderIQ utilizes a dynamic, multi-agent AI pipeline scanning, analyzing, and corroborating objective registries and subjective public sentiment indices.</p>
          <div className="agents-grid">
            {AGENTS.map(a => (
              <div key={a.name} className="agent-box">
                <div style={{color: '#706E6B', marginBottom: 12}}>{a.icon}</div>
                <h3 style={{fontWeight: 700, margin: '0 0 8px'}}>{a.name}</h3>
                <p>{a.desc}</p>
                <div style={{borderTop: '1px solid var(--border-light)', paddingTop: 10, marginTop: 10}}>
                  <div style={{fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)'}}>Last Activity:</div>
                  <div style={{fontSize: '0.75rem', color: 'var(--text-primary)', marginTop: 4}}>{a.lastActivity}</div>
                  <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: '0.65rem', color: 'var(--text-tertiary)'}}>
                    <span>Status: <strong>{a.status}</strong></span>
                    <span>Ran: {a.lastRun}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : tab === 'sources' ? (
        <div className="agents-page">
          <h2>Data Resources & Registries</h2>
          <p>Full catalog of primary data feeds processed by the Inquantic.Ai pipeline. Updated in real-time under HIPAA-compliant safeguards.</p>
          <table className="sources-table" style={{width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-light)'}}>
            <thead>
              <tr style={{background: '#F5F5F0', borderBottom: '1px solid var(--border)', textAlign: 'left'}}>
                <th style={{padding: '12px', fontSize: '0.7rem', fontWeight: 800}}>RESOURCE NAME</th>
                <th style={{padding: '12px', fontSize: '0.7rem', fontWeight: 800}}>TYPE</th>
                <th style={{padding: '12px', fontSize: '0.7rem', fontWeight: 800}}>MAPPING AGENT</th>
                <th style={{padding: '12px', fontSize: '0.7rem', fontWeight: 800}}>LAST CHECKED</th>
                <th style={{padding: '12px', fontSize: '0.7rem', fontWeight: 800}}>STATUS</th>
                <th style={{padding: '12px', fontSize: '0.7rem', fontWeight: 800}}>API UNIT COST</th>
              </tr>
            </thead>
            <tbody>
              {DATA_SOURCES.map((s, idx) => (
                <tr key={idx} style={{borderBottom: '1px solid var(--border-light)'}}>
                  <td style={{padding: '12px', fontSize: '0.75rem', fontWeight: 700}}>{s.name}</td>
                  <td style={{padding: '12px', fontSize: '0.75rem'}}><span className={`split-badge ${s.type==='Objective'?'obj':'subj'}`}>{s.type}</span></td>
                  <td style={{padding: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)'}}>{s.agent}</td>
                  <td style={{padding: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)'}}>{s.lastCheck}</td>
                  <td style={{padding: '12px', fontSize: '0.75rem'}}><span style={{color: 'var(--green)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px'}}><CheckCircle2 size={12}/> {s.status}</span></td>
                  <td style={{padding: '12px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)'}}>{s.cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : tab === 'connections' ? (
        <div className="agents-page">
          <h2>API Connections & Authentication</h2>
          <p>Configure credentials, Bearer tokens, API Keys, and OAuth 2.0 flows for external data pipelines.</p>
          <div className="conn-grid">
            {CONNECTIONS.map(c => (
              <div key={c.id} className="conn-card">
                <div className="conn-card-head">
                  <div>
                    <h3>{c.name}</h3>
                    <p>{c.desc}</p>
                  </div>
                  <span style={{fontSize: '0.65rem', fontWeight: 700, padding: '3px 6px', borderRadius: '4px', background: c.status==='Connected'?'var(--green-bg)':'var(--orange-bg)', color: c.status==='Connected'?'var(--green)':'var(--orange)'}}>{c.status}</span>
                </div>
                <div className="input-group">
                  <label>Auth Type</label>
                  <input type="text" value={c.type} disabled style={{background: 'var(--bg)', color: 'var(--text-secondary)'}}/>
                </div>
                {c.type === 'OAuth 2.0' ? (
                  <>
                    <div className="input-group"><label>Client ID</label><input type="text" defaultValue="id_xxxxxxxxxxxxxxxxxxx" /></div>
                    <div className="input-group"><label>Client Secret</label><input type="password" defaultValue="sec_xxxxxxxxxxxxxxxxxxx" /></div>
                  </>
                ) : c.type === 'API Key' || c.type === 'Bearer Token' ? (
                  <div className="input-group"><label>Token / Key</label><input type="password" defaultValue="sk_live_xxxxxxxxxxxxxxxxx" /></div>
                ) : c.type === 'Proxy Credentials' ? (
                  <div className="input-group"><label>Proxy URL / Zone</label><input type="password" defaultValue="http://user:pass@brd.superproxy.io" /></div>
                ) : (
                  <div className="input-group"><label>Certificate Path</label><input type="text" defaultValue="/etc/certs/nhcx_prod.pem" /></div>
                )}
                <div className="conn-actions">
                  <button className="conn-btn">Save</button>
                  <button className="conn-btn primary"><Wifi size={12} style={{display:'inline', marginRight:4, verticalAlign:'middle'}}/> Test Connection</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="layout">
          <aside className="sidebar">
            <div className="sidebar-header">
              <h2>Hospitals</h2>
              <p>Pan-India network empanelled</p>
            </div>
            <div className="search-wrap"><Search/><input placeholder="Search name, city..." value={q} onChange={e => { setQ(e.target.value); load(e.target.value); }} /></div>
            <div className="fac-list">
              {facs.map(f => (
                <div key={f.id} className={`fac-item ${f.id===selId?'active':''}`} onClick={()=>setSelId(f.id)}>
                  <div className="fac-avatar">{f.name.substring(0,2).toUpperCase()}</div>
                  <div className="fac-info">
                    <h4>{f.name}</h4>
                    <p>{f.city}, {f.state}</p>
                  </div>
                  <div className="fac-score-pill">{f.piiScore?.toFixed(0) ?? '—'}</div>
                </div>
              ))}
            </div>
          </aside>

          <main className="main">
            {!d ? <div className="empty-state"><Building2 size={32}/><h2>Select a Provider</h2></div> : (
              <>
                <div className="detail-head">
                  <div>
                    <h2>{d.name}</h2>
                    <div className="meta">
                      <MapPin size={12}/> {d.city}, {d.state} <span className="sep">•</span> {d.bedCount} beds <span className="sep">•</span> {d.nabhStatus?.replace(/_/g,' ')}
                    </div>
                  </div>
                  <button className="btn-audit" onClick={runAudit} disabled={auditing}>
                    <RefreshCw size={12} className={auditing ? 'spinning' : ''}/> {auditing ? 'Agents Running...' : 'Refresh Score'}
                  </button>
                </div>

                <div className="pii-massive">
                  <div className="pii-ring-wrap">
                    <svg viewBox="0 0 100 100">
                      <circle className="track" cx="50" cy="50" r="42" />
                      <circle className="fill" cx="50" cy="50" r="42" stroke={ringColor} strokeDasharray={2 * Math.PI * 42} strokeDashoffset={2 * Math.PI * 42 - (displayScore/100)*2*Math.PI*42} />
                    </svg>
                    <div className="pii-ring-label">
                      <span className="num" style={{color: ringColor}}>{displayScore.toFixed(0)}</span>
                      <span className="of">/100</span>
                    </div>
                  </div>
                  <div className="pii-massive-content">
                    <h3>
                      Provider Intelligence Index {deltas.pii !== undefined && <DeltaBadge val={deltas.pii} suffix=" pts"/>}
                      <button className="info-btn" onClick={() => setShowConfig(!showConfig)}><Info size={14}/></button>
                    </h3>
                    <p>Dynamic score tracking provider performance, structural compliance, claims stability, and qualitative sentiment weightings. Computed by 6 active intelligence agents crawling verified and public networks. <br/><strong>Last Run:</strong> {new Date().toLocaleTimeString()} (Today)</p>
                    
                    {/* Inline Config Explanation (Apple Style) */}
                    {showConfig && (
                      <div className="pii-config-panel">
                        <strong>Gravity Weights:</strong>
                        <span className="weight-badge">Trust: 25%</span>
                        <span className="weight-badge">Operational: 20%</span>
                        <span className="weight-badge">Billing: 20%</span>
                        <span className="weight-badge">Clinical: 20%</span>
                        <span className="weight-badge">Patient Exp: 10%</span>
                        <span className="weight-badge">Fraud Risk: 5%</span>
                        <p className="config-desc">Weightings map directly to claims exposure probability. High risk indices (e.g. upcoding) heavily penalize overall PII. Scores &gt;80 designate <strong>Premium Network</strong> tier.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* The 6 Core Scoring Dimension Indicators */}
                <h3 className="split-header">Scoring dimensions — the Provider Intelligence Index</h3>
                <div className="dimensions-matrix">
                  <div className="matrix-card">
                    <h5>Trust Score (25%) <DeltaBadge val={deltas.trust} suffix="%"/></h5>
                    <div className="mc-val">{d.trustScore?.toFixed(0)}%</div>
                    <div className="mc-bar"><div className="mc-fill" style={{background: 'var(--blue)', width: `${d.trustScore}%`}}/></div>
                    <p className="mc-desc">NABH status, accreditation age, empanelment history, local sentiments.</p>
                    <div className="mc-footer">
                      <div className="agent-run-tag"><Database size={10}/> Registry Agent</div>
                      <div className="volumetrics">{vols.trust?.total} scanned (<span>+{vols.trust?.new} new</span>)</div>
                    </div>
                  </div>
                  <div className="matrix-card">
                    <h5>Operational Score (20%) <DeltaBadge val={deltas.op} suffix="%"/></h5>
                    <div className="mc-val">{d.operationalScore?.toFixed(0)}%</div>
                    <div className="mc-bar"><div className="mc-fill" style={{background: 'var(--green)', width: `${d.operationalScore}%`}}/></div>
                    <p className="mc-desc">Bed occupancy rate, staff ratio, pre-auth delays, ABDM status.</p>
                    <div className="mc-footer">
                      <div className="agent-run-tag"><Database size={10}/> Registry Agent</div>
                      <div className="volumetrics">{vols.op?.total} scanned (<span>+{vols.op?.new} new</span>)</div>
                    </div>
                  </div>
                  <div className="matrix-card">
                    <h5>Billing Stability (20%) <DeltaBadge val={deltas.bill} suffix="%"/></h5>
                    <div className="mc-val">{d.billingStabilityScore?.toFixed(0)}%</div>
                    <div className="mc-bar"><div className="mc-fill" style={{background: 'var(--orange)', width: `${d.billingStabilityScore}%`}}/></div>
                    <p className="mc-desc">Package cost variations, top-up frequency, NHCX procedural billing patterns.</p>
                    <div className="mc-footer">
                      <div className="agent-run-tag"><TrendingUp size={10}/> Billing Analyst</div>
                      <div className="volumetrics">{vols.bill?.total} scanned (<span>+{vols.bill?.new} new</span>)</div>
                    </div>
                  </div>
                  <div className="matrix-card">
                    <h5>Clinical Quality (20%) <DeltaBadge val={deltas.clin} suffix="%"/></h5>
                    <div className="mc-val">{d.clinicalQualityScore?.toFixed(0)}%</div>
                    <div className="mc-bar"><div className="mc-fill" style={{background: 'var(--accent)', width: `${d.clinicalQualityScore}%`}}/></div>
                    <p className="mc-desc">Specialty depth, physician NMC status, average length of stay peer matching.</p>
                    <div className="mc-footer">
                      <div className="agent-run-tag"><Cpu size={10}/> Orchestrator</div>
                      <div className="volumetrics">{vols.clin?.total} scanned (<span>+{vols.clin?.new} new</span>)</div>
                    </div>
                  </div>
                  <div className="matrix-card">
                    <h5>Patient Experience (10%) <DeltaBadge val={deltas.pat} suffix="%"/></h5>
                    <div className="mc-val">{d.patientExperienceScore?.toFixed(0)}%</div>
                    <div className="mc-bar"><div className="mc-fill" style={{background: 'var(--red)', width: `${d.patientExperienceScore}%`}}/></div>
                    <p className="mc-desc">NLP parsed feedback reviews, Practo comments, consumer board disputes.</p>
                    <div className="mc-footer">
                      <div className="agent-run-tag"><Heart size={10}/> Sentiment Agent</div>
                      <div className="volumetrics">{vols.pat?.total} scanned (<span>+{vols.pat?.new} new</span>)</div>
                    </div>
                  </div>
                  <div className="matrix-card">
                    <h5>Fraud Risk Indicator (5%) <DeltaBadge val={deltas.fraud} suffix="%"/></h5>
                    <div className="mc-val" style={{color: riskLvl==='low'?'var(--green)':'var(--red)'}}>{d.fraudRiskScore?.toFixed(0)}%</div>
                    <div className="mc-bar"><div className="mc-fill" style={{background: riskLvl==='low'?'var(--green)':'var(--red)', width: `${d.fraudRiskScore}%`}}/></div>
                    <p className="mc-desc">Multi-agent corroborated upcoding signals & peer outlier procedure frequencies.</p>
                    <div className="mc-footer">
                      <div className="agent-run-tag"><Shield size={10}/> Supervisor Agent</div>
                      <div className="volumetrics">{vols.fraud?.total} scanned (<span>+{vols.fraud?.new} new</span>)</div>
                    </div>
                  </div>
                </div>

                <div className={`apple-alert ${riskLvl}`}>
                  <div>
                    <h3>Claims & Fraud Risk Indicator: {(d.fraudRiskLevel??'LOW')}</h3>
                    <p>{riskLvl==='low' ? 'Billing patterns and hospital stay durations conform to peer network parameters.' : 'Significant package variances or stay anomalies detected. Scrutiny advised.'}</p>
                  </div>
                </div>

                {/* Explicit Split: Objective vs Subjective */}
                <h3 className="split-header">
                  <Database size={14} color="var(--blue)"/> 
                  Objective Clinical Registries 
                  <span className="split-badge obj">Government & Regulatory Verified</span>
                </h3>
                
                <div className="apple-grid">
                  <div className="apple-card">
                    <h4>Empanelment & Quality Standards</h4>
                    <div className="val-row"><span className="val-label">NABH Accreditation</span><span className={`val-data ${d.nabhStatus !== 'NOT_ACCREDITED' ? 'good' : 'bad'}`}>{d.nabhStatus?.replace(/_/g,' ')} {d.nabhGrade}</span></div>
                    <div className="val-row"><span className="val-label">CGHS Panel Empanelled</span><span className={`val-data ${d.cghsEmpanelled ? 'good' : ''}`}>{d.cghsEmpanelled ? 'Yes' : 'No'}</span></div>
                    <div className="val-row"><span className="val-label">ECHS Empanelled</span><span className={`val-data ${d.echsEmpanelled ? 'good' : ''}`}>{d.echsEmpanelled ? 'Yes' : 'No'}</span></div>
                  </div>
                  <div className="apple-card">
                    <h4>Digital Health & Scale</h4>
                    <div className="val-row"><span className="val-label">ABDM HFR Status</span><span className={`val-data ${d.abdmReadiness ? 'good' : 'bad'}`}>{d.abdmReadiness ? 'Registered' : 'Pending'}</span></div>
                    <div className="val-row"><span className="val-label">Bed Registry Capacity</span><span className="val-data">{d.bedCount} beds</span></div>
                  </div>
                </div>

                <h3 className="split-header">
                  <Users size={14} color="var(--orange)"/> 
                  Subjective Public Sentiment Signals 
                  <span className="split-badge subj">AI Scraped & NLP Processed</span>
                </h3>
                
                <div className="apple-grid">
                  <div className="apple-card">
                    <h4>Patient Satisfaction & Volume</h4>
                    <div className="val-row"><span className="val-label">Google Maps Crawled Reviews</span><span className="val-data">{d.reviews?.filter((r:any)=>r.source==='GOOGLE_MAPS').length ?? 0}</span></div>
                    <div className="val-row"><span className="val-label">Practo Ratings Count</span><span className="val-data">{d.reviews?.filter((r:any)=>r.source==='PRACTO').length ?? 0}</span></div>
                    <div className="val-row"><span className="val-label">NLP Positivity Index</span><span className={`val-data ${(d.reviews?.[0]?.sentimentScore??0)>0.6?'good':'bad'}`}>{d.reviews?.[0]?.sentimentScore ? `${(d.reviews[0].sentimentScore*100).toFixed(0)}% Positive` : 'N/A'}</span></div>
                  </div>
                  <div className="apple-card">
                    <h4>Public & News Ecosystem</h4>
                    <div className="val-row"><span className="val-label">News Articles Indexed</span><span className="val-data">{d.newsItems?.length ?? 0} Articles</span></div>
                    <div className="val-row"><span className="val-label">Media Sentiment Quotient</span><span className="val-data">{d.newsItems?.[0]?.sentimentScore ? `${(d.newsItems[0].sentimentScore*100).toFixed(0)}% Positive` : 'Neutral'}</span></div>
                  </div>
                </div>

              </>
            )}
          </main>
        </div>
      )}
    </div>
  );
}
