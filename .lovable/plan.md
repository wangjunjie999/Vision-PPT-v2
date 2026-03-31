

# 修复3D查看器：产品居中 + 全方位照明

## 问题分析

### 1. 产品不居中
当前 `Model` 组件的居中逻辑有 bug：
```js
modelRef.current.position.sub(center);  // 先设偏移
modelRef.current.scale.setScalar(scale); // 再缩放 → 偏移也被缩放了
```
缩放会作用于 position，导致最终偏移 = `-center × scale`，不是 `-center`。产品偏离原点。

### 2. 照明不足
目前只有 1 个环境光 (0.5) + 2 个方向光，背面和侧面偏暗，截图时细节不清晰。

## 方案

**文件：`src/components/product/Product3DViewer.tsx`**

### 修复居中
```typescript
// 正确的居中逻辑：先缩放center，再取反
modelRef.current.scale.setScalar(scale);
modelRef.current.position.copy(center).multiplyScalar(-scale);
```

### 增强照明（6 光源全方位打光）
- 提升环境光强度：0.5 → 0.8
- 保留主光源 `[10,10,5]` 强度 1.0
- 保留副光源 `[-10,10,-5]` 强度 0.5
- 新增底部补光 `[0,-8,0]` 强度 0.3（照亮底面）
- 新增正面补光 `[0,2,10]` 强度 0.4（照亮正面细节）
- 新增背面补光 `[0,2,-10]` 强度 0.3（照亮背面）

这样产品每一面都有充足光照，截图时细节清晰。

### 改动范围
仅修改 `Product3DViewer.tsx`，约 10 行代码。

