'use client';

import React, { useState } from 'react';
import { X, Bot, CheckCircle2 } from 'lucide-react';
import { DelegationTaskType, DELEGATION_TASK_LABELS } from '../types';

interface DelegationModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  productId: string;
  onDelegate: (taskType: DelegationTaskType, customInstructions?: string) => void;
}

const DelegationModal: React.FC<DelegationModalProps> = ({
  isOpen,
  onClose,
  productName,
  productId,
  onDelegate
}) => {
  const [selectedTaskType, setSelectedTaskType] = useState<DelegationTaskType | null>(null);
  const [customInstructions, setCustomInstructions] = useState('');

  if (!isOpen) return null;

  const handleDelegate = () => {
    if (!selectedTaskType) return;
    onDelegate(selectedTaskType, customInstructions);
    onClose();
    setSelectedTaskType(null);
    setCustomInstructions('');
  };

  const taskTypes = Object.values(DelegationTaskType);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-2xl flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
              <Bot size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg">委派给云智能体</h3>
              <p className="text-sm text-blue-100">选择分析任务类型</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-white/20 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Product Info */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <p className="text-sm text-slate-600 mb-1">选中商品</p>
            <p className="font-semibold text-slate-800">{productName}</p>
            <p className="text-xs text-slate-500 mt-1">SKU: {productId}</p>
          </div>

          {/* Task Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              选择任务类型 *
            </label>
            <div className="grid grid-cols-1 gap-3">
              {taskTypes.map((taskType) => (
                <button
                  key={taskType}
                  onClick={() => setSelectedTaskType(taskType)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedTaskType === taskType
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-slate-800 flex items-center gap-2">
                        {DELEGATION_TASK_LABELS[taskType]}
                        {selectedTaskType === taskType && (
                          <CheckCircle2 size={18} className="text-blue-600" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {getTaskDescription(taskType)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Instructions */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              补充说明 (可选)
            </label>
            <textarea
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="请输入您的具体需求或关注点..."
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none text-sm"
              rows={4}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium">
              取消
            </button>
            <button
              onClick={handleDelegate}
              disabled={!selectedTaskType}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              <Bot size={18} />
              立即委派
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function getTaskDescription(taskType: DelegationTaskType): string {
  const descriptions: Record<DelegationTaskType, string> = {
    [DelegationTaskType.PRICE_STRATEGY]: '分析市场价格，制定最优定价策略',
    [DelegationTaskType.COMPETITOR_ANALYSIS]: '深度分析竞争对手的策略和动向',
    [DelegationTaskType.MARKET_TREND]: '预测市场趋势，提供前瞻性建议',
    [DelegationTaskType.PRODUCT_OPTIMIZATION]: '优化产品组合和运营策略',
    [DelegationTaskType.RISK_ASSESSMENT]: '评估潜在风险，提供预警和应对方案'
  };
  return descriptions[taskType];
}

export default DelegationModal;
