import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Bell, AlertTriangle, CheckCircle, Settings, Plus, Edit, Trash2, Eye, Filter, Download } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

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

const AlarmManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'rules' | 'monitor' | 'history'>('monitor');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<AlarmRule | null>(null);

  // 模拟报警规则数据
  const [alarmRules, setAlarmRules] = useState<AlarmRule[]>([
    {
      id: '1',
      name: 'EWMA超出控制限',
      type: 'ewma',
      parameter: 'EWMA值',
      condition: '超出控制限',
      threshold: 3.0,
      priority: 'high',
      enabled: true,
      description: '当EWMA值超出±3σ控制限时触发报警'
    },
    {
      id: '2',
      name: 'CUSUM检测到偏移',
      type: 'cusum',
      parameter: 'CUSUM值',
      condition: '超出决策限',
      threshold: 5.0,
      priority: 'high',
      enabled: true,
      description: '当CUSUM值超出决策限H时触发报警'
    },
    {
      id: '3',
      name: '质量指标异常',
      type: 'threshold',
      parameter: '质量值',
      condition: '超出规格限',
      threshold: 110.0,
      priority: 'medium',
      enabled: true,
      description: '当质量值超出规格限时触发报警'
    },
    {
      id: '4',
      name: '连续下降趋势',
      type: 'trend',
      parameter: '趋势斜率',
      condition: '连续下降',
      threshold: -2.0,
      priority: 'medium',
      enabled: false,
      description: '检测到连续下降趋势时触发报警'
    }
  ]);

  // 模拟报警记录数据
  const alarmRecords: AlarmRecord[] = useMemo(() => [
    {
      id: '1',
      ruleId: '1',
      ruleName: 'EWMA超出控制限',
      type: 'ewma',
      priority: 'high',
      status: 'active',
      value: 103.2,
      threshold: 3.0,
      timestamp: '2024-06-15 14:30:25',
      description: 'EWMA值103.2超出上控制限'
    },
    {
      id: '2',
      ruleId: '2',
      ruleName: 'CUSUM检测到偏移',
      type: 'cusum',
      priority: 'high',
      status: 'acknowledged',
      value: 5.8,
      threshold: 5.0,
      timestamp: '2024-06-15 13:45:12',
      description: 'CUSUM值5.8超出决策限',
      acknowledgedBy: '张工程师',
      acknowledgedAt: '2024-06-15 14:00:00'
    },
    {
      id: '3',
      ruleId: '3',
      ruleName: '质量指标异常',
      type: 'threshold',
      priority: 'medium',
      status: 'resolved',
      value: 112.5,
      threshold: 110.0,
      timestamp: '2024-06-15 12:20:08',
      description: '质量值112.5超出上规格限',
      acknowledgedBy: '李主管',
      acknowledgedAt: '2024-06-15 12:30:00',
      resolvedAt: '2024-06-15 13:15:00'
    },
    {
      id: '4',
      ruleId: '1',
      ruleName: 'EWMA超出控制限',
      type: 'ewma',
      priority: 'high',
      status: 'resolved',
      value: 96.8,
      threshold: 3.0,
      timestamp: '2024-06-15 11:15:33',
      description: 'EWMA值96.8超出下控制限',
      acknowledgedBy: '王技术员',
      acknowledgedAt: '2024-06-15 11:30:00',
      resolvedAt: '2024-06-15 12:00:00'
    },
    {
      id: '5',
      ruleId: '3',
      ruleName: '质量指标异常',
      type: 'threshold',
      priority: 'medium',
      status: 'acknowledged',
      value: 88.2,
      threshold: 90.0,
      timestamp: '2024-06-15 10:45:17',
      description: '质量值88.2低于下规格限',
      acknowledgedBy: '陈操作员',
      acknowledgedAt: '2024-06-15 11:00:00'
    }
  ], []);

  // 过滤后的报警记录
  const filteredRecords = useMemo(() => {
    return alarmRecords.filter(record => {
      const priorityMatch = selectedPriority === 'all' || record.priority === selectedPriority;
      const statusMatch = selectedStatus === 'all' || record.status === selectedStatus;
      return priorityMatch && statusMatch;
    });
  }, [alarmRecords, selectedPriority, selectedStatus]);

  // 报警统计数据
  const alarmStats = useMemo(() => {
    const total = alarmRecords.length;
    const active = alarmRecords.filter(r => r.status === 'active').length;
    const acknowledged = alarmRecords.filter(r => r.status === 'acknowledged').length;
    const resolved = alarmRecords.filter(r => r.status === 'resolved').length;
    const high = alarmRecords.filter(r => r.priority === 'high').length;
    const medium = alarmRecords.filter(r => r.priority === 'medium').length;
    const low = alarmRecords.filter(r => r.priority === 'low').length;
    
    return { total, active, acknowledged, resolved, high, medium, low };
  }, [alarmRecords]);

  // 报警趋势数据
  const alarmTrendData = useMemo(() => [
    { time: '10:00', active: 2, acknowledged: 1, resolved: 0 },
    { time: '11:00', active: 3, acknowledged: 2, resolved: 1 },
    { time: '12:00', active: 1, acknowledged: 3, resolved: 2 },
    { time: '13:00', active: 2, acknowledged: 1, resolved: 3 },
    { time: '14:00', active: 1, acknowledged: 2, resolved: 1 },
    { time: '15:00', active: 1, acknowledged: 1, resolved: 2 }
  ], []);

  // 获取优先级颜色
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-red-600 bg-red-100';
      case 'acknowledged': return 'text-yellow-600 bg-yellow-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // 确认报警
  const acknowledgeAlarm = (alarmId: string) => {
    toast.success(`报警 ${alarmId} 已确认`);
  };

  // 解决报警
  const resolveAlarm = (alarmId: string) => {
    toast.success(`报警 ${alarmId} 已解决`);
  };

  // 切换规则状态
  const toggleRule = (ruleId: string) => {
    setAlarmRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ));
    toast.success('规则状态已更新');
  };

  // 删除规则
  const deleteRule = (ruleId: string) => {
    setAlarmRules(prev => prev.filter(rule => rule.id !== ruleId));
    toast.success('规则已删除');
  };

  // 导出报警数据
  const exportAlarms = () => {
    const dataToExport = {
      rules: alarmRules,
      records: filteredRecords,
      stats: alarmStats,
      exportTime: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alarm_data_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('报警数据导出成功！');
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">报警管理</h1>
            <p className="text-gray-600">实时监控、报警规则配置、历史记录查询</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={exportAlarms}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              导出数据
            </button>
          </div>
        </div>
      </div>

      {/* 标签页导航 */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { key: 'monitor', label: '实时监控', icon: Bell },
              { key: 'rules', label: '报警规则', icon: Settings },
              { key: 'history', label: '历史记录', icon: Eye }
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

        {/* 实时监控 */}
        {activeTab === 'monitor' && (
          <div className="p-6 space-y-6">
            {/* 统计概览 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-red-50 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
                  <div>
                    <div className="text-2xl font-bold text-red-600">{alarmStats.active}</div>
                    <div className="text-sm text-red-700">活跃报警</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Bell className="h-8 w-8 text-yellow-600 mr-3" />
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">{alarmStats.acknowledged}</div>
                    <div className="text-sm text-yellow-700">已确认</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <div className="text-2xl font-bold text-green-600">{alarmStats.resolved}</div>
                    <div className="text-sm text-green-700">已解决</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Settings className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{alarmStats.total}</div>
                    <div className="text-sm text-blue-700">总计</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 报警趋势图 */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">报警趋势</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={alarmTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="time" stroke="#666" fontSize={12} />
                    <YAxis stroke="#666" fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="active" fill="#ef4444" name="活跃" />
                    <Bar dataKey="acknowledged" fill="#f59e0b" name="已确认" />
                    <Bar dataKey="resolved" fill="#22c55e" name="已解决" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 当前活跃报警 */}
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">当前活跃报警</h2>
              </div>
              
              <div className="divide-y divide-gray-200">
                {alarmRecords.filter(r => r.status === 'active').map((alarm) => (
                  <div key={alarm.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            getPriorityColor(alarm.priority)
                          )}>
                            {alarm.priority === 'high' ? '高' : alarm.priority === 'medium' ? '中' : '低'}
                          </span>
                          <span className="text-sm text-gray-500">{alarm.timestamp}</span>
                        </div>
                        
                        <h3 className="text-lg font-medium text-gray-900 mb-1">{alarm.ruleName}</h3>
                        <p className="text-gray-600 mb-2">{alarm.description}</p>
                        
                        <div className="text-sm text-gray-500">
                          当前值: <span className="font-medium">{alarm.value}</span> | 
                          阈值: <span className="font-medium">{alarm.threshold}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => acknowledgeAlarm(alarm.id)}
                          className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
                        >
                          确认
                        </button>
                        <button
                          onClick={() => resolveAlarm(alarm.id)}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                        >
                          解决
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {alarmRecords.filter(r => r.status === 'active').length === 0 && (
                  <div className="p-6 text-center text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                    <p>当前没有活跃报警</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 报警规则 */}
        {activeTab === 'rules' && (
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">报警规则配置</h2>
              <button
                onClick={() => setShowRuleModal(true)}
                className="flex items-center px-4 py-2 bg-[#1f4e79] text-white rounded-lg hover:bg-[#1a4066] transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                新增规则
              </button>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">规则名称</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">参数</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">阈值</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">优先级</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {alarmRules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{rule.name}</div>
                          <div className="text-sm text-gray-500">{rule.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {rule.type.toUpperCase()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {rule.parameter}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {rule.threshold}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          getPriorityColor(rule.priority)
                        )}>
                          {rule.priority === 'high' ? '高' : rule.priority === 'medium' ? '中' : '低'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleRule(rule.id)}
                          className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            rule.enabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                          )}
                        >
                          {rule.enabled ? '启用' : '禁用'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setEditingRule(rule);
                              setShowRuleModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteRule(rule.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 历史记录 */}
        {activeTab === 'history' && (
          <div className="p-6 space-y-6">
            {/* 过滤器 */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">过滤:</span>
              </div>
              
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5b9bd5] focus:border-transparent"
              >
                <option value="all">所有优先级</option>
                <option value="high">高优先级</option>
                <option value="medium">中优先级</option>
                <option value="low">低优先级</option>
              </select>
              
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5b9bd5] focus:border-transparent"
              >
                <option value="all">所有状态</option>
                <option value="active">活跃</option>
                <option value="acknowledged">已确认</option>
                <option value="resolved">已解决</option>
              </select>
            </div>
            
            {/* 历史记录表格 */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">规则名称</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">优先级</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">值/阈值</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">描述</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.timestamp}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {record.ruleName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.type.toUpperCase()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          getPriorityColor(record.priority)
                        )}>
                          {record.priority === 'high' ? '高' : record.priority === 'medium' ? '中' : '低'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          getStatusColor(record.status)
                        )}>
                          {record.status === 'active' ? '活跃' : 
                           record.status === 'acknowledged' ? '已确认' : '已解决'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.value} / {record.threshold}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {record.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredRecords.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  <p>没有找到符合条件的报警记录</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlarmManagement;