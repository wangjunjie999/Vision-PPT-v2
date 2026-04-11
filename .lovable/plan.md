

## 删除光学方案图中的安装支架

### 改动

**文件**: `src/components/canvas/VisionSystemDiagram.tsx`

删除第 538-542 行的「Mounting Bracket」SVG 元素组：
```
{/* ===== Mounting Bracket (follows camera) ===== */}
<g>
  <rect x={...} y={...} width="160" height="10" ... />
  <rect x={...} y={...} width="20" height="24" ... />
</g>
```

这是相机下方跟随移动的灰色横杆和连接柱，删除后画面更简洁。

### 影响范围
- 仅 `VisionSystemDiagram.tsx` 一个文件，删除 5 行代码

