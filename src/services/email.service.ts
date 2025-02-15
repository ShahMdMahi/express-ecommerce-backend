import nodemailer from 'nodemailer';
import { getEmailTransporter, isUsingDevEmail } from '../config/email.config';
import { IOrder } from '../models/order.model';
import { IUser } from '../models/user.model';
import { IOrderItem, OrderStatus } from '../types/order.types';
import type { SentMessageInfo } from 'nodemailer';
import fs from 'fs/promises';
import path from 'path';
import Handlebars from 'handlebars';

interface EmailOptions {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
}

interface OrderEmailData {
  _id: string;
  user: IUser;
  totalAmount: number;
  items: IOrderItem[];
  status: OrderStatus;
  // Add other required fields from IOrder but omit user
}

export class EmailService {
  private static readonly TEMPLATE_DIR = path.join(__dirname, '../templates/email');
  private static readonly templates: Record<string, HandlebarsTemplateDelegate> = {};

  private static transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });

  private static async getTemplate(name: string): Promise<HandlebarsTemplateDelegate> {
    if (this.templates[name]) {
      return this.templates[name];
    }

    const templatePath = path.join(this.TEMPLATE_DIR, `${name}.hbs`);
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    this.templates[name] = Handlebars.compile(templateContent);
    return this.templates[name];
  }

  private static async compileTemplate(template: HandlebarsTemplateDelegate, data: any): Promise<string> {
    return template(data);
  }

  private static async sendMail(options: EmailOptions): Promise<SentMessageInfo> {
    return this.transporter.sendMail({
      from: process.env.EMAIL_FROM,
      ...options
    });
  }

  static async sendOrderConfirmation(order: OrderEmailData): Promise<void> {
    try {
      const template = await this.getTemplate('order-confirmation');
      const html = await this.compileTemplate(template, {
        orderId: order._id,
        items: order.items,
        total: order.totalAmount,
        user: order.user
      });

      await this.sendMail({
        to: isUsingDevEmail() ? 'test@example.com' : order.user.email,
        subject: `Order Confirmation #${order._id}`,
        html
      });
    } catch (error) {
      console.error('Order confirmation email error:', error);
      if (!isUsingDevEmail()) {
        throw new Error('Failed to send order confirmation email');
      }
    }
  }

  static async sendOrderStatusUpdate(order: OrderEmailData): Promise<void> {
    try {
      const template = await this.getTemplate('order-status-update');
      const html = await this.compileTemplate(template, {
        orderId: order._id,
        items: order.items,
        total: order.totalAmount,
        user: order.user
      });

      await this.sendMail({
        to: isUsingDevEmail() ? 'test@example.com' : order.user.email,
        subject: `Order Status Update #${order._id}`,
        html
      });
    } catch (error) {
      console.error('Order status update email error:', error);
      if (!isUsingDevEmail()) {
        throw new Error('Failed to send order status update email');
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

  private static getOrderConfirmationTemplate(order: OrderEmailData): string {
    return `
      <h1>Order Confirmation</h1>
      <p>Dear ${order.user.firstName},</p>
      <p>Thank you for your order! Here are your order details:</p>
      <h2>Order #${order._id}</h2>
      <h3>Items:</h3>
      <ul>
        ${order.items.map((item: IOrderItem) => `
          <li>${item.name} - Quantity: ${item.quantity} - $${item.price}</li>
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
