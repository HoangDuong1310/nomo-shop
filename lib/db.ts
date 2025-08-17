import mysql from 'mysql2/promise';

// Tạo một connection pool duy nhất với cấu hình tối ưu
let pool: mysql.Pool | null = null;

function createPool() {
  if (pool) return pool;
  
  const dbName = process.env.MYSQL_DATABASE || 'cloudshop';
  
  pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    database: dbName,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    waitForConnections: true,
    connectionLimit: 3,
    queueLimit: 0
  });
  
  return pool;
}

// Hàm để đảm bảo database tồn tại (chạy một lần duy nhất)
async function ensureDatabaseExists() {
  const dbName = process.env.MYSQL_DATABASE || 'cloudshop';
  
  // Tạo connection tạm thời để tạo database
  const tempConnection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
  });
  
  try {
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  } finally {
    await tempConnection.end();
  }
}

export async function executeQuery({
  query,
  values = [],
}: {
  query: string;
  values?: any[];
}) {
  try {
    const currentPool = createPool();
    const [results] = await currentPool.execute(query, values);
    return results;
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
}

// Hàm để đóng pool connection (để cleanup)
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
} 