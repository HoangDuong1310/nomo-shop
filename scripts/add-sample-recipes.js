const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
const { loadEnvConfig } = require('./utils/env-loader');

// Load environment config
loadEnvConfig();

async function addSampleRecipes() {
  let connection;
  
  try {
    console.log('🍳 Adding Sample Recipes to Cloud Shop');
    console.log('=====================================\n');

    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'cloudshop'
    });

    console.log('✅ Connected to database');

    // Sample recipes data
    const recipes = [
      {
        id: `recipe-${uuidv4()}`,
        name: 'Phở Bò Truyền Thống',
        description: 'Món phở bò đậm đà hương vị với nước dùng từ xương hầm 12 giờ, thịt bò tươi ngon và các loại gia vị đặc trưng',
        image: '/images/recipes/pho-bo.jpg',
        preparation_time: 30,
        cooking_time: 720,
        servings: 4,
        difficulty_level: 'hard',
        dietary_tags: JSON.stringify(['gluten_free']),
        cuisine_type: 'vietnamese',
        meal_type: 'breakfast',
        calories: 450,
        rating: 4.8,
        views: 1250,
        is_featured: 1,
        is_active: 1,
        ingredients: [
          { name: 'Xương bò', quantity: '2', unit: 'kg', notes: 'Xương ống và xương cục' },
          { name: 'Thịt bò tái', quantity: '300', unit: 'g', notes: 'Thái mỏng' },
          { name: 'Bánh phở', quantity: '500', unit: 'g', notes: 'Bánh phở tươi' },
          { name: 'Hành tây', quantity: '2', unit: 'củ', notes: null },
          { name: 'Gừng', quantity: '100', unit: 'g', notes: 'Nướng' },
          { name: 'Quế', quantity: '2', unit: 'thanh', notes: null },
          { name: 'Hồi', quantity: '3', unit: 'cái', notes: null },
          { name: 'Thảo quả', quantity: '2', unit: 'quả', notes: null }
        ],
        steps: [
          { instruction: 'Rửa sạch xương bò, chần qua nước sôi để loại bỏ bọt bẩn', duration: 15, tips: 'Chần trong 5 phút với nước sôi' },
          { instruction: 'Nướng hành tây và gừng trên lửa cho thơm', duration: 10, tips: 'Nướng cho đến khi cháy xém bên ngoài' },
          { instruction: 'Rang quế, hồi, thảo quả trong chảo khô', duration: 5, tips: 'Rang với lửa nhỏ để không cháy' },
          { instruction: 'Cho xương vào nồi nước lạnh, đun sôi rồi hạ lửa nhỏ ninh trong 12 giờ', duration: 720, tips: 'Thỉnh thoảng vớt bọt để nước trong' },
          { instruction: 'Lọc nước dùng, nêm gia vị vừa ăn', duration: 10, tips: 'Dùng nước mắm ngon và muối' },
          { instruction: 'Trụng bánh phở, xếp vào tô cùng thịt bò tái', duration: 5, tips: 'Trụng bánh phở qua nước sôi 10 giây' },
          { instruction: 'Chan nước dùng sôi vào tô, thêm hành lá, ngò', duration: 2, tips: 'Nước phải thật sôi để chín thịt' }
        ]
      },
      {
        id: `recipe-${uuidv4()}`,
        name: 'Bánh Mì Thịt Nướng',
        description: 'Bánh mì Việt Nam giòn rụm với thịt nướng thơm lừng, rau tươi và nước sốt đặc biệt',
        image: '/images/recipes/banh-mi.jpg',
        preparation_time: 20,
        cooking_time: 15,
        servings: 2,
        difficulty_level: 'easy',
        dietary_tags: JSON.stringify([]),
        cuisine_type: 'vietnamese',
        meal_type: 'lunch',
        calories: 380,
        rating: 4.6,
        views: 890,
        is_featured: 0,
        is_active: 1,
        ingredients: [
          { name: 'Bánh mì', quantity: '2', unit: 'ổ', notes: 'Bánh mì Pháp' },
          { name: 'Thịt ba chỉ', quantity: '300', unit: 'g', notes: 'Thái mỏng' },
          { name: 'Dưa chuột', quantity: '1', unit: 'quả', notes: null },
          { name: 'Cà rốt', quantity: '1', unit: 'củ', notes: 'Ngâm chua ngọt' },
          { name: 'Ngò rí', quantity: '50', unit: 'g', notes: null },
          { name: 'Pate', quantity: '100', unit: 'g', notes: null }
        ],
        steps: [
          { instruction: 'Ướp thịt với tỏi, sả, nước mắm, đường trong 2 giờ', duration: 120, tips: 'Ướp qua đêm sẽ ngon hơn' },
          { instruction: 'Nướng thịt trên than hoa hoặc chảo cho vàng đều', duration: 10, tips: 'Lửa vừa để thịt chín đều' },
          { instruction: 'Cắt bánh mì, phết pate và mayonnaise', duration: 2, tips: null },
          { instruction: 'Xếp thịt nướng, dưa chuột, cà rốt, ngò vào bánh', duration: 2, tips: 'Xếp đẹp mắt' },
          { instruction: 'Rưới nước sốt và thưởng thức', duration: 1, tips: null }
        ]
      },
      {
        id: `recipe-${uuidv4()}`,
        name: 'Gỏi Cuốn Chay',
        description: 'Gỏi cuốn thanh mát với rau củ tươi, bún và nước chấm chay đặc biệt',
        image: '/images/recipes/goi-cuon.jpg',
        preparation_time: 15,
        cooking_time: 0,
        servings: 4,
        difficulty_level: 'easy',
        dietary_tags: JSON.stringify(['vegetarian', 'vegan', 'gluten_free']),
        cuisine_type: 'vietnamese',
        meal_type: 'snack',
        calories: 120,
        rating: 4.5,
        views: 650,
        is_featured: 1,
        is_active: 1,
        ingredients: [
          { name: 'Bánh tráng', quantity: '10', unit: 'cái', notes: 'Bánh tráng 22cm' },
          { name: 'Bún', quantity: '200', unit: 'g', notes: 'Luộc chín' },
          { name: 'Xà lách', quantity: '100', unit: 'g', notes: null },
          { name: 'Dưa chuột', quantity: '1', unit: 'quả', notes: 'Thái sợi' },
          { name: 'Cà rốt', quantity: '1', unit: 'củ', notes: 'Thái sợi' },
          { name: 'Húng lủi', quantity: '50', unit: 'g', notes: null },
          { name: 'Rau thơm các loại', quantity: '100', unit: 'g', notes: null }
        ],
        steps: [
          { instruction: 'Luộc bún, để nguội', duration: 10, tips: 'Không luộc quá mềm' },
          { instruction: 'Rửa sạch và chuẩn bị rau củ', duration: 5, tips: 'Ngâm rau với nước muối loãng' },
          { instruction: 'Nhúng bánh tráng vào nước ấm cho mềm', duration: 1, tips: 'Nước ấm vừa phải, không quá nóng' },
          { instruction: 'Xếp rau, bún lên bánh tráng', duration: 2, tips: 'Xếp gọn gàng ở 1/3 bánh tráng' },
          { instruction: 'Cuốn chặt và cắt đôi', duration: 1, tips: 'Cuốn chặt tay nhưng đừng rách bánh' }
        ]
      }
    ];

    // Insert recipes
    for (const recipe of recipes) {
      console.log(`\n📝 Adding recipe: ${recipe.name}`);
      
      // Insert main recipe
      await connection.execute(
        `INSERT INTO recipes (
          id, name, description, image, preparation_time, cooking_time,
          servings, difficulty_level, dietary_tags, cuisine_type, meal_type,
          calories, rating, views, is_featured, is_active, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          recipe.id,
          recipe.name,
          recipe.description,
          recipe.image,
          recipe.preparation_time,
          recipe.cooking_time,
          recipe.servings,
          recipe.difficulty_level,
          recipe.dietary_tags,
          recipe.cuisine_type,
          recipe.meal_type,
          recipe.calories,
          recipe.rating,
          recipe.views,
          recipe.is_featured,
          recipe.is_active,
          'admin'
        ]
      );
      
      // Insert ingredients
      for (let i = 0; i < recipe.ingredients.length; i++) {
        const ingredient = recipe.ingredients[i];
        await connection.execute(
          `INSERT INTO recipe_ingredients (
            id, recipe_id, ingredient_name, quantity, unit, notes, display_order, is_optional
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            `ing-${uuidv4()}`,
            recipe.id,
            ingredient.name,
            ingredient.quantity,
            ingredient.unit,
            ingredient.notes,
            i,
            0
          ]
        );
      }
      
      // Insert steps
      for (let i = 0; i < recipe.steps.length; i++) {
        const step = recipe.steps[i];
        await connection.execute(
          `INSERT INTO recipe_steps (
            id, recipe_id, step_number, instruction, duration_minutes, tips
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            `step-${uuidv4()}`,
            recipe.id,
            i + 1,
            step.instruction,
            step.duration || null,
            step.tips || null
          ]
        );
      }
      
      console.log(`✅ Recipe "${recipe.name}" added successfully`);
    }
    
    console.log('\n🎉 All sample recipes added successfully!');
    console.log('You can now view them in the admin panel at /admin/recipes');
    
  } catch (error) {
    console.error('❌ Error adding sample recipes:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n👋 Database connection closed');
    }
  }
}

// Run the script
addSampleRecipes()
  .then(() => {
    console.log('\n✅ Sample recipes added successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed to add sample recipes:', error);
    process.exit(1);
  });
