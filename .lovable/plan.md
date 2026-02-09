
# 为8种执行机构生成真实图片并更新数据库

## 概述

为数据库中的 8 种执行机构（机械臂、气缸、夹爪、顶升机构、定位挡停、传送带、旋转台、视觉支架）各生成 3 张真实风格的工业图片（正视图、侧视图、俯视图），共 24 张图片。生成后上传到云端存储，并更新数据库中的 URL。

## 当前状态

- 数据库中 8 条机构记录的图片 URL 都指向本地路径（如 `/src/assets/mechanisms/xxx.png`），这些路径在线上环境无法访问
- 本地有打包的工程线稿图作为回退，但风格不够真实

## 实施步骤

### 1. 创建边缘函数生成图片

创建一个边缘函数 `generate-mechanism-images`，使用 Lovable AI 支持的图片生成模型（`google/gemini-2.5-flash-image`）为每种机构生成三视图。

每种机构的提示词将针对具体类型定制，例如：
- **机械臂**: "Industrial 6-axis robot arm, metallic silver, on white background, front/side/top view, photorealistic, clean engineering style"
- **气缸**: "Industrial pneumatic cylinder actuator, aluminum body, on white background..."
- **夹爪**: "Industrial pneumatic gripper, parallel jaw type..."
- 依此类推

### 2. 上传到存储桶

- 确保 `hardware-images` 存储桶存在（已有）
- 将生成的图片上传到 `hardware-images/mechanisms/` 路径下
- 文件命名规则：`mechanisms/{type}_{view}.png`（如 `mechanisms/robot_arm_front.png`）

### 3. 更新数据库记录

生成并上传完成后，用存储桶的公开 URL 更新 `mechanisms` 表中每条记录的三个图片字段。

### 4. 更新本地资源（可选）

将生成的图片也保存到 `src/assets/mechanisms/` 目录，替换原有的工程线稿，保持本地回退资源也是真实风格。

## 技术细节

### 边缘函数设计

```text
generate-mechanism-images/
  index.ts
    - 接收参数: { types?: string[] }  (可选，不传则生成全部8种)
    - 对每种机构的3个视角调用 AI 图片生成
    - 将 base64 结果上传到 Storage
    - 更新 mechanisms 表的 URL 字段
    - 返回生成结果摘要
```

### 图片生成提示词策略

每张图片使用统一的风格约束 + 具体机构描述：
- 白色背景、工业产品摄影风格
- 金属质感、真实光影
- 明确标注视角（正面/侧面/俯视）

### 文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `supabase/functions/generate-mechanism-images/index.ts` | 新建 | AI 图片生成边缘函数 |
| `src/components/admin/MechanismResourceManager.tsx` | 修改 | 添加"一键生成真实图片"按钮 |
| `src/assets/mechanisms/*.png` | 替换 | 用生成的真实图片替换工程线稿 |

### 数据库更新

8 条 mechanisms 记录的 `front_view_image_url`、`side_view_image_url`、`top_view_image_url` 字段将从本地路径更新为存储桶的绝对 URL。
