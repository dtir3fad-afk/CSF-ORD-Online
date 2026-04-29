'use client';

import { useState } from 'react';
import { Lock, CheckCircle, Download } from 'lucide-react';
import { addCSFResponse } from '@/lib/firestore';
import { CSFResponse } from '@/types';

const CRITERIA = [
  {
    id: 'overall',
    title: '0. OVERALL RATING',
    description: 'In general, I am satisfied with the service/s I received.'
  },
  {
    id: 'responsiveness', 
    title: '1. RESPONSIVENESS',
    description: 'I received prompt response to my request/transaction, and if there was any delay, it was sufficiently explained to me.'
  },
  {
    id: 'reliability',
    title: '2. RELIABILITY', 
    description: 'I received the expected service in accordance with established procedures and standards, with zero to minimal errors.'
  },
  {
    id: 'access_facilities',
    title: '3. ACCESS AND FACILITIES',
    description: 'The location, facilities, and systems used were accessible and convenient, with clear steps and helpful technologies.'
  },
  {
    id: 'communication',
    title: '4. COMMUNICATION',
    description: 'I was clearly informed of the requirements and status of my transaction.'
  },
  {
    id: 'costs',
    title: '5. COSTS',
    description: 'I paid reasonable amount of fees for my transaction (if applicable).'
  },
  {
    id: 'integrity',
    title: '6. INTEGRITY',
    description: 'I felt the office was fair to everyone, or "walang palakasan", during my transaction.'
  },
  {
    id: 'assurance',
    title: '7. ASSURANCE',
    description: 'I was treated courteously by the staff, and (if asked for assistance) the staff was helpful.'
  },
  {
    id: 'outcome',
    title: '8. OUTCOME',
    description: 'I received the result or service in a timely and accurate manner. If not, the reason was clearly explained, and/or I was appropriately referred when necessary.'
  }
];

