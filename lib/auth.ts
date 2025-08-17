import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery } from './db';

// Interface cho user
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  password: string; // Thêm trường password
  role: 'user' | 'admin';
  created_at?: Date;
  updated_at?: Date;
}

// Hash password trước khi lưu vào database
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// So sánh password đã hash
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Tạo JWT token
export function generateToken(user: User): string {
  const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret_key';
  const token = jwt.sign(
    { 
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role 
    },
    jwtSecret,
    { expiresIn: '7d' }
  );
  return token;
}

// Verify JWT token
export function verifyToken(token: string): any {
  try {
    const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret_key';
    return jwt.verify(token, jwtSecret);
  } catch (error) {
    return null;
  }
}

// Kiểm tra xem user có tồn tại bằng email
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const result = await executeQuery({
      query: 'SELECT * FROM users WHERE email = ?',
      values: [email],
    });

    if ((result as any[]).length > 0) {
      return (result as any[])[0] as User;
    }
    return null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}

// Kiểm tra xem user có tồn tại bằng phone
export async function getUserByPhone(phone: string): Promise<User | null> {
  try {
    const result = await executeQuery({
      query: 'SELECT * FROM users WHERE phone = ?',
      values: [phone],
    });

    if ((result as any[]).length > 0) {
      return (result as any[])[0] as User;
    }
    return null;
  } catch (error) {
    console.error('Error getting user by phone:', error);
    return null;
  }
}

// Tạo user mới
export async function createUser(userData: {
  name: string;
  email: string;
  phone: string;
  address: string;
  password: string;
}): Promise<User | null> {
  try {
    const hashedPassword = await hashPassword(userData.password);
    const userId = uuidv4();

    await executeQuery({
      query: `
        INSERT INTO users 
        (id, name, email, phone, password, address, role, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, 'user', NOW(), NOW())
      `,
      values: [
        userId,
        userData.name,
        userData.email,
        userData.phone,
        hashedPassword,
        userData.address
      ],
    });

    const user = await getUserByEmail(userData.email);
    return user;
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
} 