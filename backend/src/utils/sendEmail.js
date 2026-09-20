import nodemailer from 'nodemailer';

/**
 * Send email utility with graceful development fallback
 * @param {Object} options - { email, subject, message, html }
 */
const sendEmail = async (options) => {
  let transporter;

  const hasLiveCredentials =
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.SMTP_USER.trim() !== '';

  if (hasLiveCredentials) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Development / College Demo mode: fallback to Ethereal or Console Logger
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } catch (err) {
      console.warn('[Email Warning] Ethereal creation failed, using console fallback:', err.message);
      transporter = null;
    }
  }

  const mailOptions = {
    from: `${process.env.FROM_NAME || 'Hospital Management System'} <${
      process.env.FROM_EMAIL || 'no-reply@hms.local'
    }>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || `<p>${options.message}</p>`,
  };

  if (!transporter) {
    console.log('\n================== [LOCAL EMAIL DISPATCH] ==================');
    console.log(`To: ${options.email}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Message:\n${options.message}`);
    console.log('============================================================\n');
    return { success: true, previewUrl: null };
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);

    console.log('\n================== [EMAIL SENT] ==================');
    console.log(`Message sent to: ${options.email}`);
    console.log(`Message ID: ${info.messageId}`);
    if (previewUrl) {
      console.log(`Preview Email in Browser: ${previewUrl}`);
    }
    console.log('==================================================\n');

    return { success: true, messageId: info.messageId, previewUrl };
  } catch (error) {
    console.error(`[Email Error] Failed to send email: ${error.message}`);
    console.log('\n================== [FALLBACK EMAIL LOG] ==================');
    console.log(`To: ${options.email}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Message:\n${options.message}`);
    console.log('==========================================================\n');
    return { success: false, error: error.message };
  }
};

export default sendEmail;
