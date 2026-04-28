-- DTI CSF Online System - Firestore Database Schema
-- This is a conceptual SQL representation of the NoSQL Firestore structure
-- Firestore doesn't use SQL, but this helps visualize the data relationships

-- =====================================================
-- CSF Templates Collection
-- =====================================================
-- Collection: csf_templates
-- Purpose: Store CSF campaign templates created by admins

CREATE TABLE IF NOT EXISTS csf_templates (
    id VARCHAR(255) PRIMARY KEY,           -- Auto-generated document ID
    title VARCHAR(500) NOT NULL,          -- CSF campaign title
    description TEXT,                     -- Optional description
    preview_file_url VARCHAR(1000),       -- URL to preview/locked document
    full_file_url VARCHAR(1000),          -- URL to complete document
    created_by VARCHAR(255) NOT NULL,     -- Admin who created the template
    created_at TIMESTAMP NOT NULL,        -- Creation timestamp
    is_active BOOLEAN DEFAULT true,       -- Whether template is active
    recipients JSON NOT NULL,             -- Array of recipient email addresses
    custom_fields JSON,                   -- Optional custom form fields
    
    -- Indexes for performance
    INDEX idx_active_created (is_active, created_at DESC),
    INDEX idx_created_by (created_by),
    INDEX idx_created_at (created_at DESC)
);

-- Sample data structure:
-- {
--   "id": "template_123",
--   "title": "Q4 2024 Business Registration Feedback",
--   "description": "Quarterly feedback collection for business registration services",
--   "previewFileUrl": "https://storage.com/preview.pdf",
--   "fullFileUrl": "https://storage.com/complete.pdf",
--   "createdBy": "DTI Admin",
--   "createdAt": "2024-01-15T10:30:00Z",
--   "isActive": true,
--   "recipients": ["business1@email.com", "business2@email.com"]
-- }

-- =====================================================
-- CSF Responses Collection  
-- =====================================================
-- Collection: csf_responses
-- Purpose: Store customer feedback responses

CREATE TABLE IF NOT EXISTS csf_responses (
    id VARCHAR(255) PRIMARY KEY,          -- Auto-generated document ID
    csf_id VARCHAR(255) NOT NULL,         -- Reference to csf_templates
    name VARCHAR(255) NOT NULL,           -- Customer full name
    email VARCHAR(255) NOT NULL,          -- Customer email
    phone VARCHAR(50),                    -- Customer phone number
    client_type ENUM('Citizen', 'Business', 'Government') NOT NULL,
    sex ENUM('Male', 'Female') NOT NULL,
    age_bracket VARCHAR(50) NOT NULL,     -- Age range (e.g., "20-34")
    service VARCHAR(500) NOT NULL,        -- Service availed
    
    -- Citizen's Charter Questions
    cc1 VARCHAR(10) NOT NULL,             -- Awareness (1-4)
    cc2 VARCHAR(10) NOT NULL,             -- Visibility (1-4, N/A)
    cc3 VARCHAR(10) NOT NULL,             -- Helpfulness (1-3, N/A)
    
    -- Service Ratings (1-5 scale, 1=Strongly Agree, 5=Strongly Disagree)
    ratings JSON NOT NULL,                -- Object with r0-r8 ratings
    
    -- Comments
    reason TEXT,                          -- Reasons for disagree/neither
    suggestions TEXT,                     -- Improvement suggestions
    
    -- Metadata
    submission_date TIMESTAMP NOT NULL,   -- When form was submitted
    status ENUM('pending', 'completed') DEFAULT 'completed',
    created_at TIMESTAMP NOT NULL,        -- Firestore timestamp
    
    -- Indexes for performance
    INDEX idx_csf_id_created (csf_id, created_at DESC),
    INDEX idx_status_created (status, created_at DESC),
    INDEX idx_client_type_created (client_type, created_at DESC),
    INDEX idx_email (email),
    
    -- Foreign key relationship (conceptual)
    FOREIGN KEY (csf_id) REFERENCES csf_templates(id)
);

-- Sample ratings structure:
-- "ratings": {
--   "r0": 2,  -- Overall
--   "r1": 1,  -- Responsiveness  
--   "r2": 2,  -- Reliability
--   "r3": 2,  -- Access & Facilities
--   "r4": 1,  -- Communication
--   "r5": 3,  -- Costs
--   "r6": 1,  -- Integrity
--   "r7": 2,  -- Assurance
--   "r8": 2   -- Outcome
-- }

-- =====================================================
-- Email Notifications Collection
-- =====================================================
-- Collection: email_notifications  
-- Purpose: Track email delivery and response status

