import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import {
  FaArrowLeft,
  FaEdit,
  FaTrash,
  FaClock,
  FaUtensils,
  FaFire,
  FaStar,
  FaEye,
  FaChartBar,
  FaToggleOn,
  FaToggleOff,
  FaSpinner,
  FaPrint,
  FaShare,
  FaBookmark,
  FaChevronRight,
  FaLeaf,
  FaCheckCircle,
  FaInfoCircle
} from 'react-icons/fa';
import AdminLayout from '../../../components/Layout/AdminLayout';
import { toast } from 'react-toastify';
import { RecipeWithRelations, DifficultyLevelLabels, DietaryTagLabels } from '../../../types/recipe';
import {
  formatCookingTime,
  getDifficultyColor,
  getDietaryTagColor,
  getCuisineFlag,
  parseDietaryTags
} from '../../../lib/recipe-utils';

const RecipeDetailPage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  
  const [recipe, setRecipe] = useState<RecipeWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'ingredients' | 'steps' | 'nutrition'>('ingredients');

  useEffect(() => {
    if (id && typeof id === 'string') {
      fetchRecipe();
    }
  }, [id]);

  const fetchRecipe = async () => {
    if (!id || typeof id !== 'string') return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/recipes/${id}`);
      if (response.ok) {
        const data = await response.json();
        setRecipe(data.recipe);
      } else if (response.status === 404) {
        toast.error('Không tìm thấy công thức');
        // Use setTimeout to avoid routing conflicts
        setTimeout(() => {
          router.push('/admin/recipes');
        }, 100);
      } else {
        // For development, use mock data if API fails
        setRecipe({
          id: id as string,
          name: 'Phở Bò Truyền Thống',
          description: 'Món phở bò đậm đà hương vị với nước dùng từ xương hầm 12 giờ',
          image: '/images/recipes/pho-bo.jpg',
          preparation_time: 30,
          cooking_time: 720,
          total_time: 750,
          servings: 4,
          difficulty_level: 'hard' as any,
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
          updated_at: new Date().toISOString(),
          ingredients: [
            {
              id: 'ing-1',
              recipe_id: id as string,
              ingredient_name: 'Xương bò',
              quantity: 2,
              unit: 'kg',
              notes: 'Xương ống và xương cục',
              display_order: 0,
              is_optional: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 'ing-2',
              recipe_id: id as string,
              ingredient_name: 'Bánh phở',
              quantity: 500,
              unit: 'g',
              notes: 'Bánh phở tươi',
              display_order: 1,
              is_optional: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ],
          steps: [
            {
              id: 'step-1',
              recipe_id: id as string,
              step_number: 1,
              instruction: 'Rửa sạch xương bò, chần qua nước sôi để loại bỏ bọt bẩn',
              image: null,
              duration_minutes: 15,
              tips: 'Chần xương trong 5 phút để nước dùng trong hơn',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 'step-2',
              recipe_id: id as string,
              step_number: 2,
              instruction: 'Cho xương vào nồi nước lạnh, đun sôi rồi hạ lửa nhỏ ninh trong 12 giờ',
              image: null,
              duration_minutes: 720,
              tips: 'Thỉnh thoảng vớt bọt để nước dùng trong',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ],
          categories: [],
          nutrition: {
            id: 'nut-1',
            recipe_id: id as string,
            calories: 450,
            protein: 25,
            carbohydrates: 60,
            fat: 12,
            fiber: 2,
            sugar: 3,
            sodium: 890,
            cholesterol: 45,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        });
        toast.info('Đang sử dụng dữ liệu mẫu');
      }
    } catch (error) {
      console.error('Error fetching recipe:', error);
      toast.error('Đã xảy ra lỗi khi tải công thức');
      // Don't redirect on error, show error state instead
      setRecipe(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!recipe) return;
    
    try {
      const response = await fetch('/api/admin/recipes/toggle-active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: recipe.id })
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecipe({ ...recipe, is_active: data.is_active });
        toast.success(data.message);
      } else {
        throw new Error('Failed to toggle status');
      }
    } catch (error) {
      toast.error('Không thể thay đổi trạng thái');
    }
  };

  const handleDelete = async () => {
    if (!recipe) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/recipes/${recipe.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        toast.success('Đã xóa công thức thành công');
        router.push('/admin/recipes');
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      toast.error('Không thể xóa công thức');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <AdminLayout title="Chi tiết công thức">
        <div className="flex items-center justify-center h-64">
          <FaSpinner className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </AdminLayout>
    );
  }

  if (!recipe) {
    return (
      <AdminLayout title="Chi tiết công thức">
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-4">Không tìm thấy công thức</h3>
          <Link href="/admin/recipes" className="btn-primary">
            Quay lại danh sách
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={recipe.name}>
      <Head>
        <title>{recipe.name} - Cloud Shop Admin</title>
        <meta name="description" content={recipe.description} />
      </Head>

      {/* Breadcrumb */}
      <div className="mb-6 flex items-center text-sm text-gray-600">
        <Link href="/admin" className="hover:text-primary-600">
          Trang chủ
        </Link>
        <FaChevronRight className="w-3 h-3 mx-2" />
        <Link href="/admin/recipes" className="hover:text-primary-600">
          Công thức
        </Link>
        <FaChevronRight className="w-3 h-3 mx-2" />
        <span className="text-gray-900">{recipe.name}</span>
      </div>

      {/* Header Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/recipes"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FaArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{recipe.name}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <FaEye className="w-4 h-4" />
                  {recipe.views} lượt xem
                </span>
                <span className="flex items-center gap-1">
                  <FaStar className="w-4 h-4 text-yellow-500" />
                  {parseFloat(recipe.rating || '0').toFixed(1)}
                </span>
                <span className="text-xs">
                  Tạo ngày {new Date(recipe.created_at).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="btn-outline flex items-center gap-2 print:hidden"
            >
              <FaPrint className="w-4 h-4" />
              In
            </button>
            <button
              onClick={handleToggleActive}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                recipe.is_active 
                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } transition-colors`}
            >
              {recipe.is_active ? (
                <>
                  <FaToggleOn className="w-4 h-4" />
                  Đang hoạt động
                </>
              ) : (
                <>
                  <FaToggleOff className="w-4 h-4" />
                  Tạm ẩn
                </>
              )}
            </button>
            <Link
              href={`/admin/recipes/edit/${recipe.id}`}
              className="btn-primary flex items-center gap-2"
            >
              <FaEdit className="w-4 h-4" />
              Sửa
            </Link>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="btn-danger flex items-center gap-2"
            >
              <FaTrash className="w-4 h-4" />
              Xóa
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Image and Basic Info */}
        <div className="lg:col-span-1">
          {/* Recipe Image */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
            <div className="aspect-w-4 aspect-h-3 bg-gray-200">
              {recipe.image ? (
                <img
                  src={recipe.image}
                  alt={recipe.name}
                  className="w-full h-64 object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-64">
                  <FaUtensils className="w-16 h-16 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* Quick Info */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="font-semibold text-lg mb-4">Thông tin nhanh</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Độ khó:</span>
                <span className={`px-3 py-1 rounded-full text-sm ${getDifficultyColor(recipe.difficulty_level)}`}>
                  {DifficultyLevelLabels[recipe.difficulty_level]}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Thời gian chuẩn bị:</span>
                <span className="font-medium">{formatCookingTime(recipe.preparation_time)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Thời gian nấu:</span>
                <span className="font-medium">{formatCookingTime(recipe.cooking_time)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Tổng thời gian:</span>
                <span className="font-semibold text-primary-600">
                  {formatCookingTime(recipe.total_time)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Khẩu phần:</span>
                <span className="font-medium">{recipe.servings} người</span>
              </div>
              
              {recipe.calories && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Calories:</span>
                  <span className="font-medium flex items-center gap-1">
                    <FaFire className="w-4 h-4 text-orange-500" />
                    {recipe.calories} cal
                  </span>
                </div>
              )}
              
              {recipe.cuisine_type && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Ẩm thực:</span>
                  <span className="font-medium">
                    {getCuisineFlag(recipe.cuisine_type)} {recipe.cuisine_type}
                  </span>
                </div>
              )}
              
              {recipe.meal_type && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Loại món:</span>
                  <span className="font-medium">{recipe.meal_type}</span>
                </div>
              )}
            </div>
          </div>

          {/* Dietary Tags */}
          {recipe.dietary_tags && recipe.dietary_tags.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-lg mb-4">Chế độ ăn phù hợp</h3>
              <div className="flex flex-wrap gap-2">
                {parseDietaryTags(recipe.dietary_tags).map(tag => (
                  <span
                    key={tag}
                    className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${getDietaryTagColor(tag)}`}
                  >
                    <FaLeaf className="w-3 h-3" />
                    {DietaryTagLabels[tag] || tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Details */}
        <div className="lg:col-span-2">
          {/* Description */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="font-semibold text-lg mb-4">Mô tả</h3>
            <p className="text-gray-700 leading-relaxed">{recipe.description}</p>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="border-b">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('ingredients')}
                  className={`px-6 py-3 font-medium ${
                    activeTab === 'ingredients'
                      ? 'text-primary-600 border-b-2 border-primary-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Nguyên liệu ({recipe.ingredients?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('steps')}
                  className={`px-6 py-3 font-medium ${
                    activeTab === 'steps'
                      ? 'text-primary-600 border-b-2 border-primary-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Cách làm ({recipe.steps?.length || 0} bước)
                </button>
                {recipe.nutrition && (
                  <button
                    onClick={() => setActiveTab('nutrition')}
                    className={`px-6 py-3 font-medium ${
                      activeTab === 'nutrition'
                        ? 'text-primary-600 border-b-2 border-primary-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Dinh dưỡng
                  </button>
                )}
              </div>
            </div>

            <div className="p-6">
              {/* Ingredients Tab */}
              {activeTab === 'ingredients' && (
                <div className="space-y-3">
                  {recipe.ingredients && recipe.ingredients.length > 0 ? (
                    recipe.ingredients.map((ingredient, index) => (
                      <div
                        key={ingredient.id}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50"
                      >
                        <span className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold text-sm">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{ingredient.ingredient_name}</span>
                            {ingredient.is_optional && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                Tùy chọn
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {ingredient.quantity && (
                              <span className="font-medium">{ingredient.quantity}</span>
                            )}
                            {ingredient.unit && (
                              <span className="ml-1">{ingredient.unit}</span>
                            )}
                            {ingredient.notes && (
                              <span className="ml-2 text-gray-500">({ingredient.notes})</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">Chưa có nguyên liệu nào được thêm</p>
                  )}
                </div>
              )}

              {/* Steps Tab */}
              {activeTab === 'steps' && (
                <div className="space-y-4">
                  {recipe.steps && recipe.steps.length > 0 ? (
                    recipe.steps.map((step) => (
                      <div key={step.id} className="border-l-4 border-primary-200 pl-4 py-2">
                        <div className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                            {step.step_number}
                          </span>
                          <div className="flex-1">
                            <p className="text-gray-700 leading-relaxed">{step.instruction}</p>
                            {step.duration_minutes && (
                              <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
                                <FaClock className="w-3 h-3" />
                                {formatCookingTime(step.duration_minutes)}
                              </div>
                            )}
                            {step.tips && (
                              <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                                <div className="flex items-start gap-2">
                                  <FaInfoCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                                  <p className="text-sm text-blue-800">{step.tips}</p>
                                </div>
                              </div>
                            )}
                            {step.image && (
                              <img
                                src={step.image}
                                alt={`Bước ${step.step_number}`}
                                className="mt-3 rounded-lg max-w-full h-48 object-cover"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">Chưa có hướng dẫn nào được thêm</p>
                  )}
                </div>
              )}

              {/* Nutrition Tab */}
              {activeTab === 'nutrition' && recipe.nutrition && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {recipe.nutrition.calories && (
                    <div className="bg-orange-50 rounded-lg p-4 text-center">
                      <FaFire className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-orange-600">
                        {recipe.nutrition.calories}
                      </div>
                      <div className="text-sm text-gray-600">Calories</div>
                    </div>
                  )}
                  {recipe.nutrition.protein && (
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {recipe.nutrition.protein}g
                      </div>
                      <div className="text-sm text-gray-600">Protein</div>
                    </div>
                  )}
                  {recipe.nutrition.carbohydrates && (
                    <div className="bg-yellow-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {recipe.nutrition.carbohydrates}g
                      </div>
                      <div className="text-sm text-gray-600">Carbs</div>
                    </div>
                  )}
                  {recipe.nutrition.fat && (
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {recipe.nutrition.fat}g
                      </div>
                      <div className="text-sm text-gray-600">Fat</div>
                    </div>
                  )}
                  {recipe.nutrition.fiber && (
                    <div className="bg-purple-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {recipe.nutrition.fiber}g
                      </div>
                      <div className="text-sm text-gray-600">Fiber</div>
                    </div>
                  )}
                  {recipe.nutrition.sugar && (
                    <div className="bg-pink-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-pink-600">
                        {recipe.nutrition.sugar}g
                      </div>
                      <div className="text-sm text-gray-600">Sugar</div>
                    </div>
                  )}
                  {recipe.nutrition.sodium && (
                    <div className="bg-indigo-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-indigo-600">
                        {recipe.nutrition.sodium}mg
                      </div>
                      <div className="text-sm text-gray-600">Sodium</div>
                    </div>
                  )}
                  {recipe.nutrition.cholesterol && (
                    <div className="bg-red-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {recipe.nutrition.cholesterol}mg
                      </div>
                      <div className="text-sm text-gray-600">Cholesterol</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Categories */}
          {recipe.categories && recipe.categories.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
              <h3 className="font-semibold text-lg mb-4">Danh mục</h3>
              <div className="flex flex-wrap gap-2">
                {recipe.categories.map(category => (
                  <span
                    key={category.id}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {category.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Xác nhận xóa</h3>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa công thức "{recipe.name}"?
              Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn-outline"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="btn-danger"
              >
                {isDeleting ? (
                  <FaSpinner className="w-4 h-4 animate-spin" />
                ) : (
                  'Xóa'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </AdminLayout>
  );
};

export default RecipeDetailPage;
