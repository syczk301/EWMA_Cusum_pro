import { create } from 'zustand';
import { DataPoint, StatisticsResult, EWMAResult, CUSUMResult } from '../utils/dataUtils';

// 变量定义接口
export interface Variable {
  id: string;
  name: string;
  description: string;
  unit: string;
  type: 'continuous' | 'discrete';
  columnIndex?: number;
}

interface DataState {
  // 原始数据
  rawData: DataPoint[];
  // 处理后的数据
  processedData: DataPoint[];
  // 当前选中的数据集
  selectedDataset: string | null;
  // 可用变量列表
  availableVariables: Variable[];
  // 当前选中的变量
  selectedVariable: Variable | null;
  // 上传的文件
  uploadedFile: File | null;
  // 数据统计信息
  statistics: StatisticsResult | null;
  // EWMA结果
  ewmaResults: (DataPoint & EWMAResult)[] | null;
  // CUSUM结果
  cusumResults: (DataPoint & CUSUMResult)[] | null;
  // 加载状态
  isLoading: boolean;
  // 错误信息
  error: string | null;
  
  // Actions
  setRawData: (data: DataPoint[]) => void;
  setProcessedData: (data: DataPoint[]) => void;
  setSelectedDataset: (dataset: string | null) => void;
  setAvailableVariables: (variables: Variable[]) => void;
  setSelectedVariable: (variable: Variable | null) => void;
  setUploadedFile: (file: File | null) => void;
  addVariable: (variable: Variable) => void;
  removeVariable: (variableId: string) => void;
  setStatistics: (stats: StatisticsResult | null) => void;
  setEWMAResults: (results: (DataPoint & EWMAResult)[] | null) => void;
  setCUSUMResults: (results: (DataPoint & CUSUMResult)[] | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearData: () => void;
}

export const useDataStore = create<DataState>((set, get) => ({
  // Initial state
  rawData: [],
  processedData: [],
  selectedDataset: null,
  uploadedFile: null,
  availableVariables: [
    {
      id: 'thickness',
      name: '厚度',
      description: '成纸厚度测量值',
      unit: 'mm',
      type: 'continuous'
    },
    {
      id: 'moisture',
      name: '水分含量',
      description: '成纸水分含量百分比',
      unit: '%',
      type: 'continuous'
    },
    {
      id: 'tensile_strength',
      name: '抗张强度',
      description: '成纸抗张强度测量值',
      unit: 'N·m/g',
      type: 'continuous'
    },
    {
      id: 'brightness',
      name: '白度',
      description: '成纸白度测量值',
      unit: '%ISO',
      type: 'continuous'
    },
    {
      id: 'smoothness',
      name: '平滑度',
      description: '成纸表面平滑度',
      unit: 'ml/min',
      type: 'continuous'
    }
  ],
  selectedVariable: null,
  statistics: null,
  ewmaResults: null,
  cusumResults: null,
  isLoading: false,
  error: null,
  
  // Actions
  setRawData: (data) => set({ rawData: data }),
  setProcessedData: (data) => set({ processedData: data }),
  setSelectedDataset: (dataset) => set({ selectedDataset: dataset }),
  setAvailableVariables: (variables) => set({ availableVariables: variables }),
  setSelectedVariable: (variable) => set({ selectedVariable: variable }),
  setUploadedFile: (file) => set({ uploadedFile: file }),
  addVariable: (variable) => set((state) => ({
    availableVariables: [...state.availableVariables, variable]
  })),
  removeVariable: (variableId) => set((state) => ({
    availableVariables: state.availableVariables.filter(v => v.id !== variableId),
    selectedVariable: state.selectedVariable?.id === variableId ? null : state.selectedVariable
  })),
  setStatistics: (stats) => set({ statistics: stats }),
  setEWMAResults: (results) => set({ ewmaResults: results }),
  setCUSUMResults: (results) => set({ cusumResults: results }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearData: () => set({
    rawData: [],
    processedData: [],
    selectedDataset: null,
    selectedVariable: null,
    uploadedFile: null,
    statistics: null,
    ewmaResults: null,
    cusumResults: null,
    error: null
  })
}));

// EWMA参数配置
interface EWMAConfig {
  lambda: number;
  target: number;
  sigma: number;
  L: number;
}

interface EWMAConfigState {
  config: EWMAConfig;
  setConfig: (config: Partial<EWMAConfig>) => void;
  resetConfig: () => void;
}

const defaultEWMAConfig: EWMAConfig = {
  lambda: 0.2,
  target: 100,
  sigma: 2.0,
  L: 3.0
};

export const useEWMAConfigStore = create<EWMAConfigState>((set) => ({
  config: defaultEWMAConfig,
  setConfig: (newConfig) => set((state) => ({
    config: { ...state.config, ...newConfig }
  })),
  resetConfig: () => set({ config: defaultEWMAConfig })
}));

// CUSUM参数配置
interface CUSUMConfig {
  target: number;
  sigma: number;
  k: number;
  h: number;
}

interface CUSUMConfigState {
  config: CUSUMConfig;
  setConfig: (config: Partial<CUSUMConfig>) => void;
  resetConfig: () => void;
}

const defaultCUSUMConfig: CUSUMConfig = {
  target: 100,
  sigma: 2.0,
  k: 0.5,
  h: 5.0
};

export const useCUSUMConfigStore = create<CUSUMConfigState>((set) => ({
  config: defaultCUSUMConfig,
  setConfig: (newConfig) => set((state) => ({
    config: { ...state.config, ...newConfig }
  })),
  resetConfig: () => set({ config: defaultCUSUMConfig })
}));

// 系统设置
interface SystemSettings {
  theme: 'light' | 'dark';
  language: 'zh-CN' | 'en-US';
  autoSave: boolean;
  notifications: boolean;
  dataRetentionDays: number;
}

interface SystemSettingsState {
  settings: SystemSettings;
  setSettings: (settings: Partial<SystemSettings>) => void;
  resetSettings: () => void;
}

const defaultSettings: SystemSettings = {
  theme: 'light',
  language: 'zh-CN',
  autoSave: true,
  notifications: true,
  dataRetentionDays: 365
};

export const useSystemSettingsStore = create<SystemSettingsState>((set) => ({
  settings: defaultSettings,
  setSettings: (newSettings) => set((state) => ({
    settings: { ...state.settings, ...newSettings }
  })),
  resetSettings: () => set({ settings: defaultSettings })
}));

// 报警状态管理
interface AlarmRule {
  id: string;
  name: string;
  type: 'ewma' | 'cusum' | 'threshold' | 'trend';
  parameter: string;
  condition: string;
  threshold: number;
  priority: 'high' | 'medium' | 'low';
  enabled: boolean;
  description: string;
}

interface AlarmRecord {
  id: string;
  ruleId: string;
  ruleName: string;
  type: 'ewma' | 'cusum' | 'threshold' | 'trend';
  priority: 'high' | 'medium' | 'low';
  status: 'active' | 'acknowledged' | 'resolved';
  value: number;
  threshold: number;
  timestamp: string;
  description: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

interface AlarmState {
  rules: AlarmRule[];
  records: AlarmRecord[];
  activeAlarms: AlarmRecord[];
  
  // Actions
  addRule: (rule: AlarmRule) => void;
  updateRule: (id: string, updates: Partial<AlarmRule>) => void;
  deleteRule: (id: string) => void;
  toggleRule: (id: string) => void;
  
  addRecord: (record: AlarmRecord) => void;
  acknowledgeAlarm: (id: string, acknowledgedBy: string) => void;
  resolveAlarm: (id: string) => void;
  
  getActiveAlarms: () => AlarmRecord[];
  getAlarmsByPriority: (priority: 'high' | 'medium' | 'low') => AlarmRecord[];
}

export const useAlarmStore = create<AlarmState>((set, get) => ({
  rules: [],
  records: [],
  activeAlarms: [],
  
  addRule: (rule) => set((state) => ({
    rules: [...state.rules, rule]
  })),
  
  updateRule: (id, updates) => set((state) => ({
    rules: state.rules.map(rule => 
      rule.id === id ? { ...rule, ...updates } : rule
    )
  })),
  
  deleteRule: (id) => set((state) => ({
    rules: state.rules.filter(rule => rule.id !== id)
  })),
  
  toggleRule: (id) => set((state) => ({
    rules: state.rules.map(rule => 
      rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
    )
  })),
  
  addRecord: (record) => set((state) => {
    const newRecords = [...state.records, record];
    const activeAlarms = newRecords.filter(r => r.status === 'active');
    return {
      records: newRecords,
      activeAlarms
    };
  }),
  
  acknowledgeAlarm: (id, acknowledgedBy) => set((state) => {
    const updatedRecords = state.records.map(record => 
      record.id === id 
        ? { 
            ...record, 
            status: 'acknowledged' as const,
            acknowledgedBy,
            acknowledgedAt: new Date().toISOString()
          }
        : record
    );
    const activeAlarms = updatedRecords.filter(r => r.status === 'active');
    return {
      records: updatedRecords,
      activeAlarms
    };
  }),
  
  resolveAlarm: (id) => set((state) => {
    const updatedRecords = state.records.map(record => 
      record.id === id 
        ? { 
            ...record, 
            status: 'resolved' as const,
            resolvedAt: new Date().toISOString()
          }
        : record
    );
    const activeAlarms = updatedRecords.filter(r => r.status === 'active');
    return {
      records: updatedRecords,
      activeAlarms
    };
  }),
  
  getActiveAlarms: () => {
    return get().records.filter(record => record.status === 'active');
  },
  
  getAlarmsByPriority: (priority) => {
    return get().records.filter(record => record.priority === priority);
  }
}));

// 用户状态管理
interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'operator' | 'viewer';
  avatar?: string;
}

interface UserState {
  currentUser: User | null;
  isAuthenticated: boolean;
  permissions: string[];
  
  // Actions
  setCurrentUser: (user: User | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setPermissions: (permissions: string[]) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  currentUser: null,
  isAuthenticated: false,
  permissions: [],
  
  setCurrentUser: (user) => set({ currentUser: user }),
  setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
  setPermissions: (permissions) => set({ permissions }),
  logout: () => set({
    currentUser: null,
    isAuthenticated: false,
    permissions: []
  })
}));

// UI状态管理
interface UIState {
  sidebarCollapsed: boolean;
  currentPage: string;
  loading: boolean;
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    timestamp: string;
  }>;
  
  // Actions
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCurrentPage: (page: string) => void;
  setLoading: (loading: boolean) => void;
  addNotification: (notification: Omit<UIState['notifications'][0], 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  currentPage: 'data-management',
  loading: false,
  notifications: [],
  
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setLoading: (loading) => set({ loading }),
  
  addNotification: (notification) => set((state) => ({
    notifications: [
      ...state.notifications,
      {
        ...notification,
        id: Date.now().toString(),
        timestamp: new Date().toISOString()
      }
    ]
  })),
  
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),
  
  clearNotifications: () => set({ notifications: [] })
}));