CREATE TABLE IF NOT EXISTS email_notifications (
    id VARCHAR(255) PRIMARY KEY,          -- Auto-generated document ID
    csf_id VARCHAR(255) NOT NULL,         -- Reference to csf_templates
    recipient_email VARCHAR(255) NOT NULL, -- Email address of recipient
    status ENUM('pending', 'sent', 'failed') NOT NULL,
    sent_at TIMESTAMP,                    -- When email was sent
    response_received BOOLEAN DEFAULT false, -- Whether customer responded
    response_id VARCHAR(255),             -- Reference to csf_responses (if responded)
    created_at TIMESTAMP NOT NULL,        -- Firestore timestamp
    updated_at TIMESTAMP,                 -- Last update timestamp
    
    -- Indexes for performance
    INDEX idx_csf_id_created (csf_id, created_at DESC),
    INDEX idx_status_created (status, created_at DESC),
    INDEX idx_csf_email (csf_id, recipient_email),
    INDEX idx_recipient_email (recipient_email),
    
    -- Foreign key relationships (conceptual)
    FOREIGN KEY (csf_id) REFERENCES csf_templates(id),
    FOREIGN KEY (response_id) REFERENCES csf_responses(id)
);

-- =====================================================
-- Data Relationships & Business Logic
-- =====================================================

-- 1. CSF Template → Email Notifications (1:Many)
--    One template can have multiple email notifications (one per recipient)

-- 2. CSF Template → CSF Responses (1:Many)  
--    One template can receive multiple customer responses

-- 3. Email Notification → CSF Response (1:1)
--    Each email notification can have at most one response

-- 4. Customer Journey:
--    Template Created → Email Sent → Customer Responds → Document Unlocked

-- =====================================================
-- Query Patterns & Performance Considerations
-- =====================================================

-- Common queries and their Firestore equivalents:

-- 1. Get active CSF templates
-- SELECT * FROM csf_templates WHERE is_active = true ORDER BY created_at DESC;
-- Firestore: collection('csf_templates').where('isActive', '==', true).orderBy('createdAt', 'desc')

-- 2. Get responses for a specific CSF
-- SELECT * FROM csf_responses WHERE csf_id = 'template_123' ORDER BY created_at DESC;
-- Firestore: collection('csf_responses').where('csfId', '==', 'template_123').orderBy('createdAt', 'desc')

-- 3. Get response analytics by client type
-- SELECT client_type, COUNT(*), AVG(rating_overall) FROM csf_responses GROUP BY client_type;
-- Firestore: Requires client-side aggregation or Cloud Functions

-- 4. Get email delivery status for CSF
-- SELECT status, COUNT(*) FROM email_notifications WHERE csf_id = 'template_123' GROUP BY status;
-- Firestore: collection('email_notifications').where('csfId', '==', 'template_123')

-- =====================================================
-- Data Validation Rules
-- =====================================================

-- CSF Templates:
-- - title: required, non-empty string
-- - recipients: required array with at least one valid email
-- - isActive: required boolean
-- - createdAt: required ISO date string

-- CSF Responses:
-- - csfId: required, must reference existing template
-- - email: required, valid email format
-- - ctype: must be one of: 'Citizen', 'Business', 'Government'
-- - sex: must be one of: 'Male', 'Female'
-- - ratings: required object with r0-r8 numeric values (1-5)

-- Email Notifications:
-- - csfId: required, must reference existing template
-- - recipientEmail: required, valid email format
-- - status: must be one of: 'pending', 'sent', 'failed'

-- =====================================================
-- Security Considerations
-- =====================================================

-- 1. Admin Operations (csf_templates):
--    - Only authenticated admins can create/update/delete templates
--    - Read access for dashboard analytics

-- 2. Customer Operations (csf_responses):
--    - Customers can only create responses (no updates/deletes)
--    - Responses are linked to specific CSF templates
--    - Email validation ensures responses come from invited recipients

-- 3. System Operations (email_notifications):
--    - Only system/admin can create and update notifications
--    - Used for tracking and analytics

-- =====================================================
-- Backup & Recovery Strategy
-- =====================================================

-- 1. Automated daily backups using Firebase scheduled exports
-- 2. Point-in-time recovery for accidental data loss
-- 3. Cross-region replication for disaster recovery
-- 4. Regular data export for compliance and archival

-- Export command:
-- gcloud firestore export gs://backup-bucket/$(date +%Y-%m-%d)

-- =====================================================
-- Monitoring & Alerting
-- =====================================================

-- Key metrics to monitor:
-- 1. Response submission rate (responses/invitations sent)
-- 2. Email delivery success rate
-- 3. Average satisfaction scores
-- 4. Database read/write operations
-- 5. Storage usage and costs

-- Set up alerts for:
-- - Failed email deliveries
-- - Unusual response patterns
-- - Database quota approaching limits
-- - Security rule violations