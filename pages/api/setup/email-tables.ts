import { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    console.log('🔧 Setting up email tables...');

    // 1. Tạo bảng email_logs
    console.log('Creating email_logs table...');
    await executeQuery({
      query: `
        CREATE TABLE IF NOT EXISTS email_logs (
          id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
          recipient_email VARCHAR(255) NOT NULL,
          template_type VARCHAR(50) NOT NULL,
          subject VARCHAR(255) NOT NULL,
          status ENUM('pending', 'sent', 'failed', 'bounced') DEFAULT 'pending',
          sent_at DATETIME NULL,
          opened_at DATETIME NULL,
          clicked_at DATETIME NULL,
          error_message TEXT NULL,
          order_id VARCHAR(36) NULL,
          user_id VARCHAR(36) NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          
          INDEX idx_recipient (recipient_email),
          INDEX idx_status (status),
          INDEX idx_template (template_type),
          INDEX idx_order (order_id),
          INDEX idx_created (created_at)
        )
      `,
      values: []
    });

    // 2. Tạo bảng user_email_preferences
    console.log('Creating user_email_preferences table...');
    await executeQuery({
      query: `
        CREATE TABLE IF NOT EXISTS user_email_preferences (
          id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
          user_id VARCHAR(36) NOT NULL,
          order_updates BOOLEAN DEFAULT true,
          payment_notifications BOOLEAN DEFAULT true,
          shipping_updates BOOLEAN DEFAULT true,
          marketing_emails BOOLEAN DEFAULT false,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          
          UNIQUE KEY unique_user (user_id),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `,
      values: []
    });

    // 3. Thêm email preferences mặc định cho users hiện có
    console.log('Adding default email preferences for existing users...');
    await executeQuery({
      query: `
        INSERT INTO user_email_preferences (user_id, order_updates, payment_notifications, shipping_updates, marketing_emails)
        SELECT id, true, true, true, false 
        FROM users 
        WHERE NOT EXISTS (
            SELECT 1 FROM user_email_preferences WHERE user_id = users.id
        )
      `,
      values: []
    });

    // 4. Kiểm tra kết quả
    const emailLogsCount = await executeQuery({
      query: 'SELECT COUNT(*) as count FROM email_logs',
      values: []
    });

    const preferencesCount = await executeQuery({
      query: 'SELECT COUNT(*) as count FROM user_email_preferences',
      values: []
    });

    console.log('✅ Email tables setup completed successfully!');

    res.status(200).json({
      success: true,
      message: 'Email tables setup completed successfully',
      data: {
        email_logs_count: (emailLogsCount as any[])[0]?.count || 0,
        email_preferences_count: (preferencesCount as any[])[0]?.count || 0,
        tables_created: [
          'email_logs',
          'user_email_preferences'
        ]
      }
    });

  } catch (error: any) {
    console.error('❌ Email tables setup failed:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to setup email tables',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
