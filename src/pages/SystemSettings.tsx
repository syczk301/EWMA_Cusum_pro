import React, { useState } from 'react';
import { User, Settings, Database, Shield, Bell, Palette, Globe, Save, Download, Upload, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

interface UserAccount {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'operator' | 'viewer';
  status: 'active' | 'inactive';
  lastLogin: string;
  createdAt: string;
}

const SystemSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'users' | 'notifications' | 'backup'>('general');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState('zh-CN');
  const [autoBackup, setAutoBackup] = useState(true);
  const [backupInterval, setBackupInterval] = useState('daily');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  
  // 模拟用户数据
  const [users, setUsers] = useState<UserAccount[]>([
    {
      id: '1',
      username: 'admin',
      email: 'admin@company.com',
      role: 'admin',
      status: 'active',
      lastLogin: '2024-06-15 14:30:25',
      createdAt: '2024-01-01 09:00:00'
    },
    {
      id: '2',
      username: 'operator1',
      email: 'operator1@company.com',
      role: 'operator',
      status: 'active',
      lastLogin: '2024-06-15 13:45:12',
      createdAt: '2024-02-15 10:30:00'
    },
    {
      id: '3',
      username: 'viewer1',
      email: 'viewer1@company.com',
      role: 'viewer',
      status: 'active',
      lastLogin: '2024-06-15 12:20:08',
      createdAt: '2024-03-01 14:15:00'
    },
    {
      id: '4',
      username: 'operator2',
      email: 'operator2@company.com',
      role: 'operator',
      status: 'inactive',
      lastLogin: '2024-06-10 16:30:00',
      createdAt: '2024-04-10 11:00:00'
    }
  ]);

  // 系统配置
  const [systemConfig, setSystemConfig] = useState({
    companyName: '造纸质检数据质量控制系统',
    systemVersion: 'v1.0.0',
    maxUsers: 50,
    sessionTimeout: 30,
    dataRetentionDays: 365,
    ewmaDefaultLambda: 0.2,
    cusumDefaultK: 0.5,
    cusumDefaultH: 5.0,
    controlLimitSigma: 3.0
  });

  // 获取角色显示名称
  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin': return '管理员';
      case 'operator': return '操作员';
      case 'viewer': return '查看者';
      default: return role;
    }
  };

  // 获取角色颜色
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-red-600 bg-red-100';
      case 'operator': return 'text-blue-600 bg-blue-100';
      case 'viewer': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // 保存系统配置
  const saveSystemConfig = () => {
    // 这里会调用API保存配置
    toast.success('系统配置已保存');
  };

  // 切换用户状态
  const toggleUserStatus = (userId: string) => {
    setUsers(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' }
        : user
    ));
    toast.success('用户状态已更新');
  };

  // 数据备份
  const performBackup = () => {
    toast.loading('正在备份数据...');
    
    // 模拟备份过程
    setTimeout(() => {
      toast.success('数据备份完成');
    }, 2000);
  };

  // 数据恢复
  const performRestore = () => {
    toast.loading('正在恢复数据...');
    
    // 模拟恢复过程
    setTimeout(() => {
      toast.success('数据恢复完成');
    }, 3000);
  };

  // 导出配置
  const exportConfig = () => {
    const configData = {
      systemConfig,
      users: users.map(u => ({ ...u, password: undefined })), // 不导出密码
      settings: {
        isDarkMode,
        language,
        autoBackup,
        backupInterval,
        emailNotifications,
        smsNotifications
      },
      exportTime: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system_config_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('配置导出成功！');
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">系统设置</h1>
            <p className="text-gray-600">用户管理、系统配置、数据备份</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={exportConfig}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              导出配置
            </button>
            
            <button
              onClick={saveSystemConfig}
              className="flex items-center px-4 py-2 bg-[#1f4e79] text-white rounded-lg hover:bg-[#1a4066] transition-colors"
            >
              <Save className="h-4 w-4 mr-2" />
              保存设置
            </button>
          </div>
        </div>
      </div>

      {/* 标签页导航 */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { key: 'general', label: '常规设置', icon: Settings },
              { key: 'users', label: '用户管理', icon: User },
              { key: 'notifications', label: '通知设置', icon: Bell },
              { key: 'backup', label: '数据备份', icon: Database }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={cn(
                  "flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                  activeTab === key
                    ? "border-[#5b9bd5] text-[#5b9bd5]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                )}
              >
                <Icon className="h-4 w-4 mr-2" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* 常规设置 */}
        {activeTab === 'general' && (
          <div className="p-6 space-y-8">
            {/* 系统信息 */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">系统信息</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">公司名称</label>
                  <input
                    type="text"
                    value={systemConfig.companyName}
                    onChange={(e) => setSystemConfig(prev => ({ ...prev, companyName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5b9bd5] focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">系统版本</label>
                  <input
                    type="text"
                    value={systemConfig.systemVersion}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">最大用户数</label>
                  <input
                    type="number"
                    value={systemConfig.maxUsers}
                    onChange={(e) => setSystemConfig(prev => ({ ...prev, maxUsers: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5b9bd5] focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">会话超时 (分钟)</label>
                  <input
                    type="number"
                    value={systemConfig.sessionTimeout}
                    onChange={(e) => setSystemConfig(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5b9bd5] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* 界面设置 */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">界面设置</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">语言</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5b9bd5] focus:border-transparent"
                  >
                    <option value="zh-CN">简体中文</option>
                    <option value="en-US">English</option>
                    <option value="ja-JP">日本語</option>
                  </select>
                </div>
                
                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={isDarkMode}
                      onChange={(e) => setIsDarkMode(e.target.checked)}
                      className="h-4 w-4 text-[#5b9bd5] focus:ring-[#5b9bd5] border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">深色模式</span>
                  </label>
                </div>
              </div>
            </div>

            {/* 数据设置 */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">数据设置</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">数据保留天数</label>
                  <input
                    type="number"
                    value={systemConfig.dataRetentionDays}
                    onChange={(e) => setSystemConfig(prev => ({ ...prev, dataRetentionDays: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5b9bd5] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* 控制图默认参数 */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">控制图默认参数</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">EWMA λ 值</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="1.0"
                    value={systemConfig.ewmaDefaultLambda}
                    onChange={(e) => setSystemConfig(prev => ({ ...prev, ewmaDefaultLambda: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5b9bd5] focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CUSUM K 值</label>
                  <input
                    type="number"
                    step="0.1"
                    value={systemConfig.cusumDefaultK}
                    onChange={(e) => setSystemConfig(prev => ({ ...prev, cusumDefaultK: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5b9bd5] focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CUSUM H 值</label>
                  <input
                    type="number"
                    step="0.1"
                    value={systemConfig.cusumDefaultH}
                    onChange={(e) => setSystemConfig(prev => ({ ...prev, cusumDefaultH: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5b9bd5] focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">控制限 σ 倍数</label>
                  <input
                    type="number"
                    step="0.1"
                    value={systemConfig.controlLimitSigma}
                    onChange={(e) => setSystemConfig(prev => ({ ...prev, controlLimitSigma: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5b9bd5] focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 用户管理 */}
        {activeTab === 'users' && (
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">用户账户管理</h2>
              <button className="flex items-center px-4 py-2 bg-[#1f4e79] text-white rounded-lg hover:bg-[#1a4066] transition-colors">
                <User className="h-4 w-4 mr-2" />
                新增用户
              </button>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户名</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">邮箱</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">角色</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">最后登录</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                            <User className="h-4 w-4 text-gray-600" />
                          </div>
                          <div className="text-sm font-medium text-gray-900">{user.username}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          getRoleColor(user.role)
                        )}>
                          {getRoleName(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleUserStatus(user.id)}
                          className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium cursor-pointer",
                            getStatusColor(user.status)
                          )}
                        >
                          {user.status === 'active' ? '活跃' : '禁用'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.lastLogin}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.createdAt}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">编辑</button>
                          <button className="text-red-600 hover:text-red-900">删除</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">角色权限说明</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>管理员</strong>：拥有所有功能权限，包括用户管理和系统设置</li>
                <li>• <strong>操作员</strong>：可以查看和操作控制图，管理数据和报警</li>
                <li>• <strong>查看者</strong>：只能查看控制图和报告，无法修改数据</li>
              </ul>
            </div>
          </div>
        )}

        {/* 通知设置 */}
        {activeTab === 'notifications' && (
          <div className="p-6 space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">通知方式</h2>
              <div className="space-y-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="h-4 w-4 text-[#5b9bd5] focus:ring-[#5b9bd5] border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">邮件通知</span>
                </label>
                
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={smsNotifications}
                    onChange={(e) => setSmsNotifications(e.target.checked)}
                    className="h-4 w-4 text-[#5b9bd5] focus:ring-[#5b9bd5] border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">短信通知</span>
                </label>
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">邮件服务器设置</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SMTP服务器</label>
                  <input
                    type="text"
                    placeholder="smtp.company.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5b9bd5] focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">端口</label>
                  <input
                    type="number"
                    placeholder="587"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5b9bd5] focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">用户名</label>
                  <input
                    type="text"
                    placeholder="noreply@company.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5b9bd5] focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">密码</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5b9bd5] focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">通知规则</h2>
              <div className="space-y-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">高优先级报警</span>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="h-4 w-4 text-[#5b9bd5] focus:ring-[#5b9bd5] border-gray-300 rounded" />
                      <span className="text-sm text-gray-700">启用</span>
                    </label>
                  </div>
                  <p className="text-sm text-gray-600">立即发送邮件和短信通知</p>
                </div>
                
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">中优先级报警</span>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="h-4 w-4 text-[#5b9bd5] focus:ring-[#5b9bd5] border-gray-300 rounded" />
                      <span className="text-sm text-gray-700">启用</span>
                    </label>
                  </div>
                  <p className="text-sm text-gray-600">发送邮件通知，延迟5分钟发送短信</p>
                </div>
                
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">低优先级报警</span>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="h-4 w-4 text-[#5b9bd5] focus:ring-[#5b9bd5] border-gray-300 rounded" />
                      <span className="text-sm text-gray-700">启用</span>
                    </label>
                  </div>
                  <p className="text-sm text-gray-600">仅发送邮件通知</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 数据备份 */}
        {activeTab === 'backup' && (
          <div className="p-6 space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">自动备份设置</h2>
              <div className="space-y-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={autoBackup}
                    onChange={(e) => setAutoBackup(e.target.checked)}
                    className="h-4 w-4 text-[#5b9bd5] focus:ring-[#5b9bd5] border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">启用自动备份</span>
                </label>
                
                <div className="ml-7">
                  <label className="block text-sm font-medium text-gray-700 mb-2">备份频率</label>
                  <select
                    value={backupInterval}
                    onChange={(e) => setBackupInterval(e.target.value)}
                    disabled={!autoBackup}
                    className="w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5b9bd5] focus:border-transparent disabled:bg-gray-100"
                  >
                    <option value="hourly">每小时</option>
                    <option value="daily">每天</option>
                    <option value="weekly">每周</option>
                    <option value="monthly">每月</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">手动备份</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 border border-gray-200 rounded-lg">
                  <div className="flex items-center mb-4">
                    <Database className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                      <h3 className="font-medium text-gray-900">数据备份</h3>
                      <p className="text-sm text-gray-600">备份所有系统数据</p>
                    </div>
                  </div>
                  <button
                    onClick={performBackup}
                    className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    立即备份
                  </button>
                </div>
                
                <div className="p-6 border border-gray-200 rounded-lg">
                  <div className="flex items-center mb-4">
                    <RefreshCw className="h-8 w-8 text-green-600 mr-3" />
                    <div>
                      <h3 className="font-medium text-gray-900">数据恢复</h3>
                      <p className="text-sm text-gray-600">从备份文件恢复数据</p>
                    </div>
                  </div>
                  <button
                    onClick={performRestore}
                    className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    恢复数据
                  </button>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">备份历史</h2>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">备份时间</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">大小</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2024-06-15 14:30:00</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">自动备份</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">125.6 MB</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600">成功</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-3">下载</button>
                        <button className="text-red-600 hover:text-red-900">删除</button>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2024-06-14 14:30:00</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">手动备份</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">118.2 MB</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600">成功</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-3">下载</button>
                        <button className="text-red-600 hover:text-red-900">删除</button>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2024-06-13 14:30:00</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">自动备份</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">112.8 MB</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600">成功</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-3">下载</button>
                        <button className="text-red-600 hover:text-red-900">删除</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemSettings;