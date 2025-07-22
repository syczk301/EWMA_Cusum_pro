import React, { useState, useCallback, useEffect } from 'react';
import { Upload, FileSpreadsheet, Search, Download, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { cn } from '../lib/utils';
import { useDataStore } from '../store/dataStore';
import { readExcelFile, ExcelReadResult } from '../utils/dataUtils';

interface DataRow {
  id: number;
  timestamp: string;
  value: number;
  batch?: string;
  operator?: string;
}

const DataManagement: React.FC = () => {
  const { 
    rawData, 
    setRawData, 
    availableVariables, 
    setAvailableVariables, 
    selectedVariable, 
    setSelectedVariable,
    setUploadedFile 
  } = useDataStore();
  
  const [data, setData] = useState<DataRow[]>([]);
  const [filteredData, setFilteredData] = useState<DataRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [dragActive, setDragActive] = useState(false);

  const [autoLoaded, setAutoLoaded] = useState(false);

  // 处理文件上传
  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('请上传Excel文件（.xlsx或.xls格式）');
      return;
    }

    setLoading(true);
    try {
      // 使用新的Excel读取功能
      const result: ExcelReadResult = await readExcelFile(file);
      
      // 更新数据存储
      setRawData(result.dataPoints);
      
      // 合并默认变量和识别的变量，避免重复
      const existingVariableIds = availableVariables.map(v => v.id);
      const newVariables = result.variables.filter(v => !existingVariableIds.includes(v.id));
      
      // 更新已存在的默认变量信息（如果Excel中有对应的列）
      const updatedVariables = availableVariables.map(existingVar => {
        const matchingVar = result.variables.find(v => v.id === existingVar.id);
        if (matchingVar) {
          return { ...existingVar, columnIndex: matchingVar.columnIndex };
        }
        return existingVar;
      });
      
      const mergedVariables = [...updatedVariables, ...newVariables];
      setAvailableVariables(mergedVariables);
      
      // 自动选择克重变量作为默认变量
      // 如果之前有选中的变量且仍然存在，保持选中状态
      if (selectedVariable && mergedVariables.find(v => v.id === selectedVariable.id)) {
        // 保持当前选择
      } else {
        // 查找克重变量并设为默认选择
        const gramWeightVariable = mergedVariables.find(v => 
          v.name.includes('克重') || 
          v.name.includes('定量') || 
          v.name.toLowerCase().includes('weight') ||
          v.name.toLowerCase().includes('gsm')
        );
        
        if (gramWeightVariable) {
          setSelectedVariable(gramWeightVariable);
        } else if (mergedVariables.length > 0) {
          // 如果没有找到克重变量，选择第一个变量
          setSelectedVariable(mergedVariables[0]);
        }
      }
      
      // 转换为本地显示格式
      const processedData: DataRow[] = result.dataPoints.map((point, index) => ({
        id: index + 1,
        timestamp: point.timestamp.split('T')[0],
        value: point.value,
        batch: point.subgroup,
        operator: '系统导入'
      }));

      setData(processedData);
      setFilteredData(processedData);
      
      // 将文件保存到数据存储中
      setUploadedFile(file);
      
      toast.success(`成功导入 ${result.dataPoints.length} 条数据，识别到 ${result.variables.length} 个新变量，当前共有 ${mergedVariables.length} 个变量`);
    } catch (error) {
      console.error('文件解析错误:', error);
      toast.error(error instanceof Error ? error.message : '文件解析失败，请检查文件格式');
    } finally {
      setLoading(false);
    }
  }, [setRawData, setAvailableVariables, setSelectedVariable]);

  // 修复自动加载的依赖
  const autoLoadPaperDataFixed = useCallback(async () => {
    if (autoLoaded) return;
    
    try {
      setLoading(true);
      // 尝试获取paper.xlsx文件
      const response = await fetch('/paper.xlsx');
      if (!response.ok) {
        console.log('paper.xlsx文件不存在，跳过自动加载');
        return;
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const file = new File([arrayBuffer], 'paper.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      await handleFileUpload(file);
      setAutoLoaded(true);
      toast.success('已自动加载paper.xlsx数据文件');
    } catch (error) {
      console.log('自动加载paper.xlsx失败:', error);
    } finally {
      setLoading(false);
    }
  }, [autoLoaded, handleFileUpload]);

  // 组件挂载时自动加载数据
  useEffect(() => {
    autoLoadPaperDataFixed();
  }, [autoLoadPaperDataFixed]);

  // 拖拽处理
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  // 搜索和筛选
  const handleSearch = useCallback(() => {
    let filtered = data;

    if (searchTerm) {
      filtered = filtered.filter(row => 
        row.batch?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.operator?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (dateRange.start) {
      filtered = filtered.filter(row => row.timestamp >= dateRange.start);
    }

    if (dateRange.end) {
      filtered = filtered.filter(row => row.timestamp <= dateRange.end);
    }

    setFilteredData(filtered);
  }, [data, searchTerm, dateRange]);

  // 数据预处理
  const handleDataPreprocessing = () => {
    if (data.length === 0) {
      toast.error('请先导入数据');
      return;
    }

    // 简单的异常值检测和处理
    const values = data.map(row => row.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const std = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
    const threshold = 3; // 3σ原则

    const processedData = data.map(row => {
      const isOutlier = Math.abs(row.value - mean) > threshold * std;
      return {
        ...row,
        value: isOutlier ? mean : row.value // 异常值替换为均值
      };
    });

    setData(processedData);
    setFilteredData(processedData);
    toast.success('数据预处理完成，已处理异常值');
  };

  // 导出数据
  const handleExport = () => {
    if (filteredData.length === 0) {
      toast.error('没有数据可导出');
      return;
    }

    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Quality Data');
    XLSX.writeFile(wb, `quality_data_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('数据导出成功');
  };

  // 清空数据
  const handleClearData = () => {
    setData([]);
    setFilteredData([]);
    setRawData([]);
    
    // 重置为默认的5个变量，使用唯一ID避免冲突
    const defaultVariables = [
      {
        id: 'default_thickness',
        name: '厚度',
        description: '成纸厚度测量值',
        unit: 'mm',
        type: 'continuous' as const
      },
      {
        id: 'default_moisture',
        name: '水分含量',
        description: '成纸水分含量百分比',
        unit: '%',
        type: 'continuous' as const
      },
      {
        id: 'default_tensile_strength',
        name: '抗张强度',
        description: '成纸抗张强度测量值',
        unit: 'N·m/g',
        type: 'continuous' as const
      },
      {
        id: 'default_brightness',
        name: '白度',
        description: '成纸白度测量值',
        unit: '%ISO',
        type: 'continuous' as const
      },
      {
        id: 'default_smoothness',
        name: '平滑度',
        description: '成纸表面平滑度',
        unit: 'ml/min',
        type: 'continuous' as const
      }
    ];
    
    setAvailableVariables(defaultVariables);
    setSelectedVariable(null);
    setUploadedFile(null);
    
    toast.success('数据已清空，变量已重置为默认状态');
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">数据管理</h1>
        <p className="text-gray-600">导入Excel数据文件，进行数据预处理和质量分析</p>
      </div>

      {/* 数据导入区域 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">数据导入</h2>
        
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
            dragActive ? "border-[#5b9bd5] bg-blue-50" : "border-gray-300 hover:border-[#5b9bd5]"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">
            拖拽Excel文件到此处，或点击选择文件
          </p>
          <p className="text-sm text-gray-500 mb-4">
            支持 .xlsx 和 .xls 格式，文件大小不超过10MB
          </p>
          
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
            className="hidden"
            id="file-upload"
          />
          
          <label
            htmlFor="file-upload"
            className="inline-flex items-center px-4 py-2 bg-[#1f4e79] text-white rounded-lg hover:bg-[#1a4066] cursor-pointer transition-colors"
          >
            <Upload className="h-4 w-4 mr-2" />
            选择文件
          </label>
        </div>

        {loading && (
          <div className="mt-4 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1f4e79]"></div>
            <span className="ml-2 text-gray-600">正在处理文件...</span>
          </div>
        )}
      </div>

      {/* 变量信息显示 */}
      {availableVariables.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">可用变量</h2>
            <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
              共 {availableVariables.length} 个变量
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableVariables.map((variable) => (
              <div 
                key={variable.id} 
                className={cn(
                  "p-4 border rounded-lg transition-colors cursor-pointer",
                  selectedVariable?.id === variable.id 
                    ? "border-blue-500 bg-blue-50" 
                    : "border-gray-200 hover:border-gray-300"
                )}
                onClick={() => setSelectedVariable(variable)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{variable.name}</h3>
                  {selectedVariable?.id === variable.id && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">当前选择</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-1">{variable.description}</p>
                <p className="text-xs text-gray-500">单位: {variable.unit}</p>
              </div>
            ))}
          </div>
          
          {selectedVariable && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">当前分析变量</h3>
              <p className="text-sm text-blue-800">
                正在分析: <strong>{selectedVariable.name}</strong> ({selectedVariable.unit})
              </p>
              <p className="text-xs text-blue-600 mt-1">{selectedVariable.description}</p>
            </div>
          )}
        </div>
      )}

      {/* 数据预处理 */}
      {data.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">数据预处理</h2>
          
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleDataPreprocessing}
              className="flex items-center px-4 py-2 bg-[#5b9bd5] text-white rounded-lg hover:bg-[#4a8bc2] transition-colors"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              异常值处理
            </button>
            
            <button
              onClick={handleClearData}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              清空数据
            </button>
          </div>
        </div>
      )}

      {/* 数据查询和筛选 */}
      {data.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">数据查询</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">搜索关键词</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="批次号、操作员..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5b9bd5] focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5b9bd5] focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5b9bd5] focus:border-transparent"
              />
            </div>
            
            <div className="flex items-end gap-2">
              <button
                onClick={handleSearch}
                className="flex items-center px-4 py-2 bg-[#1f4e79] text-white rounded-lg hover:bg-[#1a4066] transition-colors"
              >
                <Search className="h-4 w-4 mr-2" />
                搜索
              </button>
              
              <button
                onClick={handleExport}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                导出
              </button>
            </div>
          </div>

          {/* 数据统计 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{filteredData.length}</div>
              <div className="text-sm text-blue-800">总记录数</div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {filteredData.length > 0 ? (filteredData.reduce((sum, row) => sum + row.value, 0) / filteredData.length).toFixed(2) : '0'}
              </div>
              <div className="text-sm text-green-800">平均值</div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {filteredData.length > 0 ? Math.max(...filteredData.map(row => row.value)).toFixed(2) : '0'}
              </div>
              <div className="text-sm text-yellow-800">最大值</div>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {filteredData.length > 0 ? Math.min(...filteredData.map(row => row.value)).toFixed(2) : '0'}
              </div>
              <div className="text-sm text-red-800">最小值</div>
            </div>
          </div>

          {/* 数据表格 */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">序号</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">数值</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">批次</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作员</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.slice(0, 100).map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.timestamp}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.value.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.batch}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.operator}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredData.length > 100 && (
              <div className="text-center py-4 text-gray-500">
                显示前100条记录，共{filteredData.length}条
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataManagement;