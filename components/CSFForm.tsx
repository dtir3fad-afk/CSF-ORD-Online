'use client';

import { useState } from 'react';
import { Lock, CheckCircle, Download } from 'lucide-react';
import { addCSFResponse } from '@/lib/firestore';
import { CSFResponse } from '@/types';

const CRITERIA = [
  'Overall', 'Responsiveness', 'Reliability', 'Access & Facilities',
  'Communication', 'Costs', 'Integrity', 'Assurance', 'Outcome'
];

export default function CSFForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!isFormComplete()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response: Omit<CSFResponse, 'id'> = {
        ...formData,
        csfId: 'demo-csf-id', // In real app, this would come from URL params
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

  const progress = calculateProgress();

  return (
    <div className="csf-shell">
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
              FM-CSF-SRV · Ver. 1
            </div>
          </div>
        </div>

        {!isUnlocked ? (
          <div>
            <div style={{ padding: '14px', background: '#fff', fontFamily: 'serif' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                borderBottom: '2px solid #1A4B8C', 
                paddingBottom: '7px', 
                marginBottom: '8px' 
              }}>
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  background: '#C8322B', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: '#fff', 
                  fontSize: '8px', 
                  fontWeight: 700, 
                  textAlign: 'center', 
                  flexShrink: 0 
                }}>
                  DTI
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#1A4B8C' }}>
                    DEPARTMENT OF TRADE AND INDUSTRY
                  </div>
                  <div style={{ fontSize: '8px', color: '#555' }}>
                    DTI-&lt;Bureau/Office&gt; | DTI-&lt;#&gt; Regional Office | Provincial Office
                  </div>
                </div>
              </div>
              <div style={{ 
                background: '#FFD700', 
                textAlign: 'center', 
                padding: '3px', 
                fontSize: '9px', 
                fontWeight: 700, 
                color: '#1A4B8C', 
                borderRadius: '2px', 
                marginBottom: '6px' 
              }}>
                CLIENT SATISFACTION FEEDBACK FORM
              </div>
              <div style={{ 
                fontSize: '7.5px', 
                color: '#333', 
                lineHeight: 1.5, 
                background: '#f9f9f9', 
                border: '0.5px solid #ddd', 
                padding: '5px 6px', 
                borderRadius: '2px', 
                marginBottom: '6px' 
              }}>
                <strong>CONSENT:</strong> I agree to let the DTI collect and use my name, contact details, and feedback for purposes of monitoring, measuring, and analyzing responses to improve its services.
              </div>
            </div>

            <div style={{ position: 'relative', marginTop: '-30px' }}>
              <div style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0, 
                height: '60px', 
                background: 'linear-gradient(to bottom, transparent, white)', 
                pointerEvents: 'none', 
                zIndex: 2 
              }} />
              <div style={{ 
                padding: '0 14px 14px', 
                filter: 'blur(3px)', 
                userSelect: 'none', 
                pointerEvents: 'none', 
                opacity: 0.65 
              }}>
                {Array.from({ length: 8 }, (_, i) => (
                  <div key={i} style={{ 
                    height: '7px', 
                    background: '#ccc', 
                    borderRadius: '2px', 
                    marginBottom: '4px',
                    width: i % 3 === 0 ? '55%' : i % 3 === 1 ? '75%' : '100%'
                  }} />
                ))}
              </div>
            </div>

            <div style={{ 
              position: 'relative', 
              zIndex: 5, 
              padding: '10px 14px', 
              background: 'linear-gradient(to bottom, transparent, var(--color-background-primary) 30%)', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '5px', 
              textAlign: 'center' 
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '5px', 
                padding: '5px 10px', 
                background: '#E6EEF7', 
                borderRadius: '20px' 
              }}>
                <Lock size={12} color="#1A4B8C" />
                <span style={{ fontSize: '10px', fontWeight: 500, color: '#1A4B8C' }}>
                  Complete form to unlock & download
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ 
            display: 'flex', 
            padding: '24px 14px', 
            textAlign: 'center', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: '8px' 
          }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              background: '#EAF3DE', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <CheckCircle size={20} color="#27500A" />
            </div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
              Document unlocked
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              Thank you for completing<br />the CSF! All parts are now available.
            </div>
            <button 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px', 
                padding: '8px 16px', 
                background: '#C8322B', 
                color: '#fff', 
                border: 'none', 
                borderRadius: 'var(--border-radius-md)', 
                fontSize: '11px', 
                fontWeight: 500, 
                cursor: 'pointer', 
                fontFamily: 'var(--font-sans)', 
                marginTop: '4px' 
              }}
              onClick={() => alert('Downloading DTI_CSF_Form.pdf...')}
            >
              <Download size={13} />
              Download Full Form (PDF)
            </button>
          </div>
        )}
      </div>

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
          padding: '8px 14px', 
          borderBottom: '0.5px solid var(--color-border-tertiary)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between' 
        }}>
          <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
            Client Satisfaction Form
          </span>
          <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
            {progress}% complete
          </span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
          {error && (
            <div className="error" style={{ marginBottom: '12px' }}>
              {error}
            </div>
          )}

          <FormSection title="Part I · Information">
            <FormField label="Full name *">
              <input
                type="text"
                placeholder="Family, First M.I."
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                style={inputStyle}
              />
            </FormField>

            <FormField label="Email *">
              <input
                type="email"
                placeholder="email@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                style={inputStyle}
              />
            </FormField>

            <FormField label="Contact number">
              <input
                type="text"
                placeholder="+63 9XX XXX XXXX"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                style={inputStyle}
              />
            </FormField>

            <FormField label="Client type *">
              <PillGroup
                options={['Citizen', 'Business', 'Government']}
                selected={formData.ctype}
                onChange={(value) => handleInputChange('ctype', value)}
              />
            </FormField>

            <FormField label="Sex *">
              <PillGroup
                options={['Male', 'Female']}
                selected={formData.sex}
                onChange={(value) => handleInputChange('sex', value)}
              />
            </FormField>

            <FormField label="Age bracket *">
              <PillGroup
                options={['≤19', '20-34', '35-49', '50-64', '65+']}
                values={['19 or lower', '20-34', '35-49', '50-64', '65+']}
                selected={formData.age}
                onChange={(value) => handleInputChange('age', value)}
              />
            </FormField>

            <FormField label="Service availed *">
              <input
                type="text"
                placeholder="e.g. Business name registration"
                value={formData.service}
                onChange={(e) => handleInputChange('service', e.target.value)}
                style={inputStyle}
              />
            </FormField>
          </FormSection>

          <FormSection title="Part II · Citizen's Charter">
            <FormField label="CC1 – Awareness *">
              <PillGroup
                options={['Saw & know CC', 'Know, didn\'t see', 'Saw only here', 'Don\'t know']}
                values={['1', '2', '3', '4']}
                selected={formData.cc1}
                onChange={(value) => handleInputChange('cc1', value)}
              />
            </FormField>

            <FormField label="CC2 – Visibility *">
              <PillGroup
                options={['Easy to see', 'Somewhat', 'Difficult', 'Not visible', 'N/A']}
                values={['1', '2', '3', '4', 'N/A']}
                selected={formData.cc2}
                onChange={(value) => handleInputChange('cc2', value)}
              />
            </FormField>

            <FormField label="CC3 – Helpfulness *">
              <PillGroup
                options={['Helped a lot', 'Somewhat', 'Did not help', 'N/A']}
                values={['1', '2', '3', 'N/A']}
                selected={formData.cc3}
                onChange={(value) => handleInputChange('cc3', value)}
              />
            </FormField>
          </FormSection>

          <FormSection title="Part III · Service Ratings">
            <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
              1=Strongly Agree · 5=Strongly Disagree
            </div>
            <RatingTable criteria={CRITERIA} ratings={ratings} onRate={handleRating} />
          </FormSection>

          <FormSection title="Part IV · Comments">
            <FormField label="Reasons for Disagree/Neither">
              <textarea
                placeholder="Optional…"
                value={formData.reason}
                onChange={(e) => handleInputChange('reason', e.target.value)}
                style={textareaStyle}
              />
            </FormField>

            <FormField label="Suggestions to improve service">
              <textarea
                placeholder="How can we serve you better?"
                value={formData.suggest}
                onChange={(e) => handleInputChange('suggest', e.target.value)}
                style={textareaStyle}
              />
            </FormField>
          </FormSection>
        </div>

        <div style={{ padding: '10px 14px', borderTop: '0.5px solid var(--color-border-tertiary)' }}>
          <button
            onClick={handleSubmit}
            disabled={!isFormComplete() || isSubmitting}
            style={{
              width: '100%',
              padding: '8px',
              background: isFormComplete() && !isSubmitting ? '#1A4B8C' : 'var(--color-background-secondary)',
              color: isFormComplete() && !isSubmitting ? '#fff' : 'var(--color-text-tertiary)',
              border: 'none',
              borderRadius: 'var(--border-radius-md)',
              fontSize: '12px',
              fontWeight: 500,
              cursor: isFormComplete() && !isSubmitting ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font-sans)',
              transition: 'background 0.1s'
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Complete & Unlock Document'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper components
const FormSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <div style={{ 
      fontSize: '10px', 
      fontWeight: 500, 
      color: '#1A4B8C', 
      textTransform: 'uppercase', 
      letterSpacing: '0.4px', 
      marginBottom: '8px', 
      marginTop: '14px' 
    }}>
      {title}
    </div>
    {children}
  </div>
);

