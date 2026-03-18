

# AI 按钮入口升级 — 灵动动画 + 丰富色彩 + 可拖拽

## 改动范围

### `src/components/ai/AIChatPanel.tsx`

**1. 可拖拽功能**
- 添加拖拽状态管理（`position`, `isDragging`, `dragOffset`）
- 用 `onMouseDown/onMouseMove/onMouseUp`（及对应 touch 事件）实现自由拖拽
- 按钮从固定 `bottom-6 right-6` 改为通过 `style={{ left, top }}` 动态定位
- 短按（无拖拽位移）触发打开面板，拖拽时不触发点击

**2. 视觉升级（主色调不变）**
- 按钮背景改为多色渐变：`bg-gradient-to-br from-primary via-primary/80 to-accent`（主色到 teal accent）
- 添加外层光晕环：用一个绝对定位的 `div` 做脉冲光圈动画（`animate-ping` 或自定义 keyframe），颜色 `bg-primary/30`
- 添加呼吸光效：`animate-pulse` 配合 `shadow-lg shadow-primary/40`
- Hover 时放大 + 旋转微动：`hover:scale-110 hover:rotate-6`
- 图标可加一个轻微浮动动画（上下缓动）

**3. 拖拽时视觉反馈**
- 拖拽中按钮略微缩小 + 透明度降低：`scale-95 opacity-80`
- 松手后弹回效果：`transition-transform duration-300`

### 实现要点

```text
┌─────────────────────────────┐
│  外层光晕 (ping animation)   │
│  ┌───────────────────────┐  │
│  │ 渐变背景按钮           │  │
│  │  Bot icon (浮动动画)   │  │
│  └───────────────────────┘  │
│  可拖拽 (mousedown/move/up) │
└─────────────────────────────┘
```

- 初始位置：右下角（与原位置一致）
- 拖拽边界：限制在视口内
- 位置持久化：可选存入 localStorage，刷新后记住位置

