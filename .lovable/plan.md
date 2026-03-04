

# 修复批量/单个截图中文字显示为黑色的问题

## 根因分析

通过检查存储的截图和代码，发现两个核心问题：

1. **离屏渲染位置导致样式丢失**：`BatchImageSaveButton` 的离屏渲染区域使用 `left: -9999px`。`html-to-image` 在克隆 DOM 时，对于完全移出视口的元素，浏览器可能不会完整计算 `foreignObject` 内嵌 HTML 的样式，导致 `color: '#ffffff'` 未生效，文字回退为默认黑色。

2. **容器背景色未显式指定**：`VisionSystemDiagram` 根元素和外层 `div` 均无显式背景色（依赖 CSS 变量 `bg-background`），在 `html-to-image` 捕获时 CSS 变量可能解析为浅色/白色背景。

## 修改方案（2 个文件）

### 1. `BatchImageSaveButton.tsx` — 离屏容器修复

将离屏渲染容器从 `left: -9999px` 改为在视口内但不可见：

```text
旧: class="fixed left-[-9999px] top-0 w-[1200px] h-[1000px] overflow-hidden"
新: style="position:fixed; left:0; top:0; width:1200px; height:1000px; opacity:0; z-index:-9999; pointer-events:none; overflow:hidden"
```

同时为 `.vision-diagram-container` 添加显式深色背景：
```text
旧: style={{ width: '1000px', height: '1000px' }}
新: style={{ width: '1000px', height: '1000px', backgroundColor: '#1a1a2e' }}
```

### 2. `ModuleSchematic.tsx` — 单个保存修复

在截图前给 `diagramRef` 容器添加显式背景色，确保不依赖 CSS 变量：

```text
// 截图前临时设置
el.style.backgroundColor = '#1a1a2e';

// 截图后恢复
el.style.cssText = originalStyle;
```

### 3. `VisionSystemDiagram.tsx` — 根容器背景色兜底

给 SVG 外层 `<div>` 添加显式内联 `backgroundColor`，作为最后保障：

```text
旧: <div className={cn("relative w-full h-full min-h-[700px]", className)}>
新: <div className={cn("relative w-full h-full min-h-[700px]", className)} style={{ backgroundColor: '#1a1a2e' }}>
```

## 预期效果

- 离屏元素在视口内正常计算样式 → `foreignObject` 中的 `color: '#ffffff'` 正确生效
- 显式深色背景 → 白色文字清晰可见
- 批量重新生成和单个保存两条路径输出一致

