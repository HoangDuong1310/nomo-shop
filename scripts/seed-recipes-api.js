const axios = require('axios');

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
      { ingredient_name: 'Syrup', quantity: 30, unit: 'ml' },
      { ingredient_name: 'Nước đường', quantity: 10, unit: 'ml' },
      { ingredient_name: 'Nước cốt chanh', quantity: 10, unit: 'ml' },
      { ingredient_name: 'Soda', quantity: 250, unit: 'ml' },
      { ingredient_name: 'Đá', quantity: 200, unit: 'g' }
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
      { ingredient_name: 'Bột matcha', quantity: 3, unit: 'g' },
      { ingredient_name: 'Nước nóng 70-80°C', quantity: 50, unit: 'ml' },
      { ingredient_name: 'Sữa đặc', quantity: 20, unit: 'ml' },
      { ingredient_name: 'Sữa tươi không đường', quantity: 100, unit: 'ml' },
      { ingredient_name: 'Đường nước', quantity: 5, unit: 'ml' },
      { ingredient_name: 'Đá viên', quantity: 200, unit: 'g' }
    ],
    steps: [
      { instruction: 'Rây matcha vào ly → cho 50ml nước nóng → đánh tan (tránh vón cục)' },
      { instruction: 'Thêm sữa đặc + sữa tươi + đường nước → khuấy đều' },
      { instruction: 'Cho đá đầy ly (200g) → lắc hoặc khuấy' },
      { instruction: 'Trang trí rắc 1 chút bột matcha trên mặt' }
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
      { ingredient_name: 'Matcha', quantity: 3, unit: 'g' },
      { ingredient_name: 'Nước nóng 70–80°C', quantity: 50, unit: 'ml' },
      { ingredient_name: 'Sữa tươi nóng 60–65°C', quantity: 430, unit: 'ml' },
      { ingredient_name: 'Sữa đặc', quantity: 15, unit: 'ml' },
      { ingredient_name: 'Siro đường 1:1', quantity: 5, unit: 'ml', is_optional: true }
    ],
    steps: [
      { instruction: 'Cho 3g matcha vào cốc' },
      { instruction: 'Thêm 10–15ml nước nóng, dằm/miết thành hồ sệt mịn' },
      { instruction: 'Thêm nước nóng còn lại tới đủ 50ml, lắc/whisk 10–15 giây' },
      { instruction: 'Khuấy tan 15ml sữa đặc + 0–5ml siro (nếu cần)' },
      { instruction: 'Rót sữa nóng vào, khuấy đều, châm tới vạch 500ml' }
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
      { ingredient_name: 'Hồng trà (trà đen/assam/ceylon ủ)', quantity: 100, unit: 'ml' },
      { ingredient_name: 'Bột béo (B-One/Indo)', quantity: 12, unit: 'g' },
      { ingredient_name: 'Sữa tươi không đường', quantity: 80, unit: 'ml' },
      { ingredient_name: 'Sữa đặc', quantity: 15, unit: 'ml' },
      { ingredient_name: 'Đường nâu/đường đen', quantity: 20, unit: 'g' },
      { ingredient_name: 'Trân châu đen', quantity: 50, unit: 'g' },
      { ingredient_name: 'Đá viên', quantity: 175, unit: 'g' }
    ],
    steps: [
      { instruction: 'Ủ trà: 10g hồng trà khô/1 lít nước, nhiệt độ 90–95°C, ủ 10–15 phút → lọc bã, để nguội' },
      { instruction: 'Pha nền sữa: Hòa tan 12g bột béo với một ít nước nóng → thêm 100ml trà + 80ml sữa tươi + 15ml sữa đặc → khuấy đều' },
      { instruction: 'Rim trân châu: Sau khi luộc trân châu, rim với đường đen + ít nước cho sánh lại (giữ nóng ấm)' },
      { instruction: 'Trang trí ly: Cho trân châu rim đường đen vào đáy ly, rưới syrup đường đen dọc thành ly' },
      { instruction: 'Hoàn thiện: Thêm đá, rót trà sữa vào, có thể thêm 1 lớp kem sữa nếu muốn upsell' }
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
      { ingredient_name: 'Mỳ Koreno', quantity: 90, unit: 'g' },
      { ingredient_name: 'Nước dùng cay', quantity: 400, unit: 'ml' },
      { ingredient_name: 'Ba chỉ bò Mỹ', quantity: 75, unit: 'g' },
      { ingredient_name: 'Xúc xích', quantity: 1, unit: 'cây' },
      { ingredient_name: 'Cá viên', quantity: 3, unit: 'viên' },
      { ingredient_name: 'Súp lơ xanh', quantity: 3, unit: 'nhánh nhỏ' },
      { ingredient_name: 'Nấm kim châm', quantity: 30, unit: 'g' },
      { ingredient_name: 'Cải thìa', quantity: 3, unit: 'cây nhỏ' },
      { ingredient_name: 'Kim chi', quantity: 35, unit: 'g' }
    ],
    steps: [
      { instruction: 'Luộc mỳ chín 80% (hơi dai, chưa nở hết)' },
      { instruction: 'Vớt ra, xả nhanh bằng nước lạnh, trộn 1 ít dầu ăn để không dính' },
      { instruction: 'Luộc sơ súp lơ, cải thìa, nấm kim châm → vừa chín, giữ màu' },
      { instruction: 'Trụng xúc xích + cá viên' },
      { instruction: 'Ba chỉ bò Mỹ: nhúng nước sôi cho chín tái (không để sống)' },
      { instruction: 'Cho vào hộp giấy: mỳ + topping' },
      { instruction: 'Múc 400ml nước dùng nóng, đã nêm gia vị + sốt cay theo cấp độ khách chọn' },
      { instruction: 'Cho nước dùng vào túi zip chịu nhiệt, cột chặt' }
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
      { ingredient_name: 'Mì spaghetti khô', quantity: 90, unit: 'g' },
      { ingredient_name: 'Thịt bò bằm', quantity: 75, unit: 'g' },
      { ingredient_name: 'Hành tây', quantity: 20, unit: 'g' },
      { ingredient_name: 'Tỏi', quantity: 5, unit: 'g' },
      { ingredient_name: 'Sốt cà chua (tomato sauce/puree)', quantity: 110, unit: 'g' },
      { ingredient_name: 'Dầu olive (hoặc dầu ăn)', quantity: 10, unit: 'ml' },
      { ingredient_name: 'Phô mai bào Parmesan', quantity: 7.5, unit: 'g', is_optional: true }
    ],
    steps: [
      { instruction: 'Nấu sôi 1 nồi nước + ít muối' },
      { instruction: 'Luộc mì spaghetti 8–10 phút → vừa chín tới (al dente)' },
      { instruction: 'Vớt ra, trộn ít dầu olive để không dính' },
      { instruction: 'Phi thơm hành tây + tỏi băm với dầu olive' },
      { instruction: 'Cho thịt bò bằm vào, xào tơi, nêm chút muối + tiêu' },
      { instruction: 'Thêm sốt cà chua, đảo đều' },
      { instruction: 'Nêm: 1 thìa ketchup (nếu muốn ngọt hơn) + ít oregano/basil' },
      { instruction: 'Đun lửa nhỏ 5–7 phút cho sốt sệt lại' },
      { instruction: 'Cho mì vào chảo sốt, đảo đều 1–2 phút cho sợi mì thấm sốt' },
      { instruction: 'Trình bày ra đĩa/tô, rắc thêm phô mai bào' }
    ]
  }
];

