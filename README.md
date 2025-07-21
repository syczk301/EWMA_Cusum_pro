# SPC成纸质量管理系统

## 📋 项目简介

本系统是一个基于统计过程控制（SPC）的成纸质量管理系统，专注于造纸行业的质量监控和分析。系统采用EWMA（指数加权移动平均）和CUSUM（累积和控制图）方法进行质量数据分析，帮助企业实时监控生产过程，及时发现质量异常，提升产品质量稳定性。

## ✨ 核心功能

### 🎯 主要模块

- **📊 数据管理** - 数据导入、预处理、历史数据查询
- **📈 EWMA控制图** - EWMA图表生成、参数配置、异常检测
- **📉 CUSUM控制图** - CUSUM图表生成、参数设置、趋势分析
- **🔍 质量分析** - 综合分析报告、统计指标计算、质量评估
- **🚨 报警管理** - 异常报警设置、报警历史、通知管理
- **⚙️ 系统设置** - 用户管理、参数配置、系统维护

### 👥 用户角色

| 角色 | 权限 |
|------|------|
| 质量工程师 | 数据录入、图表查看、报告生成、参数设置 |
| 生产主管 | 查看控制图、异常报警、趋势分析 |
| 系统管理员 | 用户管理、系统配置、数据备份 |

## 🛠️ 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite 6
- **UI框架**: Tailwind CSS
- **图表库**: Recharts
- **路由**: React Router DOM
- **状态管理**: Zustand
- **图标**: Lucide React
- **通知**: Sonner
- **数据处理**: XLSX

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm 或 pnpm

### 安装依赖

```bash
# 使用 npm
npm install

# 或使用 pnpm
pnpm install
```

### 启动开发服务器

```bash
# 使用 npm
npm run dev

# 或使用 pnpm
pnpm dev
```

访问 [http://localhost:5173](http://localhost:5173) 查看应用

### 构建生产版本

```bash
# 使用 npm
npm run build

# 或使用 pnpm
pnpm build
```

### 代码检查

```bash
# TypeScript 类型检查
npm run check

# ESLint 代码检查
npm run lint
```

## 📁 项目结构

```
src/
├── components/          # 公共组件
│   ├── Layout.tsx      # 布局组件
│   └── Empty.tsx       # 空状态组件
├── pages/              # 页面组件
│   ├── Home.tsx        # 首页
│   ├── DataManagement.tsx    # 数据管理
│   ├── EWMAChart.tsx   # EWMA控制图
│   ├── CUSUMChart.tsx  # CUSUM控制图
│   ├── QualityAnalysis.tsx   # 质量分析
│   ├── AlarmManagement.tsx   # 报警管理
│   └── SystemSettings.tsx    # 系统设置
├── store/              # 状态管理
│   └── dataStore.ts    # 数据存储
├── utils/              # 工具函数
│   └── dataUtils.ts    # 数据处理工具
├── hooks/              # 自定义钩子
│   └── useTheme.ts     # 主题钩子
└── lib/                # 库文件
    └── utils.ts        # 通用工具
```

## 🎨 设计规范

### 色彩方案
- **主色调**: 深蓝色 (#1f4e79)
- **辅助色**: 浅蓝色 (#5b9bd5)
- **背景色**: 渐变蓝色 (#1e40af 到 #60a5fa)

### 组件风格
- 卡片式布局
- 圆角矩形按钮
- 响应式设计
- 现代化界面

## 📊 功能特性

### 数据管理
- 支持 Excel 文件导入
- 数据格式验证
- 批量数据处理
- 数据清洗和预处理

### 控制图分析
- **EWMA控制图**: 指数加权移动平均分析
- **CUSUM控制图**: 累积和控制图分析
- 实时异常检测
- 参数自定义配置

### 质量分析
- 统计指标计算 (Cp, Cpk)
- 过程能力评估
- 趋势分析
- 报告生成和导出

### 报警系统
- 自定义报警规则
- 实时异常通知
- 报警历史记录
- 多级报警管理

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系我们

如有问题或建议，请通过以下方式联系：

- 项目地址: [https://github.com/syczk301/EWMA_Cusum_pro](https://github.com/syczk301/EWMA_Cusum_pro)
- 问题反馈: [Issues](https://github.com/syczk301/EWMA_Cusum_pro/issues)

---

**SPC成纸质量管理系统** - 让质量管理更智能、更高效！ 🚀
