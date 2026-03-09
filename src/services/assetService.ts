/**
 * Asset Service - Unified asset management with standardized naming
 */
import { api } from '@/api';

export type AssetType = 
  | 'workstation_product'
  | 'module_annotation'
  | 'layout_front_view'
  | 'layout_side_view'
  | 'layout_top_view'
  | 'module_schematic'
  | 'hardware_image'
  | 'mechanism_view'
  | 'ppt_template';

export type RelatedType = 'project' | 'workstation' | 'module' | 'hardware' | 'mechanism' | 'template';

export interface AssetInfo {
  assetType: AssetType;
  relatedType: RelatedType;
  relatedId: string;
  projectCode?: string;
  workstationCode?: string;
  moduleName?: string;
  hardwareType?: string;
  hardwareBrand?: string;
  hardwareModel?: string;
}

export interface AssetRecord {
  id: string;
  user_id: string;
  asset_type: AssetType;
  related_type: string;
  related_id: string;
  file_path: string;
  file_url: string;
  standard_name: string;
  original_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  version: number;
  is_current: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function generateStandardName(info: AssetInfo, version: number, extension: string): string {
  const parts: string[] = [];
  if (info.projectCode) parts.push(sanitizeName(info.projectCode));
  if (info.workstationCode) parts.push(sanitizeName(info.workstationCode));
  if (info.moduleName) parts.push(sanitizeName(info.moduleName));
  if (info.hardwareType) parts.push(sanitizeName(info.hardwareType));
  if (info.hardwareBrand) parts.push(sanitizeName(info.hardwareBrand));
  if (info.hardwareModel) parts.push(sanitizeName(info.hardwareModel));
  parts.push(getAssetTypeSuffix(info.assetType));
  parts.push(`V${version}`);
  return `${parts.join('_')}.${extension}`;
}

export function getStoragePath(info: AssetInfo, fileName: string): string {
  const basePath = getAssetTypeFolder(info.assetType);
  const relatedPath = `${info.relatedType}/${info.relatedId}`;
  return `${basePath}/${relatedPath}/${fileName}`;
}

export async function uploadAsset(
  file: File,
  info: AssetInfo,
  metadata: Record<string, unknown> = {}
): Promise<{ url: string; record: AssetRecord } | { error: string }> {
  const { user } = await api.auth.getUser();
  if (!user) return { error: '用户未登录' };
  
  const userId = user.id;
  const extension = getFileExtension(file.name);
  const currentVersion = await getCurrentVersion(userId, info.assetType, info.relatedId);
  const newVersion = currentVersion + 1;
  const standardName = generateStandardName(info, newVersion, extension);
  const storagePath = getStoragePath(info, standardName);
  
  // Mark previous versions as not current
  if (currentVersion > 0) {
    await api.assets.updateByFilter(
      { userId, assetType: info.assetType, relatedId: info.relatedId },
      { is_current: false }
    );
  }
  
  // Upload to storage
  try {
    await api.storage.upload('project-assets', storagePath, file, { upsert: true });
  } catch (uploadError: any) {
    return { error: `上传失败: ${uploadError.message}` };
  }
  
  const fileUrl = api.storage.getPublicUrl('project-assets', storagePath);
  
  // Register in asset registry
  try {
    const record = await api.assets.create({
      user_id: userId,
      asset_type: info.assetType as any,
      related_type: info.relatedType,
      related_id: info.relatedId,
      file_path: storagePath,
      file_url: fileUrl,
      standard_name: standardName,
      original_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      version: newVersion,
      is_current: true,
      metadata: metadata as any,
    });
    return { url: fileUrl, record: record as AssetRecord };
  } catch (registryError: any) {
    return { error: `注册资产失败: ${registryError.message}` };
  }
}

export async function getCurrentAssets(
  relatedType: RelatedType,
  relatedId: string,
  assetType?: AssetType
): Promise<AssetRecord[]> {
  try {
    const data = await api.assets.list({
      relatedType,
      relatedId,
      assetType,
      isCurrent: true,
    });
    return data as AssetRecord[];
  } catch (error) {
    console.error('获取资产失败:', error);
    return [];
  }
}

export async function getAssetVersions(
  relatedId: string,
  assetType: AssetType
): Promise<AssetRecord[]> {
  try {
    const data = await api.assets.getVersions(relatedId, assetType);
    return data as AssetRecord[];
  } catch (error) {
    console.error('获取资产版本失败:', error);
    return [];
  }
}

export async function cleanupOldVersions(
  relatedId: string,
  assetType: AssetType,
  keepVersions: number = 3
): Promise<number> {
  const { user } = await api.auth.getUser();
  if (!user) return 0;
  
  const versions = await getAssetVersions(relatedId, assetType);
  if (versions.length <= keepVersions) return 0;
  
  const toDelete = versions.slice(keepVersions);
  let deletedCount = 0;
  
  for (const asset of toDelete) {
    try {
      await api.storage.remove('project-assets', [asset.file_path]);
      await api.assets.delete(asset.id);
      deletedCount++;
    } catch { /* ignore */ }
  }
  
  return deletedCount;
}

export async function getProjectAssets(projectId: string): Promise<{
  workstationAssets: Map<string, AssetRecord[]>;
  moduleAssets: Map<string, AssetRecord[]>;
  layoutAssets: Map<string, AssetRecord[]>;
}> {
  const { user } = await api.auth.getUser();
  if (!user) {
    return { workstationAssets: new Map(), moduleAssets: new Map(), layoutAssets: new Map() };
  }
  
  const workstationsData = await api.workstations.list();
  const workstationIds = workstationsData.filter(w => w.project_id === projectId).map(w => w.id);
  
  const modulesData = await api.modules.list();
  const moduleIds = modulesData.filter(m => workstationIds.includes(m.workstation_id)).map(m => m.id);
  
  const allIds = [...workstationIds, ...moduleIds];
  
  // Fetch assets for each related id
  const allAssets: AssetRecord[] = [];
  for (const id of allIds) {
    const assets = await api.assets.list({ relatedId: id, isCurrent: true });
    allAssets.push(...(assets as AssetRecord[]));
  }
  
  const workstationAssets = new Map<string, AssetRecord[]>();
  const moduleAssets = new Map<string, AssetRecord[]>();
  const layoutAssets = new Map<string, AssetRecord[]>();
  
  for (const asset of allAssets) {
    if (asset.related_type === 'workstation') {
      const existing = workstationAssets.get(asset.related_id) || [];
      existing.push(asset);
      workstationAssets.set(asset.related_id, existing);
    } else if (asset.related_type === 'module') {
      const existing = moduleAssets.get(asset.related_id) || [];
      existing.push(asset);
      moduleAssets.set(asset.related_id, existing);
    }
    if (asset.asset_type.includes('layout_')) {
      const existing = layoutAssets.get(asset.related_id) || [];
      existing.push(asset);
      layoutAssets.set(asset.related_id, existing);
    }
  }
  
  return { workstationAssets, moduleAssets, layoutAssets };
}

// Helper functions
async function getCurrentVersion(userId: string, assetType: AssetType, relatedId: string): Promise<number> {
  const data = await api.assets.getVersions(relatedId, assetType);
  const userVersions = data.filter(a => a.user_id === userId);
  return userVersions.length > 0 ? userVersions[0].version : 0;
}

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '').substring(0, 20);
}

function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : 'bin';
}

function getAssetTypeSuffix(type: AssetType): string {
  const suffixMap: Record<AssetType, string> = {
    workstation_product: 'PROD', module_annotation: 'ANNO',
    layout_front_view: 'FRONT', layout_side_view: 'SIDE', layout_top_view: 'TOP',
    module_schematic: 'SCHEM', hardware_image: 'HW', mechanism_view: 'MECH', ppt_template: 'TPL'
  };
  return suffixMap[type];
}

function getAssetTypeFolder(type: AssetType): string {
  const folderMap: Record<AssetType, string> = {
    workstation_product: 'products', module_annotation: 'annotations',
    layout_front_view: 'layouts', layout_side_view: 'layouts', layout_top_view: 'layouts',
    module_schematic: 'schematics', hardware_image: 'hardware', mechanism_view: 'mechanisms', ppt_template: 'templates'
  };
  return folderMap[type];
}
