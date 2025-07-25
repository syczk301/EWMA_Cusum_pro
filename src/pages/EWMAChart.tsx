import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts';
import { Settings, AlertTriangle, TrendingUp, TrendingDown, Download, BarChart3, Activity, Target, Zap, ChevronUp, ChevronDown } from 'lucide-react';
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
  const [showChartLegend, setShowChartLegend] = useState(true);
  const [showProcessCapability, setShowProcessCapability] = useState(true);
  const [showAnomalyResults, setShowAnomalyResults] = useState(true);

  // 自动设置参数函数
  const autoSetParams = () => {
    if (rawData.length === 0) {
      toast.error('没有可用数据进行参数设置');
      return;
    }
    
    const mean = rawData.reduce((sum, val) => sum + val, 0) / rawData.length;
    const variance = rawData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (rawData.length - 1);
    const stdDev = Math.sqrt(variance);
    
    setParams(prev => ({
      ...prev,
      target: parseFloat(mean.toFixed(2)),
      sigma: parseFloat(stdDev.toFixed(2))
    }));
    
    toast.success('参数已自动设置');
  };

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

  // 计算智能Y轴范围
  const calculateYAxisDomain = (data: DataPoint[]) => {
    if (data.length === 0) return ['dataMin - 5', 'dataMax + 5'];
    
    const allValues = data.flatMap(d => [d.value, d.ewma, d.ucl, d.lcl]);
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    const range = maxValue - minValue;
    
    // 根据数据范围动态调整边距
    let padding;
    if (range < 1) {
      // 小数据范围，使用较大的相对边距
      padding = range * 0.3;
    } else if (range < 10) {
      // 中等数据范围
      padding = range * 0.2;
    } else {
      // 大数据范围，使用较小的相对边距
      padding = range * 0.1;
    }
    
    // 确保最小边距
    padding = Math.max(padding, range * 0.05);
    
    return [minValue - padding, maxValue + padding];
  };

  // 计算智能X轴刻度间隔
  const calculateXAxisInterval = (dataLength: number) => {
    if (dataLength <= 20) return 0; // 显示所有刻度
    if (dataLength <= 50) return Math.floor(dataLength / 10);
    if (dataLength <= 100) return Math.floor(dataLength / 15);
    return Math.floor(dataLength / 20);
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

  // 计算自适应显示参数
  const adaptiveParams = useMemo(() => {
    const yDomain = calculateYAxisDomain(chartData);
    const xInterval = calculateXAxisInterval(chartData.length);
    
    // 根据数据密度调整数据点显示
    let dotInterval;
    if (chartData.length <= 50) {
      dotInterval = 1; // 显示所有点
    } else if (chartData.length <= 100) {
      dotInterval = 3; // 每3个点显示一个
    } else {
      dotInterval = 5; // 每5个点显示一个
    }
    
    return {
      yDomain,
      xInterval,
      dotInterval
    };
  }, [chartData]);

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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">目标值 (μ₀)</label>
              <input
                type="number"
                value={params.target}
                onChange={(e) => handleParamChange('target', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5b9bd5] focus:border-transparent"
                step="0.1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">标准差 (σ)</label>
              <input
                type="number"
                value={params.sigma}
                onChange={(e) => handleParamChange('sigma', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5b9bd5] focus:border-transparent"
                step="0.1"
                min="0.1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">控制限系数 (L)</label>
              <input
                type="number"
                value={params.L}
                onChange={(e) => handleParamChange('L', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5b9bd5] focus:border-transparent"
                step="0.1"
                min="0.1"
              />
            </div>
          </div>
          
          <div className="mt-4 flex items-center space-x-4 flex-wrap gap-2">
            <button
              onClick={autoSetParams}
              className="px-4 py-2 bg-[#1f4e79] text-white rounded-lg hover:bg-[#1a4066] transition-colors flex items-center"
            >
              <Settings className="w-4 h-4 mr-2" />
              自动设置参数
            </button>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showControlRules}
                onChange={(e) => setShowControlRules(e.target.checked)}
                className="mr-2 rounded"
              />
              <span className="text-sm text-gray-700">显示控制规则</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={autoDetect}
                onChange={(e) => setAutoDetect(e.target.checked)}
                className="mr-2 rounded"
              />
              <span className="text-sm text-gray-700">自动检测异常</span>
            </label>
          </div>
        </div>
      )}

      {/* 统计信息 */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{statistics.ewmaMean}</div>
                <div className="text-sm text-gray-600">EWMA均值</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <TrendingDown className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{statistics.ewmaStdDev}</div>
                <div className="text-sm text-gray-600">EWMA标准差</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{statistics.totalViolations}</div>
                <div className="text-sm text-gray-600">异常点总数</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{statistics.arl}</div>
                <div className="text-sm text-gray-600">平均游程长度</div>
              </div>
            </div>
          </div>
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
        

        
        <div className={`${chartData.length > 100 ? 'h-[600px]' : chartData.length > 50 ? 'h-[550px]' : 'h-[500px]'}`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 40, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              
              <XAxis 
                dataKey="index" 
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                interval={adaptiveParams.xInterval}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => {
                  // 根据数值范围智能格式化
                  const range = adaptiveParams.yDomain[1] - adaptiveParams.yDomain[0];
                  if (range < 1) {
                    return value.toFixed(3);
                  } else if (range < 10) {
                    return value.toFixed(2);
                  } else {
                    return value.toFixed(1);
                  }
                }}
                domain={adaptiveParams.yDomain}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* 警告区域和危险区域已取消 */}
              
              {/* 控制限线 */}
              <Line
                type="monotone"
                dataKey="ucl"
                stroke="#dc2626"
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
                name="上控制限 (UCL)"
              />
              <Line
                type="monotone"
                dataKey="lcl"
                stroke="#dc2626"
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
                name="下控制限 (LCL)"
              />
              
              {/* 中心线 */}
              <Line
                type="monotone"
                dataKey="centerLine"
                stroke="#059669"
                strokeWidth={1}
                dot={false}
                name="中心线 (目标值)"
              />
              
              {/* 原始数据 */}
              <Line
                type="monotone"
                dataKey="value"
                stroke="#94a3b8"
                strokeWidth={chartData.length > 100 ? 0.8 : 1}
                strokeOpacity={chartData.length > 100 ? 0.4 : chartData.length > 50 ? 0.5 : 0.6}
                dot={false}
                name="原始数据"
              />
              
              {/* EWMA线 */}
              <Line
                type="monotone"
                dataKey="ewma"
                stroke="#dc2626"
                strokeWidth={2}
                dot={(props) => {
                  const { index } = props;
                  // 使用自适应的点间隔或异常点显示数据点
                  const shouldShowDot = index % adaptiveParams.dotInterval === 0 || 
                    outOfControlPoints.some(point => point.index === index + 1);
                  
                  // 根据数据密度调整点的大小
                  const dotSize = chartData.length > 100 ? 2 : 3;
                  
                  return shouldShowDot ? 
                    <circle key={`ewma-${index}`} cx={props.cx} cy={props.cy} r={dotSize} fill="#dc2626" stroke="#fff" strokeWidth={1} /> : 
                    null;
                }}
                name="EWMA值"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        

      </div>

      {/* 过程能力分析 */}
      {processCapability && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
              过程能力分析
            </h2>
            <button
              onClick={() => setShowCapabilityAnalysis(!showCapabilityAnalysis)}
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              {showCapabilityAnalysis ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
          
          {showCapabilityAnalysis && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{processCapability.cp}</div>
                <div className="text-sm text-gray-600 mt-1">Cp (潜在能力)</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{processCapability.cpk}</div>
                <div className="text-sm text-gray-600 mt-1">Cpk (实际能力)</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">{processCapability.pp}</div>
                <div className="text-sm text-gray-600 mt-1">Pp (总体能力)</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-orange-600">{processCapability.ppk}</div>
                <div className="text-sm text-gray-600 mt-1">Ppk (总体性能)</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 趋势分析结果 */}
      {outOfControlPoints.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
            趋势分析结果
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-3">检测到的变化点</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">样本序号</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">EWMA值</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">控制限</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">类型</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {outOfControlPoints.map((point) => (
                      <tr key={point.index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">{point.index}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{point.ewma.toFixed(3)}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{point.ewma > point.ucl ? point.ucl.toFixed(3) : point.lcl.toFixed(3)}</td>
                        <td className="px-4 py-2">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                            {point.ewma > point.ucl ? '向上偏移' : point.ewma < point.lcl ? '向下偏移' : '趋势变化'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-3">分析总结</h3>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium text-blue-900">平均游程长度 (ARL)</div>
                  <div className="text-lg font-bold text-blue-600">{statistics?.arl || '4.7'}</div>
                  <div className="text-xs text-blue-700">较小的ARL表示能更快检测到过程变化</div>
                </div>
                
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-sm font-medium text-green-900">检测效率</div>
                  <div className="text-lg font-bold text-green-600">
                    {outOfControlPoints.length > 0 ? '良好' : '优秀'}
                  </div>
                  <div className="text-xs text-green-700">
                    {outOfControlPoints.length > 0 
                      ? `检测到${outOfControlPoints.length}次过程变化` 
                      : '过程稳定，未检测到显著变化'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EWMAChart;