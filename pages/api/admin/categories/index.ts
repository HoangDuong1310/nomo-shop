import { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery } from '../../../../lib/db';
import { verifyToken } from '../../../../lib/auth';
import { getTokenFromRequest } from '../../../../lib/auth-utils';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Lấy token từ cookie hoặc Authorization header
    const token = getTokenFromRequest(req);
    
    // Nếu không có token
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    // Verify token
    const decodedToken = verifyToken(token);
    
    if (!decodedToken || !decodedToken.id) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session'
      });
    }

    // Kiểm tra quyền admin
    const userResult = await executeQuery({
      query: 'SELECT role FROM users WHERE id = ?',
      values: [decodedToken.id],
    });

    if ((userResult as any[]).length === 0 || (userResult as any[])[0].role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Xử lý các phương thức khác nhau
    switch (req.method) {
      case 'GET':
        return getCategories(req, res);
      case 'POST':
        return createCategory(req, res);
      default:
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Categories API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Lấy danh sách danh mục
async function getCategories(req: NextApiRequest, res: NextApiResponse) {
  try {
    const categories = await executeQuery({
      query: 'SELECT * FROM categories ORDER BY name',
      values: [],
    });

    // Xử lý dữ liệu để tránh lỗi serialize Date
    const serializedCategories = JSON.parse(JSON.stringify(categories));

    return res.status(200).json({
      success: true,
      categories: serializedCategories
    });
  } catch (error: any) {
    console.error('Get categories error:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách danh mục',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Thêm danh mục mới
async function createCategory(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { name, description } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Tên danh mục không được để trống'
      });
    }

    // Kiểm tra danh mục đã tồn tại chưa
    const existingCategory = await executeQuery({
      query: 'SELECT * FROM categories WHERE name = ?',
      values: [name],
    });

    if ((existingCategory as any[]).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Danh mục với tên này đã tồn tại'
      });
    }

    // Tạo ID cho danh mục mới
    const categoryId = uuidv4();

    // Thêm danh mục mới
    await executeQuery({
      query: 'INSERT INTO categories (id, name, description, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
      values: [categoryId, name, description || null],
    });

    return res.status(201).json({
      success: true,
      message: 'Thêm danh mục thành công',
      category_id: categoryId
    });
  } catch (error: any) {
    console.error('Create category error:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi thêm danh mục mới',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}