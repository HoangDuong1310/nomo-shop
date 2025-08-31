// Recipe-related TypeScript interfaces and types

export enum DifficultyLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  EXPERT = 'expert'
}

export enum DietaryTag {
  VEGETARIAN = 'vegetarian',
  VEGAN = 'vegan',
  GLUTEN_FREE = 'gluten_free',
  DAIRY_FREE = 'dairy_free',
  NUT_FREE = 'nut_free',
  LOW_CARB = 'low_carb',
  KETO = 'keto',
  PALEO = 'paleo',
  HALAL = 'halal',
  KOSHER = 'kosher'
}

export enum MealType {
  BREAKFAST = 'breakfast',
  LUNCH = 'lunch',
  DINNER = 'dinner',
  SNACK = 'snack',
  DESSERT = 'dessert',
  BEVERAGE = 'beverage'
}

export enum CuisineType {
  VIETNAMESE = 'vietnamese',
  CHINESE = 'chinese',
  JAPANESE = 'japanese',
  KOREAN = 'korean',
  THAI = 'thai',
  INDIAN = 'indian',
  ITALIAN = 'italian',
  FRENCH = 'french',
  MEXICAN = 'mexican',
  AMERICAN = 'american',
  MEDITERRANEAN = 'mediterranean',
  OTHER = 'other'
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  image: string | null;
  preparation_time: number; // in minutes
  cooking_time: number; // in minutes
  total_time: number; // calculated: preparation_time + cooking_time
  servings: number;
  difficulty_level: DifficultyLevel;
  dietary_tags: string[]; // JSON array stored in DB
  cuisine_type: string | null;
  meal_type: string | null;
  calories: number | null;
  rating: number;
  views: number;
  is_featured: boolean;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  ingredients?: RecipeIngredient[];
  steps?: RecipeStep[];
  categories?: RecipeCategory[];
  nutrition?: RecipeNutrition;
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  ingredient_name: string;
  quantity: number | null;
  unit: string | null;
  notes: string | null;
  display_order: number;
  is_optional: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecipeStep {
  id: string;
  recipe_id: string;
  step_number: number;
  instruction: string;
  image: string | null;
  duration_minutes: number | null;
  tips: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecipeCategory {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecipeNutrition {
  id: string;
  recipe_id: string;
  calories: number | null;
  protein: number | null; // in grams
  carbohydrates: number | null; // in grams
  fat: number | null; // in grams
  fiber: number | null; // in grams
  sugar: number | null; // in grams
  sodium: number | null; // in milligrams
  cholesterol: number | null; // in milligrams
  created_at: string;
  updated_at: string;
}

export interface RecipeReview {
  id: string;
  recipe_id: string;
  user_id: string | null;
  rating: number; // 1-5
  comment: string | null;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  user?: {
    id: string;
    name: string;
  };
}

// Form data interfaces
export interface RecipeFormData {
  name: string;
  description: string;
  image?: File | string | null;
  preparation_time: number;
  cooking_time: number;
  servings: number;
  difficulty_level: DifficultyLevel;
  dietary_tags: string[];
  cuisine_type: string;
  meal_type: string;
  calories?: number;
  is_featured: boolean;
  is_active: boolean;
  ingredients: RecipeIngredientFormData[];
  steps: RecipeStepFormData[];
  categories: string[]; // category IDs
  nutrition?: RecipeNutritionFormData;
}

export interface RecipeIngredientFormData {
  ingredient_name: string;
  quantity: string;
  unit: string;
  notes?: string;
  is_optional: boolean;
}

export interface RecipeStepFormData {
  instruction: string;
  image?: File | string | null;
  duration_minutes?: number;
  tips?: string;
}

export interface RecipeNutritionFormData {
  calories?: number;
  protein?: number;
  carbohydrates?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  cholesterol?: number;
}

// Filter and search interfaces
export interface RecipeFilters {
  search?: string;
  category?: string;
  difficulty?: DifficultyLevel;
  dietary_tags?: string[];
  cuisine_type?: string;
  meal_type?: string;
  min_time?: number;
  max_time?: number;
  is_featured?: boolean;
  is_active?: boolean;
  sort_by?: 'name' | 'created_at' | 'updated_at' | 'rating' | 'views';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// API response interfaces
export interface RecipeListResponse {
  recipes: Recipe[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}

export interface RecipeDetailResponse {
  recipe: Recipe;
}

export interface RecipeCreateResponse {
  success: boolean;
  recipe: Recipe;
  message: string;
}

export interface RecipeUpdateResponse {
  success: boolean;
  recipe: Recipe;
  message: string;
}

export interface RecipeDeleteResponse {
  success: boolean;
  message: string;
}

export interface RecipeToggleActiveResponse {
  success: boolean;
  is_active: boolean;
  message: string;
}

// Utility type for recipe with full relations
export type RecipeWithRelations = Recipe & {
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  categories: RecipeCategory[];
  nutrition?: RecipeNutrition;
  reviews?: RecipeReview[];
};

// Helper type for creating new recipes
export type NewRecipe = Omit<Recipe, 'id' | 'created_at' | 'updated_at' | 'rating' | 'views' | 'total_time'>;

// Helper type for updating recipes
export type UpdateRecipe = Partial<NewRecipe>;

// Vietnamese translations for enums
export const DifficultyLevelLabels: Record<DifficultyLevel, string> = {
  [DifficultyLevel.EASY]: 'Dễ',
  [DifficultyLevel.MEDIUM]: 'Trung bình',
  [DifficultyLevel.HARD]: 'Khó',
  [DifficultyLevel.EXPERT]: 'Chuyên gia'
};

export const DietaryTagLabels: Record<string, string> = {
  vegetarian: 'Chay',
  vegan: 'Thuần chay',
  gluten_free: 'Không gluten',
  dairy_free: 'Không sữa',
  nut_free: 'Không hạt',
  low_carb: 'Ít carb',
  keto: 'Keto',
  paleo: 'Paleo',
  halal: 'Halal',
  kosher: 'Kosher'
};

export const MealTypeLabels: Record<string, string> = {
  breakfast: 'Bữa sáng',
  lunch: 'Bữa trưa',
  dinner: 'Bữa tối',
  snack: 'Ăn vặt',
  dessert: 'Tráng miệng',
  beverage: 'Đồ uống'
};

export const CuisineTypeLabels: Record<string, string> = {
  vietnamese: 'Việt Nam',
  chinese: 'Trung Quốc',
  japanese: 'Nhật Bản',
  korean: 'Hàn Quốc',
  thai: 'Thái Lan',
  indian: 'Ấn Độ',
  italian: 'Ý',
  french: 'Pháp',
  mexican: 'Mexico',
  american: 'Mỹ',
  mediterranean: 'Địa Trung Hải',
  other: 'Khác'
};
