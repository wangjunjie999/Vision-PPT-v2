

# AI 聊天指令驱动的智能填表

## 问题
当前 AI 填表功能是每个表单上的独立按钮，用户需要先手动导航到目标表单再点击。用户希望在 AI 聊天中输入自然语言指令（如"完成DB260101项目的06工位的现场环境说明"），AI 自动定位到对应项目/工位/模块，并用打字动画填写表单。

## 方案

### 1. 新建 Edge Function：`ai-form-command`
- 接收用户的自然语言指令 + 完整项目上下文数据
- AI 解析出：目标类型（project/workstation/module）、目标 ID、需要填写的字段及值
- 使用 tool calling 返回结构化结果：`{ targetType, targetId, fields: { field: value } }`
- AI 需要匹配项目编号（如 DB260101）和工位序号/编号（如 06 工位）来定位

### 2. 新建 Hook：`useAIChatFormCommand`
- 在 `AIChatPanel` 中集成
- 检测 AI 回复是否包含填表指令（通过新的 edge function 返回特殊格式）
- 调用 `DataContext` 的 `selectProject` / `selectWorkstation` / `selectModule` 自动导航
- 导航后触发 `useAIFormFill` 的打字动画填写

### 3. 修改 `AIChatPanel.tsx`
- 在 `handleSend` 中增加指令检测逻辑
- 当用户消息匹配填表意图时，先调用 `ai-form-command` 解析指令
- 解析成功后：自动选中目标项目/工位 → 等待表单渲染 → 触发 AI 填写
- 在聊天中显示操作反馈（如"正在定位到 XX 工位..."、"开始填写..."）

### 4. 修改 `useAIFormFill.ts`
- 支持外部传入预生成的 suggestions（跳过再次调用 edge function）
- 新增 `fillWithSuggestions(suggestions)` 方法

### 5. 修改表单组件（ProjectForm / WorkstationForm / ModuleForm）
- 通过全局事件或 store 暴露 AI 填写触发接口
- 当 `AIChatPanel` 发出填表指令时，对应表单自动开始打字动画

### 实现架构

```text
用户输入 "完成DB260101项目的06工位的现场环境说明"
  │
  ▼
AIChatPanel.handleSend()
  │
  ├─ 调用 ai-form-command edge function
  │   ├─ AI 解析意图：workstation, 匹配 code/name
  │   └─ 返回 { targetType: "workstation", projectCode: "DB260101", 
  │            workstationIndex: 6, fields: { risk_notes: "...", ... } }
  │
  ├─ 自动导航：selectProject(matchedProjectId) → selectWorkstation(matchedWsId)
  │
  └─ 触发填表：通过 appStore 设置 pendingAIFill → 表单组件监听并执行打字动画
```

### 修改文件清单

| 文件 | 操作 |
|------|------|
| `supabase/functions/ai-form-command/index.ts` | 新建 - 解析自然语言填表指令 |
| `src/store/useAppStore.ts` | 修改 - 添加 pendingAIFill 状态 |
| `src/components/ai/AIChatPanel.tsx` | 修改 - 集成指令检测和自动导航 |
| `src/hooks/useAIFormFill.ts` | 修改 - 支持外部传入 suggestions |
| `src/components/forms/ProjectForm.tsx` | 修改 - 监听 pendingAIFill 自动触发 |
| `src/components/forms/WorkstationForm.tsx` | 修改 - 监听 pendingAIFill 自动触发 |
| `src/components/forms/ModuleForm.tsx` | 修改 - 监听 pendingAIFill 自动触发 |

