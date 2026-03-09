export type StandardViewType = 'front' | 'side' | 'top';
export type ViewType = StandardViewType | 'isometric';
export type LayerType = 'mechanism' | 'product' | 'camera';

// Auto-arrangement configuration
export const AUTO_ARRANGE_CONFIG = {
  cameraSpacing: 200,
  mechanismSpacing: 150,
  cameraDefaultZ: 350,
  mechanismDefaultZ: 0,
  cameraDefaultY: -150,
  mechanismOffsetY: 200,
  startOffsetX: -150,
};
