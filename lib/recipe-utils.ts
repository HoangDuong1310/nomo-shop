import { DifficultyLevel, DietaryTag } from '@/types/recipe';

/**
 * Format time from minutes to human-readable string
 * @param minutes Total minutes
 * @returns Formatted string like "1h 30m" or "45m"
 */
export function formatCookingTime(minutes: number): string {
  if (!minutes || minutes <= 0) return '0m';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${mins}m`;
  }
}

/**
 * Get color class for difficulty level
 * @param difficulty The difficulty level
 * @returns Tailwind CSS classes for the badge
 */
export function getDifficultyColor(difficulty: DifficultyLevel): string {
  const colors: Record<DifficultyLevel, string> = {
    [DifficultyLevel.EASY]: 'bg-green-100 text-green-800',
    [DifficultyLevel.MEDIUM]: 'bg-yellow-100 text-yellow-800',
    [DifficultyLevel.HARD]: 'bg-orange-100 text-orange-800',
    [DifficultyLevel.EXPERT]: 'bg-red-100 text-red-800'
  };
  return colors[difficulty] || 'bg-gray-100 text-gray-800';
}

/**
 * Get icon for difficulty level
 * @param difficulty The difficulty level
 * @returns Icon name for React Icons
 */
export function getDifficultyIcon(difficulty: DifficultyLevel): string {
  const icons: Record<DifficultyLevel, string> = {
    [DifficultyLevel.EASY]: 'FaSmile',
    [DifficultyLevel.MEDIUM]: 'FaMeh',
    [DifficultyLevel.HARD]: 'FaFrown',
    [DifficultyLevel.EXPERT]: 'FaSkull'
  };
  return icons[difficulty] || 'FaCircle';
}

/**
 * Get color class for dietary tag
 * @param tag The dietary tag
 * @returns Tailwind CSS classes for the badge
 */
export function getDietaryTagColor(tag: string): string {
  const colors: Record<string, string> = {
    vegetarian: 'bg-green-100 text-green-800',
    vegan: 'bg-emerald-100 text-emerald-800',
    gluten_free: 'bg-amber-100 text-amber-800',
    dairy_free: 'bg-blue-100 text-blue-800',
    nut_free: 'bg-orange-100 text-orange-800',
    low_carb: 'bg-purple-100 text-purple-800',
    keto: 'bg-indigo-100 text-indigo-800',
    paleo: 'bg-teal-100 text-teal-800',
    halal: 'bg-cyan-100 text-cyan-800',
    kosher: 'bg-sky-100 text-sky-800'
  };
  return colors[tag] || 'bg-gray-100 text-gray-800';
}

/**
 * Validate recipe form data
 * @param data Recipe form data
 * @returns Object with validation errors or null if valid
 */
export function validateRecipeData(data: any): Record<string, string> | null {
  const errors: Record<string, string> = {};

  // Name validation
  if (!data.name || data.name.trim().length < 3) {
    errors.name = 'Tên công thức phải có ít nhất 3 ký tự';
  } else if (data.name.length > 255) {
    errors.name = 'Tên công thức không được quá 255 ký tự';
  }

  // Description validation
  if (!data.description || data.description.trim().length < 10) {
    errors.description = 'Mô tả phải có ít nhất 10 ký tự';
  }

  // Time validation
  if (data.preparation_time < 0) {
    errors.preparation_time = 'Thời gian chuẩn bị không hợp lệ';
  }
  if (data.cooking_time < 0) {
    errors.cooking_time = 'Thời gian nấu không hợp lệ';
  }

  // Servings validation
  if (data.servings < 1 || data.servings > 100) {
    errors.servings = 'Số khẩu phần phải từ 1 đến 100';
  }

  // Ingredients validation
  if (!data.ingredients || data.ingredients.length === 0) {
    errors.ingredients = 'Phải có ít nhất một nguyên liệu';
  } else {
    data.ingredients.forEach((ingredient: any, index: number) => {
      if (!ingredient.ingredient_name || ingredient.ingredient_name.trim().length === 0) {
        errors[`ingredient_${index}`] = 'Tên nguyên liệu không được để trống';
      }
    });
  }

  // Steps validation
  if (!data.steps || data.steps.length === 0) {
    errors.steps = 'Phải có ít nhất một bước thực hiện';
  } else {
    data.steps.forEach((step: any, index: number) => {
      if (!step.instruction || step.instruction.trim().length < 10) {
        errors[`step_${index}`] = 'Hướng dẫn phải có ít nhất 10 ký tự';
      }
    });
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

/**
 * Generate a unique ID for recipes
 * @param prefix Optional prefix for the ID
 * @returns A unique string ID
 */
export function generateRecipeId(prefix: string = 'recipe'): string {
  const timestamp = Date.now().toString(36);
  const randomNum = Math.random().toString(36).substr(2, 9);
  return `${prefix}-${timestamp}-${randomNum}`;
}

/**
 * Parse dietary tags from string or array
 * @param tags String (JSON) or array of tags
 * @returns Array of tag strings
 */
export function parseDietaryTags(tags: string | string[] | null): string[] {
  if (!tags) return [];
  
  if (typeof tags === 'string') {
    try {
      const parsed = JSON.parse(tags);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  
  return Array.isArray(tags) ? tags : [];
}

/**
 * Format number with Vietnamese thousand separator
 * @param num Number to format
 * @returns Formatted string
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('vi-VN').format(num);
}

/**
 * Calculate total recipe time
 * @param prepTime Preparation time in minutes
 * @param cookTime Cooking time in minutes
 * @returns Total time in minutes
 */
export function calculateTotalTime(prepTime: number, cookTime: number): number {
  return (prepTime || 0) + (cookTime || 0);
}

/**
 * Get rating stars display
 * @param rating Rating value (0-5)
 * @returns Object with filled and empty star counts
 */
export function getRatingStars(rating: number): { filled: number; half: boolean; empty: number } {
  const filled = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - filled - (half ? 1 : 0);
  
  return { filled, half, empty };
}

/**
 * Sort ingredients by display order
 * @param ingredients Array of ingredients
 * @returns Sorted array
 */
export function sortIngredients<T extends { display_order: number }>(ingredients: T[]): T[] {
  return [...ingredients].sort((a, b) => a.display_order - b.display_order);
}

/**
 * Sort steps by step number
 * @param steps Array of steps
 * @returns Sorted array
 */
export function sortSteps<T extends { step_number: number }>(steps: T[]): T[] {
  return [...steps].sort((a, b) => a.step_number - b.step_number);
}

/**
 * Reorder array items (for drag and drop)
 * @param list Original array
 * @param startIndex Start index
 * @param endIndex End index
 * @returns Reordered array
 */
export function reorderItems<T>(list: T[], startIndex: number, endIndex: number): T[] {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
}

/**
 * Check if recipe is new (created within last 7 days)
 * @param createdAt Creation date string
 * @returns Boolean
 */
export function isNewRecipe(createdAt: string): boolean {
  const created = new Date(createdAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - created.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 7;
}

/**
 * Get meal type icon
 * @param mealType The meal type
 * @returns Icon name for React Icons
 */
export function getMealTypeIcon(mealType: string): string {
  const icons: Record<string, string> = {
    breakfast: 'FaCoffee',
    lunch: 'FaUtensils',
    dinner: 'FaConciergeBell',
    snack: 'FaCookie',
    dessert: 'FaBirthdayCake',
    beverage: 'FaGlassMartini'
  };
  return icons[mealType] || 'FaUtensils';
}

/**
 * Get cuisine type flag emoji
 * @param cuisine The cuisine type
 * @returns Flag emoji or default
 */
export function getCuisineFlag(cuisine: string): string {
  const flags: Record<string, string> = {
    vietnamese: '🇻🇳',
    chinese: '🇨🇳',
    japanese: '🇯🇵',
    korean: '🇰🇷',
    thai: '🇹🇭',
    indian: '🇮🇳',
    italian: '🇮🇹',
    french: '🇫🇷',
    mexican: '🇲🇽',
    american: '🇺🇸',
    mediterranean: '🌊',
    other: '🌍'
  };
  return flags[cuisine] || '🍽️';
}

/**
 * Truncate text with ellipsis
 * @param text Text to truncate
 * @param maxLength Maximum length
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Generate SEO-friendly slug from recipe name
 * @param name Recipe name
 * @returns URL-friendly slug
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
