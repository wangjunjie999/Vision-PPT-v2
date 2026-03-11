

# 修复"添加机构"下拉菜单中的缩略图优先级

## 问题

`MechanismThumbnail` 组件（`src/components/common/ImageWithFallback.tsx` 第 152 行）的图片优先级仍然是 **本地资源优先**：

```typescript
const primarySrc = localImageUrl || databaseUrl;  // 错误：本地优先
```

这导致即使在数据库中上传了新图片，添加机构下拉菜单仍然显示旧的本地静态图片。

## 修复方案

修改 `MechanismThumbnail` 组件的优先级为 **数据库 URL 优先 → 本地资源兜底**，与之前修复的 `MechanismResourceManager` 和 `DraggableLayoutCanvas` 保持一致。

### 文件：`src/components/common/ImageWithFallback.tsx`

```typescript
// 改前 (第 150-153 行):
// Priority: local assets first (most reliable), then database URL
const localImageUrl = getMechanismImage(type, view);
const primarySrc = localImageUrl || databaseUrl;
const fallbackSrc = localImageUrl ? databaseUrl : null;

// 改后:
// Priority: database URL first (user uploaded), local assets as fallback
const localImageUrl = getMechanismImage(type, view);
const primarySrc = databaseUrl || localImageUrl;
const fallbackSrc = databaseUrl ? localImageUrl : null;
```

同时修复 `onError` 处理逻辑，使其在数据库 URL 失败时正确回退到本地资源显示。

