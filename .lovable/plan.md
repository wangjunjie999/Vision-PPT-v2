

# 修复 PPT 生成完成后卡在 spinner 无法下载

## 问题分析

在三个生成路径（Word、PDF、PPT from scratch）中，`await saveToHistory(blob, ...)` 在 `setStage('complete')` **之前**被调用。`saveToHistory` 需要将 blob 上传到存储桶再插入数据库记录，如果上传缓慢或失败，UI 就会卡在 spinner 状态，用户无法看到下载按钮。

具体位置：
- Word 生成：第 823 行 `await saveToHistory(...)` 在第 826 行 `setStage('complete')` 之前
- PDF 生成：第 955 行 `await saveToHistory(...)` 在第 958 行 `setStage('complete')` 之前  
- PPT scratch：第 1094 行 `await saveToHistory(...)` 在第 1097 行 `setStage('complete')` 之前

## 修改方案

### 文件：src/components/dialogs/PPTGenerationDialog.tsx

**核心改动**：在三个生成路径中，将 `setStage('complete')` 和 `setIsGenerating(false)` 移到 `saveToHistory` 之前，并将 `saveToHistory` 改为非阻塞的 fire-and-forget 调用。

#### 1. Word 生成路径（约第 822-828 行）

将：
```
await saveToHistory(blob, wordFileName, 'word', generationMethod, 1);
addLog('success', ...);
setStage('complete');
setIsGenerating(false);
```

改为：
```
addLog('success', ...);
setStage('complete');
setIsGenerating(false);
// 非阻塞保存历史记录
saveToHistory(blob, wordFileName, 'word', generationMethod, 1);
```

#### 2. PDF 生成路径（约第 954-959 行）

同理，先 `setStage('complete')`，再 fire-and-forget `saveToHistory`。

#### 3. PPT scratch 路径（约第 1093-1098 行）

同理，先 `setStage('complete')`，再 fire-and-forget `saveToHistory`。

### 附加修复：product_assets 无限查询循环（第 247 行 useEffect）

当前 `useEffect` 的依赖数组包含 `projectWorkstations` 和 `getWorkstationModules`，这两个值在每次渲染都会产生新引用，导致 effect 无限触发，产生 150+ 并发请求。

修复方式：使用 `useRef` 存储 `projectWorkstations` 和 `getWorkstationModules` 的引用，在 effect 内部通过 ref 访问，依赖数组仅保留 `open`、`user?.id`、`selectedProjectId`。

## 涉及文件

| 文件 | 操作 |
|------|------|
| src/components/dialogs/PPTGenerationDialog.tsx | 将 saveToHistory 改为非阻塞；修复 useEffect 依赖导致的无限循环 |

