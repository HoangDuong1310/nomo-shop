import { useState, useEffect } from 'react';
import { FaArrowLeft, FaArrowRight, FaCheck, FaPlus, FaTrash, FaEdit, FaGripVertical } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { 
  PREDEFINED_TEMPLATES, 
  getTemplatesByCategory, 
  templateToVariants, 
  VariantTemplate, 
  VariantTemplateValue,
  validateTemplate
} from '../lib/variant-templates';

interface VariantWizardProps {
  productId: string;
  productName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface WizardStep {
  id: number;
  title: string;
  description: string;
}

const WIZARD_STEPS: WizardStep[] = [
  { id: 1, title: 'Chọn Template', description: 'Chọn template có sẵn hoặc tạo mới' },
  { id: 2, title: 'Tùy chỉnh Values', description: 'Chỉnh sửa giá trị và thứ tự' },
  { id: 3, title: 'Thiết lập Giá', description: 'Điều chỉnh giá và tồn kho' },
  { id: 4, title: 'Xác nhận', description: 'Xem trước và tạo variants' }
];

export default function VariantWizard({ productId, productName, isOpen, onClose, onSuccess }: VariantWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<VariantTemplate | null>(null);
  const [variantName, setVariantName] = useState('');
  const [customValues, setCustomValues] = useState<VariantTemplateValue[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCustomTemplate, setShowCustomTemplate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset wizard state when opened
      setCurrentStep(1);
      setSelectedTemplate(null);
      setVariantName('');
      setCustomValues([]);
      setShowCustomTemplate(false);
    }
  }, [isOpen]);

  const handleTemplateSelect = (template: VariantTemplate) => {
    setSelectedTemplate(template);
    setVariantName(template.name);
    setCustomValues([...template.defaultValues]);
  };

  const handleCustomTemplate = () => {
    setShowCustomTemplate(true);
    setSelectedTemplate(null);
    setVariantName('');
    setCustomValues([
      { label: '', value: '', priceAdjustment: 0, stockQuantity: 50, order: 1 }
    ]);
  };

  const addCustomValue = () => {
    const newValue: VariantTemplateValue = {
      label: '',
      value: '',
      priceAdjustment: 0,
      stockQuantity: 50,
      order: customValues.length + 1
    };
    setCustomValues([...customValues, newValue]);
  };

  const removeCustomValue = (index: number) => {
    setCustomValues(customValues.filter((_, i) => i !== index));
  };

  const updateCustomValue = (index: number, field: keyof VariantTemplateValue, value: any) => {
    const updated = [...customValues];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-generate value from label
    if (field === 'label' && value) {
      updated[index].value = value.toLowerCase()
        .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
        .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
        .replace(/[ìíịỉĩ]/g, 'i')
        .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
        .replace(/[ùúụủũưừứựửữ]/g, 'u')
        .replace(/[ỳýỵỷỹ]/g, 'y')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]/g, '_');
    }
    
    setCustomValues(updated);
  };

  const handlePriceAdjustmentChange = (index: number, newPrice: number) => {
    const updatedValues = [...customValues];
    updatedValues[index].priceAdjustment = newPrice;
    setCustomValues(updatedValues);
  };

  const applyBulkPricing = (type: 'fixed' | 'percentage', value: number) => {
    const updated = customValues.map((item, index) => {
      if (type === 'fixed') {
        return { ...item, priceAdjustment: value * index };
      } else {
        return { ...item, priceAdjustment: Math.round(item.priceAdjustment * (1 + value / 100)) };
      }
    });
    setCustomValues(updated);
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return selectedTemplate || showCustomTemplate;
      case 2:
        return variantName.trim() && customValues.length > 0 && 
               customValues.every(v => v.label.trim() && v.value.trim());
      case 3:
        return customValues.every(v => 
          !isNaN(Number(v.priceAdjustment)) && 
          !isNaN(Number(v.stockQuantity)) && 
          Number(v.stockQuantity) >= 0
        );
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!productId || !variantName.trim() || customValues.length === 0) {
      toast.error('Thiếu thông tin bắt buộc');
      return;
    }

    setIsSubmitting(true);

    try {
      const variants = customValues.map(value => ({
        productId,
        variantName: variantName.trim(),
        variantValue: value.label,
        priceAdjustment: Number(value.priceAdjustment),
        stockQuantity: Number(value.stockQuantity),
        isActive: true
      }));

      // Create variants one by one
      for (const variant of variants) {
        const response = await fetch('/api/admin/products/variants-unified', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(variant),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Không thể tạo variant');
        }
      }

      toast.success(`Đã tạo thành công ${variants.length} variants cho nhóm "${variantName}"`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creating variants:', error);
      toast.error(error.message || 'Đã xảy ra lỗi khi tạo variants');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  🎯 Wizard tạo Variants cho "{productName}"
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {WIZARD_STEPS.find(s => s.id === currentStep)?.description}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            {/* Step Indicator */}
            <div className="flex items-center mt-4">
              {WIZARD_STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                    ${currentStep >= step.id 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-gray-300 text-gray-600'
                    }
                  `}>
                    {currentStep > step.id ? <FaCheck /> : step.id}
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    {step.title}
                  </span>
                  {index < WIZARD_STEPS.length - 1 && (
                    <div className="mx-4 h-px bg-gray-300 flex-1"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-6" style={{ minHeight: '400px' }}>
            
            {/* Step 1: Template Selection */}
            {currentStep === 1 && (
              <div>
                <h4 className="text-lg font-medium mb-4">Chọn Template hoặc Tạo Mới</h4>
                
                {!showCustomTemplate ? (
                  <>
                    {/* Template Categories */}
                    {(['size', 'color', 'topping', 'temperature'] as const).map(category => {
                      const templates = getTemplatesByCategory(category);
                      if (templates.length === 0) return null;
                      
                      return (
                        <div key={category} className="mb-6">
                          <h5 className="font-medium mb-3 capitalize">{category} Templates</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {templates.map(template => (
                              <div
                                key={template.id}
                                onClick={() => handleTemplateSelect(template)}
                                className={`
                                  p-4 border rounded-lg cursor-pointer transition-colors
                                  ${selectedTemplate?.id === template.id
                                    ? 'border-primary-500 bg-primary-50'
                                    : 'border-gray-300 hover:border-primary-300'
                                  }
                                `}
                              >
                                <div className="flex items-start">
                                  <span className="text-2xl mr-3">{template.icon}</span>
                                  <div>
                                    <h6 className="font-medium">{template.name}</h6>
                                    <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                                    <div className="text-xs text-gray-500">
                                      {template.defaultValues.length} giá trị: {' '}
                                      {template.defaultValues.slice(0, 3).map(v => v.label).join(', ')}
                                      {template.defaultValues.length > 3 && '...'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Custom Template Option */}
                    <div className="border-t pt-4">
                      <button
                        onClick={handleCustomTemplate}
                        className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition-colors"
                      >
                        <div className="text-center">
                          <FaPlus className="mx-auto text-gray-400 text-xl mb-2" />
                          <p className="font-medium text-gray-700">Tạo Template Tùy Chỉnh</p>
                          <p className="text-sm text-gray-500">Tự định nghĩa variants riêng</p>
                        </div>
                      </button>
                    </div>
                  </>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="font-medium">Tạo Template Tùy Chỉnh</h5>
                      <button
                        onClick={() => setShowCustomTemplate(false)}
                        className="text-sm text-primary-600 hover:underline"
                      >
                        ← Quay lại Templates
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tên nhóm variant
                        </label>
                        <input
                          type="text"
                          value={variantName}
                          onChange={(e) => setVariantName(e.target.value)}
                          className="input-field w-full"
                          placeholder="VD: Size, Màu sắc, Topping..."
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Các giá trị
                        </label>
                        {customValues.map((value, index) => (
                          <div key={index} className="flex items-center space-x-2 mb-2">
                            <input
                              type="text"
                              value={value.label}
                              onChange={(e) => updateCustomValue(index, 'label', e.target.value)}
                              className="input-field flex-1"
                              placeholder="Nhập tên giá trị..."
                            />
                            <button
                              onClick={() => removeCustomValue(index)}
                              className="text-red-600 hover:text-red-800 p-2"
                              disabled={customValues.length <= 1}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        ))}
                        
                        <button
                          onClick={addCustomValue}
                          className="btn-outline w-full flex items-center justify-center"
                        >
                          <FaPlus className="mr-2" />
                          Thêm giá trị
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Customize Values */}
            {currentStep === 2 && (
              <div>
                <h4 className="text-lg font-medium mb-4">Tùy chỉnh Giá trị</h4>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên nhóm variant
                  </label>
                  <input
                    type="text"
                    value={variantName}
                    onChange={(e) => setVariantName(e.target.value)}
                    className="input-field w-full"
                    placeholder="VD: Size, Màu sắc, Topping..."
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Danh sách giá trị
                    </label>
                    <button
                      onClick={addCustomValue}
                      className="btn-primary text-sm"
                    >
                      <FaPlus className="mr-1" /> Thêm
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {customValues.map((value, index) => (
                      <div key={index} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={value.label}
                            onChange={(e) => updateCustomValue(index, 'label', e.target.value)}
                            className="input-field w-full mb-2"
                            placeholder="Tên hiển thị..."
                          />
                          <input
                            type="text"
                            value={value.value}
                            onChange={(e) => updateCustomValue(index, 'value', e.target.value)}
                            className="input-field w-full text-sm"
                            placeholder="Mã giá trị (auto-generated)"
                          />
                        </div>
                        
                        <button
                          onClick={() => removeCustomValue(index)}
                          className="text-red-600 hover:text-red-800 p-2"
                          disabled={customValues.length <= 1}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Pricing & Stock */}
            {currentStep === 3 && (
              <div>
                <h4 className="text-lg font-medium mb-4">Thiết lập Giá và Tồn kho</h4>
                
                {/* Bulk Actions */}
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h5 className="font-medium mb-3">⚡ Thao tác hàng loạt</h5>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => applyBulkPricing('fixed', 5000)}
                      className="btn-outline text-sm"
                    >
                      Tăng dần +5k
                    </button>
                    <button
                      onClick={() => applyBulkPricing('percentage', 10)}
                      className="btn-outline text-sm"
                    >
                      Tăng 10%
                    </button>
                    <button
                      onClick={() => applyBulkPricing('fixed', 0)}
                      className="btn-outline text-sm"
                    >
                      Reset giá
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {customValues.map((value, index) => (
                    <div key={index} className="flex items-center space-x-4 p-3 border rounded-lg">
                      <div className="flex-1">
                        <strong>{value.label}</strong>
                      </div>
                      <div className="w-32">
                        <label className="block text-xs text-gray-600 mb-1">Giá bổ sung</label>
                        <input
                          type="number"
                          value={value.priceAdjustment}
                          onChange={(e) => updateCustomValue(index, 'priceAdjustment', Number(e.target.value))}
                          className="input-field w-full text-sm"
                          step="1000"
                        />
                      </div>
                      <div className="w-24">
                        <label className="block text-xs text-gray-600 mb-1">Tồn kho</label>
                        <input
                          type="number"
                          value={value.stockQuantity}
                          onChange={(e) => updateCustomValue(index, 'stockQuantity', Number(e.target.value))}
                          className="input-field w-full text-sm"
                          min="0"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Preview */}
            {currentStep === 4 && (
              <div>
                <h4 className="text-lg font-medium mb-4">👀 Xem trước và Xác nhận</h4>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h5 className="font-medium mb-2">📋 Tóm tắt</h5>
                  <p><strong>Sản phẩm:</strong> {productName}</p>
                  <p><strong>Nhóm variant:</strong> {variantName}</p>
                  <p><strong>Số lượng variants:</strong> {customValues.length}</p>
                </div>
                
                <div>
                  <h5 className="font-medium mb-3">📝 Chi tiết variants sẽ được tạo:</h5>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Giá trị</th>
                          <th className="px-4 py-2 text-center text-sm font-medium text-gray-500">Giá bổ sung</th>
                          <th className="px-4 py-2 text-center text-sm font-medium text-gray-500">Tồn kho</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {customValues.map((value, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 font-medium">{value.label}</td>
                            <td className="px-4 py-2 text-center">
                              {value.priceAdjustment > 0 ? (
                                <span className="text-green-600">+{value.priceAdjustment.toLocaleString('vi-VN')}đ</span>
                              ) : value.priceAdjustment < 0 ? (
                                <span className="text-red-600">{value.priceAdjustment.toLocaleString('vi-VN')}đ</span>
                              ) : (
                                <span className="text-gray-500">Miễn phí</span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-center">{value.stockQuantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3 flex justify-between">
            <button
              onClick={currentStep === 1 ? onClose : () => setCurrentStep(currentStep - 1)}
              className="btn-outline"
            >
              <FaArrowLeft className="mr-2" />
              {currentStep === 1 ? 'Hủy' : 'Quay lại'}
            </button>
            
            <div className="flex space-x-2">
              {currentStep < 4 ? (
                <button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={!canProceedToNext()}
                  className="btn-primary"
                >
                  Tiếp theo
                  <FaArrowRight className="ml-2" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !canProceedToNext()}
                  className="btn-primary"
                >
                  {isSubmitting ? 'Đang tạo...' : 'Tạo Variants'}
                  <FaCheck className="ml-2" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
