# 更新日志 (Changelog)

本文件记录 Vision-PPT 视觉检测配置系统的版本变更。

---

## [1.3.0] - 2026-04-13

### 新增
- **光学计算模块扩展** (`imagingCalculations.ts`)
  - 倍率计算 `calculateMagnification`
  - 景深计算 `calculateDepthOfField`（经典 DoF 公式）
  - 焦距推荐 `recommendFocalLength`（WD + FOV → 焦距）
  - 靶面反推视野 `calculateFOVFromSensor`（传感器 + 焦距 + WD → FOV）
  - 导出 `SENSOR_WIDTH_MAP` 常量和 `parseSensorSize` 工具函数
- **飞拍计算模块** (`flyingShotCalculations.ts`)
  - 运动模糊量计算
  - 最大允许曝光时间
  - 编码器分频系数
  - 线阵行频 / 面阵飞拍触发频率
  - 推荐触发间距
- **节拍计算模块** (`cycleTimeCalculations.ts`)
  - 工位节拍分解（上下料、机构运动、IO、拍照、传输、处理）
  - 可行性判断与裕量计算
  - 瓶颈识别
  - 理论产能计算
- **ModuleStep3Imaging 联动增强**
  - 自动读取相机传感器尺寸、镜头焦距参与计算
  - 显示倍率、景深、推荐焦距、推算 WD、靶面反推 FOV
  - 飞拍分析卡片（编码器/连续触发时自动展示）
- **ModuleStep1Basic 飞拍字段**
  - 编码器/连续触发时显示线体速度输入
- **WorkstationForm 节拍分析**
  - 工位信息步骤内嵌节拍分析卡片
  - 实时显示预估耗时、裕量、瓶颈、理论产能
- **PPT 光学方案页增强**
  - 工作距离/倍率/景深 四列表格输出

### 变更
- `ImagingCalculationInput` 新增 `workingDistanceInput`、`fNumber` 字段
- `ImagingCalculationResult` 新增 `magnification`、`recommendedFocalLength`、`depthOfField`、`fovFromSensor` 字段
- `calculateWorkingDistance` 改用共享 `SENSOR_WIDTH_MAP` 常量

---

## [1.2.0] - 初始版本

- 项目/工位/模块三级数据管理
- 相机/镜头/光源/控制器硬件库
- 拖拽布局画布（2D 三视图 + 等轴测）
- 3D 产品预览与 GLB 导出
- PPT / PDF / Word 报告导出
- 基于 Supabase 的数据持久化与离线缓存
- AI 辅助填表
- 管理员后台（硬件管理、模板管理）
