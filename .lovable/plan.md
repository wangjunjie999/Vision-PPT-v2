

# 加深拍摄方向虚线颜色

## 改动文件
`src/components/canvas/SimpleLayoutDiagram.tsx`

## 具体改动

1. **虚线颜色**：`#06b6d4`（浅青色）→ `#22d3ee`（亮青色），opacity 从 0.6 → 0.9
2. **虚线宽度**：strokeWidth 从 2 → 2.5
3. **目标圆点**：opacity 从 0.7 → 1.0，半径从 3 → 4
4. **"拍摄"标签文字**：`#67e8f9` → `#ffffff`（白色），fontSize 从 8 → 10
5. **箭头 marker**：arrow-cyan 的 fill opacity 从 0.7 → 1.0
6. **图例虚线**：同步更新颜色和文字颜色

共涉及约 6 处小修改，均在同一文件内。

