

# 性能优化方案

## 当前性能瓶颈分析

1. **零代码分割**：所有组件同步导入，首次加载需要下载全部代码（Three.js、pptxgenjs、jspdf、docx、xlsx 等大型库全部打包在初始 bundle 中）
2. **Layout3DPreview.tsx 有 2564 行**：这个巨大的 3D 组件始终被打包
3. **ParticleBackground 持续动画**：登录页 300 粒子 + 连线计算每帧运行（低端机 CPU 压力大）
4. **Three.js 全量导入**：`@react-three/fiber` + `@react-three/drei` + `three` 约 500KB+ gzipped

## 优化策略（不改变功能和效果）

### 1. React.lazy 代码分割（影响最大）

将重型组件改为懒加载，首屏只加载必要代码：

**文件：`src/components/layout/CanvasArea.tsx`**
- 将 `Layout3DPreview`（通过 `WorkstationCanvas`）、`ModuleSchematic`、`AnnotationEditor`、`ProductViewerCanvas`、`ProjectDashboard` 改为 `React.lazy` 导入
- 用 `<Suspense fallback={<Loading />}>` 包裹

**文件：`src/pages/Auth.tsx`**
- `ParticleBackground` 改为 `React.lazy` 导入

**文件：`src/components/layout/MainLayout.tsx`**
- `AdminCenter` 改为 `React.lazy` 导入

### 2. 动态导入重型生成库

**文件：`src/services/pptxGenerator.ts`、`pdfGenerator.ts`、`docxGenerator.ts`**
- 将 `import pptxgen from 'pptxgenjs'` 改为函数内 `const pptxgen = (await import('pptxgenjs')).default`
- 同理处理 `jspdf`、`docx`、`xlsx`
- 这些库只在用户点击"生成报告"时才加载，不影响首屏

### 3. ParticleBackground 性能优化

**文件：`src/components/effects/ParticleBackground.tsx`**
- 降低默认粒子数从 300 → 150
- 鼠标未激活时降低帧率：使用 `setTimeout` 替代 `requestAnimationFrame`（约 15fps idle vs 60fps active）
- 移除鼠标未激活时的连线计算（O(n²) 复杂度）
- 添加 `devicePixelRatio` 限制（低端机限制为 1）

### 4. Vite 构建优化

**文件：`vite.config.ts`**
- 配置 `build.rollupOptions.output.manualChunks` 将 three.js 和报告生成库分离到独立 chunk
- 这样结合 lazy loading，未使用的 chunk 不会被加载

```typescript
manualChunks: {
  'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
  'report-vendor': ['pptxgenjs', 'jspdf', 'docx', 'xlsx'],
  'chart-vendor': ['recharts'],
}
```

### 5. 图片和资源优化

**文件：`src/components/common/ImageWithFallback.tsx`**
- 添加 `loading="lazy"` 属性
- 添加 `decoding="async"` 属性

## 预期效果

| 指标 | 优化前 | 优化后 |
|------|--------|--------|
| 初始 JS bundle | ~2MB+ | ~500KB（主 chunk） |
| 首屏加载时间 | 慢（全量加载） | 快（仅加载认证页必要代码） |
| 低端机 3D 页面 | 同步阻塞 | 按需加载，带 loading 提示 |
| 空闲 CPU（登录页） | 粒子60fps持续 | 15fps idle，60fps hover |

## 涉及文件

| 文件 | 操作 |
|------|------|
| `src/components/layout/CanvasArea.tsx` | React.lazy 懒加载子组件 |
| `src/pages/Auth.tsx` | 懒加载 ParticleBackground |
| `src/components/layout/MainLayout.tsx` | 懒加载 AdminCenter |
| `src/components/effects/ParticleBackground.tsx` | 降低空闲帧率和粒子数 |
| `src/services/pptxGenerator.ts` | 动态导入 pptxgenjs |
| `src/services/pdfGenerator.ts` | 动态导入 jspdf |
| `src/services/docxGenerator.ts` | 动态导入 docx |
| `vite.config.ts` | manualChunks 分包 |
| `src/components/common/ImageWithFallback.tsx` | lazy loading 属性 |

