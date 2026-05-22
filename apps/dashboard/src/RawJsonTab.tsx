import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

const API = import.meta.env.PROD ? '/api/trpc' : 'http://localhost:4000/trpc';

export default function RawJsonTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/getAllReviews`);
      const json = await res.json();
      if (json.result?.data?.reviews) {
        setData(json.result.data.reviews);
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  return (
    <div className="agents-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2>Raw Extracted Reviews (JSON)</h2>
          <p>This tab displays the complete raw JSON of all reviews captured by the data ingestion pipeline.</p>
        </div>
        <button className="conn-btn primary" onClick={fetchReviews} disabled={loading} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          Refresh Data
        </button>
      </div>

      {error && (
        <div style={{ padding: '16px', background: 'var(--red-bg)', color: 'var(--red)', borderRadius: '8px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      <div style={{ background: '#0F172A', borderRadius: '8px', padding: '16px', overflowX: 'auto', maxHeight: '600px', overflowY: 'auto' }}>
        {loading && !data ? (
          <div style={{ color: '#94A3B8', fontFamily: 'monospace' }}>Fetching raw data...</div>
        ) : (
          <pre style={{ margin: 0, color: '#38BDF8', fontSize: '0.8rem', fontFamily: 'monospace' }}>
            {data ? JSON.stringify(data, null, 2) : 'No reviews captured yet.'}
          </pre>
        )}
      </div>
    </div>
  );
}
