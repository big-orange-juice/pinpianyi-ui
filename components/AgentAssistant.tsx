'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Paperclip,
  Bot,
  User,
  Bell,
  History,
  Plus,
  MessageSquare
} from 'lucide-react';
import { Message } from '../types';
import { useAppStore } from '../store/useAppStore';

const AgentAssistant: React.FC = () => {
  const {
    chatHistory: messages,
    setChatHistory: setMessages,
    agentOpenState,
    setAgentOpenState,
    agentInputMessage,
    setAgentInputMessage,
    notifications,
    markNotificationRead,
    sessions,
    currentSessionId,
    startNewChat,
    loadSession
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<
    'CHAT' | 'NOTIFICATIONS' | 'HISTORY'
  >('CHAT');
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    if (agentInputMessage) {
      // We intentionally sync queued agent prompts into the local input once.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInputValue(agentInputMessage);
      setActiveTab('CHAT');
      setAgentInputMessage('');
    }
  }, [agentInputMessage, setAgentInputMessage]);

  const toggleChat = (open: boolean) => {
    setAgentOpenState(open);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  const handleSendMessage = async (overrideContent?: string) => {
    const contentToSend = overrideContent || inputValue;
    if ((!contentToSend.trim() && !selectedFile) || isLoading) return;

    const newMessage: Message = {
      role: 'user',
      content: contentToSend,
      hasFile: !!selectedFile,
      fileName: selectedFile?.name
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate response (since Gemini is removed)
    setTimeout(() => {
      const responseMessage: Message = {
        role: 'assistant',
        content:
          '抱歉，AI助手功能暂时不可用。系统已移除Gemini集成。\n\n您可以通过页面上的筛选器和图表来分析数据。'
      };
      setMessages((prev) => [...prev, responseMessage]);
      setIsLoading(false);
      setSelectedFile(null);
    }, 500);
  };

  if (!agentOpenState) {
    return (
      <button
        onClick={() => toggleChat(true)}
        className='fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-full shadow-2xl hover:shadow-blue-500/50 hover:scale-105 transition-all duration-200 z-30 group'>
        <MessageCircle size={24} />
        {unreadCount > 0 && (
          <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse'>
            {unreadCount}
          </span>
        )}
        <span className='absolute right-16 bg-slate-800 text-white px-3 py-1 rounded-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none'>
          AI助手 (已禁用)
        </span>
      </button>
    );
  }

  return (
    <div className='fixed bottom-6 right-6 w-[420px] h-[680px] bg-white rounded-2xl shadow-2xl flex flex-col z-30 border border-slate-200 animate-scale-in'>
      {/* Header */}
      <div className='bg-gradient-to-r from-blue-600 to-blue-700 p-4 rounded-t-2xl flex justify-between items-center text-white shrink-0'>
        <div className='flex items-center gap-3'>
          <div className='w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center'>
            <Bot size={22} />
          </div>
          <div>
            <h3 className='font-bold text-sm'>拼便宜运营Agent</h3>
            <p className='text-xs text-blue-100'>智能数据分析助手 (已禁用)</p>
          </div>
        </div>
        <button
          onClick={() => toggleChat(false)}
          className='hover:bg-white/20 p-2 rounded-full transition-colors'>
          <X size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className='flex border-b border-slate-200 bg-slate-50/80 shrink-0'>
        <button
          onClick={() => setActiveTab('CHAT')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'CHAT'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
              : 'text-slate-500 hover:text-slate-700'
          }`}>
          <MessageSquare size={16} /> 对话
        </button>
        <button
          onClick={() => setActiveTab('NOTIFICATIONS')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 relative ${
            activeTab === 'NOTIFICATIONS'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
              : 'text-slate-500 hover:text-slate-700'
          }`}>
          <Bell size={16} /> 通知
          {unreadCount > 0 && (
            <span className='absolute top-1 right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center'>
              {unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'HISTORY'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
              : 'text-slate-500 hover:text-slate-700'
          }`}>
          <History size={16} /> 历史
        </button>
      </div>

      {/* Content Area */}
      <div className='flex-1 overflow-y-auto p-4'>
        {activeTab === 'CHAT' && (
          <div className='space-y-4'>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}>
                {msg.role === 'assistant' && (
                  <div className='w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0'>
                    <Bot size={18} className='text-blue-600' />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-800'
                  }`}>
                  <p className='text-sm leading-relaxed whitespace-pre-wrap'>
                    {msg.content}
                  </p>
                  {msg.hasFile && msg.fileName && (
                    <div className='mt-2 flex items-center gap-2 text-xs opacity-80'>
                      <Paperclip size={12} />
                      {msg.fileName}
                    </div>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className='w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0'>
                    <User size={18} className='text-white' />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className='flex gap-3 justify-start'>
                <div className='w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0'>
                  <Bot size={18} className='text-blue-600' />
                </div>
                <div className='bg-slate-100 rounded-2xl px-4 py-3'>
                  <div className='flex gap-1'>
                    <span
                      className='w-2 h-2 bg-slate-400 rounded-full animate-bounce'
                      style={{ animationDelay: '0ms' }}></span>
                    <span
                      className='w-2 h-2 bg-slate-400 rounded-full animate-bounce'
                      style={{ animationDelay: '150ms' }}></span>
                    <span
                      className='w-2 h-2 bg-slate-400 rounded-full animate-bounce'
                      style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {activeTab === 'NOTIFICATIONS' && (
          <div className='space-y-2'>
            {notifications.length === 0 ? (
              <div className='text-center py-12 text-slate-400'>
                <Bell size={40} className='mx-auto mb-3 opacity-50' />
                <p className='text-sm'>暂无系统通知</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 rounded-lg border cursor-pointer hover:bg-slate-50 transition-colors ${
                    notif.isRead
                      ? 'bg-white border-slate-100'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                  onClick={() => markNotificationRead(notif.id)}>
                  <div className='flex items-start gap-3'>
                    <Bell
                      size={16}
                      className={
                        notif.isRead ? 'text-slate-400' : 'text-blue-600'
                      }
                    />
                    <div className='flex-1'>
                      <h4 className='font-semibold text-sm text-slate-800'>
                        {notif.title}
                      </h4>
                      <p className='text-xs text-slate-600 mt-1'>
                        {notif.message}
                      </p>
                      <p className='text-xs text-slate-400 mt-2'>
                        {notif.timestamp.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'HISTORY' && (
          <div className='space-y-2'>
            <button
              onClick={handleNewChat}
              className='w-full p-3 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 text-blue-600 font-medium text-sm'>
              <Plus size={16} /> 新对话
            </button>
            {sessions.length === 0 ? (
              <div className='text-center py-12 text-slate-400'>
                <History size={40} className='mx-auto mb-3 opacity-50' />
                <p className='text-sm'>暂无历史会话</p>
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => handleLoadSession(session.id)}
                  className={`p-3 rounded-lg border cursor-pointer hover:bg-slate-50 transition-colors ${
                    session.id === currentSessionId
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-white border-slate-100'
                  }`}>
                  <div className='flex items-start gap-3'>
                    <MessageSquare size={16} className='text-slate-400 mt-1' />
                    <div className='flex-1'>
                      <h4 className='font-medium text-sm text-slate-800'>
                        {session.title}
                      </h4>
                      <p className='text-xs text-slate-400 mt-1'>
                        {session.startTime.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Input Area */}
      {activeTab === 'CHAT' && (
        <div className='p-4 border-t border-slate-200 bg-slate-50 shrink-0'>
          {selectedFile && (
            <div className='mb-2 flex items-center gap-2 text-sm text-slate-600 bg-blue-50 px-3 py-2 rounded-lg'>
              <Paperclip size={14} />
              <span className='flex-1 truncate'>{selectedFile.name}</span>
              <button
                onClick={() => setSelectedFile(null)}
                className='text-red-500 hover:text-red-600'>
                <X size={14} />
              </button>
            </div>
          )}
          <div className='flex gap-2'>
            <input
              type='file'
              ref={fileInputRef}
              onChange={handleFileSelect}
              className='hidden'
              accept='.txt,.csv,.json,.xlsx'
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className='p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors'
              title='上传文件 (已禁用)'
              disabled>
              <Paperclip size={20} />
            </button>
            <input
              type='text'
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder='AI功能已禁用...'
              className='flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
              disabled={isLoading}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || (!inputValue.trim() && !selectedFile)}
              className='p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'>
              <Send size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentAssistant;
