// Script để thêm dữ liệu mẫu cho product variants
const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

async function addProductVariants() {
  let connection;
  
  try {
    // Kết nối đến MySQL
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'cloudshop'
    });

    console.log('🔧 Adding Product Variants...\n');

    // Cập nhật sản phẩm với options có pricing
    const productsWithVariants = [
      {
        id: '1', // Cà phê đen
        name: 'Cà phê đen',
        options: [
          {
            name: "Nhiệt độ",
            values: [
              { label: "Nóng", value: "hot", price: 0 },
              { label: "Đá", value: "ice", price: 0 }
            ]
          },
          {
            name: "Size",
            values: [
              { label: "Size S", value: "s", price: 0 },
              { label: "Size M", value: "m", price: 5000 },
              { label: "Size L", value: "l", price: 10000 }
            ]
          }
        ]
      },
      {
        id: '2', // Cà phê sữa
        name: 'Cà phê sữa',
        options: [
          {
            name: "Nhiệt độ",
            values: [
              { label: "Nóng", value: "hot", price: 0 },
              { label: "Đá", value: "ice", price: 0 }
            ]
          },
          {
            name: "Size",
            values: [
              { label: "Size S", value: "s", price: 0 },
              { label: "Size M", value: "m", price: 5000 },
              { label: "Size L", value: "l", price: 8000 }
            ]
          },
          {
            name: "Độ ngọt",
            values: [
              { label: "Ít ngọt", value: "less_sweet", price: 0 },
              { label: "Bình thường", value: "normal", price: 0 },
              { label: "Ngọt", value: "sweet", price: 2000 }
            ]
          }
        ]
      },
      {
        id: '3', // Bánh mì thịt
        name: 'Bánh mì thịt',
        options: [
          {
            name: "Topping",
            values: [
              { label: "Không topping", value: "none", price: 0 },
              { label: "Thêm trứng", value: "egg", price: 5000 },
              { label: "Thêm chả", value: "cha", price: 8000 },
              { label: "Thêm pate", value: "pate", price: 3000 },
              { label: "Combo đầy đủ", value: "combo", price: 12000 }
            ]
          }
        ]
      },
      {
        id: '5', // Khoai tây chiên
        name: 'Khoai tây chiên',
        options: [
          {
            name: "Size",
            values: [
              { label: "Size nhỏ", value: "small", price: 0 },
              { label: "Size vừa", value: "medium", price: 8000 },
              { label: "Size lớn", value: "large", price: 15000 }
            ]
          },
          {
            name: "Sauce",
            values: [
              { label: "Không sauce", value: "none", price: 0 },
              { label: "Tương cà", value: "ketchup", price: 2000 },
              { label: "Mayo", value: "mayo", price: 3000 },
              { label: "Cheese sauce", value: "cheese", price: 5000 }
            ]
          }
        ]
      }
    ];

    // Cập nhật options cho từng sản phẩm
    for (const product of productsWithVariants) {
      await connection.execute(
        'UPDATE products SET options = ? WHERE id = ?',
        [JSON.stringify(product.options), product.id]
      );
      
      console.log(`✅ Updated ${product.name} with pricing variants`);
      
      // Thêm variants vào bảng product_variants
      for (const optionGroup of product.options) {
        for (const value of optionGroup.values) {
          const variantId = uuidv4();
          
          await connection.execute(
            `INSERT INTO product_variants (id, product_id, variant_name, variant_value, price_adjustment, stock_quantity, is_active) 
             VALUES (?, ?, ?, ?, ?, ?, ?) 
             ON DUPLICATE KEY UPDATE 
             price_adjustment = VALUES(price_adjustment), 
             stock_quantity = VALUES(stock_quantity)`,
            [
              variantId,
              product.id,
              optionGroup.name,
              value.value,
              value.price || 0,
              100, // Default stock
              true
            ]
          );
        }
      }
    }

    console.log('\n🎉 Product variants added successfully!');
    console.log('\n🔗 Test URLs:');
    productsWithVariants.forEach(product => {
      console.log(`   http://localhost:3000/product/${product.id} - ${product.name}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addProductVariants();