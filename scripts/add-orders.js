const { v4: uuidv4 } = require('uuid');
const mysql = require('mysql2/promise');

async function addSampleOrders() {
  // Kết nối database
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'cloudshop',
  });

  try {
    console.log('Đang thêm dữ liệu mẫu cho đơn hàng...');

    // Lấy danh sách users để tham chiếu
    const [users] = await connection.execute(
      'SELECT id, name, phone FROM users WHERE role = "user" LIMIT 5'
    );

    if (users.length === 0) {
      console.log('Không có user nào trong database. Thêm một số user trước.');
      return;
    }

    // Lấy danh sách sản phẩm để tham chiếu
    const [products] = await connection.execute(
      'SELECT id, name, price FROM products LIMIT 10'
    );

    if (products.length === 0) {
      console.log('Không có sản phẩm nào trong database. Thêm một số sản phẩm trước.');
      return;
    }

    // Tạo 10 đơn hàng mẫu
    const orderStatuses = ['pending', 'confirmed', 'processing', 'shipping', 'completed', 'cancelled'];
    const paymentMethods = ['cod', 'vnpay'];
    const paymentStatuses = ['pending', 'paid', 'failed'];
    
    for (let i = 0; i < 10; i++) {
      // Chọn ngẫu nhiên một user
      const user = users[Math.floor(Math.random() * users.length)];
      
      // Tạo thông tin đơn hàng
      const orderId = uuidv4();
      const orderItems = [];
      let subtotal = 0;
      
      // Thêm 1-3 sản phẩm vào đơn hàng
      const numItems = Math.floor(Math.random() * 3) + 1;
      
      // Chọn sản phẩm ngẫu nhiên không trùng lặp
      const selectedProductIndexes = new Set();
      while (selectedProductIndexes.size < numItems && selectedProductIndexes.size < products.length) {
        selectedProductIndexes.add(Math.floor(Math.random() * products.length));
      }
      
      // Thêm các sản phẩm đã chọn vào đơn hàng
      for (const index of selectedProductIndexes) {
        const product = products[index];
        const quantity = Math.floor(Math.random() * 3) + 1;
        const itemTotal = parseFloat(product.price) * quantity;
        subtotal += itemTotal;
        
        orderItems.push({
          id: uuidv4(),
          product_id: product.id,
          product_name: product.name,
          price: parseFloat(product.price),
          quantity,
          subtotal: itemTotal,
        });
      }
      
      // Tính phí giao hàng và tổng đơn hàng
      const shippingFee = Math.floor(Math.random() * 30000);
      const total = subtotal + shippingFee;
      
      // Ngày tạo đơn hàng (trong 30 ngày gần đây)
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 30));
      
      // Chọn ngẫu nhiên trạng thái đơn hàng
      const orderStatus = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
      
      // Chọn phương thức thanh toán và trạng thái phù hợp
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      let paymentStatus;
      
      if (orderStatus === 'cancelled') {
        paymentStatus = Math.random() > 0.5 ? 'pending' : 'failed';
      } else if (orderStatus === 'completed') {
        paymentStatus = 'paid';
      } else {
        paymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
      }
      
      // Tạo đơn hàng trong database
      await connection.execute(
        `INSERT INTO orders (
          id, user_id, full_name, phone, address, note, subtotal, 
          shipping_fee, total, payment_method, payment_status, order_status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          user.id,
          user.name,
          user.phone,
          `Địa chỉ mẫu ${i + 1}, Quận 1, TP. Hồ Chí Minh`,
          `Ghi chú đơn hàng ${i + 1}`,
          subtotal,
          shippingFee,
          total,
          paymentMethod,
          paymentStatus,
          orderStatus,
          createdAt
        ]
      );
      
      // Tạo các mục đơn hàng
      for (const item of orderItems) {
        await connection.execute(
          `INSERT INTO order_items (
            id, order_id, product_id, product_name, price, quantity, subtotal, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            item.id,
            orderId,
            item.product_id,
            item.product_name,
            item.price,
            item.quantity,
            item.subtotal
          ]
        );
      }
      
      console.log(`✅ Đã tạo đơn hàng #${i + 1} với ID: ${orderId}`);
    }
    
    console.log('\n🎉 Đã tạo thành công 10 đơn hàng mẫu!');
  } catch (error) {
    console.error('❌ Lỗi khi tạo đơn hàng mẫu:', error);
  } finally {
    await connection.end();
  }
}

addSampleOrders(); 