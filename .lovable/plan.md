

# 添加 AI 问答助手侧边栏

## 概述

在系统右下角添加一个浮动的 AI 问答助手按钮，点击后弹出侧边抽屉式聊天面板。用户可随时提问工业视觉检测相关问题，AI 基于领域知识给出专业建议。使用 Lovable AI（已有 LOVABLE_API_KEY）通过 Edge Function 实现流式对话。

## 架构

```text
用户输入 → AIChatPanel (前端)
         → Edge Function (chat-assistant)
         → Lovable AI Gateway (google/gemini-3-flash-preview)
         → 流式返回 → 前端逐 token 渲染
```

## 改动清单

### 1. 创建 Edge Function `supabase/functions/chat-assistant/index.ts`

- 接收 `messages` 数组
- 注入工业视觉领域系统提示词（中文），涵盖相机选型、镜头计算、光源方案、检测算法等专业知识
- 调用 `https://ai.gateway.lovable.dev/v1/chat/completions`，模型 `google/gemini-3-flash-preview`，开启 `stream: true`
- 处理 429/402 错误并返回对应状态码
- 返回 SSE 流

### 2. 更新 `supabase/config.toml`

添加：
```toml
[functions.chat-assistant]
verify_jwt = false
```

### 3. 创建 `src/components/ai/AIChatPanel.tsx`

浮动聊天面板组件：
- 右下角固定悬浮按钮（Bot 图标），点击打开/关闭
- Sheet 抽屉从右侧滑出，宽度约 400px
- 聊天界面：消息列表 + 输入框 + 发送按钮
- 使用 `react-markdown` 渲染 AI 回复（markdown 格式）
- SSE 流式解析，逐 token 更新最后一条 assistant 消息
- 支持清空对话历史
- 加载状态指示器

### 4. 修改 `src/components/layout/MainLayout.tsx`

在三种布局（Desktop/Tablet/Mobile）的最外层 div 内添加 `<AIChatPanel />` 组件，作为全局浮动元素。

## 系统提示词要点

```
你是一位资深的工业视觉检测方案专家。你精通：
- 工业相机选型（面阵/线阵、分辨率、帧率、接口）
- 工业镜头计算（焦距、视场角、工作距离、景深）
- 光源方案设计（环形光、背光、同轴光、条形光）
- 视觉检测算法（缺陷检测、OCR、尺寸测量、定位引导）
- 深度学习在视觉检测中的应用
- 工控机与控制器选型
- 通信协议与系统集成
请用中文回答，给出专业、实用的建议。
```

## 依赖

需安装 `react-markdown` 用于渲染 AI 回复中的 markdown 格式。

