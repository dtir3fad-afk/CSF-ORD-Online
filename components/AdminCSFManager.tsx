'use client';

import { useState, useEffect } from 'react';
import { Plus, Upload, Eye, Users, FileText, Trash2, Mail, CheckCircle, AlertCircle, Copy, ExternalLink } from 'lucide-react';
import { createCSFTemplate, getCSFTemplates, getCSFResponsesByTemplate, deleteCSFTemplate } from '@/lib/firestore';
import { uploadDocument, validateDocument } from '@/lib/storage';
import { generateCSFInvitationEmail } from '@/lib/email';
import { CSFTemplate } from '@/types';

export default function AdminCSFManager() {
  const [templates, setTemplates] = useState<CSFTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CSFTemplate | null>(null);
  const [showEmailPreview, setShowEmailPreview] = useState<{ template: CSFTemplate; email: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await getCSFTemplates();
      setTemplates(data);
    } catch (err) {
      setError('Failed to load CSF templates');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async (templateData: Omit<CSFTemplate, 'id'>) => {
    try {
      await createCSFTemplate(templateData);
      await loadTemplates();
      setShowCreateForm(false);
      setError(null);
    } catch (err) {
      setError('Failed to create CSF template');
      console.error(err);
    }
  };

  const handleDeleteTemplate = async (templateId: string, templateTitle: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${templateTitle}"?\n\nThis action cannot be undone and will permanently remove the CSF template and all associated data.`
    );
    
    if (!confirmed) return;

    try {
      await deleteCSFTemplate(templateId);
      await loadTemplates();
      setError(null);
    } catch (err) {
      setError('Failed to delete CSF template');
      console.error(err);
    }
  };

  if (loading) {
    return <div className="loading">Loading CSF templates...</div>;
  }

  return (
    <div>
      {error && <div className="error">{error}</div>}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
          CSF Management
        </h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-sm btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={14} />
          Create New CSF
        </button>
      </div>

      {showCreateForm && (
        <CreateCSFForm
          onSubmit={handleCreateTemplate}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      <div style={{ display: 'grid', gap: '16px' }}>
        {templates.map((template) => (
          <CSFTemplateCard
            key={template.id}
            template={template}
            onView={() => setSelectedTemplate(template)}
            onRefresh={loadTemplates}
            onShowEmailPreview={setShowEmailPreview}
            onDelete={(templateId, templateTitle) => handleDeleteTemplate(templateId, templateTitle)}
          />
        ))}
        
        {templates.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: 'var(--color-text-secondary)',
            background: 'var(--color-background-secondary)',
            borderRadius: 'var(--border-radius-lg)',
            border: '1px dashed var(--color-border-secondary)'
          }}>
            <FileText size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <div style={{ fontSize: '14px', marginBottom: '8px' }}>No CSF templates yet</div>
            <div style={{ fontSize: '12px' }}>Create your first CSF to start collecting feedback</div>
          </div>
        )}
      </div>

      {selectedTemplate && (
        <CSFTemplateModal
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
        />
      )}

      {showEmailPreview && (
        <EmailPreviewModal
          template={showEmailPreview.template}
          recipientEmail={showEmailPreview.email}
          onClose={() => setShowEmailPreview(null)}
        />
      )}
    </div>
  );
}

