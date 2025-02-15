import nodemailer from 'nodemailer';
import { getEmailTransporter, isUsingDevEmail } from '../config/email.config';
import { IOrder, IOrderDocument } from '../models/order.model';
import { IUser, IUserDocument } from '../models/user.model';
import type { SentMessageInfo } from 'nodemailer';

interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

export class EmailService {
  private static transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });

  static async sendMail(options: EmailOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: Array.isArray(options.to) ? options.to.join(',') : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html
      });
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error('Email sending failed');
    }
  }

  static async sendOrderConfirmation(order: IOrderDocument | IOrder, user: IUserDocument | IUser) {
    try {
      const emailResponse: SentMessageInfo = await this.sendMail({
        to: isUsingDevEmail() ? 'test@example.com' : user.email,
        subject: `Order Confirmation #${order._id?.toString() || 'New'}`,
        html: this.getOrderConfirmationTemplate(order, user)
      });

      if (isUsingDevEmail() && nodemailer.getTestMessageUrl(emailResponse)) {
        console.log('Preview URL:', nodemailer.getTestMessageUrl(emailResponse));
      }
    } catch (error) {
      console.error('Order confirmation email error:', error);
      if (!isUsingDevEmail()) {
        throw new Error('Failed to send order confirmation email');
      }
    }
  }

  static async sendPasswordReset(user: IUser, resetToken: string) {
    try {
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      
      const emailResponse: SentMessageInfo = await this.sendMail({
        to: isUsingDevEmail() ? 'test@example.com' : user.email,
        subject: 'Password Reset Request',
        html: this.getPasswordResetTemplate(user.firstName, resetLink)
      });

      if (isUsingDevEmail() && nodemailer.getTestMessageUrl(emailResponse)) {
        console.log('Preview URL:', nodemailer.getTestMessageUrl(emailResponse));
      }
    } catch (error) {
      console.error('Password reset email error:', error);
      if (!isUsingDevEmail()) {
        throw new Error('Failed to send password reset email');
      }
    }
  }

  static async sendWelcomeEmail(user: IUser) {
    try {
      const emailResponse: SentMessageInfo = await this.sendMail({
        to: isUsingDevEmail() ? 'test@example.com' : user.email,
        subject: 'Welcome to Our Store!',
        html: this.getWelcomeEmailTemplate(user)
      });

      if (isUsingDevEmail() && nodemailer.getTestMessageUrl(emailResponse)) {
        console.log('Preview URL:', nodemailer.getTestMessageUrl(emailResponse));
      }
    } catch (error) {
      console.error('Welcome email error:', error);
      if (!isUsingDevEmail()) {
        throw new Error('Failed to send welcome email');
      }
    }
  }

  private static getOrderConfirmationTemplate(order: IOrderDocument | IOrder, user: IUserDocument | IUser): string {
    return `
      <h1>Order Confirmation</h1>
      <p>Dear ${user.firstName},</p>
      <p>Thank you for your order! Here are your order details:</p>
      <h2>Order #${order._id?.toString() || 'New'}</h2>
      <h3>Items:</h3>
      <ul>
        ${order.items.map(item => `
          <li>${item.product.toString()} - Quantity: ${item.quantity} - $${item.price}</li>
        `).join('')}
      </ul>
      <p>Total: $${order.totalAmount}</p>
      <p>Status: ${order.status}</p>
    `;
  }

  private static getPasswordResetTemplate(name: string, resetLink: string): string {
    return `
      <h1>Password Reset Request</h1>
      <p>Dear ${name},</p>
      <p>You requested to reset your password. Click the link below to reset it:</p>
      <a href="${resetLink}">Reset Password</a>
      <p>If you didn't request this, please ignore this email.</p>
    `;
  }

  private static getWelcomeEmailTemplate(user: IUser): string {
    return `
      <h1>Welcome to Our Store!</h1>
      <p>Dear ${user.firstName},</p>
      <p>Thank you for joining us! We're excited to have you as a member.</p>
      <h2>What's Next?</h2>
      <ul>
        <li>Browse our latest products</li>
        <li>Complete your profile</li>
        <li>Check out our current deals</li>
      </ul>
    `;
  }
}
