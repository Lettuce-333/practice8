# 迷你版校园信息中心（前端技术整合案例复现）

## 项目简介
课堂八整合练习：Bootstrap 页面 + jQuery 筛选交互 + ECharts 统计图表 + A-Frame 三维导览。

## 运行方法
需要本地服务器（file:// 协议下 fetch 会被浏览器拦截）：
- VS Code 安装 Live Server 后：右键 index.html → Open with Live Server

## 目录说明
integration/
├── index.html          统一入口
├── css/style.css       自定义样式（在 Bootstrap 之后引入）
├── js/app.js           交互与图表逻辑
├── data/data.json      自习室使用量数据
└── three-d/scene.html  校园三维导览页

## 数据与资源来源
- 自习室数据为课程示例数据（自编）
- Bootstrap 4.6.2 / jQuery 3.7.1 / ECharts 5.5.1 / A-Frame 1.5.0，均引自 BootCDN