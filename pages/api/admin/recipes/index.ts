import { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery } from '../../../../lib/db';
import { verifyToken } from '../../../../lib/auth';
import { getTokenFromRequest } from '../../../../lib/auth-utils';
import { 
  Recipe, 
  RecipeFilters, 
  RecipeListResponse, 
  RecipeCreateResponse 
} from '../../../../types/recipe';

// Helper function to verify admin authentication
async function verifyAdmin(req: NextApiRequest): Promise<{ isValid: boolean; userId?: string }> {
  // In development, always allow access for testing
  if (process.env.NODE_ENV !== 'production') {
    return { isValid: true, userId: 'dev-admin' };
  }
  
  try {
    // Get token from cookie or header
    const token = getTokenFromRequest(req) || req.cookies.auth_token;
    
    if (!token) {
      return { isValid: false };
    }
    
    // Verify token
    const decodedToken = verifyToken(token);
    
    if (!decodedToken || !decodedToken.id) {
      return { isValid: false };
    }
    
    // Check admin role
    const userResult = await executeQuery({
      query: 'SELECT role FROM users WHERE id = ?',
      values: [decodedToken.id],
    });
    
    if ((userResult as any[]).length === 0 || (userResult as any[])[0].role !== 'admin') {
      return { isValid: false };
    }
    
    return { isValid: true, userId: decodedToken.id };
  } catch (error) {
    console.error('Auth verification error:', error);
    return { isValid: false };
  }
}

