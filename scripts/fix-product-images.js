// Script: fix-product-images.js
// Purpose: Replace non-existing placeholder-drink/food images with existing /images/placeholder.svg
// and trim accidental trailing digits/spaces from product names (e.g., 'Soda dâu0').

const mysql = require('mysql2/promise');
const { loadEnvConfig } = require('./utils/env-loader');
loadEnvConfig();

(async () => {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || process.env.MYSQL_HOST || 'localhost',
      port: process.env.DB_PORT || process.env.MYSQL_PORT || 3306,
      user: process.env.DB_USER || process.env.MYSQL_USER || 'root',
      password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || '',
      database: process.env.DB_DATABASE || process.env.MYSQL_DATABASE || 'cloudshop'
    });

    const [rows] = await connection.execute('SELECT id, name, image FROM products');
    let updated = 0;
    for (const r of rows) {
      let newImage = r.image;
      let newName = r.name;

      // Fix image if refers to non-existent placeholder (ends with -drink.jpg or -food.jpg)
      if (!newImage || /placeholder-(drink|food)\.jpg$/.test(newImage)) {
        newImage = '/images/placeholder.svg';
      }

      // Trim trailing '0' if appears erroneously at end (pattern: Vietnamese letter/space + 0)
      if (/0$/.test(newName) && !/\d\d$/.test(newName)) {
        newName = newName.replace(/0+$/, '').trim();
      }

      if (newImage !== r.image || newName !== r.name) {
        await connection.execute('UPDATE products SET name = ?, image = ?, updated_at = NOW() WHERE id = ?', [newName, newImage, r.id]);
        updated++;
      }
    }
    console.log(`✅ Updated ${updated} products`);
  } catch (e) {
    console.error('❌ Fix failed', e);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
})();
