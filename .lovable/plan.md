

# Fix: `(obj.name || obj.label).slice is not a function` crash in batch image save

## Root Cause

The error occurs in `src/components/canvas/SimpleLayoutDiagram.tsx` line 522. When layout objects are loaded from the database, `obj.name` can be a non-string value (e.g., an object like `{zh: "...", en: "..."}` or a number). Calling `.slice()` on a non-string crashes the rendering, which breaks the entire ProjectDashboard via the ErrorBoundary.

This crash is triggered during batch image save because the `OffscreenSimpleLayout` component in `BatchImageSaveButton.tsx` renders `SimpleLayoutDiagram`, which hits this code path.

## Fix

**File: `src/components/canvas/SimpleLayoutDiagram.tsx`** (line 522)

Add a safe string coercion:

```typescript
// Before:
{(obj.name || obj.label).slice(0, 16)}

// After:
{String(obj.name || obj.label || '').slice(0, 16)}
```

This is a 1-line fix. The `String()` call ensures `.slice()` always operates on a string, regardless of the data type stored in the database.

## Verification

After this fix:
1. The "重新生成全部图片" button should no longer crash the page
2. The batch save dialog should appear and process all images
3. The ProjectDashboard should remain stable

