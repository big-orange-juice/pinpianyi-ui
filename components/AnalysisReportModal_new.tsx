
import React from 'react';
import { AnalysisReport } from '../types';
import { X, FileText, TrendingUp, TrendingDown, Activity, Target, AlertTriangle, PieChart, BarChart3, MessageCircle, ArrowRight } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  report: AnalysisReport | null;
}

const AnalysisReportModal: React.FC<Props> = ({ isOpen, onClose, report }) => {
  const { openAgent } = useAppContext();
  
  if (!isOpen || !report) return null;

  const handleConsultAgent = (topic?: string) => {
      const query = topic || `请基于这份《${report.title}》的"执行摘要"部分，帮我制定一个具体的周执行计划。`;
      openAgent(query);
  };

  return (
    <div className="fixed inset-0 z-[40] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-fade-in-up">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex justify-between items-start shrink-0">
           <div>
               <div className="flex items-center gap-3 mb-2">
                   <FileText className="text-blue-400" size={24} />
                   <h2 className="text-2xl font-bold">{report.title || '经营诊断报告'}</h2>
               </div>
               <p className="text-slate-400 text-sm flex items-center gap-2">
                   生成时间: {new Date().toLocaleString()}
                   <span className="px-2 py-0.5 bg-blue-900/50 rounded text-xs border border-blue-800">AI 深度研报</span>
               </p>
           </div>
           <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-full">
               <X size={20} />
           </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/50">
            
            {/* Executive Summary */}
            <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Activity size={20} className="text-indigo-600" /> 执行摘要
                </h3>
                <p className="text-slate-700 leading-relaxed text-sm">
                    {report.executiveSummary}
                </p>
                <div className="mt-4 flex items-center gap-4">
                    <span className="text-sm font-bold text-slate-500">市场情绪指标:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 ${
                        report.marketTrend === 'Bullish' ? 'bg-green-100 text-green-700' : 
                        report.marketTrend === 'Bearish' ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-700'
                    }`}>
                        {report.marketTrend === 'Bullish' && <TrendingUp size={14} />}
                        {report.marketTrend === 'Bearish' && <TrendingDown size={14} />}
                        {report.marketTrend === 'Stable' && <Activity size={14} />}
                        {report.marketTrend}
                    </span>
                </div>
            </section>

            {/* Two Column Layout: Chart Insights & Core Issues */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <BarChart3 size={20} className="text-blue-600" /> 图表深度解读
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed flex-1">
                        {report.chartInsights || "暂无图表分析数据。"}
                    </p>
                </section>

                <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <AlertTriangle size={20} className="text-red-500" /> 核心问题诊断
                    </h3>
                    <ul className="space-y-2">
                        {report.coreIssues?.map((issue, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                                <span className="text-red-500 mt-1">•</span> {issue}
                            </li>
                        )) || <li className="text-slate-400 text-sm">未检测到显著问题</li>}
                    </ul>
                    
                    <h3 className="text-lg font-bold text-slate-800 mt-6 mb-4 flex items-center gap-2">
                        <Target size={20} className="text-emerald-600" /> 潜在机会点
                    </h3>
                    <ul className="space-y-2">
                        {report.opportunities?.map((opp, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                                <span className="text-emerald-500 mt-1">•</span> {opp}
                            </li>
                        )) || <li className="text-slate-400 text-sm">暂无明确机会点</li>}
                    </ul>
                </section>
            </div>

            {/* Strategy Roadmap */}
            <section>
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <PieChart size={20} className="text-purple-600" /> 策略路线图
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {report.strategies.map((strat, idx) => (
                        <div key={idx} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow bg-white relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                            <h4 className="font-bold text-slate-800 mb-2 text-sm">{strat.focus}</h4>
                            <p className="text-sm text-slate-600 mb-3 h-12 line-clamp-2 group-hover:text-slate-900">{strat.action}</p>
                            <div className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded inline-block border border-purple-100">
                                预期: {strat.impact}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Risk Assessment */}
            <section className="bg-orange-50 p-6 rounded-xl border border-orange-100">
                <h3 className="text-lg font-bold text-orange-800 mb-2 flex items-center gap-2">
                    <AlertTriangle size={20} /> 风险评估
                </h3>
                <p className="text-orange-700 text-sm">
                    {report.riskAssessment}
                </p>
            </section>
        </div>

        {/* Footer with Agent Interaction */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between">
            <div className="flex items-center gap-3">
                 <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">一键咨询 Agent:</span>
                 <button 
                    onClick={() => handleConsultAgent("请针对报告中的【核心问题诊断】部分，给出更具体的落地解决方案。")}
                    className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1"
                 >
                    <MessageCircle size={12}/> 询问落地反案
                 </button>
                 <button 
                    onClick={() => handleConsultAgent("基于【策略路线图】，请帮我草拟一份下周的调价邮件通知模板。")}
                    className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1"
                 >
                    <FileText size={12}/> 草拟调价邮件
                 </button>
            </div>
            
            <div className="flex gap-3">
                <button onClick={onClose} className="px-6 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors">
                    关闭
                </button>
                <button onClick={() => handleConsultAgent()} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg shadow hover:bg-blue-700 transition-colors flex items-center gap-2">
                    <MessageCircle size={16} /> 咨询 Agent
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};

export default AnalysisReportModal;