// GET: List recipes with filters and pagination
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Parse query parameters
    const {
      page = '1',
      limit = '12',
      search = '',
      difficulty,
      dietary_tags,
      meal_type,
      cuisine_type,
      min_time,
      max_time,
      is_featured,
      is_active,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query as Record<string, string>;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;
    
    // Build WHERE conditions
    const conditions: string[] = [];
    const params: any[] = [];
    
    if (search) {
      conditions.push('(r.name LIKE ? OR r.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (difficulty) {
      conditions.push('r.difficulty_level = ?');
      params.push(difficulty);
    }
    
    if (meal_type) {
      conditions.push('r.meal_type = ?');
      params.push(meal_type);
    }
    
    if (cuisine_type) {
      conditions.push('r.cuisine_type = ?');
      params.push(cuisine_type);
    }
    
    if (dietary_tags) {
      conditions.push('JSON_CONTAINS(r.dietary_tags, ?)');
      params.push(JSON.stringify([dietary_tags]));
    }
    
    if (min_time) {
      conditions.push('r.total_time >= ?');
      params.push(parseInt(min_time));
    }
    
    if (max_time) {
      conditions.push('r.total_time <= ?');
      params.push(parseInt(max_time));
    }
    
    if (is_featured !== undefined) {
      conditions.push('r.is_featured = ?');
      params.push(is_featured === 'true' ? 1 : 0);
    }
    
    if (is_active !== undefined) {
      conditions.push('r.is_active = ?');
      params.push(is_active === 'true' ? 1 : 0);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Validate sort_by column
    const validSortColumns = ['name', 'created_at', 'updated_at', 'rating', 'views', 'total_time'];
    const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'created_at';
    const sortDirection = sort_order === 'asc' ? 'ASC' : 'DESC';
    
    // Get total count
    const countResult = await executeQuery({
      query: `SELECT COUNT(*) as total FROM recipes r ${whereClause}`,
      values: params
    });
    const total = (countResult as any[])[0]?.total || 0;
    
    // Get recipes with pagination
    const recipes = await executeQuery({
      query: `SELECT 
        r.id,
        r.name,
        r.description,
        r.image,
        r.preparation_time,
        r.cooking_time,
        r.preparation_time + r.cooking_time as total_time,
        r.servings,
        r.difficulty_level,
        r.dietary_tags,
        r.cuisine_type,
        r.meal_type,
        r.calories,
        r.rating,
        r.views,
        r.is_featured,
        r.is_active,
        r.created_by,
        r.created_at,
        r.updated_at
      FROM recipes r
      ${whereClause}
      ORDER BY r.${sortColumn} ${sortDirection}
      LIMIT ? OFFSET ?`,
      values: [...params, limitNum, offset]
    });
    
    // Parse dietary_tags JSON for each recipe
    const parsedRecipes = (recipes as any[]).map(recipe => {
      let tags = [];
      if (recipe.dietary_tags) {
        try {
          // Try to parse as JSON first
          tags = JSON.parse(recipe.dietary_tags);
        } catch (e) {
          // If not JSON, split by space (for legacy data)
          tags = recipe.dietary_tags.split(' ').filter((t: string) => t.length > 0);
        }
      }
      return {
        ...recipe,
        dietary_tags: tags,
        is_featured: Boolean(recipe.is_featured),
        is_active: Boolean(recipe.is_active)
      };
    });
    
    const response: RecipeListResponse = {
      recipes: parsedRecipes,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      limit: limitNum
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({ error: 'Failed to fetch recipes' });
  }
}

// POST: Create a new recipe
async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  
  try {
    
    const {
      name,
      description,
      image,
      preparation_time,
      cooking_time,
      servings,
      difficulty_level,
      dietary_tags,
      cuisine_type,
      meal_type,
      calories,
      is_featured,
      is_active,
      ingredients,
      steps,
      categories,
      nutrition
    } = req.body;
    
    // Generate recipe ID
    const recipeId = `recipe-${uuidv4()}`;
    
    // Insert main recipe
    await executeQuery({
      query: `INSERT INTO recipes (
        id, name, description, image, preparation_time, cooking_time,
        servings, difficulty_level, dietary_tags, cuisine_type, meal_type,
        calories, is_featured, is_active, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      values: [
        recipeId,
        name,
        description,
        image || null,
        preparation_time || 0,
        cooking_time || 0,
        servings || 1,
        difficulty_level || 'medium',
        JSON.stringify(dietary_tags || []),
        cuisine_type || null,
        meal_type || null,
        calories || null,
        is_featured ? 1 : 0,
        is_active !== false ? 1 : 0,
        'admin'
      ]
    });
    
    // Insert ingredients
    if (ingredients && ingredients.length > 0) {
      for (let i = 0; i < ingredients.length; i++) {
        const ingredient = ingredients[i];
        await executeQuery({
          query: `INSERT INTO recipe_ingredients (
            id, recipe_id, ingredient_name, quantity, unit, notes, display_order, is_optional
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          values: [
            `ing-${uuidv4()}`,
            recipeId,
            ingredient.ingredient_name,
            ingredient.quantity || null,
            ingredient.unit || null,
            ingredient.notes || null,
            i,
            ingredient.is_optional ? 1 : 0
          ]
        });
      }
    }
    
    // Insert steps
    if (steps && steps.length > 0) {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        await executeQuery({
          query: `INSERT INTO recipe_steps (
            id, recipe_id, step_number, instruction, image, duration_minutes, tips
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          values: [
            `step-${uuidv4()}`,
            recipeId,
            i + 1,
            step.instruction,
            step.image || null,
            step.duration_minutes || null,
            step.tips || null
          ]
        });
      }
    }
    
    // Insert category relationships
    if (categories && categories.length > 0) {
      for (const categoryId of categories) {
        await executeQuery({
          query: `INSERT INTO recipe_category_map (recipe_id, category_id) VALUES (?, ?)`,
          values: [recipeId, categoryId]
        });
      }
    }
    
    // Insert nutrition info if provided
    if (nutrition) {
      await executeQuery({
        query: `INSERT INTO recipe_nutrition (
          id, recipe_id, calories, protein, carbohydrates, fat,
          fiber, sugar, sodium, cholesterol
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        values: [
          `nut-${uuidv4()}`,
          recipeId,
          nutrition.calories || null,
          nutrition.protein || null,
          nutrition.carbohydrates || null,
          nutrition.fat || null,
          nutrition.fiber || null,
          nutrition.sugar || null,
          nutrition.sodium || null,
          nutrition.cholesterol || null
        ]
      });
    }
    
    // Fetch the created recipe
    const createdRecipeResult = await executeQuery({
      query: 'SELECT * FROM recipes WHERE id = ?',
      values: [recipeId]
    });
    const createdRecipe = (createdRecipeResult as any[])[0];
    
    const response: RecipeCreateResponse = {
      success: true,
      recipe: {
        ...createdRecipe,
        dietary_tags: JSON.parse(createdRecipe.dietary_tags || '[]'),
        is_featured: Boolean(createdRecipe.is_featured),
        is_active: Boolean(createdRecipe.is_active)
      },
      message: 'Công thức đã được tạo thành công!'
    };
    
    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating recipe:', error);
    res.status(500).json({ error: 'Failed to create recipe' });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify admin authentication
  const authResult = await verifyAdmin(req);
  if (!authResult.isValid) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  switch (req.method) {
    case 'GET':
      return handleGet(req, res);
    case 'POST':
      return handlePost(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}
