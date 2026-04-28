# DTI CSF Online System

A comprehensive Client Satisfaction Feedback (CSF) system for the Department of Trade and Industry (DTI) built with Next.js, Firebase Firestore, and deployed on Vercel.

## 🔄 System Workflow

The system follows this admin-customer workflow:

1. **Admin Creates CSF** → Admin creates a new CSF template with preview/full document URLs
2. **Send to Customers** → System sends personalized email invitations to recipients  
3. **Customer Receives Email** → Customer gets email with unique CSF link
4. **Customer Completes Form** → Customer fills out the feedback form to unlock document
5. **Admin Receives Feedback** → Admin can view responses and analytics in dashboard

## 🚀 Key Features

**Admin Features:**
- **CSF Template Management**: Create and manage multiple CSF campaigns
- **Email Distribution**: Send personalized invitations to customer lists
- **Real-time Dashboard**: Monitor response rates and satisfaction metrics
- **Response Analytics**: Comprehensive analytics with performance heatmaps
- **Document Gating**: Control access to documents via form completion

**Customer Features:**
- **Gated Content Access**: Must complete CSF form to unlock documents
- **Progressive Form**: Visual progress tracking with real-time validation
- **Document Preview**: Blurred preview of locked content
- **Instant Download**: Immediate access to full document after submission

**Technical Features:**
- **Cloud Database**: Secure data storage with Firebase Firestore
- **Email Integration**: Automated invitation system with HTML templates
- **Responsive Design**: Works seamlessly on all devices
- **Real-time Updates**: Live dashboard updates when responses are submitted

## 📊 System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Admin Panel   │    │   Email Service  │    │  Customer View  │
│                 │    │                  │    │                 │
│ • Create CSF    │───▶│ • Send invites   │───▶│ • Receive email │
│ • Manage users  │    │ • Track delivery │    │ • Complete form │
│ • View analytics│    │ • Handle bounces │    │ • Download doc  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  ▼
                    ┌──────────────────────────┐
                    │    Firebase Firestore    │
                    │                          │
                    │ • CSF Templates         │
                    │ • Customer Responses    │
                    │ • Email Notifications   │
                    │ • Analytics Data        │
                    └──────────────────────────┘
```

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Database**: Firebase Firestore (NoSQL, real-time)
- **Email**: Configurable (SendGrid, AWS SES, Resend)
- **Deployment**: Vercel (seamless GitHub integration)
- **Styling**: Modern CSS with custom properties
- **Icons**: Lucide React

## 📁 Project Structure

```
csf-ord-online/
├── app/
│   ├── csf/page.tsx           # Customer CSF form page
│   ├── globals.css            # Global styles
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Admin dashboard
├── components/
│   ├── AdminCSFManager.tsx    # CSF template management
│   ├── Analytics.tsx          # Analytics dashboard
│   ├── CustomerCSFView.tsx    # Customer form interface
│   ├── Dashboard.tsx          # Admin dashboard
│   ├── Responses.tsx          # Response management
│   └── Sidebar.tsx            # Navigation
├── lib/
│   ├── email.ts               # Email service integration
│   ├── firebase.ts            # Firebase configuration
│   └── firestore.ts           # Database operations
├── types/
│   └── index.ts               # TypeScript definitions
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- Firebase project with Firestore enabled
- Email service account (SendGrid, AWS SES, or Resend)
- Vercel account (for deployment)

### Installation

1. **Clone and install:**
```bash
git clone <repository-url>
cd csf-ord-online
npm install
```

2. **Set up Firebase:**
   - Create project at https://console.firebase.google.com
   - Enable Firestore Database
   - Get configuration from Project Settings

3. **Configure environment:**
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your credentials:
```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email Service (choose one)
SENDGRID_API_KEY=your_sendgrid_key
# OR
RESEND_API_KEY=your_resend_key
# OR
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
```

4. **Run development server:**
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) for admin panel
Visit [http://localhost:3000/csf?id=CSF_ID&email=EMAIL](http://localhost:3000/csf) for customer form

## 📧 Email Integration

The system supports multiple email providers:

### SendGrid Setup
```bash
npm install @sendgrid/mail
```

### AWS SES Setup  
```bash
npm install aws-sdk
```

### Resend Setup
```bash
npm install resend
```

Email templates are automatically generated with:
- Personalized CSF links
- Professional DTI branding
- Clear instructions for customers
- Mobile-responsive design

## 🔒 Security Features

- **Personalized Links**: Each customer gets a unique, email-specific URL
- **Form Validation**: Server-side validation prevents invalid submissions
- **Access Control**: Documents only accessible after form completion
- **Data Privacy**: Compliant with data protection requirements
- **Secure Storage**: All data encrypted in Firebase Firestore

## 📊 Analytics & Reporting

The system provides comprehensive analytics:

- **Response Rates**: Track completion rates per CSF campaign
- **Satisfaction Metrics**: Average ratings and satisfaction percentages  
- **Criteria Performance**: Heatmap showing performance across rating criteria
- **Client Demographics**: Breakdown by client type, age, and other factors
- **Trend Analysis**: Response patterns over time

## 🚀 Deployment

### Deploy to Vercel

1. **Push to GitHub:**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Connect to Vercel:**
   - Import repository in Vercel dashboard
   - Add environment variables
   - Deploy automatically

3. **Configure domain:**
   - Set up custom domain in Vercel
   - Update `NEXT_PUBLIC_APP_URL` environment variable

### Manual Deployment
```bash
npm run build
npm start
```

## 🔧 Configuration

### Firestore Collections

The system uses these Firestore collections:

- `csf_templates`: CSF campaign templates
- `csf_responses`: Customer form submissions  
- `email_notifications`: Email delivery tracking

### Email Templates

Customize email templates in `lib/email.ts`:
- Modify HTML/text content
- Update branding and styling
- Add custom fields or instructions

### Form Fields

Modify form fields in `components/CustomerCSFView.tsx`:
- Add custom questions
- Change rating criteria
- Update validation rules

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support or questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 System Flow Example

1. **Admin creates CSF**: "Q4 2024 Business Registration Feedback"
2. **Admin uploads documents**: Preview PDF + Complete PDF to cloud storage
3. **Admin adds recipients**: business1@email.com, business2@email.com
4. **System sends emails**: Personalized invitations with unique links
5. **Customer clicks link**: Opens form with blurred document preview
6. **Customer completes form**: Provides ratings and feedback
7. **Document unlocks**: Customer can download complete PDF
8. **Admin views feedback**: Real-time dashboard updates with new response

This creates a seamless feedback-for-access exchange that ensures data collection while providing value to customers.