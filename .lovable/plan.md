

# Fix: Schematic Save Still Causes Visible "Zoom Flash"

## Root Cause

The "保存放大" (save magnification) issue is in `src/components/canvas/ModuleSchematic.tsx`. Three functions (`handleSaveSchematic`, `handleExportPNG`, `handleExportPDF`) all do the same problematic pattern:

```typescript
// Line 272-278 — modifies the VISIBLE element
const el = diagramRef.current;
const originalStyle = el.style.cssText;
el.style.width = '1200px';    // ← user sees this resize
el.style.height = '1100px';   // ← visible flash
el.style.maxWidth = 'none';
el.style.overflow = 'hidden';
// ... take screenshot ...
el.style.cssText = originalStyle; // ← user sees it shrink back
```

This directly mutates the on-screen diagram's dimensions, causing the visible "zoom in then zoom out" flash. The `BatchImageSaveButton` was already fixed (off-screen container), but the **single-module save button** in `ModuleSchematic.tsx` still uses the old in-place resize approach.

## Fix Strategy

For all three functions in `ModuleSchematic.tsx`, replace the in-place resize with a **clone-to-offscreen** approach:

1. Clone `diagramRef.current` using `cloneNode(true)`
2. Place the clone in a temporary off-screen container (`position: absolute; left: -20000px`)
3. Set the desired dimensions on the **clone** (not the visible element)
4. Take the screenshot from the clone
5. Remove the clone from DOM

This way the visible element is never touched during capture.

## Files Changed

### `src/components/canvas/ModuleSchematic.tsx`

Extract a shared helper function `captureOffscreen` that:
- Clones `diagramRef.current`
- Appends to an off-screen `div` at `-20000px`
- Applies `width: 1200px; height: 1100px; maxWidth: none; overflow: hidden; backgroundColor: #1a1a2e`
- Calls `toPng` on the clone
- Removes the clone container
- Returns the data URL

Then refactor:
- **`handleExportPNG`** (line 111-149): Use `captureOffscreen()` instead of resizing visible element
- **`handleExportPDF`** (line 152-205): Use `captureOffscreen()` instead of resizing visible element  
- **`handleSaveSchematic`** (line 244-334): Use `captureOffscreen()` instead of resizing visible element

No changes to props, types, or other files needed. Approximately 40 lines of net change.

