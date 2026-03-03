

# PPT 光学方案页使用系统截图替代简易色块

## 当前问题

`generateModuleOpticalSlide` 函数（workstationSlides.ts 第1419行）在 PPT 光学方案页左侧用 pptxgenjs 绘制简单的彩色色块（相机蓝色块、镜头紫色块、光源橙色块），效果粗糙。

而系统中已有完整的 VisionSystemDiagram 组件渲染（如图2所示），且每个模块的截图已保存在 `schematic_image_url` 字段中。应直接使用这张截图作为光学方案的图示。

## 修改方案

### 文件：src/services/pptx/workstationSlides.ts

**将 `generateModuleOpticalSlide` 从同步改为异步函数**，以支持图片加载。

**替换左半区内容**：删除当前用色块绘制的相机/镜头/光源/工作距离/产品等元素（约第1449-1553行），改为：

1. 检查 `mod.schematic_image_url` 是否存在
2. 如果存在：使用 `fetchImageAsDataUri` 加载图片，用 `calculateContainFit` 按比例放置在左半区（约 4.6 x 3.8 英寸区域）
3. 如果不存在：显示占位矩形和提示文字"请先在系统中保存光路示意图"

**保留右半区**（测量方法及视觉清单）完全不变。

### 文件：src/services/pptxGenerator.ts

**更新调用处**：`generateModuleOpticalSlide` 变为异步后，调用处需要加 `await`。搜索所有调用点添加 `await`。

### 文件：src/services/pptx/workstationSlides.ts（导出签名）

函数签名从：
```typescript
export function generateModuleOpticalSlide(ctx, data, moduleIndex): void
```
改为：
```typescript
export async function generateModuleOpticalSlide(ctx, data, moduleIndex): Promise<void>
```

## 技术细节

- 图片容器区域：x=0.4, y=1.4, w=4.6, h=3.6（与左半区一致）
- 使用已有的 `fetchImageAsDataUri` 和 `calculateContainFit` 工具函数保持等比例缩放
- 图片加载失败时回退到占位符，不影响整体生成流程
- 右半区的硬件参数清单保持不变，确保技术信息完整

## 涉及文件

| 文件 | 操作 |
|------|------|
| src/services/pptx/workstationSlides.ts | 重写 generateModuleOpticalSlide 左半区，用 schematic_image_url 替代色块 |
| src/services/pptxGenerator.ts | 调用处加 await |

