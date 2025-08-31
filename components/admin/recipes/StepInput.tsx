import React, { useState } from 'react';
import { FaPlus, FaTrash, FaGripVertical, FaClock, FaLightbulb, FaImage } from 'react-icons/fa';
import { RecipeStep } from '../../../types/recipe';

interface StepInputProps {
  steps: Partial<RecipeStep>[];
  onChange: (steps: Partial<RecipeStep>[]) => void;
  error?: string;
}

export const StepInput: React.FC<StepInputProps> = ({
  steps,
  onChange,
  error
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const addStep = () => {
    onChange([
      ...steps,
      {
        instruction: '',
        duration_minutes: undefined,
        tips: '',
        image: ''
      }
    ]);
  };

  const removeStep = (index: number) => {
    onChange(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, field: keyof RecipeStep, value: any) => {
    const updated = [...steps];
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

    const draggedItem = steps[draggedIndex];
    const newSteps = [...steps];
    
    // Remove dragged item
    newSteps.splice(draggedIndex, 1);
    
    // Insert at new position
    newSteps.splice(dropIndex, 0, draggedItem);
    
    onChange(newSteps);
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Hướng dẫn thực hiện <span className="text-red-500">*</span>
        </label>
        <button
          type="button"
          onClick={addStep}
          className="btn-outline text-sm flex items-center gap-2"
        >
          <FaPlus className="w-3 h-3" />
          Thêm bước
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-600 flex items-center gap-1">
          <FaLightbulb className="w-4 h-4" />
          {error}
        </div>
      )}

      {steps.length === 0 ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <p className="text-gray-500 mb-4">Chưa có bước thực hiện nào</p>
          <button
            type="button"
            onClick={addStep}
            className="btn-primary text-sm"
          >
            Thêm bước đầu tiên
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={index}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              className={`bg-white border rounded-lg p-4 ${
                draggedIndex === index ? 'opacity-50' : ''
              } hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start gap-3">
                <div className="flex items-center gap-2">
                  <div className="cursor-move">
                    <FaGripVertical className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                </div>
                
                <div className="flex-1 space-y-3">
                  <div>
                    <textarea
                      value={step.instruction || ''}
                      onChange={(e) => updateStep(index, 'instruction', e.target.value)}
                      placeholder="Mô tả chi tiết bước thực hiện..."
                      className="input-field min-h-[80px]"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="flex items-center gap-2">
                      <FaClock className="w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        value={step.duration_minutes || ''}
                        onChange={(e) => updateStep(index, 'duration_minutes', e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder="Thời gian (phút)"
                        className="input-field flex-1"
                        min="0"
                      />
                    </div>
                    
                    <div className="md:col-span-2 flex items-center gap-2">
                      <FaLightbulb className="w-4 h-4 text-yellow-500" />
                      <input
                        type="text"
                        value={step.tips || ''}
                        onChange={(e) => updateStep(index, 'tips', e.target.value)}
                        placeholder="Mẹo thực hiện (tùy chọn)"
                        className="input-field flex-1"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <FaImage className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={step.image || ''}
                      onChange={(e) => updateStep(index, 'image', e.target.value)}
                      placeholder="URL hình ảnh minh họa (tùy chọn)"
                      className="input-field flex-1"
                    />
                  </div>
                  
                  {step.image && (
                    <div className="mt-2">
                      <img 
                        src={step.image} 
                        alt={`Bước ${index + 1}`}
                        className="h-32 w-auto rounded-lg object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
                
                <button
                  type="button"
                  onClick={() => removeStep(index)}
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
        <FaLightbulb className="w-3 h-3 mt-0.5 text-yellow-500" />
        <span>Kéo và thả để sắp xếp lại thứ tự các bước</span>
      </div>
    </div>
  );
};
