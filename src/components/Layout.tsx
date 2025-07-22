import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Database,
  TrendingUp,
  BarChart3,
  FileText,
  Bell,
  Settings,
  Menu,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  {
    path: '/data-management',
    label: '数据管理',
    icon: Database,
    description: '数据导入、预处理、查询'
  },
  {
    path: '/ewma-chart',
    label: 'EWMA控制图',
    icon: TrendingUp,
    description: '指数加权移动平均控制图'
  },
  {
    path: '/cusum-chart',
    label: 'CUSUM控制图',
    icon: BarChart3,
    description: '累积和控制图'
  },
  {
    path: '/quality-analysis',
    label: '质量分析',
    icon: FileText,
    description: '统计分析、报告生成'
  },
  {
    path: '/alarm-management',
    label: '报警管理',
    icon: Bell,
    description: '异常报警、通知管理'
  },
  {
    path: '/system-settings',
    label: '系统设置',
    icon: Settings,
    description: '用户管理、系统配置'
  }
];

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* 侧边栏 */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-[#1e40af] via-[#3b82f6] to-[#60a5fa] shadow-2xl transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* 顶部标题区域 */}
        <div className="relative flex items-center justify-between h-16 px-6 bg-gradient-to-r from-[#1e40af] to-[#3b82f6] shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide">SPC质量管理</h1>
              <p className="text-xs text-blue-100 opacity-90">Statistical Process Control</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* 导航菜单 */}
        <nav className="mt-6 px-4 space-y-2">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "group flex items-center px-4 py-4 rounded-xl transition-all duration-300 ease-out transform hover:scale-[1.02] relative overflow-hidden",
                  isActive
                    ? "bg-gradient-to-r from-white/25 to-white/15 text-white shadow-lg backdrop-blur-sm border border-white/30"
                    : "text-white/90 hover:bg-white/15 hover:text-white hover:shadow-md"
                )}
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              >
                {/* 活跃状态指示器 */}
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-yellow-400 to-orange-500 rounded-r-full" />
                )}
                
                {/* 图标容器 */}
                <div className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-lg mr-4 transition-all duration-300",
                  isActive
                    ? "bg-white/20 shadow-lg"
                    : "bg-white/5 group-hover:bg-white/15 group-hover:shadow-md"
                )}>
                  <Icon className={cn(
                    "h-5 w-5 transition-all duration-300",
                    isActive ? "text-white" : "text-white/80 group-hover:text-white group-hover:scale-110"
                  )} />
                </div>
                
                {/* 文本内容 */}
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    "font-semibold text-sm transition-colors duration-300",
                    isActive ? "text-white" : "text-white/90 group-hover:text-white"
                  )}>
                    {item.label}
                  </div>
                  <div className={cn(
                    "text-xs mt-0.5 transition-colors duration-300 leading-relaxed",
                    isActive ? "text-white/80" : "text-white/70 group-hover:text-white/90"
                  )}>
                    {item.description}
                  </div>
                </div>
                
                {/* 悬停效果 */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
            );
          })}
        </nav>
        
        {/* 底部装饰 */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#1e40af]/30 to-transparent pointer-events-none" />
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* 顶部导航栏 */}
        <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200/50">
          <div className="flex items-center justify-between h-16 pl-6 pr-6">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-lg mr-3 transition-all duration-200 -ml-2"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="flex items-center space-x-3 h-10">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white text-xs font-bold">SPC</span>
              </div>
              <div className="flex flex-col justify-center h-10">
                <h2 className="text-lg font-bold text-gray-900 tracking-wide leading-none">
                  {menuItems.find(item => item.path === location.pathname)?.label || '成纸质量管理系统'}
                </h2>
                <p className="text-xs text-gray-500 leading-none mt-0.5">
                  {menuItems.find(item => item.path === location.pathname)?.description || '统计过程控制系统'}
                </p>
              </div>
            </div>
            </div>
            
            <div className="flex items-center space-x-4 h-10">
              <div className="hidden sm:flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 h-full">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <div className="text-sm text-gray-700 font-medium">
                  质量工程师
                </div>
              </div>
              <div className="relative group">
                <div className="h-10 w-10 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105">
                  <span className="text-white text-sm font-bold">质</span>
                </div>
                <div className="absolute top-full right-0 mt-2 w-2 h-2 bg-green-400 rounded-full border-2 border-white shadow-sm"></div>
              </div>
            </div>
          </div>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 overflow-auto bg-gradient-to-br from-gray-50/50 to-white">
          <div className="pt-6 pb-6 pl-6 pr-6">
            {children}
          </div>
        </main>
      </div>

      {/* 移动端遮罩层 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-all duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;