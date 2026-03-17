const nodemailer = require('nodemailer');

// SMTP config via environment variables
// Gmail example: SMTP_HOST=smtp.gmail.com SMTP_PORT=587 SMTP_USER=you@gmail.com SMTP_PASS=your-app-password
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: (process.env.SMTP_PORT || '587') === '465',
    auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
    }
});

const RECIPIENT = process.env.CONTACT_EMAIL || 'dasachin@xdotai.in';

async function sendContactEmail({ name, email, company, message }) {
    // If SMTP not configured, just log
    if (!process.env.SMTP_USER) {
        console.log('📧 [Contact Form] No SMTP configured. Submission from:', name, email);
        console.log('   Company:', company || 'N/A');
        console.log('   Message:', message);
        return { success: true, method: 'logged' };
    }

    const mailOptions = {
        from: `"X DOT AI Website" <${process.env.SMTP_USER}>`,
        to: RECIPIENT,
        replyTo: email,
        subject: `🔔 New Contact: ${name}${company ? ' (' + company + ')' : ''}`,
        html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#7c3aed;color:#fff;padding:20px;border-radius:8px 8px 0 0;">
          <h2 style="margin:0;">New Contact Form Submission</h2>
        </div>
        <div style="background:#1a1a2e;color:#e0e0e0;padding:20px;border-radius:0 0 8px 8px;">
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}" style="color:#a78bfa;">${email}</a></p>
          <p><strong>Company:</strong> ${company || 'N/A'}</p>
          <hr style="border:1px solid #333;">
          <p><strong>Message:</strong></p>
          <p style="background:#0a0a0f;padding:15px;border-radius:6px;white-space:pre-wrap;">${message}</p>
        </div>
      </div>
    `
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true, method: 'email' };
    } catch (err) {
        console.error('📧 Email send error:', err.message);
        return { success: false, error: err.message };
    }
}

module.exports = { sendContactEmail };
