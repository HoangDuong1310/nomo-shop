const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Tìm tất cả file admin API
const adminApiFiles = glob.sync('pages/api/admin/**/*.ts', { 
  cwd: process.cwd(),
  absolute: true 
});

console.log(`Found ${adminApiFiles.length} admin API files to fix import paths`);

let fixed = 0;
let errors = 0;

adminApiFiles.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (!content.includes('getTokenFromRequest')) {
      return; // Skip files that don't have the import
    }
    
    // Tính toán đường dẫn tương đối chính xác từ file hiện tại đến lib/auth-utils
    const relativePath = path.relative(path.dirname(filePath), path.join(process.cwd(), 'lib'));
    const correctImportPath = path.posix.join(relativePath.replace(/\\/g, '/'), 'auth-utils');
    
    let modified = false;
    
    // Sửa đường dẫn import sai
    const wrongPaths = [
      '../../../lib/auth-utils',
      '../../../../lib/auth-utils'
    ];
    
    wrongPaths.forEach(wrongPath => {
      if (content.includes(`from '${wrongPath}'`)) {
        content = content.replace(
          new RegExp(`from '${wrongPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`, 'g'),
          `from '${correctImportPath}'`
        );
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Fixed import path in: ${path.relative(process.cwd(), filePath)} -> '${correctImportPath}'`);
      fixed++;
    } else {
      const currentPath = content.match(/from '([^']+\/auth-utils)'/)?.[1];
      if (currentPath) {
        console.log(`✓ Already correct: ${path.relative(process.cwd(), filePath)} -> '${currentPath}'`);
      }
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
