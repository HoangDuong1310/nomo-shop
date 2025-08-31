import { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery } from '../../../../lib/db';
import { verifyToken } from '../../../../lib/auth';
import { getTokenFromRequest } from '../../../../lib/auth-utils';
import { 
  RecipeDetailResponse,
  RecipeUpdateResponse,
  RecipeDeleteResponse,
  RecipeWithRelations
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

// GET: Fetch single recipe with all relations
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  try {
    // Get main recipe data
    const recipes = await executeQuery({
      query: `SELECT 
        r.*,
        r.preparation_time + r.cooking_time as total_time
      FROM recipes r 
      WHERE r.id = ?`,
      values: [id]
    });
    
    if ((recipes as any[]).length === 0) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    
    const recipe = (recipes as any[])[0];
    
    // Get ingredients
    const ingredients = await executeQuery({
      query: `SELECT * FROM recipe_ingredients 
       WHERE recipe_id = ? 
       ORDER BY display_order`,
      values: [id]
    });
    
    // Get steps
    const steps = await executeQuery({
      query: `SELECT * FROM recipe_steps 
       WHERE recipe_id = ? 
       ORDER BY step_number`,
      values: [id]
    });
    
    // Get categories
    const categories = await executeQuery({
      query: `SELECT rc.* FROM recipe_categories rc
       JOIN recipe_category_map rcm ON rc.id = rcm.category_id
       WHERE rcm.recipe_id = ?`,
      values: [id]
    });
    
    // Get nutrition
    const nutrition = await executeQuery({
      query: `SELECT * FROM recipe_nutrition WHERE recipe_id = ?`,
      values: [id]
    });
    
    // Increment view count
    await executeQuery({
      query: `UPDATE recipes SET views = views + 1 WHERE id = ?`,
      values: [id]
    });
    
    // Parse dietary_tags with better error handling
    let dietaryTags = [];
    if (recipe.dietary_tags) {
      try {
        dietaryTags = JSON.parse(recipe.dietary_tags);
      } catch (e) {
        // If not JSON, split by space (for legacy data)
        dietaryTags = recipe.dietary_tags.split(' ').filter((t: string) => t.length > 0);
      }
    }
    
    const recipeWithRelations: RecipeWithRelations = {
      ...recipe,
      dietary_tags: dietaryTags,
      is_featured: Boolean(recipe.is_featured),
      is_active: Boolean(recipe.is_active),
      ingredients: (ingredients as any[]).map(ing => ({
        ...ing,
        is_optional: Boolean(ing.is_optional)
      })),
      steps: steps as any[],
      categories: (categories as any[]).map(cat => ({
        ...cat,
        is_active: Boolean(cat.is_active)
      })),
      nutrition: (nutrition as any[]).length > 0 ? (nutrition as any[])[0] : undefined
    };
    
    const response: RecipeDetailResponse = {
      recipe: recipeWithRelations
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching recipe:', error);
    res.status(500).json({ error: 'Failed to fetch recipe' });
  }
}

// PUT: Update recipe
async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
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
    
    // Check if recipe exists
    const existing = await executeQuery({
      query: 'SELECT id FROM recipes WHERE id = ?',
      values: [id]
    });
    
    if ((existing as any[]).length === 0) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    
    // Update main recipe
    await executeQuery({
      query: `UPDATE recipes SET
        name = ?,
        description = ?,
        image = ?,
        preparation_time = ?,
        cooking_time = ?,
        servings = ?,
        difficulty_level = ?,
        dietary_tags = ?,
        cuisine_type = ?,
        meal_type = ?,
        calories = ?,
        is_featured = ?,
        is_active = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      values: [
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
        id
      ]
    });
    
    // Update ingredients (delete and re-insert)
    await executeQuery({
      query: 'DELETE FROM recipe_ingredients WHERE recipe_id = ?',
      values: [id]
    });
    
    if (ingredients && ingredients.length > 0) {
      for (let i = 0; i < ingredients.length; i++) {
        const ingredient = ingredients[i];
        await executeQuery({
          query: `INSERT INTO recipe_ingredients (
            id, recipe_id, ingredient_name, quantity, unit, notes, display_order, is_optional
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          values: [
            ingredient.id || `ing-${uuidv4()}`,
            id,
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
    
    // Update steps (delete and re-insert)
    await executeQuery({
      query: 'DELETE FROM recipe_steps WHERE recipe_id = ?',
      values: [id]
    });
    
    if (steps && steps.length > 0) {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        await executeQuery({
          query: `INSERT INTO recipe_steps (
            id, recipe_id, step_number, instruction, image, duration_minutes, tips
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          values: [
            step.id || `step-${uuidv4()}`,
            id,
            i + 1,
            step.instruction,
            step.image || null,
            step.duration_minutes || null,
            step.tips || null
          ]
        });
      }
    }
    
    // Update categories (delete and re-insert)
    await executeQuery({
      query: 'DELETE FROM recipe_category_map WHERE recipe_id = ?',
      values: [id]
    });
    
    if (categories && categories.length > 0) {
      for (const categoryId of categories) {
        await executeQuery({
          query: `INSERT INTO recipe_category_map (recipe_id, category_id) VALUES (?, ?)`,
          values: [id, categoryId]
        });
      }
    }
    
    // Update nutrition
    if (nutrition) {
      // Check if nutrition exists
      const existingNutrition = await executeQuery({
        query: 'SELECT id FROM recipe_nutrition WHERE recipe_id = ?',
        values: [id]
      });
      
      if ((existingNutrition as any[]).length > 0) {
        await executeQuery({
          query: `UPDATE recipe_nutrition SET
            calories = ?, protein = ?, carbohydrates = ?, fat = ?,
            fiber = ?, sugar = ?, sodium = ?, cholesterol = ?
          WHERE recipe_id = ?`,
          values: [
            nutrition.calories || null,
            nutrition.protein || null,
            nutrition.carbohydrates || null,
            nutrition.fat || null,
            nutrition.fiber || null,
            nutrition.sugar || null,
            nutrition.sodium || null,
            nutrition.cholesterol || null,
            id
          ]
        });
      } else {
        await executeQuery({
          query: `INSERT INTO recipe_nutrition (
            id, recipe_id, calories, protein, carbohydrates, fat,
            fiber, sugar, sodium, cholesterol
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          values: [
            `nut-${uuidv4()}`,
            id,
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
    }
    
    // Fetch updated recipe
    const updatedRecipe = await executeQuery({
      query: 'SELECT * FROM recipes WHERE id = ?',
      values: [id]
    });
    
    const response: RecipeUpdateResponse = {
      success: true,
      recipe: {
        ...(updatedRecipe as any[])[0],
        dietary_tags: JSON.parse((updatedRecipe as any[])[0].dietary_tags || '[]'),
        is_featured: Boolean((updatedRecipe as any[])[0].is_featured),
        is_active: Boolean((updatedRecipe as any[])[0].is_active)
      },
      message: 'Công thức đã được cập nhật thành công!'
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error updating recipe:', error);
    res.status(500).json({ error: 'Failed to update recipe' });
  }
}

// DELETE: Delete recipe
async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  try {
    // Check if recipe exists
    const existing = await executeQuery({
      query: 'SELECT name FROM recipes WHERE id = ?',
      values: [id]
    });
    
    if ((existing as any[]).length === 0) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    
    // Delete recipe (cascades to related tables due to foreign keys)
    await executeQuery({
      query: 'DELETE FROM recipes WHERE id = ?',
      values: [id]
    });
    
    const response: RecipeDeleteResponse = {
      success: true,
      message: `Công thức "${(existing as any[])[0].name}" đã được xóa thành công!`
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error deleting recipe:', error);
    res.status(500).json({ error: 'Failed to delete recipe' });
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
    case 'PUT':
      return handlePut(req, res);
    case 'DELETE':
      return handleDelete(req, res);
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}
