
目标：不再继续补丁式修修补补，而是把“3D 预览 -> 生成 2D 截图 -> 进入标注”这一块整体重做，验收标准只有一个：点击“截图并标注”后，界面中必须稳定显示可见的 2D 截图。

现状判断：
- 现在的问题不只是一处 bug，而是整条链路太复杂：`WebGL 截图 + Blob/ObjectURL + 模式切换 + AnnotationCanvas 复杂布局/变换` 全耦合在一起。
- 目前即使进入了标注模式，也不能证明“截图成功且可显示”；只是状态切换成功。
- 继续在现有实现上加重试、加延迟、加 revoke 管理，收益已经很低。

```text
现有链路
3D Viewer
  -> 直接截当前 WebGL 画布
  -> URL/状态切换
  -> AnnotationCanvas 再做复杂布局与变换
  -> 最终出现黑屏/空白

重做后链路
3D Viewer（只负责看）
  -> 独立 Capture Stage（只负责稳定导出 2D）
  -> 验证截图尺寸/可见性
  -> Annotation Stage（只负责显示与标注）
```

实施方案：

1. 重做截图架构：把“预览”和“导出”彻底拆开
- `src/components/product/Product3DViewer.tsx`
  - 改成纯预览组件，只负责模型显示、旋转、缩放、视角。
  - 不再承担最终截图导出的核心职责。
  - 只暴露当前相机状态/当前视角信息给上层。

- 新增一个独立的截图组件（建议新文件）
  - 例如：`src/components/product/ProductSnapshotRenderer.tsx`
  - 这个组件单独创建自己的渲染流程，专门用于导出 2D 图。
  - 它不依赖用户当前正在看的那块可见 WebGL 画布，避免当前画布时序、卸载、合成状态影响导出。
  - 统一做：
    - 加载模型/图片
    - 自动 fit 到相机
    - 固定背景
    - 等待资源 ready
    - 导出 PNG Blob/DataURL
    - 返回明确的 `width/height/src`

2. 重做 ProductViewerCanvas：只做“发起截图”和“切换状态”
- `src/components/canvas/ProductViewerCanvas.tsx`
- 删除当前多层 retry + objectURL 生命周期的复杂逻辑。
- 改成：
  - 点击按钮后进入“正在生成截图”状态
  - 保持当前界面不立即切走
  - 调用独立 Capture Stage 生成截图
  - 拿到结果后先验证：
    - 能正常解码
    - naturalWidth / naturalHeight > 0
    - 非极小空图
  - 只有验证通过才进入标注模式
  - 若失败，明确提示失败，不进入标注模式
- 这样可以把“截图失败”和“标注页显示失败”彻底分开。

3. 重做标注画布：改成“图片 + SVG 覆盖层”的简单实现
- `src/components/product/AnnotationCanvas.tsx`
- 当前这个组件同时处理：
  - object-contain 对齐
  - 缩放/平移/旋转/翻转
  - 坐标换算
  - 标注绘制
  - 加载状态
- 复杂度太高，重新实现时建议先降级为稳定版：
  - 底层显示一张确定可见的 `<img>`
  - 上层用 `<svg>` 作为标注层
  - 用图片天然尺寸做 `viewBox`
  - 标注仍保存为百分比坐标
- 第一版只保留必要能力：
  - 显示图片
  - 点/框/箭头/文本标注
  - 选择、拖动、删除
  - 基础缩放
- 暂时不要把旋转/翻转/复杂 pan 逻辑继续塞进去；先保证图一定显示，再逐步加能力。

4. 简化全局状态：改成单一 annotation session
- `src/store/useAppStore.ts`
- 现在 store 里是若干分散字段，建议改成一个结构化对象，例如：
  - `annotationSession: { src, width, height, assetId, scope, workstationId, sourceType }`
- viewer -> annotation 用一个原子 action 切换。
- 不再让组件各自管理截图 URL 生命周期。
- 若截图是临时 URL，由 store 在退出标注时统一清理。

5. AnnotationEditor 只负责业务，不再参与截图链路
- `src/components/canvas/AnnotationEditor.tsx`
- 保留现有保存逻辑、版本逻辑、上传逻辑。
- 只适配新的 `annotationSession` 数据结构。
- 进入页面时：
  - 如果没有 session，显示“没有截图数据”
  - 如果 session 有效，直接把 `src/width/height` 传给新的 AnnotationCanvas

6. 保存渲染逻辑保持兼容
- `src/utils/annotationRenderer.ts`
- 如果标注仍保存为百分比坐标，这里只需要继续按原图尺寸合成即可。
- 也就是说：后端表结构和保存格式尽量不动，只替换前端截图和展示实现。

技术细节：
- 这次不再把“是否黑帧”作为核心判定逻辑，而是把“是否生成了一张稳定、可显示、带尺寸的最终图片”作为唯一成功条件。
- 关键不是继续优化当前 WebGL canvas 截图，而是把导出流程从当前预览画布中解耦出来。
- AnnotationCanvas 改成 SVG 叠层后，图片显示会更可控，也更容易定位问题是“没图”还是“标注层问题”。

预计改动范围：
- 重写 `src/components/canvas/ProductViewerCanvas.tsx`
- 重写 `src/components/product/AnnotationCanvas.tsx`
- 重构 `src/components/product/Product3DViewer.tsx` 对外接口
- 调整 `src/store/useAppStore.ts`
- 轻改 `src/components/canvas/AnnotationEditor.tsx`
- 可能新增 1 个独立截图组件文件

验收标准：
1. 上传 GLB 后进入 3D 预览
2. 点击“截图并标注”
3. 必须先生成成功，再进入标注界面
4. 标注界面中必须立即看到真实 2D 截图，不允许黑屏、空白、假进入
5. 可在图上添加标注并保存
6. 连续多次重复进入/退出也稳定

如果按这个方案实施，我会把这块当作“重建一条更简单可靠的链路”，而不是继续在当前实现上补丁式修复。
