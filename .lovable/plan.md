

# Logo展示动效与设计增强

## 目标
为顶部工具栏和登录页的Logo添加更丰富的动效和视觉设计，提升品牌感和高级感。

## 修改内容

### 1. 顶部工具栏 Logo (`src/components/layout/TopToolbar.tsx`)

**当前状态**: 悬停时仅有简单的opacity变化和一个blur发光层。

**增强方案**:
- Logo容器添加渐变边框（从primary到accent的微妙渐变）
- 悬停时Logo轻微上浮 + 放大（translateY(-2px) scale(1.05)）
- 发光层改为双色渐变发光（primary + accent），增加呼吸感
- 旁边文字"视觉方案配置系统"添加悬停时的渐变色过渡效果
- 添加一个微妙的光泽扫过动画（shimmer），页面加载时播放一次

### 2. 登录页 Logo (`src/pages/Auth.tsx`)

**当前状态**: 有spring弹入动画和shadow-primary阴影。

**增强方案**:
- 弹入后添加持续的悬浮浮动动画（上下轻微浮动）
- Logo周围添加光晕环（rotating gradient ring），缓慢旋转
- 底部添加模糊倒影效果，增加纵深感
- 增强阴影为多层渐变阴影

### 3. 自定义动画关键帧 (`tailwind.config.ts`)

添加以下新动画：
- `shimmer`: 光泽扫过效果
- `float`: 上下浮动效果
- `glow-pulse`: 发光呼吸效果

## 技术细节

- 工具栏shimmer使用CSS `background-position`动画 + 线性渐变实现
- 登录页浮动用`translateY`的infinite动画
- 旋转光晕用`conic-gradient` + `rotate`动画
- 所有动画使用`prefers-reduced-motion`媒体查询适配无障碍需求

## 文件变更
| 文件 | 变更 |
|------|------|
| `tailwind.config.ts` | 添加shimmer/float/glow-pulse关键帧和动画 |
| `src/components/layout/TopToolbar.tsx` | Logo区域增强悬停动效、shimmer光泽、渐变边框 |
| `src/pages/Auth.tsx` | Logo浮动动画、旋转光晕环、倒影效果 |

