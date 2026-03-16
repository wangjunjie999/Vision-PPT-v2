

# 第4页改为固定图片

## 方案

将用户上传的相机安装方向说明图片复制到 `public/ppt-covers/camera-mount-guide.png`，然后重写第4页生成代码：不再拼接两张相机照片和标注文字，而是将整张图片作为全幅背景铺满幻灯片内容区。

### 修改内容

**文件：`src/services/pptxGenerator.ts`（第891-948行）**

替换当前的标题+副标题+两张图片+标注文字代码，改为：

1. 使用 `addSlideTitle` 添加统一标题
2. 加载 `camera-mount-guide.png` 作为单张全幅图片
3. 图片铺满内容区（`contentLeft, contentTop + 0.5, contentWidth, contentHeight - 0.5`），使用 `contain` 缩放

```text
mountGuideSlide → addSlideTitle("相机安装方向说明")
加载 camera-mount-guide.png
addImage: x=contentLeft, y=contentTop+0.5, w=contentWidth, h=contentHeight-0.5, contain
```

约 30 行代码删减为 10 行。

