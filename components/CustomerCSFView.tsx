'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Lock, CheckCircle, Download, AlertCircle } from 'lucide-react';
import { getCSFTemplate, addCSFResponse } from '@/lib/firestore';
import { CSFTemplate, CSFResponse } from '@/types';
import DocumentPreview from './DocumentPreview';

const CRITERIA = [
  'Overall', 'Responsiveness', 'Reliability', 'Access & Facilities',
  'Communication', 'Costs', 'Integrity', 'Assurance', 'Outcome'
];

export default function CustomerCSFView() {
  const searchParams = useSearchParams();
  const csfId = searchParams.get('id');
  const customerEmail = searchParams.get('email');

  const [template, setTemplate] = useState<CSFTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: customerEmail || '',
    phone: '',
    ctype: '',
    sex: '',
    age: '',
    service: '',
    cc1: '',
    cc2: '',
    cc3: '',
    reason: '',
    suggest: ''
  });

  const [ratings, setRatings] = useState<Record<string, number>>({});

  useEffect(() => {
    if (csfId) {
      loadTemplate();
    } else {
      // Show demo CSF for testing when no ID is provided
      setTemplate({
        id: 'demo-csf',
        title: 'Demo Client Satisfaction Feedback',
        description: 'This is a demo CSF for testing purposes. In a real scenario, you would access this through an email link.',
        previewFileUrl: 'https://storage.googleapis.com/csf-documents/previews/demo.pdf',
        fullFileUrl: 'https://storage.googleapis.com/csf-documents/full/demo.pdf',
        createdBy: 'DTI Demo Admin',
        createdAt: new Date().toISOString(),
        isActive: true,
        recipients: ['demo@example.com']
      });
      setLoading(false);
    }
  }, [csfId]);

  const loadTemplate = async () => {
    try {
      if (!csfId) return;
      
      setLoading(true);
      const templateData = await getCSFTemplate(csfId);
      
      if (!templateData.isActive) {
        setError('This CSF is no longer active.');
        return;
      }
      
      setTemplate(templateData);
    } catch (err) {
      setError('Failed to load CSF. The link may be invalid or expired.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRating = (criteriaIndex: number, rating: number) => {
    setRatings(prev => ({ ...prev, [`r${criteriaIndex}`]: rating }));
  };

  const calculateProgress = () => {
    const section1 = formData.name && formData.email && formData.service && 
                    formData.ctype && formData.sex && formData.age;
    const section2 = formData.cc1 && formData.cc2 && formData.cc3;
    const section3 = Object.keys(ratings).length === 9;
    
    const completed = [section1, section2, section3].filter(Boolean).length;
    return Math.round((completed / 3) * 100);
  };

  const isFormComplete = () => {
    return calculateProgress() === 100;
  };

  const handleSubmit = async () => {
    if (!isFormComplete() || !template?.id) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response: Omit<CSFResponse, 'id'> = {
        csfId: template.id,
        ...formData,
        ctype: formData.ctype as CSFResponse['ctype'],
        sex: formData.sex as CSFResponse['sex'],
        age: formData.age as CSFResponse['age'],
        ratings,
        date: new Date().toISOString(),
        status: 'completed'
      };

      await addCSFResponse(response);
      setIsUnlocked(true);
    } catch (err) {
      setError('Failed to submit form. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async () => {
    if (!template?.fullFileUrl) {
      alert('Document not available for download.');
      return;
    }

    try {
      // Check if this is a data URL (fallback method)
      if (template.fullFileUrl.startsWith('data:')) {
        console.log('📄 Downloading from data URL');
        
        // Create download from data URL
        const link = document.createElement('a');
        link.href = template.fullFileUrl;
        link.download = `DTI_${template.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      // Check if this is a placeholder URL (from sample data)
      if (template.fullFileUrl.includes('your-project') || template.fullFileUrl.includes('storage.googleapis.com/csf-documents')) {
        alert('This is a sample CSF template with a placeholder document. To test real document downloads, create a new CSF template and upload an actual file.');
        return;
      }

      // Fetch the actual document from Firebase Storage
      const response = await fetch(template.fullFileUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      // Create download link with proper filename
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from URL or use template title
      let filename = 'DTI_Document.pdf';
      try {
        const urlPath = new URL(template.fullFileUrl).pathname;
        const extractedName = urlPath.split('/').pop();
        if (extractedName && extractedName.includes('.')) {
          filename = extractedName;
        } else {
          filename = `DTI_${template.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        }
      } catch {
        filename = `DTI_${template.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      }
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error downloading document:', error);
      
      if (error.message?.includes('CORS') || error.message?.includes('blocked')) {
        alert('Download failed due to CORS policy. Please configure Firebase Storage CORS settings. Check the browser console for more details or see scripts/setup-storage-cors.md for instructions.');
      } else if (error.message?.includes('HTTP 403')) {
        alert('Download failed: Access denied. Please check Firebase Storage permissions.');
      } else if (error.message?.includes('HTTP 404')) {
        alert('Document not found. This might be a sample template with a placeholder document.');
      } else {
        alert('Failed to download document. This might be a sample template with a placeholder document. Try creating a new CSF with a real file upload.');
      }
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
          Loading CSF...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '12px',
        padding: '20px'
      }}>
        <AlertCircle size={48} color="#d93025" />
        <div style={{ fontSize: '16px', fontWeight: 500, color: '#d93025', textAlign: 'center' }}>
          {error}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
          Please contact the administrator if you believe this is an error.
        </div>
      </div>
    );
  }

  if (!template) {
    return null;
  }

  const progress = calculateProgress();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background-tertiary)' }}>
      {/* Header */}
      <div style={{
        background: 'var(--color-background-primary)',
        borderBottom: '1px solid var(--color-border-tertiary)',
        padding: '16px 20px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              background: '#1A4B8C',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 700
            }}>
              DTI
            </div>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {template.title}
              </h1>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                Department of Trade and Industry
              </div>
            </div>
          </div>
          
          {template.description && (
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              {template.description}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <div className="csf-shell">
          {/* Document Preview */}
          <div className="csf-doc">
            <div style={{ 
              padding: '10px 14px', 
              borderBottom: '0.5px solid var(--color-border-tertiary)', 
              background: 'var(--color-background-secondary)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px' 
            }}>
              <div style={{ 
                width: '22px', 
                height: '22px', 
                background: '#C8322B', 
                borderRadius: '3px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '8px', 
                fontWeight: 700, 
                color: '#fff', 
                flexShrink: 0 
              }}>
                PDF
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                  DTI Client Satisfaction Feedback Form
                </div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                  {template.title}
                </div>
              </div>
            </div>

            {!isUnlocked ? (
              <DocumentPreview
                fileUrl={template.previewFileUrl || template.fullFileUrl || ''}
                fileName={template.title}
                isLocked={true}
              />
            ) : (
              <DocumentPreview
                fileUrl={template.fullFileUrl || ''}
                fileName={template.title}
                isLocked={false}
                onDownload={handleDownload}
              />
            )}
          </div>

          {/* Form Panel */}
          <div className="csf-form-pane">
            <div style={{ height: '3px', background: 'var(--color-background-secondary)', margin: 0 }}>
              <div style={{ 
                height: '100%', 
                background: '#1A4B8C', 
                width: `${progress}%`, 
                transition: 'width 0.3s' 
              }} />
            </div>

            <div style={{ 
              padding: '12px 16px', 
              borderBottom: '0.5px solid var(--color-border-tertiary)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between' 
            }}>
              <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                Client Satisfaction Form
              </span>
              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                {progress}% complete
              </span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              {error && (
                <div className="error" style={{ marginBottom: '16px' }}>
                  {error}
                </div>
              )}

              {/* Form sections - same as CSFForm component but simplified */}
              <CSFFormContent
                formData={formData}
                ratings={ratings}
                onInputChange={handleInputChange}
                onRating={handleRating}
              />
            </div>

            <div style={{ padding: '16px', borderTop: '0.5px solid var(--color-border-tertiary)' }}>
              <button
                onClick={handleSubmit}
                disabled={!isFormComplete() || isSubmitting || isUnlocked}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: isFormComplete() && !isSubmitting && !isUnlocked ? '#1A4B8C' : 'var(--color-background-secondary)',
                  color: isFormComplete() && !isSubmitting && !isUnlocked ? '#fff' : 'var(--color-text-tertiary)',
                  border: 'none',
                  borderRadius: 'var(--border-radius-md)',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: isFormComplete() && !isSubmitting && !isUnlocked ? 'pointer' : 'not-allowed',
                  fontFamily: 'var(--font-sans)',
                  transition: 'background 0.1s'
                }}
              >
                {isSubmitting ? 'Submitting...' : isUnlocked ? 'Form Completed' : 'Submit & Unlock Document'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simplified form content component
function CSFFormContent({ 
  formData, 
  ratings, 
  onInputChange, 
  onRating 
}: {
  formData: any;
  ratings: Record<string, number>;
  onInputChange: (field: string, value: string) => void;
  onRating: (index: number, rating: number) => void;
}) {
  return (
    <div style={{ fontSize: '12px' }}>
      {/* Part I - Information */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '11px', fontWeight: 600, color: '#1A4B8C', textTransform: 'uppercase', marginBottom: '12px' }}>
          Part I · Information
        </h3>
        
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontWeight: 500, marginBottom: '4px' }}>Full name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => onInputChange('name', e.target.value)}
            placeholder="Family, First M.I."
            style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border-secondary)', borderRadius: '4px', fontSize: '12px' }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontWeight: 500, marginBottom: '4px' }}>Email *</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => onInputChange('email', e.target.value)}
            placeholder="email@example.com"
            style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border-secondary)', borderRadius: '4px', fontSize: '12px' }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontWeight: 500, marginBottom: '4px' }}>Service availed *</label>
          <input
            type="text"
            value={formData.service}
            onChange={(e) => onInputChange('service', e.target.value)}
            placeholder="e.g. Business name registration"
            style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border-secondary)', borderRadius: '4px', fontSize: '12px' }}
          />
        </div>

        {/* Client type, sex, age - simplified pill groups */}
        <PillGroup
          label="Client type *"
          options={['Citizen', 'Business', 'Government']}
          selected={formData.ctype}
          onChange={(value) => onInputChange('ctype', value)}
        />

        <PillGroup
          label="Sex *"
          options={['Male', 'Female']}
          selected={formData.sex}
          onChange={(value) => onInputChange('sex', value)}
        />

        <PillGroup
          label="Age bracket *"
          options={['≤19', '20-34', '35-49', '50-64', '65+']}
          values={['19 or lower', '20-34', '35-49', '50-64', '65+']}
          selected={formData.age}
          onChange={(value) => onInputChange('age', value)}
        />
      </div>

      {/* Part II - Citizen's Charter */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '11px', fontWeight: 600, color: '#1A4B8C', textTransform: 'uppercase', marginBottom: '12px' }}>
          Part II · Citizen's Charter
        </h3>
        
        <PillGroup
          label="CC1 – Awareness *"
          options={['Saw & know CC', 'Know, didn\'t see', 'Saw only here', 'Don\'t know']}
          values={['1', '2', '3', '4']}
          selected={formData.cc1}
          onChange={(value) => onInputChange('cc1', value)}
        />

        <PillGroup
          label="CC2 – Visibility *"
          options={['Easy to see', 'Somewhat', 'Difficult', 'Not visible', 'N/A']}
          values={['1', '2', '3', '4', 'N/A']}
          selected={formData.cc2}
          onChange={(value) => onInputChange('cc2', value)}
        />

        <PillGroup
          label="CC3 – Helpfulness *"
          options={['Helped a lot', 'Somewhat', 'Did not help', 'N/A']}
          values={['1', '2', '3', 'N/A']}
          selected={formData.cc3}
          onChange={(value) => onInputChange('cc3', value)}
        />
      </div>

      {/* Part III - Service Ratings */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '11px', fontWeight: 600, color: '#1A4B8C', textTransform: 'uppercase', marginBottom: '8px' }}>
          Part III · Service Ratings
        </h3>
        <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
          1=Strongly Agree · 5=Strongly Disagree
        </div>
        
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '4px 2px', borderBottom: '1px solid var(--color-border-tertiary)' }}>Criteria</th>
              {[1, 2, 3, 4, 5].map(num => (
                <th key={num} style={{ textAlign: 'center', padding: '4px 2px', borderBottom: '1px solid var(--color-border-tertiary)' }}>{num}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CRITERIA.map((criterion, index) => (
              <tr key={index}>
                <td style={{ padding: '6px 2px', borderBottom: '1px solid var(--color-border-tertiary)', fontWeight: 500 }}>
                  {criterion}
                </td>
                {[1, 2, 3, 4, 5].map(rating => (
                  <td key={rating} style={{ textAlign: 'center', padding: '6px 2px', borderBottom: '1px solid var(--color-border-tertiary)' }}>
                    <div
                      onClick={() => onRating(index, rating)}
                      style={{
                        width: '14px',
                        height: '14px',
                        border: `2px solid ${ratings[`r${index}`] === rating ? '#1A4B8C' : 'var(--color-border-secondary)'}`,
                        borderRadius: '50%',
                        margin: 'auto',
                        cursor: 'pointer',
                        background: ratings[`r${index}`] === rating ? '#1A4B8C' : 'transparent',
                        transition: 'all 0.1s'
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Part IV - Comments */}
      <div>
        <h3 style={{ fontSize: '11px', fontWeight: 600, color: '#1A4B8C', textTransform: 'uppercase', marginBottom: '12px' }}>
          Part IV · Comments
        </h3>
        
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontWeight: 500, marginBottom: '4px' }}>Suggestions to improve service</label>
          <textarea
            value={formData.suggest}
            onChange={(e) => onInputChange('suggest', e.target.value)}
            placeholder="How can we serve you better?"
            rows={3}
            style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border-secondary)', borderRadius: '4px', fontSize: '12px', resize: 'vertical' }}
          />
        </div>
      </div>
    </div>
  );
}

// Simplified pill group component
function PillGroup({ 
  label, 
  options, 
  values, 
  selected, 
  onChange 
}: { 
  label: string;
  options: string[]; 
  values?: string[]; 
  selected: string; 
  onChange: (value: string) => void; 
}) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <label style={{ display: 'block', fontWeight: 500, marginBottom: '6px' }}>{label}</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {options.map((option, index) => {
          const value = values ? values[index] : option;
          const isSelected = selected === value;
          
          return (
            <button
              key={index}
              type="button"
              onClick={() => onChange(value)}
              style={{
                padding: '4px 8px',
                border: `1px solid ${isSelected ? '#1A4B8C' : 'var(--color-border-secondary)'}`,
                borderRadius: '12px',
                background: isSelected ? '#E6EEF7' : 'transparent',
                color: isSelected ? '#1A4B8C' : 'var(--color-text-secondary)',
                fontSize: '10px',
                fontWeight: isSelected ? 500 : 'normal',
                cursor: 'pointer',
                transition: 'all 0.1s'
              }}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}