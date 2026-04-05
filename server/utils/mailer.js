import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true' || false,
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL_USER,
    pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
  },
})

export async function sendOTPEmail(email, otp) {
  try {
    console.log('Sending OTP to:', email)

    await transporter.sendMail({
      from: `"Secure Voting System" <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Secure Voting OTP Verification',
      html: `
        <div style="font-family: Arial, sans-serif; line-height:1.4;">
          <h2>Secure Voting Verification</h2>
          <p>Your one-time password (OTP) is:</p>
          <p style="font-size: 28px; font-weight: bold; letter-spacing: 2px;">${otp}</p>
          <p>This code will expire in <strong>10 minutes</strong>.</p>
          <hr />
          <p>If you did not request this, you can ignore this email.</p>
        </div>
      `,
    })

    console.log('OTP email sent successfully')
  } catch (error) {
    console.error('Email sending failed:', error)
  }
}

