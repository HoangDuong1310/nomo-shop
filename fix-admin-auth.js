const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Tìm tất cả file admin API
const adminApiFiles = glob.sync('pages/api/admin/**/*.ts', { 
  cwd: process.cwd(),
  absolute: true 
});

console.log(`Found ${adminApiFiles.length} admin API files to fix`);

let fixed = 0;
let errors = 0;

adminApiFiles.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Bỏ qua file nếu đã import getTokenFromRequest
    if (content.includes('getTokenFromRequest')) {
      console.log(`✓ ${path.relative(process.cwd(), filePath)} - Already fixed`);
      return;
    }
    
    // Bỏ qua file nếu không có auth_token
    if (!content.includes('req.cookies.auth_token')) {
      return;
    }

    let modified = false;
    
    // 1. Thêm import getTokenFromRequest
    if (content.includes("import { verifyToken } from") && !content.includes('getTokenFromRequest')) {
      content = content.replace(
        /import { verifyToken } from ([^;]+);/,
        "import { verifyToken } from $1;\nimport { getTokenFromRequest } from '../../../lib/auth-utils';"
      );
      
      // Xử lý trường hợp đường dẫn khác (customers/index.ts)
      if (!content.includes('getTokenFromRequest')) {
        content = content.replace(
          /import { verifyToken } from ([^;]+);/,
          "import { verifyToken } from $1;\nimport { getTokenFromRequest } from '../../../../lib/auth-utils';"
        );
      }
      
      // Xử lý trường hợp đường dẫn khác (categories/[id].ts, products/[id].ts)
      if (!content.includes('getTokenFromRequest')) {
        content = content.replace(
          /import { verifyToken } from ([^;]+);/,
          "import { verifyToken } from $1;\nimport { getTokenFromRequest } from '../../../../lib/auth-utils';"
        );
      }
      
      modified = true;
    }
    
    // 2. Thay thế req.cookies.auth_token với getTokenFromRequest(req)
    if (content.includes('const token = req.cookies.auth_token;')) {
      content = content.replace(
        'const token = req.cookies.auth_token;',
        'const token = getTokenFromRequest(req);'
      );
      modified = true;
    }
    
    // 3. Thay thế với pattern khác
    content = content.replace(
      /const token = req\.cookies\.auth_token;/g,
      'const token = getTokenFromRequest(req);'
    );
    
    // 4. Thay thế comment
    if (content.includes('// Lấy token từ cookie')) {
      content = content.replace(
        '// Lấy token từ cookie',
        '// Lấy token từ cookie hoặc Authorization header'
      );
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Fixed: ${path.relative(process.cwd(), filePath)}`);
      fixed++;
    }
    
  } catch (error) {
    console.error(`✗ Error fixing ${filePath}:`, error.message);
    errors++;
  }
});

console.log(`\nSummary:`);
console.log(`✓ Fixed: ${fixed} files`);
console.log(`✗ Errors: ${errors} files`);
console.log(`Total processed: ${adminApiFiles.length} files`);
