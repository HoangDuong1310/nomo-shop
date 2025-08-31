import { useState } from 'react';
import { useRouter } from 'next/router';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import {
  FaArrowLeft,
  FaSave,
  FaSpinner,
  FaChevronRight,
  FaImage,
  FaInfoCircle,
  FaClock,
  FaUtensils,
  FaFire,
  FaCheckCircle
} from 'react-icons/fa';
import AdminLayout from '../../../components/Layout/AdminLayout';
import { toast } from 'react-toastify';
import { IngredientInput, StepInput, DietaryTagSelector } from '../../../components/admin/recipes';
import {
  RecipeFormData,
  DifficultyLevel,
  DifficultyLevelLabels,
  MealTypeLabels,
  CuisineTypeLabels,
  RecipeIngredient,
  RecipeStep
} from '../../../types/recipe';

const AddRecipePage: NextPage = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [activeSection, setActiveSection] = useState<'basic' | 'ingredients' | 'steps' | 'nutrition'>('basic');
  
  // Form state
  const [formData, setFormData] = useState<Partial<RecipeFormData>>({
    name: '',
    description: '',
    image: '',
    preparation_time: 15,
    cooking_time: 30,
    servings: 4,
    difficulty_level: DifficultyLevel.MEDIUM,
    dietary_tags: [],
    cuisine_type: 'vietnamese',
    meal_type: 'lunch',
    calories: undefined,
    is_featured: false,
    is_active: true,
    ingredients: [],
    steps: [],
    categories: [],
    nutrition: {
      calories: undefined,
      protein: undefined,
      carbohydrates: undefined,
      fat: undefined,
      fiber: undefined,
      sugar: undefined,
      sodium: undefined,
      cholesterol: undefined
    }
  });

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imagePreview, setImagePreview] = useState<string>('');

  // Sections for navigation
  const sections = [
    { id: 'basic', label: 'Thông tin cơ bản', icon: <FaInfoCircle /> },
    { id: 'ingredients', label: 'Nguyên liệu', icon: <FaUtensils /> },
    { id: 'steps', label: 'Cách làm', icon: <FaClock /> },
    { id: 'nutrition', label: 'Dinh dưỡng', icon: <FaFire /> }
  ];

  const handleImageChange = (url: string) => {
    setFormData(prev => ({ ...prev, image: url }));
    setImagePreview(url);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Tên công thức là bắt buộc';
    }
    if (!formData.description?.trim()) {
      newErrors.description = 'Mô tả là bắt buộc';
    }
    if (!formData.ingredients || formData.ingredients.length === 0) {
      newErrors.ingredients = 'Cần ít nhất một nguyên liệu';
    } else {
      const invalidIngredients = formData.ingredients.filter(
        ing => !ing.ingredient_name?.trim()
      );
      if (invalidIngredients.length > 0) {
        newErrors.ingredients = 'Tất cả nguyên liệu phải có tên';
      }
    }
    if (!formData.steps || formData.steps.length === 0) {
      newErrors.steps = 'Cần ít nhất một bước thực hiện';
    } else {
      const invalidSteps = formData.steps.filter(
        step => !step.instruction?.trim()
      );
      if (invalidSteps.length > 0) {
        newErrors.steps = 'Tất cả các bước phải có hướng dẫn';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (isDraft = false) => {
    if (!validateForm() && !isDraft) {
      toast.error('Vui lòng kiểm tra lại thông tin');
      return;
    }

    const setLoading = isDraft ? setIsSavingDraft : setIsSubmitting;
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        is_active: !isDraft,
        total_time: (formData.preparation_time || 0) + (formData.cooking_time || 0)
      };

      const response = await fetch('/api/admin/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(
          isDraft 
            ? 'Đã lưu bản nháp công thức!' 
            : 'Công thức đã được tạo thành công!'
        );
        router.push(`/admin/recipes/${data.recipe.id}`);
      } else {
        throw new Error('Failed to create recipe');
      }
    } catch (error) {
      console.error('Error creating recipe:', error);
      toast.error('Không thể tạo công thức. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: keyof RecipeFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const getSectionProgress = (sectionId: string): number => {
    switch (sectionId) {
      case 'basic':
        const basicFields = [formData.name, formData.description, formData.image];
        return (basicFields.filter(Boolean).length / 3) * 100;
      case 'ingredients':
        return formData.ingredients && formData.ingredients.length > 0 ? 100 : 0;
      case 'steps':
        return formData.steps && formData.steps.length > 0 ? 100 : 0;
      case 'nutrition':
        const nutritionFields = Object.values(formData.nutrition || {});
        return nutritionFields.some(v => v !== undefined) ? 100 : 0;
      default:
        return 0;
    }
  };

  return (
    <AdminLayout title="Thêm công thức mới">
      <Head>
        <title>Thêm công thức - Cloud Shop Admin</title>
        <meta name="description" content="Thêm công thức nấu ăn mới" />
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
        <span className="text-gray-900">Thêm mới</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/recipes"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FaArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Thêm công thức mới</h1>
              <p className="text-sm text-gray-600 mt-1">
                Điền thông tin chi tiết về công thức nấu ăn
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => handleSubmit(true)}
              disabled={isSavingDraft || isSubmitting}
              className="btn-outline flex items-center gap-2"
            >
              {isSavingDraft ? (
                <FaSpinner className="w-4 h-4 animate-spin" />
              ) : (
                <FaSave className="w-4 h-4" />
              )}
              Lưu nháp
            </button>
            <button
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting || isSavingDraft}
              className="btn-primary flex items-center gap-2"
            >
              {isSubmitting ? (
                <FaSpinner className="w-4 h-4 animate-spin" />
              ) : (
                <FaCheckCircle className="w-4 h-4" />
              )}
              Xuất bản
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Section Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-4 sticky top-4">
            <h3 className="font-semibold text-gray-900 mb-4">Các phần</h3>
            <nav className="space-y-2">
              {sections.map(section => {
                const progress = getSectionProgress(section.id);
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id as any)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center justify-between ${
                      activeSection === section.id
                        ? 'bg-primary-50 text-primary-600 border-l-4 border-primary-600'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {section.icon}
                      <span className="font-medium">{section.label}</span>
                    </div>
                    {progress > 0 && (
                      <div className="w-8 h-8 rounded-full bg-gray-200 relative overflow-hidden">
                        <div 
                          className="absolute inset-0 bg-green-500"
                          style={{
                            clipPath: `polygon(0 0, ${progress}% 0, ${progress}% 100%, 0 100%)`
                          }}
                        />
                        {progress === 100 && (
                          <FaCheckCircle className="absolute inset-0 m-auto w-4 h-4 text-white" />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Right Content - Form Sections */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm p-6">
            {/* Basic Information Section */}
            {activeSection === 'basic' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin cơ bản</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tên công thức <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => updateFormData('name', e.target.value)}
                      placeholder="VD: Phở bò truyền thống"
                      className={`input-field ${errors.name ? 'border-red-500' : ''}`}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-600 mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mô tả <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => updateFormData('description', e.target.value)}
                      placeholder="Mô tả chi tiết về công thức..."
                      rows={4}
                      className={`input-field ${errors.description ? 'border-red-500' : ''}`}
                    />
                    {errors.description && (
                      <p className="text-sm text-red-600 mt-1">{errors.description}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hình ảnh
                    </label>
                    <div className="flex gap-4">
                      <input
                        type="text"
                        value={typeof formData.image === 'string' ? formData.image : ''}
                        onChange={(e) => handleImageChange(e.target.value)}
                        placeholder="URL hình ảnh công thức"
                        className="input-field flex-1"
                      />
                    </div>
                    {imagePreview && (
                      <div className="mt-4">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full max-w-md h-64 object-cover rounded-lg"
                          onError={() => setImagePreview('')}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Thời gian chuẩn bị (phút)
                    </label>
                    <input
                      type="number"
                      value={formData.preparation_time || ''}
                      onChange={(e) => updateFormData('preparation_time', parseInt(e.target.value) || 0)}
                      min="0"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Thời gian nấu (phút)
                    </label>
                    <input
                      type="number"
                      value={formData.cooking_time || ''}
                      onChange={(e) => updateFormData('cooking_time', parseInt(e.target.value) || 0)}
                      min="0"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Khẩu phần
                    </label>
                    <input
                      type="number"
                      value={formData.servings || ''}
                      onChange={(e) => updateFormData('servings', parseInt(e.target.value) || 1)}
                      min="1"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Độ khó
                    </label>
                    <select
                      value={formData.difficulty_level || ''}
                      onChange={(e) => updateFormData('difficulty_level', e.target.value as DifficultyLevel)}
                      className="input-field"
                    >
                      {Object.entries(DifficultyLevelLabels).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Loại món
                    </label>
                    <select
                      value={formData.meal_type || ''}
                      onChange={(e) => updateFormData('meal_type', e.target.value)}
                      className="input-field"
                    >
                      <option value="">Chọn loại món</option>
                      {Object.entries(MealTypeLabels).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ẩm thực
                    </label>
                    <select
                      value={formData.cuisine_type || ''}
                      onChange={(e) => updateFormData('cuisine_type', e.target.value)}
                      className="input-field"
                    >
                      <option value="">Chọn loại ẩm thực</option>
                      {Object.entries(CuisineTypeLabels).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Calories
                    </label>
                    <input
                      type="number"
                      value={formData.calories || ''}
                      onChange={(e) => updateFormData('calories', parseInt(e.target.value) || undefined)}
                      min="0"
                      placeholder="Số calories"
                      className="input-field"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_featured || false}
                        onChange={(e) => updateFormData('is_featured', e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Nổi bật</span>
                    </label>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <DietaryTagSelector
                    selectedTags={formData.dietary_tags || []}
                    onChange={(tags) => updateFormData('dietary_tags', tags)}
                  />
                </div>
              </div>
            )}

            {/* Ingredients Section */}
            {activeSection === 'ingredients' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Nguyên liệu</h2>
                <IngredientInput
                  ingredients={(formData.ingredients || []) as any}
                  onChange={(ingredients) => updateFormData('ingredients', ingredients)}
                  error={errors.ingredients}
                />
              </div>
            )}

            {/* Steps Section */}
            {activeSection === 'steps' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Cách làm</h2>
                <StepInput
                  steps={(formData.steps || []) as any}
                  onChange={(steps) => updateFormData('steps', steps)}
                  error={errors.steps}
                />
              </div>
            )}

            {/* Nutrition Section */}
            {activeSection === 'nutrition' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin dinh dưỡng</h2>
                <p className="text-sm text-gray-600 mb-6">
                  Thông tin dinh dưỡng cho mỗi khẩu phần (tùy chọn)
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Calories
                    </label>
                    <input
                      type="number"
                      value={formData.nutrition?.calories || ''}
                      onChange={(e) => updateFormData('nutrition', {
                        ...formData.nutrition,
                        calories: e.target.value ? parseInt(e.target.value) : undefined
                      })}
                      min="0"
                      placeholder="kcal"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Protein
                    </label>
                    <input
                      type="number"
                      value={formData.nutrition?.protein || ''}
                      onChange={(e) => updateFormData('nutrition', {
                        ...formData.nutrition,
                        protein: e.target.value ? parseFloat(e.target.value) : undefined
                      })}
                      min="0"
                      step="0.1"
                      placeholder="g"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Carbohydrates
                    </label>
                    <input
                      type="number"
                      value={formData.nutrition?.carbohydrates || ''}
                      onChange={(e) => updateFormData('nutrition', {
                        ...formData.nutrition,
                        carbohydrates: e.target.value ? parseFloat(e.target.value) : undefined
                      })}
                      min="0"
                      step="0.1"
                      placeholder="g"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fat
                    </label>
                    <input
                      type="number"
                      value={formData.nutrition?.fat || ''}
                      onChange={(e) => updateFormData('nutrition', {
                        ...formData.nutrition,
                        fat: e.target.value ? parseFloat(e.target.value) : undefined
                      })}
                      min="0"
                      step="0.1"
                      placeholder="g"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fiber
                    </label>
                    <input
                      type="number"
                      value={formData.nutrition?.fiber || ''}
                      onChange={(e) => updateFormData('nutrition', {
                        ...formData.nutrition,
                        fiber: e.target.value ? parseFloat(e.target.value) : undefined
                      })}
                      min="0"
                      step="0.1"
                      placeholder="g"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sugar
                    </label>
                    <input
                      type="number"
                      value={formData.nutrition?.sugar || ''}
                      onChange={(e) => updateFormData('nutrition', {
                        ...formData.nutrition,
                        sugar: e.target.value ? parseFloat(e.target.value) : undefined
                      })}
                      min="0"
                      step="0.1"
                      placeholder="g"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sodium
                    </label>
                    <input
                      type="number"
                      value={formData.nutrition?.sodium || ''}
                      onChange={(e) => updateFormData('nutrition', {
                        ...formData.nutrition,
                        sodium: e.target.value ? parseInt(e.target.value) : undefined
                      })}
                      min="0"
                      placeholder="mg"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cholesterol
                    </label>
                    <input
                      type="number"
                      value={formData.nutrition?.cholesterol || ''}
                      onChange={(e) => updateFormData('nutrition', {
                        ...formData.nutrition,
                        cholesterol: e.target.value ? parseInt(e.target.value) : undefined
                      })}
                      min="0"
                      placeholder="mg"
                      className="input-field"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action Buttons */}
          <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
            <div className="flex justify-between">
              <button
                onClick={() => router.push('/admin/recipes')}
                className="btn-outline"
              >
                Hủy
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSubmit(true)}
                  disabled={isSavingDraft || isSubmitting}
                  className="btn-outline flex items-center gap-2"
                >
                  {isSavingDraft ? (
                    <FaSpinner className="w-4 h-4 animate-spin" />
                  ) : (
                    <FaSave className="w-4 h-4" />
                  )}
                  Lưu nháp
                </button>
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={isSubmitting || isSavingDraft}
                  className="btn-primary flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <FaSpinner className="w-4 h-4 animate-spin" />
                  ) : (
                    <FaCheckCircle className="w-4 h-4" />
                  )}
                  Xuất bản công thức
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AddRecipePage;
