import React from 'react';
import Link from 'next/link';
import {
  FaClock,
  FaUtensils,
  FaEye,
  FaStar,
  FaToggleOn,
  FaToggleOff,
  FaSpinner,
  FaFire,
  FaLeaf,
  FaEdit,
  FaTrash
} from 'react-icons/fa';
import { Recipe, DifficultyLevelLabels, DietaryTagLabels } from '../../../types/recipe';
import {
  formatCookingTime,
  getDifficultyColor,
  getDietaryTagColor,
  truncateText,
  parseDietaryTags,
  isNewRecipe,
  getCuisineFlag
} from '../../../lib/recipe-utils';

interface RecipeCardProps {
  recipe: Recipe;
  viewMode: 'grid' | 'list';
  onToggleActive: (recipe: Recipe) => void;
  onDelete: (recipe: Recipe) => void;
  isToggling?: boolean;
  isDeleting?: boolean;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  viewMode,
  onToggleActive,
  onDelete,
  isToggling = false,
  isDeleting = false
}) => {
  if (viewMode === 'list') {
    return (
      <tr className="hover:bg-gray-50">
        <td className="py-4 px-4">
          <div className="flex items-center">
            <div className="h-12 w-12 flex-shrink-0 mr-3">
              {recipe.image ? (
                <img 
                  src={recipe.image} 
                  alt={recipe.name}
                  className="h-12 w-12 rounded object-cover"
                />
              ) : (
                <div className="h-12 w-12 rounded bg-gray-200 flex items-center justify-center">
                  <FaUtensils className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">{recipe.name}</div>
              <div className="text-xs text-gray-500 mt-1">
                {truncateText(recipe.description, 60)}
              </div>
            </div>
          </div>
        </td>
        <td className="py-4 px-4 text-sm text-gray-500">
          <span className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(recipe.difficulty_level)}`}>
            {DifficultyLevelLabels[recipe.difficulty_level]}
          </span>
        </td>
        <td className="py-4 px-4 text-sm text-gray-500">
          {formatCookingTime(recipe.total_time)}
        </td>
        <td className="py-4 px-4 text-sm text-gray-500">
          {recipe.servings} khẩu phần
        </td>
        <td className="py-4 px-4">
          <div className="flex flex-wrap gap-1">
            {parseDietaryTags(recipe.dietary_tags).slice(0, 2).map(tag => (
              <span 
                key={tag}
                className={`px-2 py-1 text-xs rounded-full ${getDietaryTagColor(tag)}`}
              >
                <FaLeaf className="inline w-2 h-2 mr-1" />
                {DietaryTagLabels[tag] || tag}
              </span>
            ))}
          </div>
        </td>
        <td className="py-4 px-4 text-sm text-gray-500">
          <button
            onClick={() => onToggleActive(recipe)}
            disabled={isToggling}
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              recipe.is_active 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {isToggling ? (
              <FaSpinner className="w-3 h-3 animate-spin inline" />
            ) : (
              recipe.is_active ? 'Hoạt động' : 'Tạm ẩn'
            )}
          </button>
        </td>
        <td className="py-4 px-4 text-sm">
          <div className="flex gap-2">
            <Link 
              href={`/admin/recipes/${recipe.id}`}
              className="text-blue-600 hover:text-blue-900"
            >
              <FaEye className="w-4 h-4" />
            </Link>
            <Link 
              href={`/admin/recipes/edit/${recipe.id}`}
              className="text-green-600 hover:text-green-900"
            >
              <FaEdit className="w-4 h-4" />
            </Link>
            <button
              onClick={() => onDelete(recipe)}
              disabled={isDeleting}
              className="text-red-600 hover:text-red-900 disabled:opacity-50"
            >
              {isDeleting ? (
                <FaSpinner className="w-4 h-4 animate-spin" />
              ) : (
                <FaTrash className="w-4 h-4" />
              )}
            </button>
          </div>
        </td>
      </tr>
    );
  }

  // Grid view
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* Image */}
      <div className="relative h-48 bg-gray-200">
        {recipe.image ? (
          <img 
            src={recipe.image} 
            alt={recipe.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <FaUtensils className="w-12 h-12 text-gray-400" />
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-2">
          {recipe.is_featured && (
            <span className="px-2 py-1 bg-yellow-500 text-white text-xs rounded-full flex items-center gap-1">
              <FaStar className="w-3 h-3" /> Nổi bật
            </span>
          )}
          {isNewRecipe(recipe.created_at) && (
            <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
              Mới
            </span>
          )}
        </div>

        {/* Status indicator */}
        <div className="absolute top-2 right-2">
          <button
            onClick={() => onToggleActive(recipe)}
            disabled={isToggling}
            className={`p-2 rounded-full ${
              recipe.is_active ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
            } hover:opacity-80 transition-opacity`}
          >
            {isToggling ? (
              <FaSpinner className="w-4 h-4 animate-spin" />
            ) : recipe.is_active ? (
              <FaToggleOn className="w-4 h-4" />
            ) : (
              <FaToggleOff className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg text-gray-900 flex-1">
            {recipe.name}
          </h3>
          <span className="text-xs text-gray-500 ml-2">
            {getCuisineFlag(recipe.cuisine_type || '')}
          </span>
        </div>

        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {truncateText(recipe.description, 80)}
        </p>

        {/* Meta info */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
          <span className="flex items-center gap-1">
            <FaClock className="w-3 h-3" />
            {formatCookingTime(recipe.total_time)}
          </span>
          <span className="flex items-center gap-1">
            <FaUtensils className="w-3 h-3" />
            {recipe.servings} khẩu phần
          </span>
          <span className="flex items-center gap-1">
            <FaEye className="w-3 h-3" />
            {recipe.views} lượt xem
          </span>
        </div>

        {/* Difficulty badge */}
        <div className="flex items-center justify-between mb-3">
          <span className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(recipe.difficulty_level)}`}>
            {DifficultyLevelLabels[recipe.difficulty_level]}
          </span>
          {recipe.calories && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <FaFire className="w-3 h-3 text-orange-500" />
              {recipe.calories} cal
            </span>
          )}
        </div>

        {/* Dietary tags */}
        {recipe.dietary_tags && recipe.dietary_tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {parseDietaryTags(recipe.dietary_tags).slice(0, 3).map(tag => (
              <span 
                key={tag}
                className={`px-2 py-1 text-xs rounded-full ${getDietaryTagColor(tag)}`}
              >
                {DietaryTagLabels[tag] || tag}
              </span>
            ))}
            {recipe.dietary_tags.length > 3 && (
              <span className="px-2 py-1 text-xs text-gray-500">
                +{recipe.dietary_tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Rating */}
        {recipe.rating && parseFloat(recipe.rating.toString()) > 0 && (
          <div className="flex items-center gap-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <FaStar 
                key={i}
                className={`w-3 h-3 ${
                  i < Math.floor(parseFloat(recipe.rating?.toString() || '0')) 
                    ? 'text-yellow-400' 
                    : 'text-gray-300'
                }`}
              />
            ))}
            <span className="text-xs text-gray-600 ml-1">
              {parseFloat(recipe.rating?.toString() || '0').toFixed(1)}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-3 border-t">
          <Link 
            href={`/admin/recipes/${recipe.id}`}
            className="flex-1 text-center py-2 px-3 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors text-sm"
          >
            Xem
          </Link>
          <Link 
            href={`/admin/recipes/edit/${recipe.id}`}
            className="flex-1 text-center py-2 px-3 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors text-sm"
          >
            Sửa
          </Link>
          <button
            onClick={() => onDelete(recipe)}
            disabled={isDeleting}
            className="flex-1 text-center py-2 px-3 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors text-sm disabled:opacity-50"
          >
            {isDeleting ? (
              <FaSpinner className="w-4 h-4 animate-spin mx-auto" />
            ) : (
              'Xóa'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
