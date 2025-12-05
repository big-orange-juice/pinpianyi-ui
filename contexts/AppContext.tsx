
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform, ActivityType, PriceStatusFilter, Message, SystemNotification, ChatSession, AnalysisReport, ProductTag } from '../types';
import { resetChatSession } from '../services/geminiService';
// Import constants to ensure DataService is initialized
import { MOCK_PRODUCTS } from '../constants';

interface UserProfile {
  name: string;
  role: string;
  region: string;
  managedPlatform: Platform | 'ALL';
}

interface AppContextType {
  currentUser: UserProfile;
  selectedPlatform: Platform | 'ALL';
  setSelectedPlatform: (p: Platform | 'ALL') => void;
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  selectedBrand: string;
  setSelectedBrand: (b: string) => void;
  selectedActivity: ActivityType | 'ALL';
  setSelectedActivity: (a: ActivityType | 'ALL') => void;
  selectedRegion: string;
  setSelectedRegion: (r: string) => void;
  selectedPriceStatus: PriceStatusFilter;
  setSelectedPriceStatus: (s: PriceStatusFilter) => void;
  selectedTag: ProductTag | 'ALL';
  setSelectedTag: (t: ProductTag | 'ALL') => void;
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  
  // Config State
  costThreshold: number;
  setCostThreshold: (n: number) => void;

  // Monitored Products (Top Focus)
  monitoredProductIds: string[];
  setMonitoredProductIds: (ids: string[]) => void;

  // Special Attention Products
  specialAttentionIds: string[];
  setSpecialAttentionIds: (ids: string[]) => void;
  toggleSpecialAttention: (id: string) => void;
  
  // Agent Control
  agentOpenState: boolean;
  setAgentOpenState: (open: boolean) => void;
  agentInputMessage: string;
  setAgentInputMessage: (msg: string) => void;
  openAgent: (initialMessage?: string) => void;
  
  // Persistent Agent State & History
  chatHistory: Message[];
  setChatHistory: React.Dispatch<React.SetStateAction<Message[]>>;
  notifications: SystemNotification[];
  addNotification: (n: Omit<SystemNotification, 'id' | 'timestamp' | 'isRead'>) => void;
  markNotificationRead: (id: string) => void;
  
  // Session Management
  sessions: ChatSession[];
  currentSessionId: string;
  startNewChat: () => void;
  loadSession: (id: string) => void;

  // Report Modal Control
  isReportModalOpen: boolean;
  setReportModalOpen: (open: boolean) => void;
  reportData: AnalysisReport | null;
  setReportData: (data: AnalysisReport | null) => void;
  
  // Dynamic Platforms
  availablePlatforms: string[];
  addPlatform: (p: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Mock Logged In User
  const [currentUser] = useState<UserProfile>({
    name: '张运营',
    role: '高级商品运营专家',
    region: '上海',
    managedPlatform: 'ALL'
  });

  const [selectedPlatform, setSelectedPlatform] = useState<Platform | 'ALL'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedBrand, setSelectedBrand] = useState<string>('ALL');
  const [selectedActivity, setSelectedActivity] = useState<ActivityType | 'ALL'>('ALL');
  // Initialize region with User's managed region
  const [selectedRegion, setSelectedRegion] = useState<string>(currentUser.region); 
  const [selectedPriceStatus, setSelectedPriceStatus] = useState<PriceStatusFilter>('ALL');
  const [selectedTag, setSelectedTag] = useState<ProductTag | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [costThreshold, setCostThreshold] = useState<number>(0);

  // Initialize with all mock products by default
  const [monitoredProductIds, setMonitoredProductIds] = useState<string[]>(MOCK_PRODUCTS.map(p => p.id));
  
  // Initialize Special Attention IDs (Empty by default)
  const [specialAttentionIds, setSpecialAttentionIds] = useState<string[]>([]);

  // Agent State
  const [agentOpenState, setAgentOpenState] = useState(false);
  const [agentInputMessage, setAgentInputMessage] = useState('');
  
  // Session State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>(Date.now().toString());

