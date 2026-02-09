
# PPT图片清晰度优化方案

## 问题诊断

经过代码分析，发现PPT中图片模糊的根本原因是 **图片保存时使用了 `fast` 质量预设**：

| 参数 | fast (当前) | standard (建议) | high (最佳) |
|------|------------|-----------------|-------------|
| pixelRatio | 1 | 1.5 | 2 |
| quality | 0.6 | 0.8 | 0.92 |
| maxWidth | 1200px | 1800px | 2400px |
| maxHeight | 800px | 1200px | 1600px |

`pixelRatio: 1` 意味着不做高清渲染，`quality: 0.6` 的JPEG压缩率过高，导致文字和线条出现明显模糊和压缩伪影。

## 修改方案

### 1. 升级 BatchImageSaveButton 的图片质量

**文件**: `src/components/canvas/BatchImageSaveButton.tsx`

将三视图和示意图的渲染质量从 `'fast'` 改为 `'standard'`：

- 三视图布局渲染: `quality: 'fast'` -> `quality: 'standard'`
- 示意图渲染: `quality: 'fast'` -> `quality: 'standard'`

这会将分辨率提升约2.25倍（1.5x pixelRatio），JPEG质量从0.6提升到0.8。

### 2. 可选：提供质量选择

在 BatchImageSaveButton 组件中增加一个可选的质量切换，允许用户选择 "标准" 或 "高清" 模式。高清模式使用 `'high'` 预设（pixelRatio: 2, quality: 0.92）。

## 技术细节

- `standard` 预设生成的图片约 1800x1200px，在PPT三视图的 ~3英寸宽容器中可提供约 600 DPI 的有效分辨率，远超打印所需的 150 DPI
- 内存安全机制不受影响：代码中已有 `pixelRatio` 上限为 2 的限制和低质量重试逻辑
- 文件大小预计增加约 2-3 倍，但对云存储空间影响可控

## 影响范围

- 仅影响新保存的图片，已保存的图片不会自动更新
- 用户需要重新点击"批量保存"按钮来生成高清版本
- PPT生成逻辑（imagePreloader、workstationSlides）无需修改，它们已正确处理各种分辨率的图片
