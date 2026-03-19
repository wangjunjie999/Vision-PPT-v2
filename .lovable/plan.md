

# 数据隔离确认 + AI 自动填写表单（打字动画）

## 1. 数据隔离现状

当前所有核心表（projects, workstations, function_modules, mechanical_layouts, product_assets 等）已通过 RLS 策略 `auth.uid() = user_id` 实现完整的用户数据隔离。**无需额外修改**，每个用户只能看到自己的项目数据。

共享资源表（cameras, lenses, lights, controllers, mechanisms）设计为所有已登录用户可读，这是合理的，因为它们是公共硬件库。

## 2. AI 自动填写表单功能

### 整体方案

在 AI 聊天面板中添加"智能填表"按钮。用户点击后，AI 根据当前选中的项目/工位/模块上下文，生成建议的表单字段值，然后通过打字动画逐字段填入表单。

### 2.1 新建 Edge Function：`ai-form-assist`

- 接收当前表单类型（project / workstation / module）和已有字段数据
- 使用 Lovable AI（tool calling）返回结构化的表单字段建议
- 返回 JSON 格式的字段键值对

### 2.2 新建 Hook：`useAIFormFill`

- 管理 AI 填表状态（idle / generating / typing / done）
- 调用 `ai-form-assist` 获取建议值
- 实现打字动画逻辑：逐字段、逐字符更新 formData state
- 使用 `requestAnimationFrame` + 定时器实现平滑的打字效果
- 暴露 `startFill()`, `stopFill()`, `isTyping`, `currentField` 等接口

### 2.3 修改表单组件

**`ProjectForm.tsx`、`WorkstationForm.tsx`、`ModuleForm.tsx`**：
- 添加"AI 智能填写"按钮（带魔法棒图标）
- 集成 `useAIFormFill` hook
- 打字进行时，当前正在填写的字段高亮显示（蓝色边框 + 光标闪烁动画）
- 已填完的字段显示绿色勾号过渡动画

### 2.4 打字动画组件：`TypewriterField`

- 包裹 Input/Textarea，接收目标文本
- 逐字符更新值，每字符间隔 30-60ms
- 光标闪烁 CSS 动画
- 完成时触发 `onComplete` 回调，切换到下一个字段

### 修改文件清单

| 文件 | 操作 |
|------|------|
| `supabase/functions/ai-form-assist/index.ts` | 新建 |
| `src/hooks/useAIFormFill.ts` | 新建 |
| `src/components/forms/TypewriterField.tsx` | 新建 |
| `src/components/forms/ProjectForm.tsx` | 修改 - 集成 AI 填写 |
| `src/components/forms/WorkstationForm.tsx` | 修改 - 集成 AI 填写 |
| `src/components/forms/ModuleForm.tsx` | 修改 - 集成 AI 填写 |
| `supabase/config.toml` | 修改 - 添加新函数配置 |

