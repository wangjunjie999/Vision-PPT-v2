
目标：修复“GLB 3D 视图能正常显示，但点击截图并标注后，2D 标注页不显示图片”的问题。

我从当前代码判断，这不是单一的 3D 渲染问题，而是“截图结果交接到标注页”的链路不够稳。

```text
Product3DViewer.takeScreenshot()
  -> ProductViewerCanvas.handleScreenshot()
  -> useAppStore.annotationSnapshot
  -> AnnotationEditor
  -> AnnotationCanvas <img src={annotationSnapshot}>
```

一、问题定位

1. 截图校验过于宽松  
   `src/components/canvas/ProductViewerCanvas.tsx` 里现在只判断：
   - 是否存在
   - 是否以 `data:image` 开头  
   这会把“可解码失败的空 data URL / 损坏帧 / 黑帧”也当成成功结果传给标注页。

2. 截图结果以超大的 base64 字符串进入全局持久化 store  
   `src/store/useAppStore.ts` 使用了 `persist`，而 `annotationSnapshot`、`viewerAssetData`、`annotationMode` 这些临时态也被一起持久化。  
   对 GLB 截图来说，base64 体积很大，容易带来：
   - 状态写入压力大
   - 本地存储配额风险
   - 标注页拿到无效/异常快照源

3. 标注页缺少“图片加载失败”的显式兜底  
   `src/components/product/AnnotationCanvas.tsx` 依赖 `<img onLoad>` 设置尺寸；如果图片解码失败，目前没有明确错误提示和回退逻辑，表现就是“2D 图不显示”。

二、实施方案

1. 重构截图结果格式：优先改成 Blob/Object URL，而不是直接传大 base64  
   文件：
   - `src/components/product/Product3DViewer.tsx`
   - `src/components/canvas/ProductViewerCanvas.tsx`

   做法：
   - 将 `takeScreenshot` 改为异步返回更可靠的截图结果
   - 优先使用 `canvas.toBlob()` 生成 PNG
   - 用 `URL.createObjectURL(blob)` 作为标注页图片源
   - 保留失败重试逻辑

   这样可以显著降低内存和状态传输压力。

2. 在进入标注页前做“可解码校验”  
   文件：
   - `src/components/canvas/ProductViewerCanvas.tsx`

   做法：
   - 截图后，不要立刻 `exitViewerMode + enterAnnotationMode`
   - 先创建一个临时 `Image`
   - 只有在 `onload` 成功且 `naturalWidth/naturalHeight > 0` 时，才切换到标注模式
   - 若失败：
     - 先重试一次截图
     - 若有 `imageUrls`，回退到首张图片
     - 若仍失败，明确提示“截图生成失败”，不要把坏图传进标注页

3. 把截图相关状态从持久化 store 中剥离  
   文件：
   - `src/store/useAppStore.ts`

   做法：
   - 对 `persist` 增加 `partialize`
   - 不持久化以下临时字段：
     - `annotationMode`
     - `annotationSnapshot`
     - `annotationAssetId`
     - `annotationScope`
     - `annotationWorkstationId`
     - `annotationExistingData`
     - `viewerMode`
     - `viewerAssetData`

   这些都是会话级临时 UI 状态，不应该写进持久化存储。

4. 给标注页补上加载失败反馈与清理逻辑  
   文件：
   - `src/components/product/AnnotationCanvas.tsx`
   - `src/components/canvas/AnnotationEditor.tsx`

   做法：
   - 增加图片 `onError` 状态
   - 当截图源加载失败时，显示“截图加载失败，请返回重新截图”
   - 如果使用 Object URL，在退出标注或重新截图时主动 `revokeObjectURL`

三、技术细节

- 当前最可疑的点不是 3D 模型本身，而是“坏截图仍被当成成功图源”
- 之前对 WebGL 的 DPR、双 render、800ms 重试是必要的，但还不够
- 真正需要补的是两层保障：
  1. 截图结果必须先“能被浏览器正常解码”
  2. 截图结果不能再走“大 base64 + persist store”这条脆弱链路

四、改动范围

预计涉及 4 个文件：
- `src/components/product/Product3DViewer.tsx`
- `src/components/canvas/ProductViewerCanvas.tsx`
- `src/store/useAppStore.ts`
- `src/components/product/AnnotationCanvas.tsx`

五、验收方式

1. 上传仅含 GLB 的产品素材
2. 进入 3D 预览并旋转到任意角度
3. 点击“截图并标注”
4. 验证：
   - 能稳定进入标注页
   - 2D 图片能正常显示
   - 能添加标注并保存
   - 返回后再次截图仍正常
   - 大模型/高分辨率视口下不再出现“进入了标注页但图片不显示”