export default function CSFForm() {
  const [formData, setFormData] = useState({
    familyName: '',
    firstName: '',
    middleName: '',
    name: '', // Keep for compatibility
    email: '',
    phone: '',
    ctype: '',
    sex: '',
    age: '',
    service: '',
    cc1: '',
    cc2: '',
    cc3: '',
    comments: '',
    suggestions: ''
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
    const fullName = formData.familyName && formData.firstName;
    const section1 = fullName && formData.email && formData.service && 
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
      const fullName = `${formData.familyName}, ${formData.firstName} ${formData.middleName}`.trim();
      
      const response: Omit<CSFResponse, 'id'> = {
        ...formData,
        name: fullName, // Combine names for compatibility
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

          <FormSection title="CLIENT'S FULL NAME:">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 100px 80px', gap: '8px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '9px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '2px' }}>Family Name</label>
                <input
                  type="text"
                  placeholder="Family Name"
                  value={formData.familyName || ''}
                  onChange={(e) => handleInputChange('familyName', e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: '9px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '2px' }}>First Name</label>
                <input
                  type="text"
                  placeholder="First Name"
                  value={formData.firstName || ''}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: '9px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '2px' }}>Middle Name</label>
                <input
                  type="text"
                  placeholder="Middle Name"
                  value={formData.middleName || ''}
                  onChange={(e) => handleInputChange('middleName', e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: '9px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '2px' }}>Client's Signature</label>
                <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)', fontSize: '9px' }}>
                  Digital
                </div>
              </div>
              <div>
                <label style={{ fontSize: '9px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '2px' }}>Date</label>
                <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)', fontSize: '9px' }}>
                  {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection title="">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <FormField label="Client type: *">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {[
                    { value: 'Citizen', label: '☐ Citizen' },
                    { value: 'Business', label: '☐ Business' },
                    { value: 'Government', label: '☐ Government (Employee or another agency)' }
                  ].map((option) => (
                    <label key={option.value} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11px' }}>
                      <input
                        type="checkbox"
                        checked={formData.ctype === option.value}
                        onChange={() => handleInputChange('ctype', formData.ctype === option.value ? '' : option.value)}
                        style={{ margin: 0 }}
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </FormField>

              <div>
                <FormField label="Sex: *">
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {[
                      { value: 'Male', label: '☐ Male' },
                      { value: 'Female', label: '☐ Female' }
                    ].map((option) => (
                      <label key={option.value} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11px' }}>
                        <input
                          type="checkbox"
                          checked={formData.sex === option.value}
                          onChange={() => handleInputChange('sex', formData.sex === option.value ? '' : option.value)}
                          style={{ margin: 0 }}
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                </FormField>

                <FormField label="Age: *">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {[
                      { value: '19 or lower', label: '☐ 19 or lower' },
                      { value: '20-34', label: '☐ 20-34' },
                      { value: '35-49', label: '☐ 35-49' },
                      { value: '50-64', label: '☐ 50-64' },
                      { value: '65 or higher', label: '☐ 65 or higher' }
                    ].map((option) => (
                      <label key={option.value} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '10px' }}>
                        <input
                          type="checkbox"
                          checked={formData.age === option.value}
                          onChange={() => handleInputChange('age', formData.age === option.value ? '' : option.value)}
                          style={{ margin: 0 }}
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                </FormField>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <FormField label="E-Mail Address: *">
                <input
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  style={inputStyle}
                />
              </FormField>
              <FormField label="Contact Number:">
                <input
                  type="text"
                  placeholder="+63 9XX XXX XXXX"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  style={inputStyle}
                />
              </FormField>
            </div>

            <FormField label="SERVICE AVAILED: (To be filled by Process Owners/CDO upon printing) *">
              <input
                type="text"
                placeholder="e.g. Business name registration, Product certification, etc."
                value={formData.service}
                onChange={(e) => handleInputChange('service', e.target.value)}
                style={inputStyle}
              />
            </FormField>
          </FormSection>

          <FormSection title="PART I. Place a Check mark (✓) beside your selected answer to the Citizen's Charter (CC) questions.">
            <div style={{ fontSize: '10px', color: 'var(--color-text-primary)', marginBottom: '12px', lineHeight: 1.4, fontStyle: 'italic' }}>
              The Citizen's Charter is an official document that reflects the services of a government agency/office including its requirements, fees, and processing times among others.
            </div>
            
            <FormField label="CC1 Which of the following best describes your awareness of a Citizen's Charter (CC)? *">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                {[
                  { value: '1', label: '☐ 1. I know what a CC is and I saw this office\'s CC.' },
                  { value: '2', label: '☐ 2. I know what a CC is but I did NOT see this office\'s CC.' },
                  { value: '3', label: '☐ 3. I learned of the CC only when I saw this office\'s CC.' },
                  { value: '4', label: '☐ 4. I do not know what a CC is and I did not see one in this office.' }
                ].map((option) => (
                  <label
                    key={option.value}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      lineHeight: 1.4,
                      padding: '4px 6px',
                      borderRadius: '4px',
                      background: formData.cc1 === option.value ? '#E6F1FB' : 'transparent'
                    }}
                    onClick={() => handleInputChange('cc1', option.value)}
                  >
                    <input
                      type="checkbox"
                      checked={formData.cc1 === option.value}
                      onChange={() => {}}
                      style={{ margin: '2px 0 0 0' }}
                    />
                    <span style={{ color: 'var(--color-text-primary)' }}>{option.label}</span>
                  </label>
                ))}
              </div>
            </FormField>

            <FormField label="CC2 If aware of the Citizen's Charter (CC) (answered 1-3 in CC1), would you say that the CC of this office was ...? *">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                {[
                  { value: '1', label: '☐ 1. Easy to see' },
                  { value: '2', label: '☐ 2. Somewhat easy to see' },
                  { value: '3', label: '☐ 3. Difficult to see' },
                  { value: '4', label: '☐ 4. Not visible at all' },
                  { value: '5', label: '☐ 5. N/A' }
                ].map((option) => (
                  <label
                    key={option.value}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      lineHeight: 1.4,
                      padding: '4px 6px',
                      borderRadius: '4px',
                      background: formData.cc2 === option.value ? '#E6F1FB' : 'transparent'
                    }}
                    onClick={() => handleInputChange('cc2', option.value)}
                  >
                    <input
                      type="checkbox"
                      checked={formData.cc2 === option.value}
                      onChange={() => {}}
                      style={{ margin: '2px 0 0 0' }}
                    />
                    <span style={{ color: 'var(--color-text-primary)' }}>{option.label}</span>
                  </label>
                ))}
              </div>
            </FormField>

            <FormField label="CC3 If aware of the Citizen's Charter (CC) (answered codes 1-3 in CC1), how much did the CC help you in your transaction? *">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                {[
                  { value: '1', label: '☐ 1. Helped very much' },
                  { value: '2', label: '☐ 2. Somewhat helped' },
                  { value: '3', label: '☐ 3. Did not help' },
                  { value: '4', label: '☐ 4. N/A' }
                ].map((option) => (
                  <label
                    key={option.value}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      lineHeight: 1.4,
                      padding: '4px 6px',
                      borderRadius: '4px',
                      background: formData.cc3 === option.value ? '#E6F1FB' : 'transparent'
                    }}
                    onClick={() => handleInputChange('cc3', option.value)}
                  >
                    <input
                      type="checkbox"
                      checked={formData.cc3 === option.value}
                      onChange={() => {}}
                      style={{ margin: '2px 0 0 0' }}
                    />
                    <span style={{ color: 'var(--color-text-primary)' }}>{option.label}</span>
                  </label>
                ))}
              </div>
            </FormField>
          </FormSection>

          <FormSection title="PART II. Our office is committed to continually improve our services to our clients.">
            <div style={{ fontSize: '11px', color: 'var(--color-text-primary)', marginBottom: '8px', lineHeight: 1.4 }}>
              Please let us know how we can better serve you. Your feedback will be taken into consideration, ensuring the strict confidentiality of the information you provide.
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-primary)', marginBottom: '8px', lineHeight: 1.4, fontWeight: 600 }}>
              For each criterion below, please check-mark (✓) the box "☐" under the column pertaining to your answer. Mark ONE BOX ONLY for each row. For every "NEITHER", "DISAGREE" or "STRONGLY DISAGREE" rating you give, please provide reason/s in PART III below.
            </div>
            
            <div style={{ marginBottom: '12px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '10px' }}>
                <thead>
                  <tr>
                    <th style={{ 
                      border: '1px solid #000', 
                      padding: '8px 4px', 
                      background: '#f0f0f0', 
                      textAlign: 'center',
                      fontWeight: 'bold',
                      width: '40%'
                    }}>
                      CRITERIA FOR RATING
                    </th>
                    <th style={{ 
                      border: '1px solid #000', 
                      padding: '4px', 
                      background: '#27500A', 
                      color: 'white',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      fontSize: '9px',
                      width: '12%'
                    }}>
                      STRONGLY AGREE
                    </th>
                    <th style={{ 
                      border: '1px solid #000', 
                      padding: '4px', 
                      background: '#4CAF50', 
                      color: 'white',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      fontSize: '9px',
                      width: '12%'
                    }}>
                      AGREE
                    </th>
                    <th style={{ 
                      border: '1px solid #000', 
                      padding: '4px', 
                      background: '#FFA500', 
                      color: 'white',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      fontSize: '9px',
                      width: '12%'
                    }}>
                      NEITHER
                    </th>
                    <th style={{ 
                      border: '1px solid #000', 
                      padding: '4px', 
                      background: '#FF6B35', 
                      color: 'white',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      fontSize: '9px',
                      width: '12%'
                    }}>
                      DISAGREE
                    </th>
                    <th style={{ 
                      border: '1px solid #000', 
                      padding: '4px', 
                      background: '#C8322B', 
                      color: 'white',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      fontSize: '9px',
                      width: '12%'
                    }}>
                      STRONGLY DISAGREE
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      id: 'overall',
                      title: '0. OVERALL RATING',
                      description: 'In general, I am satisfied with the service/s I received.'
                    },
                    {
                      id: 'responsiveness',
                      title: '1. RESPONSIVENESS',
                      description: 'I received prompt response to my request/transaction, and if there was any delay, it was sufficiently explained to me.'
                    },
                    {
                      id: 'reliability',
                      title: '2. RELIABILITY',
                      description: 'I received the expected service in accordance with established procedures and standards, with zero to minimal errors.'
                    },
                    {
                      id: 'access_facilities',
                      title: '3. ACCESS AND FACILITIES',
                      description: 'The location, facilities, and systems used were accessible and convenient, with clear steps and helpful technologies.'
                    },
                    {
                      id: 'communication',
                      title: '4. COMMUNICATION',
                      description: 'I was clearly informed of the requirements and status of my transaction.'
                    },
                    {
                      id: 'costs',
                      title: '5. COSTS',
                      description: 'I paid reasonable amount of fees for my transaction (if applicable). ☐ Not Applicable'
                    },
                    {
                      id: 'integrity',
                      title: '6. INTEGRITY',
                      description: 'I felt the office was fair to everyone, or "walang palakasan", during my transaction.'
                    },
                    {
                      id: 'assurance',
                      title: '7. ASSURANCE',
                      description: 'I was treated courteously by the staff, and (if asked for assistance) the staff was helpful.'
                    },
                    {
                      id: 'outcome',
                      title: '8. OUTCOME',
                      description: 'I received the result or service in a timely and accurate manner. If not, the reason was clearly explained, and/or I was appropriately referred when necessary.'
                    }
                  ].map((criterion, index) => (
                    <tr key={index}>
                      <td style={{ 
                        border: '1px solid #000', 
                        padding: '6px', 
                        verticalAlign: 'top',
                        background: index % 2 === 0 ? '#f9f9f9' : 'white'
                      }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '2px', color: '#1A4B8C' }}>
                          {criterion.title}
                        </div>
                        <div style={{ fontSize: '9px', lineHeight: 1.3 }}>
                          {criterion.description}
                        </div>
                      </td>
                      {[5, 4, 3, 2, 1].map(rating => (
                        <td key={rating} style={{ 
                          border: '1px solid #000', 
                          padding: '4px', 
                          textAlign: 'center',
                          verticalAlign: 'middle',
                          background: index % 2 === 0 ? '#f9f9f9' : 'white'
                        }}>
                          <input
                            type="checkbox"
                            checked={ratings[`r${index}`] === rating}
                            onChange={() => handleRating(index, rating)}
                            style={{ 
                              width: '16px', 
                              height: '16px',
                              cursor: 'pointer'
                            }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FormSection>

          <FormSection title="PART III. COMMENTS AND SUGGESTIONS">
            <FormField label='Please provide your reason/s for your "NEITHER", "DISAGREE" or "STRONGLY DISAGREE" answer, including comments/suggestions, if any, for improvement purposes.'>
              <textarea
                placeholder="Please provide your reasons for ratings of 3 or below..."
                value={formData.comments}
                onChange={(e) => handleInputChange('comments', e.target.value)}
                style={{ ...textareaStyle, minHeight: '80px' }}
                rows={4}
              />
            </FormField>

            <FormField label="Please give comments/suggestions to help us improve our service/s:">
              <textarea
                placeholder="How can we serve you better? Your suggestions are valuable to us."
                value={formData.suggestions}
                onChange={(e) => handleInputChange('suggestions', e.target.value)}
                style={{ ...textareaStyle, minHeight: '80px' }}
                rows={4}
              />
            </FormField>

            <div style={{ 
              textAlign: 'center', 
              marginTop: '20px', 
              padding: '8px',
              background: '#27500A',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '12px'
            }}>
              THANK YOU!
            </div>
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
  criteria: typeof CRITERIA; 
  ratings: Record<string, number>; 
  onRate: (index: number, rating: number) => void; 
}) => (
  <div style={{ marginBottom: '12px' }}>
    {criteria.map((criterion, index) => (
      <div key={index} style={{ 
        marginBottom: '12px', 
        padding: '8px', 
        border: '0.5px solid var(--color-border-secondary)', 
        borderRadius: 'var(--border-radius-md)',
        background: 'var(--color-background-secondary)'
      }}>
        <div style={{ 
          fontSize: '11px', 
          fontWeight: 600, 
          color: '#1A4B8C', 
          marginBottom: '4px' 
        }}>
          {criterion.title}
        </div>
        <div style={{ 
          fontSize: '10px', 
          color: 'var(--color-text-primary)', 
          marginBottom: '8px',
          lineHeight: 1.4
        }}>
          {criterion.description}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {[5, 4, 3, 2, 1].map(rating => {
            const labels = ['Strongly Disagree', 'Disagree', 'Neither', 'Agree', 'Strongly Agree'];
            const colors = ['#C8322B', '#FF6B35', '#FFA500', '#4CAF50', '#27500A'];
            const isSelected = ratings[`r${index}`] === rating;
            
            return (
              <label
                key={rating}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  fontSize: '9px',
                  color: isSelected ? colors[rating - 1] : 'var(--color-text-secondary)',
                  fontWeight: isSelected ? 600 : 'normal',
                  padding: '2px 4px',
                  borderRadius: '4px',
                  background: isSelected ? `${colors[rating - 1]}15` : 'transparent',
                  border: isSelected ? `1px solid ${colors[rating - 1]}` : '1px solid transparent'
                }}
                onClick={() => onRate(index, rating)}
              >
                <div
                  style={{
                    width: '14px',
                    height: '14px',
                    border: `2px solid ${isSelected ? colors[rating - 1] : 'var(--color-border-secondary)'}`,
                    borderRadius: '2px',
                    background: isSelected ? colors[rating - 1] : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '8px',
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                >
                  {isSelected ? '✓' : ''}
                </div>
                <span>{rating}</span>
              </label>
            );
          })}
        </div>
      </div>
    ))}
  </div>
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