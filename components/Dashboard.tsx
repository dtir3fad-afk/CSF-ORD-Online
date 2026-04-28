'use client';

import { useEffect, useState } from 'react';
import { getDashboardMetrics, getCSFResponses } from '@/lib/firestore';
import { CSFResponse, DashboardMetrics } from '@/types';

const CRITERIA = [
  'Overall', 'Responsiveness', 'Reliability', 'Access & Facilities',
  'Communication', 'Costs', 'Integrity', 'Assurance', 'Outcome'
];

export default function Dashboard() {
  const [responses, setResponses] = useState<CSFResponse[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [metricsData, responsesData] = await Promise.all([
        getDashboardMetrics(),
        getCSFResponses(undefined, 5) // Get recent 5 responses
      ]);
      setMetrics(metricsData);
      setResponses(responsesData);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = () => {
    if (!responses.length || !metrics) {
      return {
        total: metrics?.totalCSFs || 0,
        totalResponses: metrics?.totalResponses || 0,
        avgRating: metrics?.avgRating || 0,
        satisfactionRate: metrics?.satisfactionRate || 0,
        pendingResponses: metrics?.pendingResponses || 0
      };
    }

    return {
      total: metrics.totalCSFs,
      totalResponses: metrics.totalResponses,
      avgRating: metrics.avgRating,
      satisfactionRate: metrics.satisfactionRate,
      pendingResponses: metrics.pendingResponses
    };
  };

  const getCriteriaAverages = () => {
    if (!responses.length) return [];
    
    return CRITERIA.map((criteria, index) => {
      const ratingKey = `r${index}`;
      const values = responses
        .map(r => r.ratings && r.ratings[ratingKey] ? r.ratings[ratingKey] : null)
        .filter(v => v !== null && v !== undefined && typeof v === 'number');
      
      if (!values.length) return { criteria, average: 0, score: 0 };
      
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      return {
        criteria,
        average: avg,
        score: Math.max(0, 6 - avg) // Convert to 1-5 scale, ensure non-negative
      };
    });
  };

  const getRecentResponsesData = () => {
    return responses.slice(0, 5).map(r => {
      const ratings = r.ratings || {};
      const overallRating = ratings['r0'] || 0;
      const ratingValues = Object.values(ratings).filter(v => typeof v === 'number' && v > 0);
      const avgRating = ratingValues.length > 0 ? 
        ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length : 0;
      
      return {
        ...r,
        overallRating,
        avgRating,
        scoreClass: avgRating <= 2 ? 'score-hi' : avgRating <= 3.5 ? 'score-mid' : 'score-lo'
      };
    });
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  const dashboardMetrics = calculateMetrics();
  const criteriaData = getCriteriaAverages();
  const recentData = getRecentResponsesData();

  return (
    <div>
      <div className="metric-grid">
        <div className="metric-card">
          <div className="metric-label">Active CSFs</div>
          <div className="metric-value">{dashboardMetrics.total}</div>
          <div className="metric-sub">
            {dashboardMetrics.total === 1 ? '1 template' : 'Templates created'}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Total responses</div>
          <div className="metric-value">{dashboardMetrics.totalResponses}</div>
          <div className="metric-sub">All completed forms</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Avg. rating</div>
          <div className="metric-value">
            {dashboardMetrics.totalResponses > 0 ? `${dashboardMetrics.avgRating.toFixed(2)}/5` : '–'}
          </div>
          <div className="metric-sub">Overall satisfaction</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Satisfaction rate</div>
          <div className="metric-value">
            {dashboardMetrics.totalResponses > 0 ? `${dashboardMetrics.satisfactionRate}%` : '–'}
          </div>
          <div className="metric-sub">Agree + Strongly Agree</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div className="card">
          <div className="card-title">Ratings by criteria</div>
          {criteriaData.length > 0 ? (
            <div>
              {criteriaData.map((item, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '7px' }}>
                  <div style={{ 
                    fontSize: '11px', 
                    color: 'var(--color-text-secondary)', 
                    width: '90px', 
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {item.criteria}
                  </div>
                  <div style={{ 
                    flex: 1, 
                    height: '6px', 
                    background: 'var(--color-background-secondary)', 
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      height: '100%', 
                      background: '#1A4B8C', 
                      borderRadius: '3px',
                      width: `${Math.round(((5 - item.average) / 4) * 100)}%`,
                      transition: 'width 0.5s'
                    }} />
                  </div>
                  <div style={{ 
                    fontSize: '11px', 
                    fontWeight: 500, 
                    color: 'var(--color-text-primary)',
                    width: '28px',
                    textAlign: 'right',
                    flexShrink: 0
                  }}>
                    {item.score.toFixed(1)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textAlign: 'center', padding: '20px' }}>
              No data yet
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title">Client type breakdown</div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textAlign: 'center', padding: '20px' }}>
            Chart visualization coming soon
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Recent responses</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '6px 8px', fontSize: '10px', fontWeight: 500, color: 'var(--color-text-secondary)', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>Name</th>
              <th style={{ textAlign: 'left', padding: '6px 8px', fontSize: '10px', fontWeight: 500, color: 'var(--color-text-secondary)', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>Type</th>
              <th style={{ textAlign: 'left', padding: '6px 8px', fontSize: '10px', fontWeight: 500, color: 'var(--color-text-secondary)', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>Overall</th>
              <th style={{ textAlign: 'left', padding: '6px 8px', fontSize: '10px', fontWeight: 500, color: 'var(--color-text-secondary)', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>Date</th>
              <th style={{ textAlign: 'left', padding: '6px 8px', fontSize: '10px', fontWeight: 500, color: 'var(--color-text-secondary)', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentData.length > 0 ? recentData.map((response, index) => (
              <tr key={index}>
                <td style={{ padding: '7px 8px', borderBottom: '0.5px solid var(--color-border-tertiary)', color: 'var(--color-text-primary)' }}>
                  {response.name}
                </td>
                <td style={{ padding: '7px 8px', borderBottom: '0.5px solid var(--color-border-tertiary)', color: 'var(--color-text-primary)' }}>
                  <span style={{ 
                    display: 'inline-block', 
                    padding: '2px 8px', 
                    borderRadius: '10px', 
                    fontSize: '10px', 
                    fontWeight: 500,
                    background: '#E6F1FB',
                    color: '#0C447C'
                  }}>
                    {response.ctype}
                  </span>
                </td>
                <td style={{ padding: '7px 8px', borderBottom: '0.5px solid var(--color-border-tertiary)', color: 'var(--color-text-primary)' }}>
                  <span style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '3px', 
                    fontSize: '11px', 
                    fontWeight: 500, 
                    padding: '2px 7px', 
                    borderRadius: '10px',
                    background: response.scoreClass === 'score-hi' ? '#EAF3DE' : 
                               response.scoreClass === 'score-mid' ? '#FAEEDA' : '#FCEBEB',
                    color: response.scoreClass === 'score-hi' ? '#27500A' : 
                           response.scoreClass === 'score-mid' ? '#633806' : '#791F1F'
                  }}>
                    {response.overallRating}
                  </span>
                </td>
                <td style={{ padding: '7px 8px', borderBottom: '0.5px solid var(--color-border-tertiary)', color: 'var(--color-text-primary)' }}>
                  {new Date(response.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                </td>
                <td style={{ padding: '7px 8px', borderBottom: '0.5px solid var(--color-border-tertiary)', color: 'var(--color-text-primary)' }}>
                  <span style={{ 
                    display: 'inline-block', 
                    padding: '2px 8px', 
                    borderRadius: '10px', 
                    fontSize: '10px', 
                    fontWeight: 500,
                    background: '#EAF3DE',
                    color: '#27500A'
                  }}>
                    Submitted
                  </span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: '16px', fontSize: '11px' }}>
                  No responses yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}