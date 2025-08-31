import React, { useState } from 'react';
import { FaPlus, FaTrash, FaGripVertical, FaInfoCircle } from 'react-icons/fa';
import { RecipeIngredient } from '../../../types/recipe';

interface IngredientInputProps {
  ingredients: Partial<RecipeIngredient>[];
  onChange: (ingredients: Partial<RecipeIngredient>[]) => void;
  error?: string;
}

export const IngredientInput: React.FC<IngredientInputProps> = ({
  ingredients,
  onChange,
  error
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const addIngredient = () => {
    onChange([
      ...ingredients,
      {
        ingredient_name: '',
        quantity: undefined,
        unit: '',
        notes: '',
        is_optional: false
      }
    ]);
  };

  const removeIngredient = (index: number) => {
    onChange(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: keyof RecipeIngredient, value: any) => {
    const updated = [...ingredients];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    onChange(updated);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const draggedItem = ingredients[draggedIndex];
    const newIngredients = [...ingredients];
    
    // Remove dragged item
    newIngredients.splice(draggedIndex, 1);
    
    // Insert at new position
    newIngredients.splice(dropIndex, 0, draggedItem);
    
    onChange(newIngredients);
    setDraggedIndex(null);
  };

  const commonUnits = ['g', 'kg', 'ml', 'l', 'muỗng canh', 'muỗng cà phê', 'cốc', 'củ', 'lá', 'nhánh', 'miếng'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Nguyên liệu <span className="text-red-500">*</span>
        </label>
        <button
          type="button"
          onClick={addIngredient}
          className="btn-outline text-sm flex items-center gap-2"
        >
          <FaPlus className="w-3 h-3" />
          Thêm nguyên liệu
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-600 flex items-center gap-1">
          <FaInfoCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {ingredients.length === 0 ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <p className="text-gray-500 mb-4">Chưa có nguyên liệu nào</p>
          <button
            type="button"
            onClick={addIngredient}
            className="btn-primary text-sm"
          >
            Thêm nguyên liệu đầu tiên
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {ingredients.map((ingredient, index) => (
            <div
              key={index}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              className={`bg-white border rounded-lg p-4 ${
                draggedIndex === index ? 'opacity-50' : ''
              } hover:shadow-md transition-shadow cursor-move`}
            >
              <div className="flex items-start gap-3">
                <div className="pt-2 cursor-move">
                  <FaGripVertical className="w-4 h-4 text-gray-400" />
                </div>
                
                <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-3">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      value={ingredient.ingredient_name || ''}
                      onChange={(e) => updateIngredient(index, 'ingredient_name', e.target.value)}
                      placeholder="Tên nguyên liệu"
                      className="input-field"
                      required
                    />
                  </div>
                  
                  <div>
                    <input
                      type="number"
                      value={ingredient.quantity || ''}
                      onChange={(e) => updateIngredient(index, 'quantity', e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder="Số lượng"
                      className="input-field"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <select
                      value={ingredient.unit || ''}
                      onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                      className="input-field"
                    >
                      <option value="">Đơn vị</option>
                      {commonUnits.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={ingredient.notes || ''}
                        onChange={(e) => updateIngredient(index, 'notes', e.target.value)}
                        placeholder="Ghi chú (tùy chọn)"
                        className="input-field flex-1"
                      />
                      
                      <label className="flex items-center gap-2 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={ingredient.is_optional || false}
                          onChange={(e) => updateIngredient(index, 'is_optional', e.target.checked)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-600">Tùy chọn</span>
                      </label>
                    </div>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => removeIngredient(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <FaTrash className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-xs text-gray-500 flex items-start gap-1">
        <FaInfoCircle className="w-3 h-3 mt-0.5" />
        <span>Kéo và thả để sắp xếp lại thứ tự nguyên liệu</span>
      </div>
    </div>
  );
};
