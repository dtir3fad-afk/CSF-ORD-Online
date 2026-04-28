// Email service for sending CSF invitations
// In a production environment, you would integrate with services like:
// - SendGrid
// - AWS SES
// - Nodemailer with SMTP
// - Resend
// - Postmark

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export const generateCSFInvitationEmail = (
  recipientEmail: string,
  csfTitle: string,
  csfId: string,
  adminName: string = 'DTI Admin'
): EmailTemplate => {
  const csfUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/csf?id=${csfId}&email=${encodeURIComponent(recipientEmail)}`;
  
  const subject = `DTI Client Satisfaction Feedback - ${csfTitle}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1A4B8C; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #1A4B8C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        .preview-note { background: #E6F1FB; border: 1px solid #1A4B8C; border-radius: 6px; padding: 15px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 24px;">Department of Trade and Industry</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Client Satisfaction Feedback Request</p>
        </div>
        
        <div class="content">
          <h2 style="color: #1A4B8C; margin-top: 0;">Your Feedback is Important to Us</h2>
          
          <p>Dear Valued Client,</p>
          
          <p>We hope this message finds you well. As part of our commitment to continuous improvement, we would like to request your valuable feedback regarding the services you recently availed from the Department of Trade and Industry.</p>
          
          <p><strong>CSF Title:</strong> ${csfTitle}</p>
          
          <div class="preview-note">
            <h3 style="margin-top: 0; color: #1A4B8C;">📋 How it works:</h3>
            <ol style="margin: 10px 0; padding-left: 20px;">
              <li>Click the button below to access your personalized feedback form</li>
              <li>Complete all required sections of the Client Satisfaction Form</li>
              <li>Upon submission, you'll unlock access to the complete document</li>
              <li>Download your document and keep it for your records</li>
            </ol>
          </div>
          
          <p>Your responses will help us enhance our services and better serve our clients. The form takes approximately 5-10 minutes to complete.</p>
          
          <div style="text-align: center;">
            <a href="${csfUrl}" class="button">Complete Feedback Form</a>
          </div>
          
          <p><small><strong>Note:</strong> This link is personalized for your email address. Please do not share this link with others.</small></p>
          
          <p>If you have any questions or concerns, please don't hesitate to contact us.</p>
          
          <p>Thank you for your time and continued trust in our services.</p>
          
          <p>Sincerely,<br>
          ${adminName}<br>
          Department of Trade and Industry</p>
        </div>
        
        <div class="footer">
          <p>This is an automated message from the DTI Client Satisfaction System.</p>
          <p>If you received this email in error, please disregard this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
Department of Trade and Industry
Client Satisfaction Feedback Request

Dear Valued Client,

We hope this message finds you well. As part of our commitment to continuous improvement, we would like to request your valuable feedback regarding the services you recently availed from the Department of Trade and Industry.

CSF Title: ${csfTitle}

How it works:
1. Visit the link below to access your personalized feedback form
2. Complete all required sections of the Client Satisfaction Form  
3. Upon submission, you'll unlock access to the complete document
4. Download your document and keep it for your records

Your responses will help us enhance our services and better serve our clients. The form takes approximately 5-10 minutes to complete.

Complete your feedback form here: ${csfUrl}

Note: This link is personalized for your email address. Please do not share this link with others.

If you have any questions or concerns, please don't hesitate to contact us.

Thank you for your time and continued trust in our services.

Sincerely,
${adminName}
Department of Trade and Industry

---
This is an automated message from the DTI Client Satisfaction System.
If you received this email in error, please disregard this message.
  `;

  return {
    to: recipientEmail,
    subject,
    html,
    text
  };
};

// Mock email sending function
// In production, replace this with actual email service integration
export const sendEmail = async (emailData: EmailTemplate): Promise<boolean> => {
  try {
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Log email for development
    console.log('📧 Email would be sent:', {
      to: emailData.to,
      subject: emailData.subject,
      // Don't log full content in production
    });
    
    // In production, integrate with your email service:
    /*
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emailData)
    });
    return response.ok;
    */
    
    return true; // Mock success
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
};

export const sendCSFInvitations = async (
  recipients: string[],
  csfTitle: string,
  csfId: string,
  adminName?: string
): Promise<{ sent: number; failed: number; results: Array<{ email: string; success: boolean }> }> => {
  const results = [];
  let sent = 0;
  let failed = 0;

  for (const email of recipients) {
    try {
      const emailTemplate = generateCSFInvitationEmail(email, csfTitle, csfId, adminName);
      const success = await sendEmail(emailTemplate);
      
      results.push({ email, success });
      
      if (success) {
        sent++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`Failed to send email to ${email}:`, error);
      results.push({ email, success: false });
      failed++;
    }
  }

  return { sent, failed, results };
};