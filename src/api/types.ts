/**
 * API Adapter Layer - Interface Definitions
 * 
 * All business code should depend on these interfaces only.
 * Switch backends by swapping the adapter implementation.
 */

import type { Database, Json } from '@/integrations/supabase/types';

// ============= Database Row Types (re-export for convenience) =============
export type DbProject = Database['public']['Tables']['projects']['Row'];
export type DbWorkstation = Database['public']['Tables']['workstations']['Row'];
export type DbLayout = Database['public']['Tables']['mechanical_layouts']['Row'];
export type DbModule = Database['public']['Tables']['function_modules']['Row'];
export type DbCamera = Database['public']['Tables']['cameras']['Row'];
export type DbLens = Database['public']['Tables']['lenses']['Row'];
export type DbLight = Database['public']['Tables']['lights']['Row'];
export type DbController = Database['public']['Tables']['controllers']['Row'];
export type DbAssetRegistry = Database['public']['Tables']['asset_registry']['Row'];
export type DbPPTTemplate = Database['public']['Tables']['ppt_templates']['Row'];
export type DbProductAsset = Database['public']['Tables']['product_assets']['Row'];
export type DbProductAnnotation = Database['public']['Tables']['product_annotations']['Row'];
export type DbGeneratedDocument = Database['public']['Tables']['generated_documents']['Row'];
export type DbMechanism = Database['public']['Tables']['mechanisms']['Row'];
export type DbUserRole = Database['public']['Tables']['user_roles']['Row'];

// Insert / Update types
export type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
export type ProjectUpdate = Database['public']['Tables']['projects']['Update'];
export type WorkstationInsert = Database['public']['Tables']['workstations']['Insert'];
export type WorkstationUpdate = Database['public']['Tables']['workstations']['Update'];
export type LayoutInsert = Database['public']['Tables']['mechanical_layouts']['Insert'];
export type LayoutUpdate = Database['public']['Tables']['mechanical_layouts']['Update'];
export type ModuleInsert = Database['public']['Tables']['function_modules']['Insert'];
export type ModuleUpdate = Database['public']['Tables']['function_modules']['Update'];

// ============= Auth Types =============
export interface ApiUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}

export interface ApiSession {
  user: ApiUser;
  access_token: string;
}

export type AuthChangeCallback = (event: string, session: ApiSession | null) => void;

// ============= API Interfaces =============

export interface IAuthApi {
  signUp(email: string, password: string, options?: { data?: Record<string, unknown> }): Promise<{ error: Error | null }>;
  signIn(email: string, password: string): Promise<{ error: Error | null }>;
  signOut(): Promise<void>;
  getSession(): Promise<{ session: ApiSession | null }>;
  getUser(): Promise<{ user: ApiUser | null }>;
  onAuthStateChange(callback: AuthChangeCallback): { unsubscribe: () => void };
}

export interface IProjectApi {
  list(orderBy?: string, ascending?: boolean): Promise<DbProject[]>;
  create(data: Omit<ProjectInsert, 'id' | 'created_at' | 'updated_at'>): Promise<DbProject>;
  update(id: string, data: ProjectUpdate): Promise<DbProject>;
  delete(id: string): Promise<void>;
  claimOrphans(userId: string): Promise<void>;
}

export interface IWorkstationApi {
  list(orderBy?: string, ascending?: boolean): Promise<DbWorkstation[]>;
  create(data: Omit<WorkstationInsert, 'id' | 'created_at' | 'updated_at'>): Promise<DbWorkstation>;
  update(id: string, data: WorkstationUpdate): Promise<DbWorkstation>;
  delete(id: string): Promise<void>;
}

export interface ILayoutApi {
  list(): Promise<DbLayout[]>;
  create(data: Omit<LayoutInsert, 'id' | 'created_at' | 'updated_at'>): Promise<DbLayout>;
  update(id: string, data: LayoutUpdate): Promise<DbLayout>;
}

export interface IModuleApi {
  list(orderBy?: string, ascending?: boolean): Promise<DbModule[]>;
  create(data: Omit<ModuleInsert, 'id' | 'created_at' | 'updated_at'>): Promise<DbModule>;
  update(id: string, data: ModuleUpdate & Record<string, unknown>): Promise<DbModule>;
  delete(id: string): Promise<void>;
}

