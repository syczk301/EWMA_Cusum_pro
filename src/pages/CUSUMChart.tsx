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
  cusumHigh: number;
  cusumHighOutOfControl?: number; // 只有超限时才有值
  cusumLow: number;
  cusumLowOutOfControl?: number; // 只有超限时才有值
  upperLimit: number;
  lowerLimit: number;
  isOutOfControl: boolean;
  changePoint?: boolean;
  deviation: number;
  cusumMagnitude: number;
  signalStrength: 'low' | 'medium' | 'high';
  trend: 'stable' | 'increasing' | 'decreasing';
}

interface CUSUMParams {
  target: number;
  sigma: number;
  k: number;
  h: number;
  confidenceLevel: number;
  subgroupSize: number;
  fastInitialResponse: boolean;
}

const CUSUMChart: React.FC = () => {
  const { availableVariables, selectedVariable, setSelectedVariable, rawData: storeRawData, uploadedFile: storeUploadedFile } = useDataStore();
  
  const [params, setParams] = useState<CUSUMParams>({
    target: 100,
    sigma: 5,
    k: 2.5,
    h: 20,
    confidenceLevel: 95,
    subgroupSize: 1,
    fastInitialResponse: false
  });
  
  const [showCapabilityAnalysis, setShowCapabilityAnalysis] = useState(false);
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);
  const [rawData, setRawData] = useState<number[]>([]);
  const [showParams, setShowParams] = useState(false);
  const [showBothSides, setShowBothSides] = useState(true);
  const [showVariableSelector, setShowVariableSelector] = useState(false);
  const [dataInitialized, setDataInitialized] = useState(false);

  // 处理变量选择
  const handleVariableChange = async (variable: Variable) => {
    setSelectedVariable(variable);
    setShowVariableSelector(false);
    
    if (storeUploadedFile && 'columnIndex' in variable) {
      try {
        const dataPoints = await extractDataForVariable(storeUploadedFile, (variable as any).columnIndex);
        const values = dataPoints.map(point => point.value);
        setRawData(values);
        
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        
        setParams(prev => ({
          ...prev,
          target: parseFloat(mean.toFixed(2)),
          sigma: parseFloat(stdDev.toFixed(2)),
          k: parseFloat((0.5 * stdDev).toFixed(2)),
          h: parseFloat((4 * stdDev).toFixed(2))
        }));
        
        toast.success(`已选择变量: ${variable.name}，加载了 ${values.length} 个数据点`);
      } catch (error) {
        toast.error('加载变量数据失败');
        console.error(error);
      }
    } else if (storeRawData.length > 0) {
      const values = storeRawData.map(point => point.value);
      setRawData(values);
      toast.success(`已选择变量: ${variable.name}`);
    } else {
      toast.success(`已选择变量: ${variable.name}`);
    }
  };

  // 监听变量变化，重新加载数据
  useEffect(() => {
    const loadDataForSelectedVariable = async () => {
      if (selectedVariable && storeUploadedFile && 'columnIndex' in selectedVariable) {
        try {
          const dataPoints = await extractDataForVariable(storeUploadedFile, (selectedVariable as any).columnIndex);
          const values = dataPoints.map(point => point.value);
          setRawData(values);
          
          const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
          const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
          const stdDev = Math.sqrt(variance);
          
          setParams(prev => ({
            ...prev,
            target: parseFloat(mean.toFixed(2)),
            sigma: parseFloat(stdDev.toFixed(2)),
            k: parseFloat((0.5 * stdDev).toFixed(2)),
            h: parseFloat((4 * stdDev).toFixed(2))
          }));
        } catch (error) {
          console.error('加载变量数据失败:', error);
        }
      }
    };
    
    loadDataForSelectedVariable();
  }, [selectedVariable, storeUploadedFile]);

  // 智能默认变量选择
  useEffect(() => {
    if (availableVariables.length > 0 && !selectedVariable) {
      // 查找克重相关变量
      const weightVariable = availableVariables.find(variable => 
        variable.name.includes('克重') || 
        variable.name.includes('定量') ||
        variable.name.toLowerCase().includes('weight') ||
        variable.name.toLowerCase().includes('gsm')
      );
      
      // 如果找到克重变量，选择它；否则选择第一个变量
      const defaultVariable = weightVariable || availableVariables[0];
      setSelectedVariable(defaultVariable);
    }
  }, [availableVariables, selectedVariable, setSelectedVariable]);

  // 初始化数据
  useEffect(() => {
    if (!dataInitialized) {
      if (selectedVariable && storeUploadedFile && 'columnIndex' in selectedVariable) {
        // 变量变化的useEffect会处理这种情况
        setDataInitialized(true);
      } else if (storeRawData.length > 0) {
        const values = storeRawData.map(point => point.value);
        setRawData(values);
        
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        
        setParams(prev => ({
          ...prev,
          target: parseFloat(mean.toFixed(2)),
          sigma: parseFloat(stdDev.toFixed(2)),
          k: parseFloat((0.5 * stdDev).toFixed(2)),
          h: parseFloat((4 * stdDev).toFixed(2))
        }));
        setDataInitialized(true);
      } else {
        // 生成模拟数据
        const generateData = () => {
          const data: number[] = [];
          for (let i = 0; i < 50; i++) {
            const random = (Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() - 3) / 3;
            let value = params.target + random * params.sigma;
            
            if (i >= 25 && i < 35) {
              value += params.sigma * 1.5;
            }
            if (i >= 40) {
              value -= params.sigma * 1;
            }
            
            data.push(value);
          }
          return data;
        };
        
        setRawData(generateData());
        setDataInitialized(true);
      }
    }
  }, [storeRawData, dataInitialized, params.target, params.sigma]);

  // 计算智能Y轴范围
  const calculateYAxisDomain = (data: DataPoint[]) => {
    if (data.length === 0) return ['dataMin - 5', 'dataMax + 5'];
    
    const allValues = data.flatMap(d => [d.cusumHigh, d.cusumLow, params.h, -params.h]);
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

  // 计算CUSUM值
  const chartData = useMemo(() => {
    if (rawData.length === 0) return [];

    const data: DataPoint[] = [];
    let cusumHigh = 0;
    let cusumLow = 0;
    
    const firFactor = params.fastInitialResponse ? params.h / 2 : 0;

    for (let i = 0; i < rawData.length; i++) {
      const deviation = rawData[i] - params.target;
      
      if (i === 0 && params.fastInitialResponse) {
        cusumHigh = Math.max(0, deviation - params.k + firFactor);
      } else {
        cusumHigh = Math.max(0, cusumHigh + deviation - params.k);
      }
      
      if (i === 0 && params.fastInitialResponse) {
        cusumLow = Math.min(0, deviation + params.k - firFactor);
      } else {
        cusumLow = Math.min(0, cusumLow + deviation + params.k);
      }
      
      const isOutOfControl = cusumHigh > params.h || cusumLow < -params.h;
      const cusumMagnitude = Math.sqrt(cusumHigh * cusumHigh + cusumLow * cusumLow);
      
      let signalStrength: 'low' | 'medium' | 'high' = 'low';
      if (cusumMagnitude > params.h * 0.8) {
        signalStrength = 'high';
      } else if (cusumMagnitude > params.h * 0.5) {
        signalStrength = 'medium';
      }
      
      let trend: 'stable' | 'increasing' | 'decreasing' = 'stable';
      if (i >= 2) {
        const recentValues = rawData.slice(Math.max(0, i - 2), i + 1);
        const slope = (recentValues[recentValues.length - 1] - recentValues[0]) / (recentValues.length - 1);
        if (slope > params.sigma * 0.1) {
          trend = 'increasing';
        } else if (slope < -params.sigma * 0.1) {
          trend = 'decreasing';
        }
      }
      
      let changePoint = false;
      if (i > 0) {
        const prevPoint = data[i - 1];
        changePoint = (!prevPoint.isOutOfControl && isOutOfControl) ||
                     (Math.abs(cusumHigh - (prevPoint.cusumHigh || 0)) > params.h / 2) ||
                     (Math.abs(cusumLow - (prevPoint.cusumLow || 0)) > params.h / 2);
      }

      data.push({
        index: i + 1,
        value: rawData[i],
        cusumHigh,
        cusumHighOutOfControl: cusumHigh > params.h ? cusumHigh : undefined, // 只有超限时才设置值
        cusumLow,
        cusumLowOutOfControl: cusumLow < -params.h ? cusumLow : undefined, // 只有超限时才设置值
        upperLimit: params.h,
        lowerLimit: -params.h,
        isOutOfControl,
        changePoint,
        deviation,
        cusumMagnitude,
        signalStrength,
        trend
      });
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
    
    // 根据数据量调整图表高度
    let chartHeight;
    if (chartData.length > 100) {
      chartHeight = 600;
    } else if (chartData.length > 50) {
      chartHeight = 550;
    } else {
      chartHeight = 500;
    }
    
    // 智能数值格式化精度
    const range = Math.abs(params.h * 2);
    let precision;
    if (range < 1) {
      precision = 3;
    } else if (range < 10) {
      precision = 2;
    } else {
      precision = 1;
    }
    
    return {
      yDomain,
      xInterval,
      dotInterval,
      chartHeight,
      precision
    };
  }, [chartData, params.h]);

  // 分析结果
  const analysisResults = useMemo(() => {
    const outOfControlPoints = chartData.filter(point => point.isOutOfControl);
    const changePoints = chartData.filter(point => point.changePoint);
    
    const runLengths: number[] = [];
    let currentRun = 0;
    
    for (const point of chartData) {
      currentRun++;
      if (point.isOutOfControl) {
        runLengths.push(currentRun);
        currentRun = 0;
      }
    }
    
    const avgRunLength = runLengths.length > 0 
      ? runLengths.reduce((sum, length) => sum + length, 0) / runLengths.length 
      : chartData.length;

    return {
      outOfControlPoints,
      changePoints,
      avgRunLength: avgRunLength.toFixed(1),
      totalRuns: runLengths.length
    };
  }, [chartData]);

  // 统计信息
  const statistics = useMemo(() => {
    if (chartData.length === 0) return null;

    const cusumHighValues = chartData.map(d => d.cusumHigh);
    const cusumLowValues = chartData.map(d => d.cusumLow);
    const magnitudes = chartData.map(d => d.cusumMagnitude);
    const originalValues = chartData.map(d => d.value);
    
    const maxCusumHigh = Math.max(...cusumHighValues);
    const minCusumLow = Math.min(...cusumLowValues);
    const avgMagnitude = magnitudes.reduce((sum, mag) => sum + mag, 0) / magnitudes.length;
    
    const processMean = originalValues.reduce((sum, val) => sum + val, 0) / originalValues.length;
    const processStdDev = Math.sqrt(originalValues.reduce((sum, val) => sum + Math.pow(val - processMean, 2), 0) / originalValues.length);
    
    const USL = params.target + 3 * params.sigma;
    const LSL = params.target - 3 * params.sigma;
    const specWidth = USL - LSL;
    const processWidth = 6 * processStdDev;
    
    const cp = specWidth / processWidth;
    const cpuIndex = (USL - processMean) / (3 * processStdDev);
    const cplIndex = (processMean - LSL) / (3 * processStdDev);
    const cpk = Math.min(cpuIndex, cplIndex);
    
    const pp = cp;
    const ppk = cpk;
    const sigmaLevel = cpk * 3 + 1.5;
    const defectRate = 2 * (1 - 0.5 * (1 + Math.sign(cpk * 3) * Math.sqrt(1 - Math.exp(-2 * Math.pow(cpk * 3, 2) / Math.PI))));
    
    const highSignalCount = chartData.filter(d => d.signalStrength === 'high').length;
    const detectionEfficiency = chartData.length > 0 ? (highSignalCount / chartData.length) * 100 : 0;
    
    const trendChanges = chartData.filter((d, i) => {
      if (i === 0) return false;
      return d.trend !== chartData[i - 1].trend;
    }).length;
    const stabilityIndex = chartData.length > 0 ? Math.max(0, 100 - (trendChanges / chartData.length) * 100) : 100;
    
    return {
      maxCusumHigh: maxCusumHigh.toFixed(3),
      minCusumLow: minCusumLow.toFixed(3),
      outOfControlRate: ((analysisResults.outOfControlPoints.length / chartData.length) * 100).toFixed(1),
      avgRunLength: analysisResults.avgRunLength,
      avgMagnitude: avgMagnitude.toFixed(3),
      detectionEfficiency: detectionEfficiency.toFixed(1),
      stabilityIndex: stabilityIndex.toFixed(1),
      processCapability: {
        cp: cp,
        cpk: cpk,
        pp: pp,
        ppk: ppk,
        sigmaLevel: sigmaLevel,
        defectRate: defectRate
      }
    };
  }, [chartData, analysisResults, params.sigma, params.target]);

  const handleParamChange = (key: keyof CUSUMParams, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const autoSetParams = () => {
    setParams(prev => ({
      ...prev,
      k: prev.sigma * 0.5,
      h: prev.sigma * 4
    }));
    toast.success('已自动设置k和h参数');
  };

  const handleExport = () => {
    toast.success('图表导出功能开发中...');
  };

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
              <span className="text-gray-600">上侧CUSUM:</span>
              <span className="font-medium text-green-600">{data.cusumHigh?.toFixed(3)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">下侧CUSUM:</span>
              <span className="font-medium text-red-600">{data.cusumLow?.toFixed(3)}</span>
            </div>
            
            {(data.isOutOfControl || data.changePoint) && (
              <div className="border-t border-red-100 pt-2 mt-2">
                {data.isOutOfControl && (
                  <p className="text-red-600 font-medium text-xs flex items-center">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    超出控制限
                  </p>
                )}
                {data.changePoint && (
                  <p className="text-orange-600 font-medium text-xs flex items-center">
                    <Zap className="w-3 h-3 mr-1" />
                    检测到变化点
                  </p>
                )}
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">CUSUM控制图</h1>
            <p className="text-gray-600">累积和控制图，对过程均值的微小变化更加敏感</p>
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
                {selectedVariable ? selectedVariable.name : '选择变量'}
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
                          onClick={() => handleVariableChange(variable)}
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">CUSUM参数配置</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">参考值 (k)</label>
              <input
                type="number"
                value={params.k}
                onChange={(e) => handleParamChange('k', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5b9bd5] focus:border-transparent"
                step="0.1"
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">决策区间 (h)</label>
              <input
                type="number"
                value={params.h}
                onChange={(e) => handleParamChange('h', parseFloat(e.target.value) || 0)}
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
                checked={showBothSides}
                onChange={(e) => setShowBothSides(e.target.checked)}
                className="mr-2 rounded"
              />
              <span className="text-sm text-gray-700">显示双侧CUSUM</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={params.fastInitialResponse}
                onChange={(e) => setParams(prev => ({ ...prev, fastInitialResponse: e.target.checked }))}
                className="mr-2 rounded"
              />
              <span className="text-sm text-gray-700">快速初始响应 (FIR)</span>
            </label>
          </div>
        </div>
      )}

      {/* 统计信息 */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{statistics.maxCusumHigh}</div>
                <div className="text-sm text-gray-600">最大上侧CUSUM</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <TrendingDown className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{statistics.minCusumLow}</div>
                <div className="text-sm text-gray-600">最小下侧CUSUM</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{statistics.avgMagnitude}</div>
                <div className="text-sm text-gray-600">平均CUSUM幅度</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{statistics.detectionEfficiency}%</div>
                <div className="text-sm text-gray-600">检测效率</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSUM控制图 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-blue-600" />
            CUSUM控制图
          </h2>
          <div className="text-sm text-gray-600">
            样本数: {chartData.length} | 异常点: {analysisResults.outOfControlPoints.length} | 变化点: {analysisResults.changePoints.length}
          </div>
        </div>
        
        <div style={{ height: `${adaptiveParams.chartHeight}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 50, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              
              {/* 警告区域和危险区域已取消 */}
              
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
                domain={adaptiveParams.yDomain}
                tickFormatter={(value) => value.toFixed(adaptiveParams.precision)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* 控制限 */}
              <ReferenceLine y={params.h} stroke="#dc2626" strokeDasharray="5 5" strokeWidth={2} />
              <ReferenceLine y={-params.h} stroke="#dc2626" strokeDasharray="5 5" strokeWidth={2} />
              <ReferenceLine y={0} stroke="#374151" strokeWidth={1} />
              
              {/* 上侧CUSUM - 正常部分 */}
              <Line 
                type="monotone" 
                dataKey="cusumHigh" 
                stroke="#3b82f6" 
                strokeWidth={chartData.length > 100 ? 1.5 : 2}
                strokeOpacity={chartData.length > 100 ? 0.8 : 1}
                name="上侧CUSUM(正常)"
                dot={(props: any) => {
                  const { cx, cy, payload, index } = props;
                  if (!payload) return null;
                  
                  // 只在正常范围内显示蓝色点
                  const isOutOfControl = payload.cusumHigh > params.h;
                  if (isOutOfControl) return null;
                  
                  const shouldShowDot = index % adaptiveParams.dotInterval === 0;
                  const size = chartData.length > 100 ? 1.5 : 2;
                  
                  return shouldShowDot ? 
                    <circle key={`cusum-high-normal-${index}`} cx={cx} cy={cy} r={size} fill="#3b82f6" stroke="#fff" strokeWidth={0.5} /> : 
                    null;
                }}
                connectNulls={false}
              />
              
              {/* 上侧CUSUM - 超限部分 */}
              <Line 
                type="monotone" 
                dataKey="cusumHighOutOfControl" 
                stroke="#dc2626" 
                strokeWidth={chartData.length > 100 ? 1.5 : 2}
                strokeOpacity={chartData.length > 100 ? 0.8 : 1}
                name="上侧CUSUM(超限)"
                dot={(props: any) => {
                  const { cx, cy, payload, index } = props;
                  if (!payload || !payload.cusumHighOutOfControl) return null;
                  
                  const shouldShowDot = payload.isOutOfControl || 
                                       payload.changePoint || 
                                       payload.signalStrength === 'high' ||
                                       (index % adaptiveParams.dotInterval === 0);
                  
                  if (!shouldShowDot) return null;
                  
                  let size = chartData.length > 100 ? 2.5 : 3;
                  
                  if (payload.changePoint) {
                    return <circle key={`cusum-high-out-${index}`} cx={cx} cy={cy} r={size + 1} fill="#ea580c" stroke="#fff" strokeWidth={1} />;
                  }
                  
                  return <circle key={`cusum-high-out-${index}`} cx={cx} cy={cy} r={size} fill="#dc2626" stroke="#fff" strokeWidth={0.5} />;
                }}
                connectNulls={false}
              />
              
              {/* 下侧CUSUM - 正常部分 */}
              {showBothSides && (
                <Line 
                  type="monotone" 
                  dataKey="cusumLow" 
                  stroke="#10b981" 
                  strokeWidth={chartData.length > 100 ? 1.5 : 2}
                  strokeOpacity={chartData.length > 100 ? 0.8 : 1}
                  name="下侧CUSUM(正常)"
                  dot={(props: any) => {
                    const { cx, cy, payload, index } = props;
                    if (!payload) return null;
                    
                    // 只在正常范围内显示绿色点
                    const isOutOfControl = payload.cusumLow < -params.h;
                    if (isOutOfControl) return null;
                    
                    const shouldShowDot = index % adaptiveParams.dotInterval === 0;
                    const size = chartData.length > 100 ? 1.5 : 2;
                    
                    return shouldShowDot ? 
                      <circle key={`cusum-low-normal-${index}`} cx={cx} cy={cy} r={size} fill="#10b981" stroke="#fff" strokeWidth={0.5} /> : 
                      null;
                  }}
                  connectNulls={false}
                />
              )}
              
              {/* 下侧CUSUM - 超限部分 */}
              {showBothSides && (
                <Line 
                  type="monotone" 
                  dataKey="cusumLowOutOfControl" 
                  stroke="#dc2626" 
                  strokeWidth={chartData.length > 100 ? 1.5 : 2}
                  strokeOpacity={chartData.length > 100 ? 0.8 : 1}
                  name="下侧CUSUM(超限)"
                  dot={(props: any) => {
                    const { cx, cy, payload, index } = props;
                    if (!payload || !payload.cusumLowOutOfControl) return null;
                    
                    const shouldShowDot = payload.isOutOfControl || 
                                         payload.changePoint || 
                                         payload.signalStrength === 'high' ||
                                         (index % adaptiveParams.dotInterval === 0);
                    
                    if (!shouldShowDot) return null;
                    
                    let size = chartData.length > 100 ? 2.5 : 3;
                    
                    if (payload.changePoint) {
                      return <circle key={`cusum-low-out-${index}`} cx={cx} cy={cy} r={size + 1} fill="#ea580c" stroke="#fff" strokeWidth={1} />;
                    }
                    
                    return <circle key={`cusum-low-out-${index}`} cx={cx} cy={cy} r={size} fill="#dc2626" stroke="#fff" strokeWidth={0.5} />;
                  }}
                  connectNulls={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 过程能力分析 */}
      {statistics && (
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
                <div className="text-2xl font-bold text-blue-600">{statistics.processCapability.cp.toFixed(3)}</div>
                <div className="text-sm text-gray-600 mt-1">Cp (潜在能力)</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{statistics.processCapability.cpk.toFixed(3)}</div>
                <div className="text-sm text-gray-600 mt-1">Cpk (实际能力)</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">{statistics.processCapability.pp.toFixed(3)}</div>
                <div className="text-sm text-gray-600 mt-1">Pp (总体能力)</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-orange-600">{statistics.processCapability.ppk.toFixed(3)}</div>
                <div className="text-sm text-gray-600 mt-1">Ppk (总体性能)</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 趋势分析结果 */}
      {analysisResults.changePoints.length > 0 && (
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
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">上侧CUSUM</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">下侧CUSUM</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">类型</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analysisResults.changePoints.map((point) => (
                      <tr key={point.index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">{point.index}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{point.cusumHigh.toFixed(3)}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{point.cusumLow.toFixed(3)}</td>
                        <td className="px-4 py-2">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                            {point.cusumHigh > params.h ? '向上偏移' : point.cusumLow < -params.h ? '向下偏移' : '趋势变化'}
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
                  <div className="text-lg font-bold text-blue-600">{statistics?.avgRunLength}</div>
                  <div className="text-xs text-blue-700">较小的ARL表示能更快检测到过程变化</div>
                </div>
                
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-sm font-medium text-green-900">检测效率</div>
                  <div className="text-lg font-bold text-green-600">
                    {analysisResults.totalRuns > 0 ? '良好' : '优秀'}
                  </div>
                  <div className="text-xs text-green-700">
                    {analysisResults.totalRuns > 0 
                      ? `检测到${analysisResults.totalRuns}次过程变化` 
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

export default CUSUMChart;