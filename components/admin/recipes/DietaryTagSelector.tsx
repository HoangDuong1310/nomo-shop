import React from 'react';
import { FaLeaf, FaCarrot, FaFish, FaSeedling, FaBreadSlice } from 'react-icons/fa';
import { DietaryTagLabels } from '../../../types/recipe';

interface DietaryTagSelectorProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  error?: string;
}

const tagIcons: Record<string, React.ReactNode> = {
  vegetarian: <FaLeaf className="w-4 h-4" />,
  vegan: <FaCarrot className="w-4 h-4" />,
  gluten_free: <FaBreadSlice className="w-4 h-4" />,
  dairy_free: <FaSeedling className="w-4 h-4" />,
  nut_free: <FaSeedling className="w-4 h-4" />,
  egg_free: <FaSeedling className="w-4 h-4" />,
  seafood_free: <FaFish className="w-4 h-4" />,
  low_carb: <FaBreadSlice className="w-4 h-4" />,
  keto: <FaSeedling className="w-4 h-4" />,
  paleo: <FaCarrot className="w-4 h-4" />,
  halal: <FaLeaf className="w-4 h-4" />,
  kosher: <FaLeaf className="w-4 h-4" />
};

const tagColors: Record<string, string> = {
  vegetarian: 'text-green-600 bg-green-50 border-green-300',
  vegan: 'text-green-700 bg-green-100 border-green-400',
  gluten_free: 'text-yellow-600 bg-yellow-50 border-yellow-300',
  dairy_free: 'text-blue-600 bg-blue-50 border-blue-300',
  nut_free: 'text-orange-600 bg-orange-50 border-orange-300',
  egg_free: 'text-purple-600 bg-purple-50 border-purple-300',
  seafood_free: 'text-cyan-600 bg-cyan-50 border-cyan-300',
  low_carb: 'text-indigo-600 bg-indigo-50 border-indigo-300',
  keto: 'text-pink-600 bg-pink-50 border-pink-300',
  paleo: 'text-amber-600 bg-amber-50 border-amber-300',
  halal: 'text-emerald-600 bg-emerald-50 border-emerald-300',
  kosher: 'text-teal-600 bg-teal-50 border-teal-300'
};

export const DietaryTagSelector: React.FC<DietaryTagSelectorProps> = ({
  selectedTags,
  onChange,
  error
}) => {
  const handleToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter(t => t !== tag));
    } else {
      onChange([...selectedTags, tag]);
    }
  };

  const allTags = Object.keys(DietaryTagLabels);
  
  // Group tags for better organization
  const tagGroups = {
    'Chế độ ăn chính': ['vegetarian', 'vegan', 'halal', 'kosher'],
    'Dị ứng & Không dung nạp': ['gluten_free', 'dairy_free', 'nut_free', 'egg_free', 'seafood_free'],
    'Chế độ ăn đặc biệt': ['low_carb', 'keto', 'paleo']
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Chế độ ăn phù hợp
        </label>
        
        {error && (
          <div className="text-sm text-red-600 mb-3">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {Object.entries(tagGroups).map(([groupName, groupTags]) => (
            <div key={groupName}>
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                {groupName}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {groupTags.map(tag => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <label
                      key={tag}
                      className={`
                        relative flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer
                        transition-all duration-200 hover:shadow-md
                        ${isSelected 
                          ? tagColors[tag] || 'text-gray-700 bg-gray-50 border-gray-300'
                          : 'text-gray-600 bg-white border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggle(tag)}
                        className="sr-only"
                      />
                      <div className={`
                        flex items-center justify-center w-5 h-5 rounded border-2
                        ${isSelected 
                          ? 'bg-current border-current' 
                          : 'bg-white border-gray-300'
                        }
                      `}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {tagIcons[tag]}
                        <span className="text-sm font-medium">
                          {DietaryTagLabels[tag as keyof typeof DietaryTagLabels]}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {selectedTags.length > 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-2">Đã chọn ({selectedTags.length}):</p>
            <div className="flex flex-wrap gap-2">
              {selectedTags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-white border"
                >
                  {tagIcons[tag]}
                  {DietaryTagLabels[tag as keyof typeof DietaryTagLabels]}
                  <button
                    type="button"
                    onClick={() => handleToggle(tag)}
                    className="ml-1 text-gray-400 hover:text-red-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
