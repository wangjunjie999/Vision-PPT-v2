

# AI 助手面板样式优化

## 问题

1. **两个关闭按钮**：`SheetContent` 组件自带一个关闭按钮（右上角 X），代码中又手动添加了一个 X 按钮，导致重复。
2. **背景不透明**：面板整体背景使用 `bg-card`/`bg-background`，需要改为透明背景，但对话气泡保持不透明。
3. **按钮样式简陋**：头部工具按钮（数据库、清空、关闭）视觉效果较弱。

## 改动

### 1. `src/components/ai/AIChatPanel.tsx`

- **移除手动关闭按钮**（第 310-312 行），保留 Sheet 自带的关闭按钮，或者反过来：隐藏 Sheet 自带按钮，保留自定义按钮
- 推荐方案：**隐藏 Sheet 自带关闭按钮**（通过 className 覆盖），保留自定义头部按钮组，这样按钮风格统一
- **SheetContent 背景改为透明**：`bg-transparent` 或 `bg-background/80 backdrop-blur-sm`
- **Header 和 Input 区域保持半透明毛玻璃效果**：`bg-card/90 backdrop-blur-md`
- **消息区域背景透明**，对话气泡保持不透明
- **美化头部按钮组**：
  - 使用圆角更大的按钮，添加 hover 效果（如 `rounded-lg hover:bg-white/10`）
  - 按钮间用细分隔线或间距区分
  - 关闭按钮用稍微醒目的样式（如红色 hover）

### 2. 隐藏 Sheet 自带关闭按钮

在 `SheetContent` 的 className 中添加 `[&>button]:hidden` 来隐藏内置的 X 按钮。

