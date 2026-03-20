

# 修复切换模块时打光照片不更新

## 问题

`LightingPhotosPanel` 使用 `useState(initialPhotos)` 初始化照片列表。`useState` 的初始值只在组件首次挂载时生效，当切换模块导致 `moduleId` 和 `initialPhotos` 变化时，状态不会更新，导致显示的始终是第一个模块的照片。

## 方案

**文件：`src/components/canvas/LightingPhotosPanel.tsx`**

添加 `useEffect` 监听 `moduleId` 变化，当模块切换时重置 `photos` 状态：

```typescript
import { useState, useCallback, useEffect } from 'react';

// 在 useState 后添加：
useEffect(() => {
  setPhotos(initialPhotos || []);
}, [moduleId]);
```

单文件改动，约 3 行代码。

