

# 将打光照片从页面底部提升为标签页切换

## 改动

在 `ModuleSchematic.tsx` 的 Header 下方添加 `Tabs` 组件，分为两个标签页：

- **光学示意图** — 当前的 VisionSystemDiagram 画布 + Module Info Badge + 保存/导出按钮
- **打光照片** — 当前的 LightingPhotosPanel

使用已有的 `src/components/ui/tabs.tsx`（Radix Tabs）实现。

## 具体改动

**文件：`src/components/canvas/ModuleSchematic.tsx`**

1. 引入 `Tabs, TabsList, TabsTrigger, TabsContent`
2. 在 Header 区域下方包裹 `<Tabs defaultValue="schematic">`
3. TabsList 放两个 trigger：`光学示意图` 和 `打光照片`（带图标区分）
4. 将现有的 diagram `div` 放入 `<TabsContent value="schematic">`
5. 将 `LightingPhotosPanel` 放入 `<TabsContent value="lighting">`
6. 导出/保存按钮仅在光学示意图标签页可见（或根据当前 tab 切换按钮）

改动集中在一个文件，约 20 行调整。

