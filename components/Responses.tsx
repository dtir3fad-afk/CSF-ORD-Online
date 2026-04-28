'use client';

import { useEffect, useState } from 'react';
import { getCSFResponses } from '@/lib/firestore';
import { CSFResponse } from '@/types';

export default function Responses() {
  const [responses, setResponses] = useState<CSFResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState('');
  const [filterScore, setFilterScore] = useState('');

  useEffect(() => {
    loadResponses();
  }, []);

  const loadResponses = async () => {
    try {
      setLoading(true);
      const data = await getCSFResponses();
      setResponses(data);
    } catch (err) {
      setError('Failed to load responses');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateAvgRating = (response: CSFResponse) => {
    if (!response.ratings || typeof response.ratings !== 'object') return 0;
    const values = Object.values(response.ratings).filter(v => typeof v === 'number' && v > 0);
    return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  };

  const getFilteredResponses = () => {
    return responses.filter(response => {
      if (filterType && response.ctype !== filterType) return false;
      
      const avgRating = calculateAvgRating(response);
      if (filterScore === 'high' && avgRating < 4) return false;
      if (filterScore === 'mid' && (avgRating < 2.5 || avgRating >= 4)) return false;
      if (filterScore === 'low' && avgRating >= 2.5) return false;
      
      return true;
    });
  };

  const getScoreClass = (avgRating: number) => {
    if (avgRating <= 2) return 'score-hi';
    if (avgRating <= 3.5) return 'score-mid';
    return 'score-lo';
  };

  const getScoreColors = (scoreClass: string) => {
    switch (scoreClass) {
      case 'score-hi':
        return { background: '#EAF3DE', color: '#27500A' };
      case 'score-mid':
        return { background: '#FAEEDA', color: '#633806' };
      case 'score-lo':
        return { background: '#FCEBEB', color: '#791F1F' };
      default:
        return { background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)' };
    }
  };

  if (loading) {
    return <div className="loading">Loading responses...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  const filteredResponses = getFilteredResponses();

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        marginBottom: '12px', 
        flexWrap: 'wrap' 
      }}>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{
            padding: '5px 9px',
            fontSize: '11px',
            border: '0.5px solid var(--color-border-secondary)',
            borderRadius: 'var(--border-radius-md)',
            background: 'var(--color-background-primary)',
            color: 'var(--color-text-primary)',
            fontFamily: 'var(--font-sans)'
          }}
        >
          <option value="">All client types</option>
          <option value="Citizen">Citizen</option>
          <option value="Business">Business</option>
          <option value="Government">Government</option>
        </select>

        <select
          value={filterScore}
          onChange={(e) => setFilterScore(e.target.value)}
          style={{
            padding: '5px 9px',
            fontSize: '11px',
            border: '0.5px solid var(--color-border-secondary)',
            borderRadius: 'var(--border-radius-md)',
            background: 'var(--color-background-primary)',
            color: 'var(--color-text-primary)',
            fontFamily: 'var(--font-sans)'
          }}
        >
          <option value="">All ratings</option>
          <option value="high">High (≥4.0)</option>
          <option value="mid">Mid (2.5–3.9)</option>
          <option value="low">Low (&lt;2.5)</option>
        </select>

        <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
          {filteredResponses.length} response{filteredResponses.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="card">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '6px 8px', fontSize: '10px', fontWeight: 500, color: 'var(--color-text-secondary)', borderBottom: '0.5px solid var(--color-border-tertiary)', whiteSpace: 'nowrap' }}>#</th>
              <th style={{ textAlign: 'left', padding: '6px 8px', fontSize: '10px', fontWeight: 500, color: 'var(--color-text-secondary)', borderBottom: '0.5px solid var(--color-border-tertiary)', whiteSpace: 'nowrap' }}>Name</th>
              <th style={{ textAlign: 'left', padding: '6px 8px', fontSize: '10px', fontWeight: 500, color: 'var(--color-text-secondary)', borderBottom: '0.5px solid var(--color-border-tertiary)', whiteSpace: 'nowrap' }}>Type</th>
              <th style={{ textAlign: 'left', padding: '6px 8px', fontSize: '10px', fontWeight: 500, color: 'var(--color-text-secondary)', borderBottom: '0.5px solid var(--color-border-tertiary)', whiteSpace: 'nowrap' }}>Service</th>
              <th style={{ textAlign: 'left', padding: '6px 8px', fontSize: '10px', fontWeight: 500, color: 'var(--color-text-secondary)', borderBottom: '0.5px solid var(--color-border-tertiary)', whiteSpace: 'nowrap' }}>Overall</th>
              <th style={{ textAlign: 'left', padding: '6px 8px', fontSize: '10px', fontWeight: 500, color: 'var(--color-text-secondary)', borderBottom: '0.5px solid var(--color-border-tertiary)', whiteSpace: 'nowrap' }}>Avg score</th>
              <th style={{ textAlign: 'left', padding: '6px 8px', fontSize: '10px', fontWeight: 500, color: 'var(--color-text-secondary)', borderBottom: '0.5px solid var(--color-border-tertiary)', whiteSpace: 'nowrap' }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredResponses.length > 0 ? filteredResponses.map((response, index) => {
              const avgRating = calculateAvgRating(response);
              const overallRating = (response.ratings && response.ratings['r0']) ? response.ratings['r0'] : 0;
              const scoreClass = getScoreClass(avgRating);
              const scoreColors = getScoreColors(scoreClass);
              const originalIndex = responses.indexOf(response) + 1;

              return (
                <tr key={response.id || index}>
                  <td style={{ 
                    padding: '7px 8px', 
                    borderBottom: '0.5px solid var(--color-border-tertiary)', 
                    color: 'var(--color-text-secondary)', 
                    verticalAlign: 'top' 
                  }}>
                    {originalIndex}
                  </td>
                  <td style={{ 
                    padding: '7px 8px', 
                    borderBottom: '0.5px solid var(--color-border-tertiary)', 
                    color: 'var(--color-text-primary)', 
                    verticalAlign: 'top' 
                  }}>
                    <div style={{ fontWeight: 500 }}>{response.name}</div>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                      {response.email}
                    </div>
                  </td>
                  <td style={{ 
                    padding: '7px 8px', 
                    borderBottom: '0.5px solid var(--color-border-tertiary)', 
                    color: 'var(--color-text-primary)', 
                    verticalAlign: 'top' 
                  }}>
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
                  <td style={{ 
                    padding: '7px 8px', 
                    borderBottom: '0.5px solid var(--color-border-tertiary)', 
                    color: 'var(--color-text-primary)', 
                    verticalAlign: 'top',
                    maxWidth: '100px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }} title={response.service}>
                    {response.service}
                  </td>
                  <td style={{ 
                    padding: '7px 8px', 
                    borderBottom: '0.5px solid var(--color-border-tertiary)', 
                    color: 'var(--color-text-primary)', 
                    verticalAlign: 'top' 
                  }}>
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '3px', 
                      fontSize: '11px', 
                      fontWeight: 500, 
                      padding: '2px 7px', 
                      borderRadius: '10px',
                      background: scoreColors.background,
                      color: scoreColors.color
                    }}>
                      {overallRating}/5
                    </span>
                  </td>
                  <td style={{ 
                    padding: '7px 8px', 
                    borderBottom: '0.5px solid var(--color-border-tertiary)', 
                    color: 'var(--color-text-primary)', 
                    verticalAlign: 'top' 
                  }}>
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '3px', 
                      fontSize: '11px', 
                      fontWeight: 500, 
                      padding: '2px 7px', 
                      borderRadius: '10px',
                      background: scoreColors.background,
                      color: scoreColors.color
                    }}>
                      {avgRating.toFixed(2)}
                    </span>
                  </td>
                  <td style={{ 
                    padding: '7px 8px', 
                    borderBottom: '0.5px solid var(--color-border-tertiary)', 
                    color: 'var(--color-text-primary)', 
                    verticalAlign: 'top' 
                  }}>
                    {new Date(response.date).toLocaleDateString('en-PH', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={7} style={{ 
                  textAlign: 'center', 
                  padding: '40px 20px', 
                  color: 'var(--color-text-secondary)', 
                  fontSize: '12px' 
                }}>
                  {responses.length === 0 
                    ? 'No responses yet. Submit a CSF first.' 
                    : 'No responses match the filter'
                  }
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}