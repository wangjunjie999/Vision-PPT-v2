

# 修复引导功能：添加工位和模块步骤的提示

## 问题原因

引导系统的逻辑（GuideContext）正确地计算了当前步骤（project -> workstation -> module -> complete），但 **只有第一步 "创建项目" 在 UI 上有 GuideTip 和 GuideHighlight 组件**。工位和模块步骤没有对应的引导提示，所以创建项目后引导就"消失"了。

## 修改方案

### 1. 在 ProjectTree.tsx 中为"添加工位"按钮添加引导提示

当 `currentStep === 'workstation'` 时，在项目节点的右键菜单旁（或项目展开后的区域）显示 GuideTip，提示用户"点击 + 按钮为项目添加工位"。

具体位置：在项目节点的操作菜单区域，当项目已创建但没有工位时，用 GuideHighlight 高亮"新建工位"入口，并显示 GuideTip 气泡。

### 2. 在 ProjectTree.tsx 中为"添加模块"按钮添加引导提示

当 `currentStep === 'module'` 时，在工位节点的操作菜单区域显示 GuideTip，提示用户"为工位添加检测模块"。用 GuideHighlight 高亮对应按钮。

### 3. 添加"新建工位"和"新建模块"的快捷按钮（可选增强）

为了让引导更直观，在项目展开区域底部添加一个明显的"+ 新建工位"按钮（当工位为空时显示），在工位展开区域底部添加"+ 新建模块"按钮（当模块为空时显示）。这些按钮可以被 GuideHighlight 高亮。

## 技术细节

### 修改文件：`src/components/layout/ProjectTree.tsx`

**工位步骤引导**（约第 678-680 行，项目展开区域内）：
- 当 `isGuideActive && currentStep === 'workstation' && displayWorkstations.length === 0` 时，在项目展开的空区域内显示一个带 GuideHighlight 的"添加工位"按钮和 GuideTip 气泡
- GuideTip 消息："为项目添加检测工位，配置机械布局"
- stepNumber: 2, totalSteps: 4

**模块步骤引导**（约第 760 行，工位展开区域内）：
- 当 `isGuideActive && currentStep === 'module' && displayModules.length === 0` 时，在工位展开的空区域内显示一个带 GuideHighlight 的"添加模块"按钮和 GuideTip 气泡
- GuideTip 消息："为工位添加功能模块，选择检测类型"
- stepNumber: 3, totalSteps: 4

**确保项目/工位自动展开**：
- 当引导处于 workstation 步骤时，自动展开第一个项目
- 当引导处于 module 步骤时，自动展开第一个工位

### 修改文件：`src/components/layout/ProjectTree.tsx`（自动展开逻辑）

添加 useEffect，在 currentStep 变化时自动展开对应的树节点：

```
useEffect(() => {
  if (!isGuideActive) return;
  if (currentStep === 'workstation' && projects.length > 0) {
    setExpandedProjects(prev => new Set([...prev, projects[0].id]));
  }
  if (currentStep === 'module' && workstations.length > 0) {
    setExpandedWorkstations(prev => new Set([...prev, workstations[0].id]));
  }
}, [currentStep, isGuideActive, projects, workstations]);
```

