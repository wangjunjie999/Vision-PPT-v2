

# 自动填充像素精度（分辨率）

## 问题

当前计算出像素精度后，用户还需点击"自动计算"按钮才能填入。用户希望计算结果直接自动写入分辨率输入框。

## 修改方案

### `src/components/forms/module/ModuleStep3Imaging.tsx`

1. 将 `handleAutoCalculate` 的手动触发改为 `useEffect` 自动触发：当 `calculationResult.resolutionPerPixel` 变化且有值时，自动写入 `form.resolutionPerPixel`。

2. 移除"自动计算"按钮（分辨率标签旁的小计算器图标按钮 + 顶部 banner 中的"自动计算"按钮），因为不再需要手动触发。

3. 保留计算结果预览区域（显示是否满足精度要求等信息），但去掉"建议值"提示文字（因为已经自动填入了）。

```typescript
// 新增 useEffect 替代手动按钮
useEffect(() => {
  if (calculationResult.resolutionPerPixel) {
    setForm(p => ({ ...p, resolutionPerPixel: calculationResult.resolutionPerPixel || '' }));
  }
}, [calculationResult.resolutionPerPixel, setForm]);
```

