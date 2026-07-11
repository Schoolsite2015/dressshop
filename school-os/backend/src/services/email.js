import nodemailer from "nodemailer";

// Create a reusable transporter using default SMTP transport
// In production, configure these via environment variables (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.ethereal.email",
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || "demo_user", // ethereal test account
    pass: process.env.SMTP_PASS || "demo_pass",
  },
});

/**
 * Sends an email notification
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} htmlContent - HTML formatted email body
 */
export const sendEmail = async (to, subject, htmlContent) => {
  try {
    const info = await transporter.sendMail({
      from: '"School OS Notifications" <no-reply@schoolos.demo>',
      to,
      subject,
      html: htmlContent,
    });
    console.log("Message sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};
