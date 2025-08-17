// Script để kiểm tra các fix đã được áp dụng đúng chưa
const fs = require('fs');
const path = require('path');

console.log('🔍 Kiểm tra các fix đã được áp dụng...\n');

const checks = [
  {
    name: 'CSS btn-secondary class',
    file: 'styles/globals.css',
    check: (content) => content.includes('.btn-secondary'),
    message: 'btn-secondary class đã được thêm'
  },
  {
    name: 'Database first_order_discounts table',
    file: 'lib/db.ts',
    check: (content) => content.includes('first_order_discounts'),
    message: 'Bảng first_order_discounts đã được thêm'
  },
  {
    name: 'README.md MySQL update',
    file: 'README.md',
    check: (content) => content.includes('MYSQL_HOST') && !content.includes('MONGODB_URI'),
    message: 'README.md đã được cập nhật với MySQL'
  },
  {
    name: 'Debug endpoints protection',
    file: 'pages/api/debug.ts',
    check: (content) => content.includes('NODE_ENV === \'production\''),
    message: 'Debug endpoints đã được bảo vệ'
  },
  {
    name: 'Validation utilities',
    file: 'lib/validation.ts',
    check: (content) => content.includes('validateOrderData'),
    message: 'Validation utilities đã được tạo'
  },
  {
    name: 'Middleware security',
    file: 'middleware.ts',
    check: (content) => content.includes('X-Frame-Options'),
    message: 'Security middleware đã được tạo'
  }
];

let allPassed = true;

checks.forEach(({ name, file, check, message }) => {
  try {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (check(content)) {
        console.log(`✅ ${name}: ${message}`);
      } else {
        console.log(`❌ ${name}: Chưa được fix đúng`);
        allPassed = false;
      }
    } else {
      console.log(`❌ ${name}: File ${file} không tồn tại`);
      allPassed = false;
    }
  } catch (error) {
    console.log(`❌ ${name}: Lỗi khi kiểm tra - ${error.message}`);
    allPassed = false;
  }
});

console.log('\n' + '='.repeat(50));
if (allPassed) {
  console.log('🎉 Tất cả các fix đã được áp dụng thành công!');
  console.log('📋 Các bước tiếp theo:');
  console.log('   1. Chạy: npm run build');
  console.log('   2. Test các chức năng chính');
  console.log('   3. Setup database: gọi /api/setup-db');
} else {
  console.log('⚠️  Một số fix chưa được áp dụng đúng. Vui lòng kiểm tra lại.');
}
console.log('='.repeat(50));