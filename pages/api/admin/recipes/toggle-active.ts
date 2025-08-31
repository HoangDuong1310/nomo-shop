import { NextApiRequest, NextApiResponse } from 'next';
import mysql from 'mysql2/promise';
import { RecipeToggleActiveResponse } from '../../../../types/recipe';

// Create database connection
async function getConnection() {
  return await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'cloudshop'
  });
}

// Helper function to verify admin authentication
async function verifyAdmin(req: NextApiRequest): Promise<boolean> {
  const token = req.cookies.adminToken || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return false;
  return true; // For development
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
  
  // Verify admin authentication
  const isAdmin = await verifyAdmin(req);
  if (!isAdmin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { id } = req.body;
  
  if (!id) {
    return res.status(400).json({ error: 'Recipe ID is required' });
  }
  
  const connection = await getConnection();
  
  try {
    // Get current status
    const [recipes] = await connection.execute<any[]>(
      'SELECT is_active, name FROM recipes WHERE id = ?',
      [id]
    );
    
    if (recipes.length === 0) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    
    const currentStatus = Boolean(recipes[0].is_active);
    const newStatus = !currentStatus;
    
    // Update status
    await connection.execute(
      'UPDATE recipes SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newStatus ? 1 : 0, id]
    );
    
    const response: RecipeToggleActiveResponse = {
      success: true,
      is_active: newStatus,
      message: `Công thức "${recipes[0].name}" đã được ${newStatus ? 'kích hoạt' : 'tạm ẩn'}!`
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error toggling recipe status:', error);
    res.status(500).json({ error: 'Failed to toggle recipe status' });
  } finally {
    await connection.end();
  }
}
