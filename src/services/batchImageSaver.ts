import { api } from '@/api';
import { toPng } from 'html-to-image';
import { compressImage, dataUrlToBlob, QUALITY_PRESETS, type QualityPreset } from '@/utils/imageCompression';
import { imageLocalCache, blobToDataUri, type ImageCacheType } from '@/services/imageLocalCache';

export type ViewType = 'front' | 'side' | 'top';

export interface SaveProgress {
  current: number;
  total: number;
  message: string;
  type: 'layout' | 'schematic';
}

export interface MissingImages {
  layouts: Array<{
    workstationId: string;
    workstationName: string;
    missingViews: ViewType[];
  }>;
  schematics: Array<{
    moduleId: string;
    moduleName: string;
    workstationName: string;
  }>;
  total: number;
}

export function calculateMissingImages(
  projectWorkstations: any[],
  layouts: any[],
  getWorkstationModules: (wsId: string) => any[]
): MissingImages {
  const missingLayouts: MissingImages['layouts'] = [];
  const missingSchematics: MissingImages['schematics'] = [];

  for (const ws of projectWorkstations) {
    const layout = layouts.find(l => l.workstation_id === ws.id);
    if (layout) {
      const primaryView: ViewType = layout.primary_view || 'front';
      const auxiliaryView: ViewType = layout.auxiliary_view || 'side';
      const missingViews: ViewType[] = [];
      if (!layout[`${primaryView}_view_image_url`]) missingViews.push(primaryView);
      if (!layout[`${auxiliaryView}_view_image_url`] && auxiliaryView !== primaryView) missingViews.push(auxiliaryView);
      if (missingViews.length > 0) {
        missingLayouts.push({ workstationId: ws.id, workstationName: ws.name, missingViews });
      }
    }
    const modules = getWorkstationModules(ws.id);
    for (const m of modules) {
      if (!(m as any).schematic_image_url) {
        missingSchematics.push({ moduleId: m.id, moduleName: m.name, workstationName: ws.name });
      }
    }
  }

  return {
    layouts: missingLayouts,
    schematics: missingSchematics,
    total: missingLayouts.reduce((acc, l) => acc + l.missingViews.length, 0) + missingSchematics.length,
  };
}

export async function saveViewToStorage(
  workstationId: string,
  layoutId: string,
  view: ViewType,
  imageBlob: Blob,
  updateLayout: (id: string, data: any) => Promise<any>
): Promise<string> {
  const fileName = `${workstationId}/${view}-${Date.now()}.jpg`;
  
  await api.storage.upload('workstation-views', fileName, imageBlob as File, { upsert: true });
  const publicUrl = api.storage.getPublicUrl('workstation-views', fileName);
  
  const updateField = `${view}_view_image_url`;
  const savedField = `${view}_view_saved`;
  
  await updateLayout(layoutId, { [updateField]: publicUrl, [savedField]: true } as any);
  
  try {
    const cacheType: ImageCacheType = view === 'front' ? 'layout_front_view' : view === 'side' ? 'layout_side_view' : 'layout_top_view';
    const dataUri = await blobToDataUri(imageBlob);
    await imageLocalCache.set(cacheType, workstationId, publicUrl, dataUri);
  } catch (cacheError) {
    console.warn('[ImageCache] 本地缓存失败:', cacheError);
  }
  
  return publicUrl;
}

export async function saveSchematicToStorage(
  moduleId: string,
  imageBlob: Blob,
  updateModule: (id: string, data: any) => Promise<any>
): Promise<string> {
  const fileName = `module-schematic-${moduleId}-${Date.now()}.png`;
  
  // Clean up old files
  try {
    const oldFiles = await api.storage.listFiles('module-schematics', '', { limit: 100 });
    const toRemove = oldFiles.filter(f => f.name?.startsWith(`module-schematic-${moduleId}`)).map(f => f.name);
    if (toRemove.length) await api.storage.remove('module-schematics', toRemove);
  } catch { /* ignore cleanup errors */ }
  
  await api.storage.upload('module-schematics', fileName, imageBlob as File, { upsert: true });
  const publicUrl = api.storage.getPublicUrl('module-schematics', fileName);
  
  await updateModule(moduleId, { schematic_image_url: publicUrl, status: 'complete' });
  
  try {
    const dataUri = await blobToDataUri(imageBlob);
    await imageLocalCache.set('module_schematic', moduleId, publicUrl, dataUri);
  } catch (cacheError) {
    console.warn('[ImageCache] 本地缓存失败:', cacheError);
  }
  
  return publicUrl;
}

function injectForceWhiteStyle(container: HTMLElement): HTMLStyleElement {
  const style = document.createElement('style');
  style.id = 'capture-force-white';
  style.textContent = `
    * { color: #ffffff !important; }
    p, span, div, text, label, h1, h2, h3, h4, h5, h6 { color: #ffffff !important; fill: #ffffff !important; }
    svg text, svg tspan { fill: #ffffff !important; }
  `;
  container.prepend(style);
  return style;
}

export async function generateImageFromElement(
  element: HTMLElement,
  options: { quality?: QualityPreset; backgroundColor?: string; format?: 'jpeg' | 'png'; forceWhiteText?: boolean } = {}
): Promise<Blob> {
  const { quality = 'fast', backgroundColor = '#1e293b', format = 'jpeg', forceWhiteText = false } = options;
  const preset = QUALITY_PRESETS[quality];
  
  let injectedStyle: HTMLStyleElement | null = null;
  if (forceWhiteText) injectedStyle = injectForceWhiteStyle(element);

  await new Promise<void>((resolve) => { requestAnimationFrame(() => { requestAnimationFrame(() => { resolve(); }); }); });
  
  let dataUrl: string;
  try {
    dataUrl = await toPng(element, { quality: preset.quality, pixelRatio: Math.min(preset.pixelRatio, 2), backgroundColor, skipFonts: true, cacheBust: true });
  } catch (error) {
    console.warn('First capture failed, retrying:', error);
    dataUrl = await toPng(element, { quality: 0.6, pixelRatio: 1, backgroundColor, skipFonts: true, cacheBust: true });
  } finally {
    if (injectedStyle) injectedStyle.remove();
  }
  
  const originalBlob = dataUrlToBlob(dataUrl);
  if (format === 'jpeg') {
    return await compressImage(originalBlob, { quality: preset.quality, maxWidth: preset.maxWidth, maxHeight: preset.maxHeight, format: 'image/jpeg' });
  }
  return originalBlob;
}

export function getViewLabel(view: ViewType): string {
  return { front: '正视图', side: '侧视图', top: '俯视图' }[view];
}
