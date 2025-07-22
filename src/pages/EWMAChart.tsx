import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts';
import { Settings, AlertTriangle, TrendingUp, Download, BarChart3, Target, Activity, Zap, Award } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { useDataStore, Variable } from '../store/dataStore';
import { extractDataForVariable } from '../utils/dataUtils';

interface DataPoint {
  index: number;
  value: number;
  ewma: number;
  ucl: number;
  lcl: number;
  centerLine: number;
  isOutOfControl: boolean;
  violationRules: string[];
  sigmaLevel: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

interface EWMAParams {
  lambda: number;
  target: number;
  sigma: number;
  L: number; // 控制限系数
  subgroupSize: number;
  confidenceLevel: number;
}

interface ProcessCapability {
  cp: number;
  cpk: number;
  pp: number;
  ppk: number;
  sigma: number;
}

interface ControlRules {
  rule1: boolean; // 单点超出控制限
  rule2: boolean; // 连续9点在中心线同一侧
  rule3: boolean; // 连续6点递增或递减
  rule4: boolean; // 连续14点交替上下
  rule5: boolean; // 连续2/3点在2σ区域
  rule6: boolean; // 连续4/5点在1σ区域
  rule7: boolean; // 连续15点在1σ区域内
  rule8: boolean; // 连续8点在1σ区域外
}

const EWMAChart: React.FC = () => {
  const { availableVariables, selectedVariable, setSelectedVariable, rawData: storeRawData, uploadedFile: storeUploadedFile } = useDataStore();
  
  const [params, setParams] = useState<EWMAParams>({
    lambda: 0.2,
    target: 100,
    sigma: 5,
    L: 3,
    subgroupSize: 1,
    confidenceLevel: 99.7
  });
  
  const [rawData, setRawData] = useState<number[]>([]);
  const [showParams, setShowParams] = useState(false);
  const [autoDetect, setAutoDetect] = useState(true);
  const [showVariableSelector, setShowVariableSelector] = useState(false);
  const [useRealData, setUseRealData] = useState(false);
  const [showCapabilityAnalysis, setShowCapabilityAnalysis] = useState(false);
  const [showControlRules, setShowControlRules] = useState(false);

  // 处理变量选择
  const handleVariableChange = async (variable: Variable) => {
    // 防止重复选择同一个变量
    if (selectedVariable?.id === variable.id) {
      setShowVariableSelector(false);
      return;
    }
    
    setSelectedVariable(variable);
    setShowVariableSelector(false);
    
    // 如果有上传的文件，加载对应变量的数据
    if (storeUploadedFile && 'columnIndex' in variable) {
      try {
        const dataPoints = await extractDataForVariable(storeUploadedFile, (variable as any).columnIndex);
        const values = dataPoints.map(point => point.value);
        setRawData(values);
        setUseRealData(true);
        
        // 自动设置参数
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        
        setParams(prev => ({
          ...prev,
          target: parseFloat(mean.toFixed(2)),
          sigma: parseFloat(stdDev.toFixed(2))
        }));
        
        toast.success(`已选择变量: ${variable.name}，加载了 ${values.length} 个数据点`);
      } catch (error) {
        toast.error('加载变量数据失败');
        console.error(error);
      }
    } else if (storeRawData.length > 0) {
      // 使用存储的数据
      const values = storeRawData.map(point => point.value);
      setRawData(values);
      setUseRealData(true);
      toast.success(`已选择变量: ${variable.name}`);
    } else {
      toast.success(`已选择变量: ${variable.name}`);
    }
  };

  // 监听数据存储变化和变量选择
  useEffect(() => {
    const loadDataForSelectedVariable = async () => {
      if (selectedVariable && storeUploadedFile && 'columnIndex' in selectedVariable) {
        try {
          const dataPoints = await extractDataForVariable(storeUploadedFile, (selectedVariable as any).columnIndex);
          const values = dataPoints.map(point => point.value);
          setRawData(values);
          setUseRealData(true);
          
          // 自动设置参数
          const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
          const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
          const stdDev = Math.sqrt(variance);
          
          setParams(prev => ({
            ...prev,
            target: parseFloat(mean.toFixed(2)),
            sigma: parseFloat(stdDev.toFixed(2))
          }));
        } catch (error) {
          console.error('加载变量数据失败:', error);
        }
      }
      // 移除自动使用storeRawData的逻辑，避免自动选择变量
    };
    
    loadDataForSelectedVariable();
  }, [selectedVariable, storeUploadedFile]); // 移除storeRawData和useRealData依赖
  
  // 生成模拟数据作为后备
  useEffect(() => {
    if (!useRealData && rawData.length === 0 && !storeUploadedFile) {
      const generateData = () => {
        const data: number[] = [];
        for (let i = 0; i < 50; i++) {
          // 生成正态分布的随机数据
          const random = (Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() - 3) / 3;
          let value = params.target + random * params.sigma;
          
          // 在某些点添加异常值
          if (i === 20 || i === 35) {
            value += params.sigma * 2;
          }
          
          data.push(value);
        }
        return data;
      };
      
      setRawData(generateData());
    }
  }, [params.target, params.sigma, useRealData, rawData.length, storeUploadedFile]);

  // 控制图规则检测函数
  const checkControlRules = (data: DataPoint[], index: number): string[] => {
    const violations: string[] = [];
    const point = data[index];
    
    // 规则1: 单点超出控制限
    if (point.ewma > point.ucl || point.ewma < point.lcl) {
      violations.push('规则1: 单点超出控制限');
    }
    
    // 规则2: 连续9点在中心线同一侧
    if (index >= 8) {
      const last9 = data.slice(index - 8, index + 1);
      const allAbove = last9.every(p => p.ewma > p.centerLine);
      const allBelow = last9.every(p => p.ewma < p.centerLine);
      if (allAbove || allBelow) {
        violations.push('规则2: 连续9点在中心线同一侧');
      }
    }
    
    // 规则3: 连续6点递增或递减
    if (index >= 5) {
      const last6 = data.slice(index - 5, index + 1);
      const increasing = last6.every((p, i) => i === 0 || p.ewma > last6[i - 1].ewma);
      const decreasing = last6.every((p, i) => i === 0 || p.ewma < last6[i - 1].ewma);
      if (increasing || decreasing) {
        violations.push('规则3: 连续6点递增或递减');
      }
    }
    
    // 规则5: 连续2/3点在2σ区域
    if (index >= 2) {
      const last3 = data.slice(index - 2, index + 1);
      const sigma2Upper = point.centerLine + 2 * params.sigma;
      const sigma2Lower = point.centerLine - 2 * params.sigma;
      const in2Sigma = last3.filter(p => 
        (p.ewma > sigma2Upper && p.ewma < p.ucl) || 
        (p.ewma < sigma2Lower && p.ewma > p.lcl)
      );
      if (in2Sigma.length >= 2) {
        violations.push('规则5: 连续2/3点在2σ区域');
      }
    }
    
    return violations;
  };
  
  // 计算趋势
  const calculateTrend = (data: DataPoint[], index: number): 'increasing' | 'decreasing' | 'stable' => {
    if (index < 2) return 'stable';
    
    const last3 = data.slice(Math.max(0, index - 2), index + 1);
    const slopes = [];
    
    for (let i = 1; i < last3.length; i++) {
      slopes.push(last3[i].ewma - last3[i - 1].ewma);
    }
    
    const avgSlope = slopes.reduce((sum, slope) => sum + slope, 0) / slopes.length;
    
    if (avgSlope > params.sigma * 0.1) return 'increasing';
    if (avgSlope < -params.sigma * 0.1) return 'decreasing';
    return 'stable';
  };
  
  // 计算西格玛水平
  const calculateSigmaLevel = (ewma: number, target: number, sigma: number): number => {
    return Math.abs(ewma - target) / sigma;
  };

  // 计算EWMA值和控制限
  const chartData = useMemo(() => {
    if (rawData.length === 0) return [];

    const data: DataPoint[] = [];
    let ewma = params.target; // 初始EWMA值设为目标值

    for (let i = 0; i < rawData.length; i++) {
      if (i === 0) {
        ewma = params.lambda * rawData[i] + (1 - params.lambda) * params.target;
      } else {
        ewma = params.lambda * rawData[i] + (1 - params.lambda) * data[i - 1].ewma;
      }

      // 计算控制限
      const variance = (params.lambda / (2 - params.lambda)) * (1 - Math.pow(1 - params.lambda, 2 * (i + 1)));
      const controlLimit = params.L * params.sigma * Math.sqrt(variance);
      
      const ucl = params.target + controlLimit;
      const lcl = params.target - controlLimit;
      
      const isOutOfControl = ewma > ucl || ewma < lcl;
      const sigmaLevel = calculateSigmaLevel(ewma, params.target, params.sigma);

      const point: DataPoint = {
        index: i + 1,
        value: rawData[i],
        ewma,
        ucl,
        lcl,
        centerLine: params.target,
        isOutOfControl,
        violationRules: [],
        sigmaLevel,
        trend: 'stable'
      };
      
      data.push(point);
    }
    
    // 第二次遍历，计算规则违反和趋势
    for (let i = 0; i < data.length; i++) {
      data[i].violationRules = checkControlRules(data, i);
      data[i].trend = calculateTrend(data, i);
    }

    return data;
  }, [rawData, params]);

  // 异常点检测
  const outOfControlPoints = useMemo(() => {
    return chartData.filter(point => point.isOutOfControl || point.violationRules.length > 0);
  }, [chartData]);
  
  // 过程能力分析
  const processCapability = useMemo((): ProcessCapability | null => {
    if (rawData.length < 25) return null; // 需要足够的数据点
    
    const mean = rawData.reduce((sum, val) => sum + val, 0) / rawData.length;
    const variance = rawData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (rawData.length - 1);
    const stdDev = Math.sqrt(variance);
    
    // 假设规格限为 ±3σ
    const USL = params.target + 3 * params.sigma; // 上规格限
    const LSL = params.target - 3 * params.sigma; // 下规格限
    
    // 计算过程能力指数
    const cp = (USL - LSL) / (6 * stdDev);
    const cpk = Math.min(
      (USL - mean) / (3 * stdDev),
      (mean - LSL) / (3 * stdDev)
    );
    
    // 计算过程性能指数（使用总体标准差）
    const overallStdDev = Math.sqrt(rawData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / rawData.length);
    const pp = (USL - LSL) / (6 * overallStdDev);
    const ppk = Math.min(
      (USL - mean) / (3 * overallStdDev),
      (mean - LSL) / (3 * overallStdDev)
    );
    
    // 计算西格玛水平
    const sigma = Math.min(cpk * 3, 6); // 限制在6σ以内
    
    return {
      cp: parseFloat(cp.toFixed(3)),
      cpk: parseFloat(cpk.toFixed(3)),
      pp: parseFloat(pp.toFixed(3)),
      ppk: parseFloat(ppk.toFixed(3)),
      sigma: parseFloat(sigma.toFixed(2))
    };
  }, [rawData, params]);
  
  // 控制规则统计
  const controlRulesStats = useMemo(() => {
    const ruleViolations: { [key: string]: number } = {};
    
    chartData.forEach(point => {
      point.violationRules.forEach(rule => {
        ruleViolations[rule] = (ruleViolations[rule] || 0) + 1;
      });
    });
    
    return ruleViolations;
  }, [chartData]);

  // 统计信息
  const statistics = useMemo(() => {
    if (chartData.length === 0) return null;

    const ewmaValues = chartData.map(d => d.ewma);
    const originalValues = chartData.map(d => d.value);
    
    const ewmaMean = ewmaValues.reduce((sum, val) => sum + val, 0) / ewmaValues.length;
    const ewmaVariance = ewmaValues.reduce((sum, val) => sum + Math.pow(val - ewmaMean, 2), 0) / ewmaValues.length;
    const ewmaStdDev = Math.sqrt(ewmaVariance);
    
    const originalMean = originalValues.reduce((sum, val) => sum + val, 0) / originalValues.length;
    const originalVariance = originalValues.reduce((sum, val) => sum + Math.pow(val - originalMean, 2), 0) / (originalValues.length - 1);
    const originalStdDev = Math.sqrt(originalVariance);
    
    // 计算ARL (Average Run Length)
    const arl = chartData.length / Math.max(outOfControlPoints.length, 1);
    
    // 计算过程稳定性指标
    const stabilityIndex = 1 - (outOfControlPoints.length / chartData.length);
    
    return {
      ewmaMean: ewmaMean.toFixed(3),
      ewmaStdDev: ewmaStdDev.toFixed(3),
      originalMean: originalMean.toFixed(3),
      originalStdDev: originalStdDev.toFixed(3),
      outOfControlRate: ((outOfControlPoints.length / chartData.length) * 100).toFixed(1),
      arl: arl.toFixed(1),
      stabilityIndex: (stabilityIndex * 100).toFixed(1),
      totalViolations: outOfControlPoints.length
    };
  }, [chartData, outOfControlPoints]);

  // 参数更新处理
  const handleParamChange = (key: keyof EWMAParams, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  // 导出图表
  const handleExport = () => {
    toast.success('图表导出功能开发中...');
  };

  // 自定义工具提示
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-xl max-w-xs">
          <div className="border-b border-gray-100 pb-2 mb-2">
            <p className="font-semibold text-gray-900 text-sm">{`样本 ${label}`}</p>
          </div>
          
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">原始值:</span>
              <span className="font-medium text-blue-600">{data.value?.toFixed(3)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">EWMA值:</span>
              <span className="font-medium text-green-600">{data.ewma?.toFixed(3)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">西格玛水平:</span>
              <span className="font-medium">{data.sigmaLevel?.toFixed(2)}σ</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">趋势:</span>
              <span className="font-medium">
                {data.trend === 'increasing' ? '↗️ 上升' : 
                 data.trend === 'decreasing' ? '↘️ 下降' : '➡️ 稳定'}
              </span>
            </div>
            
            <div className="border-t border-gray-100 pt-2 mt-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">UCL:</span>
                <span className="text-red-600">{data.ucl?.toFixed(3)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">中心线:</span>
                <span className="text-green-600">{data.centerLine?.toFixed(3)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">LCL:</span>
                <span className="text-red-600">{data.lcl?.toFixed(3)}</span>
              </div>
            </div>
            
            {(data.isOutOfControl || data.violationRules.length > 0) && (
              <div className="border-t border-red-100 pt-2 mt-2">
                <p className="text-red-600 font-medium text-xs flex items-center">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  异常检测
                </p>
                {data.isOutOfControl && (
                  <p className="text-red-500 text-xs">• 超出控制限</p>
                )}
                {data.violationRules.map((rule: string, index: number) => (
                  <p key={index} className="text-red-500 text-xs">• {rule}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">EWMA控制图</h1>
            <p className="text-gray-600">指数加权移动平均控制图，用于检测过程中的小幅偏移</p>
            {selectedVariable && (
              <div className="mt-2 flex items-center text-sm text-blue-600">
                <BarChart3 className="h-4 w-4 mr-1" />
                当前分析变量: {selectedVariable.name} ({selectedVariable.unit})
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button
                onClick={() => setShowVariableSelector(!showVariableSelector)}
                className={cn(
                  "flex items-center px-4 py-2 rounded-lg transition-colors",
                  showVariableSelector ? "bg-[#1f4e79] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                {selectedVariable ? selectedVariable.name : "选择变量"}
              </button>
              
              {showVariableSelector && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <div className="p-3 border-b border-gray-200">
                    <h3 className="font-medium text-gray-900">选择分析变量</h3>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {availableVariables.filter(variable => 'columnIndex' in variable && variable.columnIndex !== undefined).length > 0 ? (
                      availableVariables
                        .filter(variable => 'columnIndex' in variable && variable.columnIndex !== undefined)
                        .map((variable) => (
                        <button
                          key={variable.id}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleVariableChange(variable);
                          }}
                          className={cn(
                            "w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0",
                            selectedVariable?.id === variable.id && "bg-blue-50 text-blue-700"
                          )}
                        >
                          <div className="font-medium">{variable.name}</div>
                          <div className="text-sm text-gray-500">{variable.description}</div>
                          <div className="text-xs text-gray-400 mt-1">单位: {variable.unit} | 列: {(variable as any).columnIndex + 1}</div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-6 text-center text-gray-500">
                        <div className="text-sm">暂无可用变量</div>
                        <div className="text-xs mt-1">请先在数据管理页面上传Excel文件</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setShowParams(!showParams)}
              className={cn(
                "flex items-center px-4 py-2 rounded-lg transition-colors",
                showParams ? "bg-[#5b9bd5] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              <Settings className="h-4 w-4 mr-2" />
              参数设置
            </button>
            
            <button
              onClick={handleExport}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              导出图表
            </button>
          </div>
        </div>
      </div>

      {/* 参数配置面板 */}
      {showParams && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">EWMA参数配置</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                λ (平滑常数): {params.lambda}
              </label>
              <input
                type="range"
                min="0.05"
                max="1"
                step="0.05"
                value={params.lambda}
                onChange={(e) => handleParamChange('lambda', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0.05</span>
                <span>1.0</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">目标值</label>
              <input
                type="number"
                value={params.target}
                onChange={(e) => handleParamChange('target', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5b9bd5] focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">标准差 (σ)</label>
              <input
                type="number"
                value={params.sigma}
                onChange={(e) => handleParamChange('sigma', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5b9bd5] focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">控制限系数 (L)</label>
              <input
                type="number"
                value={params.L}
                onChange={(e) => handleParamChange('L', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5b9bd5] focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">子组大小</label>
              <input
                type="number"
                min="1"
                value={params.subgroupSize}
                onChange={(e) => handleParamChange('subgroupSize', parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5b9bd5] focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                置信水平 (%): {params.confidenceLevel}
              </label>
              <input
                type="range"
                min="90"
                max="99.9"
                step="0.1"
                value={params.confidenceLevel}
                onChange={(e) => handleParamChange('confidenceLevel', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>90%</span>
                <span>99.9%</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">EWMA参数说明</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• λ值越小，对历史数据的权重越大，图表越平滑</li>
                <li>• λ值越大，对当前数据的权重越大，响应越敏感</li>
                <li>• 建议λ值在0.05-0.3之间，常用值为0.2</li>
                <li>• L值通常取3，对应99.7%的置信区间</li>
              </ul>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-green-900 mb-2">控制限说明</h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• 控制限随时间变化，初期较宽，后期趋于稳定</li>
                <li>• 置信水平决定控制限的宽度</li>
                <li>• 99.7%置信水平对应3σ控制限</li>
                <li>• 子组大小影响控制限的计算</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 统计信息 */}
      {statistics && (
        <div className="space-y-6">
          {/* 基础统计指标 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{statistics.ewmaMean}</div>
                  <div className="text-sm text-gray-600">EWMA均值</div>
                  <div className="text-xs text-gray-500 mt-1">原始均值: {statistics.originalMean}</div>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{statistics.ewmaStdDev}</div>
                  <div className="text-sm text-gray-600">EWMA标准差</div>
                  <div className="text-xs text-gray-500 mt-1">原始标准差: {statistics.originalStdDev}</div>
                </div>
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold text-sm">σ</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{statistics.totalViolations}</div>
                  <div className="text-sm text-gray-600">异常点总数</div>
                  <div className="text-xs text-gray-500 mt-1">失控率: {statistics.outOfControlRate}%</div>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{statistics.arl}</div>
                  <div className="text-sm text-gray-600">平均游程长度</div>
                  <div className="text-xs text-gray-500 mt-1">稳定性: {statistics.stabilityIndex}%</div>
                </div>
                <Activity className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>
          
          {/* 过程能力分析 */}
          {processCapability && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Target className="h-5 w-5 text-blue-600 mr-2" />
                  过程能力分析
                </h3>
                <button
                  onClick={() => setShowCapabilityAnalysis(!showCapabilityAnalysis)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {showCapabilityAnalysis ? '收起' : '展开'}
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-900">{processCapability.cp}</div>
                  <div className="text-sm text-blue-700">Cp</div>
                  <div className="text-xs text-blue-600 mt-1">过程能力</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-900">{processCapability.cpk}</div>
                  <div className="text-sm text-green-700">Cpk</div>
                  <div className="text-xs text-green-600 mt-1">过程能力指数</div>
                </div>
                
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-900">{processCapability.pp}</div>
                  <div className="text-sm text-yellow-700">Pp</div>
                  <div className="text-xs text-yellow-600 mt-1">过程性能</div>
                </div>
                
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-900">{processCapability.ppk}</div>
                  <div className="text-sm text-orange-700">Ppk</div>
                  <div className="text-xs text-orange-600 mt-1">过程性能指数</div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-900">{processCapability.sigma}σ</div>
                  <div className="text-sm text-purple-700">西格玛水平</div>
                  <div className="text-xs text-purple-600 mt-1">质量水平</div>
                </div>
              </div>
              
              {showCapabilityAnalysis && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">能力指数解释</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                    <div>
                      <strong>Cp &gt; 1.33:</strong> 过程能力充足<br/>
                      <strong>1.0 &lt; Cp &lt; 1.33:</strong> 过程能力勉强<br/>
                      <strong>Cp &lt; 1.0:</strong> 过程能力不足
                    </div>
                    <div>
                      <strong>Cpk &gt; 1.33:</strong> 过程稳定且居中<br/>
                      <strong>1.0 &lt; Cpk &lt; 1.33:</strong> 过程需要改进<br/>
                      <strong>Cpk &lt; 1.0:</strong> 过程严重偏离
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* 控制规则违反统计 */}
          {Object.keys(controlRulesStats).length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Zap className="h-5 w-5 text-yellow-600 mr-2" />
                  控制规则违反统计
                </h3>
                <button
                  onClick={() => setShowControlRules(!showControlRules)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {showControlRules ? '收起' : '展开'}
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(controlRulesStats).map(([rule, count]) => (
                  <div key={rule} className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="text-lg font-bold text-red-900">{count}</div>
                    <div className="text-sm text-red-700">{rule}</div>
                  </div>
                ))}
              </div>
              
              {showControlRules && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">控制规则说明</h4>
                  <div className="text-sm text-yellow-800 space-y-1">
                    <div><strong>规则1:</strong> 单点超出3σ控制限</div>
                    <div><strong>规则2:</strong> 连续9点在中心线同一侧</div>
                    <div><strong>规则3:</strong> 连续6点递增或递减</div>
                    <div><strong>规则5:</strong> 连续2/3点在2σ区域</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* EWMA控制图 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">EWMA控制图</h2>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-0.5 bg-red-600 mr-2"></div>
              <span className="text-gray-600">控制限 (±{params.L}σ)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-0.5 bg-green-600 mr-2"></div>
              <span className="text-gray-600">中心线</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-0.5 bg-blue-600 mr-2"></div>
              <span className="text-gray-600">EWMA</span>
            </div>
          </div>
        </div>
        
        {/* 图表信息面板 */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">样本数量:</span>
              <span className="font-medium ml-1">{chartData.length}</span>
            </div>
            <div>
              <span className="text-gray-600">λ参数:</span>
              <span className="font-medium ml-1">{params.lambda}</span>
            </div>
            <div>
              <span className="text-gray-600">目标值:</span>
              <span className="font-medium ml-1">{params.target}</span>
            </div>
            <div>
              <span className="text-gray-600">置信水平:</span>
              <span className="font-medium ml-1">{params.confidenceLevel}%</span>
            </div>
          </div>
        </div>
        
        <div className="h-[600px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 40, left: 80, bottom: 100 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#e5e7eb" opacity={0.7} />
              
              {/* 西格玛区域 */}
              <ReferenceArea
                y1={params.target - params.sigma}
                y2={params.target + params.sigma}
                fill="#dcfce7"
                fillOpacity={0.3}
                stroke="none"
              />
              <ReferenceArea
                y1={params.target - 2 * params.sigma}
                y2={params.target - params.sigma}
                fill="#fef3c7"
                fillOpacity={0.3}
                stroke="none"
              />
              <ReferenceArea
                y1={params.target + params.sigma}
                y2={params.target + 2 * params.sigma}
                fill="#fef3c7"
                fillOpacity={0.3}
                stroke="none"
              />
              <ReferenceArea
                y1={params.target - 3 * params.sigma}
                y2={params.target - 2 * params.sigma}
                fill="#fee2e2"
                fillOpacity={0.3}
                stroke="none"
              />
              <ReferenceArea
                y1={params.target + 2 * params.sigma}
                y2={params.target + 3 * params.sigma}
                fill="#fee2e2"
                fillOpacity={0.3}
                stroke="none"
              />
              
              <XAxis 
                dataKey="index" 
                stroke="#374151"
                fontSize={12}
                label={{ 
                  value: '样本序号', 
                  position: 'insideBottom', 
                  offset: -10,
                  style: { textAnchor: 'middle', fontSize: '14px', fontWeight: 'bold' }
                }}
                height={80}
                tick={{ fontSize: 11, fill: '#374151' }}
                tickLine={{ stroke: '#9ca3af' }}
                axisLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
              />
              <YAxis 
                stroke="#374151"
                fontSize={12}
                label={{ 
                  value: selectedVariable ? `${selectedVariable.name} (${selectedVariable.unit})` : '数值', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fontSize: '14px', fontWeight: 'bold' }
                }}
                width={70}
                tick={{ fontSize: 11, fill: '#374151' }}
                tickLine={{ stroke: '#9ca3af' }}
                axisLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
                domain={['dataMin - 5', 'dataMax + 5']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={50}
                wrapperStyle={{ paddingTop: '15px', fontSize: '12px' }}
                iconType="line"
              />
              
              {/* 西格玛参考线 */}
              <ReferenceLine 
                y={params.target + params.sigma} 
                stroke="#10b981" 
                strokeDasharray="4 2" 
                strokeWidth={1}
                opacity={0.6}
              />
              <ReferenceLine 
                y={params.target - params.sigma} 
                stroke="#10b981" 
                strokeDasharray="4 2" 
                strokeWidth={1}
                opacity={0.6}
              />
              <ReferenceLine 
                y={params.target + 2 * params.sigma} 
                stroke="#f59e0b" 
                strokeDasharray="4 2" 
                strokeWidth={1}
                opacity={0.6}
              />
              <ReferenceLine 
                y={params.target - 2 * params.sigma} 
                stroke="#f59e0b" 
                strokeDasharray="4 2" 
                strokeWidth={1}
                opacity={0.6}
              />
              
              {/* 控制限线 */}
              <Line
                type="monotone"
                dataKey="ucl"
                stroke="#dc2626"
                strokeWidth={3}
                strokeDasharray="8 4"
                dot={false}
                name="上控制限 (UCL)"
                opacity={0.9}
              />
              <Line
                type="monotone"
                dataKey="lcl"
                stroke="#dc2626"
                strokeWidth={3}
                strokeDasharray="8 4"
                dot={false}
                name="下控制限 (LCL)"
                opacity={0.9}
              />
              
              {/* 中心线 */}
              <Line
                type="monotone"
                dataKey="centerLine"
                stroke="#16a34a"
                strokeWidth={3}
                strokeDasharray="12 6"
                dot={false}
                name="中心线 (目标值)"
                opacity={0.9}
              />
              
              {/* 原始数据 */}
              <Line
                type="monotone"
                dataKey="value"
                stroke="#9ca3af"
                strokeWidth={1.5}
                dot={false}
                name="原始数据"
                opacity={0.7}
              />
              
              {/* EWMA线 */}
              <Line
                type="monotone"
                dataKey="ewma"
                stroke="#2563eb"
                strokeWidth={3}
                dot={(props: any) => {
                  const { cx, cy, payload, index } = props;
                  if (!payload) return null;
                  
                  // 只在以下情况显示数据点：
                  // 1. 异常点（超出控制限或违反规则）
                  // 2. 每10个点显示一个（减少密度）
                  // 3. 重要的sigma级别点（>2σ）
                  const shouldShowDot = 
                    payload.isOutOfControl || 
                    payload.violationRules.length > 0 || 
                    index % 10 === 0 || 
                    payload.sigmaLevel > 2;
                  
                  if (!shouldShowDot) return null;
                  
                  let fillColor = '#2563eb';
                  let strokeColor = '#1d4ed8';
                  let radius = 2;
                  
                  if (payload.isOutOfControl || payload.violationRules.length > 0) {
                    fillColor = '#ef4444';
                    strokeColor = '#dc2626';
                    radius = 3;
                  } else if (payload.sigmaLevel > 2) {
                    fillColor = '#f59e0b';
                    strokeColor = '#d97706';
                    radius = 2.5;
                  } else if (payload.sigmaLevel > 1) {
                    fillColor = '#10b981';
                    strokeColor = '#059669';
                    radius = 2;
                  }
                  
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={radius}
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={1}
                      opacity={0.9}
                    />
                  );
                }}
                name="EWMA值"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* 图例说明 */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">图表说明</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <div className="mb-2"><strong>区域颜色:</strong></div>
              <div className="space-y-1">
                <div className="flex items-center">
                  <div className="w-4 h-3 bg-green-200 mr-2 rounded"></div>
                  <span>1σ区域 (68.3%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-3 bg-yellow-200 mr-2 rounded"></div>
                  <span>2σ区域 (95.4%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-3 bg-red-200 mr-2 rounded"></div>
                  <span>3σ区域 (99.7%)</span>
                </div>
              </div>
            </div>
            <div>
              <div className="mb-2"><strong>数据点颜色:</strong></div>
              <div className="space-y-1">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-600 mr-2 rounded-full"></div>
                  <span>正常点 (&lt;1σ)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-600 mr-2 rounded-full"></div>
                  <span>注意点 (1-2σ)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-600 mr-2 rounded-full"></div>
                  <span>警告点 (2-3σ)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-600 mr-2 rounded-full"></div>
                  <span>异常点 (&gt;3σ或违反规则)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 异常检测结果 */}
      {outOfControlPoints.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            异常检测结果
          </h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">样本序号</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">原始值</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EWMA值</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">上控制限</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">下控制限</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">异常类型</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {outOfControlPoints.map((point) => (
                  <tr key={point.index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{point.index}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{point.value.toFixed(3)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">{point.ewma.toFixed(3)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{point.ucl.toFixed(3)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{point.lcl.toFixed(3)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn(
                        "inline-flex px-2 py-1 text-xs font-semibold rounded-full",
                        point.ewma > point.ucl ? "bg-red-100 text-red-800" : "bg-orange-100 text-orange-800"
                      )}>
                        {point.ewma > point.ucl ? '超上限' : '超下限'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default EWMAChart;