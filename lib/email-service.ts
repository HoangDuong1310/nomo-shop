import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { executeQuery } from './db';

export interface EmailTemplate {
  type: 'order_confirmation' | 'payment_success' | 'shipping_update' | 'order_cancelled' | 
        'order_status_update' | 'welcome' | 'password_reset' | 'admin_new_order' | 
        'admin_payment_received' | 'admin_daily_summary';
  subject: string;
  templatePath: string;
  variables: Record<string, any>;
}

export interface Order {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  total: number;
  order_status: string;
  payment_status: string;
  address: string;
  note?: string;
  created_at: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
}

export class EmailService {
  private static transporter: nodemailer.Transporter;

  static async init() {
    // Đăng ký Handlebars helpers
    this.registerHandlebarsHelpers();

    // Khởi tạo SMTP transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Test connection
    try {
      await this.transporter.verify();
      console.log('✅ Email service initialized successfully');
    } catch (error) {
      console.error('❌ Email service initialization failed:', error);
    }
  }

  private static registerHandlebarsHelpers() {
    // Helper để nhân số
    handlebars.registerHelper('multiply', function(a: number, b: number) {
      return a * b;
    });

    // Helper để so sánh bằng
    handlebars.registerHelper('eq', function(a: any, b: any) {
      return a === b;
    });

    // Helper để format currency
    handlebars.registerHelper('formatCurrency', function(amount: number) {
      return EmailService.formatCurrency(amount);
    });

    // Helper để format date
    handlebars.registerHelper('formatDate', function(date: string) {
      return new Date(date).toLocaleDateString('vi-VN');
    });

    // Helper để format datetime
    handlebars.registerHelper('formatDateTime', function(date: string) {
      return new Date(date).toLocaleString('vi-VN');
    });
  }

