export interface CSFResponse {
  id?: string;
  csfId: string; // Links to the CSF template
  name: string;
  email: string;
  phone: string;
  ctype: 'Citizen' | 'Business' | 'Government';
  sex: 'Male' | 'Female';
  age: '19 or lower' | '20-34' | '35-49' | '50-64' | '65+';
  service: string;
  cc1: string;
  cc2: string;
  cc3: string;
  ratings: Record<string, number>;
  reason: string;
  suggest: string;
  date: string;
  status: 'pending' | 'completed';
}

export interface CSFTemplate {
  id?: string;
  title: string;
  description: string;
  previewFileUrl: string; // URL to the preview/locked document
  fullFileUrl: string; // URL to the complete document
  createdBy: string; // Admin who created it
  createdAt: string;
  isActive: boolean;
  recipients: string[]; // Email addresses to send to
  customFields?: CustomField[];
}

export interface CustomField {
  id: string;
  label: string;
  type: 'text' | 'select' | 'textarea' | 'rating';
  required: boolean;
  options?: string[]; // For select fields
}

export interface EmailNotification {
  id?: string;
  csfId: string;
  recipientEmail: string;
  status: 'pending' | 'sent' | 'failed';
  sentAt?: string;
  responseReceived?: boolean;
  responseId?: string;
}

export interface DashboardMetrics {
  totalCSFs: number;
  totalResponses: number;
  avgRating: number;
  satisfactionRate: number;
  pendingResponses: number;
}