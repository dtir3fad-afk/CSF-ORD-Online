'use client';

import { useEffect, useState } from 'react';
import { getCSFResponses } from '@/lib/firestore';
import { CSFResponse } from '@/types';

const CRITERIA = [
  'Overall', 'Responsiveness', 'Reliability', 'Access & Facilities',
  'Communication', 'Costs', 'Integrity', 'Assurance', 'Outcome'
];

export default function Analytics() {
  const [responses, setResponses] = useState<CSFResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getCSFResponses();
      setResponses(data);
    } catch (err) {
      setError('Failed to load analytics data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = () => {
    if (!responses.length) {
      return {
        avgSatisfaction: 0,
        mostCommonClient: { type: '–', percentage: 0 },
        worstCriteria: '–',
        criteriaAverages: []
      };
    }

    // Calculate average satisfaction score
    const avgRatings = responses.map(r => {
      if (!r.ratings || typeof r.ratings !== 'object') return 0;
      const vals = Object.values(r.ratings).filter(v => typeof v === 'number' && v > 0);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    }).filter(rating => rating > 0);
    
    const avgSatisfaction = avgRatings.length > 0 ? 
      avgRatings.reduce((a, b) => a + b, 0) / avgRatings.length : 0;

    // Calculate most common client type
    const typeCounts: Record<string, number> = {};
    responses.forEach(r => {
      typeCounts[r.ctype] = (typeCounts[r.ctype] || 0) + 1;
    });
    const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];
    const mostCommonClient = topType ? {
      type: topType[0],
      percentage: Math.round((topType[1] / responses.length) * 100)
    } : { type: '–', percentage: 0 };

    // Calculate criteria averages and find worst
    const criteriaAverages = CRITERIA.map((criteria, index) => {
      const ratingKey = `r${index}`;
      const values = responses
        .map(r => r.ratings && r.ratings[ratingKey] ? r.ratings[ratingKey] : null)
        .filter(v => v !== null && v !== undefined && typeof v === 'number');
      
      if (!values.length) return { criteria, average: 0 };
      
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      return { criteria, average: avg };
    });

    const worstCriteria = criteriaAverages.length > 0 ? 
      criteriaAverages.reduce((worst, current) => 
        current.average > worst.average ? current : worst
      ).criteria : '–';

    return {
      avgSatisfaction,
      mostCommonClient,
      worstCriteria,
      criteriaAverages
    };
  };

  const getScoreDistribution = () => {
    if (!responses.length) return [0, 0, 0, 0, 0];

    const buckets = [0, 0, 0, 0, 0];
    responses.forEach(r => {
      if (!r.ratings || typeof r.ratings !== 'object') return;
      const vals = Object.values(r.ratings).filter(v => typeof v === 'number' && v > 0);
      if (vals.length === 0) return;
      
      const avgRating = vals.reduce((a, b) => a + b, 0) / vals.length;
      const bucketIndex = Math.min(4, Math.floor(avgRating) - 1);
      if (bucketIndex >= 0) buckets[bucketIndex]++;
    });
    return buckets;
  };

  const getAgeDistribution = () => {
    const brackets = ['19 or lower', '20-34', '35-49', '50-64', '65+'];
    return brackets.map(bracket => 
      responses.filter(r => r.age === bracket).length
    );
  };

  const getHeatmapColor = (average: number) => {
    if (average === 0) return { bg: '#EAF3DE', color: '#27500A' };
    if (average >= 2 && average < 3) return { bg: '#FAEEDA', color: '#633806' };
    if (average >= 3 && average < 4) return { bg: '#FAECE7', color: '#712B13' };
    if (average >= 4) return { bg: '#FCEBEB', color: '#791F1F' };
    return { bg: '#EAF3DE', color: '#27500A' };
  };

  if (loading) {
    return <div className="loading">Loading analytics...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  const analytics = calculateAnalytics();
  const scoreDistribution = getScoreDistribution();
  const ageDistribution = getAgeDistribution();

  return (
    <div>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', 
        gap: '10px', 
        marginBottom: '16px' 
      }}>
        <div className="metric-card">
          <div className="metric-label">Avg. satisfaction score</div>
          <div className="metric-value">
            {responses.length > 0 ? analytics.avgSatisfaction.toFixed(2) : '–'}
          </div>
          <div className="metric-sub">out of 1.00 (1=best)</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Most common client</div>
          <div className="metric-value" style={{ fontSize: '16px' }}>
            {analytics.mostCommonClient.type}
          </div>
          <div className="metric-sub">
            {responses.length > 0 ? `${analytics.mostCommonClient.percentage}% of responses` : '–'}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Needs improvement</div>
          <div className="metric-value" style={{ fontSize: '16px' }}>
            {analytics.worstCriteria}
          </div>
          <div className="metric-sub">lowest-rated criteria</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div className="card">
          <div className="card-title">Score distribution</div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textAlign: 'center', padding: '20px' }}>
            Chart visualization coming soon
          </div>
          <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
            Distribution: {scoreDistribution.map((count, i) => `${i + 1}: ${count}`).join(', ')}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Age breakdown</div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textAlign: 'center', padding: '20px' }}>
            Chart visualization coming soon
          </div>
          <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
            Ages: {['≤19', '20-34', '35-49', '50-64', '65+'].map((age, i) => `${age}: ${ageDistribution[i]}`).join(', ')}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Criteria performance heatmap</div>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', 
          gap: '6px', 
          marginTop: '4px' 
        }}>
          {analytics.criteriaAverages.slice(0, 5).map((item, index) => {
            const colors = getHeatmapColor(item.average);
            return (
              <div
                key={index}
                style={{
                  background: colors.bg,
                  borderRadius: 'var(--border-radius-md)',
                  padding: '10px 8px',
                  textAlign: 'center'
                }}
              >
                <div style={{ 
                  fontSize: '18px', 
                  fontWeight: 500, 
                  color: colors.color 
                }}>
                  {item.average > 0 ? item.average.toFixed(1) : '–'}
                </div>
                <div style={{ 
                  fontSize: '9px', 
                  fontWeight: 500, 
                  color: colors.color, 
                  marginTop: '3px', 
                  lineHeight: 1.3 
                }}>
                  {item.criteria}
                </div>
              </div>
            );
          })}
        </div>
        
        {analytics.criteriaAverages.length > 5 && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', 
            gap: '6px', 
            marginTop: '6px' 
          }}>
            {analytics.criteriaAverages.slice(5).map((item, index) => {
              const colors = getHeatmapColor(item.average);
              return (
                <div
                  key={index + 5}
                  style={{
                    background: colors.bg,
                    borderRadius: 'var(--border-radius-md)',
                    padding: '10px 8px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ 
                    fontSize: '18px', 
                    fontWeight: 500, 
                    color: colors.color 
                  }}>
                    {item.average > 0 ? item.average.toFixed(1) : '–'}
                  </div>
                  <div style={{ 
                    fontSize: '9px', 
                    fontWeight: 500, 
                    color: colors.color, 
                    marginTop: '3px', 
                    lineHeight: 1.3 
                  }}>
                    {item.criteria}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          marginTop: '10px', 
          fontSize: '10px', 
          color: 'var(--color-text-secondary)' 
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ 
              width: '10px', 
              height: '10px', 
              background: '#EAF3DE', 
              borderRadius: '2px', 
              display: 'inline-block' 
            }} />
            Excellent (1.0–1.9)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ 
              width: '10px', 
              height: '10px', 
              background: '#FAEEDA', 
              borderRadius: '2px', 
              display: 'inline-block' 
            }} />
            Good (2.0–2.9)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ 
              width: '10px', 
              height: '10px', 
              background: '#FAECE7', 
              borderRadius: '2px', 
              display: 'inline-block' 
            }} />
            Fair (3.0–3.9)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ 
              width: '10px', 
              height: '10px', 
              background: '#FCEBEB', 
              borderRadius: '2px', 
              display: 'inline-block' 
            }} />
            Poor (4.0–5.0)
          </span>
        </div>
      </div>
    </div>
  );
}