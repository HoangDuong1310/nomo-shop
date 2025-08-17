import { NextApiRequest, NextApiResponse } from 'next';
import { createUser, getUserByEmail, getUserByPhone } from '../../../lib/auth';
import { EmailService } from '../../../lib/email-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Chỉ chấp nhận phương thức POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { name, email, phone, address, password, confirmPassword } = req.body;
    
    // Kiểm tra dữ liệu đầu vào
    if (!name || !email || !phone || !address || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin'
      });
    }
    
    // Kiểm tra định dạng email
    if (!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email không hợp lệ'
      });
    }
    
    // Kiểm tra định dạng số điện thoại
    if (!/^(0|\+84)[0-9]{9}$/.test(phone.replace(/\s/g, ''))) {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại không hợp lệ'
      });
    }
    
    // Kiểm tra độ dài mật khẩu
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự'
      });
    }
    
    // Kiểm tra khớp mật khẩu
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu xác nhận không khớp'
      });
    }
    
    // Kiểm tra email đã tồn tại chưa
    const existingUserByEmail = await getUserByEmail(email);
    if (existingUserByEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email này đã được đăng ký. Vui lòng sử dụng email khác.'
      });
    }
    
    // Kiểm tra số điện thoại đã tồn tại chưa
    const existingUserByPhone = await getUserByPhone(phone);
    if (existingUserByPhone) {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại này đã được đăng ký. Vui lòng sử dụng số điện thoại khác.'
      });
    }
    
    // Tạo tài khoản mới
    const newUser = await createUser({ name, email, phone, address, password });
    
    if (!newUser) {
      return res.status(500).json({
        success: false,
        message: 'Đã xảy ra lỗi khi tạo tài khoản. Vui lòng thử lại sau.'
      });
    }

    // 🔥 GỬI WELCOME EMAIL (không chặn response nếu thất bại)
    try {
      await EmailService.sendWelcomeEmail({
        name: newUser.name,
        email: newUser.email
      });
      console.log(`✅ Welcome email sent to ${newUser.email}`);
    } catch (emailError) {
      console.error('⚠️ Failed to send welcome email:', emailError);
      // Không throw error để không ảnh hưởng đến registration
    }
    
    // Trả về thành công
    res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        address: newUser.address,
        role: newUser.role
      }
    });
    
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại sau.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 