  static async send(to: string, template: EmailTemplate): Promise<boolean> {
    try {
      if (!this.transporter) {
        await this.init();
      }

      // Đảm bảo helpers được đăng ký
      this.registerHandlebarsHelpers();

      // Đọc và compile email template
      const templateContent = await this.loadTemplate(template.templatePath);
      const compiledTemplate = handlebars.compile(templateContent);
      const html = compiledTemplate(template.variables);

      // Gửi email
      const info = await this.transporter.sendMail({
        from: `"Cloud Shop" <${process.env.SMTP_USER}>`,
        to,
        subject: template.subject,
        html,
      });

      // Log email đã gửi
      await this.logEmail({
        recipient_email: to,
        template_type: template.type,
        subject: template.subject,
        status: 'sent',
        message_id: info.messageId,
      });

      console.log(`✅ Email sent successfully to ${to}: ${template.subject}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      
      // Log email thất bại
      await this.logEmail({
        recipient_email: to,
        template_type: template.type,
        subject: template.subject,
        status: 'failed',
        error_message: error instanceof Error ? error.message : String(error),
      });
      
      return false;
    }
  }

  static async loadTemplate(templatePath: string): Promise<string> {
    const fullPath = path.join(process.cwd(), 'email-templates', templatePath);
    return fs.readFileSync(fullPath, 'utf8');
  }

  static async logEmail(emailData: {
    recipient_email: string;
    template_type: string;
    subject: string;
    status: 'pending' | 'sent' | 'failed';
    message_id?: string;
    error_message?: string;
    order_id?: string;
    user_id?: string;
  }) {
    try {
      await executeQuery({
        query: `
          INSERT INTO email_logs (
            id, recipient_email, template_type, subject, status, 
            sent_at, error_message, order_id, user_id
          ) VALUES (
            UUID(), ?, ?, ?, ?, 
            ${emailData.status === 'sent' ? 'NOW()' : 'NULL'}, 
            ?, ?, ?
          )
        `,
        values: [
          emailData.recipient_email,
          emailData.template_type,
          emailData.subject,
          emailData.status,
          emailData.error_message || null,
          emailData.order_id || null,
          emailData.user_id || null,
        ],
      });
    } catch (error) {
      console.error('Failed to log email:', error);
    }
  }

  // ==================== CUSTOMER EMAILS ====================

  static async sendOrderConfirmation(order: Order): Promise<boolean> {
    const template: EmailTemplate = {
      type: 'order_confirmation',
      subject: `Xác nhận đơn hàng #${order.id.substring(0, 8)} - Cloud Shop`,
      templatePath: 'order-confirmation.html',
      variables: {
        customerName: order.user_name,
        orderNumber: order.id.substring(0, 8),
        orderDate: new Date(order.created_at).toLocaleDateString('vi-VN'),
        orderItems: order.items,
        orderTotal: this.formatCurrency(order.total),
        shippingAddress: order.address,
        orderNote: order.note,
        trackOrderUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/account/orders/${order.id}`,
        supportEmail: process.env.ADMIN_EMAIL || 'support@cloudshop.com',
      },
    };

    return this.send(order.user_email, template);
  }

  static async sendPaymentConfirmation(order: Order): Promise<boolean> {
    const template: EmailTemplate = {
      type: 'payment_success',
      subject: `Thanh toán thành công #${order.id.substring(0, 8)} - Cloud Shop`,
      templatePath: 'payment-success.html',
      variables: {
        customerName: order.user_name,
        orderNumber: order.id.substring(0, 8),
        orderTotal: this.formatCurrency(order.total),
        paymentDate: new Date().toLocaleDateString('vi-VN'),
        trackOrderUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/account/orders/${order.id}`,
      },
    };

    return this.send(order.user_email, template);
  }

  static async sendOrderStatusUpdate(order: Order, oldStatus: string, newStatus: string): Promise<boolean> {
    const statusMessages = {
      confirmed: 'Đơn hàng của bạn đã được xác nhận và sẽ được chuẩn bị sớm.',
      processing: 'Đơn hàng của bạn đang được chuẩn bị để giao.',
      shipping: 'Đơn hàng của bạn đã được gửi đi và đang trên đường giao tới bạn.',
      completed: 'Đơn hàng của bạn đã được giao thành công. Cảm ơn bạn đã mua hàng!',
      cancelled: 'Đơn hàng của bạn đã bị hủy. Chúng tôi sẽ liên hệ với bạn về việc hoàn tiền.',
    };

    const template: EmailTemplate = {
      type: 'order_status_update',
      subject: `Cập nhật đơn hàng #${order.id.substring(0, 8)} - Cloud Shop`,
      templatePath: 'order-status-update.html',
      variables: {
        customerName: order.user_name,
        orderNumber: order.id.substring(0, 8),
        oldStatus: this.getStatusText(oldStatus),
        newStatus: this.getStatusText(newStatus),
        statusMessage: statusMessages[newStatus as keyof typeof statusMessages] || 'Trạng thái đơn hàng đã được cập nhật.',
        trackOrderUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/account/orders/${order.id}`,
      },
    };

    return this.send(order.user_email, template);
  }

  static async sendWelcomeEmail(user: { name: string; email: string }): Promise<boolean> {
    const template: EmailTemplate = {
      type: 'welcome',
      subject: 'Chào mừng bạn đến với Cloud Shop!',
      templatePath: 'welcome.html',
      variables: {
        userName: user.name,
        shopUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
        supportEmail: process.env.ADMIN_EMAIL || 'support@cloudshop.com',
      },
    };

    return this.send(user.email, template);
  }

  // ==================== ADMIN EMAILS ====================

  static async sendNewOrderAlert(order: Order): Promise<boolean> {
    const adminEmails = [
      process.env.ADMIN_EMAIL,
      process.env.ADMIN_CC_EMAIL,
    ].filter(Boolean);

    const template: EmailTemplate = {
      type: 'admin_new_order',
      subject: `🔔 Đơn hàng mới #${order.id.substring(0, 8)} - ${this.formatCurrency(order.total)}`,
      templatePath: 'admin-new-order.html',
      variables: {
        orderNumber: order.id.substring(0, 8),
        customerName: order.user_name,
        customerEmail: order.user_email,
        customerPhone: order.user_phone,
        orderTotal: this.formatCurrency(order.total),
        orderItems: order.items,
        shippingAddress: order.address,
        orderNote: order.note,
        orderDate: new Date(order.created_at).toLocaleString('vi-VN'),
        adminOrderUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/admin/orders/${order.id}`,
      },
    };

    let success = true;
    for (const email of adminEmails) {
      const result = await this.send(email!, template);
      success = success && result;
    }

    return success;
  }

  static async sendPaymentReceivedAlert(order: Order): Promise<boolean> {
    const adminEmails = [
      process.env.ADMIN_EMAIL,
      process.env.ADMIN_CC_EMAIL,
    ].filter(Boolean);

    const template: EmailTemplate = {
      type: 'admin_payment_received',
      subject: `💰 Thanh toán thành công #${order.id.substring(0, 8)} - ${this.formatCurrency(order.total)}`,
      templatePath: 'admin-payment-received.html',
      variables: {
        orderNumber: order.id.substring(0, 8),
        customerName: order.user_name,
        orderTotal: this.formatCurrency(order.total),
        paymentDate: new Date().toLocaleString('vi-VN'),
        adminOrderUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/admin/orders/${order.id}`,
      },
    };

    let success = true;
    for (const email of adminEmails) {
      const result = await this.send(email!, template);
      success = success && result;
    }

    return success;
  }

  // ==================== HELPER METHODS ====================

  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }

  static getStatusText(status: string): string {
    const statusMap = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      processing: 'Đang xử lý',
      shipping: 'Đang giao hàng',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy',
    };

    return statusMap[status as keyof typeof statusMap] || status;
  }
}

// Khởi tạo email service khi server start
if (process.env.NODE_ENV === 'production') {
  EmailService.init();
}
