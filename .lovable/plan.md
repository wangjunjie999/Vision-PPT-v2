
# 简化布局图 + 整合 PPT 关键信息

## 目标

将当前按真实尺寸渲染的三视图布局（使用照片级机构图片 + 1:1 比例）简化为**示意性布局图**，用小图标表达布局意图，并在同一画面中整合 PPT 关键参数信息。

## 当前问题

1. `DraggableLayoutCanvas` 使用 `scale = 1.0 px/mm` 的真实比例渲染，导致画面拥挤或稀疏
2. `MechanismSVG` 优先加载照片级资源图片（`useImage = true`），在概览图中细节过多
3. 三视图保存到 PPT 后只有布局图，缺少关键参数信息（相机型号、光学参数等）
4. 用户需要在 PPT 中翻多页才能理解一个工位的完整方案

## 方案设计

### 1. 新建 SimpleLayoutDiagram 组件

**文件**: `src/components/canvas/SimpleLayoutDiagram.tsx`

创建一个专用于 PPT 和概览的简化布局图组件：

- 固定画布尺寸（如 900x500），不按真实毫米比例
- 机构用 **小图标 + 标签** 表示（约 40x40px 的简笔 SVG 图标）
- 相机用统一的小相机图标 + 编号表示
- 产品用简单矩形 + "待测件" 标签居中表示
- 自动排列：产品居中，相机在上方，机构按类型分布在周围
- 连接线表示相对位置关系（虚线箭头）

图标样式：
- 机器人 → 简笔机械臂图标
- 传送带 → 简笔皮带线图标
- 气缸 → 简笔活塞图标
- 夹爪 → 简笔夹爪图标
- 升降台 → 上下箭头图标
- 转台 → 旋转圆盘图标
- 挡停 → 方块图标
- 相机支架 → L 型支架图标

### 2. 在布局图中整合 PPT 关键信息

在同一 SVG 画面的右侧或底部区域，以信息卡片形式显示：

- **光学方案摘要**: 相机型号 + 分辨率、镜头焦距、光源类型
- **关键参数**: 视野宽度、工作距离、像素精度
- **节拍信息**: 目标节拍、拍照次数、触发方式
- **检测方式**: 模块类型列表（定位/缺陷/OCR 等）

### 3. 修改 BatchImageSaveButton

**文件**: `src/components/canvas/BatchImageSaveButton.tsx`

- 用 `SimpleLayoutDiagram` 替代 `OffscreenLayoutCanvas`，生成一张**综合布局概览图**（而非三张独立三视图）
- 合并原来的三视图保存为单一的"布局概览图"

### 4. 修改 PPT 生成逻辑

**文件**: `src/services/pptx/workstationSlides.ts`

- 将原来的三视图页（Slide 4）和示意图页（Slide 5）合并为一页 **"布局与光学方案"**
- 使用新的综合布局图作为主图
- 在同一 Slide 中放置关键硬件参数表格
- 减少 PPT 总页数，信息更集中

### 5. 保留现有编辑功能

- `DraggableLayoutCanvas` 保持不变，用于精确编辑
- `SimpleLayoutDiagram` 仅用于导出和预览，是只读的
- 用户在编辑器中仍使用完整功能的拖拽画布

## 技术细节

### SimpleLayoutDiagram 数据流

```text
layout_objects (JSON) → 解析 3D 坐标 → 自动布局算法 → 简化 SVG 渲染
                                                          ↓
modules + hardware data ────────────────────→ 右侧信息面板
```

### 自动布局算法

不按真实坐标渲染，而是根据对象类型自动排列：
- 产品固定在画面中央
- 相机排列在上方，均匀分布
- 机构按类型分组排列在左右两侧
- 使用箭头和标注线表示安装关系

### PPT Slide 结构变化

| 原有结构 | 新结构 |
|---------|--------|
| Slide 4: 三视图 (3 张图) | Slide 4: 布局与光学方案 (1 张综合图 + 参数表) |
| Slide 5: 示意图/布置图 | (合并到 Slide 4) |
| Slide 6: 运动/检测方式 | Slide 5: 运动/检测方式 (不变) |
| Slide 7: 光学方案 | (合并到 Slide 4) |
| ... | ... |

这样每个工位的 PPT 从 10 页减少到约 **7-8 页**。

### 需要修改的文件

1. **新建** `src/components/canvas/SimpleLayoutDiagram.tsx` - 简化布局图组件
2. **修改** `src/components/canvas/BatchImageSaveButton.tsx` - 使用新组件生成图片
3. **修改** `src/services/pptx/workstationSlides.ts` - 合并 Slide 并整合信息
4. **修改** `src/services/pptxGenerator.ts` - 调整幻灯片生成调用顺序
5. **修改** `src/components/canvas/ModuleSchematic.tsx` - 预览中使用简化图

### 向后兼容

- 已保存的三视图 URL 仍然有效
- PPT 生成时如果检测到旧的三视图 URL，仍然可以使用
- 新保存的图片使用综合布局图格式
