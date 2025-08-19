/**
 * Script: reset-and-add-products.js
 * Mục đích: Xoá toàn bộ sản phẩm hiện tại và thêm bộ sản phẩm mới theo yêu cầu.
 * Cảnh báo: Script này sẽ XOÁ TẤT CẢ products hiện có (và cả product_variants, order_items liên quan nếu không chỉnh sửa).
 * Nếu bạn muốn giữ lịch sử đơn hàng, hãy cân nhắc KHÔNG xoá bảng order_items (sửa biến REMOVE_ORDER_ITEMS = false).
 */

const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
const { loadEnvConfig } = require('./utils/env-loader');

// Load env (.env.local nếu có)
loadEnvConfig();

// Cấu hình tuỳ chọn
const REMOVE_ORDER_ITEMS = true; // Đặt false nếu không muốn xoá order_items (khi đó phải giữ nguyên products cũ)
const REMOVE_PRODUCT_VARIANTS = true; // Xoá biến thể nếu có

async function main() {
  let connection;
  try {
    console.log('⚠️  BẮT ĐẦU RESET SẢN PHẨM');

    connection = await mysql.createConnection({
      host: process.env.DB_HOST || process.env.MYSQL_HOST || 'localhost',
      port: process.env.DB_PORT || process.env.MYSQL_PORT || 3306,
      user: process.env.DB_USER || process.env.MYSQL_USER || 'root',
      password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || '',
      database: process.env.DB_DATABASE || process.env.MYSQL_DATABASE || 'cloudshop'
    });

    console.log('✅ Kết nối DB thành công');

    // Bật transaction để an toàn
    await connection.beginTransaction();

    // Kiểm tra & xoá order_items (nếu bật)
    if (REMOVE_ORDER_ITEMS) {
      console.log('🧹 Xoá order_items...');
      await connection.execute('DELETE FROM order_items');
    } else {
      console.log('ℹ️  Giữ nguyên order_items (có thể gây lỗi nếu xoá products có FK).');
    }

    // Xoá product_variants nếu có bảng và được bật
    if (REMOVE_PRODUCT_VARIANTS) {
      const [variantTable] = await connection.execute("SHOW TABLES LIKE 'product_variants'");
      if (variantTable.length) {
        console.log('🧹 Xoá product_variants...');
        await connection.execute('DELETE FROM product_variants');
      }
    }

    // Xoá tất cả sản phẩm hiện có
    console.log('🧹 Xoá products...');
    await connection.execute('DELETE FROM products');

    // Danh mục cần đảm bảo tồn tại
    const categories = [
      { id: 'soda', name: 'Soda', description: 'Các loại soda giải khát', image: null },
      { id: 'tea', name: 'Trà', description: 'Các loại trà đặc biệt', image: null },
      { id: 'milk-tea', name: 'Trà sữa', description: 'Các loại trà sữa', image: null },
      { id: 'yogurt', name: 'Sữa chua', description: 'Đồ uống từ sữa chua', image: null },
      // Đồ ăn: sử dụng lại category 'food' nếu đã có. Nếu chưa có thì thêm.
      { id: 'food', name: 'Đồ ăn', description: 'Các món ăn', image: null }
    ];

    console.log('📂 Đảm bảo danh mục tồn tại...');
    for (const c of categories) {
      await connection.execute(
        `INSERT INTO categories (id, name, description, image) VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name)`,
        [c.id, c.name, c.description, c.image]
      );
    }

    // Định nghĩa sản phẩm mới
    // Ghi chú: Giá mang tính giả định. Có thể sửa lại theo nhu cầu thực tế.
    const DEFAULT_IMAGE = '/images/placeholder-drink.jpg';
    const DEFAULT_FOOD_IMAGE = '/images/placeholder-food.jpg';

    const products = [
      // Soda
      ['Soda dâu', 'soda', 30000],
      ['Soda chanh leo', 'soda', 30000],
      ['Soda dưa lưới', 'soda', 30000],
      ['Soda dưa hấu', 'soda', 30000],
      ['Soda việt quất', 'soda', 32000],

      // Trà
      ['Trà matcha', 'tea', 35000],
      ['Trà vải hoa hồng', 'tea', 35000],
      ['Trà dâu tằm', 'tea', 35000],
      ['Trà bưởi hồng mật ong', 'tea', 38000],
      ['Trà xoài lắc chanh', 'tea', 38000],

      // Trà sữa
      ['Trà sữa matcha', 'milk-tea', 40000],
      ['Trà sữa trân châu đường đen', 'milk-tea', 45000],
      ['Trà sữa socola', 'milk-tea', 42000],
      ['Trà sữa oolong', 'milk-tea', 42000],
      ['Trà sữa Thái xanh', 'milk-tea', 42000],
      ['Trà sữa Thái đỏ', 'milk-tea', 42000],

      // Sữa chua
      ['Sữa chua việt quất', 'yogurt', 35000],
      ['Sữa chua dâu tây', 'yogurt', 35000],
      ['Sữa việt quất', 'yogurt', 33000],
      ['Sữa xoài', 'yogurt', 33000],

      // Đồ ăn
      ['Mì cay', 'food', 55000],
      ['Mì trộn', 'food', 50000],
      ['Sữa tươi chiên', 'food', 45000],
      ['Mandu chiên', 'food', 48000],
      ['Mì Ý', 'food', 65000]
    ].map(([name, category_id, price]) => ({
      id: uuidv4(),
      name,
      description: '',
      price,
      sale_price: null,
      image: category_id === 'food' ? DEFAULT_FOOD_IMAGE : DEFAULT_IMAGE,
      category_id,
      stock_quantity: 100,
      is_featured: false,
      is_active: true,
      options: JSON.stringify([
        {
          name: 'Size',
            values: ['M', 'L'],
            prices: [0, 5000]
        }
      ])
    }));

    console.log(`➕ Thêm ${products.length} sản phẩm mới...`);
    for (const p of products) {
      await connection.execute(
        `INSERT INTO products (id, name, description, price, sale_price, image, category_id, stock_quantity, is_featured, is_active, options)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          p.id,
          p.name,
          p.description,
          p.price,
          p.sale_price,
          p.image,
          p.category_id,
          p.stock_quantity,
          p.is_featured,
          p.is_active,
          p.options
        ]
      );
    }

    await connection.commit();
    console.log('🎉 Hoàn tất. Danh sách sản phẩm mới đã được thêm vào.');

    console.log('\n📋 Sản phẩm đã thêm:');
    for (const p of products) {
      console.log(` - ${p.name} (${p.category_id}) - ${p.price.toLocaleString()}đ`);
    }
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('❌ Lỗi:', err.message);
    process.exitCode = 1;
  } finally {
    if (connection) await connection.end();
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
