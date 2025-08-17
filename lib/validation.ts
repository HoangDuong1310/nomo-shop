// Validation utilities

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^(0|\+84)[0-9]{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (!password || password.length < 6) {
    return { isValid: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' };
  }
  
  if (password.length > 128) {
    return { isValid: false, message: 'Mật khẩu không được quá 128 ký tự' };
  }
  
  return { isValid: true };
};

export const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>]/g, '');
};

export const validateOrderData = (data: any): { isValid: boolean; message?: string } => {
  const { items, customerInfo, total, payment_method } = data;
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    return { isValid: false, message: 'Giỏ hàng không được để trống' };
  }
  
  if (!customerInfo || !customerInfo.name || !customerInfo.phone || !customerInfo.address) {
    return { isValid: false, message: 'Thiếu thông tin khách hàng' };
  }
  
  if (!validatePhone(customerInfo.phone)) {
    return { isValid: false, message: 'Số điện thoại không hợp lệ' };
  }
  
  if (!total || total <= 0) {
    return { isValid: false, message: 'Tổng tiền không hợp lệ' };
  }
  
  if (!payment_method || !['cod', 'vnpay'].includes(payment_method)) {
    return { isValid: false, message: 'Phương thức thanh toán không hợp lệ' };
  }
  
  return { isValid: true };
};