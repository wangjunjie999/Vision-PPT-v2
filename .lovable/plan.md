

# 默认交付版 + 检查面板收起

两处改动，都在 `src/components/dialogs/PPTGenerationDialog.tsx`：

1. **默认选择交付版**：L103 将 `useState<GenerationMode>('draft')` 改为 `useState<GenerationMode>('final')`
2. **检查面板默认收起**：L135 将 `useState(true)` 改为 `useState(false)`

