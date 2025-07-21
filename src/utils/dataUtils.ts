import * as XLSX from 'xlsx';

// 数据点接口
export interface DataPoint {
  id: string;
  timestamp: string;
  value: number;
  sampleSize?: number;
  subgroup?: string;
}

// 统计结果接口
export interface StatisticsResult {
  mean: number;
  stdDev: number;
  variance: number;
  min: number;
  max: number;
  range: number;
  count: number;
  median: number;
  q1: number;
  q3: number;
  iqr: number;
}

// EWMA计算结果
export interface EWMAResult {
  ewma: number;
  ucl: number;
  lcl: number;
  isOutOfControl: boolean;
}

// CUSUM计算结果
export interface CUSUMResult {
  cusum: number;
  cusumPos: number;
  cusumNeg: number;
  ucl: number;
  lcl: number;
  isOutOfControl: boolean;
  changePoint?: number;
}

// 异常点检测结果
export interface OutlierResult {
  isOutlier: boolean;
  method: 'iqr' | 'zscore' | 'modified_zscore';
  score: number;
  threshold: number;
}

// 扩展的数据读取结果
export interface ExcelReadResult {
  dataPoints: DataPoint[];
  variables: Array<{
    id: string;
    name: string;
    description: string;
    unit: string;
    type: 'continuous' | 'discrete';
    columnIndex: number;
  }>;
}

/**
 * 从Excel文件读取数据并识别多个变量
 */
