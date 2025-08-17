const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: '.env.local' });

async function seedDemoData() {
  let connection;
  
  try {
    console.log('🌱 Seeding demo data...');

    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'cloudshop'
    });

    // Check if demo data already exists
    const [existingProducts] = await connection.execute('SELECT COUNT(*) as count FROM products');
    if (existingProducts[0].count > 0) {
      console.log('ℹ️  Demo data already exists!');
      return;
    }

    console.log('📦 Adding demo products...');

    // Demo products data
    const demoProducts = [
      {
        id: uuidv4(),
        name: 'Cà phê đen đá',
        description: 'Cà phê đen truyền thống, đậm đà hương vị',
        price: 25000,
        sale_price: 20000,
        image: '/images/coffee-black.jpg',
        category_id: 'drinks',
        stock_quantity: 100,
        is_featured: true,
        options: JSON.stringify([
          {
            name: 'Size',
            values: ['S', 'M', 'L'],
            prices: [0, 5000, 10000]
          },
          {
            name: 'Đá',
            values: ['Nhiều đá', 'Ít đá', 'Không đá'],
            prices: [0, 0, 0]
          }
        ])
      },
      {
        id: uuidv4(),
        name: 'Cà phê sữa đá',
        description: 'Cà phê sữa thơm ngon, ngọt dịu',
        price: 30000,
        image: '/images/coffee-milk.jpg',
        category_id: 'drinks',
        stock_quantity: 100,
        is_featured: true,
        options: JSON.stringify([
          {
            name: 'Size',
            values: ['S', 'M', 'L'],
            prices: [0, 5000, 10000]
          },
          {
            name: 'Đường',
            values: ['Nhiều đường', 'Ít đường', 'Không đường'],
            prices: [0, 0, 0]
          }
        ])
      },
      {
        id: uuidv4(),
        name: 'Trà sữa truyền thống',
        description: 'Trà sữa được pha chế theo công thức truyền thống',
        price: 35000,
        image: '/images/milk-tea.jpg',
        category_id: 'drinks',
        stock_quantity: 80,
        is_featured: true,
        options: JSON.stringify([
          {
            name: 'Size',
            values: ['M', 'L', 'XL'],
            prices: [0, 8000, 15000]
          },
          {
            name: 'Topping',
            values: ['Trân châu', 'Pudding', 'Thạch', 'Không topping'],
            prices: [8000, 10000, 8000, 0]
          },
          {
            name: 'Đường',
            values: ['100%', '75%', '50%', '25%'],
            prices: [0, 0, 0, 0]
          }
        ])
      },
      {
        id: uuidv4(),
        name: 'Bánh mì thịt nướng',
        description: 'Bánh mì giòn với thịt nướng thơm lừng',
        price: 20000,
        image: '/images/banh-mi.jpg',
        category_id: 'food',
        stock_quantity: 50,
        is_featured: false,
        options: JSON.stringify([
          {
            name: 'Cay',
            values: ['Không cay', 'Ít cay', 'Vừa cay', 'Cay'],
            prices: [0, 0, 0, 0]
          }
        ])
      },
      {
        id: uuidv4(),
        name: 'Bánh croissant bơ',
        description: 'Bánh croissant thơm bơ, giòn tan',
        price: 15000,
        image: '/images/croissant.jpg',
        category_id: 'dessert',
        stock_quantity: 30,
        is_featured: false,
        options: JSON.stringify([])
      },
      {
        id: uuidv4(),
        name: 'Kẹo dẻo trái cây',
        description: 'Kẹo dẻo nhiều hương vị trái cây',
        price: 12000,
        image: '/images/candy.jpg',
        category_id: 'snacks',
        stock_quantity: 200,
        is_featured: false,
        options: JSON.stringify([
          {
            name: 'Vị',
            values: ['Dâu', 'Cam', 'Nho', 'Táo'],
            prices: [0, 0, 0, 0]
          }
        ])
      }
    ];

    // Insert demo products
    for (const product of demoProducts) {
      await connection.execute(
        `INSERT INTO products (id, name, description, price, sale_price, image, category_id, stock_quantity, is_featured, options) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          product.id,
          product.name,
          product.description,
          product.price,
          product.sale_price || null,
          product.image,
          product.category_id,
          product.stock_quantity,
          product.is_featured,
          product.options
        ]
      );
    }

    console.log(`✅ Added ${demoProducts.length} demo products`);

    // Add some demo discounts
    console.log('🎫 Adding demo discounts...');
    
    const demoDiscounts = [
      {
        id: uuidv4(),
        code: 'WELCOME10',
        type: 'percentage',
        value: 10,
        min_order_value: 50000,
        usage_limit: 100,
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      },
      {
        id: uuidv4(),
        code: 'FREESHIP',
        type: 'fixed',
        value: 15000,
        min_order_value: 100000,
        usage_limit: 50,
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    ];

    for (const discount of demoDiscounts) {
      await connection.execute(
        `INSERT INTO discounts (id, code, type, value, min_order_value, usage_limit, end_date) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          discount.id,
          discount.code,
          discount.type,
          discount.value,
          discount.min_order_value,
          discount.usage_limit,
          discount.end_date
        ]
      );
    }

    console.log(`✅ Added ${demoDiscounts.length} demo discounts`);

    console.log('\n🎉 Demo data seeded successfully!');
    console.log('📋 Available products:');
    for (const product of demoProducts) {
      console.log(`   • ${product.name} - ${product.price.toLocaleString()}đ`);
    }
    console.log('\n🎫 Available discount codes:');
    for (const discount of demoDiscounts) {
      console.log(`   • ${discount.code} - ${discount.value}${discount.type === 'percentage' ? '%' : 'đ'} off`);
    }

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  seedDemoData()
    .then(() => {
      console.log('\n✅ Demo data seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Demo data seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDemoData };
