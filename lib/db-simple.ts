import mysql from 'mysql2/promise';

// Single connection instance - Simple approach
let connection: mysql.Connection | null = null;

export async function getConnection() {
  if (connection) {
    try {
      // Test connection
      await connection.ping();
      return connection;
    } catch (error) {
      connection = null;
    }
  }
  
  // Create new connection
  connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    database: process.env.MYSQL_DATABASE || 'cloudshop',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || ''
  });
  
  return connection;
}

export async function executeQuery({
  query,
  values = [],
}: {
  query: string;
  values?: any[];
}) {
  const conn = await getConnection();
  const [results] = await conn.execute(query, values);
  return results;
}

export async function closeConnection() {
  if (connection) {
    await connection.end();
    connection = null;
  }
}