export const readExcelFile = (file: File): Promise<ExcelReadResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // 读取第一个工作表
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // 转换为JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        if (jsonData.length < 2) {
          throw new Error('Excel文件数据不足');
        }
        
        // 假设第一行是标题，从第二行开始是数据
        const headers = jsonData[0] as string[];
        const dataRows = jsonData.slice(1).filter(row => row && row.length > 0);
        
        // 查找时间戳列
        const timestampIndex = headers.findIndex(h => 
          h && (h.toLowerCase().includes('time') || h.toLowerCase().includes('date') || h.includes('时间') || h.includes('日期'))
        );
        
        // 识别所有数值列作为变量
        const variables: Array<{
          id: string;
          name: string;
          description: string;
          unit: string;
          type: 'continuous' | 'discrete';
          columnIndex: number;
        }> = [];
        
        headers.forEach((header, index) => {
          if (index === timestampIndex || !header) return; // 跳过时间戳列和空标题
          
          // 检查该列是否包含数值数据（至少50%的行有有效数值）
          const numericRows = dataRows.filter(row => 
            row[index] != null && 
            row[index] !== '' && 
            !isNaN(Number(row[index])) &&
            isFinite(Number(row[index]))
          );
          
          const numericRatio = numericRows.length / dataRows.length;
          
          if (numericRatio >= 0.5 && numericRows.length > 0) {
            const variableName = header.toString().trim();
            let description = '';
            let unit = '';
            
            // 根据列名推断变量类型和单位
            const lowerName = variableName.toLowerCase();
            if (lowerName.includes('厚度') || lowerName.includes('thickness')) {
              description = '纸张厚度';
              unit = 'μm';
            } else if (lowerName.includes('水分') || lowerName.includes('moisture')) {
              description = '纸张水分含量';
              unit = '%';
            } else if (lowerName.includes('强度') || lowerName.includes('strength') || lowerName.includes('tensile')) {
              description = '纸张抗张强度';
              unit = 'N·m/g';
            } else if (lowerName.includes('白度') || lowerName.includes('brightness')) {
              description = '纸张白度';
              unit = '%';
            } else if (lowerName.includes('平滑度') || lowerName.includes('smoothness')) {
              description = '纸张平滑度';
              unit = 's';
            } else if (lowerName.includes('密度') || lowerName.includes('density')) {
              description = '纸张密度';
              unit = 'g/cm³';
            } else if (lowerName.includes('重量') || lowerName.includes('weight') || lowerName.includes('basis')) {
              description = '纸张定量';
              unit = 'g/m²';
            } else if (lowerName.includes('ph') || lowerName.includes('酸碱')) {
              description = 'pH值';
              unit = '';
            } else if (lowerName.includes('温度') || lowerName.includes('temperature')) {
              description = '温度';
              unit = '°C';
            } else if (lowerName.includes('湿度') || lowerName.includes('humidity')) {
              description = '湿度';
              unit = '%';
            } else {
              description = `质量指标: ${variableName}`;
              unit = '单位';
            }
            
            // 根据变量名生成标准化的ID
            let variableId = '';
            const lowerNameForId = variableName.toLowerCase();
            if (lowerNameForId.includes('厚度') || lowerNameForId.includes('thickness')) {
              variableId = 'thickness';
            } else if (lowerNameForId.includes('水分') || lowerNameForId.includes('moisture')) {
              variableId = 'moisture';
            } else if (lowerNameForId.includes('强度') || lowerNameForId.includes('strength') || lowerNameForId.includes('tensile')) {
              variableId = 'tensile_strength';
            } else if (lowerNameForId.includes('白度') || lowerNameForId.includes('brightness')) {
              variableId = 'brightness';
            } else if (lowerNameForId.includes('平滑度') || lowerNameForId.includes('smoothness')) {
              variableId = 'smoothness';
            } else {
              // 对于其他变量，生成基于名称的ID
              variableId = variableName.toLowerCase().replace(/[^a-z0-9]/g, '_');
            }
            
            variables.push({
              id: variableId,
              name: variableName,
              description,
              unit,
              type: 'continuous' as const,
              columnIndex: index
            });
          }
        });
        
        if (variables.length === 0) {
          throw new Error('未找到有效的数值列，请确保Excel文件包含质量数据列');
        }
        
        // 使用第一个变量作为默认数据
        const defaultVariable = variables[0];
        const dataPoints: DataPoint[] = dataRows
          .filter(row => 
            row[defaultVariable.columnIndex] != null && 
            row[defaultVariable.columnIndex] !== '' &&
            !isNaN(Number(row[defaultVariable.columnIndex])) &&
            isFinite(Number(row[defaultVariable.columnIndex]))
          )
          .map((row, index) => ({
            id: `data_${index + 1}`,
            timestamp: timestampIndex !== -1 && row[timestampIndex] 
              ? formatTimestamp(row[timestampIndex])
              : new Date(Date.now() - (dataRows.length - index) * 60000).toISOString(),
            value: Number(row[defaultVariable.columnIndex]),
            sampleSize: 1,
            subgroup: `Group_${Math.floor(index / 5) + 1}` // 每5个数据点为一组
          }));
        
        if (dataPoints.length === 0) {
          throw new Error('没有有效的数据点');
        }
        
        resolve({ dataPoints, variables });
      } catch (error) {
        reject(new Error(`Excel文件解析失败: ${error instanceof Error ? error.message : '未知错误'}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * 根据变量从Excel数据中提取特定列的数据点
 */
export const extractDataForVariable = (
  file: File, 
  variableColumnIndex: number
): Promise<DataPoint[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        const headers = jsonData[0] as string[];
        const dataRows = jsonData.slice(1);
        
        const timestampIndex = headers.findIndex(h => 
          h && (h.toLowerCase().includes('time') || h.toLowerCase().includes('date') || h.includes('时间') || h.includes('日期'))
        );
        
        const dataPoints: DataPoint[] = dataRows
          .filter(row => row[variableColumnIndex] != null && !isNaN(Number(row[variableColumnIndex])))
          .map((row, index) => ({
            id: `data_${index + 1}`,
            timestamp: timestampIndex !== -1 && row[timestampIndex] 
              ? formatTimestamp(row[timestampIndex])
              : new Date(Date.now() - (dataRows.length - index) * 60000).toISOString(),
            value: Number(row[variableColumnIndex]),
            sampleSize: 1,
            subgroup: `Group_${Math.floor(index / 5) + 1}`
          }));
        
        resolve(dataPoints);
      } catch (error) {
        reject(new Error(`数据提取失败: ${error instanceof Error ? error.message : '未知错误'}`));
      }
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * 格式化时间戳
 */
const formatTimestamp = (value: any): string => {
  if (typeof value === 'number') {
    // Excel日期序列号转换
    const date = new Date((value - 25569) * 86400 * 1000);
    return date.toISOString();
  } else if (typeof value === 'string') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  } else {
    return new Date().toISOString();
  }
};

/**
 * 计算基本统计量
 */
export const calculateStatistics = (values: number[]): StatisticsResult => {
  if (values.length === 0) {
    throw new Error('数据为空');
  }
  
  const sortedValues = [...values].sort((a, b) => a - b);
  const n = values.length;
  const sum = values.reduce((acc, val) => acc + val, 0);
  const mean = sum / n;
  
  // 计算方差和标准差
  const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (n - 1);
  const stdDev = Math.sqrt(variance);
  
  // 计算分位数
  const q1Index = Math.floor(n * 0.25);
  const medianIndex = Math.floor(n * 0.5);
  const q3Index = Math.floor(n * 0.75);
  
  const q1 = sortedValues[q1Index];
  const median = n % 2 === 0 
    ? (sortedValues[medianIndex - 1] + sortedValues[medianIndex]) / 2
    : sortedValues[medianIndex];
  const q3 = sortedValues[q3Index];
  
  return {
    mean,
    stdDev,
    variance,
    min: sortedValues[0],
    max: sortedValues[n - 1],
    range: sortedValues[n - 1] - sortedValues[0],
    count: n,
    median,
    q1,
    q3,
    iqr: q3 - q1
  };
};

/**
 * 计算EWMA控制图
 */
export const calculateEWMA = (
  data: DataPoint[],
  lambda: number = 0.2,
  target: number,
  sigma: number,
  L: number = 3
): (DataPoint & EWMAResult)[] => {
  if (data.length === 0) return [];
  
  const results: (DataPoint & EWMAResult)[] = [];
  let ewma = target; // 初始EWMA值设为目标值
  
  // 计算控制限
  const sigmaEWMA = sigma * Math.sqrt(lambda / (2 - lambda));
  const ucl = target + L * sigmaEWMA;
  const lcl = target - L * sigmaEWMA;
  
  data.forEach((point, index) => {
    if (index === 0) {
      ewma = point.value; // 第一个点的EWMA值就是其本身
    } else {
      ewma = lambda * point.value + (1 - lambda) * ewma;
    }
    
    const isOutOfControl = ewma > ucl || ewma < lcl;
    
    results.push({
      ...point,
      ewma,
      ucl,
      lcl,
      isOutOfControl
    });
  });
  
  return results;
};

/**
 * 计算CUSUM控制图
 */
export const calculateCUSUM = (
  data: DataPoint[],
  target: number,
  sigma: number,
  k: number = 0.5,
  h: number = 5
): (DataPoint & CUSUMResult)[] => {
  if (data.length === 0) return [];
  
  const results: (DataPoint & CUSUMResult)[] = [];
  let cusumPos = 0;
  let cusumNeg = 0;
  
  // 计算参考值
  const kValue = k * sigma;
  const hValue = h * sigma;
  
  data.forEach((point, index) => {
    // 计算正向和负向CUSUM
    cusumPos = Math.max(0, cusumPos + (point.value - target) - kValue);
    cusumNeg = Math.max(0, cusumNeg - (point.value - target) - kValue);
    
    const cusum = cusumPos - cusumNeg;
    const isOutOfControl = cusumPos > hValue || cusumNeg > hValue;
    
    // 检测变点
    let changePoint: number | undefined;
    if (isOutOfControl && index > 0) {
      // 简单的变点检测：找到CUSUM开始偏离的点
      for (let i = index; i >= 0; i--) {
        if (results[i] && !results[i].isOutOfControl) {
          changePoint = i + 1;
          break;
        }
      }
    }
    
    results.push({
      ...point,
      cusum,
      cusumPos,
      cusumNeg,
      ucl: hValue,
      lcl: -hValue,
      isOutOfControl,
      changePoint
    });
  });
  
  return results;
};

/**
 * 异常值检测 - IQR方法
 */
export const detectOutliersIQR = (values: number[], multiplier: number = 1.5): OutlierResult[] => {
  const stats = calculateStatistics(values);
  const threshold = multiplier * stats.iqr;
  const lowerBound = stats.q1 - threshold;
  const upperBound = stats.q3 + threshold;
  
  return values.map(value => {
    const isOutlier = value < lowerBound || value > upperBound;
    const score = Math.min(
      Math.abs(value - lowerBound),
      Math.abs(value - upperBound)
    );
    
    return {
      isOutlier,
      method: 'iqr',
      score,
      threshold
    };
  });
};

/**
 * 异常值检测 - Z-Score方法
 */
export const detectOutliersZScore = (values: number[], threshold: number = 3): OutlierResult[] => {
  const stats = calculateStatistics(values);
  
  return values.map(value => {
    const score = Math.abs((value - stats.mean) / stats.stdDev);
    const isOutlier = score > threshold;
    
    return {
      isOutlier,
      method: 'zscore',
      score,
      threshold
    };
  });
};

/**
 * 异常值检测 - 修正Z-Score方法
 */
export const detectOutliersModifiedZScore = (values: number[], threshold: number = 3.5): OutlierResult[] => {
  const stats = calculateStatistics(values);
  const median = stats.median;
  
  // 计算MAD (Median Absolute Deviation)
  const deviations = values.map(value => Math.abs(value - median));
  const mad = calculateStatistics(deviations).median;
  
  return values.map(value => {
    const score = 0.6745 * (value - median) / mad;
    const isOutlier = Math.abs(score) > threshold;
    
    return {
      isOutlier,
      method: 'modified_zscore',
      score: Math.abs(score),
      threshold
    };
  });
};

/**
 * 数据预处理 - 移除异常值
 */
export const removeOutliers = (
  data: DataPoint[],
  method: 'iqr' | 'zscore' | 'modified_zscore' = 'iqr',
  threshold?: number
): { cleanData: DataPoint[]; removedData: DataPoint[]; outlierResults: OutlierResult[] } => {
  const values = data.map(d => d.value);
  
  let outlierResults: OutlierResult[];
  switch (method) {
    case 'iqr':
      outlierResults = detectOutliersIQR(values, threshold);
      break;
    case 'zscore':
      outlierResults = detectOutliersZScore(values, threshold);
      break;
    case 'modified_zscore':
      outlierResults = detectOutliersModifiedZScore(values, threshold);
      break;
    default:
      outlierResults = detectOutliersIQR(values);
  }
  
  const cleanData: DataPoint[] = [];
  const removedData: DataPoint[] = [];
  
  data.forEach((point, index) => {
    if (outlierResults[index].isOutlier) {
      removedData.push(point);
    } else {
      cleanData.push(point);
    }
  });
  
  return { cleanData, removedData, outlierResults };
};

/**
 * 数据插值 - 线性插值填补缺失值
 */
export const interpolateData = (data: DataPoint[]): DataPoint[] => {
  if (data.length < 2) return data;
  
  const result = [...data];
  
  for (let i = 1; i < result.length - 1; i++) {
    if (isNaN(result[i].value)) {
      // 找到前后有效值
      let prevIndex = i - 1;
      let nextIndex = i + 1;
      
      while (prevIndex >= 0 && isNaN(result[prevIndex].value)) {
        prevIndex--;
      }
      
      while (nextIndex < result.length && isNaN(result[nextIndex].value)) {
        nextIndex++;
      }
      
      if (prevIndex >= 0 && nextIndex < result.length) {
        // 线性插值
        const prevValue = result[prevIndex].value;
        const nextValue = result[nextIndex].value;
        const ratio = (i - prevIndex) / (nextIndex - prevIndex);
        result[i].value = prevValue + ratio * (nextValue - prevValue);
      }
    }
  }
  
  return result;
};

/**
 * 数据平滑 - 移动平均
 */
export const smoothData = (data: DataPoint[], windowSize: number = 5): DataPoint[] => {
  if (windowSize <= 1 || data.length < windowSize) return data;
  
  return data.map((point, index) => {
    const start = Math.max(0, index - Math.floor(windowSize / 2));
    const end = Math.min(data.length, start + windowSize);
    const window = data.slice(start, end);
    const smoothedValue = window.reduce((sum, p) => sum + p.value, 0) / window.length;
    
    return {
      ...point,
      value: smoothedValue
    };
  });
};

/**
 * 计算过程能力指数
 */
export const calculateProcessCapability = (
  values: number[],
  lsl: number, // 下规格限
  usl: number, // 上规格限
  target?: number // 目标值
) => {
  const stats = calculateStatistics(values);
  const mean = stats.mean;
  const stdDev = stats.stdDev;
  
  // Cp - 过程能力指数
  const cp = (usl - lsl) / (6 * stdDev);
  
  // Cpk - 过程能力指数（考虑偏移）
  const cpkUpper = (usl - mean) / (3 * stdDev);
  const cpkLower = (mean - lsl) / (3 * stdDev);
  const cpk = Math.min(cpkUpper, cpkLower);
  
  // Cpm - 目标过程能力指数（如果提供目标值）
  let cpm: number | undefined;
  if (target !== undefined) {
    const msd = stats.variance + Math.pow(mean - target, 2); // Mean Squared Deviation
    cpm = (usl - lsl) / (6 * Math.sqrt(msd));
  }
  
  // Pp 和 Ppk（长期过程性能指数，假设长期标准差为短期的1.5倍）
  const longTermStdDev = stdDev * 1.5;
  const pp = (usl - lsl) / (6 * longTermStdDev);
  const ppkUpper = (usl - mean) / (3 * longTermStdDev);
  const ppkLower = (mean - lsl) / (3 * longTermStdDev);
  const ppk = Math.min(ppkUpper, ppkLower);
  
  return {
    cp,
    cpk,
    cpm,
    pp,
    ppk,
    mean,
    stdDev,
    processSpread: 6 * stdDev,
    specSpread: usl - lsl
  };
};

/**
 * 导出数据为Excel格式
 */
export const exportToExcel = (data: any[], filename: string, sheetName: string = 'Sheet1') => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  // 生成Excel文件并下载
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

/**
 * 格式化数字显示
 */
export const formatNumber = (value: number, decimals: number = 2): string => {
  return value.toFixed(decimals);
};

/**
 * 格式化日期显示
 */
export const formatDate = (dateString: string, format: 'short' | 'long' = 'short'): string => {
  const date = new Date(dateString);
  
  if (format === 'short') {
    return date.toLocaleDateString('zh-CN');
  } else {
    return date.toLocaleString('zh-CN');
  }
};

/**
 * 生成颜色序列
 */
export const generateColors = (count: number): string[] => {
  const colors = [
    '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
    '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6b7280'
  ];
  
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(colors[i % colors.length]);
  }
  
  return result;
};

/**
 * 数据验证
 */
export const validateData = (data: DataPoint[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data || data.length === 0) {
    errors.push('数据为空');
    return { isValid: false, errors };
  }
  
  if (data.length < 3) {
    errors.push('数据点数量不足，至少需要3个数据点');
  }
  
  const invalidValues = data.filter(d => isNaN(d.value) || !isFinite(d.value));
  if (invalidValues.length > 0) {
    errors.push(`发现${invalidValues.length}个无效数值`);
  }
  
  const duplicateTimestamps = data.filter((d, index) => 
    data.findIndex(other => other.timestamp === d.timestamp) !== index
  );
  if (duplicateTimestamps.length > 0) {
    errors.push(`发现${duplicateTimestamps.length}个重复时间戳`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};