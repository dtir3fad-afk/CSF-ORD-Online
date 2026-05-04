'use client';

import { Lock, FileText, Download } from 'lucide-react';

interface DocumentPreviewProps {
  fileUrl: string;
  fileName: string;
  isLocked: boolean;
  onDownload?: () => void;
}

export default function DocumentPreview({ fileUrl, fileName, isLocked, onDownload }: DocumentPreviewProps) {
  
  const renderDocumentRepresentation = () => (
    <div style={{
      width: '280px',
      height: '350px',
      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
      border: '2px solid #dee2e6',
      borderRadius: '8px',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      marginBottom: '20px',
      overflow: 'hidden'
    }}>
      {/* Document Header */}
      <div style={{
        background: '#1A4B8C',
        color: 'white',
        padding: '12px 16px',
        fontSize: '11px',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <FileText size={16} />
        PDF DOCUMENT
      </div>
      
      {/* Document Content */}
      <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#1A4B8C', marginBottom: '12px' }}>
          {fileName}
        </div>
        
        {/* Form Content Simulation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <FormSection title="PART I - INFORMATION" />
          <FormFields fields={[
            'Full name: ________________________',
            'Email: ____________________________',
            'Service availed: ___________________',
            'Client type: ○ Citizen ○ Business',
            'Sex: ○ Male ○ Female',
            'Age bracket: ○ ≤19 ○ 20-34 ○ 35-49'
          ]} />
          
          <FormSection title="PART II - CITIZEN'S CHARTER" />
          <FormFields fields={[
            'CC1 - Awareness: ○ Saw & know CC',
            'CC2 - Visibility: ○ Easy to see',
            'CC3 - Helpfulness: ○ Helped a lot'
          ]} />
        </div>
        
        {/* DTI Logo */}
        <DTILogo />
      </div>
      
      {/* Blur Overlay for Locked State */}
      {isLocked && <BlurOverlay />}
    </div>
  );

  const renderContent = () => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      background: 'white',
      padding: '20px'
    }}>
      {renderDocumentRepresentation()}
      <DocumentDescription isLocked={isLocked} />
    </div>
  );

  return (
    <div style={{ height: '400px', background: '#f5f5f5', position: 'relative', overflow: 'hidden' }}>
      {renderContent()}
      <LockOverlay isLocked={isLocked} />
      <DownloadButton isLocked={isLocked} onDownload={onDownload} />
    </div>
  );
}

// Helper Components
const FormSection = ({ title }: { title: string }) => (
  <div style={{ fontSize: '10px', fontWeight: 600, color: '#1A4B8C' }}>
    {title}
  </div>
);

const FormFields = ({ fields }: { fields: string[] }) => (
  <>
    {fields.map((field, i) => (
      <div key={i} style={{
        fontSize: '8px',
        color: '#666',
        fontFamily: 'monospace'
      }}>
        {field}
      </div>
    ))}
  </>
);

const DTILogo = () => (
  <div style={{
    marginTop: 'auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px',
    background: 'rgba(26, 75, 140, 0.1)',
    borderRadius: '4px'
  }}>
    <div style={{
      width: '28px',
      height: '28px',
      background: '#1A4B8C',
      borderRadius: '4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '9px',
      fontWeight: 700
    }}>
      DTI
    </div>
  </div>
);

const BlurOverlay = () => (
  <div style={{
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backdropFilter: 'blur(3px)',
    background: 'rgba(255, 255, 255, 0.3)'
  }} />
);

const DocumentDescription = ({ isLocked }: { isLocked: boolean }) => (
  <div style={{ 
    textAlign: 'center',
    fontSize: '12px',
    color: 'var(--color-text-secondary)',
    maxWidth: '300px',
    lineHeight: 1.4,
    marginBottom: '16px'
  }}>
    {isLocked 
      ? "This is a preview of your uploaded PDF document. Complete the feedback form to unlock and download the full document."
      : "Document is now available for download."
    }
  </div>
);

const LockOverlay = ({ isLocked }: { isLocked: boolean }) => (
  <>
    {isLocked && (
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(to top, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.9) 50%, transparent 100%)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '20px',
        pointerEvents: 'none',
        zIndex: 10
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          background: '#FFE6E6',
          borderRadius: '20px',
          border: '2px solid #DC2626'
        }}>
          <Lock size={16} color="#DC2626" />
          <span style={{ 
            fontSize: '12px', 
            fontWeight: 700, 
            color: '#DC2626',
            textShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}>
            Complete the form to unlock full document
          </span>
        </div>
      </div>
    )}
  </>
);

const DownloadButton = ({ isLocked, onDownload }: { isLocked: boolean; onDownload?: () => void }) => (
  <>
    {!isLocked && onDownload && (
      <div style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        zIndex: 10
      }}>
        <button
          onClick={onDownload}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: '#1A4B8C',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          <Download size={14} />
          Download
        </button>
      </div>
    )}
  </>
);