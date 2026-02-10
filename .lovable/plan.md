
## Fix Plan: Four Improvements to the Workstation Canvas

### 1. Fix Border Flickering on Three-View Hover

**Root cause**: The `ResizableHandle` component in `resizable.tsx` has complex hover effects (opacity transitions on `::before` pseudo-elements, scale changes, and a `handle-pulse` animation) that cause rapid style recalculations when the mouse hovers near the border between the resizable panels and the three-view canvas. This triggers the visible "flickering" seen in the session replay.

**Fix**:
- In `src/components/ui/resizable.tsx`: Remove `transition-all` from the handle (which transitions ALL properties including width, causing layout thrashing). Replace with targeted `transition-colors` and `transition-opacity`.
- Remove the width change on hover (`hover:w-1.5`) which causes layout shifts and flickering.
- In `src/index.css`: Remove the `handle-pulse` animation that continuously changes `box-shadow`.

### 2. Optimize Drag-to-Resize Experience

**Current issue**: The `ResizeHandles.tsx` component uses a `scaleFactor = 0.5`, making resize feel sluggish. The handles are small (8px) and hard to grab.

**Fix in `src/components/canvas/ResizeHandles.tsx`**:
- Increase `scaleFactor` from `0.5` to `1.0` for 1:1 mouse-to-resize mapping.
- Increase handle size from `8` to `10` pixels for easier grabbing.
- Add a larger invisible hit area around each handle for easier interaction.

### 3. Increase Default Mechanism Sizes

**Current**: Default mechanism dimensions are `100x80` pixels (line 849 in DraggableLayoutCanvas.tsx), with the camera at `50x60`.

**Fix in `src/components/canvas/DraggableLayoutCanvas.tsx`**:
- Change default mechanism size from `100x80` to `140x110` (40% larger).
- Change default camera size from `50x60` to `70x80` (40% larger).

### 4. Enlarge the Coordinate System

**Two coordinate systems to update**:

**a. Single-view CoordinateSystem (`src/components/canvas/CoordinateSystem.tsx`)**:
- Increase axis label badge sizes (from 28x22 to 36x28).
- Increase axis label font size from 13 to 15.
- Increase origin label size.
- Increase ruler tick lengths (major from 12 to 16, minor from 6 to 10).
- Increase scale bar size and text.

**b. Three-view CoordinateAxes (`src/components/canvas/ThreeViewLayout.tsx`)**:
- Increase axis dash lines to extend further into each view panel.
- Increase axis label font size from 9 to 11.
- Reduce padding from edges (from 20px to 12px) to make axes longer.

### Files to modify

| File | Change |
|------|--------|
| `src/components/ui/resizable.tsx` | Remove layout-shifting hover effects |
| `src/index.css` | Remove handle-pulse animation |
| `src/components/canvas/ResizeHandles.tsx` | Increase scaleFactor to 1.0, enlarge handles |
| `src/components/canvas/DraggableLayoutCanvas.tsx` | Increase default mechanism/camera sizes |
| `src/components/canvas/CoordinateSystem.tsx` | Enlarge axis labels, ticks, scale bar |
| `src/components/canvas/ThreeViewLayout.tsx` | Enlarge coordinate axes in overview |
