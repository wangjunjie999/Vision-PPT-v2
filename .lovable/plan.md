

# 修复白色残影：captureOffscreen 克隆了 interactive 模式的 foreignObject

## 根因

`ModuleSchematic.tsx` 的 `captureOffscreen` 函数通过 `cloneNode(true)` 克隆了 `diagramRef.current`。但该 ref 指向的是 `interactive={true}` 的 VisionSystemDiagram，其右侧标注面板是 **foreignObject + HTML div** 结构。

虽然之前已为 `interactive={false}` 编写了纯 SVG 标注面板，但 **单模块保存和 PNG/PDF 导出从未使用过这个分支**——它们克隆的永远是带 foreignObject 的交互版本。

对比 `BatchImageSaveButton.tsx`，它直接渲染 `interactive={false}` 的 VisionSystemDiagram，所以批量补图没有残影问题。

## 修改方案

### 文件：`src/components/canvas/ModuleSchematic.tsx`

**策略**：添加一个 `exportDiagramRef`，在截图时临时渲染一个 `interactive={false}` 的 VisionSystemDiagram 到离屏容器，从它截图，截完移除。

具体改动：

1. 新增 `exportDiagramRef = useRef<HTMLDivElement>(null)` 和 `isCapturing` state
2. 在组件 JSX 底部添加一个离屏容器（`position: absolute; left: -20000px`），仅当 `isCapturing` 时渲染 `<VisionSystemDiagram interactive={false} .../>` 
3. 重写 `captureOffscreen`：
   - 设置 `isCapturing = true`
   - 等待 React 渲染完成（double rAF）
   - 从 `exportDiagramRef` 调用 `toPng`（不再克隆 interactive 版本）
   - 设置 `isCapturing = false`
4. 使用 `generateSchematicImage`（已在 batchImageSaver.ts 中定义）代替手动 `toPng` 调用，保持参数一致

```text
渲染流程对比：
  之前: diagramRef (interactive=true) → cloneNode → toPng (foreignObject残影)
  修复: exportDiagramRef (interactive=false) → toPng (纯SVG, 无残影)
```

### 改动量

约 40 行净变化，仅改 `ModuleSchematic.tsx` 一个文件。

