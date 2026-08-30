// Email Service
// Handles sending emails via configurable provider

const nodemailer = require("nodemailer");
const emailConfig = require("../config/email");

let transporter = null;

// Initialize email transporter based on provider
const initializeTransporter = async () => {
  if (transporter) return transporter;

  if (emailConfig.provider === "nodemailer") {
    transporter = nodemailer.createTransport({
      host: emailConfig.nodemailer.host,
      port: emailConfig.nodemailer.port,
      secure: emailConfig.nodemailer.secure,
      auth: {
        user: emailConfig.nodemailer.auth.user,
        pass: emailConfig.nodemailer.auth.pass,
      },
    });

    // Verify connection
    try {
      await transporter.verify();
      console.log("✅ Email service initialized successfully");
    } catch (error) {
      console.error("⚠️ Email service initialization failed:", error.message);
      console.error(
        "Email notifications may not work. Check your SMTP configuration.",
      );
    }
  } else if (emailConfig.provider === "sendgrid") {
    const sgMail = require("@sendgrid/mail");
    sgMail.setApiKey(emailConfig.sendgrid.apiKey);
    transporter = sgMail;
  }

  return transporter;
};

/**
 * Send registration approval request to admins
 * @param {Object} user - User object with id, name, email, role, branch
 * @returns {Promise<Object>} - Send result
 */
const sendRegistrationApprovalRequest = async (user) => {
  try {
    await initializeTransporter();

    const adminEmails = emailConfig.adminEmails.split(",").map((e) => e.trim());

    const htmlContent = `
      <h2>New User Registration Request</h2>
      <p>A new user has registered and requires approval.</p>
      
      <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
        <tr style="background: #f5f5f5;">
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Name:</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${user.name}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Email:</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${user.email}</td>
        </tr>
        <tr style="background: #f5f5f5;">
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Role:</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${user.role}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Branch:</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${user.branch || "Head Office"}</td>
        </tr>
        <tr style="background: #f5f5f5;">
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Status:</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;"><span style="color: orange; font-weight: bold;">Pending Approval</span></td>
        </tr>
      </table>

      <p style="margin-top: 20px;">Please log in to the admin panel to approve or reject this registration request.</p>
    `;

    const mailOptions = {
      from: `${emailConfig.fromName} <${emailConfig.from}>`,
      to: adminEmails.join(","),
      subject: `New Registration Request - ${user.name}`,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Approval request email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Error sending approval request email:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send approval confirmation to user
 * @param {Object} user - User object
 * @returns {Promise<Object>} - Send result
 */
const sendApprovalConfirmation = async (user) => {
  try {
    await initializeTransporter();

    const htmlContent = `
      <h2>Registration Approved ✅</h2>
      <p>Hi ${user.name},</p>
      
      <p>Your registration has been approved! You can now log in to the system.</p>
      
      <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Login Details:</strong></p>
        <p>Email: ${user.email}</p>
        <p>Role: ${user.role}</p>
        <p>Branch: ${user.branch || "BKSI-PUP"}</p>
      </div>

      <p>You can access the system at: <a href="${process.env.FRONTEND_URL || "https://rajacirengbekasi.web.id"}/login">Login Page</a></p>
      
      <p style="color: #666; font-size: 12px; margin-top: 30px;">
        If you didn't create this account, please contact your administrator.
      </p>
    `;

    const mailOptions = {
      from: `${emailConfig.fromName} <${emailConfig.from}>`,
      to: user.email,
      subject: "Your Registration Has Been Approved",
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Approval confirmation email sent to:", user.email);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(
      "❌ Error sending approval confirmation email:",
      error.message,
    );
    return { success: false, error: error.message };
  }
};

/**
 * Send rejection notification to user
 * @param {Object} user - User object
 * @param {string} reason - Rejection reason
 * @returns {Promise<Object>} - Send result
 */
const sendRejectionNotification = async (user, reason = "") => {
  try {
    await initializeTransporter();

    const htmlContent = `
      <h2>Registration Request Declined</h2>
      <p>Hi ${user.name},</p>
      
      <p>Unfortunately, your registration request has been declined.</p>
      
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
      
      <p>Please contact your administrator if you have questions about this decision.</p>
      
      <p style="color: #666; font-size: 12px; margin-top: 30px;">
        Business Report System
      </p>
    `;

    const mailOptions = {
      from: `${emailConfig.fromName} <${emailConfig.from}>`,
      to: user.email,
      subject: "Your Registration Request Has Been Declined",
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Rejection notification email sent to:", user.email);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(
      "❌ Error sending rejection notification email:",
      error.message,
    );
    return { success: false, error: error.message };
  }
};

/**
 * Check if email service is configured
 * @returns {boolean}
 */
const isConfigured = () => {
  if (emailConfig.provider === "nodemailer") {
    return !!(
      emailConfig.nodemailer.auth.user && emailConfig.nodemailer.auth.pass
    );
  } else if (emailConfig.provider === "sendgrid") {
    return !!emailConfig.sendgrid.apiKey;
  }
  return false;
};

module.exports = {
  initializeTransporter,
  sendRegistrationApprovalRequest,
  sendApprovalConfirmation,
  sendRejectionNotification,
  isConfigured,
};