class RecipeAPISeedManager {
  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    this.apiURL = `${this.baseURL}/api/admin/recipes`;
  }

  async checkExistingRecipes() {
    console.log('\n📊 Checking existing recipes via API...');
    
    try {
      const response = await axios.get(this.apiURL);
      const { recipes } = response.data;
      
      if (recipes && recipes.length > 0) {
        console.log(`🍽️  Found ${recipes.length} existing recipes:`);
        recipes.forEach((recipe, index) => {
          console.log(`   ${index + 1}. ${recipe.name}`);
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
    try {
      console.log(`🔄 Creating recipe: ${recipeData.name}`);
      
      const response = await axios.post(this.apiURL, recipeData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      });
      
      if (response.data.success) {
        return response.data.recipe.id;
      } else {
        console.error(`API Error Response:`, response.data);
        throw new Error(response.data.error || 'Unknown API error');
      }
    } catch (error) {
      if (error.response) {
        console.error(`HTTP ${error.response.status} Error:`, error.response.data);
        throw new Error(error.response.data.error || error.response.data.message || `HTTP ${error.response.status}`);
      } else if (error.code === 'ECONNREFUSED') {
        throw new Error('Cannot connect to API - is the server running?');
      } else {
        console.error('Request Error:', error.message);
        throw error;
      }
    }
  }

  async seedRecipes(skipExisting = true) {
    console.log('\n🌱 Starting recipe seeding via API...');
    
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
        
        // Add a small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 500));
        
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
    const { skipExisting = true } = options;

    try {
      console.log('🚀 Recipe API Seed Script Starting...');
      console.log('===================================');
      console.log(`API Endpoint: ${this.apiURL}`);
      
      const results = await this.seedRecipes(skipExisting);
      
      console.log('\n🎉 Recipe seeding completed!');
      return results.created > 0 || results.skipped > 0;
      
    } catch (error) {
      console.error('\n💥 Fatal error during seeding:', error.message);
      return false;
    }
  }
}

// CLI execution
async function main() {
  // Load environment variables
  require('dotenv').config({ path: '.env.local' });
  
  const args = process.argv.slice(2);
  const options = {
    skipExisting: !args.includes('--force')
  };

  console.log('Options:', {
    skipExisting: options.skipExisting ? 'Yes (use --force to override)' : 'No'
  });

  const seedManager = new RecipeAPISeedManager();
  const success = await seedManager.run(options);
  
  process.exit(success ? 0 : 1);
}

// Export for use as module
module.exports = { RecipeAPISeedManager, RECIPES_DATA };

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Script execution failed:', error);
    process.exit(1);
  });
}