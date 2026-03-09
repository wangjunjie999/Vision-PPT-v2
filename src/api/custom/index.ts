/**
 * Custom Backend Adapter (fetch-based REST API skeleton)
 * 
 * Replace the base URL and implement each method to match your backend API.
 * All methods currently throw "Not implemented" errors as placeholders.
 * 
 * Usage:
 *   1. Set VITE_BACKEND=custom in your .env
 *   2. Set VITE_API_BASE_URL=https://your-server.com/api
 *   3. Implement each method below
 */

import type { ApiAdapter } from '../types';

function createHeaders(token?: string): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export function createCustomAdapter(baseUrl: string): ApiAdapter {
  // Store auth token in memory
  let authToken: string | null = null;

  const fetchApi = async (path: string, options: RequestInit = {}) => {
    const res = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        ...createHeaders(authToken || undefined),
        ...(options.headers || {}),
      },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`API Error ${res.status}: ${body}`);
    }
    return res.json();
  };

  return {
    auth: {
      async signUp(email, password, options) {
        try {
          await fetchApi('/auth/signup', {
            method: 'POST',
            body: JSON.stringify({ email, password, ...options?.data }),
          });
          return { error: null };
        } catch (e) {
          return { error: e as Error };
        }
      },
      async signIn(email, password) {
        try {
          const data = await fetchApi('/auth/signin', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
          });
          authToken = data.access_token;
          return { error: null };
        } catch (e) {
          return { error: e as Error };
        }
      },
      async signOut() {
        authToken = null;
        // Optionally call: await fetchApi('/auth/signout', { method: 'POST' });
      },
      async getSession() {
        if (!authToken) return { session: null };
        try {
          const data = await fetchApi('/auth/session');
          return { session: data.session };
        } catch {
          return { session: null };
        }
      },
      async getUser() {
        if (!authToken) return { user: null };
        try {
          const data = await fetchApi('/auth/user');
          return { user: data.user };
        } catch {
          return { user: null };
        }
      },
      onAuthStateChange(_callback) {
        // Custom backends typically use token-based auth without realtime state changes
        console.warn('[CustomAdapter] onAuthStateChange is a no-op. Manage auth state manually.');
        return { unsubscribe: () => {} };
      },
    },

    projects: {
      async list() { return fetchApi('/projects'); },
      async create(data) { return fetchApi('/projects', { method: 'POST', body: JSON.stringify(data) }); },
      async update(id, data) { return fetchApi(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
      async delete(id) { await fetchApi(`/projects/${id}`, { method: 'DELETE' }); },
      async claimOrphans() { /* no-op for custom backends */ },
    },

    workstations: {
      async list() { return fetchApi('/workstations'); },
      async create(data) { return fetchApi('/workstations', { method: 'POST', body: JSON.stringify(data) }); },
      async update(id, data) { return fetchApi(`/workstations/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
      async delete(id) { await fetchApi(`/workstations/${id}`, { method: 'DELETE' }); },
    },

    layouts: {
      async list() { return fetchApi('/layouts'); },
      async create(data) { return fetchApi('/layouts', { method: 'POST', body: JSON.stringify(data) }); },
      async update(id, data) { return fetchApi(`/layouts/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
    },

    modules: {
      async list() { return fetchApi('/modules'); },
      async create(data) { return fetchApi('/modules', { method: 'POST', body: JSON.stringify(data) }); },
      async update(id, data) { return fetchApi(`/modules/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
      async delete(id) { await fetchApi(`/modules/${id}`, { method: 'DELETE' }); },
    },

    hardware: {
      async listCameras() { return fetchApi('/hardware/cameras'); },
      async addCamera(data) { return fetchApi('/hardware/cameras', { method: 'POST', body: JSON.stringify(data) }); },
      async updateCamera(id, data) { return fetchApi(`/hardware/cameras/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
      async deleteCamera(id) { await fetchApi(`/hardware/cameras/${id}`, { method: 'DELETE' }); },
      async listLenses() { return fetchApi('/hardware/lenses'); },
      async addLens(data) { return fetchApi('/hardware/lenses', { method: 'POST', body: JSON.stringify(data) }); },
      async updateLens(id, data) { return fetchApi(`/hardware/lenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
      async deleteLens(id) { await fetchApi(`/hardware/lenses/${id}`, { method: 'DELETE' }); },
      async listLights() { return fetchApi('/hardware/lights'); },
      async addLight(data) { return fetchApi('/hardware/lights', { method: 'POST', body: JSON.stringify(data) }); },
      async updateLight(id, data) { return fetchApi(`/hardware/lights/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
      async deleteLight(id) { await fetchApi(`/hardware/lights/${id}`, { method: 'DELETE' }); },
      async listControllers() { return fetchApi('/hardware/controllers'); },
      async addController(data) { return fetchApi('/hardware/controllers', { method: 'POST', body: JSON.stringify(data) }); },
      async updateController(id, data) { return fetchApi(`/hardware/controllers/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
      async deleteController(id) { await fetchApi(`/hardware/controllers/${id}`, { method: 'DELETE' }); },
      async listMechanisms() { return fetchApi('/hardware/mechanisms'); },
      async addMechanism(data) { return fetchApi('/hardware/mechanisms', { method: 'POST', body: JSON.stringify(data) }); },
      async updateMechanism(id, data) { return fetchApi(`/hardware/mechanisms/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
      async deleteMechanism(id) { await fetchApi(`/hardware/mechanisms/${id}`, { method: 'DELETE' }); },
      async bulkInsert(type, items) { 
        await fetchApi(`/hardware/${type}/bulk`, { method: 'POST', body: JSON.stringify({ items }) }); 
      },
    },

    assets: {
      async list(filters) { return fetchApi(`/assets?${new URLSearchParams(filters as Record<string, string>)}`); },
      async create(data) { return fetchApi('/assets', { method: 'POST', body: JSON.stringify(data) }); },
      async update(id, data) { await fetchApi(`/assets/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
      async updateByFilter(filters, data) { await fetchApi('/assets/batch-update', { method: 'PUT', body: JSON.stringify({ filters, data }) }); },
      async delete(id) { await fetchApi(`/assets/${id}`, { method: 'DELETE' }); },
      async getVersions(relatedId, assetType) { return fetchApi(`/assets/versions?relatedId=${relatedId}&assetType=${assetType}`); },
    },

    storage: {
      async upload(bucket, path, file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucket', bucket);
        formData.append('path', path);
        const res = await fetch(`${baseUrl}/storage/upload`, {
          method: 'POST',
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
          body: formData,
        });
        if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
        return res.json();
      },
      getPublicUrl(bucket, path) {
        return `${baseUrl}/storage/${bucket}/${path}`;
      },
      async remove(bucket, paths) {
        await fetchApi('/storage/remove', { method: 'POST', body: JSON.stringify({ bucket, paths }) });
      },
      async listFiles(bucket, path) {
        return fetchApi(`/storage/list?bucket=${bucket}&path=${path || ''}`);
      },
    },

    userRoles: {
      async getUserRole(userId, role) { return fetchApi(`/user-roles?userId=${userId}&role=${role}`); },
    },

    documents: {
      async list(projectId) { return fetchApi(`/documents?projectId=${projectId}`); },
      async create(data) { return fetchApi('/documents', { method: 'POST', body: JSON.stringify(data) }); },
      async delete(id) { await fetchApi(`/documents/${id}`, { method: 'DELETE' }); },
    },

    productAssets: {
      async get(workstationId) { return fetchApi(`/product-assets?workstationId=${workstationId}`); },
      async getByModule(moduleId) { return fetchApi(`/product-assets?moduleId=${moduleId}`); },
      async create(data) { return fetchApi('/product-assets', { method: 'POST', body: JSON.stringify(data) }); },
      async update(id, data) { return fetchApi(`/product-assets/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
      async delete(id) { await fetchApi(`/product-assets/${id}`, { method: 'DELETE' }); },
      async listByWorkstations(wsIds) { 
        return fetchApi(`/product-assets/by-workstations?ids=${wsIds.join(',')}`); 
      },
      async listByUserAndScope(userId, wsIds, modIds) {
        return fetchApi(`/product-assets/by-scope?userId=${userId}&wsIds=${wsIds.join(',')}&modIds=${modIds.join(',')}`);
      },
    },

    annotations: {
      async list(assetId) { return fetchApi(`/annotations?assetId=${assetId}`); },
      async create(data) { return fetchApi('/annotations', { method: 'POST', body: JSON.stringify(data) }); },
      async update(id, data) { return fetchApi(`/annotations/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
      async delete(id) { await fetchApi(`/annotations/${id}`, { method: 'DELETE' }); },
      async listByWorkstations(wsIds) {
        return fetchApi(`/annotations/by-workstations?ids=${wsIds.join(',')}`);
      },
      async listByUser(userId, assetIds) {
        return fetchApi(`/annotations/by-user?userId=${userId}&assetIds=${assetIds.join(',')}`);
      },
      async listByAssetAndWorkstation(assetId, workstationId) {
        const params = new URLSearchParams({ assetId });
        if (workstationId) params.append('workstationId', workstationId);
        return fetchApi(`/annotations/by-asset-workstation?${params}`);
      },
      async getLatestVersion(assetId) {
        const data = await fetchApi(`/annotations/latest-version?assetId=${assetId}`);
        return data.version || 0;
      },
    },

    pptTemplates: {
      async list() { return fetchApi('/ppt-templates'); },
      async listByUser(userId) { return fetchApi(`/ppt-templates?userId=${userId}`); },
      async create(data) { return fetchApi('/ppt-templates', { method: 'POST', body: JSON.stringify(data) }); },
      async update(id, data) { return fetchApi(`/ppt-templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
      async updateWhere(filter, data) {
        await fetchApi('/ppt-templates/batch-update', { method: 'PUT', body: JSON.stringify({ filter, data }) });
      },
      async delete(id) { await fetchApi(`/ppt-templates/${id}`, { method: 'DELETE' }); },
      async deleteByUser(id, userId) { 
        await fetchApi(`/ppt-templates/${id}?userId=${userId}`, { method: 'DELETE' }); 
      },
    },

    functions: {
      async invoke(functionName, options) {
        const data = await fetchApi(`/functions/${functionName}`, {
          method: options?.method || 'POST',
          body: options?.body ? JSON.stringify(options.body) : undefined,
        });
        return { data, error: null };
      },
    },

    admin: {
      async updateSetting(key, value) {
        await fetchApi('/admin/settings', { method: 'PUT', body: JSON.stringify({ key, value }) });
      },
    },
  };
}
