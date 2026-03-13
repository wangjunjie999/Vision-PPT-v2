

# 修复相机 GLB 模型跳转 + 本地缓存优化

## 问题分析

### 1. 模型跳转原因
`addCamera` 使用 `selectedCameraData?.[cameraCount]` 按**索引**取 GLB URL。当画布中已有 1 个相机，再添加第 2 个时取 `[1]`——如果 `selected_cameras[1]` 是另一个型号，就会拿到错误的 GLB。此外，`layout` 变量未加入 `useCallback` 依赖，闭包可能引用过期数据。

### 2. `GLBModelRenderer` 共享 scene 问题
`useGLTF` 按 URL 全局缓存 scene 对象。当前 `useMemo(() => scene.clone(), [scene])` 对同一 URL 只 clone 一次，但 `useEffect` 直接修改 `cloned` 的 `scale/position`——多个实例共享同一 `scene` 引用时可能产生竞态。

## 修复方案

### 1. `DraggableLayoutCanvas.tsx` — 相机选型弹窗
将 `addCamera` 改为弹窗选择模式：不再按索引盲取，而是弹出已配置的相机列表（从 `layout.selected_cameras`），用户选择具体型号后，直接使用该型号的 `model_3d_url`。若只有 1 个相机型号则自动选中。

- 新增 state: `cameraPickerOpen` + `pendingCameraSlot`
- 弹出简易 Dialog 列出 `selected_cameras`，每项显示品牌/型号
- 用户点选后调用现有 addCamera 逻辑，携带正确的 `model_3d_url`
- `useCallback` 依赖加入 `layout`

### 2. `Layout3DPreview.tsx` — GLB 实例隔离
为 `GLBModelRenderer` 添加唯一 key（使用 object id），并改用 `useRef` + 每次渲染时重新 clone，避免多实例间的 transform 污染：

```typescript
function GLBModelRenderer({ url, w, h, d }: {...}) {
  const { scene } = useGLTF(url);
  const groupRef = useRef<THREE.Group>(null);
  
  useEffect(() => {
    if (!groupRef.current) return;
    // 清空旧子节点
    while (groupRef.current.children.length) groupRef.current.remove(groupRef.current.children[0]);
    const cloned = scene.clone();
    // 缩放...
    groupRef.current.add(cloned);
  }, [scene, w, h, d]);
  
  return <group ref={groupRef} />;
}
```

### 3. 本地 GLB 缓存 — 扩展 `imageLocalCache.ts`
扩展现有 IndexedDB 缓存服务，增加 `glb_model` 类型：

- `ImageCacheType` 添加 `'glb_model'`
- 新增 `cacheGLBBlob(url, blob)` 和 `getCachedGLBUrl(url)` 方法，返回 `blob:` URL
- 在 `GLBModelRenderer` 中：先查 IndexedDB 缓存，命中则用本地 blob URL；未命中则 fetch 原始 URL 后写入缓存再使用
- TTL 设为 7 天（GLB 文件变化频率低）

### 4. 硬件管理上传后同步更新画布
在 `HardwareResourceManager.tsx` 中上传相机 GLB 后，已通过 `updateCamera` 写入数据库。需确保 `HardwareContext` 的实时订阅能将 `model_3d_url` 变更同步到前端状态，当前已有 Realtime 订阅逻辑，验证 `model_3d_url` 字段包含在 select 查询中即可。

## 涉及文件

| 文件 | 改动 |
|------|------|
| `DraggableLayoutCanvas.tsx` | 相机选型弹窗，修复 addCamera 逻辑 |
| `Layout3DPreview.tsx` | GLBModelRenderer 实例隔离 |
| `imageLocalCache.ts` | 添加 GLB blob 缓存支持 |
| `HardwareContext.tsx` | 验证 cameras query 含 model_3d_url |

约 80 行新增/修改代码。

