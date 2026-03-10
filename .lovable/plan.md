

# 光学方案图抖动问题 — 全面排查与修复

## 问题定位

Session replay 明确显示持续变化的 `box-shadow: rgba(255, 107, 53, ...)` 动画。这个颜色 (`#FF6B35`) 是引导系统（Guide System）的主题色，来源于以下组件的 framer-motion 无限循环动画：

| 文件 | 动画类型 | 问题 |
|------|---------|------|
| `GuideSteps.tsx:44-54` | `boxShadow` 无限脉冲 | **主要抖动源** — framer-motion 每帧更新 box-shadow，触发全局重绘 |
| `GuideHighlight.tsx:35-43` | `opacity` 无限脉冲 + `scale` 动画 | 在 ProjectTree 内对按钮施加持续重绘 |
| `GuideTip.tsx:71-82` | `scale` + `opacity` 无限脉冲 | 绝对定位元素持续重排 |
| `GuideTip.tsx:19` | `animate-bounce-arrow` CSS 动画 | 箭头图标持续跳动 |
| `button.tsx:18` | `animate-pulse-glow` (glow variant) | `pulse-glow` 无限 box-shadow 动画 |

这些动画在 TopToolbar 和 ProjectTree 中持续运行，与 VisionSystemDiagram 共享同一渲染树，导致浏览器频繁触发合成层重绘，波及光学方案图区域。

## 修复方案

### 1. `GuideSteps.tsx` — 替换 framer-motion boxShadow 动画

将 `boxShadow` 动画替换为纯 CSS `animate-pulse-ring` class（已在 tailwind.config.ts 中定义），用 `will-change: box-shadow` 隔离到独立合成层：

```tsx
// 移除 animate 和 transition props
// 改为 className 控制
<motion.div
  className={cn(
    '...existing classes...',
    isCurrent && 'animate-[pulse-ring_1.5s_ease-out_infinite]'
  )}
  style={isCurrent ? { willChange: 'box-shadow' } : undefined}
>
```

### 2. `GuideHighlight.tsx` — 添加 GPU 隔离

为两个无限动画 div 添加 `will-change` 和 `transform: translateZ(0)` 强制 GPU 合成层隔离，避免重绘扩散：

```tsx
<motion.div
  style={{ willChange: 'opacity', transform: 'translateZ(0)' }}
  // ...existing animate/transition props
/>
```

### 3. `GuideTip.tsx` — 同样添加 GPU 隔离

脉冲环 div 添加合成层隔离：

```tsx
<motion.div
  className="absolute inset-0 rounded-xl bg-guide-primary/30"
  style={{ willChange: 'transform, opacity', transform: 'translateZ(0)' }}
  // ...existing props
/>
```

### 4. `VisionSystemDiagram.tsx` — 容器级隔离

在最外层 div 添加 `will-change: transform` 和 `contain: layout style paint`，将光学方案图完全隔离为独立合成层，即使其他组件重绘也不会波及：

```tsx
<div 
  className={cn("relative w-full h-full min-h-[700px]", className)} 
  style={{ 
    backgroundColor: '#1a1a2e',
    willChange: 'transform',
    contain: 'layout style paint',
  }}
>
```

### 修改文件清单

1. `src/components/guide/GuideSteps.tsx` — 替换 boxShadow 动画为 CSS class + 合成层隔离
2. `src/components/guide/GuideHighlight.tsx` — 添加 `will-change` + `translateZ(0)`
3. `src/components/guide/GuideTip.tsx` — 添加 `will-change` + `translateZ(0)`
4. `src/components/canvas/VisionSystemDiagram.tsx` — 添加 `contain` CSS 属性隔离

