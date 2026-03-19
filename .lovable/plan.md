

# 修复 AI 指令填表功能 - 扩展字段映射

## 问题分析

测试命令 "完成DB260101项目的06工位的测量方法" 失败原因：

1. **字段映射不完整**：`ai-form-command` edge function 的 system prompt 中模块字段列表缺少测量相关字段（`measurementFieldOfView`, `targetAccuracy`, `systemAccuracy`, `measurementCalibrationMethod` 等）
2. **"测量方法"语义模糊**：AI 无法将自然语言 "测量方法" 映射到具体字段，因为 prompt 中没有列出这些字段
3. **缺少工位字段也不完整**：`environment_description` 等字段也未列出

## 修改方案

### 1. 更新 `supabase/functions/ai-form-command/index.ts`

扩展 system prompt 中的字段映射，覆盖所有表单实际字段：

**工位字段补充**：
- `environment_description` → 不存在于数据库，实际对应 `risk_notes` 或其他字段
- 补充 `acceptance_criteria`、`product_dimensions`、`install_space` 等

**模块字段补充**（按类型分组）：
- 通用字段：`detectionObject`, `communicationMethod`, `signalDefinition`, `workingDistance`, `fieldOfViewCommon`, `resolutionPerPixel`, `exposure`, `lightMode`, `lightAngle`, `dataRetentionDays`
- 测量专用：`measurementFieldOfView`, `measurementResolution`, `targetAccuracy`, `systemAccuracy`, `measurementCalibrationMethod`, `measurementDatum`, `measurementObjectDescription`, `calibrationPlateSpec`, `grr`, `edgeExtractionMethod`
- 缺陷专用：`defectClasses`, `minDefectSize`, `allowedMissRate`, `allowedFalseRate`, `defectContrast`
- 定位专用：`accuracyRequirement`, `repeatabilityRequirement`, `calibrationMethod`, `coordinateDescription`
- OCR专用：`contentRule`, `minCharHeight`, `charType`
- 深度学习：`dlTaskType`, `targetClasses`, `inferenceTimeTarget`

同时在 prompt 中增加自然语言到字段的映射提示，例如：
- "测量方法" → 填写 `measurementCalibrationMethod`, `measurementObjectDescription`, `edgeExtractionMethod` 等测量相关字段
- "环境说明" → 填写 `risk_notes`
- "检测参数" → 根据模块类型填写对应配置字段

### 2. 修改文件清单

| 文件 | 操作 |
|------|------|
| `supabase/functions/ai-form-command/index.ts` | 修改 - 扩展字段映射和自然语言提示 |

