

# 修复浅色模式下截图文字颜色问题

## 问题分析

虽然 `VisionSystemDiagram.tsx` 中所有文字已使用内联 `color: '#ffffff'`，但 `html-to-image` 在克隆 DOM 时，`foreignObject` 内的 HTML 元素可能继承浏览器/主题的默认颜色（浅色模式下为黑色），内联样式在克隆过程中未被完整保留。

## 解决方案

在截图捕获前，向目标容器临时注入一个 `<style>` 标签，使用 `!important` 强制所有文字为白色，截图完成后移除。这样无论当前是浅色还是暗黑模式，截图输出始终一致。

### 修改文件

**1. `BatchImageSaveButton.tsx`** — 批量截图流程

在 `generateImageFromElement` 调用前，向离屏容器注入：
```html
<style id="capture-force-white">
  * { color: #ffffff !important; }
  p, span, div, text { color: #ffffff !important; fill: #ffffff !important; }
</style>
```
截图完成后移除该 `<style>` 标签。

**2. `ModuleSchematic.tsx`** — 单个保存流程

同样在 `handleSaveSchematic` 的截图前注入相同的强制样式，截图后移除。

**3. `batchImageSaver.ts`** — `generateImageFromElement` 工具函数

在该函数中统一处理：接受可选参数 `forceWhiteText?: boolean`，若为 `true` 则自动注入/移除强制白色样式。这样两条调用路径都能复用。

### 预期效果

- 浅色/暗黑模式下截图输出完全一致
- 所有文字、SVG fill 均为白色
- 不影响页面正常显示（样式仅在截图瞬间生效）

