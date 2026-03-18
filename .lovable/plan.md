

# 修复 AI 助手项目上下文识别 + 扩展职责范围

## 问题分析

两个核心问题：

1. **上下文未被AI识别**：虽然项目数据通过 `context` 参数发送到了 Edge Function，但系统提示词中没有明确告诉 AI "你已经拥有了用户的项目数据，请直接使用它来回答"。当前的上下文注入指令太弱（只说"请基于这些实际数据给出更精准的建议"），AI 模型没有理解它应该把这些数据当作已知信息来引用。

2. **职责范围太窄**：系统提示词只覆盖了视觉硬件和算法，缺少项目管理、方案优化、成本分析、可行性评估等更广泛的工程咨询能力。

## 改动清单

### 1. 修改 Edge Function 系统提示词 (`supabase/functions/chat-assistant/index.ts`)

- **强化上下文注入指令**：将第二条 system message 改为明确告诉 AI："以下是用户当前项目的完整配置数据，你可以直接读取和引用这些数据。当用户提到项目编号时，你已经拥有该项目的所有信息，无需再向用户询问。"
- **扩展系统提示词职责范围**，新增以下领域：
  - 方案优化与评审（基于已有配置给出改进建议）
  - 项目管理（进度评估、风险分析）
  - 成本估算与ROI分析
  - 产线节拍优化
  - 可行性评估
  - 竞品方案对比
  - 技术文档撰写建议
  - 故障排查与维护策略
- **增加回答要求**：当项目上下文数据可用时，必须主动引用具体数据（如相机型号、镜头参数）来回答，而非泛泛而谈

### 2. 增强前端上下文构建 (`src/components/ai/AIChatPanel.tsx`)

- 在 `buildProjectContext` 中补充更多数据字段：
  - 项目的 `quality_strategy`、`notes`、`production_line`、`responsible` 等
  - 工位的 `risk_notes`、`action_script`、`acceptance_criteria`、`enclosed` 等
  - 模块的详细检测配置（`defect_config`、`measurement_config`、`ocr_config`、`deep_learning_config`、`positioning_config`）
- 在上下文末尾添加硬件数据库摘要提示（告知AI系统中有哪些可用硬件）

### 3. 重新部署 Edge Function

部署更新后的 `chat-assistant` 函数并验证。

## 预期效果

用户输入"根据我的项目DB260101，给我一个优化方案"时，AI 将直接引用项目中的具体工位、相机型号、镜头参数等数据，给出针对性的优化建议，而非要求用户重新提供信息。

