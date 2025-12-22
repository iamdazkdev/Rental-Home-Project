const nodemailer = require("nodemailer");

// Email configuration
const createTransporter = () => {
  // Gmail SMTP configuration
  if (process.env.EMAIL_SERVICE === "gmail") {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD, // Use App Password, not regular password
      },
    });
  }

  // Custom SMTP configuration
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  // Development mode - use ethereal email (fake SMTP)
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    auth: {
      user: "ethereal.user@ethereal.email",
      pass: "ethereal.pass",
    },
  });
};

// Email templates
const getPasswordResetTemplate = (resetLink, firstName = "User") => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password - Dream Nest</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
                background: linear-gradient(135deg, #F8395A 0%, #e91e63 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 700;
            }
            .content {
                padding: 40px 30px;
            }
            .content h2 {
                color: #333;
                margin-bottom: 20px;
            }
            .content p {
                color: #666;
                margin-bottom: 20px;
                font-size: 16px;
            }
            .reset-button {
                display: inline-block;
                background: linear-gradient(135deg, #F8395A 0%, #e91e63 100%);
                color: white;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                margin: 20px 0;
                transition: transform 0.2s ease;
            }
            .reset-button:hover {
                transform: translateY(-2px);
            }
            .security-notice {
                background: #f8f9fa;
                border-left: 4px solid #F8395A;
                padding: 15px 20px;
                margin: 20px 0;
                border-radius: 0 8px 8px 0;
            }
            .security-notice p {
                margin: 0;
                color: #555;
                font-size: 14px;
            }
            .footer {
                background: #f8f9fa;
                padding: 30px;
                text-align: center;
                color: #888;
                font-size: 14px;
            }
            .footer a {
                color: #F8395A;
                text-decoration: none;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🏠 Dream Nest</h1>
                <p>Your trusted rental home platform</p>
            </div>
            
            <div class="content">
                <h2>Hi ${firstName},</h2>
                
                <p>We received a request to reset your password for your Dream Nest account. If you made this request, click the button below to reset your password:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}" class="reset-button">Reset My Password</a>
                </div>
                
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #F8395A; background: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace;">
                    ${resetLink}
                </p>
                
                <div class="security-notice">
                    <p><strong>🔒 Security Notice:</strong></p>
                    <p>• This link will expire in 1 hour for your security</p>
                    <p>• If you didn't request this reset, you can safely ignore this email</p>
                    <p>• Your password will remain unchanged until you create a new one</p>
                </div>
                
                <p>If you're having trouble with the button above, you can also reset your password by visiting our website and using the "Forgot Password" feature.</p>
                
                <p>Best regards,<br>The Dream Nest Team</p>
            </div>
            
            <div class="footer">
                <p>This email was sent by Dream Nest. If you have any questions, please contact us at <a href="mailto:support@dreamnest.com">support@dreamnest.com</a></p>
                <p>&copy; 2025 Dream Nest. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetLink, firstName) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: "Dream Nest",
        address:
          process.env.EMAIL_FROM ||
          process.env.EMAIL_USER ||
          "noreply@dreamnest.com",
      },
      to: email,
      subject: "🔒 Reset Your Dream Nest Password",
      html: getPasswordResetTemplate(resetLink, firstName),
      // Text fallback for clients that don't support HTML
      text: `
        Hi ${firstName},

        We received a request to reset your password for your Dream Nest account.
        
        Click this link to reset your password: ${resetLink}
        
        This link will expire in 1 hour for your security.
        
        If you didn't request this reset, you can safely ignore this email.
        
        Best regards,
        The Dream Nest Team
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("Password reset email sent:", info.messageId);

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (process.env.NODE_ENV === "development" && previewUrl) {
      console.log("Preview URL:", previewUrl);
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl,
    };
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw new Error("Failed to send password reset email");
  }
};

// Verify email configuration
const verifyEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log("✅ Email configuration verified successfully");
    return true;
  } catch (error) {
    console.error("❌ Email configuration error:", error.message);
    return false;
  }
};

module.exports = {
  sendPasswordResetEmail,
  verifyEmailConfig,
  createTransporter,
};
