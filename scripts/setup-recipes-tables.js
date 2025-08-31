const mysql = require('mysql2/promise');
const { loadEnvConfig } = require('./utils/env-loader');

// Load environment config
loadEnvConfig();

async function setupRecipesTables() {
  let connection;
  
  try {
    console.log('🍳 RECIPES DATABASE SETUP - CLOUD SHOP');
    console.log('=====================================\n');

    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'cloudshop'
    });

    console.log('✅ Connected to database:', process.env.DB_DATABASE || 'cloudshop');

    // 1. RECIPES TABLE
    console.log('\n1️⃣ Creating recipes table...');
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS recipes (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        image VARCHAR(255),
        preparation_time INT DEFAULT 0 COMMENT 'Time in minutes',
        cooking_time INT DEFAULT 0 COMMENT 'Time in minutes',
        total_time INT GENERATED ALWAYS AS (preparation_time + cooking_time) STORED,
        servings INT DEFAULT 1,
        difficulty_level ENUM('easy', 'medium', 'hard', 'expert') DEFAULT 'medium',
        dietary_tags JSON COMMENT 'Array of dietary tags like vegetarian, vegan, gluten-free',
        cuisine_type VARCHAR(100),
        meal_type VARCHAR(100),
        calories INT,
        rating DECIMAL(2,1) DEFAULT 0.0,
        views INT DEFAULT 0,
        is_featured BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        created_by VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_difficulty (difficulty_level),
        INDEX idx_featured (is_featured),
        INDEX idx_active (is_active),
        INDEX idx_created_at (created_at),
        FULLTEXT idx_search (name, description)
      )
    `);
    console.log('✅ Recipes table created');

    // 2. RECIPE INGREDIENTS TABLE
    console.log('\n2️⃣ Creating recipe ingredients table...');
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS recipe_ingredients (
        id VARCHAR(50) PRIMARY KEY,
        recipe_id VARCHAR(50) NOT NULL,
        ingredient_name VARCHAR(255) NOT NULL,
        quantity DECIMAL(10,2),
        unit VARCHAR(50),
        notes VARCHAR(255),
        display_order INT DEFAULT 0,
        is_optional BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
        INDEX idx_recipe_id (recipe_id),
        INDEX idx_display_order (display_order)
      )
    `);
    console.log('✅ Recipe ingredients table created');

    // 3. RECIPE STEPS TABLE
    console.log('\n3️⃣ Creating recipe steps table...');
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS recipe_steps (
        id VARCHAR(50) PRIMARY KEY,
        recipe_id VARCHAR(50) NOT NULL,
        step_number INT NOT NULL,
        instruction TEXT NOT NULL,
        image VARCHAR(255),
        duration_minutes INT,
        tips TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
        INDEX idx_recipe_id (recipe_id),
        INDEX idx_step_number (step_number),
        UNIQUE KEY unique_recipe_step (recipe_id, step_number)
      )
    `);
    console.log('✅ Recipe steps table created');

    // 4. RECIPE CATEGORIES TABLE (for recipe-specific categories)
    console.log('\n4️⃣ Creating recipe categories table...');
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS recipe_categories (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        image VARCHAR(255),
        display_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_display_order (display_order),
        INDEX idx_active (is_active)
      )
    `);
    console.log('✅ Recipe categories table created');

    // 5. RECIPE TO CATEGORY RELATIONSHIP
    console.log('\n5️⃣ Creating recipe to category relationship table...');
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS recipe_category_map (
        recipe_id VARCHAR(50) NOT NULL,
        category_id VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (recipe_id, category_id),
        FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES recipe_categories(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Recipe category mapping table created');

    // 6. RECIPE REVIEWS TABLE (optional - for future enhancement)
    console.log('\n6️⃣ Creating recipe reviews table...');
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS recipe_reviews (
        id VARCHAR(50) PRIMARY KEY,
        recipe_id VARCHAR(50) NOT NULL,
        user_id VARCHAR(50),
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        is_approved BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_recipe_id (recipe_id),
        INDEX idx_user_id (user_id),
        INDEX idx_approved (is_approved),
        UNIQUE KEY unique_user_review (recipe_id, user_id)
      )
    `);
    console.log('✅ Recipe reviews table created');

    // 7. RECIPE NUTRITION TABLE (optional - for detailed nutrition info)
    console.log('\n7️⃣ Creating recipe nutrition table...');
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS recipe_nutrition (
        id VARCHAR(50) PRIMARY KEY,
        recipe_id VARCHAR(50) NOT NULL UNIQUE,
        calories INT,
        protein DECIMAL(10,2) COMMENT 'in grams',
        carbohydrates DECIMAL(10,2) COMMENT 'in grams',
        fat DECIMAL(10,2) COMMENT 'in grams',
        fiber DECIMAL(10,2) COMMENT 'in grams',
        sugar DECIMAL(10,2) COMMENT 'in grams',
        sodium DECIMAL(10,2) COMMENT 'in milligrams',
        cholesterol DECIMAL(10,2) COMMENT 'in milligrams',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Recipe nutrition table created');

    // Insert some default recipe categories
    console.log('\n8️⃣ Inserting default recipe categories...');
    
    const defaultCategories = [
      { id: 'cat-appetizers', name: 'Khai vị', description: 'Món khai vị và món ăn nhẹ' },
      { id: 'cat-main-course', name: 'Món chính', description: 'Các món ăn chính' },
      { id: 'cat-desserts', name: 'Tráng miệng', description: 'Món tráng miệng và bánh ngọt' },
      { id: 'cat-beverages', name: 'Đồ uống', description: 'Thức uống các loại' },
      { id: 'cat-salads', name: 'Salad', description: 'Các loại salad' },
      { id: 'cat-soups', name: 'Súp & Canh', description: 'Các món súp và canh' },
      { id: 'cat-breakfast', name: 'Bữa sáng', description: 'Món ăn sáng' },
      { id: 'cat-snacks', name: 'Ăn vặt', description: 'Món ăn vặt và bánh' }
    ];

    for (const category of defaultCategories) {
      await connection.execute(
        `INSERT IGNORE INTO recipe_categories (id, name, description, display_order) 
         VALUES (?, ?, ?, ?)`,
        [category.id, category.name, category.description, defaultCategories.indexOf(category)]
      );
    }
    console.log('✅ Default recipe categories inserted');

    console.log('\n✨ All recipe tables created successfully!');
    console.log('You can now start adding recipes to your admin panel.');

  } catch (error) {
    console.error('❌ Error setting up recipe tables:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n👋 Database connection closed');
    }
  }
}

// Run the setup
setupRecipesTables()
  .then(() => {
    console.log('\n✅ Recipe database setup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Recipe database setup failed:', error);
    process.exit(1);
  });
