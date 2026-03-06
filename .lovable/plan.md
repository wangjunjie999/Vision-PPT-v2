

# 相机等轴测3D立方体补全缺失面

## 问题
相机的 isometric 3D 立方体只渲染了 3 个面（top、front、right），缺少 **left face**（左侧面），导致看起来不是立体的。产品的 3D 立方体正确渲染了 4 个面（包含 left face）。

## 改动（单文件 `DraggableLayoutCanvas.tsx`）

### Line 2194-2196: 添加 leftFace 定义
在现有的 `topFace`/`frontFace`/`rightFace` 之后添加：
```typescript
const leftFace = `${t0.x},${t0.y} ${t3.x},${t3.y} ${b3.x},${b3.y} ${b0.x},${b0.y}`;
```

### Line 2199-2203: 添加 leftFace 颜色
```typescript
const fillLeft = isMounted ? '#15803d' : '#1e40af';
```

### Line 2231-2234: 在渲染块中添加 leftFace polygon
在 `frontFace` polygon 之前插入：
```tsx
<polygon points={leftFace} fill={fillLeft} fillOpacity="0.3" stroke={strokeColor} strokeWidth="1" strokeDasharray="4 2" />
```

与产品的渲染方式完全一致：left face 用较低透明度 + 虚线描边，区分于正面和右侧面。

