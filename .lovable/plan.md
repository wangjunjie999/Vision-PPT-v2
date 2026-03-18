

# AI 助手支持自定义 API Key — 优先 Lovable，额度不足自动回退

## 整体思路

Edge Function 接收前端传来的可选 `customApiKey`、`customBaseUrl`、`customModel` 参数。优先使用 Lovable AI Gateway，当返回 402（额度用完）时，自动回退到用户自定义的 API（如 OpenAI 兼容接口）。前端新增一个设置区域，让用户配置自定义 API Key，存储在 localStorage。

## 改动范围

### 1. `supabase/functions/chat-assistant/index.ts`

- 从请求体中解析新增字段：`customApiKey`、`customBaseUrl`（默认 `https://api.openai.com`）、`customModel`（默认 `gpt-4o`）
- 保持现有 Lovable Gateway 调用逻辑不变
- 当 Lovable Gateway 返回 **402** 时，检查是否有 `customApiKey`：
  - 有：用自定义 API 重新发起请求（相同的 system prompt + messages，stream: true）
  - 无：返回 402 错误提示（与现有行为一致）
- 自定义 API 调用格式：`POST {customBaseUrl}/v1/chat/completions`，Header 用 `Bearer {customApiKey}`
- 在响应头中添加 `X-AI-Provider: lovable | custom`，让前端知道实际使用了哪个

### 2. `src/components/ai/AIChatPanel.tsx`

**设置面板（新增）**：
- 在聊天面板顶部工具栏添加一个齿轮图标按钮，点击展开/收起 API 设置区
- 设置区包含 3 个输入框：
  - API Key（password 类型）
  - API Base URL（默认 `https://api.openai.com`）
  - 模型名称（默认 `gpt-4o`）
- 配置存入 localStorage（key: `ai-custom-config`）

**请求逻辑调整**：
- `streamChat` 函数的 body 中新增 `customApiKey`、`customBaseUrl`、`customModel` 字段（从 localStorage 读取）
- 在聊天面板底部或消息气泡上显示当前使用的 AI 来源（通过读取响应头 `X-AI-Provider`）

**UI 指示**：
- 当使用自定义 API 时，在面板顶部显示小标签如"自定义API"
- 当使用 Lovable AI 时显示"Lovable AI"

## 安全考虑

- 自定义 API Key 仅在前端 localStorage 中存储，通过 Edge Function 中转调用，不会暴露在客户端网络请求中（Edge Function 作为代理）
- Edge Function 不会持久化用户的 API Key

