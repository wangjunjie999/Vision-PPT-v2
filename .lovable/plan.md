
# 创建全覆盖测试项目：半导体芯片封装视觉检测系统

## 目标

通过数据库直接插入一个完整的模拟项目，覆盖系统所有表单字段、全部5种模块类型（defect/positioning/ocr/measurement/deeplearning）、机械布局配置、以及光学方案参数，用于端到端测试。

## 项目设计

**项目**: 半导体芯片封装外观检测系统
- 编号: DB260301
- 客户: 长电科技
- 工艺: 总装检测
- 包含环境条件、质量策略等完整字段

**工位规划**（5个工位，每个对应一种模块类型）：

| 工位 | 类型 | 模块类型 | 检测内容 |
|------|------|----------|----------|
| WS-SC-01 引线框架定位工位 | line | positioning | 芯片引脚定位引导 |
| WS-SC-02 焊点外观检测工位 | turntable | defect | 焊点裂纹/虚焊检测 |
| WS-SC-03 标记字符识别工位 | line | ocr | 芯片批次号/型号识别 |
| WS-SC-04 封装尺寸测量工位 | platform | measurement | 引脚间距/共面性测量 |
| WS-SC-05 AI异常检测工位 | robot | deeplearning | 深度学习异常检测 |

## 数据内容

每个工位将包含：
1. **完整工位表单字段**: code, name, type, cycle_time, product_dimensions, install_space, enclosed, process_stage, observation_target 等
2. **机械布局 (mechanical_layouts)**: 含 mechanisms JSON, camera_mounts, selected_cameras/lenses/lights, layout_objects, 三视图标记
3. **功能模块 (function_modules)**: 完整的 type-specific config（positioning_config, defect_config, ocr_config, measurement_config, deep_learning_config），含成像参数（FOV, working distance, resolution per pixel）、硬件选择、ROI策略、输出类型等

## 实现步骤

1. **插入项目记录** - projects 表，填充所有字段
2. **插入5个工位记录** - workstations 表，每个工位填充不同的 type 和完整参数
3. **插入5个机械布局** - mechanical_layouts 表，每个工位对应一个布局，包含 mechanisms JSON 和硬件选择
4. **插入5个功能模块** - function_modules 表，每种类型一个，包含完整的检测配置 JSON 和成像参数

## 技术细节

- 所有记录的 user_id 将使用当前登录用户的 ID（需要先查询确认）
- 使用 SQL 迁移工具批量插入数据
- 各 config JSON 将包含视野参数（fieldOfView, workingDistance, resolutionPerPixel）以测试 PPT 中视野参数显示
- 不会修改任何现有代码，仅插入测试数据

## 验证范围

插入数据后可验证：
- 项目表单所有字段的加载和编辑
- 工位表单（4种工位类型）
- 模块表单（5种检测类型的专属配置表单）
- 机械布局画布的渲染
- PPT 生成（含封面、布局图、光学方案、视野参数、硬件清单）
- 数据完整性检查（pptReadiness）
