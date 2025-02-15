import nodemailer from 'nodemailer';

const isDevelopment = process.env.NODE_ENV !== 'production';

// Create reusable transporter object using ethereal for development and Gmail for production
const createTransporter = async () => {
  if (isDevelopment) {
    // Generate test SMTP service account from ethereal.email
    const testAccount = await nodemailer.createTestAccount();
    
    console.log('Ethereal Email Account:', {
      user: testAccount.user,
      pass: testAccount.pass,
      web: 'https://ethereal.email'
    });

    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  } else {
    // Create Gmail transporter
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }
};

let emailTransporter: nodemailer.Transporter;

export const getEmailTransporter = async () => {
  if (!emailTransporter) {
    emailTransporter = await createTransporter();
  }
  return emailTransporter;
};

export const isUsingDevEmail = () => isDevelopment;
