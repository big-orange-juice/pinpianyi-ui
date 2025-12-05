import { create } from 'zustand';
import { Platform, ActivityType, PriceStatusFilter, Message, SystemNotification, ChatSession, AnalysisReport, ProductTag } from '../types';
import { MOCK_PRODUCTS } from '../constants';

interface UserProfile {
  name: string;
  role: string;
  region: string;
  managedPlatform: Platform | 'ALL';
}

interface AppState {
  // User
  currentUser: UserProfile;
  
  // Filters
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

  // Monitored Products
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
  
  // Chat State
  chatHistory: Message[];
  setChatHistory: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
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

export const useAppStore = create<AppState>((set, get) => ({
  // Initialize current user
  currentUser: {
    name: '张运营',
    role: '高级商品运营专家',
    region: '上海',
    managedPlatform: 'ALL'
  },

  // Filter states
  selectedPlatform: 'ALL',
  setSelectedPlatform: (p) => set({ selectedPlatform: p }),
  selectedCategory: 'ALL',
  setSelectedCategory: (c) => set({ selectedCategory: c }),
  selectedBrand: 'ALL',
  setSelectedBrand: (b) => set({ selectedBrand: b }),
  selectedActivity: 'ALL',
  setSelectedActivity: (a) => set({ selectedActivity: a }),
  selectedRegion: '上海', // Initialize with user's region
  setSelectedRegion: (r) => set({ selectedRegion: r }),
  selectedPriceStatus: 'ALL',
  setSelectedPriceStatus: (s) => set({ selectedPriceStatus: s }),
  selectedTag: 'ALL',
  setSelectedTag: (t) => set({ selectedTag: t }),
  searchTerm: '',
  setSearchTerm: (s) => set({ searchTerm: s }),
  
  costThreshold: 0,
  setCostThreshold: (n) => set({ costThreshold: n }),

  // Initialize with all mock products
  monitoredProductIds: MOCK_PRODUCTS.map(p => p.id),
  setMonitoredProductIds: (ids) => set({ monitoredProductIds: ids }),
  
  specialAttentionIds: [],
  setSpecialAttentionIds: (ids) => set({ specialAttentionIds: ids }),
  toggleSpecialAttention: (id) => set((state) => ({
    specialAttentionIds: state.specialAttentionIds.includes(id)
      ? state.specialAttentionIds.filter(pid => pid !== id)
      : [...state.specialAttentionIds, id]
  })),

  // Agent state
  agentOpenState: false,
  setAgentOpenState: (open) => set({ agentOpenState: open }),
  agentInputMessage: '',
  setAgentInputMessage: (msg) => set({ agentInputMessage: msg }),
  openAgent: (initialMessage) => set({ 
    agentOpenState: true,
    agentInputMessage: initialMessage || ''
  }),

  // Session state
  sessions: [],
  currentSessionId: Date.now().toString(),
  
  chatHistory: [
    { 
      role: 'assistant', 
      content: `你好，张运营！我是拼便宜商品运营Agent。\n\n已为您加载【上海大区】数据。\n您可以说："帮我分析一下红牛在上海的价格"，我会自动为您调取相关数据。` 
    }
  ],
  setChatHistory: (messages) => set((state) => {
    const newHistory = typeof messages === 'function' ? messages(state.chatHistory) : messages;
    
    // Auto-save session
    if (newHistory.length > 1) {
      const firstUserMsg = newHistory.find(m => m.role === 'user');
      const title = firstUserMsg ? (firstUserMsg.content.slice(0, 18) + (firstUserMsg.content.length > 18 ? '...' : '')) : '新对话';
      
      const existingIndex = state.sessions.findIndex(s => s.id === state.currentSessionId);
      
      let newSessions = [...state.sessions];
      if (existingIndex >= 0) {
        newSessions[existingIndex] = {
          ...newSessions[existingIndex],
          title: newSessions[existingIndex].title === '新对话' ? title : newSessions[existingIndex].title,
          messages: newHistory
        };
      } else {
        newSessions = [{
          id: state.currentSessionId,
          title: title || '新对话',
          startTime: new Date(),
          messages: newHistory
        }, ...newSessions];
      }
      
      return { chatHistory: newHistory, sessions: newSessions };
    }
    
    return { chatHistory: newHistory };
  }),

  notifications: [],
  addNotification: (notif) => set((state) => {
    // Avoid duplicate notifications
    if (state.notifications.some(n => n.title === notif.title && Date.now() - n.timestamp.getTime() < 5000)) {
      return state;
    }
    return {
      notifications: [{
        id: Date.now().toString() + Math.random(),
        timestamp: new Date(),
        isRead: false,
        ...notif
      }, ...state.notifications]
    };
  }),
  markNotificationRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => n.id === id ? { ...n, isRead: true } : n)
  })),

  startNewChat: () => {
    const newId = Date.now().toString();
    set({ 
      currentSessionId: newId,
      chatHistory: [{ role: 'assistant', content: '已为您开启新会话。请问有什么可以帮您？' }]
    });
  },

  loadSession: (id) => {
    const session = get().sessions.find(s => s.id === id);
    if (session) {
      set({
        currentSessionId: id,
        chatHistory: session.messages
      });
    }
  },

  isReportModalOpen: false,
  setReportModalOpen: (open) => set({ isReportModalOpen: open }),
  reportData: null,
  setReportData: (data) => set({ reportData: data }),
  
  availablePlatforms: Object.values(Platform),
  addPlatform: (p) => set((state) => ({
    availablePlatforms: state.availablePlatforms.includes(p) 
      ? state.availablePlatforms 
      : [...state.availablePlatforms, p]
  })),
}));