const FormField = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: '8px' }}>
    <label style={{ 
      fontSize: '11px', 
      fontWeight: 500, 
      color: 'var(--color-text-primary)', 
      marginBottom: '4px', 
      display: 'block' 
    }}>
      {label}
    </label>
    {children}
  </div>
);

const PillGroup = ({ 
  options, 
  values, 
  selected, 
  onChange 
}: { 
  options: string[]; 
  values?: string[]; 
  selected: string; 
  onChange: (value: string) => void; 
}) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
    {options.map((option, index) => {
      const value = values ? values[index] : option;
      const isSelected = selected === value;
      
      return (
        <label
          key={index}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 9px',
            border: `0.5px solid ${isSelected ? '#1A4B8C' : 'var(--color-border-secondary)'}`,
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '10px',
            color: isSelected ? '#1A4B8C' : 'var(--color-text-secondary)',
            background: isSelected ? '#E6EEF7' : 'transparent',
            fontWeight: isSelected ? 500 : 'normal',
            transition: 'all 0.12s',
            userSelect: 'none'
          }}
          onClick={() => onChange(value)}
        >
          {option}
        </label>
      );
    })}
  </div>
);

const RatingTable = ({ 
  criteria, 
  ratings, 
  onRate 
}: { 
  criteria: string[]; 
  ratings: Record<string, number>; 
  onRate: (index: number, rating: number) => void; 
}) => (
  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px' }}>
    <thead>
      <tr>
        <th style={{ fontSize: '9px', fontWeight: 500, textAlign: 'left', padding: '3px 2px', color: 'var(--color-text-secondary)', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
          Criteria
        </th>
        {[1, 2, 3, 4, 5].map(num => (
          <th key={num} style={{ fontSize: '9px', fontWeight: 500, textAlign: 'center', padding: '3px 2px', color: 'var(--color-text-secondary)', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
            {num}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {criteria.map((criterion, index) => (
        <tr key={index}>
          <td style={{ padding: '4px 2px', fontSize: '10px', color: 'var(--color-text-primary)', borderBottom: '0.5px solid var(--color-border-tertiary)', width: '80px', paddingRight: '6px', fontWeight: 500 }}>
            {criterion}
          </td>
          {[1, 2, 3, 4, 5].map(rating => (
            <td key={rating} style={{ padding: '4px 2px', fontSize: '10px', color: 'var(--color-text-primary)', borderBottom: '0.5px solid var(--color-border-tertiary)', textAlign: 'center' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  border: `1.5px solid ${ratings[`r${index}`] === rating ? '#1A4B8C' : 'var(--color-border-secondary)'}`,
                  borderRadius: '50%',
                  margin: 'auto',
                  cursor: 'pointer',
                  background: ratings[`r${index}`] === rating ? '#1A4B8C' : 'transparent',
                  transition: 'all 0.12s'
                }}
                onClick={() => onRate(index, rating)}
              />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

const inputStyle = {
  width: '100%',
  padding: '6px 9px',
  fontSize: '11px',
  border: '0.5px solid var(--color-border-secondary)',
  borderRadius: 'var(--border-radius-md)',
  background: 'var(--color-background-primary)',
  color: 'var(--color-text-primary)',
  fontFamily: 'var(--font-sans)',
  marginBottom: '8px'
};

const textareaStyle = {
  ...inputStyle,
  resize: 'vertical' as const,
  minHeight: '48px'
};