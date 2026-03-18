

# 对话气泡改为透明毛玻璃材质

## 改动

### `src/components/ai/AIChatPanel.tsx`

将消息气泡的背景从不透明改为半透明毛玻璃效果：

- **用户消息**（第 363-364 行）：`bg-primary` → `bg-primary/70 backdrop-blur-md`
- **AI 消息**（第 365 行）：`bg-muted` → `bg-muted/60 backdrop-blur-md border border-border/30`
- **加载指示器**（第 380 行）：`bg-muted` → `bg-muted/60 backdrop-blur-md`

这样所有对话气泡都呈现半透明毛玻璃质感，与面板整体风格一致。

