const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

// Create Nodemailer Transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT) || 2525,
    auth: {
        user: process.env.SMTP_USER || 'demo_user',
        pass: process.env.SMTP_PASS || 'demo_pass'
    }
});

/**
 * Send Transaction Alert Notification Email
 */
const sendTransactionNotification = async (email, recipientName, txnDetails) => {
    const mailOptions = {
        from: `"Somesh National Bank" <${process.env.FROM_EMAIL || 'noreply@antigravitybank.com'}>`,
        to: email,
        subject: `Transaction Alert: ${txnDetails.transaction_type.toUpperCase()} of ₹${txnDetails.amount}`,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px;">
                <div style="background-color: #0f172a; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="color: #38bdf8; margin: 0; font-size: 24px;">Somesh National Bank</h1>
                </div>
                <div style="padding: 20px;">
                    <h2>Dear ${recipientName},</h2>
                    <p>This is an automated alert for a recent transaction on your bank account.</p>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                        <tr style="border-bottom: 1px solid #cbd5e1;"><td style="padding: 8px 0; font-weight: bold;">Reference No:</td><td>${txnDetails.reference_number}</td></tr>
                        <tr style="border-bottom: 1px solid #cbd5e1;"><td style="padding: 8px 0; font-weight: bold;">Type:</td><td>${txnDetails.transaction_type.toUpperCase()}</td></tr>
                        <tr style="border-bottom: 1px solid #cbd5e1;"><td style="padding: 8px 0; font-weight: bold;">Amount:</td><td style="font-weight: bold; color: ${txnDetails.transaction_type.includes('withdrawal') || txnDetails.transaction_type.includes('debit') ? '#ef4444' : '#22c55e'};">₹${txnDetails.amount}</td></tr>
                        <tr style="border-bottom: 1px solid #cbd5e1;"><td style="padding: 8px 0; font-weight: bold;">Description:</td><td>${txnDetails.description}</td></tr>
                        <tr style="border-bottom: 1px solid #cbd5e1;"><td style="padding: 8px 0; font-weight: bold;">Date:</td><td>${new Date().toLocaleString()}</td></tr>
                    </table>
                    <p style="margin-top: 20px;">If you did not authorize this transaction, please contact our 24x7 customer support immediately.</p>
                    <p>Regards,<br><strong>Somesh National Bank Team</strong></p>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✉️ Email notification sent to ${email}`);
    } catch (error) {
        console.log(`✉️ Simulated Email (SMTP not configured) to ${email}:`, mailOptions.subject);
    }
};

/**
 * Send Password Reset Token Email
 */
const sendPasswordResetEmail = async (email, resetToken) => {
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    const mailOptions = {
        from: `"Somesh National Bank" <${process.env.FROM_EMAIL || 'noreply@antigravitybank.com'}>`,
        to: email,
        subject: `Password Reset Request - Somesh National Bank`,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px;">
                <div style="background-color: #0f172a; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="color: #38bdf8; margin: 0; font-size: 24px;">Somesh National Bank</h1>
                </div>
                <div style="padding: 20px;">
                    <h2>Password Reset Request</h2>
                    <p>You requested a password reset for your account. Please click the button below to set a new password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
                    </div>
                    <p>Or use reset token: <code>${resetToken}</code></p>
                    <p>This link is valid for 1 hour. If you did not request this, please ignore this email.</p>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✉️ Password reset email sent to ${email}`);
    } catch (error) {
        console.log(`✉️ Simulated Password Reset Email to ${email}. Token: ${resetToken}`);
    }
};

module.exports = {
    sendTransactionNotification,
    sendPasswordResetEmail
};