// Create CSF Form Component
function CreateCSFForm({ 
  onSubmit, 
  onCancel 
}: { 
  onSubmit: (data: Omit<CSFTemplate, 'id'>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    previewFileUrl: '',
    fullFileUrl: '',
    fileName: '',
    createdBy: 'Admin' // In real app, get from auth
  });
  
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    setUploadError(null);
    
    // Validate file
    const validation = validateDocument(file);
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid file');
      return;
    }
    
    setUploading(true);
    
    try {
      console.log('📁 Using direct file upload method (no Firebase Storage needed)');
      
      // Convert file to data URL for storage
      const reader = new FileReader();
      
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      // Create URLs for both preview and full document
      // In a real system, you might create a blurred preview, but for now we'll use the same file
      const previewUrl = dataUrl;
      const fullUrl = dataUrl;
      
      setFormData(prev => ({ 
        ...prev, 
        previewFileUrl: previewUrl,
        fullFileUrl: fullUrl,
        fileName: file.name
      }));
      
      console.log('✅ File upload successful using data URL method');
      console.log(`📊 File size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
      
    } catch (error: any) {
      console.error('Upload failed:', error);
      setUploadError(`Failed to process file: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.previewFileUrl || !formData.fullFileUrl) {
      alert('Please upload a document first.');
      return;
    }
    
    onSubmit({
      title: formData.title,
      description: formData.description,
      previewFileUrl: formData.previewFileUrl,
      fullFileUrl: formData.fullFileUrl,
      createdBy: formData.createdBy,
      recipients: [], // Empty array since recipients are handled manually
      isActive: true,
      createdAt: new Date().toISOString()
    });
  };

  return (
    <div className="card" style={{ marginBottom: '20px' }}>
      <div className="card-title">Create New CSF Template</div>
      
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>
              CSF Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Q4 2024 Client Satisfaction Survey"
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--color-border-secondary)',
                borderRadius: 'var(--border-radius-md)',
                fontSize: '12px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of this CSF campaign"
              rows={3}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--color-border-secondary)',
                borderRadius: 'var(--border-radius-md)',
                fontSize: '12px',
                resize: 'vertical'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>
              Document File *
            </label>
            <div style={{
              border: '2px dashed var(--color-border-secondary)',
              borderRadius: 'var(--border-radius-md)',
              padding: '20px',
              textAlign: 'center',
              background: 'var(--color-background-secondary)'
            }}>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileUpload(file);
                  }
                }}
                style={{ display: 'none' }}
                id="file-upload"
                disabled={uploading}
              />
              <label 
                htmlFor="file-upload"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  background: uploading ? 'var(--color-background-secondary)' : '#1A4B8C',
                  color: uploading ? 'var(--color-text-secondary)' : 'white',
                  borderRadius: 'var(--border-radius-md)',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  fontWeight: 500
                }}
              >
                <Upload size={16} />
                {uploading ? 'Uploading...' : 'Choose Document'}
              </label>
              {formData.fileName && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--color-text-primary)' }}>
                  ✅ Selected: {formData.fileName}
                </div>
              )}
              {uploadError && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#C8322B' }}>
                  ❌ {uploadError}
                </div>
              )}
              <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
                PDF, DOC, or DOCX files only (max 10MB)
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onCancel}
              className="btn-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-sm btn-primary"
            >
              Create CSF Template
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// CSF Template Card Component
function CSFTemplateCard({ 
  template, 
  onView, 
  onRefresh,
  onShowEmailPreview,
  onDelete
}: { 
  template: CSFTemplate;
  onView: () => void;
  onRefresh: () => void;
  onShowEmailPreview: (data: { template: CSFTemplate; email: string }) => void;
  onDelete: (templateId: string, templateTitle: string) => void;
}) {
  const [responses, setResponses] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResponseCount();
  }, [template.id]);

  const loadResponseCount = async () => {
    try {
      if (template.id) {
        const responseData = await getCSFResponsesByTemplate(template.id);
        setResponses(responseData.length);
      }
    } catch (error) {
      console.error('Error loading response count:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!template.id) return;
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const csfUrl = `${baseUrl}/csf?id=${template.id}`;
    
    try {
      await navigator.clipboard.writeText(csfUrl);
      alert('CSF link copied to clipboard!');
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = csfUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('CSF link copied to clipboard!');
    }
  };

  const handleCopyEmailTemplate = async () => {
    if (!template.id) return;
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const csfUrl = `${baseUrl}/csf?id=${template.id}`;
    
    const emailMessage = `Subject: DTI Client Satisfaction Feedback - ${template.title}

Dear Valued Client,

We hope this message finds you well. As part of our commitment to continuous improvement, we would like to request your valuable feedback regarding the services you recently availed from the Department of Trade and Industry.

CSF Title: ${template.title}

How it works:
1. Click the link below to access your personalized feedback form
2. Complete all required sections of the Client Satisfaction Form
3. Upon submission, you'll unlock access to the complete document
4. Download your document and keep it for your records

Complete your feedback form here: ${csfUrl}

Your responses will help us enhance our services and better serve our clients. The form takes approximately 5-10 minutes to complete.

Thank you for your time and continued trust in our services.

Sincerely,
${template.createdBy}
Department of Trade and Industry`;

    try {
      await navigator.clipboard.writeText(emailMessage);
      alert('Email template copied to clipboard! You can now paste it into your email client.');
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = emailMessage;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Email template copied to clipboard! You can now paste it into your email client.');
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
            {template.title}
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
            {template.description || 'No description provided'}
          </p>
          <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
            Created {new Date(template.createdAt).toLocaleDateString()} by {template.createdBy}
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '10px',
            fontWeight: 500,
            background: template.isActive ? '#EAF3DE' : '#F1F3F4',
            color: template.isActive ? '#27500A' : '#5F6368'
          }}>
            {template.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
        <div style={{ textAlign: 'center', padding: '8px', background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)' }}>
          <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Manual
          </div>
          <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>Distribution</div>
        </div>
        
        <div style={{ textAlign: 'center', padding: '8px', background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)' }}>
          <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {loading ? '...' : responses}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>Total Responses</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={onView}
          className="btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <Eye size={12} />
          View Details
        </button>
        
        <button
          onClick={() => onDelete(template.id!, template.title)}
          className="btn-sm"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px',
            color: '#d93025',
            borderColor: '#f9ab9d'
          }}
          title="Delete CSF Template"
        >
          <Trash2 size={12} />
          Delete
        </button>
        
        <button
          onClick={() => onShowEmailPreview({ template, email: 'client@example.com' })}
          className="btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <Eye size={12} />
          Preview Email
        </button>
        
        <button
          onClick={handleCopyLink}
          className="btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <Mail size={12} />
          Copy Link
        </button>
        
        <button
          onClick={handleCopyEmailTemplate}
          className="btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <FileText size={12} />
          Copy Email Template
        </button>
      </div>
    </div>
  );
}

// CSF Template Modal Component
function CSFTemplateModal({ 
  template, 
  onClose 
}: { 
  template: CSFTemplate;
  onClose: () => void;
}) {
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResponses();
  }, [template.id]);

  const loadResponses = async () => {
    try {
      if (template.id) {
        const data = await getCSFResponsesByTemplate(template.id);
        setResponses(data);
      }
    } catch (error) {
      console.error('Error loading responses:', error);
    } finally {
      setLoading(false);
    }
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
      zIndex: 1000
    }}>
      <div style={{
        background: 'var(--color-background-primary)',
        borderRadius: 'var(--border-radius-lg)',
        padding: '24px',
        maxWidth: '800px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600 }}>{template.title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>
            ×
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Distribution Method</h3>
          <div style={{ 
            padding: '8px 12px', 
            background: 'var(--color-background-secondary)', 
            borderRadius: 'var(--border-radius-md)',
            fontSize: '12px',
            color: 'var(--color-text-secondary)'
          }}>
            Manual distribution via copy link and email template
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
            Responses ({responses.length})
          </h3>
          
          {loading ? (
            <div>Loading responses...</div>
          ) : responses.length > 0 ? (
            <div style={{ maxHeight: '300px', overflow: 'auto' }}>
              {responses.map((response, index) => (
                <div key={index} style={{
                  padding: '12px',
                  border: '1px solid var(--color-border-tertiary)',
                  borderRadius: 'var(--border-radius-md)',
                  marginBottom: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '12px' }}>{response.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{response.email}</div>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                      {new Date(response.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-secondary)' }}>
              No responses yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Email Preview Modal Component
function EmailPreviewModal({ 
  template, 
  recipientEmail, 
  onClose 
}: { 
  template: CSFTemplate;
  recipientEmail: string;
  onClose: () => void;
}) {
  const emailTemplate = generateCSFInvitationEmail(recipientEmail, template.title, template.id || 'demo-id', template.createdBy);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const csfUrl = `${baseUrl}/csf?id=${template.id}&email=${encodeURIComponent(recipientEmail)}`;

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(emailTemplate.text);
      alert('Email content copied to clipboard!');
    } catch (error) {
      const textArea = document.createElement('textarea');
      textArea.value = emailTemplate.text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Email content copied to clipboard!');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(csfUrl);
      alert('CSF link copied to clipboard!');
    } catch (error) {
      const textArea = document.createElement('textarea');
      textArea.value = csfUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('CSF link copied to clipboard!');
    }
  };

  const handleOpenLink = () => {
    window.open(csfUrl, '_blank');
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
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
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
            <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Email Preview</h2>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              {template.title}
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

        {/* Actions */}
        <div style={{ 
          padding: '16px 24px', 
          borderBottom: '1px solid var(--color-border-tertiary)',
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={handleCopyEmail}
            className="btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Copy size={14} />
            Copy Email Text
          </button>
          
          <button
            onClick={handleCopyLink}
            className="btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Mail size={14} />
            Copy CSF Link
          </button>
          
          <button
            onClick={handleOpenLink}
            className="btn-sm btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <ExternalLink size={14} />
            Test CSF Form
          </button>
        </div>

        {/* Email Content */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <div style={{ padding: '24px' }}>
            <div style={{ 
              background: '#f8f9fa', 
              border: '1px solid var(--color-border-secondary)', 
              borderRadius: 'var(--border-radius-md)',
              overflow: 'hidden'
            }}>
              {/* Email Header */}
              <div style={{ 
                background: '#1A4B8C', 
                color: 'white', 
                padding: '20px', 
                textAlign: 'center' 
              }}>
                <h1 style={{ margin: 0, fontSize: '20px' }}>Department of Trade and Industry</h1>
                <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: '14px' }}>
                  Client Satisfaction Feedback Request
                </p>
              </div>

              {/* Email Body */}
              <div style={{ padding: '24px', background: 'white' }}>
                <h2 style={{ color: '#1A4B8C', marginTop: 0, fontSize: '18px' }}>
                  Your Feedback is Important to Us
                </h2>
                
                <p style={{ marginBottom: '16px' }}>Dear Valued Client,</p>
                
                <p style={{ marginBottom: '16px' }}>
                  We hope this message finds you well. As part of our commitment to continuous improvement, 
                  we would like to request your valuable feedback regarding the services you recently availed 
                  from the Department of Trade and Industry.
                </p>
                
                <p style={{ marginBottom: '16px' }}>
                  <strong>CSF Title:</strong> {template.title}
                </p>
                
                <div style={{ 
                  background: '#E6F1FB', 
                  border: '1px solid #1A4B8C', 
                  borderRadius: '6px', 
                  padding: '16px', 
                  margin: '20px 0' 
                }}>
                  <h3 style={{ marginTop: 0, color: '#1A4B8C', fontSize: '14px' }}>📋 How it works:</h3>
                  <ol style={{ margin: '8px 0', paddingLeft: '20px', fontSize: '14px' }}>
                    <li>Click the button below to access your personalized feedback form</li>
                    <li>Complete all required sections of the Client Satisfaction Form</li>
                    <li>Upon submission, you'll unlock access to the complete document</li>
                    <li>Download your document and keep it for your records</li>
                  </ol>
                </div>
                
                <div style={{ textAlign: 'center', margin: '24px 0' }}>
                  <a 
                    href={csfUrl}
                    style={{ 
                      display: 'inline-block', 
                      background: '#1A4B8C', 
                      color: 'white', 
                      padding: '12px 24px', 
                      textDecoration: 'none', 
                      borderRadius: '6px', 
                      fontWeight: 500 
                    }}
                  >
                    Complete Feedback Form
                  </a>
                </div>
                
                <p style={{ fontSize: '12px', marginBottom: '16px' }}>
                  <strong>Note:</strong> This link is personalized for your email address. 
                  Please do not share this link with others.
                </p>
                
                <p style={{ marginBottom: '16px' }}>
                  Your responses will help us enhance our services and better serve our clients. 
                  The form takes approximately 5-10 minutes to complete.
                </p>
                
                <p style={{ marginBottom: '16px' }}>
                  Thank you for your time and continued trust in our services.
                </p>
                
                <p style={{ marginBottom: 0 }}>
                  Sincerely,<br />
                  {template.createdBy}<br />
                  Department of Trade and Industry
                </p>
              </div>

              {/* Email Footer */}
              <div style={{ 
                background: '#f8f9fa', 
                padding: '16px', 
                textAlign: 'center', 
                fontSize: '12px', 
                color: '#666',
                borderTop: '1px solid #e9ecef'
              }}>
                <p style={{ margin: '0 0 4px 0' }}>
                  This is an automated message from the DTI Client Satisfaction System.
                </p>
                <p style={{ margin: 0 }}>
                  If you received this email in error, please disregard this message.
                </p>
              </div>
            </div>

            {/* Link Info */}
            <div style={{ 
              marginTop: '20px', 
              padding: '16px', 
              background: 'var(--color-background-secondary)', 
              borderRadius: 'var(--border-radius-md)',
              fontSize: '12px'
            }}>
              <div style={{ fontWeight: 500, marginBottom: '8px' }}>CSF Link Details:</div>
              <div style={{ 
                fontFamily: 'monospace', 
                background: 'var(--color-background-primary)', 
                padding: '8px', 
                borderRadius: '4px',
                wordBreak: 'break-all',
                fontSize: '11px'
              }}>
                {csfUrl}
              </div>
              <div style={{ marginTop: '8px', color: 'var(--color-text-secondary)' }}>
                Distribution: Manual (use copy link and email template buttons)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}