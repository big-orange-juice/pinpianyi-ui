
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, Database, Settings, X, Save, AlertTriangle, SlidersHorizontal } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { costThreshold, setCostThreshold } = useAppContext();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempThreshold, setTempThreshold] = useState(costThreshold);

  const navItems = [
    { path: '/', label: '仪表盘', icon: <LayoutDashboard size={20} /> },
    { path: '/analysis', label: '价盘分析矩阵', icon: <TrendingUp size={20} /> },
    { path: '/config', label: '竞对策略配置', icon: <SlidersHorizontal size={20} /> },
    { path: '/data', label: '数据采集配置', icon: <Database size={20} /> },
  ];

  const handleOpenSettings = () => {
    setTempThreshold(costThreshold);
    setIsSettingsOpen(true);
  };

  const handleSaveSettings = () => {
    setCostThreshold(Number(tempThreshold));
    setIsSettingsOpen(false);
  };

  return (
    <>
      <div className="w-64 h-screen bg-slate-900 text-white flex flex-col fixed left-0 top-0 z-10 shadow-xl">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent leading-tight">
            拼便宜<br/>商品运营Agent
          </h1>
          <p className="text-xs text-slate-400 mt-2">智能商品运营与竞价系统</p>
        </div>
        
        <nav className="flex-1 py-6">
          <ul>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path} className="mb-2 px-4">
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {item.icon}
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button 
            onClick={handleOpenSettings}
            className="flex items-center gap-3 text-slate-400 hover:text-white px-4 py-2 w-full transition-colors rounded-lg hover:bg-slate-800"
          >
            <Settings size={20} />
            <span>系统设置</span>
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-96 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                 <Settings size={18} />
                 <h3 className="font-semibold">系统全局参数配置</h3>
              </div>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-orange-500" />
                  成本倒挂预警阈值 (%)
                </label>
                <div className="flex items-center gap-3">
                  <input 
                    type="number" 
                    min="0" 
                    max="20"
                    value={tempThreshold}
                    onChange={(e) => setTempThreshold(Number(e.target.value))}
                    className="w-24 px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <span className="text-slate-500 text-sm">%</span>
                </div>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  当竞对价格低于 <span className="font-mono bg-slate-100 px-1 rounded">我方成本 x {(100 - tempThreshold).toFixed(0)}%</span> 时，系统将判定为<span className="text-red-600 font-medium">Critical (严重倒挂)</span>。
                  <br/>设置缓冲值可过滤轻微的价格波动。
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 text-slate-600 text-sm font-medium hover:bg-slate-50 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button 
                  onClick={handleSaveSettings}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Save size={16} /> 保存设置
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;