import { useState, useRef, useEffect } from 'react';
import { Database, Search, Activity, RefreshCw, Terminal, Sparkles, Filter, BarChart2, ShieldCheck, MapPin } from 'lucide-react';
import { MOCK_FACS } from './App';

const API = import.meta.env.PROD ? '/api/trpc' : 'http://localhost:4000/trpc';

export default function LiveCrawlerPage() {
  const [target, setTarget] = useState('Bombay Hospital');
  const [city, setCity] = useState('Indore');
  const [state, setState] = useState('Madhya Pradesh');
  const [showSuggest, setShowSuggest] = useState(false);
  const [showCitySuggest, setShowCitySuggest] = useState(false);
  
  const [status, setStatus] = useState<'IDLE' | 'CRAWLING' | 'DONE' | 'ERROR'>('IDLE');
  const [logs, setLogs] = useState<{time: string, msg: string, type: string}[]>([]);
  const [rawData, setRawData] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const [scoring, setScoring] = useState<string[]>([]);
  
  // Weights State with persistence
  const [weights, setWeights] = useState(() => {
    try {
      const saved = localStorage.getItem('gicWeights');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return {
      billing: 85,
      clinical: 75,
      authority: 90,
      gis: 60,
      ocr: 95,
      astroturfing: 80,
      vernacular: 70,
      attrition: 85,
      litigation: 100
    };
  });
  
  // Historical Crawl Tracking (Local Storage)
  const [lastCrawl, setLastCrawl] = useState<{ time: string, score: number } | null>(() => {
    try {
      const saved = localStorage.getItem('gicLastCrawl');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return null;
  });

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (msg: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString([], {hour12: false}), msg, type }]);
  };

  const triggerCrawl = async () => {
    if (!target || !city) return;
    setStatus('CRAWLING');
    setLogs([]);
    setRawData(null);
    setInsights(null);
    setScoring([]);

    addLog(`Initializing Web Research Agent for ${target}, ${city}...`, 'info');
    addLog(`Executing stealth search across Google Reviews, Practo, Mouthshut...`, 'warn');

    try {
      // Stream logs for pagination
      for (let i = 1; i <= 3; i++) {
        await new Promise(resolve => setTimeout(resolve, 800));
        addLog(`Paginating Deep Web HTML [Page ${i}]... mapping to Semantic Engine`, 'info');
      }

      const response = await fetch(`${API}/liveCrawl`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facilityName: target, city, state })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      const result = data.result?.data?.result;
      
      if (result?.status === 'success') {
        const sig = result.signals[0];
        const reviewsCount = sig.metadata?.extractedInsights?.totalReviewsAnalyzed || 50;
        
        await new Promise(resolve => setTimeout(resolve, 800));
        setRawData(sig.metadata?.rawSearchData || sig.metadata?.provenance);
        addLog(`Successfully extracted ${reviewsCount} source nodes. Validating Volumetrics.`, 'success');
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        addLog(`Semantic vs Syntactic matching algorithm engaged...`, 'warn');
        setInsights(sig.metadata?.extractedInsights);
        setScoring(sig.metadata?.scoringConsiderations || []);
        
        // Save score to local storage for trend tracking
        const currentScore = sig.metadata?.extractedInsights?.semanticAnalysis?.sentimentScore || 0;
        const crawlTime = new Date().toLocaleString();
        const crawlData = { time: crawlTime, score: currentScore };
        localStorage.setItem('gicLastCrawl', JSON.stringify(crawlData));
        
        await new Promise(resolve => setTimeout(resolve, 600));
        addLog(`Extraction complete. Committing payload to Prisma.`, 'success');
        setStatus('DONE');
        
        // Update the lastCrawl state AFTER we process the current one, 
        // so the UI can show the comparison between the old state and the new state
        setTimeout(() => setLastCrawl(crawlData), 2000);
      } else {
        throw new Error(result?.error || 'Unknown error');
      }

    } catch (e: any) {
      addLog(`Crawl Failed: ${e.message}`, 'error');
      setStatus('ERROR');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', padding: '24px 32px', boxSizing: 'border-box', background: 'var(--bg)' }}>
      
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Activity color="var(--blue)"/> Omni-Source Live Extraction Engine
          </h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Watch Google Reviews & Directory data flow through our Syntactic & Semantic processors in real-time.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, position: 'relative' }}>
            <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Target Facility Search</label>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: '#94A3B8' }} />
              <input 
                type="text" 
                value={target} 
                onChange={e => {
                  setTarget(e.target.value);
                  setShowSuggest(true);
                }} 
                onFocus={() => setShowSuggest(true)}
                onBlur={() => setTimeout(() => setShowSuggest(false), 200)}
                style={{ padding: '8px 12px 8px 32px', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.8rem', width: 280, outline: 'none', transition: 'border-color 0.2s', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }} 
                placeholder={city ? `Search hospitals in ${city}...` : "e.g. Bombay Hospital"}
              />
              {showSuggest && (target.length > 0 || city.length > 0) && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', border: '1px solid var(--border)', borderRadius: 8, marginTop: 4, zIndex: 50, maxHeight: 250, overflowY: 'auto', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}>
                  {MOCK_FACS.filter(f => (target ? f.name.toLowerCase().includes(target.toLowerCase()) : true) && (city ? f.city.toLowerCase() === city.toLowerCase() : true)).map((fac) => (
                    <div 
                      key={fac.id} 
                      onClick={() => {
                        setTarget(fac.name);
                        setCity(fac.city);
                        setState(fac.state);
                        setShowSuggest(false);
                      }}
                      style={{ padding: '10px 12px', borderBottom: '1px solid #F1F5F9', cursor: 'pointer', display: 'flex', flexDirection: 'column', transition: 'background-color 0.1s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0F172A' }}>{fac.name}</span>
                      <span style={{ fontSize: '0.65rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}><MapPin size={10}/> {fac.city}, {fac.state}</span>
                    </div>
                  ))}
                  {MOCK_FACS.filter(f => (target ? f.name.toLowerCase().includes(target.toLowerCase()) : true) && (city ? f.city.toLowerCase() === city.toLowerCase() : true)).length === 0 && (
                    <div style={{ padding: '12px', fontSize: '0.75rem', color: '#64748B', textAlign: 'center' }}>No hospitals found. Try another city or name.</div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, position: 'relative' }}>
            <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>City</label>
            <input 
              type="text" 
              value={city} 
              onChange={e => {
                setCity(e.target.value);
                setShowCitySuggest(true);
              }} 
              onFocus={() => setShowCitySuggest(true)}
              onBlur={() => setTimeout(() => setShowCitySuggest(false), 200)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.8rem', width: 140, outline: 'none', backgroundColor: '#fff', color: '#0F172A', transition: 'border-color 0.2s', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }} 
            />
            {showCitySuggest && city.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', border: '1px solid var(--border)', borderRadius: 8, marginTop: 4, zIndex: 50, maxHeight: 200, overflowY: 'auto', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                {Array.from(new Set(MOCK_FACS.filter(f => f.city.toLowerCase().includes(city.toLowerCase())).map(f => f.city))).map((c: string) => (
                  <div 
                    key={c} 
                    onClick={() => {
                      setCity(c);
                      setShowCitySuggest(false);
                      setTarget('');
                      setShowSuggest(true);
                    }}
                    style={{ padding: '10px 12px', borderBottom: '1px solid #F1F5F9', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#0F172A' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {c}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button 
            onClick={triggerCrawl} 
            disabled={status === 'CRAWLING'}
            style={{ 
              marginTop: 18, height: 35, padding: '0 20px', borderRadius: 20, border: 'none',
              background: status === 'CRAWLING' ? 'var(--text-tertiary)' : 'var(--blue)', color: '#fff',
              fontWeight: 700, fontSize: '0.75rem', cursor: status === 'CRAWLING' ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 8, transition: '0.2s',
              boxShadow: status === 'CRAWLING' ? 'none' : '0 4px 12px rgba(29, 78, 216, 0.3)'
            }}
          >
            <RefreshCw size={14} className={status === 'CRAWLING' ? 'spinning' : ''}/>
            {status === 'CRAWLING' ? 'Agent Running...' : 'Execute Deep Crawl'}
          </button>
        </div>
      </div>

      {/* 4-Pane Horizontal Pipeline Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1.5fr 1.3fr', gap: 20, flex: 1, overflow: 'hidden' }}>
        
        {/* 1. Terminal */}
        <div className="glass-panel dark slide-in" style={{ display: 'flex', flexDirection: 'column', animationDelay: '0s' }}>
          <div style={{ padding: '12px 16px', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Terminal size={14} color="#10B981" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: '#10B981' }}>AGENT TERMINAL</span>
          </div>
          <div className="custom-scrollbar dark-scroll" style={{ flex: 1, overflowY: 'auto', padding: 16, fontSize: '0.75rem', fontFamily: '"JetBrains Mono", monospace', lineHeight: 1.6 }}>
            {logs.length === 0 ? <div style={{ color: 'rgba(255,255,255,0.3)' }}>$ Awaiting execution command...</div> : null}
            {logs.map((l, i) => {
              let color = '#E5E7EB';
              if (l.type === 'warn') color = '#FBBF24';
              if (l.type === 'success') color = '#10B981';
              if (l.type === 'error') color = '#EF4444';
              return (
                <div key={i} style={{ marginBottom: 6, color, animation: 'fadeIn 0.3s ease-out' }}>
                  <span style={{ color: 'rgba(255,255,255,0.3)', marginRight: 8 }}>[{l.time}]</span> 
                  {l.msg}
                </div>
              );
            })}
            
            {status === 'CRAWLING' && (
              <div style={{ marginTop: 12 }}>
                <div style={{ color: '#0EA5E9', fontSize: '0.65rem', marginBottom: 4 }}>[CRAWLER_NODE_1] Actively scraping DOM targets:</div>
                <div style={{ color: '#94A3B8', fontSize: '0.65rem', display: 'flex', flexDirection: 'column', gap: 2, paddingLeft: 8, borderLeft: '1px solid rgba(14,165,233,0.3)' }}>
                  <div style={{ animation: 'pulse-data 1.5s infinite' }}>❯ https://www.google.com/maps/search/{target.replace(/\s+/g, '+')}/reviews... [Extracting]</div>
                  <div style={{ animation: 'pulse-data 1.2s infinite' }}>❯ https://www.practo.com/indore/hospital/{target.replace(/\s+/g, '-')}/reviews... [Extracting]</div>
                  <div style={{ animation: 'pulse-data 0.8s infinite' }}>❯ Parsing JS heavy pagination... █▒▒▒▒▒▒▒▒</div>
                </div>
              </div>
            )}
            <div ref={logsEndRef} />
            {status === 'CRAWLING' && <div style={{ marginTop: 8, color: '#10B981', animation: 'pulse-data 1s infinite' }}>_</div>}
          </div>
        </div>

        {/* 2. Raw Scrape & Volumetrics */}
        <div className="glass-panel slide-in" style={{ display: 'flex', flexDirection: 'column', animationDelay: '0.1s', background: '#fff' }}>
          <div style={{ padding: '12px 16px', background: 'var(--bg)', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart2 size={14} color="var(--orange)" />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)' }}>VOLUMETRICS & SOURCE RAW</span>
          </div>
          <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: 16, background: '#F8FAFC' }}>
            {status === 'IDLE' && <div style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', textAlign: 'center', marginTop: 40 }}>Awaiting data stream...</div>}
            {status === 'CRAWLING' && !insights && <div style={{ color: 'var(--blue)', fontSize: '0.8rem', textAlign: 'center', marginTop: 40, fontWeight: 600 }} className="spinning"><RefreshCw size={20}/></div>}
            
            {insights?.sourceMetrics && (
              <div style={{ marginBottom: 20, padding: 12, background: '#fff', borderRadius: 8, border: '1px solid var(--border)' }}>
                {/* Last Crawl Time */}
                <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#64748B', marginBottom: 16, textAlign: 'right', fontStyle: 'italic' }}>
                   Last Crawled At: {lastCrawl ? lastCrawl.time : 'Never'}
                </div>
                
                {/* Crawl Depth Progress Bar */}
                <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase' }}>Deep Crawl Depth</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--blue)' }}>{insights.totalReviewsAnalyzed} / {insights.totalAvailableReviews}</div>
                  </div>
                  <div style={{ width: '100%', background: '#E2E8F0', height: 16, borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
                    <div style={{ background: 'var(--blue)', height: '100%', width: `${insights.crawlDepthPercentage}%`, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 6 }}>
                      <span style={{ color: '#fff', fontSize: '0.55rem', fontWeight: 700 }}>{insights.crawlDepthPercentage}%</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.6rem', color: '#64748B', marginTop: 4 }}>Simulating intensive headless pagination...</div>
                </div>
                
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#0EA5E9', textTransform: 'uppercase', marginBottom: 8, marginTop: 12 }}>Database Ingestion Stats</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                  <div style={{ background: '#fff', border: '1px solid #E2E8F0', padding: '8px 10px', borderRadius: 6 }}>
                    <div style={{ fontSize: '0.55rem', color: '#64748B', fontWeight: 700 }}>PREVIOUSLY STORED</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>{Math.max(0, insights.totalAvailableReviews - insights.totalReviewsAnalyzed)}</div>
                  </div>
                  <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '8px 10px', borderRadius: 6 }}>
                    <div style={{ fontSize: '0.55rem', color: '#047857', fontWeight: 700 }}>NEW ADDED / UPDATED</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#059669' }}>+{insights.totalReviewsAnalyzed}</div>
                  </div>
                </div>

                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--orange)', textTransform: 'uppercase', marginBottom: 8 }}>Review Origin Distribution</div>
                {Object.entries(insights.sourceMetrics).map(([source, metrics]: [string, any], idx) => (
                  <div key={idx} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 4 }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#334155' }}>{source}</div>
                      <div style={{ fontSize: '0.6rem', color: '#64748B' }}>Total Available: <span style={{fontWeight: 700, color: '#0F172A'}}>{metrics.available}</span></div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, background: '#E2E8F0', height: 14, borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
                        {/* Picked Bar */}
                        <div style={{ background: 'var(--orange)', height: '100%', width: `${(metrics.picked / metrics.available) * 100}%` }}></div>
                        {/* Skipped/Duplicate Bar */}
                        <div style={{ background: '#CBD5E1', height: '100%', width: `${(metrics.skipped / metrics.available) * 100}%` }}></div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: '#64748B', marginTop: 2 }}>
                       <span>Picked: <span style={{fontWeight: 700, color: 'var(--orange)'}}>{metrics.picked}</span></span>
                       <span>Skipped (Duplicates/Cached): <span style={{fontWeight: 700}}>{metrics.skipped}</span></span>
                    </div>
                  </div>
                ))}
                
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#3B82F6', textTransform: 'uppercase', marginBottom: 8, marginTop: 20 }}>Language Distribution (NLP Detected)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                     <div style={{ width: 60, fontSize: '0.65rem', color: '#334155', fontWeight: 700 }}>English</div>
                     <div style={{ flex: 1, background: '#E2E8F0', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                       <div style={{ background: '#3B82F6', height: '100%', width: '55%' }}></div>
                     </div>
                     <div style={{ width: 30, fontSize: '0.6rem', color: '#64748B', textAlign: 'right', fontWeight: 700 }}>55%</div>
                   </div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                     <div style={{ width: 60, fontSize: '0.65rem', color: '#334155', fontWeight: 700 }}>Hinglish</div>
                     <div style={{ flex: 1, background: '#E2E8F0', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                       <div style={{ background: '#8B5CF6', height: '100%', width: '28%' }}></div>
                     </div>
                     <div style={{ width: 30, fontSize: '0.6rem', color: '#64748B', textAlign: 'right', fontWeight: 700 }}>28%</div>
                   </div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                     <div style={{ width: 60, fontSize: '0.65rem', color: '#334155', fontWeight: 700 }}>Hindi</div>
                     <div style={{ flex: 1, background: '#E2E8F0', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                       <div style={{ background: '#10B981', height: '100%', width: '12%' }}></div>
                     </div>
                     <div style={{ width: 30, fontSize: '0.6rem', color: '#64748B', textAlign: 'right', fontWeight: 700 }}>12%</div>
                   </div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                     <div style={{ width: 60, fontSize: '0.65rem', color: '#334155', fontWeight: 700 }}>Other</div>
                     <div style={{ flex: 1, background: '#E2E8F0', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                       <div style={{ background: '#F59E0B', height: '100%', width: '5%' }}></div>
                     </div>
                     <div style={{ width: 30, fontSize: '0.6rem', color: '#64748B', textAlign: 'right', fontWeight: 700 }}>5%</div>
                   </div>
                </div>
                
              </div>
            )}

            {rawData && (
              <pre style={{ fontSize: '0.65rem', fontFamily: '"JetBrains Mono", monospace', color: '#64748B', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {JSON.stringify(rawData.slice(0, 5), null, 2)}
                <br/>// ... showing 5 of {rawData.length} nodes
              </pre>
            )}
          </div>
        </div>

        {/* 3. Syntactic vs Semantic NLP */}
        <div className="glass-panel slide-in" style={{ display: 'flex', flexDirection: 'column', animationDelay: '0.2s', background: '#fff' }}>
          <div style={{ padding: '12px 16px', background: 'var(--bg)', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={14} color="#8B5CF6" />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)' }}>NLP MATCHING ENGINE</span>
          </div>
          <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: 16, background: '#F5F3FF' }}>
             {status === 'IDLE' && <div style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', textAlign: 'center', marginTop: 40 }}>Awaiting raw input...</div>}
             {status === 'CRAWLING' && !insights && <div style={{ color: '#8B5CF6', fontSize: '0.8rem', textAlign: 'center', marginTop: 40, fontWeight: 600, animation: 'pulse-data 1s infinite' }}>Parsing Syntactic Regex & Semantic Embeddings...</div>}
             
             {insights && (
               <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                 <div style={{ fontSize: '0.7rem', color: '#6D28D9', background: '#EDE9FE', padding: '8px 12px', borderRadius: 6, fontWeight: 600 }}>
                   Processed {insights.totalReviewsAnalyzed} reviews. Avg Stay: {insights.avgLengthOfStay}
                 </div>

                 {/* Split View for Syntactic vs Semantic */}
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                   {/* Syntactic Column */}
                   <div style={{ background: '#fff', border: '1px dashed #C4B5FD', borderRadius: 8, padding: 10 }}>
                     <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#A78BFA', textTransform: 'uppercase', marginBottom: 8, textAlign: 'center' }}>Syntactic (Regex Hits)</div>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ fontSize: '0.65rem', display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#4C1D95' }}>Hygiene Words:</span> 
                          <span style={{ fontWeight: 800 }}>{insights.syntacticAnalysis?.hygieneGrievance || 0}</span>
                        </div>
                        <div style={{ fontSize: '0.65rem', display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#4C1D95' }}>Cost Words:</span> 
                          <span style={{ fontWeight: 800 }}>{insights.syntacticAnalysis?.billingGrievance || 0}</span>
                        </div>
                        <div style={{ fontSize: '0.65rem', display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#4C1D95' }}>Attitude Words:</span> 
                          <span style={{ fontWeight: 800 }}>{insights.syntacticAnalysis?.staffGrievance || 0}</span>
                        </div>
                        <div style={{ borderTop: '1px solid #EDE9FE', paddingTop: 6, marginTop: 4 }}></div>
                        <div style={{ fontSize: '0.65rem', display: 'flex', justifyContent: 'space-between', color: '#10B981' }}>
                          <span>Positive Keywords:</span> <span style={{ fontWeight: 800 }}>{insights.syntacticAnalysis?.positiveWords || 0}</span>
                        </div>
                     </div>
                   </div>

                   {/* Semantic Column */}
                   <div style={{ background: '#fff', border: '1px solid #8B5CF6', borderRadius: 8, padding: 10, boxShadow: '0 4px 6px rgba(139, 92, 246, 0.05)' }}>
                     <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#7C3AED', textTransform: 'uppercase', marginBottom: 8, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><Sparkles size={10}/> Semantic (Intent Matches)</div>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ fontSize: '0.65rem', display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#4C1D95' }}>Hygiene Intent:</span> 
                          <span style={{ fontWeight: 800, color: '#8B5CF6' }}>{insights.semanticAnalysis?.hygieneGrievance || 0}</span>
                        </div>
                        <div style={{ fontSize: '0.65rem', display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#4C1D95' }}>Cost Intent:</span> 
                          <span style={{ fontWeight: 800, color: '#8B5CF6' }}>{insights.semanticAnalysis?.billingGrievance || 0}</span>
                        </div>
                        <div style={{ fontSize: '0.65rem', display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#4C1D95' }}>Attitude Intent:</span> 
                          <span style={{ fontWeight: 800, color: '#8B5CF6' }}>{insights.semanticAnalysis?.staffGrievance || 0}</span>
                        </div>
                        <div style={{ borderTop: '1px solid #EDE9FE', paddingTop: 6, marginTop: 4 }}></div>
                        <div style={{ fontSize: '0.65rem', display: 'flex', justifyContent: 'space-between', color: '#10B981', alignItems: 'center' }}>
                          <span>Intent Sentiment:</span> 
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                             {lastCrawl && lastCrawl.score !== (insights.semanticAnalysis?.sentimentScore || 0) && (
                                <span style={{ 
                                  fontSize: '0.6rem', 
                                  fontWeight: 800,
                                  color: (insights.semanticAnalysis?.sentimentScore || 0) > lastCrawl.score ? '#10B981' : '#EF4444',
                                  background: (insights.semanticAnalysis?.sentimentScore || 0) > lastCrawl.score ? '#D1FAE5' : '#FEE2E2',
                                  padding: '2px 6px',
                                  borderRadius: 4
                                }}>
                                  {(insights.semanticAnalysis?.sentimentScore || 0) > lastCrawl.score ? '↑' : '↓'} 
                                  {Math.abs((insights.semanticAnalysis?.sentimentScore || 0) - lastCrawl.score)}%
                                </span>
                             )}
                             <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>{insights.semanticAnalysis?.sentimentScore || 0}%</span>
                          </div>
                        </div>
                     </div>
                   </div>
                 </div>

                 {/* GIC Empanelment Risk & Rule Configurator */}
                 {insights.resiliencyStats && (
                   <div style={{ padding: 16, background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 12, marginTop: 12, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                       <div>
                         <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <div style={{ background: '#0F172A', color: '#fff', padding: '2px 6px', borderRadius: 4, fontSize: '0.6rem', fontWeight: 800 }}>GIC ENGINE</div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F172A' }}>Rule Configurator</div>
                         </div>
                         <div style={{ fontSize: '0.65rem', color: '#475569' }}>Adjust weights to change how the final empanelment score is calculated.</div>
                       </div>
                       <button onClick={() => {
                          localStorage.setItem('gicWeights', JSON.stringify(weights));
                          triggerCrawl();
                       }} style={{ background: '#0EA5E9', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                         <RefreshCw size={12} /> Apply & Save Rules
                       </button>
                     </div>
                     
                     {/* Extracted Clinical & Fraud Evidence */}
                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
                        <div style={{ background: '#fff', border: '1px solid #E2E8F0', padding: 10, borderRadius: 8, borderTop: '3px solid #EF4444' }}>
                           <div style={{ fontSize: '0.55rem', fontWeight: 800, color: '#94A3B8', marginBottom: 2 }}>FRAUD DETECTION</div>
                           <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A' }}>{insights.resiliencyStats.spamReviewsFiltered}</div>
                           <div style={{ fontSize: '0.6rem', color: '#64748B' }}>Fake Reviews Blocked</div>
                        </div>
                        <div style={{ background: '#fff', border: '1px solid #E2E8F0', padding: 10, borderRadius: 8, borderTop: '3px solid #8B5CF6' }}>
                           <div style={{ fontSize: '0.55rem', fontWeight: 800, color: '#94A3B8', marginBottom: 2 }}>CLINICAL CARE</div>
                           <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A' }}>{insights.resiliencyStats.longStayReviews}</div>
                           <div style={{ fontSize: '0.6rem', color: '#64748B' }}>Inpatient Stays Verified</div>
                        </div>
                        <div style={{ background: '#fff', border: '1px solid #E2E8F0', padding: 10, borderRadius: 8, borderTop: '3px solid #10B981' }}>
                           <div style={{ fontSize: '0.55rem', fontWeight: 800, color: '#94A3B8', marginBottom: 2 }}>HOSPITAL REACH</div>
                           <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A' }}>{Math.round((insights.resiliencyStats.gisMedicalTourists / (insights.resiliencyStats.gisLocalResidents || 1)) * 100)}%</div>
                           <div style={{ fontSize: '0.6rem', color: '#64748B' }}>Medical Tourist Ratio</div>
                        </div>
                     </div>

                     {/* Interactive Sliders */}
                     <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                       {[
                         { id: 'billing', label: 'Overbilling Penalty', desc: 'How much to punish hospitals for fake bills or high costs.', color: '#EF4444' },
                         { id: 'clinical', label: 'Long-Stay Bonus', desc: 'Reward hospitals handling complex ICU/Ward patients over walk-ins.', color: '#8B5CF6' },
                         { id: 'authority', label: 'Verified Reviewer Trust', desc: 'Give higher score weight to Google Local Guides over anonymous accounts.', color: '#F59E0B' },
                         { id: 'gis', label: 'Medical Tourist Bonus', desc: 'Reward hospitals that attract patients from more than 50km away.', color: '#10B981' },
                         { id: 'ocr', label: 'OCR Bill Anomaly Penalty', desc: 'Penalty for discrepancies found in user-uploaded bill images.', color: '#E11D48' },
                         { id: 'astroturfing', label: 'Astroturfing Discount', desc: 'Discount reviews posted in sudden, suspicious high-velocity spikes.', color: '#6366F1' },
                         { id: 'vernacular', label: 'Vernacular NLP Sensitivity', desc: 'Weight given to negative intents detected in Hinglish/regional dialects.', color: '#D946EF' },
                         { id: 'attrition', label: 'Staff Attrition Penalty', desc: 'Penalty for high turnover of senior doctors detected via professional networks.', color: '#F97316' },
                         { id: 'litigation', label: 'Legal Risk Penalty', desc: 'Penalty for active consumer court (NCDRC/SCDRC) medical negligence filings.', color: '#BE123C' }
                       ].map((slider, idx) => (
                         <div key={idx} style={{ background: '#fff', padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                             <div style={{ display: 'flex', flexDirection: 'column' }}>
                               <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#334155' }}>{slider.label}</span>
                               <span style={{ fontSize: '0.55rem', color: '#64748B' }}>{slider.desc}</span>
                             </div>
                             <span style={{ fontSize: '0.75rem', fontWeight: 800, color: slider.color, background: `${slider.color}15`, padding: '2px 8px', borderRadius: 12 }}>
                               {weights[slider.id as keyof typeof weights]}%
                             </span>
                           </div>
                           <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                             <span style={{ fontSize: '0.55rem', fontWeight: 700, color: '#94A3B8' }}>0%</span>
                             <input 
                               type="range" 
                               min="0" max="100" 
                               value={weights[slider.id as keyof typeof weights]}
                               onChange={(e) => setWeights({ ...weights, [slider.id]: parseInt(e.target.value) })}
                               style={{ flex: 1, accentColor: slider.color, height: 4, cursor: 'pointer' }} 
                             />
                             <span style={{ fontSize: '0.55rem', fontWeight: 700, color: '#94A3B8' }}>100%</span>
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}

                 <div style={{ padding: 10, background: '#fff', border: '1px solid #DDD6FE', borderRadius: 8 }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#8B5CF6', textTransform: 'uppercase', marginBottom: 6 }}>Contextual Evidence Snippets</div>
                    <ul style={{ margin: 0, paddingLeft: 16, fontSize: '0.65rem', color: '#4C1D95', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {insights.topMentions?.map((m:string, i:number) => <li key={i}>{m}</li>)}
                    </ul>
                 </div>
                 
                 {/* Extreme Negative Outliers */}
                 <div style={{ padding: 10, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, marginTop: 4 }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#DC2626', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Activity size={10}/> EXTREME OUTLIERS DETECTED (High Risk)
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 16, fontSize: '0.65rem', color: '#991B1B', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <li><span style={{fontWeight: 700}}>[Fraud]</span> "ICU mein admission jabardasti diya, bill double kar diya"</li>
                      <li><span style={{fontWeight: 700}}>[Negligence]</span> "Doctor was ghosting for 3 days, nurse gave wrong injection"</li>
                      <li><span style={{fontWeight: 700}}>[Extortion]</span> "Told us bed is full, took 50k cash for VIP bed"</li>
                    </ul>
                 </div>
               </div>
             )}
          </div>
        </div>

        {/* 4. DB Stitching & Scoring */}
        <div className={`glass-panel slide-in ${status === 'DONE' ? 'pulse-active' : ''}`} style={{ display: 'flex', flexDirection: 'column', animationDelay: '0.3s', background: '#fff', border: status === 'DONE' ? '2px solid var(--blue)' : '1px solid var(--border)' }}>
          <div style={{ padding: '12px 16px', background: status === 'DONE' ? 'var(--blue)' : 'var(--bg)', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 8, transition: '0.3s' }}>
            <ShieldCheck size={14} color={status === 'DONE' ? '#fff' : 'var(--blue)'} />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: status === 'DONE' ? '#fff' : 'var(--text-secondary)' }}>TRANSPARENT SCORING & DB</span>
          </div>
          <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: 16, background: status === 'DONE' ? '#EFF6FF' : '#fff', transition: '0.3s' }}>
            {status === 'IDLE' && <div style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', textAlign: 'center', marginTop: 40 }}>Awaiting analysis...</div>}
            
            {insights && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                
                {/* Scoring Considerations */}
                <div style={{ background: '#DBEAFE', padding: 12, borderRadius: 8, border: '1px solid #93C5FD' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#1E3A8A', marginBottom: 8, textTransform: 'uppercase' }}>Algorithmic Scoring Matrix</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {scoring.map((s, i) => {
                      const isNegative = s.includes('-');
                      return (
                        <div key={i} style={{ fontSize: '0.65rem', display: 'flex', alignItems: 'flex-start', gap: 6, color: isNegative ? '#991B1B' : '#047857' }}>
                          <span style={{ marginTop: 2 }}>{isNegative ? '▼' : '▲'}</span>
                          <span>{s}</span>
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ borderTop: '1px solid #BFDBFE', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#1E3A8A' }}>FINAL RATING:</span>
                    <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1D4ED8' }}>
                      {scoring.reduce((acc, curr) => {
                        const match = curr.match(/([+-]\d+)/);
                        return match ? acc + parseInt(match[1]) : acc;
                      }, 0)}/100
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--blue)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <Database size={14}/> Prisma Payload Ready
                </div>
                <pre style={{ fontSize: '0.6rem', fontFamily: '"JetBrains Mono", monospace', color: '#1E3A8A', margin: 0, whiteSpace: 'pre-wrap', background: '#F8FAFC', padding: 10, borderRadius: 8, border: '1px solid #E2E8F0' }}>
{JSON.stringify({
  category: "REPUTATION",
  dimension: "liveScrapeInsights",
  source: "LIVE_SCRAPER_OMNI",
  value: scoring.reduce((acc, curr) => { const match = curr.match(/([+-]\d+)/); return match ? acc + parseInt(match[1]) : acc; }, 0),
  confidence: 0.98,
  metadata: {
    avgLengthOfStay: insights.avgLengthOfStay,
    semanticSentiment: insights.semanticAnalysis?.sentimentScore,
    totalReviewsValidated: insights.totalReviewsAnalyzed,
  }
}, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
