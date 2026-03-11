

# 修复图片同步：数据库图片全局替换本地旧图

## 问题

1. **`MechanismThumbnail` 的 `onError` 回退逻辑有缺陷**（ImageWithFallback.tsx 第 175-188 行）：当数据库 URL 加载失败时，代码创建了一个临时 `img` 元素测试 fallback，但即使 fallback 加载成功也无法更新已渲染的 `<img>` 标签的 `src`，注释已承认这个问题（"we can't easily swap in React"）。结果是显示 emoji 而非回退到本地图片。

2. **`MechanismSVG.tsx` 注释误导**（第 430 行）：注释写着 "LOCAL ASSETS FIRST" 但实际代码 `imageUrl || localImageUrl` 是正确的（DB 优先）。需要更正注释。

## 修复方案

### 文件：`src/components/common/ImageWithFallback.tsx`

重写 `MechanismThumbnail` 的图片加载逻辑，使用 state 管理当前显示的 src：
- 初始显示 `primarySrc`（数据库 URL 优先）
- `onError` 时自动切换到 `fallbackSrc`（本地资源）
- fallback 也失败时才显示 emoji

```tsx
const MechanismThumbnail = memo(function MechanismThumbnail({ type, view, databaseUrl, ... }) {
  const localImageUrl = getMechanismImage(type, view);
  const primarySrc = databaseUrl || localImageUrl;
  const fallbackSrc = databaseUrl ? localImageUrl : null;
  const [currentSrc, setCurrentSrc] = useState(primarySrc);
  const [showFallbackEmoji, setShowFallbackEmoji] = useState(false);

  useEffect(() => {
    // 当 databaseUrl 变化时重置
    setCurrentSrc(databaseUrl || localImageUrl);
    setShowFallbackEmoji(false);
  }, [databaseUrl, type, view]);

  const handleError = () => {
    if (currentSrc === primarySrc && fallbackSrc) {
      setCurrentSrc(fallbackSrc); // 切换到本地回退
    } else {
      setShowFallbackEmoji(true); // 全部失败，显示 emoji
    }
  };

  return showFallbackEmoji || !currentSrc 
    ? <span>⚙️</span> 
    : <img src={currentSrc} onError={handleError} />;
});
```

### 文件：`src/components/canvas/MechanismSVG.tsx`

更正第 430 行注释为 "database URL first, local assets as fallback"。

### 涉及文件
- `src/components/common/ImageWithFallback.tsx` — 重写回退逻辑
- `src/components/canvas/MechanismSVG.tsx` — 更正注释

