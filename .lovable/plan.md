

# 修复光学方案图截图闪动和白色残影

## 问题总结

两个独立但相关的问题：
1. **网页闪动**：离屏渲染容器使用 `position: fixed; left: 0; top: 0; opacity: 0`，浏览器仍参与合成计算
2. **白色残影**：`VisionSystemDiagram` 的 `willChange: 'transform'` 和 `transform: 'translateZ(0)'` 在截图模式下制造 GPU 合成层伪影

## 修改方案

### 文件 1：`src/components/canvas/BatchImageSaveButton.tsx`（第 370-373 行）

将离屏渲染容器从 `fixed + opacity:0` 改为真正远离视口：

```typescript
// 之前
style={{ position: 'fixed', left: 0, top: 0, width: 1200, height: 1000, opacity: 0, zIndex: -9999, pointerEvents: 'none', overflow: 'hidden' }}

// 之后
style={{ position: 'absolute', left: '-20000px', top: '-20000px', width: 1200, height: 1000, pointerEvents: 'none', overflow: 'hidden' }}
```

这样浏览器不再把它当视口内固定层处理，消除闪动。

### 文件 2：`src/components/canvas/VisionSystemDiagram.tsx`

利用已有的 `interactive` prop（`false` = 截图模式）条件去除 GPU 提升样式：

**第 207 行** — 外层 div：
```typescript
style={{
  backgroundColor: '#1a1a2e',
  contain: 'layout style paint',
  ...(interactive ? { willChange: 'transform' } : {}),
}}
```

**第 213 行** — SVG：
```typescript
style={{
  maxHeight: '100%',
  ...(interactive ? { transform: 'translateZ(0)' } : {}),
}}
```

截图模式下去掉 `willChange` 和 `translateZ(0)`，避免 GPU 合成层在 `html-to-image` 序列化时产生白边/残影。

共 2 个文件，约 6 行改动。

