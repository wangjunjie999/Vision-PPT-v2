

# 删除"相机安装方向说明"页面

## 改动

### 文件：`src/services/pptxGenerator.ts`

删除第 887-941 行（整个 SLIDE 4 代码块），包括：
- 幻灯片创建、标题、说明文字
- `camera-front-photo.png` 和 `camera-back-photo.png` 的加载与插入
- "长边"标注文字

### 文件：删除静态图片资源

- `public/ppt-covers/camera-front-photo.png`
- `public/ppt-covers/camera-back-photo.png`

这两张图片仅被此页面使用，删除后无影响。

### 进度条调整

删除该页后，原来的 `progress = 12` 进度步骤一并移除，后续工位幻灯片的进度起始值不受影响（已从更高值开始）。

共涉及 ~55 行代码删除 + 2 个图片文件删除。

