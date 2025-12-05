import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Paperclip, Bot, User, FileText, Sparkles, Bell, ArrowRight, Database, Search, History, Plus, MessageSquare, BarChart2 } from 'lucide-react';
import { sendChatMessage, sendToolResponse } from '../services/geminiService';
import { GenerateContentResponse } from "@google/genai";
import { useAppContext } from '../contexts/AppContext';
import { Platform, ActivityType, PriceStatusFilter, Message } from '../types';
import { useNavigate } from 'react-router-dom';

const AgentAssistant: React.FC = () => {
  // Consuming Global State instead of local messages
  const { 
    chatHistory: messages, setChatHistory: setMessages,
    agentOpenState, setAgentOpenState, agentInputMessage, setAgentInputMessage,
    notifications, markNotificationRead,
    setSelectedPlatform, setSelectedCategory, setSelectedActivity, setSearchTerm,
    setSelectedRegion, setSelectedPriceStatus,
    sessions, currentSessionId, startNewChat, loadSession,
    setReportModalOpen
  } = useAppContext();

  const [activeTab, setActiveTab] = useState<'CHAT' | 'NOTIFICATIONS' | 'HISTORY'>('CHAT');
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Calculate unread notifications
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Sync external trigger input
  useEffect(() => {
    if (agentInputMessage) {
        setInputValue(agentInputMessage);
        setActiveTab('CHAT'); // Switch to chat if message comes in
        setAgentInputMessage(''); 
    }
  }, [agentInputMessage, setAgentInputMessage]);

  const toggleChat = (open: boolean) => {
      setAgentOpenState(open);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
      if (activeTab === 'CHAT') scrollToBottom();
  }, [messages, activeTab]);

  const handleNewChat = () => {
      startNewChat();
      setActiveTab('CHAT');
  };

  const handleLoadSession = (id: string) => {
      loadSession(id);
      setActiveTab('CHAT');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const processStream = async (stream: AsyncIterable<GenerateContentResponse>) => {
      let fullResponse = '';
      let isFirstChunk = true;
      let functionCalls: any[] = [];

      for await (const chunk of stream) {
        if (chunk.functionCalls && chunk.functionCalls.length > 0) {
            functionCalls.push(...chunk.functionCalls);
        }

        const text = chunk.text;
        if (text) {
          fullResponse += text;
          setMessages(prev => {
            const newMsgs = [...prev];
            if (isFirstChunk) {
                 const lastIdx = newMsgs.length - 1;
                 if (newMsgs[lastIdx].role === 'assistant' && newMsgs[lastIdx].content === '正在分析数据...') {
                     newMsgs[lastIdx] = { role: 'assistant', content: fullResponse };
                 } else {
                     newMsgs.push({ role: 'assistant', content: fullResponse });
                 }
                 isFirstChunk = false;
            } else {
                 newMsgs[newMsgs.length - 1].content = fullResponse;
            }
            return newMsgs;
          });
        }
      }

      // Handle Tool Calls
      if (functionCalls.length > 0) {
          const toolOutputs: string[] = [];
          let shouldNavigate = false;

          for (const call of functionCalls) {
              if (call.name === 'update_dashboard_filters') {
                  const args = call.args as any;
                  let filterDesc = "";
                  
                  if (args.platform && args.platform !== 'ALL') {
                      setSelectedPlatform(args.platform as Platform);
                      filterDesc += `平台:${args.platform} `;
                  } else if (args.platform === 'ALL') {
                      setSelectedPlatform('ALL');
                  }

                  if (args.category) {
                      setSelectedCategory(args.category);
                      filterDesc += `类目:${args.category} `;
                  }
                  
                  if (args.activityType) {
                      setSelectedActivity(args.activityType as ActivityType);
                  }

                  if (args.region) {
                      setSelectedRegion(args.region);
                      filterDesc += `区域:${args.region} `;
                  }

                  if (args.priceStatus && args.priceStatus !== 'ALL') {
                      setSelectedPriceStatus(args.priceStatus as PriceStatusFilter);
                      filterDesc += `状态:${args.priceStatus} `;
                  }

                  if (args.searchTerm) {
                      setSearchTerm(args.searchTerm);
                      filterDesc += `商品:${args.searchTerm}`;
                  }
                  
                  // TRIGGER NAVIGATION
                  shouldNavigate = true;
                  
                  const displayMsg = `已为您自动筛选 [${filterDesc.trim() || '全部数据'}]，并跳转至分析矩阵。`;
                  toolOutputs.push("Success");
                  
                  setMessages(prev => [...prev, { 
                      role: 'assistant', 
                      content: `⚡ ${displayMsg}`, 
                      isToolUse: true 
                  }]);
              } else if (call.name === 'delegate_analysis_task') {
                  const args = call.args as any;
                  const taskTypeMap: Record<string, string> = {
                      'PRICE_STRATEGY': '价格策略制定',
                      'COMPETITOR_ANALYSIS': '竞品深度分析',
                      'MARKET_TREND': '市场趋势预测',
                      'PRODUCT_OPTIMIZATION': '产品优化建议',
                      'RISK_ASSESSMENT': '风险评估'
                  };
                  
                  const taskName = taskTypeMap[args.taskType] || args.taskType;
                  const priority = args.priority || 'MEDIUM';
                  const priorityEmoji = priority === 'HIGH' ? '🔴' : priority === 'MEDIUM' ? '🟡' : '🟢';
                  
                  const displayMsg = `${priorityEmoji} 已接受委派：【${taskName}】\n📋 任务上下文：${args.context}\n🎯 预期产出：${args.expectedOutcome || '深度分析报告'}`;
                  toolOutputs.push(`Delegation accepted: ${taskName}. Processing with ${priority} priority.`);
                  
                  setMessages(prev => [...prev, { 
                      role: 'assistant', 
                      content: `⚡ ${displayMsg}`, 
                      isToolUse: true 
                  }]);
              }
          }
          
          if (shouldNavigate) {
              navigate('/analysis');
          }
          
          setMessages(prev => [...prev, { role: 'assistant', content: '正在生成分析结论...' }]);
          const toolStream = await sendToolResponse(functionCalls, toolOutputs);
          await processStream(toolStream);
      }
  };

  const handleSendMessage = async (overrideContent?: string) => {
    const contentToSend = overrideContent || inputValue;
    if ((!contentToSend.trim() && !selectedFile) || isLoading) return;

    const newMessage: Message = {
      role: 'user',
      content: contentToSend,
      hasFile: !!selectedFile,
      fileName: selectedFile?.name
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    setIsLoading(true);

    if (activeTab !== 'CHAT') setActiveTab('CHAT');

    try {
      let fileContent = '';
      if (selectedFile) {
        fileContent = await readFileContent(selectedFile);
      }

      setMessages(prev => [...prev, { role: 'assistant', content: '正在分析数据...' }]);

      const streamResponse = await sendChatMessage(newMessage.content, fileContent);
      await processStream(streamResponse);
      
    } catch (error) {
      console.error(error);
      setMessages(prev => {
         const newMsgs = [...prev];
         const lastMsg = newMsgs[newMsgs.length - 1];
         if (lastMsg.content === '正在分析数据...' || lastMsg.content === '正在生成分析结论...') {
             newMsgs[newMsgs.length - 1] = { role: 'assistant', content: '抱歉，分析过程中遇到网络问题，请稍后重试。' };
         } else {
             newMsgs.push({ role: 'assistant', content: '抱歉，分析过程中遇到网络问题，请稍后重试。' });
         }
         return newMsgs;
      });
    } finally {
      setIsLoading(false);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  const getGroupLabel = (date: Date) => {
    const today = new Date();
    const d = new Date(date);
    if (d.toDateString() === today.toDateString()) return '今天';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return '昨天';
    return '更早';
  };

  const groupedSessions = sessions.reduce((acc, session) => {
      const label = getGroupLabel(session.startTime);
      if (!acc[label]) acc[label] = [];
      acc[label].push(session);
      return acc;
  }, {} as Record<string, typeof sessions>);

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end font-sans">
      {/* Chat Window */}
      {agentOpenState && (
        <div className="mb-4 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-fade-in-up" style={{ height: '600px' }}>
          {/* Header */}
          <div className="bg-slate-900 p-4 flex justify-between items-center text-white shadow-md shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-blue-600 rounded-full">
                 <Bot size={18} className="text-white" />
              </div>
              <div>
                 <h3 className="font-semibold text-sm">拼便宜商品运营Agent</h3>
                 <p className="text-[10px] text-slate-300 opacity-80">AI 智能分析中</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
               <button onClick={() => setActiveTab(activeTab === 'HISTORY' ? 'CHAT' : 'HISTORY')} className={`p-1.5 rounded hover:bg-slate-800 transition-colors ${activeTab === 'HISTORY' ? 'bg-slate-800 text-blue-400' : 'text-slate-400'}`} title="历史记录">
                  <History size={18} />
               </button>
               <button onClick={handleNewChat} className="p-1.5 rounded hover:bg-slate-800 transition-colors text-slate-400 hover:text-white" title="新对话">
                  <Plus size={18} />
               </button>
               <div className="w-px h-4 bg-slate-700 mx-1"></div>
               <button onClick={() => toggleChat(false)} className="text-slate-400 hover:text-white transition-colors">
                 <X size={18} />
               </button>
            </div>
          </div>

          {/* Tabs - Only show Chat/Notif tabs if not in History mode */}
          {activeTab !== 'HISTORY' && (
            <div className="flex border-b border-slate-100 shrink-0">
                <button 
                    onClick={() => setActiveTab('CHAT')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'CHAT' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    对话
                </button>
                <button 
                    onClick={() => setActiveTab('NOTIFICATIONS')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'NOTIFICATIONS' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    情报与预警
                    {unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                    )}
                </button>
            </div>
          )}

          {/* Content Area */}
          {activeTab === 'HISTORY' ? (
             <div className="flex-1 overflow-y-auto p-4 bg-slate-50 animate-fade-in">
                 <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><History size={16}/> 历史会话记录</h4>
                 {Object.keys(groupedSessions).length === 0 ? (
                     <div className="text-center py-10 text-slate-400 text-sm">暂无历史记录</div>
                 ) : (
                     Object.keys(groupedSessions).map(label => (
                         <div key={label} className="mb-4">
                             <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{label}</div>
                             <div className="space-y-2">
                                 {groupedSessions[label].map(session => (
                                     <div 
                                        key={session.id}
                                        onClick={() => handleLoadSession(session.id)}
                                        className={`p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                                            currentSessionId === session.id 
                                            ? 'bg-white border-blue-300 ring-1 ring-blue-100 shadow-sm' 
                                            : 'bg-white border-slate-200 hover:border-blue-200'
                                        }`}
                                     >
                                         <div className="flex justify-between items-start mb-1">
                                             <span className="font-medium text-slate-700 text-sm line-clamp-1">{session.title}</span>
                                             <span className="text-[10px] text-slate-400 shrink-0">{new Date(session.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                         </div>
                                         <p className="text-xs text-slate-500 line-clamp-1">
                                             {session.messages.find(m => m.role === 'user')?.content || '...'}
                                         </p>
                                     </div>
                                 ))}
                             </div>
                         </div>
                     ))
                 )}
             </div>
          ) : activeTab === 'CHAT' ? (
            <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                    {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'assistant' && !msg.isToolUse && (
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 shrink-0 border border-blue-200">
                                <Bot size={14} className="text-blue-600" />
                            </div>
                        )}
                        
                        {msg.isToolUse ? (
                            <div className="w-full flex justify-center my-2">
                                <span className="text-xs text-slate-500 bg-slate-200/50 px-3 py-1 rounded-full flex items-center gap-1 border border-slate-200">
                                    <Sparkles size={10} className="text-indigo-500"/> {msg.content}
                                </span>
                            </div>
                        ) : (
                            <div className={`max-w-[85%] p-3 rounded-xl text-sm leading-relaxed shadow-sm ${
                            msg.role === 'user' 
                                ? 'bg-blue-600 text-white rounded-br-none' 
                                : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none'
                            }`}>
                            {msg.hasFile && (
                                <div className="flex items-center gap-2 mb-2 p-2 bg-black/10 rounded-md text-xs border border-white/10">
                                <FileText size={14} />
                                <span className="truncate max-w-[150px]">{msg.fileName}</span>
                                </div>
                            )}
                            <div className="whitespace-pre-wrap">{msg.content}</div>
                            </div>
                        )}

                        {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center ml-2 shrink-0">
                                <User size={14} className="text-slate-600" />
                            </div>
                        )}
                    </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-slate-100 shrink-0">
                    {selectedFile && (
                    <div className="flex items-center justify-between bg-slate-100 px-3 py-2 rounded-lg mb-3 text-xs text-slate-600 border border-slate-200">
                        <span className="flex items-center gap-2 truncate">
                        <FileText size={14} className="text-blue-500"/> {selectedFile.name}
                        </span>
                        <button onClick={() => setSelectedFile(null)} className="text-slate-400 hover:text-red-500 p-1">
                        <X size={14} />
                        </button>
                    </div>
                    )}
                    <div className="flex gap-2 items-end">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors border border-transparent hover:border-slate-200"
                        title="上传文件 (txt, csv, json)"
                    >
                        <Paperclip size={20} />
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept=".txt,.csv,.json,.md"
                        onChange={handleFileSelect}
                    />
                    <div className="flex-1 bg-slate-100 rounded-xl border border-transparent focus-within:border-blue-300 focus-within:bg-white transition-all">
                        <textarea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={(e) => {
                                if(e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            placeholder="输入问题 (如:分析红牛价格)..."
                            className="w-full bg-transparent outline-none text-sm text-slate-700 px-3 py-2.5 max-h-24 resize-none"
                            rows={1}
                        />
                    </div>
                    <button 
                        onClick={() => handleSendMessage()}
                        disabled={isLoading || (!inputValue.trim() && !selectedFile)}
                        className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                        <Send size={18} />
                    </button>
                    </div>
                </div>
            </>
          ) : (
            /* NOTIFICATIONS TAB */
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <Bell size={32} className="mb-2 opacity-50"/>
                        <p className="text-sm">暂无新的系统预警</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {notifications.map((notif) => (
                            <div 
                                key={notif.id} 
                                className={`bg-white p-3 rounded-xl border shadow-sm transition-all ${
                                    notif.type === 'CRITICAL' ? 'border-red-200' : 
                                    notif.type === 'NEW_FIELD' ? 'border-orange-200' : 'border-slate-200'
                                } ${!notif.isRead ? 'ring-2 ring-blue-100' : 'opacity-80'}`}
                                onClick={() => markNotificationRead(notif.id)}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`mt-1 p-1.5 rounded-full ${
                                        notif.type === 'CRITICAL' ? 'bg-red-100 text-red-600' : 
                                        notif.type === 'NEW_FIELD' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                                    }`}>
                                        {notif.type === 'CRITICAL' ? <Sparkles size={14}/> : 
                                         notif.type === 'NEW_FIELD' ? <Database size={14}/> : <Bell size={14}/>}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className="text-sm font-bold text-slate-800">{notif.title}</h4>
                                            <span className="text-[10px] text-slate-400">{notif.timestamp.toLocaleTimeString()}</span>
                                        </div>
                                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>
                                        
                                        {/* Action Buttons */}
                                        {notif.type === 'CRITICAL' && (
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    markNotificationRead(notif.id);
                                                    handleSendMessage(`请帮我分析一下这个预警：${notif.title} - ${notif.message}`);
                                                }}
                                                className="mt-2 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 flex items-center gap-1 w-fit"
                                            >
                                                立即分析 <ArrowRight size={10}/>
                                            </button>
                                        )}
                                        
                                        {notif.type === 'NEW_FIELD' && (
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    markNotificationRead(notif.id);
                                                    navigate('/data');
                                                }}
                                                className="mt-2 text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded hover:bg-orange-100 flex items-center gap-1 w-fit"
                                            >
                                                去审核 <ArrowRight size={10}/>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
          )}
        </div>
      )}

      {/* Launcher Button */}
      <button
        onClick={() => toggleChat(!agentOpenState)}
        className={`p-4 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center ${
          agentOpenState ? 'bg-slate-800 text-slate-400 rotate-90' : 'bg-blue-600 text-white'
        }`}
      >
        {agentOpenState ? <X size={24} /> : <MessageCircle size={24} />}
        {!agentOpenState && unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                {unreadCount}
            </span>
        )}
      </button>
    </div>
  );
};

export default AgentAssistant;