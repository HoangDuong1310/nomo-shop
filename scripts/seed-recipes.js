const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

// Database configuration - using the same approach as the working API
const DB_CONFIG = {
  host: process.env.DB_HOST || process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || process.env.MYSQL_PORT || '3306'),
  database: process.env.DB_DATABASE || process.env.MYSQL_DATABASE || 'cloudshop',
  user: process.env.DB_USER || process.env.MYSQL_USER || 'root',
  password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || ''
};

// Vietnamese recipe data structured for seeding
const RECIPES_DATA = [
  {
    name: 'SODA',
    description: 'Soda tươi mát với syrup và nước cốt chanh',
    servings: 1,
    preparation_time: 5,
    cooking_time: 0,
    difficulty_level: 'easy',
    meal_type: 'beverage',
    cuisine_type: 'vietnamese',
    dietary_tags: ['refreshing', 'cold'],
    ingredients: [
      { name: 'Syrup', quantity: 30, unit: 'ml' },
      { name: 'Nước đường', quantity: 10, unit: 'ml' },
      { name: 'Nước cốt chanh', quantity: 10, unit: 'ml' },
      { name: 'Soda', quantity: 250, unit: 'ml' },
      { name: 'Đá', quantity: 200, unit: 'g' }
    ],
    steps: [
      { instruction: 'Cho syrup vào ly', order: 1 },
      { instruction: 'Thêm nước đường và nước cốt chanh', order: 2 },
      { instruction: 'Đổ soda vào', order: 3 },
      { instruction: 'Cho đá và khuấy đều', order: 4 }
    ]
  },
  {
    name: 'Matcha Latte Lạnh',
    description: 'Trà matcha latte thơm ngon với sữa tươi và đá',
    servings: 1,
    preparation_time: 10,
    cooking_time: 0,
    difficulty_level: 'medium',
    meal_type: 'beverage',
    cuisine_type: 'japanese',
    dietary_tags: ['matcha', 'milk', 'cold'],
    ingredients: [
      { name: 'Bột matcha', quantity: 3, unit: 'g' },
      { name: 'Nước nóng 70-80°C', quantity: 50, unit: 'ml' },
      { name: 'Sữa đặc', quantity: 20, unit: 'ml' },
      { name: 'Sữa tươi không đường', quantity: 100, unit: 'ml' },
      { name: 'Đường nước', quantity: 5, unit: 'ml' },
      { name: 'Đá viên', quantity: 200, unit: 'g' }
    ],
    steps: [
      { instruction: 'Rây matcha vào ly → cho 50ml nước nóng → đánh tan (tránh vón cục)', order: 1 },
      { instruction: 'Thêm sữa đặc + sữa tươi + đường nước → khuấy đều', order: 2 },
      { instruction: 'Cho đá đầy ly (200g) → lắc hoặc khuấy', order: 3 },
      { instruction: 'Trang trí rắc 1 chút bột matcha trên mặt', order: 4 }
    ]
  },
  {
    name: 'Matcha Latte Nóng',
    description: 'Matcha latte nóng thơm ngon cho mùa đông',
    servings: 1,
    preparation_time: 10,
    cooking_time: 5,
    difficulty_level: 'medium',
    meal_type: 'beverage',
    cuisine_type: 'japanese',
    dietary_tags: ['matcha', 'hot', 'milk'],
    ingredients: [
      { name: 'Matcha', quantity: 3, unit: 'g' },
      { name: 'Nước nóng 70–80°C', quantity: 50, unit: 'ml' },
      { name: 'Sữa tươi nóng 60–65°C', quantity: 430, unit: 'ml' },
      { name: 'Sữa đặc', quantity: 15, unit: 'ml' },
      { name: 'Siro đường 1:1', quantity: 5, unit: 'ml', optional: true }
    ],
    steps: [
      { instruction: 'Cho 3g matcha vào cốc', order: 1 },
      { instruction: 'Thêm 10–15ml nước nóng, dằm/miết thành hồ sệt mịn', order: 2 },
      { instruction: 'Thêm nước nóng còn lại tới đủ 50ml, lắc/whisk 10–15 giây', order: 3 },
      { instruction: 'Khuấy tan 15ml sữa đặc + 0–5ml siro (nếu cần)', order: 4 },
      { instruction: 'Rót sữa nóng vào, khuấy đều, châm tới vạch 500ml', order: 5 }
    ]
  },
  {
    name: 'Trà Sữa Trân Châu Đường Đen',
    description: 'Trà sữa truyền thống với trân châu đường đen',
    servings: 1,
    preparation_time: 20,
    cooking_time: 15,
    difficulty_level: 'hard',
    meal_type: 'beverage',
    cuisine_type: 'taiwanese',
    dietary_tags: ['milk_tea', 'boba', 'brown_sugar'],
    ingredients: [
      { name: 'Hồng trà (trà đen/assam/ceylon ủ)', quantity: 100, unit: 'ml' },
      { name: 'Bột béo (B-One/Indo)', quantity: 12, unit: 'g' },
      { name: 'Sữa tươi không đường', quantity: 80, unit: 'ml' },
      { name: 'Sữa đặc', quantity: 15, unit: 'ml' },
      { name: 'Đường nâu/đường đen', quantity: 20, unit: 'g' },
      { name: 'Trân châu đen', quantity: 50, unit: 'g' },
      { name: 'Đá viên', quantity: 175, unit: 'g' }
    ],
    steps: [
      { instruction: 'Ủ trà: 10g hồng trà khô/1 lít nước, nhiệt độ 90–95°C, ủ 10–15 phút → lọc bã, để nguội', order: 1 },
      { instruction: 'Pha nền sữa: Hòa tan 12g bột béo với một ít nước nóng → thêm 100ml trà + 80ml sữa tươi + 15ml sữa đặc → khuấy đều', order: 2 },
      { instruction: 'Rim trân châu: Sau khi luộc trân châu, rim với đường đen + ít nước cho sánh lại (giữ nóng ấm)', order: 3 },
      { instruction: 'Trang trí ly: Cho trân châu rim đường đen vào đáy ly, rưới syrup đường đen dọc thành ly', order: 4 },
      { instruction: 'Hoàn thiện: Thêm đá, rót trà sữa vào, có thể thêm 1 lớp kem sữa nếu muốn upsell', order: 5 }
    ]
  },
  {
    name: 'Mỳ Cay Bò Mỹ',
    description: 'Mỳ Koreno cay nồng với ba chỉ bò Mỹ và rau củ',
    servings: 1,
    preparation_time: 15,
    cooking_time: 10,
    difficulty_level: 'medium',
    meal_type: 'main',
    cuisine_type: 'korean',
    dietary_tags: ['spicy', 'beef', 'noodles'],
    ingredients: [
      { name: 'Mỳ Koreno', quantity: 90, unit: 'g' },
      { name: 'Nước dùng cay', quantity: 400, unit: 'ml' },
      { name: 'Ba chỉ bò Mỹ', quantity: 75, unit: 'g' },
      { name: 'Xúc xích', quantity: 1, unit: 'cây' },
      { name: 'Cá viên', quantity: 3, unit: 'viên' },
      { name: 'Súp lơ xanh', quantity: 3, unit: 'nhánh nhỏ' },
      { name: 'Nấm kim châm', quantity: 30, unit: 'g' },
      { name: 'Cải thìa', quantity: 3, unit: 'cây nhỏ' },
      { name: 'Kim chi', quantity: 35, unit: 'g' }
    ],
    steps: [
      { instruction: 'Luộc mỳ chín 80% (hơi dai, chưa nở hết)', order: 1 },
      { instruction: 'Vớt ra, xả nhanh bằng nước lạnh, trộn 1 ít dầu ăn để không dính', order: 2 },
      { instruction: 'Luộc sơ súp lơ, cải thìa, nấm kim châm → vừa chín, giữ màu', order: 3 },
      { instruction: 'Trụng xúc xích + cá viên', order: 4 },
      { instruction: 'Ba chỉ bò Mỹ: nhúng nước sôi cho chín tái (không để sống)', order: 5 },
      { instruction: 'Cho vào hộp giấy: mỳ + topping', order: 6 },
      { instruction: 'Múc 400ml nước dùng nóng, đã nêm gia vị + sốt cay theo cấp độ khách chọn', order: 7 },
      { instruction: 'Cho nước dùng vào túi zip chịu nhiệt, cót chặt', order: 8 }
    ]
  },
  {
    name: 'Mỳ Ý Sốt Cà Chua Bò Bằm',
    description: 'Mỳ spaghetti với sốt cà chua và thịt bò bằm thơm ngon',
    servings: 1,
    preparation_time: 10,
    cooking_time: 15,
    difficulty_level: 'medium',
    meal_type: 'main',
    cuisine_type: 'italian',
    dietary_tags: ['pasta', 'beef', 'tomato'],
    ingredients: [
      { name: 'Mì spaghetti khô', quantity: 90, unit: 'g' },
      { name: 'Thịt bò bằm', quantity: 75, unit: 'g' },
      { name: 'Hành tây', quantity: 20, unit: 'g' },
      { name: 'Tỏi', quantity: 5, unit: 'g' },
      { name: 'Sốt cà chua (tomato sauce/puree)', quantity: 110, unit: 'g' },
      { name: 'Dầu olive (hoặc dầu ăn)', quantity: 10, unit: 'ml' },
      { name: 'Phô mai bào Parmesan', quantity: 7.5, unit: 'g', optional: true }
    ],
    steps: [
      { instruction: 'Nấu sôi 1 nồi nước + ít muối', order: 1 },
      { instruction: 'Luộc mì spaghetti 8–10 phút → vừa chín tới (al dente)', order: 2 },
      { instruction: 'Vớt ra, trộn ít dầu olive để không dính', order: 3 },
      { instruction: 'Phi thơm hành tây + tỏi băm với dầu olive', order: 4 },
      { instruction: 'Cho thịt bò bằm vào, xào tơi, nêm chút muối + tiêu', order: 5 },
      { instruction: 'Thêm sốt cà chua, đảo đều', order: 6 },
      { instruction: 'Nêm: 1 thìa ketchup (nếu muốn ngọt hơn) + ít oregano/basil', order: 7 },
      { instruction: 'Đun lửa nhỏ 5–7 phút cho sốt sệt lại', order: 8 },
      { instruction: 'Cho mì vào chảo sốt, đảo đều 1–2 phút cho sợi mì thấm sốt', order: 9 },
      { instruction: 'Trình bày ra đĩa/tô, rắc thêm phô mai bào', order: 10 }
    ]
  }
];

