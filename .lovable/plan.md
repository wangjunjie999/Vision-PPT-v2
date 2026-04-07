
目标：把“点击截图并标注后，界面必须正确展示 2D 截图”作为唯一验收标准来修复。

我会按下面思路实施，而不是继续只优化截图质量：

1. 明确当前最可能的主因
   - 现在截图优先走 `Blob -> URL.createObjectURL(...)`
   - 这个 object URL 保存在 `ProductViewerCanvas`
   - 但 `handleScreenshot` 里一进入标注模式前就会触发 `exitViewerMode()`
   - `ProductViewerCanvas` 卸载时会在 cleanup 里 `URL.revokeObjectURL(objectUrlRef.current)`
   - 结果是：传给 `AnnotationCanvas` 的 `imageUrl` 很可能已经失效，所以 2D 图不显示

   ```text
   takeScreenshotBlob()
     -> createObjectURL()
     -> enterAnnotationMode(imageUrl)
     -> ProductViewerCanvas unmount
     -> revokeObjectURL(imageUrl)
     -> AnnotationCanvas <img src=imageUrl> 加载失败
   ```

2. 核心修复方案
   - 把截图 URL 的“生命周期管理”从 `ProductViewerCanvas` 挪到全局标注状态
   - 不再在 `ProductViewerCanvas` 卸载时销毁当前截图 URL
   - 由 `useAppStore` 在以下时机统一清理：
     - 退出标注模式
     - 新截图替换旧截图
   - 这样标注页拿到的截图在整个标注会话内都保持有效

3. 具体改动
   - `src/store/useAppStore.ts`
     - 给标注快照增加元信息，例如是否需要 revoke
     - 新增一个“从查看器切到标注”的单一 action，一次性完成：
       - `viewerMode = false`
       - `annotationMode = true`
       - `annotationSnapshot = objectUrl`
       - 保存 cleanup 信息
     - 在 `exitAnnotationMode` 中负责 revoke 当前 object URL
   - `src/components/canvas/ProductViewerCanvas.tsx`
     - 删除当前 unmount 时无条件 revoke 的逻辑
     - 截图成功后，调用新的 store action 原子切换模式
     - 保留截图解码校验，但不在这里销毁已经交给标注页使用的 URL
   - `src/components/canvas/AnnotationEditor.tsx`
     - 保持从 store 读取截图
     - 如需要，可在组件卸载时补一层保护清理，但以 store 为主
   - `src/components/product/AnnotationCanvas.tsx`
     - 保留现有 `onError` 提示
     - 增加更明确的“图片加载中 / 加载失败”状态，便于确认到底是没图还是图失效

4. 次级稳定性修复
   - `src/components/product/Product3DViewer.tsx`
     - 继续保留 DPR 限制和截图前 render
     - 检查并修正当前控制台里的 ref warning，避免渲染树异常干扰截图链路
   - 这些是稳定性增强，但优先级低于“确保 2D 图能显示”

5. 验收方式
   - 上传 GLB
   - 进入 3D 预览
   - 点击“截图并标注”
   - 必须满足：
     - 标注页中能立即看到 2D 截图
     - 不是黑屏、空白、破图
     - 可以在该图上继续标注
     - 返回后再次截图仍然正常
     - 连续多次进入/退出标注模式后也不丢图

6. 若首轮修复后仍失败，我会继续排查的下一层
   - 是否在切模式时发生了中间态重渲染，导致 `annotationSnapshot` 被覆盖
   - 是否 `AnnotationCanvas` 的容器尺寸计算为 0，导致图片已加载但不可见
   - 是否 WebGL context lost 后拿到的是空白 PNG，需要在截图前等待一帧稳定后再切换
