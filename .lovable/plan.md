

# 直接通过后端函数重新生成 DB260101 全部布局图

## 方案

项目已有 `generate-test-images` 后端函数，使用服务端权限绕过登录限制，直接生成 SVG 图片上传到存储并更新数据库。

### 需要做的事

1. **更新后端函数的 SVG 模板**（`supabase/functions/generate-test-images/index.ts`）
   - **正视图 `generateFrontView`**：将相机放到最顶部（Y=60），使用亮青色 `#22d3ee` 虚线表示拍摄方向，增加相机与光源/机构的间距
   - **侧视图 `generateSideView`**：同样调整相机位置到最上层，拍摄方向线改为亮青色
   - **俯视图 `generateTopView`**：FOV 指示线改为亮青色
   - **光学示意图 `generateSchematic`**：FOV 锥形线改为亮青色

2. **调用后端函数**，传入 `project_code: "DB260101"`，自动为 8 个工位生成全部三视图 + 模块示意图并写入数据库

### 预期结果

- 8 个工位 × 3 视图 = 24 张布局图 + 对应模块示意图，全部更新到数据库
- 无需登录，后端直接完成

