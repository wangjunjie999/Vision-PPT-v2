import type { ApiAdapter } from '../types';
import { createSupabaseAuthApi } from './auth';
import { createSupabaseProjectApi } from './projects';
import { createSupabaseWorkstationApi } from './workstations';
import { createSupabaseLayoutApi } from './layouts';
import { createSupabaseModuleApi } from './modules';
import { createSupabaseHardwareApi } from './hardware';
import { createSupabaseAssetApi } from './assets';
import { createSupabaseStorageApi } from './storage';
import {
  createSupabaseUserRoleApi,
  createSupabaseDocumentApi,
  createSupabaseProductAssetApi,
  createSupabaseAnnotationApi,
  createSupabasePPTTemplateApi,
} from './misc';

export function createSupabaseAdapter(): ApiAdapter {
  return {
    auth: createSupabaseAuthApi(),
    projects: createSupabaseProjectApi(),
    workstations: createSupabaseWorkstationApi(),
    layouts: createSupabaseLayoutApi(),
    modules: createSupabaseModuleApi(),
    hardware: createSupabaseHardwareApi(),
    assets: createSupabaseAssetApi(),
    storage: createSupabaseStorageApi(),
    userRoles: createSupabaseUserRoleApi(),
    documents: createSupabaseDocumentApi(),
    productAssets: createSupabaseProductAssetApi(),
    annotations: createSupabaseAnnotationApi(),
    pptTemplates: createSupabasePPTTemplateApi(),
  };
}
