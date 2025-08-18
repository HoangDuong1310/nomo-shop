import mysql from 'mysql2/promise';

// Tạo một connection pool duy nhất với cấu hình tối ưu
let pool: mysql.Pool | null = null;

function createPool() {
  if (pool) return pool;
  
  const dbName = process.env.DB_DATABASE || 'cloudshop';
  
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    database: dbName,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    waitForConnections: true,
    connectionLimit: 3,
    queueLimit: 0
  });
  
  return pool;
}

// Hàm để đảm bảo database tồn tại (chạy một lần duy nhất)
async function ensureDatabaseExists() {
  const dbName = process.env.DB_DATABASE || 'cloudshop';
  
  // Tạo connection tạm thời để tạo database
  const tempConnection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
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

// Special function for queries with LIMIT and OFFSET
// Uses query() instead of execute() to avoid prepared statement issues with LIMIT/OFFSET
export async function executeQueryWithPagination({
  query,
  values = [],
  limit,
  offset,
}: {
  query: string;
  values?: any[];
  limit: number;
  offset: number;
}) {
  try {
    const currentPool = createPool();
    
    // Ensure limit and offset are integers to prevent SQL injection
    const safeLimit = parseInt(String(limit));
    const safeOffset = parseInt(String(offset));
    
    if (isNaN(safeLimit) || isNaN(safeOffset) || safeLimit < 0 || safeOffset < 0) {
      throw new Error('Invalid limit or offset values');
    }
    
    // Append LIMIT and OFFSET directly to the query (safe because they're validated integers)
    const paginatedQuery = `${query} LIMIT ${safeLimit} OFFSET ${safeOffset}`;
    
    // Use execute for other parameters (for prepared statement safety)
    // but with LIMIT and OFFSET already interpolated
    const [results] = await currentPool.execute(paginatedQuery, values);
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