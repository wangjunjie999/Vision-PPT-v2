

# 降低对话气泡透明度

将消息气泡的不透明度从 `/70` 和 `/60` 进一步降低：

### `src/components/ai/AIChatPanel.tsx`

- **用户消息**（第 364 行）：`bg-primary/70` → `bg-primary/40`
- **AI 消息**（第 365 行）：`bg-muted/60` → `bg-muted/30`，边框 `border-border/30` → `border-border/20`
- **加载指示器**（第 380 行）：`bg-muted/60` → `bg-muted/30`

