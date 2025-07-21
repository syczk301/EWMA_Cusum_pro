import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FileText, Download, Calculator, TrendingUp, Target, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

interface QualityData {
  period: string;
  mean: number;
  stdDev: number;
  cp: number;
  cpk: number;
  defectRate: number;
  sampleSize: number;
}

interface CapabilityIndex {
  cp: number;
  cpk: number;
  pp: number;
  ppk: number;
  interpretation: string;
  level: 'excellent' | 'good' | 'fair' | 'poor';
}

const QualityAnalysis: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [analysisType, setAnalysisType] = useState('capability');
  const [reportFormat, setReportFormat] = useState('pdf');

  // 模拟质量数据
  const qualityData: QualityData[] = useMemo(() => [
    {
      period: '2024-01',
      mean: 99.8,
      stdDev: 2.1,
      cp: 1.59,
      cpk: 1.42,
      defectRate: 0.8,
      sampleSize: 150
    },
    {
      period: '2024-02',
      mean: 100.2,
      stdDev: 1.9,
      cp: 1.75,
      cpk: 1.58,
      defectRate: 0.6,
      sampleSize: 145
    },
    {
      period: '2024-03',
      mean: 99.9,
      stdDev: 2.3,
      cp: 1.45,
      cpk: 1.38,
      defectRate: 1.2,
      sampleSize: 160
    },
    {
      period: '2024-04',
      mean: 100.1,
      stdDev: 1.8,
      cp: 1.85,
      cpk: 1.72,
      defectRate: 0.4,
      sampleSize: 155
    },
    {
      period: '2024-05',
      mean: 100.0,
      stdDev: 2.0,
      cp: 1.67,
      cpk: 1.67,
      defectRate: 0.5,
      sampleSize: 148
    },
    {
      period: '2024-06',
      mean: 99.7,
      stdDev: 2.2,
      cp: 1.52,
      cpk: 1.35,
      defectRate: 0.9,
      sampleSize: 152
    }
  ], []);

  // 计算过程能力指数
  const capabilityAnalysis = useMemo((): CapabilityIndex => {
    const currentData = qualityData[qualityData.length - 1];
    const USL = 110; // 上规格限
    const LSL = 90;  // 下规格限
    const target = 100; // 目标值
    
    const cp = (USL - LSL) / (6 * currentData.stdDev);
    const cpk = Math.min(
      (USL - currentData.mean) / (3 * currentData.stdDev),
      (currentData.mean - LSL) / (3 * currentData.stdDev)
    );
    
    // 计算长期能力指数 (假设长期标准差为短期的1.5倍)
    const longTermStdDev = currentData.stdDev * 1.5;
    const pp = (USL - LSL) / (6 * longTermStdDev);
    const ppk = Math.min(
      (USL - currentData.mean) / (3 * longTermStdDev),
      (currentData.mean - LSL) / (3 * longTermStdDev)
    );
    
    let interpretation = '';
    let level: 'excellent' | 'good' | 'fair' | 'poor' = 'poor';
    
    if (cpk >= 2.0) {
      interpretation = '过程能力优秀，质量水平很高';
      level = 'excellent';
    } else if (cpk >= 1.33) {
      interpretation = '过程能力良好，质量水平较高';
      level = 'good';
    } else if (cpk >= 1.0) {
      interpretation = '过程能力一般，需要改进';
      level = 'fair';
    } else {
      interpretation = '过程能力不足，急需改进';
      level = 'poor';
    }
    
    return { cp, cpk, pp, ppk, interpretation, level };
  }, [qualityData]);

  // 趋势分析数据
  const trendData = useMemo(() => {
    return qualityData.map(data => ({
      period: data.period,
      cp: data.cp,
      cpk: data.cpk,
      defectRate: data.defectRate,
      mean: data.mean
    }));
  }, [qualityData]);

  // 缺陷分布数据
  const defectDistribution = useMemo(() => [
    { name: '尺寸偏差', value: 35, color: '#ef4444' },
    { name: '表面缺陷', value: 25, color: '#f59e0b' },
    { name: '强度不足', value: 20, color: '#eab308' },
    { name: '颜色偏差', value: 12, color: '#22c55e' },
    { name: '其他', value: 8, color: '#6b7280' }
  ], []);

  // 生成报告
  const generateReport = () => {
    const reportData = {
      period: selectedPeriod,
      capability: capabilityAnalysis,
      trends: trendData,
      defects: defectDistribution,
      timestamp: new Date().toISOString()
    };
    
    // 模拟报告生成
    toast.success(`正在生成${reportFormat.toUpperCase()}格式报告...`);
    
    // 实际应用中这里会调用后端API生成报告
    setTimeout(() => {
      toast.success('质量分析报告生成完成！');
    }, 2000);
  };

  // 导出数据
  const exportData = () => {
    const dataToExport = {
      qualityData,
      capabilityAnalysis,
      trendData,
      defectDistribution
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quality_analysis_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('数据导出成功！');
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">质量分析</h1>
            <p className="text-gray-600">综合分析报告、统计指标计算、质量评估</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={analysisType}
              onChange={(e) => setAnalysisType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5b9bd5] focus:border-transparent"
            >
              <option value="capability">过程能力分析</option>
              <option value="trend">趋势分析</option>
              <option value="defect">缺陷分析</option>
              <option value="comparison">对比分析</option>
            </select>
            
            <button
              onClick={exportData}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              导出数据
            </button>
          </div>
        </div>
      </div>

      {/* 关键指标概览 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <Calculator className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{capabilityAnalysis.cp.toFixed(3)}</div>
              <div className="text-sm text-gray-600">过程能力指数 Cp</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <Target className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{capabilityAnalysis.cpk.toFixed(3)}</div>
              <div className="text-sm text-gray-600">过程能力指数 Cpk</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{qualityData[qualityData.length - 1].defectRate}%</div>
              <div className="text-sm text-gray-600">缺陷率</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center mr-3",
              capabilityAnalysis.level === 'excellent' ? 'bg-green-100' :
              capabilityAnalysis.level === 'good' ? 'bg-blue-100' :
              capabilityAnalysis.level === 'fair' ? 'bg-yellow-100' : 'bg-red-100'
            )}>
              <span className={cn(
                "font-bold text-sm",
                capabilityAnalysis.level === 'excellent' ? 'text-green-600' :
                capabilityAnalysis.level === 'good' ? 'text-blue-600' :
                capabilityAnalysis.level === 'fair' ? 'text-yellow-600' : 'text-red-600'
              )}>
                {capabilityAnalysis.level === 'excellent' ? '优' :
                 capabilityAnalysis.level === 'good' ? '良' :
                 capabilityAnalysis.level === 'fair' ? '中' : '差'}
              </span>
            </div>
            <div>
              <div className={cn(
                "text-2xl font-bold",
                capabilityAnalysis.level === 'excellent' ? 'text-green-600' :
                capabilityAnalysis.level === 'good' ? 'text-blue-600' :
                capabilityAnalysis.level === 'fair' ? 'text-yellow-600' : 'text-red-600'
              )}>
                {capabilityAnalysis.level === 'excellent' ? '优秀' :
                 capabilityAnalysis.level === 'good' ? '良好' :
                 capabilityAnalysis.level === 'fair' ? '一般' : '不足'}
              </div>
              <div className="text-sm text-gray-600">质量等级</div>
            </div>
          </div>
        </div>
      </div>

      {/* 过程能力分析 */}
      {analysisType === 'capability' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">过程能力指数</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="font-medium text-blue-900">Cp (过程能力)</span>
                <span className="text-xl font-bold text-blue-600">{capabilityAnalysis.cp.toFixed(3)}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="font-medium text-green-900">Cpk (过程能力指数)</span>
                <span className="text-xl font-bold text-green-600">{capabilityAnalysis.cpk.toFixed(3)}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="font-medium text-purple-900">Pp (过程性能)</span>
                <span className="text-xl font-bold text-purple-600">{capabilityAnalysis.pp.toFixed(3)}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <span className="font-medium text-orange-900">Ppk (过程性能指数)</span>
                <span className="text-xl font-bold text-orange-600">{capabilityAnalysis.ppk.toFixed(3)}</span>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">评估结果</h3>
              <p className="text-gray-700">{capabilityAnalysis.interpretation}</p>
              
              <div className="mt-3 text-sm text-gray-600">
                <p>• Cp ≥ 1.33：过程能力充足</p>
                <p>• Cpk ≥ 1.33：过程稳定且居中</p>
                <p>• Cpk/Cp 比值接近1：过程居中性好</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">能力指数趋势</h2>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="period" stroke="#666" fontSize={12} />
                  <YAxis stroke="#666" fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="cp"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    name="Cp"
                  />
                  <Line
                    type="monotone"
                    dataKey="cpk"
                    stroke="#22c55e"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    name="Cpk"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* 趋势分析 */}
      {analysisType === 'trend' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">质量趋势分析</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-3">缺陷率趋势</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="period" stroke="#666" fontSize={12} />
                    <YAxis stroke="#666" fontSize={12} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="defectRate"
                      stroke="#ef4444"
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#ef4444' }}
                      name="缺陷率 (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-3">均值趋势</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="period" stroke="#666" fontSize={12} />
                    <YAxis stroke="#666" fontSize={12} domain={['dataMin - 1', 'dataMax + 1']} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="mean"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#8b5cf6' }}
                      name="均值"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 缺陷分析 */}
      {analysisType === 'defect' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">缺陷类型分布</h2>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={defectDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {defectDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">缺陷统计</h2>
            
            <div className="space-y-3">
              {defectDistribution.map((defect, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded-full mr-3"
                      style={{ backgroundColor: defect.color }}
                    />
                    <span className="font-medium text-gray-900">{defect.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">{defect.value}%</div>
                    <div className="text-sm text-gray-500">占比</div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-900">改进建议</h3>
                  <ul className="text-sm text-yellow-800 mt-1 space-y-1">
                    <li>• 重点关注尺寸偏差问题，检查设备精度</li>
                    <li>• 加强表面质量控制，优化工艺参数</li>
                    <li>• 定期校准测量设备，提高检测准确性</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 对比分析 */}
      {analysisType === 'comparison' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">月度对比分析</h2>
          
          <div className="h-80 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={qualityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="period" stroke="#666" fontSize={12} />
                <YAxis stroke="#666" fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="cp" fill="#3b82f6" name="Cp" />
                <Bar dataKey="cpk" fill="#22c55e" name="Cpk" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">月份</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">均值</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">标准差</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cpk</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">缺陷率</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">样本量</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {qualityData.map((data, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{data.period}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{data.mean.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{data.stdDev.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{data.cp.toFixed(3)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{data.cpk.toFixed(3)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{data.defectRate}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{data.sampleSize}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 报告生成 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">报告生成</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">分析周期</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5b9bd5] focus:border-transparent"
            >
              <option value="current">当前月份</option>
              <option value="quarter">本季度</option>
              <option value="year">本年度</option>
              <option value="custom">自定义</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">报告格式</label>
            <select
              value={reportFormat}
              onChange={(e) => setReportFormat(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5b9bd5] focus:border-transparent"
            >
              <option value="pdf">PDF报告</option>
              <option value="excel">Excel报告</option>
              <option value="word">Word报告</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={generateReport}
              className="w-full flex items-center justify-center px-4 py-2 bg-[#1f4e79] text-white rounded-lg hover:bg-[#1a4066] transition-colors"
            >
              <FileText className="h-4 w-4 mr-2" />
              生成报告
            </button>
          </div>
        </div>
        
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">报告内容包括</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 过程能力分析（Cp、Cpk、Pp、Ppk）</li>
            <li>• 质量趋势分析和预测</li>
            <li>• 缺陷分析和改进建议</li>
            <li>• 统计控制图和异常点分析</li>
            <li>• 质量成本分析和效益评估</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default QualityAnalysis;