// Script để tạo dữ liệu mẫu cho database
const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

// Cấu hình kết nối database
const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'cloudshop',
};

// Hàm hỗ trợ tạo ID
const createId = () => uuidv4();

// Hàm hỗ trợ tạo ngày ngẫu nhiên trong khoảng X ngày trước đây
const randomDate = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * days));
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

// Hàm tạo mật khẩu hash
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Hàm thêm dữ liệu mẫu
async function seedDatabase() {
  let connection;

  try {
    console.log('Bắt đầu thêm dữ liệu mẫu...');
    
    // Kết nối đến database
    connection = await mysql.createConnection(dbConfig);
    
    // Thêm người dùng
    console.log('Đang thêm dữ liệu người dùng...');
    
    // Tạo admin
    const adminId = createId();
    const adminPassword = await hashPassword('admin123');
    
    await connection.execute(
      'INSERT IGNORE INTO users (id, name, email, phone, password, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [adminId, 'Admin', 'admin@cloudshop.com', '0987654321', adminPassword, 'admin', new Date().toISOString().slice(0, 19).replace('T', ' ')]
    );
    
    // Tạo người dùng thường
    const userNames = ['Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C', 'Phạm Thị D', 'Hoàng Văn E'];
    const userPhones = ['0123456789', '0123456780', '0123456781', '0123456782', '0123456783'];
    const userEmails = ['nguyenvana@example.com', 'tranthib@example.com', 'levanc@example.com', 'phamthid@example.com', 'hoangvane@example.com'];
    const userAddresses = [
      '123 Đường Lê Lợi, Quận 1, TP.HCM',
      '456 Đường Nguyễn Huệ, Quận 1, TP.HCM',
      '789 Đường Trần Hưng Đạo, Quận 5, TP.HCM',
      '101 Đường Lý Thường Kiệt, Quận 10, TP.HCM',
      '202 Đường Cách Mạng Tháng 8, Quận 3, TP.HCM'
    ];
    
    const userIds = [];
    const password = await hashPassword('password123');
    
    for (let i = 0; i < userNames.length; i++) {
      const userId = createId();
      userIds.push(userId);
      
      await connection.execute(
        'INSERT IGNORE INTO users (id, name, email, phone, password, address, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, userNames[i], userEmails[i], userPhones[i], password, userAddresses[i], 'user', randomDate(60)]
      );
    }
    
    // Thêm danh mục
    console.log('Đang thêm dữ liệu danh mục...');
    
    const categories = [
      { id: 'coffee', name: 'Cà phê', image: 'https://images.unsplash.com/photo-1509042239860-f13409160181' },
      { id: 'tea', name: 'Trà', image: 'https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9' },
      { id: 'smoothie', name: 'Sinh tố', image: 'https://images.unsplash.com/photo-1623065422902-30a2d959a5c7' },
      { id: 'cake', name: 'Bánh ngọt', image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187' },
      { id: 'snack', name: 'Đồ ăn vặt', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff' }
    ];
    
    for (const category of categories) {
      await connection.execute(
        'INSERT IGNORE INTO categories (id, name, image, created_at) VALUES (?, ?, ?, ?)',
        [category.id, category.name, category.image, randomDate(90)]
      );
    }
    
    // Thêm sản phẩm
    console.log('Đang thêm dữ liệu sản phẩm...');
    
    const products = [
      // Cà phê
      { 
        id: createId(), 
        name: 'Cà phê đen', 
        description: 'Cà phê đen nguyên chất, đậm đà hương vị', 
        price: 25000, 
        image: 'https://images.unsplash.com/photo-1521302755074-4d326f525f50',
        category_id: 'coffee',
        stock_quantity: 100
      },
      { 
        id: createId(), 
        name: 'Cà phê sữa', 
        description: 'Cà phê sữa béo ngậy, vị ngọt dịu', 
        price: 30000, 
        image: 'https://images.unsplash.com/photo-1509042239860-f13409160181',
        category_id: 'coffee',
        stock_quantity: 100
      },
      { 
        id: createId(), 
        name: 'Bạc xỉu', 
        description: 'Bạc xỉu ngọt ngào với lớp sữa béo ngậy', 
        price: 35000, 
        image: 'https://images.unsplash.com/photo-1497636577773-f1231844b336',
        category_id: 'coffee',
        stock_quantity: 80
      },
      // Trà
      { 
        id: createId(), 
        name: 'Trà đào cam sả', 
        description: 'Trà đào thơm ngon kết hợp với cam và sả tươi mát', 
        price: 40000, 
        image: 'https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9',
        category_id: 'tea',
        stock_quantity: 50
      },
      { 
        id: createId(), 
        name: 'Trà sữa trân châu', 
        description: 'Trà sữa thơm ngon với trân châu dẻo', 
        price: 45000, 
        image: 'https://images.unsplash.com/photo-1558857563-c0c7cc24d936',
        category_id: 'tea',
        stock_quantity: 70
      },
      // Sinh tố
      { 
        id: createId(), 
        name: 'Sinh tố xoài', 
        description: 'Sinh tố xoài ngọt thanh mát', 
        price: 45000, 
        image: 'https://images.unsplash.com/photo-1623065422902-30a2d959a5c7',
        category_id: 'smoothie',
        stock_quantity: 30
      },
      { 
        id: createId(), 
        name: 'Sinh tố dâu', 
        description: 'Sinh tố dâu tây tươi ngon', 
        price: 50000, 
        image: 'https://images.unsplash.com/photo-1553530979-fbb9e4aee36f',
        category_id: 'smoothie',
        stock_quantity: 20
      },
      // Bánh ngọt
      { 
        id: createId(), 
        name: 'Bánh tiramisu', 
        description: 'Bánh tiramisu hương vị cà phê thơm ngon', 
        price: 35000, 
        image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9',
        category_id: 'cake',
        stock_quantity: 15
      },
      { 
        id: createId(), 
        name: 'Bánh cheese cake', 
        description: 'Bánh phô mai mềm mịn thơm ngon', 
        price: 40000, 
        image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187',
        category_id: 'cake',
        stock_quantity: 10
      },
      // Đồ ăn vặt
      { 
        id: createId(), 
        name: 'Bánh mì que', 
        description: 'Bánh mì que giòn tan ăn kèm pate', 
        price: 15000, 
        image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff',
        category_id: 'snack',
        stock_quantity: 40
      }
    ];
    
    for (const product of products) {
      await connection.execute(
        `INSERT IGNORE INTO products 
         (id, name, description, price, image, category_id, stock_quantity, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          product.id, 
          product.name, 
          product.description, 
          product.price, 
          product.image, 
          product.category_id, 
          product.stock_quantity,
          randomDate(30)
        ]
      );
    }
    
    // Thêm đơn hàng
    console.log('Đang thêm dữ liệu đơn hàng...');
    
    const orderStatuses = ['pending', 'confirmed', 'processing', 'shipping', 'completed', 'cancelled'];
    const paymentMethods = ['cod', 'vnpay'];
    const paymentStatuses = ['pending', 'paid', 'failed'];
    
    // Tạo 20 đơn hàng mẫu
    for (let i = 0; i < 20; i++) {
      const orderId = createId();
      const userIndex = Math.floor(Math.random() * userIds.length);
      const userId = userIds[userIndex];
      const userName = userNames[userIndex];
      const userPhone = userPhones[userIndex];
      const userAddress = userAddresses[userIndex];
      
      // Chọn ngẫu nhiên trạng thái đơn hàng
      const orderStatus = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
      // Chọn ngẫu nhiên phương thức thanh toán
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      // Chọn trạng thái thanh toán phù hợp với phương thức
      let paymentStatus;
      if (orderStatus === 'cancelled') {
        paymentStatus = Math.random() > 0.5 ? 'pending' : 'failed';
      } else if (orderStatus === 'completed') {
        paymentStatus = 'paid';
      } else {
        paymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
      }
      
      // Tính tổng giá trị đơn hàng
      const subtotal = Math.floor(Math.random() * 500000) + 50000;
      const shippingFee = Math.floor(Math.random() * 30000);
      const total = subtotal + shippingFee;
      
      // Thêm đơn hàng vào bảng orders
      await connection.execute(
        `INSERT INTO orders 
         (id, user_id, full_name, phone, address, note, payment_method, payment_status, order_status, subtotal, shipping_fee, total, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          userId,
          userName,
          userPhone,
          userAddress,
          'Ghi chú đơn hàng: ' + (i + 1),
          paymentMethod,
          paymentStatus,
          orderStatus,
          subtotal,
          shippingFee,
          total,
          randomDate(30)
        ]
      );
      
      // Thêm các sản phẩm vào đơn hàng
      const numItems = Math.floor(Math.random() * 5) + 1; // 1-5 sản phẩm mỗi đơn
      const selectedProducts = [...products].sort(() => 0.5 - Math.random()).slice(0, numItems);
      
      for (const product of selectedProducts) {
        const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 sản phẩm mỗi loại
        const price = product.price;
        const subtotal = price * quantity;
        
        await connection.execute(
          `INSERT INTO order_items 
           (id, order_id, product_id, product_name, price, quantity, subtotal) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            createId(),
            orderId,
            product.id,
            product.name,
            price,
            quantity,
            subtotal
          ]
        );
      }
    }
    
    console.log('Thêm dữ liệu mẫu thành công!');
  } catch (error) {
    console.error('Lỗi khi thêm dữ liệu mẫu:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Thực thi script
seedDatabase(); 