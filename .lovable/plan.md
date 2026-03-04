

# 修复光学方案图截图：文字改白+浅灰层级 + 信息截全（扩高）

## 问题总结

从截图看有三个问题：
1. **右侧参数卡片文字不清晰**：深色背景上的文字对比度不够（特别是次级信息）
2. **工控机信息截断**：GPU 行被裁切，底部内容超出 SVG viewBox 高度
3. **截图时信息不全**：`toPng` 固定 750px 高度不够容纳所有信息卡

## 修改方案

### 1. `src/components/canvas/VisionSystemDiagram.tsx` — 文字颜色 + viewBox 扩高

**文字颜色改为白+浅灰层级**：
- 标题文字（"工业相机"、"工业镜头"等）：`color: '#ffffff'`（纯白）
- 主要参数（分辨率、焦距等）：`color: '#f1f5f9'`（接近白）
- 次级信息（品牌型号）：`color: '#cbd5e1'`（浅灰，替代当前 `#94a3b8`）
- 蓝色高亮信息保持 `hsl(210, 100%, 75%)`

**SVG viewBox 扩高**：
- `viewBox="0 0 800 550"` → `viewBox="0 0 800 650"`，为工控机卡片留出足够空间
- `foreignObject` 的 height 从 `520` 增加到 `620`，确保所有卡片（相机、镜头、光源、视野参数、工控机）完整显示
- `min-h-[500px]` → `min-h-[600px]`

**SVG 标注文字**：尺寸标注、视野宽度等已用 `hsl(210, 100%, 75%)` 的保持不变

### 2. `src/components/canvas/ModuleSchematic.tsx` — 截图尺寸扩高

将 `toPng` 的固定截图尺寸从 `1200x750` 改为 `1200x900`（三处调用），确保截图能完整包含扩高后的内容：
- `handleExportPNG`（line 146-147, 152-153）
- `handleExportPDF`（line 190-191, 196-197）
- `handleSaveSchematic`（line 261-262, 269-270）

### 3. `src/components/canvas/BatchImageSaveButton.tsx` — 批量截图容器扩高

- `.vision-diagram-container` 的 style height 从 `600px` → `900px`（line 328）
- 外层固定容器高度从 `800px` → `1000px`（line 309）

## 涉及文件

| 文件 | 修改 |
|------|------|
| `src/components/canvas/VisionSystemDiagram.tsx` | viewBox 扩高 650 + foreignObject 高度 620 + 文字颜色白/浅灰层级 |
| `src/components/canvas/ModuleSchematic.tsx` | 三处截图尺寸 750→900 |
| `src/components/canvas/BatchImageSaveButton.tsx` | 批量截图容器扩高 |

