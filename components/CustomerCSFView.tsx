'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { getCSFTemplate, addCSFResponse } from '@/lib/firestore';
import { CSFTemplate, CSFResponse } from '@/types';
import DocumentPreview from './DocumentPreview';



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
    familyName: '',
    firstName: '',
    middleName: '',
    name: '', // Keep for compatibility
    email: customerEmail || '',
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
    if (!isFormComplete() || !template?.id) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const fullName = `${formData.familyName}, ${formData.firstName} ${formData.middleName}`.trim();
      
      const response: Omit<CSFResponse, 'id'> = {
        ...formData,
        name: fullName, // Combine names for compatibility
        reason: formData.comments, // Map comments to reason for compatibility
        suggest: formData.suggestions, // Map suggestions to suggest for compatibility
        csfId: template.id,
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
                <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
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
              <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
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

              {/* Complete DTI Form - exact same structure as CSFForm component */}
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



// Complete DTI form content component - matches CSFForm.tsx exactly
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
  ];

  return (
    <div style={{ fontSize: '12px' }}>
      {/* Client's Full Name Section */}
      <FormSection title="CLIENT'S FULL NAME:">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 100px 80px', gap: '8px', marginBottom: '12px' }}>
          <div>
            <label style={{ fontSize: '9px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '2px' }}>Family Name</label>
            <input
              type="text"
              placeholder="Family Name"
              value={formData.familyName || ''}
              onChange={(e) => onInputChange('familyName', e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: '9px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '2px' }}>First Name</label>
            <input
              type="text"
              placeholder="First Name"
              value={formData.firstName || ''}
              onChange={(e) => onInputChange('firstName', e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: '9px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '2px' }}>Middle Name</label>
            <input
              type="text"
              placeholder="Middle Name"
              value={formData.middleName || ''}
              onChange={(e) => onInputChange('middleName', e.target.value)}
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

      {/* Client Information Section */}
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
                    onChange={() => onInputChange('ctype', formData.ctype === option.value ? '' : option.value)}
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
                      onChange={() => onInputChange('sex', formData.sex === option.value ? '' : option.value)}
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
                  { value: '65+', label: '☐ 65 or higher' }
                ].map((option) => (
                  <label key={option.value} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '10px' }}>
                    <input
                      type="checkbox"
                      checked={formData.age === option.value}
                      onChange={() => onInputChange('age', formData.age === option.value ? '' : option.value)}
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
              onChange={(e) => onInputChange('email', e.target.value)}
              style={inputStyle}
            />
          </FormField>
          <FormField label="Contact Number:">
            <input
              type="text"
              placeholder="+63 9XX XXX XXXX"
              value={formData.phone}
              onChange={(e) => onInputChange('phone', e.target.value)}
              style={inputStyle}
            />
          </FormField>
        </div>

        <FormField label="SERVICE AVAILED: (To be filled by Process Owners/CDO upon printing) *">
          <input
            type="text"
            placeholder="e.g. Business name registration, Product certification, etc."
            value={formData.service}
            onChange={(e) => onInputChange('service', e.target.value)}
            style={inputStyle}
          />
        </FormField>
      </FormSection>

      {/* Part I - Citizen's Charter */}
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
                onClick={() => onInputChange('cc1', option.value)}
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
                onClick={() => onInputChange('cc2', option.value)}
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
                onClick={() => onInputChange('cc3', option.value)}
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

      {/* Part II - Service Ratings */}
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
              {CRITERIA.map((criterion, index) => (
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
                        onChange={() => onRating(index, rating)}
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

      {/* Part III - Comments and Suggestions */}
      <FormSection title="PART III. COMMENTS AND SUGGESTIONS">
        <FormField label='Please provide your reason/s for your "NEITHER", "DISAGREE" or "STRONGLY DISAGREE" answer, including comments/suggestions, if any, for improvement purposes.'>
          <textarea
            placeholder="Please provide your reasons for ratings of 3 or below..."
            value={formData.comments}
            onChange={(e) => onInputChange('comments', e.target.value)}
            style={{ ...textareaStyle, minHeight: '80px' }}
            rows={4}
          />
        </FormField>

        <FormField label="Please give comments/suggestions to help us improve our service/s:">
          <textarea
            placeholder="How can we serve you better? Your suggestions are valuable to us."
            value={formData.suggestions}
            onChange={(e) => onInputChange('suggestions', e.target.value)}
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