  // Report Modal State
  const [isReportModalOpen, setReportModalOpen] = useState(false);
  const [reportData, setReportData] = useState<AnalysisReport | null>(null);

  // Chat History (Persisted)
  const [chatHistory, setChatHistory] = useState<Message[]>([
    { role: 'assistant', content: `你好，${currentUser.name}！我是拼便宜商品运营Agent。\n\n已为您加载【${currentUser.region}大区】数据 (基于DataService数据源)。\n您可以说："帮我分析一下红牛在上海的价格"，我会自动为您调取相关数据。` }
  ]);

  // Notifications
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  
  // Platforms - Initialize with default enum values
  const [availablePlatforms, setAvailablePlatforms] = useState<string[]>(Object.values(Platform));
  
  const addPlatform = (p: string) => {
    setAvailablePlatforms(prev => {
      if (prev.includes(p)) return prev;
      return [...prev, p];
    });
  };

  const toggleSpecialAttention = (id: string) => {
    setSpecialAttentionIds(prev => {
        if (prev.includes(id)) return prev.filter(pid => pid !== id);
        return [...prev, id];
    });
  };

  // Auto-save Chat Session
  useEffect(() => {
    if (chatHistory.length > 1) {
      setSessions(prev => {
        const existingIndex = prev.findIndex(s => s.id === currentSessionId);
        const firstUserMsg = chatHistory.find(m => m.role === 'user');
        const title = firstUserMsg ? (firstUserMsg.content.slice(0, 18) + (firstUserMsg.content.length > 18 ? '...' : '')) : '新对话';

        if (existingIndex >= 0) {
          const newSessions = [...prev];
          newSessions[existingIndex] = {
            ...newSessions[existingIndex],
            title: newSessions[existingIndex].title === '新对话' ? title : newSessions[existingIndex].title,
            messages: chatHistory
          };
          return newSessions;
        } else {
          return [{
            id: currentSessionId,
            title: title || '新对话',
            startTime: new Date(),
            messages: chatHistory
          }, ...prev];
        }
      });
    }
  }, [chatHistory, currentSessionId]);

  const startNewChat = () => {
    const newId = Date.now().toString();
    resetChatSession();
    setCurrentSessionId(newId);
    setChatHistory([{ role: 'assistant', content: '已为您开启新会话。请问有什么可以帮您？' }]);
  };

  const loadSession = (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (session) {
      resetChatSession();
      setCurrentSessionId(id);
      setChatHistory(session.messages);
    }
  };

  const openAgent = (initialMessage?: string) => {
    setAgentOpenState(true);
    if (initialMessage) {
      setAgentInputMessage(initialMessage);
    }
  };

  const addNotification = (notif: Omit<SystemNotification, 'id' | 'timestamp' | 'isRead'>) => {
    setNotifications(prev => {
      // Avoid duplicate notifications with same title slightly
      if (prev.some(n => n.title === notif.title && Date.now() - n.timestamp.getTime() < 5000)) return prev;
      return [{
        id: Date.now().toString() + Math.random(),
        timestamp: new Date(),
        isRead: false,
        ...notif
      }, ...prev];
    });
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      selectedPlatform, setSelectedPlatform,
      selectedCategory, setSelectedCategory,
      selectedBrand, setSelectedBrand,
      selectedActivity, setSelectedActivity,
      selectedRegion, setSelectedRegion,
      selectedPriceStatus, setSelectedPriceStatus,
      selectedTag, setSelectedTag,
      searchTerm, setSearchTerm,
      costThreshold, setCostThreshold,
      monitoredProductIds, setMonitoredProductIds,
      specialAttentionIds, setSpecialAttentionIds, toggleSpecialAttention,
      agentOpenState, setAgentOpenState,
      agentInputMessage, setAgentInputMessage,
      openAgent,
      chatHistory, setChatHistory,
      notifications, addNotification, markNotificationRead,
      sessions, currentSessionId, startNewChat, loadSession,
      isReportModalOpen, setReportModalOpen,
      reportData, setReportData,
      availablePlatforms, addPlatform
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};
