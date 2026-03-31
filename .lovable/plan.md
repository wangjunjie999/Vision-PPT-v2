

# 修复引导循环：模块创建后自动结束引导

## 问题
`currentStep` 纯粹基于数据状态计算（有无项目/工位/模块），永远不会自动 dismiss。当用户创建了模块后 `currentStep` 变为 `'complete'`，但 `isGuideActive` 仍为 `true`（因为从未调用 `dismissGuide`）。如果数据刷新或切换视图，引导可能继续闪烁在工位/模块步骤上。

## 方案

**文件：`src/contexts/GuideContext.tsx`**

在 `currentStep` 计算后加一个 `useEffect`：当 `currentStep === 'complete'` 且引导未被手动 dismiss 时，自动调用 `dismissGuide()`，并将 `completedSteps` 标记为全部完成。

```text
useEffect(() => {
  if (currentStep === 'complete' && !dismissed) {
    setDismissed(true);
    setShowWelcome(false);
  }
}, [currentStep, dismissed]);
```

这样一旦项目、工位、模块都存在，引导立即结束，不再循环。

只修改 1 个文件，约 5 行代码。