class RecipeSeedManager {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      // First try to connect to the database
      try {
        this.connection = await mysql.createConnection(DB_CONFIG);
        console.log('✅ Connected to database successfully');
        return;
      } catch (error) {
        if (error.code === 'ER_BAD_DB_ERROR') {
          console.log('🔨 Database does not exist, creating it...');
          await this.createDatabase();
        } else {
          console.log('⚠️  Database connection error:', error.code, '-', error.message);
          if (error.message.includes('Schema directory')) {
            console.log('💡 This appears to be a MySQL schema directory issue.');
            console.log('💡 Trying to connect directly without creating database...');
            // Try connecting with a different approach
            await this.connectWithRetry();
            return;
          }
          throw error;
        }
      }
      
      // Try connecting again after creating database
      this.connection = await mysql.createConnection(DB_CONFIG);
      console.log('✅ Connected to database successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      throw error;
    }
  }

  async connectWithRetry() {
    // Try connecting without specifying database first, then use the database
    const tempConnection = await mysql.createConnection({
      host: DB_CONFIG.host,
      port: DB_CONFIG.port,
      user: DB_CONFIG.user,
      password: DB_CONFIG.password,
    });
    
    try {
      // Check if database exists
      const [databases] = await tempConnection.execute('SHOW DATABASES');
      const dbExists = databases.some(row => Object.values(row)[0] === DB_CONFIG.database);
      
      if (!dbExists) {
        console.log(`🔨 Creating database ${DB_CONFIG.database}...`);
        await tempConnection.execute(`CREATE DATABASE ${DB_CONFIG.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log('✅ Database created successfully');
      } else {
        console.log('✅ Database already exists');
      }
      
      // Use the database
      await tempConnection.execute(`USE ${DB_CONFIG.database}`);
      this.connection = tempConnection;
      console.log('✅ Connected to database successfully');
      
    } catch (error) {
      await tempConnection.end();
      throw error;
    }
  }

  async createDatabase() {
    const dbName = DB_CONFIG.database;
    
    // Create connection without specifying database
    const tempConnection = await mysql.createConnection({
      host: DB_CONFIG.host,
      port: DB_CONFIG.port,
      user: DB_CONFIG.user,
      password: DB_CONFIG.password,
    });
    
    try {
      await tempConnection.execute(`CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      console.log(`✅ Database '${dbName}' created successfully`);
    } finally {
      await tempConnection.end();
    }
  }

  async disconnect() {
    if (this.connection) {
      await this.connection.end();
      console.log('🔌 Disconnected from database');
    }
  }

  async checkTables() {
    console.log('\n📋 Checking database schema...');
    
    const requiredTables = [
      'recipes',
      'recipe_ingredients', 
      'recipe_steps',
      'recipe_categories',
      'recipe_category_map',
      'recipe_nutrition'
    ];

    const existingTables = [];
    
    try {
      const [tables] = await this.connection.execute('SHOW TABLES');
      const tableNames = tables.map(row => Object.values(row)[0]);
      
      console.log('🔍 Found tables:', tableNames.join(', '));
      
      for (const table of requiredTables) {
        if (tableNames.includes(table)) {
          existingTables.push(table);
          console.log(`✅ Table '${table}' exists`);
        } else {
          console.log(`❌ Table '${table}' missing`);
        }
      }
      
      return {
        hasAllTables: existingTables.length === requiredTables.length,
        existingTables,
        missingTables: requiredTables.filter(t => !existingTables.includes(t))
      };
      
    } catch (error) {
      console.error('❌ Error checking tables:', error.message);
      throw error;
    }
  }

  async checkExistingRecipes() {
    console.log('\n📊 Checking existing recipes...');
    
    try {
      const [recipes] = await this.connection.execute('SELECT COUNT(*) as count, name FROM recipes GROUP BY name');
      
      if (recipes.length > 0) {
        console.log(`🍽️  Found ${recipes.length} existing recipes:`);
        recipes.forEach((recipe, index) => {
          console.log(`   ${index + 1}. ${recipe.name} (${recipe.count} entries)`);
        });
        
        return recipes.map(r => r.name);
      } else {
        console.log('📭 No existing recipes found');
        return [];
      }
    } catch (error) {
      console.error('❌ Error checking existing recipes:', error.message);
      throw error;
    }
  }

  async createRecipe(recipeData) {
    const recipeId = `recipe-${uuidv4()}`;
    
    try {
      // Start transaction
      await this.connection.beginTransaction();
      
      // Insert main recipe
      await this.connection.execute(`
        INSERT INTO recipes (
          id, name, description, image, preparation_time, cooking_time,
          servings, difficulty_level, dietary_tags, cuisine_type, meal_type,
          calories, is_featured, is_active, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        recipeId,
        recipeData.name,
        recipeData.description,
        recipeData.image || null,
        recipeData.preparation_time || 0,
        recipeData.cooking_time || 0,
        recipeData.servings || 1,
        recipeData.difficulty_level || 'medium',
        JSON.stringify(recipeData.dietary_tags || []),
        recipeData.cuisine_type || null,
        recipeData.meal_type || null,
        recipeData.calories || null,
        recipeData.is_featured ? 1 : 0,
        recipeData.is_active !== false ? 1 : 0,
        'seed-script'
      ]);

      // Insert ingredients
      if (recipeData.ingredients && recipeData.ingredients.length > 0) {
        for (let i = 0; i < recipeData.ingredients.length; i++) {
          const ingredient = recipeData.ingredients[i];
          await this.connection.execute(`
            INSERT INTO recipe_ingredients (
              id, recipe_id, ingredient_name, quantity, unit, notes, display_order, is_optional
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            `ing-${uuidv4()}`,
            recipeId,
            ingredient.name,
            ingredient.quantity || null,
            ingredient.unit || null,
            ingredient.notes || null,
            i,
            ingredient.optional ? 1 : 0
          ]);
        }
      }

      // Insert steps
      if (recipeData.steps && recipeData.steps.length > 0) {
        for (let i = 0; i < recipeData.steps.length; i++) {
          const step = recipeData.steps[i];
          await this.connection.execute(`
            INSERT INTO recipe_steps (
              id, recipe_id, step_number, instruction, image, duration_minutes, tips
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
            `step-${uuidv4()}`,
            recipeId,
            step.order || i + 1,
            step.instruction,
            step.image || null,
            step.duration_minutes || null,
            step.tips || null
          ]);
        }
      }

      // Commit transaction
      await this.connection.commit();
      
      return recipeId;
    } catch (error) {
      // Rollback transaction
      await this.connection.rollback();
      throw error;
    }
  }

  async seedRecipes(skipExisting = true) {
    console.log('\n🌱 Starting recipe seeding process...');
    
    const existingRecipes = await this.checkExistingRecipes();
    let created = 0;
    let skipped = 0;
    let failed = 0;

    for (const recipeData of RECIPES_DATA) {
      try {
        if (skipExisting && existingRecipes.includes(recipeData.name)) {
          console.log(`⏭️  Skipping existing recipe: ${recipeData.name}`);
          skipped++;
          continue;
        }

        const recipeId = await this.createRecipe(recipeData);
        console.log(`✅ Created recipe: ${recipeData.name} (ID: ${recipeId})`);
        created++;
        
      } catch (error) {
        console.error(`❌ Failed to create recipe '${recipeData.name}':`, error.message);
        failed++;
      }
    }

    console.log('\n📈 Seeding Summary:');
    console.log(`   ✅ Created: ${created} recipes`);
    console.log(`   ⏭️  Skipped: ${skipped} recipes`);
    console.log(`   ❌ Failed: ${failed} recipes`);
    console.log(`   📊 Total processed: ${created + skipped + failed} recipes`);
    
    return { created, skipped, failed };
  }

  async run(options = {}) {
    const { 
      skipExisting = true, 
      checkSchema = true 
    } = options;

    try {
      console.log('🚀 Recipe Seed Script Starting...');
      console.log('================================');
      
      await this.connect();
      
      if (checkSchema) {
        const schemaCheck = await this.checkTables();
        
        if (!schemaCheck.hasAllTables) {
          console.log('\n❌ Missing required tables:');
          schemaCheck.missingTables.forEach(table => {
            console.log(`   - ${table}`);
          });
          console.log('\n💡 Please ensure all recipe tables are created before running this script.');
          return false;
        } else {
          console.log('\n✅ All required tables exist');
        }
      }
      
      const results = await this.seedRecipes(skipExisting);
      
      console.log('\n🎉 Recipe seeding completed!');
      return results.created > 0 || results.skipped > 0;
      
    } catch (error) {
      console.error('\n💥 Fatal error during seeding:', error.message);
      return false;
    } finally {
      await this.disconnect();
    }
  }
}

// CLI execution
async function main() {
  // Load environment variables
  require('dotenv').config({ path: '.env.local' });
  
  const args = process.argv.slice(2);
  const options = {
    skipExisting: !args.includes('--force'),
    checkSchema: !args.includes('--skip-schema-check')
  };

  console.log('Options:', {
    skipExisting: options.skipExisting ? 'Yes (use --force to override)' : 'No',
    checkSchema: options.checkSchema ? 'Yes (use --skip-schema-check to skip)' : 'No'
  });

  const seedManager = new RecipeSeedManager();
  const success = await seedManager.run(options);
  
  process.exit(success ? 0 : 1);
}

// Export for use as module
module.exports = { RecipeSeedManager, RECIPES_DATA };

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Script execution failed:', error);
    process.exit(1);
  });
}