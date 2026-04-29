'use client';

import { useEffect, useState } from 'react';
import { Eye, Trash2 } from 'lucide-react';
import { getCSFResponses, deleteCSFResponse } from '@/lib/firestore';
import { CSFResponse } from '@/types';

export default function Responses() {
  const [responses, setResponses] = useState<CSFResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState('');
  const [filterScore, setFilterScore] = useState('');
  const [selectedResponse, setSelectedResponse] = useState<CSFResponse | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

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

  const handleViewResponse = (response: CSFResponse) => {
    setSelectedResponse(response);
    setShowViewModal(true);
  };

  const handleDeleteResponse = async (responseId: string, responseName: string) => {
    const confirmed = confirm(`Are you sure you want to delete the response from "${responseName}"? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      await deleteCSFResponse(responseId);
      await loadResponses(); // Reload the list
      alert('Response deleted successfully.');
    } catch (error) {
      console.error('Error deleting response:', error);
      alert('Failed to delete response. Please try again.');
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
    if (avgRating >= 4) return 'score-hi';  // 4-5 = Good (Agree to Strongly Agree)
    if (avgRating >= 3) return 'score-mid'; // 3-3.9 = Neutral (Neither)
    return 'score-lo';                      // 1-2.9 = Poor (Disagree to Strongly Disagree)
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
              <th style={{ textAlign: 'center', padding: '6px 8px', fontSize: '10px', fontWeight: 500, color: 'var(--color-text-secondary)', borderBottom: '0.5px solid var(--color-border-tertiary)', whiteSpace: 'nowrap' }}>Actions</th>
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
                  <td style={{ 
                    padding: '7px 8px', 
                    borderBottom: '0.5px solid var(--color-border-tertiary)', 
                    textAlign: 'center',
                    verticalAlign: 'top' 
                  }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                      <button
                        onClick={() => handleViewResponse(response)}
                        style={{
                          padding: '4px 6px',
                          border: '1px solid var(--color-border-secondary)',
                          borderRadius: 'var(--border-radius-sm)',
                          background: 'var(--color-background-primary)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          fontSize: '10px'
                        }}
                        title="View details"
                      >
                        <Eye size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteResponse(response.id!, response.name)}
                        style={{
                          padding: '4px 6px',
                          border: '1px solid #C8322B',
                          borderRadius: 'var(--border-radius-sm)',
                          background: '#FCEBEB',
                          color: '#C8322B',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          fontSize: '10px'
                        }}
                        title="Delete response"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={8} style={{ 
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

      {/* View Response Modal */}
      {showViewModal && selectedResponse && (
        <ResponseViewModal
          response={selectedResponse}
          onClose={() => {
            setShowViewModal(false);
            setSelectedResponse(null);
          }}
        />
      )}
    </div>
  );
}

// Response View Modal Component
function ResponseViewModal({ 
  response, 
  onClose 
}: { 
  response: CSFResponse;
  onClose: () => void;
}) {
  const calculateAvgRating = (response: CSFResponse) => {
    if (!response.ratings || typeof response.ratings !== 'object') return 0;
    const values = Object.values(response.ratings).filter(v => typeof v === 'number' && v > 0);
    return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  };

  const ratingLabels: { [key: string]: string } = {
    'r0': 'Overall Satisfaction',
    'r1': 'Responsiveness', 
    'r2': 'Reliability',
    'r3': 'Access and Facilities',
    'r4': 'Communication',
    'r5': 'Costs',
    'r6': 'Integrity',
    'r7': 'Assurance',
    'r8': 'Outcome'
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--color-background-primary)',
        borderRadius: 'var(--border-radius-lg)',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '20px 24px',
          borderBottom: '1px solid var(--color-border-tertiary)'
        }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Response Details</h2>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Submitted on {new Date(response.date).toLocaleDateString('en-PH', { 
                weekday: 'long',
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
          <button 
            onClick={onClose} 
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '24px', 
              cursor: 'pointer',
              color: 'var(--color-text-secondary)'
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Client Information */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Client Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Name</div>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>{response.name}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Email</div>
                <div style={{ fontSize: '13px' }}>{response.email}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Client Type</div>
                <span style={{ 
                  display: 'inline-block', 
                  padding: '2px 8px', 
                  borderRadius: '10px', 
                  fontSize: '11px', 
                  fontWeight: 500,
                  background: '#E6F1FB',
                  color: '#0C447C'
                }}>
                  {response.ctype}
                </span>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Service Availed</div>
                <div style={{ fontSize: '13px' }}>{response.service}</div>
              </div>
            </div>
          </div>

          {/* Ratings */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
              Ratings (Average: {calculateAvgRating(response).toFixed(2)}/5)
            </h3>
            <div style={{ display: 'grid', gap: '8px' }}>
              {response.ratings && Object.entries(response.ratings).map(([key, value]) => (
                <div key={key} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '8px 12px',
                  background: 'var(--color-background-secondary)',
                  borderRadius: 'var(--border-radius-md)'
                }}>
                  <span style={{ fontSize: '12px' }}>{ratingLabels[key] || key}</span>
                  <span style={{ 
                    fontSize: '12px', 
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '10px',
                    background: value >= 4 ? '#EAF3DE' : value >= 3 ? '#FAEEDA' : '#FCEBEB',
                    color: value >= 4 ? '#27500A' : value >= 3 ? '#633806' : '#791F1F'
                  }}>
                    {value}/5
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Comments */}
          {response.comments && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Comments</h3>
              <div style={{ 
                padding: '12px', 
                background: 'var(--color-background-secondary)', 
                borderRadius: 'var(--border-radius-md)',
                fontSize: '12px',
                lineHeight: '1.5'
              }}>
                {response.comments}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {response.suggestions && (
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Suggestions</h3>
              <div style={{ 
                padding: '12px', 
                background: 'var(--color-background-secondary)', 
                borderRadius: 'var(--border-radius-md)',
                fontSize: '12px',
                lineHeight: '1.5'
              }}>
                {response.suggestions}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}