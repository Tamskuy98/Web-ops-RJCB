// Email service configuration
// Supports multiple providers (Nodemailer, SendGrid, etc.)

module.exports = {
  // Email provider: 'nodemailer' or 'sendgrid'
  provider: process.env.EMAIL_PROVIDER || "nodemailer",

  // Nodemailer configuration
  nodemailer: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  },

  // SendGrid configuration
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY || "",
  },

  // Email defaults
  from: process.env.EMAIL_FROM,
  fromName: process.env.EMAIL_FROM_NAME,

  // Admin emails for notifications (comma-separated)
  adminEmails: process.env.ADMIN_EMAILS,
};