export interface IHardwareApi {
  listCameras(): Promise<DbCamera[]>;
  addCamera(data: Omit<DbCamera, 'id' | 'created_at' | 'updated_at'>): Promise<DbCamera>;
  updateCamera(id: string, data: Partial<DbCamera>): Promise<DbCamera>;
  deleteCamera(id: string): Promise<void>;

  listLenses(): Promise<DbLens[]>;
  addLens(data: Omit<DbLens, 'id' | 'created_at' | 'updated_at'>): Promise<DbLens>;
  updateLens(id: string, data: Partial<DbLens>): Promise<DbLens>;
  deleteLens(id: string): Promise<void>;

  listLights(): Promise<DbLight[]>;
  addLight(data: Omit<DbLight, 'id' | 'created_at' | 'updated_at'>): Promise<DbLight>;
  updateLight(id: string, data: Partial<DbLight>): Promise<DbLight>;
  deleteLight(id: string): Promise<void>;

  listControllers(): Promise<DbController[]>;
  addController(data: Omit<DbController, 'id' | 'created_at' | 'updated_at'>): Promise<DbController>;
  updateController(id: string, data: Partial<DbController>): Promise<DbController>;
  deleteController(id: string): Promise<void>;

  listMechanisms(): Promise<DbMechanism[]>;
}

export interface IAssetApi {
  list(filters: { relatedType?: string; relatedId?: string; assetType?: string; isCurrent?: boolean }): Promise<DbAssetRegistry[]>;
  create(data: Omit<DbAssetRegistry, 'id' | 'created_at' | 'updated_at'>): Promise<DbAssetRegistry>;
  update(id: string, data: Partial<DbAssetRegistry>): Promise<void>;
  updateByFilter(filters: { userId?: string; assetType?: string; relatedId?: string }, data: Partial<DbAssetRegistry>): Promise<void>;
  delete(id: string): Promise<void>;
  getVersions(relatedId: string, assetType: string): Promise<DbAssetRegistry[]>;
}

export interface IStorageApi {
  upload(bucket: string, path: string, file: File, options?: { upsert?: boolean; cacheControl?: string }): Promise<{ path: string }>;
  getPublicUrl(bucket: string, path: string): string;
  remove(bucket: string, paths: string[]): Promise<void>;
}

export interface IUserRoleApi {
  getUserRole(userId: string, role: string): Promise<DbUserRole | null>;
}

export interface IDocumentApi {
  list(projectId: string): Promise<DbGeneratedDocument[]>;
  create(data: Omit<DbGeneratedDocument, 'id' | 'created_at'>): Promise<DbGeneratedDocument>;
  delete(id: string): Promise<void>;
}

export interface IProductAssetApi {
  get(workstationId: string): Promise<DbProductAsset | null>;
  getByModule(moduleId: string): Promise<DbProductAsset | null>;
  create(data: Omit<DbProductAsset, 'id' | 'created_at' | 'updated_at'>): Promise<DbProductAsset>;
  update(id: string, data: Partial<DbProductAsset>): Promise<DbProductAsset>;
  delete(id: string): Promise<void>;
}

export interface IAnnotationApi {
  list(assetId: string): Promise<DbProductAnnotation[]>;
  create(data: Omit<DbProductAnnotation, 'id' | 'created_at'>): Promise<DbProductAnnotation>;
  update(id: string, data: Partial<DbProductAnnotation>): Promise<DbProductAnnotation>;
  delete(id: string): Promise<void>;
}

export interface IPPTTemplateApi {
  list(): Promise<DbPPTTemplate[]>;
  create(data: Omit<DbPPTTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<DbPPTTemplate>;
  update(id: string, data: Partial<DbPPTTemplate>): Promise<DbPPTTemplate>;
  delete(id: string): Promise<void>;
}

// ============= Aggregated Adapter =============

export interface ApiAdapter {
  auth: IAuthApi;
  projects: IProjectApi;
  workstations: IWorkstationApi;
  layouts: ILayoutApi;
  modules: IModuleApi;
  hardware: IHardwareApi;
  assets: IAssetApi;
  storage: IStorageApi;
  userRoles: IUserRoleApi;
  documents: IDocumentApi;
  productAssets: IProductAssetApi;
  annotations: IAnnotationApi;
  pptTemplates: IPPTTemplateApi;
}
