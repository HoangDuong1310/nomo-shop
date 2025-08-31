import { useState, useEffect, useCallback } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaSearch, 
  FaFilter, 
  FaSpinner,
  FaChevronLeft, 
  FaChevronRight,
  FaStar,
  FaEye,
  FaClock,
  FaUtensils,
  FaToggleOn,
  FaToggleOff,
  FaList,
  FaTh,
  FaFire,
  FaLeaf
} from 'react-icons/fa';
import AdminLayout from '../../../components/Layout/AdminLayout';
import { toast } from 'react-toastify';
import { 
  Recipe, 
  DifficultyLevel, 
  DifficultyLevelLabels,
  DietaryTagLabels,
  MealTypeLabels,
  CuisineTypeLabels
} from '../../../types/recipe';
import {
  formatCookingTime,
  getDifficultyColor,
  getDietaryTagColor,
  truncateText,
  parseDietaryTags,
  isNewRecipe,
  getCuisineFlag
} from '../../../lib/recipe-utils';

const RecipesAdminPage: NextPage = () => {
  // State management
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  
  // View state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('');
  const [dietaryFilter, setDietaryFilter] = useState<string>('');
  const [mealTypeFilter, setMealTypeFilter] = useState<string>('');
  const [cuisineFilter, setCuisineFilter] = useState<string>('');
  const [timeFilter, setTimeFilter] = useState<string>('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const itemsPerPage = 12;
  
  // Modal state
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null);

  // Fetch recipes with filters
  const fetchRecipes = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = `/api/admin/recipes?page=${currentPage}&limit=${itemsPerPage}`;
      
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }
      if (difficultyFilter) {
        url += `&difficulty=${encodeURIComponent(difficultyFilter)}`;
      }
      if (dietaryFilter) {
        url += `&dietary_tags=${encodeURIComponent(dietaryFilter)}`;
      }
      if (mealTypeFilter) {
        url += `&meal_type=${encodeURIComponent(mealTypeFilter)}`;
      }
      if (cuisineFilter) {
        url += `&cuisine_type=${encodeURIComponent(cuisineFilter)}`;
      }
      if (timeFilter) {
        const [min, max] = timeFilter.split('-');
        if (min) url += `&min_time=${min}`;
        if (max) url += `&max_time=${max}`;
      }
      
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        setRecipes(data.recipes || []);
        setTotalItems(data.total || 0);
        setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
      } else {
        toast.error('Không thể tải danh sách công thức');
        // Use demo data for development
        setRecipes([
          {
            id: 'recipe-1',
            name: 'Phở Bò Truyền Thống',
            description: 'Món phở bò đậm đà hương vị với nước dùng từ xương hầm 12 giờ',
            image: '/images/recipes/pho-bo.jpg',
            preparation_time: 30,
            cooking_time: 720,
            total_time: 750,
            servings: 4,
            difficulty_level: DifficultyLevel.HARD,
            dietary_tags: ['gluten_free'],
            cuisine_type: 'vietnamese',
            meal_type: 'breakfast',
            calories: 450,
            rating: 4.8,
            views: 1250,
            is_featured: true,
            is_active: true,
            created_by: 'admin',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'recipe-2',
            name: 'Bánh Mì Thịt Nướng',
            description: 'Bánh mì Việt Nam với thịt nướng thơm lừng và rau tươi',
            image: '/images/recipes/banh-mi.jpg',
            preparation_time: 20,
            cooking_time: 15,
            total_time: 35,
            servings: 2,
            difficulty_level: DifficultyLevel.EASY,
            dietary_tags: [],
            cuisine_type: 'vietnamese',
            meal_type: 'lunch',
            calories: 380,
            rating: 4.6,
            views: 890,
            is_featured: false,
            is_active: true,
            created_by: 'admin',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'recipe-3',
            name: 'Gỏi Cuốn Chay',
            description: 'Gỏi cuốn thanh mát với rau củ tươi và nước chấm đặc biệt',
            image: '/images/recipes/goi-cuon.jpg',
            preparation_time: 15,
            cooking_time: 0,
            total_time: 15,
            servings: 4,
            difficulty_level: DifficultyLevel.EASY,
            dietary_tags: ['vegetarian', 'vegan', 'gluten_free'],
            cuisine_type: 'vietnamese',
            meal_type: 'snack',
            calories: 120,
            rating: 4.5,
            views: 650,
            is_featured: true,
            is_active: true,
            created_by: 'admin',
            created_at: new Date(Date.now() - 172800000).toISOString(),
            updated_at: new Date().toISOString()
          }
        ]);
        setTotalItems(3);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
      toast.error('Đã xảy ra lỗi khi tải danh sách công thức');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, difficultyFilter, dietaryFilter, mealTypeFilter, cuisineFilter, timeFilter]);

  // Initial load and when filters change
  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  // Handle search with debouncing
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        fetchRecipes();
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // Handle filter changes
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  // Handle toggle active status
  const handleToggleActive = async (recipe: Recipe) => {
    setToggling(recipe.id);
    try {
      const res = await fetch('/api/admin/recipes/toggle-active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: recipe.id })
      });
      
      if (res.ok) {
        const data = await res.json();
        setRecipes(prev => prev.map(r => 
          r.id === recipe.id ? { ...r, is_active: data.is_active } : r
        ));
        toast.success(`${recipe.name} → ${data.is_active ? 'Đang hoạt động' : 'Tạm ẩn'}`);
      } else {
        throw new Error('Toggle failed');
      }
    } catch (e: any) {
      toast.error('Không thể đổi trạng thái');
      // For demo, just toggle locally
      setRecipes(prev => prev.map(r => 
        r.id === recipe.id ? { ...r, is_active: !r.is_active } : r
      ));
    } finally {
      setToggling(null);
    }
  };

  // Handle delete confirmation
  const confirmDelete = (recipe: Recipe) => {
    setRecipeToDelete(recipe);
    setShowDeleteModal(true);
  };

  // Handle delete recipe
  const handleDeleteRecipe = async () => {
    if (!recipeToDelete) return;
    
    setIsDeleting(recipeToDelete.id);
    try {
      const response = await fetch(`/api/admin/recipes/${recipeToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast.success(`Đã xóa công thức ${recipeToDelete.name}`);
        fetchRecipes();
      } else {
        throw new Error('Không thể xóa công thức');
      }
    } catch (error: any) {
      toast.error('Đã xảy ra lỗi khi xóa công thức');
      // For demo, remove locally
      setRecipes(prev => prev.filter(r => r.id !== recipeToDelete.id));
      toast.success(`Đã xóa công thức ${recipeToDelete.name}`);
    } finally {
      setIsDeleting(null);
      setShowDeleteModal(false);
      setRecipeToDelete(null);
    }
  };

  // Render recipe card for grid view
  const renderRecipeCard = (recipe: Recipe) => (
    <div key={recipe.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
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
            onClick={() => handleToggleActive(recipe)}
            disabled={toggling === recipe.id}
            className={`p-2 rounded-full ${
              recipe.is_active ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
            } hover:opacity-80 transition-opacity`}
          >
            {toggling === recipe.id ? (
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
        {recipe.rating > 0 && (
          <div className="flex items-center gap-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <FaStar 
                key={i}
                className={`w-3 h-3 ${
                  i < Math.floor(parseFloat(recipe.rating || '0')) 
                    ? 'text-yellow-400' 
                    : 'text-gray-300'
                }`}
              />
            ))}
            <span className="text-xs text-gray-600 ml-1">
              {parseFloat(recipe.rating || '0').toFixed(1)}
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
            onClick={() => confirmDelete(recipe)}
            disabled={isDeleting === recipe.id}
            className="flex-1 text-center py-2 px-3 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors text-sm disabled:opacity-50"
          >
            {isDeleting === recipe.id ? (
              <FaSpinner className="w-4 h-4 animate-spin mx-auto" />
            ) : (
              'Xóa'
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // Render recipe row for list view
  const renderRecipeRow = (recipe: Recipe) => (
    <tr key={recipe.id} className="hover:bg-gray-50">
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
          onClick={() => handleToggleActive(recipe)}
          disabled={toggling === recipe.id}
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            recipe.is_active 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {toggling === recipe.id ? (
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
            onClick={() => confirmDelete(recipe)}
            disabled={isDeleting === recipe.id}
            className="text-red-600 hover:text-red-900 disabled:opacity-50"
          >
            {isDeleting === recipe.id ? (
              <FaSpinner className="w-4 h-4 animate-spin" />
            ) : (
              <FaTrash className="w-4 h-4" />
            )}
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <AdminLayout title="Quản lý công thức nấu ăn">
      <Head>
        <title>Quản lý công thức - Cloud Shop Admin</title>
        <meta name="description" content="Quản lý công thức nấu ăn" />
      </Head>

      {/* Header Actions */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Công thức nấu ăn</h2>
            <p className="text-sm text-gray-600 mt-1">
              Tổng cộng {totalItems} công thức
            </p>
          </div>
          
          <div className="flex gap-2">
            {/* View mode toggle */}
            <div className="flex bg-white rounded-lg shadow-sm border">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'text-gray-600'} rounded-l-lg transition-colors`}
              >
                <FaTh className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-gray-600'} rounded-r-lg transition-colors`}
              >
                <FaList className="w-4 h-4" />
              </button>
            </div>

            {/* Add button */}
            <Link
              href="/admin/recipes/add"
              className="btn-primary flex items-center gap-2"
            >
              <FaPlus className="w-4 h-4" />
              Thêm công thức
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mt-4 bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm kiếm công thức..."
                  className="input-field pl-10"
                />
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
              </div>
            </div>

            {/* Difficulty filter */}
            <select
              value={difficultyFilter}
              onChange={(e) => {
                setDifficultyFilter(e.target.value);
                handleFilterChange();
              }}
              className="input-field"
            >
              <option value="">Độ khó</option>
              {Object.entries(DifficultyLevelLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            {/* Meal type filter */}
            <select
              value={mealTypeFilter}
              onChange={(e) => {
                setMealTypeFilter(e.target.value);
                handleFilterChange();
              }}
              className="input-field"
            >
              <option value="">Loại món</option>
              {Object.entries(MealTypeLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            {/* Cuisine filter */}
            <select
              value={cuisineFilter}
              onChange={(e) => {
                setCuisineFilter(e.target.value);
                handleFilterChange();
              }}
              className="input-field"
            >
              <option value="">Ẩm thực</option>
              {Object.entries(CuisineTypeLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            {/* Time filter */}
            <select
              value={timeFilter}
              onChange={(e) => {
                setTimeFilter(e.target.value);
                handleFilterChange();
              }}
              className="input-field"
            >
              <option value="">Thời gian</option>
              <option value="0-15">Dưới 15 phút</option>
              <option value="15-30">15-30 phút</option>
              <option value="30-60">30-60 phút</option>
              <option value="60-120">1-2 giờ</option>
              <option value="120-">Trên 2 giờ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <FaSpinner className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : recipes.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FaUtensils className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Chưa có công thức nào
          </h3>
          <p className="text-gray-600 mb-4">
            Bắt đầu bằng cách thêm công thức đầu tiên
          </p>
          <Link
            href="/admin/recipes/add"
            className="btn-primary inline-flex items-center gap-2"
          >
            <FaPlus className="w-4 h-4" />
            Thêm công thức
          </Link>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {recipes.map(renderRecipeCard)}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Công thức
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Độ khó
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thời gian
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Khẩu phần
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chế độ ăn
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recipes.map(renderRecipeRow)}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} trong tổng số {totalItems} công thức
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <FaChevronLeft className="w-3 h-3" />
            </button>
            
            {[...Array(totalPages)].map((_, i) => {
              const page = i + 1;
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded text-sm ${
                      currentPage === page
                        ? 'bg-primary-600 text-white'
                        : 'border bg-white hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                return <span key={page} className="px-2">...</span>;
              }
              return null;
            })}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <FaChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && recipeToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Xác nhận xóa</h3>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa công thức "{recipeToDelete.name}"? 
              Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setRecipeToDelete(null);
                }}
                className="btn-outline"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteRecipe}
                disabled={isDeleting === recipeToDelete.id}
                className="btn-danger"
              >
                {isDeleting === recipeToDelete.id ? (
                  <FaSpinner className="w-4 h-4 animate-spin" />
                ) : (
                  'Xóa'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default RecipesAdminPage;
