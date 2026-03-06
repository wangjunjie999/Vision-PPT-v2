import { useState, useRef, useCallback, useEffect, useMemo, memo } from 'react';
import { type LayoutObject3D } from './ThreeViewLayout';
import { toPng } from 'html-to-image';
import { useData } from '@/contexts/DataContext';
import { useMechanisms, type Mechanism } from '@/hooks/useMechanisms';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { cn } from '@/lib/utils';
import { 
  Save, RotateCcw, Grid3X3, Magnet, Ruler, Plus, 
  Camera, Trash2, Lock, Unlock, Loader2, Copy, 
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Crosshair,
  Move, LayoutGrid, AlignHorizontalJustifyCenter, 
  AlignVerticalJustifyCenter, AlignCenterHorizontal,
  ImageIcon, Check, ChevronDown, ChevronUp, Settings2, Zap
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { ObjectPropertyPanel, type LayoutObject } from './ObjectPropertyPanel';
import { ObjectListPanel } from './ObjectListPanel';
import { CanvasControls } from './CanvasControls';
import { AlignmentGuides, calculateSnapPosition } from './AlignmentGuides';
import { ResizeHandles } from './ResizeHandles';
import { CoordinateSystem } from './CoordinateSystem';
import { MechanismSVG, getMechanismMountPoints, type CameraMountPoint, CAMERA_INTERACTION_TYPES, PRODUCT_INTERACTION_TYPES } from './MechanismSVG';
import { CameraMountPoints, findNearestMountPoint, getMountPointWorldPosition } from './CameraMountPoints';
import { ProductMountPoints, findNearestProductMountPoint, getProductMountPointWorldPosition } from './ProductMountPoints';
import { getMechanismImage } from '@/utils/mechanismImageUrls';
import { MechanismThumbnail } from '@/components/common/ImageWithFallback';
import { compressImage, dataUrlToBlob, QUALITY_PRESETS, type QualityPreset } from '@/utils/imageCompression';
import { getImageSaveErrorMessage } from '@/utils/errorMessages';

type StandardViewType = 'front' | 'side' | 'top';
type ViewType = StandardViewType | 'isometric';

interface DraggableLayoutCanvasProps {
  workstationId: string;
}

// Auto-arrangement configuration
const AUTO_ARRANGE_CONFIG = {
  cameraSpacing: 200, // mm between cameras horizontally
  mechanismSpacing: 150, // mm between mechanisms
  cameraDefaultZ: 350, // default height for cameras
  mechanismDefaultZ: 0, // default height for mechanisms (on product level)
  cameraDefaultY: -150, // cameras positioned behind the product (negative Y)
  mechanismOffsetY: 200, // mechanisms positioned in front of product (additional offset from product edge)
  startOffsetX: -150, // start offset from center for first object
};


export function DraggableLayoutCanvas({ workstationId }: DraggableLayoutCanvasProps) {
  const { 
    workstations, 
    layouts,
    getLayoutByWorkstation,
    updateLayout,
    addLayout
  } = useData();
  
  const { mechanisms, getEnabledMechanisms } = useMechanisms();
  
  const workstation = workstations.find(ws => ws.id === workstationId) as any;
  const layout = getLayoutByWorkstation(workstationId) as any;
  
  // Derive active views from layout's primary/auxiliary settings
  const primaryView: ViewType = layout?.primary_view || 'front';
  const auxiliaryView: ViewType = layout?.auxiliary_view || 'side';
  const activeViews: ViewType[] = useMemo(() => 
    primaryView === auxiliaryView ? [primaryView] : [primaryView, auxiliaryView],
    [primaryView, auxiliaryView]
  );
  
  const [currentView, setCurrentView] = useState<ViewType>('front');
  const [objects, setObjects] = useState<LayoutObject[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [gridEnabled, setGridEnabled] = useState(true);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [showDistances, setShowDistances] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [mechanismCounts, setMechanismCounts] = useState<Record<string, number>>({});
  
  // Hidden objects (for visibility toggle)
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  
  // Zoom and pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panMode, setPanMode] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  // Grid size selection
  const [gridSize, setGridSize] = useState(20);
  
  // Show property panel
  const [showPropertyPanel, setShowPropertyPanel] = useState(false);
  
  // Smart snap enabled
  const [smartSnapEnabled, setSmartSnapEnabled] = useState(true);
  
  // Dragging object for alignment guides
  const [draggingObject, setDraggingObject] = useState<LayoutObject | null>(null);
  
  // Show object list panel
  const [showObjectList, setShowObjectList] = useState(true);
  
  
  // Toolbar settings row collapsed
  const [settingsCollapsed, setSettingsCollapsed] = useState(false);
  
  // Quality preset for saving views
  const [saveQuality, setSaveQuality] = useState<QualityPreset>('fast');
  
  // View screenshot saving
  const [isSavingView, setIsSavingView] = useState(false);
  const [isSavingAllViews, setIsSavingAllViews] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0); // 0-100
  const [viewSaveStatus, setViewSaveStatus] = useState<Record<StandardViewType, boolean>>({
    front: false,
    side: false,
    top: false,
  });
  
  const canvasRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Canvas dimensions
  const canvasWidth = 1200;
  const canvasHeight = 800;
  
  // Product dimensions from workstation
  const productDimensions = workstation?.product_dimensions as { length: number; width: number; height: number } || { length: 300, width: 200, height: 100 };
  
  // ===== Auto-scale: compute optimal scale and center based on object positions =====
  const autoScaleResult = useMemo(() => {
    const padding = 120; // px total padding (60 each side)
    const iconMargin = 60; // mm margin for icon sizes
    
    // Collect all 3D positions
    const allPoints: { x: number; y: number }[] = [];
    
    // Always include product at origin
    const projectForView = (px: number, py: number, pz: number, view: ViewType) => {
      switch (view) {
        case 'front': return { x: px, y: -pz };
        case 'side': return { x: py, y: -pz };
        case 'top': return { x: px, y: py };
        case 'isometric': {
          const cos30 = Math.cos(Math.PI / 6);
          const sin30 = Math.sin(Math.PI / 6);
          return { 
            x: (px - py) * cos30, 
            y: -(px + py) * sin30 - pz 
          };
        }
      }
    };
    
    // Add product boundary points
    const pHalfL = productDimensions.length / 2;
    const pHalfW = productDimensions.width / 2;
    const pHalfH = productDimensions.height / 2;
    const productCorners = [
      { x: -pHalfL, y: -pHalfW, z: -pHalfH },
      { x: pHalfL, y: pHalfW, z: pHalfH },
    ];
    productCorners.forEach(c => {
      allPoints.push(projectForView(c.x, c.y, c.z, currentView));
    });
    
    // Add all object positions
    objects.forEach(obj => {
      const p = projectForView(obj.posX ?? 0, obj.posY ?? 0, obj.posZ ?? 0, currentView);
      allPoints.push({ x: p.x - iconMargin, y: p.y - iconMargin });
      allPoints.push({ x: p.x + iconMargin, y: p.y + iconMargin });
    });
    
    if (allPoints.length < 2) {
      return { scale: 1.0, centerX: canvasWidth / 2, centerY: canvasHeight / 2 };
    }
    
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    allPoints.forEach(p => {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    });
    
    const rangeX = maxX - minX || 200;
    const rangeY = maxY - minY || 200;
    
    const availW = canvasWidth - padding;
    const availH = canvasHeight - padding;
    
    let s = Math.min(availW / rangeX, availH / rangeY, 2.0);
    s = Math.max(s, 0.3);
    
    // Center offset: map the center of the bounding box to canvas center
    const mmCenterX = (minX + maxX) / 2;
    const mmCenterY = (minY + maxY) / 2;
    
    return {
      scale: s,
      centerX: canvasWidth / 2 - mmCenterX * s,
      centerY: canvasHeight / 2 - mmCenterY * s,
    };
  }, [objects, currentView, productDimensions, canvasWidth, canvasHeight]);
  
  const scale = autoScaleResult.scale;
  const centerX = autoScaleResult.centerX;
  const centerY = autoScaleResult.centerY;
  
  const productW = productDimensions.length * scale;
  const productH = productDimensions.height * scale;
  const productD = productDimensions.width * scale;
  
  // Derived: selected object(s)
  const selectedId = selectedIds[0] || null;
  const secondSelectedId = selectedIds[1] || null;

  // ========== 3D Coordinate System Functions ==========
  
  // Project 3D coordinates to 2D canvas coordinates based on current view
  const project3DTo2D = useCallback((posX: number, posY: number, posZ: number, view: ViewType) => {
    switch (view) {
      case 'front':
        return {
          x: centerX + posX * scale,
          y: centerY - posZ * scale
        };
      case 'side':
        return {
          x: centerX + posY * scale,
          y: centerY - posZ * scale
        };
      case 'top':
        return {
          x: centerX + posX * scale,
          y: centerY + posY * scale
        };
      case 'isometric': {
        const cos30 = Math.cos(Math.PI / 6);
        const sin30 = Math.sin(Math.PI / 6);
        return {
          x: centerX + (posX - posY) * cos30 * scale,
          y: centerY - ((posX + posY) * sin30 + posZ) * scale
        };
      }
      default:
        return { x: centerX, y: centerY };
    }
  }, [centerX, centerY, scale]);

  // Update 3D coordinates from 2D canvas drag based on current view
  const update3DFromCanvas = useCallback((canvasX: number, canvasY: number, view: ViewType, currentObj: LayoutObject): Partial<LayoutObject> => {
    const deltaXmm = (canvasX - centerX) / scale;
    const deltaYmm = (centerY - canvasY) / scale; // Invert Y for natural coordinates
    
    switch (view) {
      case 'front': // Dragging updates posX and posZ
        return {
          posX: Math.round(deltaXmm),
          posZ: Math.round(deltaYmm),
          // Keep posY unchanged
        };
      case 'side': // Dragging updates posY and posZ
        return {
          posY: Math.round(deltaXmm),
          posZ: Math.round(deltaYmm),
          // Keep posX unchanged
        };
      case 'top': // Dragging updates posX and posY
        return {
          posX: Math.round(deltaXmm),
          posY: Math.round(-deltaYmm), // Invert for top view (forward = up on screen)
          // Keep posZ unchanged
        };
      default:
        return {};
    }
  }, [centerX, centerY, scale]);

  // Object manipulation functions (defined before useEffect that uses them)
  const updateObject = useCallback((id: string, updates: Partial<LayoutObject>) => {
    setObjects(prev => prev.map(obj => 
      obj.id === id ? { ...obj, ...updates } : obj
    ));
  }, []);

  // Update object with followers - when a mechanism moves, mounted cameras follow
  const updateObjectWithFollowers = useCallback((id: string, updates: Partial<LayoutObject>) => {
    setObjects(prev => {
      const targetObj = prev.find(o => o.id === id);
      if (!targetObj) return prev;
      
      // Calculate position deltas
      const deltaX = (updates.posX ?? targetObj.posX ?? 0) - (targetObj.posX ?? 0);
      const deltaY = (updates.posY ?? targetObj.posY ?? 0) - (targetObj.posY ?? 0);
      const deltaZ = (updates.posZ ?? targetObj.posZ ?? 0) - (targetObj.posZ ?? 0);
      
      // If mechanism moved, update all mounted cameras and products
      if (targetObj.type === 'mechanism' && (deltaX !== 0 || deltaY !== 0 || deltaZ !== 0)) {
        return prev.map(obj => {
          if (obj.id === id) {
            return { ...obj, ...updates };
          }
          // Find cameras or products mounted to this mechanism
          if (obj.mountedToMechanismId === id) {
            const newPosX = (obj.posX ?? 0) + deltaX;
            const newPosY = (obj.posY ?? 0) + deltaY;
            const newPosZ = (obj.posZ ?? 0) + deltaZ;
            const canvasPos = project3DTo2D(newPosX, newPosY, newPosZ, currentView);
            return { 
              ...obj, 
              posX: newPosX,
              posY: newPosY,
              posZ: newPosZ,
              x: canvasPos.x,
              y: canvasPos.y,
            };
          }
          return obj;
        });
      }
      
      return prev.map(obj => obj.id === id ? { ...obj, ...updates } : obj);
    });
  }, [project3DTo2D, currentView]);

  const deleteObject = useCallback((id: string) => {
    setObjects(prev => prev.filter(o => o.id !== id));
    setSelectedIds(prev => {
      const newIds = prev.filter(i => i !== id);
      if (newIds.length === 0) {
        setShowPropertyPanel(false);
      }
      return newIds;
    });
    setHiddenIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }, []);

  const duplicateObject = useCallback((id: string) => {
    setObjects(prev => {
      const obj = prev.find(o => o.id === id);
      if (!obj) return prev;
      
      // Offset in 3D space
      const newObj: LayoutObject = {
        ...obj,
        id: `${obj.type}-${Date.now()}`,
        posX: (obj.posX ?? 0) + 50,
        posY: (obj.posY ?? 0) + 50,
        x: obj.x + 25, // Will be recalculated on view change
        y: obj.y + 25,
        locked: false,
      };
      
      if (obj.type === 'camera') {
        const cameraCount = prev.filter(o => o.type === 'camera').length;
        newObj.name = `CAM${cameraCount + 1}`;
        newObj.cameraIndex = cameraCount + 1;
      } else if (obj.mechanismId) {
        const mechCount = prev.filter(o => o.mechanismId === obj.mechanismId).length;
        newObj.name = `${obj.name?.split('#')[0] || 'Mechanism'}#${mechCount + 1}`;
      }
      
      setSelectedIds([newObj.id]);
      return [...prev, newObj];
    });
  }, []);

  // Load layout objects when layout changes - ensure 3D coordinates exist
  useEffect(() => {
    if (layout?.layout_objects) {
      try {
        const loadedObjects = typeof layout.layout_objects === 'string' 
          ? JSON.parse(layout.layout_objects) 
          : layout.layout_objects;
        if (Array.isArray(loadedObjects)) {
          // Ensure all objects have 3D coordinates (migrate old data)
          const migratedObjects = loadedObjects.map((obj: any) => ({
            ...obj,
            posX: obj.posX ?? 0,
            posY: obj.posY ?? 0,
            posZ: obj.posZ ?? (obj.type === 'camera' ? 300 : 0),
          }));
          // Ensure product object exists
          const hasProduct = migratedObjects.some((o: any) => o.type === 'product');
          if (!hasProduct) {
            const productCanvasPos = project3DTo2D(0, 0, 0, currentView);
            migratedObjects.push({
              id: 'product-main',
              type: 'product',
              name: '产品',
              posX: 0,
              posY: 0,
              posZ: 0,
              x: productCanvasPos.x,
              y: productCanvasPos.y,
              width: productDimensions.length,
              height: productDimensions.height,
              rotation: 0,
              locked: false,
            });
          }
          setObjects(migratedObjects);
        }
      } catch (e) {
        console.error('Failed to parse layout objects:', e);
      }
    } else {
      // No layout objects yet - create initial product object
      const productCanvasPos = project3DTo2D(0, 0, 0, currentView);
      setObjects([{
        id: 'product-main',
        type: 'product',
        name: '产品',
        posX: 0,
        posY: 0,
        posZ: 0,
        x: productCanvasPos.x,
        y: productCanvasPos.y,
        width: productDimensions.length,
        height: productDimensions.height,
        rotation: 0,
        locked: false,
      }]);
    }
    if (layout?.grid_enabled !== undefined) setGridEnabled(layout.grid_enabled);
    if (layout?.snap_enabled !== undefined) setSnapEnabled(layout.snap_enabled);
    if (layout?.show_distances !== undefined) setShowDistances(layout.show_distances);
    
    // Load view save status and sync currentView to primaryView
    setViewSaveStatus({
      front: layout?.front_view_saved || false,
      side: layout?.side_view_saved || false,
      top: layout?.top_view_saved || false,
    });
    
  }, [layout]);

  // When view changes, re-project all objects from 3D to 2D
  useEffect(() => {
    setObjects(prev => prev.map(obj => {
      const canvasPos = project3DTo2D(obj.posX ?? 0, obj.posY ?? 0, obj.posZ ?? 0, currentView);
      return { ...obj, x: canvasPos.x, y: canvasPos.y };
    }));
  }, [currentView, project3DTo2D]);

  // Count mechanisms in objects
  useEffect(() => {
    const counts: Record<string, number> = {};
    objects.forEach(obj => {
      if (obj.type === 'mechanism' && obj.mechanismId) {
        counts[obj.mechanismId] = (counts[obj.mechanismId] || 0) + 1;
      }
    });
    setMechanismCounts(counts);
  }, [objects]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Space for pan mode
      if (e.code === 'Space' && !e.repeat) {
        setPanMode(true);
      }
      
      if (!selectedId) return;
      
      const selectedObj = objects.find(o => o.id === selectedId);
      if (!selectedObj || selectedObj.locked) return;
      
      const nudgeAmount = e.shiftKey ? 10 : 1; // mm
      
      // Helper to calculate 3D update based on view and direction
      const getNudge3D = (direction: 'up' | 'down' | 'left' | 'right') => {
        switch (currentView) {
          case 'front': // X-Z plane
            if (direction === 'left') return { posX: (selectedObj.posX ?? 0) - nudgeAmount };
            if (direction === 'right') return { posX: (selectedObj.posX ?? 0) + nudgeAmount };
            if (direction === 'up') return { posZ: (selectedObj.posZ ?? 0) + nudgeAmount };
            if (direction === 'down') return { posZ: (selectedObj.posZ ?? 0) - nudgeAmount };
            break;
          case 'side': // Y-Z plane
            if (direction === 'left') return { posY: (selectedObj.posY ?? 0) - nudgeAmount };
            if (direction === 'right') return { posY: (selectedObj.posY ?? 0) + nudgeAmount };
            if (direction === 'up') return { posZ: (selectedObj.posZ ?? 0) + nudgeAmount };
            if (direction === 'down') return { posZ: (selectedObj.posZ ?? 0) - nudgeAmount };
            break;
          case 'top': // X-Y plane
            if (direction === 'left') return { posX: (selectedObj.posX ?? 0) - nudgeAmount };
            if (direction === 'right') return { posX: (selectedObj.posX ?? 0) + nudgeAmount };
            if (direction === 'up') return { posY: (selectedObj.posY ?? 0) - nudgeAmount };
            if (direction === 'down') return { posY: (selectedObj.posY ?? 0) + nudgeAmount };
            break;
        }
        return {};
      };
      
      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          deleteObject(selectedId);
          break;
        case 'ArrowUp':
          e.preventDefault();
          updateObject(selectedId, { 
            y: selectedObj.y - nudgeAmount * scale,
            ...getNudge3D('up')
          });
          break;
        case 'ArrowDown':
          e.preventDefault();
          updateObject(selectedId, { 
            y: selectedObj.y + nudgeAmount * scale,
            ...getNudge3D('down')
          });
          break;
        case 'ArrowLeft':
          e.preventDefault();
          updateObject(selectedId, { 
            x: selectedObj.x - nudgeAmount * scale,
            ...getNudge3D('left')
          });
          break;
        case 'ArrowRight':
          e.preventDefault();
          updateObject(selectedId, { 
            x: selectedObj.x + nudgeAmount * scale,
            ...getNudge3D('right')
          });
          break;
        case 'd':
        case 'D':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            duplicateObject(selectedId);
          }
          break;
        case 'Escape':
          setSelectedIds([]);
          setShowPropertyPanel(false);
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setPanMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedId, objects, deleteObject, updateObject, duplicateObject, scale]);

  const snapToGrid = useCallback((value: number) => {
    if (!snapEnabled) return value;
    return Math.round(value / gridSize) * gridSize;
  }, [snapEnabled, gridSize]);

  // Convert screen coordinates to SVG coordinates
  const screenToSvg = useCallback((clientX: number, clientY: number) => {
    const svg = canvasRef.current;
    if (!svg) return { x: 0, y: 0 };
    
    const rect = svg.getBoundingClientRect();
    const scaleX = canvasWidth / rect.width;
    const scaleY = canvasHeight / rect.height;
    
    return {
      x: (clientX - rect.left) * scaleX / zoom - pan.x / zoom,
      y: (clientY - rect.top) * scaleY / zoom - pan.y / zoom,
    };
  }, [zoom, pan]);

  const isIsometric = currentView === 'isometric';

  const handleMouseDown = (e: React.MouseEvent, obj: LayoutObject) => {
    if (obj.locked || panMode || isIsometric) return;
    e.stopPropagation();
    
    // Handle multi-selection with shift key
    if (e.shiftKey && selectedId && selectedId !== obj.id) {
      setSelectedIds(prev => prev.includes(obj.id) ? prev : [...prev, obj.id]);
      return;
    }
    
    setSelectedIds([obj.id]);
    setShowPropertyPanel(true);
    setIsDragging(true);
    
    const pos = screenToSvg(e.clientX, e.clientY);
    setDragOffset({
      x: pos.x - obj.x,
      y: pos.y - obj.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Handle panning
    if (isPanning && panMode) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setPan({ x: pan.x + dx, y: pan.y + dy });
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }
    
    if (!isDragging || !selectedId) return;
    
    const pos = screenToSvg(e.clientX, e.clientY);
    let newX = pos.x - dragOffset.x;
    let newY = pos.y - dragOffset.y;
    
    // Apply grid snap first
    if (snapEnabled) {
      newX = Math.round(newX / gridSize) * gridSize;
      newY = Math.round(newY / gridSize) * gridSize;
    }
    
    // Get current object for smart snap
    const currentObj = objects.find(o => o.id === selectedId);
    
    // Apply smart snap to other objects
    if (smartSnapEnabled && currentObj) {
      const snapResult = calculateSnapPosition(
        newX, newY,
        currentObj.width, currentObj.height,
        objects,
        centerX, centerY,
        15, // snap threshold
        selectedId
      );
      newX = snapResult.x;
      newY = snapResult.y;
    }
    
    // Update dragging object for alignment guides
    if (currentObj) {
      setDraggingObject({ ...currentObj, x: newX, y: newY });
    }
    
    // Check for camera snap to mechanism mount points
    if (currentObj?.type === 'camera' && currentView !== 'isometric') {
      const nearestMount = findNearestMountPoint(newX, newY, objects, currentView as StandardViewType, 70);
      if (nearestMount) {
        const mountPos = getMountPointWorldPosition(nearestMount.mechanism, nearestMount.mountPoint.id, currentView as StandardViewType);
        if (mountPos) {
          newX = mountPos.x;
          newY = mountPos.y;
        }
      }
    }
    
    // Check for product snap to product-interaction mechanism mount points
    if (currentObj?.type === 'product' && currentView !== 'isometric') {
      const nearestProductMount = findNearestProductMountPoint(newX, newY, objects, currentView as StandardViewType, 80);
      if (nearestProductMount) {
        const mountPos = getProductMountPointWorldPosition(nearestProductMount.mechanism, nearestProductMount.mountPoint.id, currentView as StandardViewType);
        if (mountPos) {
          newX = mountPos.x;
          newY = mountPos.y;
        }
      }
    }
    
    // Update 3D coordinates based on canvas position and current view
    if (currentObj) {
      const updates3D = update3DFromCanvas(newX, newY, currentView, currentObj);
      
      // If dragging a mechanism, also move mounted cameras
      if (currentObj.type === 'mechanism') {
        updateObjectWithFollowers(selectedId, { x: newX, y: newY, ...updates3D });
      } else {
        setObjects(prev => prev.map(obj => 
          obj.id === selectedId ? { ...obj, x: newX, y: newY, ...updates3D } : obj
        ));
      }
    }
  };

  const handleMouseUp = () => {
    // Check if camera or product should be mounted to mechanism
    if (isDragging && selectedId) {
      const currentObj = objects.find(o => o.id === selectedId);
      
      // Camera → camera-interaction mechanism snapping
      if (currentObj?.type === 'camera') {
        const nearestMount = findNearestMountPoint(
          currentObj.x, 
          currentObj.y, 
          objects, 
          currentView as StandardViewType, 
          70
        );
        
        if (nearestMount) {
          const mountPos = getMountPointWorldPosition(nearestMount.mechanism, nearestMount.mountPoint.id, currentView as StandardViewType);
          const mechPosX = nearestMount.mechanism.posX ?? 0;
          const mechPosY = nearestMount.mechanism.posY ?? 0;
          const mechPosZ = nearestMount.mechanism.posZ ?? 0;
          const offsetX = (currentObj.posX ?? 0) - mechPosX;
          const offsetY = (currentObj.posY ?? 0) - mechPosY;
          const offsetZ = (currentObj.posZ ?? 0) - mechPosZ;
          
          updateObject(selectedId, {
            mountedToMechanismId: nearestMount.mechanism.id,
            mountPointId: nearestMount.mountPoint.id,
            mountOffsetX: offsetX,
            mountOffsetY: offsetY,
            mountOffsetZ: offsetZ,
            ...(mountPos ? { x: mountPos.x, y: mountPos.y } : {}),
          });
          
          toast.success(`${currentObj.name} 已挂载到 ${nearestMount.mechanism.name}`);
        } else if (currentObj.mountedToMechanismId) {
          const mechObj = objects.find(o => o.id === currentObj.mountedToMechanismId);
          updateObject(selectedId, {
            mountedToMechanismId: undefined,
            mountPointId: undefined,
            mountOffsetX: undefined,
            mountOffsetY: undefined,
            mountOffsetZ: undefined,
          });
          if (mechObj) {
            toast.info(`${currentObj.name} 已从 ${mechObj.name} 解除挂载`);
          }
        }
      }
      
      // Product → product-interaction mechanism snapping
      if (currentObj?.type === 'product') {
        const nearestProductMount = findNearestProductMountPoint(
          currentObj.x,
          currentObj.y,
          objects,
          currentView as StandardViewType,
          80
        );
        
        if (nearestProductMount) {
          const mountPos = getProductMountPointWorldPosition(nearestProductMount.mechanism, nearestProductMount.mountPoint.id, currentView as StandardViewType);
          const mechPosX = nearestProductMount.mechanism.posX ?? 0;
          const mechPosY = nearestProductMount.mechanism.posY ?? 0;
          const mechPosZ = nearestProductMount.mechanism.posZ ?? 0;
          const offsetX = (currentObj.posX ?? 0) - mechPosX;
          const offsetY = (currentObj.posY ?? 0) - mechPosY;
          const offsetZ = (currentObj.posZ ?? 0) - mechPosZ;
          
          updateObject(selectedId, {
            mountedToMechanismId: nearestProductMount.mechanism.id,
            mountPointId: nearestProductMount.mountPoint.id,
            mountOffsetX: offsetX,
            mountOffsetY: offsetY,
            mountOffsetZ: offsetZ,
            ...(mountPos ? { x: mountPos.x, y: mountPos.y } : {}),
          });
          
          toast.success(`产品已吸附到 ${nearestProductMount.mechanism.name}`);
        } else if (currentObj.mountedToMechanismId) {
          const mechObj = objects.find(o => o.id === currentObj.mountedToMechanismId);
          updateObject(selectedId, {
            mountedToMechanismId: undefined,
            mountPointId: undefined,
            mountOffsetX: undefined,
            mountOffsetY: undefined,
            mountOffsetZ: undefined,
          });
          if (mechObj) {
            toast.info(`产品已从 ${mechObj.name} 解除吸附`);
          }
        }
      }
    }
    
    setIsDragging(false);
    setIsPanning(false);
    setDraggingObject(null);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (panMode) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    } else {
      setSelectedIds([]);
      setShowPropertyPanel(false);
    }
  };

  // Handle wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.min(3, Math.max(0.25, prev + delta)));
  };

  const handleResize = useCallback((id: string, width: number, height: number, x: number, y: number) => {
    setObjects(prev => prev.map(obj => 
      obj.id === id ? { ...obj, width, height, x, y } : obj
    ));
  }, []);

  const addCamera = useCallback(() => {
    const existingCameras = objects.filter(o => o.type === 'camera');
    const cameraCount = existingCameras.length;
    
    // Calculate position to spread cameras evenly without overlap
    // Use symmetric distribution around center
    let defaultPosX: number;
    if (cameraCount === 0) {
      defaultPosX = 0; // First camera at center
    } else {
      // Spread cameras with AUTO_ARRANGE_CONFIG.cameraSpacing
      const totalAfterAdd = cameraCount + 1;
      const positions = [];
      for (let i = 0; i < totalAfterAdd; i++) {
        positions.push(-((totalAfterAdd - 1) * AUTO_ARRANGE_CONFIG.cameraSpacing / 2) + i * AUTO_ARRANGE_CONFIG.cameraSpacing);
      }
      defaultPosX = positions[cameraCount]; // Position for new camera
    }
    
    // Position cameras behind the product (negative Y) to avoid overlap with mechanisms
    const defaultPosY = AUTO_ARRANGE_CONFIG.cameraDefaultY;
    const defaultPosZ = AUTO_ARRANGE_CONFIG.cameraDefaultZ;
    
    const canvasPos = project3DTo2D(defaultPosX, defaultPosY, defaultPosZ, currentView);
    
    const newCamera: LayoutObject = {
      id: `camera-${Date.now()}`,
      type: 'camera',
      name: `CAM${cameraCount + 1}`,
      posX: defaultPosX,
      posY: defaultPosY,
      posZ: defaultPosZ,
      x: canvasPos.x,
      y: canvasPos.y,
      width: 50,
      height: 55,
      rotation: 0,
      locked: false,
      cameraIndex: cameraCount + 1,
    };
    setObjects(prev => [...prev, newCamera]);
    setSelectedIds([newCamera.id]);
    setShowPropertyPanel(true);
    toast.success(`已添加 ${newCamera.name}`);
  }, [objects, project3DTo2D, currentView]);

  const addMechanism = useCallback((mechanism: Mechanism) => {
    const existingMechs = objects.filter(o => o.type === 'mechanism');
    const sameMechCount = existingMechs.filter(o => o.mechanismId === mechanism.id).length;
    const totalMechCount = existingMechs.length;
    
    // Calculate position to spread mechanisms evenly
    // Mechanisms go in a row at the front of the product
    let defaultPosX: number;
    if (totalMechCount === 0) {
      defaultPosX = 0; // First mechanism at center
    } else {
      // Alternate left/right placement
      const side = totalMechCount % 2 === 0 ? 1 : -1;
      const distance = Math.ceil(totalMechCount / 2) * AUTO_ARRANGE_CONFIG.mechanismSpacing;
      defaultPosX = side * distance;
    }
    
    // Position mechanisms in front of product with increased offset to avoid overlap with cameras
    const defaultPosY = productDimensions.width / 2 + AUTO_ARRANGE_CONFIG.mechanismOffsetY;
    const defaultPosZ = AUTO_ARRANGE_CONFIG.mechanismDefaultZ;
    
    const canvasPos = project3DTo2D(defaultPosX, defaultPosY, defaultPosZ, currentView);
    
    const newMech: LayoutObject = {
      id: `mech-${Date.now()}`,
      type: 'mechanism',
      mechanismId: mechanism.id,
      mechanismType: mechanism.type,
      name: `${mechanism.name}#${sameMechCount + 1}`,
      posX: defaultPosX,
      posY: defaultPosY,
      posZ: defaultPosZ,
      x: canvasPos.x,
      y: canvasPos.y,
      width: 80,
      height: 60,
      rotation: 0,
      locked: false,
    };
    setObjects(prev => [...prev, newMech]);
    setSelectedIds([newMech.id]);
    setShowPropertyPanel(true);
    toast.success(`已添加 ${newMech.name}`);
  }, [objects, project3DTo2D, currentView, productDimensions.width, scale]);

  // Unified save: layout data + three-view snapshots in one click
  const handleSaveAll = async () => {
    setIsSaving(true);
    setIsSavingAllViews(true);
    setSaveProgress(0);
    try {
      // Step 1: Save layout data (10% progress)
      const updates = {
        layout_objects: objects,
        grid_enabled: gridEnabled,
        snap_enabled: snapEnabled,
        show_distances: showDistances,
      };
      
      let layoutId = layout?.id;
      if (layoutId) {
        await updateLayout(layoutId, updates as any);
      } else {
        const newLayout = await addLayout({
          workstation_id: workstationId,
          name: workstation?.name || 'Layout',
          ...updates
        } as any);
        layoutId = (newLayout as any)?.id;
      }
      setSaveProgress(10);
      
      // Step 2: Save three-view snapshots
      const svg = canvasRef.current;
      if (svg && layoutId) {
        const views: ViewType[] = ['front', 'side', 'top'];
        const preset = QUALITY_PRESETS[saveQuality];
        const viewImages: { view: ViewType; blob: Blob }[] = [];
        
        // Generate images sequentially (need to switch views)
        for (let i = 0; i < views.length; i++) {
          const view = views[i];
          setCurrentView(view);
          await new Promise(r => setTimeout(r, 200));
          
          const dataUrl = await toPng(svg as unknown as HTMLElement, { 
            quality: preset.quality, 
            pixelRatio: preset.pixelRatio,
            backgroundColor: '#1e293b',
            skipFonts: true,
          });
          
          const originalBlob = dataUrlToBlob(dataUrl);
          const compressedBlob = await compressImage(originalBlob, {
            quality: preset.quality,
            maxWidth: preset.maxWidth,
            maxHeight: preset.maxHeight,
            format: 'image/jpeg',
          });
          
          viewImages.push({ view, blob: compressedBlob });
          setSaveProgress(10 + Math.round(((i + 1) / views.length) * 45));
        }
        
        // Upload all views in parallel
        const uploadPromises = viewImages.map(async ({ view, blob }, index) => {
          const fileName = `${workstationId}/${view}-${Date.now()}.jpg`;
          
          const { error: uploadError } = await supabase.storage
            .from('workstation-views')
            .upload(fileName, blob, { 
              upsert: true,
              contentType: 'image/jpeg',
            });
          
          if (uploadError) throw uploadError;
          
          const { data: urlData } = supabase.storage
            .from('workstation-views')
            .getPublicUrl(fileName);
          
          setSaveProgress(55 + Math.round(((index + 1) / views.length) * 45));
          
          return { view, url: urlData.publicUrl };
        });
        
        const uploadResults = await Promise.all(uploadPromises);
        
        // Batch update layout with all URLs
        const updateData: Record<string, any> = {};
        uploadResults.forEach(({ view, url }) => {
          updateData[`${view}_view_image_url`] = url;
          updateData[`${view}_view_saved`] = true;
        });
        
        await updateLayout(layoutId, updateData as any);
        setViewSaveStatus({ front: true, side: true, top: true });
      }
      
      setSaveProgress(100);
      toast.success('布局和三视图已保存');
    } catch (error) {
      console.error('Save all error:', error);
      toast.error('保存失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setIsSaving(false);
      setIsSavingAllViews(false);
      setSaveProgress(0);
    }
  };

  const resetLayout = () => {
    if (!confirm('确定要重置布局吗？所有对象将被清除。')) return;
    setObjects([]);
    setSelectedIds([]);
    setShowPropertyPanel(false);
    setHiddenIds(new Set());
  };

  // Save current view as screenshot
  // Optimized single view save with compression
  const saveCurrentViewSnapshot = useCallback(async (viewToSave?: ViewType) => {
    const targetView = viewToSave || currentView;
    const svg = canvasRef.current;
    if (!svg || !layout?.id) {
      toast.error('请先保存布局');
      return;
    }
    
    setIsSavingView(true);
    try {
      const preset = QUALITY_PRESETS[saveQuality];
      
      // Generate PNG from SVG with selected quality
      const dataUrl = await toPng(svg as unknown as HTMLElement, { 
        quality: preset.quality, 
        pixelRatio: preset.pixelRatio,
        backgroundColor: '#1e293b',
        skipFonts: true,
      });
      
      // Convert and compress
      const originalBlob = dataUrlToBlob(dataUrl);
      const compressedBlob = await compressImage(originalBlob, {
        quality: preset.quality,
        maxWidth: preset.maxWidth,
        maxHeight: preset.maxHeight,
        format: 'image/jpeg', // JPEG is smaller for photos
      });
      
      const fileName = `${workstationId}/${targetView}-${Date.now()}.jpg`;
      
      // Upload compressed blob
      const { error: uploadError } = await supabase.storage
        .from('workstation-views')
        .upload(fileName, compressedBlob, { 
          upsert: true,
          contentType: 'image/jpeg',
        });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('workstation-views')
        .getPublicUrl(fileName);
      
      // Update layout with the new image URL
      const updateField = `${targetView}_view_image_url`;
      const savedField = `${targetView}_view_saved`;
      
      await updateLayout(layout.id, {
        [updateField]: urlData.publicUrl,
        [savedField]: true,
      } as any);
      
      // Update local state
      setViewSaveStatus(prev => ({ ...prev, [targetView]: true }));
      
      toast.success(`${targetView === 'front' ? '正视图' : targetView === 'side' ? '侧视图' : '俯视图'}已保存`);
    } catch (error) {
      console.error('Save view error:', error);
      toast.error(getImageSaveErrorMessage(error));
    } finally {
      setIsSavingView(false);
    }
  }, [currentView, layout?.id, workstationId, updateLayout, saveQuality]);

  // Optimized parallel save for all three views
  const saveAllViewSnapshots = useCallback(async () => {
    if (!layout?.id) {
      toast.error('请先保存布局');
      return;
    }
    
    const svg = canvasRef.current;
    if (!svg) return;
    
    setIsSavingAllViews(true);
    setSaveProgress(0);
    const views: ViewType[] = ['front', 'side', 'top'];
    const preset = QUALITY_PRESETS[saveQuality];
    
    try {
      // Generate all view images in sequence (need to switch views)
      const viewImages: { view: ViewType; blob: Blob }[] = [];
      
      for (let i = 0; i < views.length; i++) {
        const view = views[i];
        
        // Switch view and wait for render
        setCurrentView(view);
        await new Promise(r => setTimeout(r, 200)); // Reduced from 500ms
        
        // Generate and compress
        const dataUrl = await toPng(svg as unknown as HTMLElement, { 
          quality: preset.quality, 
          pixelRatio: preset.pixelRatio,
          backgroundColor: '#1e293b',
          skipFonts: true,
        });
        
        const originalBlob = dataUrlToBlob(dataUrl);
        const compressedBlob = await compressImage(originalBlob, {
          quality: preset.quality,
          maxWidth: preset.maxWidth,
          maxHeight: preset.maxHeight,
          format: 'image/jpeg',
        });
        
        viewImages.push({ view, blob: compressedBlob });
        setSaveProgress(Math.round(((i + 1) / views.length) * 50)); // First 50% for generation
      }
      
      // Upload all views in parallel
      const uploadPromises = viewImages.map(async ({ view, blob }, index) => {
        const fileName = `${workstationId}/${view}-${Date.now()}.jpg`;
        
        const { error: uploadError } = await supabase.storage
          .from('workstation-views')
          .upload(fileName, blob, { 
            upsert: true,
            contentType: 'image/jpeg',
          });
        
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage
          .from('workstation-views')
          .getPublicUrl(fileName);
        
        setSaveProgress(50 + Math.round(((index + 1) / views.length) * 50)); // Last 50% for upload
        
        return { view, url: urlData.publicUrl };
      });
      
      const uploadResults = await Promise.all(uploadPromises);
      
      // Batch update layout with all URLs
      const updateData: Record<string, any> = {};
      uploadResults.forEach(({ view, url }) => {
        updateData[`${view}_view_image_url`] = url;
        updateData[`${view}_view_saved`] = true;
      });
      
      await updateLayout(layout.id, updateData as any);
      
      // Update local state
      setViewSaveStatus({ front: true, side: true, top: true });
      setSaveProgress(100);
      
      toast.success('视图已全部保存');
    } catch (error) {
      console.error('Save all views error:', error);
      toast.error(getImageSaveErrorMessage(error));
    } finally {
      setIsSavingAllViews(false);
      setSaveProgress(0);
    }
  }, [layout?.id, workstationId, updateLayout, saveQuality]);

  // Auto-arrange objects to prevent overlap
  const autoArrangeObjects = useCallback(() => {
    setObjects(prev => {
      const cameras = prev.filter(o => o.type === 'camera');
      const mechanisms = prev.filter(o => o.type === 'mechanism');
      
      // Arrange cameras in a row above product
      const arrangedCameras = cameras.map((cam, i) => {
        const totalCameras = cameras.length;
        const startX = -(totalCameras - 1) * AUTO_ARRANGE_CONFIG.cameraSpacing / 2;
        const posX = startX + i * AUTO_ARRANGE_CONFIG.cameraSpacing;
        const canvasPos = project3DTo2D(posX, 0, AUTO_ARRANGE_CONFIG.cameraDefaultZ, currentView);
        return {
          ...cam,
          posX,
          posY: 0,
          posZ: AUTO_ARRANGE_CONFIG.cameraDefaultZ,
          x: canvasPos.x,
          y: canvasPos.y,
        };
      });
      
      // Arrange mechanisms around product
      const arrangedMechanisms = mechanisms.map((mech, i) => {
        const totalMechs = mechanisms.length;
        const startX = -(totalMechs - 1) * AUTO_ARRANGE_CONFIG.mechanismSpacing / 2;
        const posX = startX + i * AUTO_ARRANGE_CONFIG.mechanismSpacing;
        const canvasPos = project3DTo2D(posX, 100, AUTO_ARRANGE_CONFIG.mechanismDefaultZ, currentView);
        return {
          ...mech,
          posX,
          posY: 100,
          posZ: AUTO_ARRANGE_CONFIG.mechanismDefaultZ,
          x: canvasPos.x,
          y: canvasPos.y,
        };
      });
      
      return [...arrangedCameras, ...arrangedMechanisms];
    });
    toast.success('已自动排布对象');
  }, [project3DTo2D, currentView]);

  // Toggle object visibility
  const toggleObjectVisibility = useCallback((id: string) => {
    setHiddenIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // Toggle object lock
  const toggleObjectLock = useCallback((id: string) => {
    setObjects(prev => prev.map(obj =>
      obj.id === id ? { ...obj, locked: !obj.locked } : obj
    ));
  }, []);

  // Focus on object (center view and select)
  const focusObject = useCallback((id: string) => {
    const obj = objects.find(o => o.id === id);
    if (!obj) return;
    
    // Center the pan on the object
    setPan({
      x: (centerX - obj.x) * zoom,
      y: (centerY - obj.y) * zoom,
    });
    
    // Select the object
    setSelectedIds([id]);
    setShowPropertyPanel(true);
    
    // Brief highlight effect (handled by selection state)
  }, [objects, centerX, centerY, zoom]);

  // Reorder object in the layer stack
  const reorderObject = useCallback((id: string, direction: 'up' | 'down') => {
    setObjects(prev => {
      const index = prev.findIndex(o => o.id === id);
      if (index === -1) return prev;
      
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      
      const newObjects = [...prev];
      [newObjects[index], newObjects[newIndex]] = [newObjects[newIndex], newObjects[index]];
      return newObjects;
    });
  }, []);

  // Select all objects
  const selectAllObjects = useCallback(() => {
    setSelectedIds(objects.map(o => o.id));
  }, [objects]);

  // Deselect all objects
  const deselectAllObjects = useCallback(() => {
    setSelectedIds([]);
    setShowPropertyPanel(false);
  }, []);

  // Handle object selection from list panel
  const handleSelectObject = useCallback((id: string, multiSelect?: boolean) => {
    if (multiSelect) {
      setSelectedIds(prev => {
        if (prev.includes(id)) {
          const newIds = prev.filter(i => i !== id);
          if (newIds.length === 0) setShowPropertyPanel(false);
          return newIds;
        }
        return [...prev, id];
      });
    } else {
      setSelectedIds([id]);
      setShowPropertyPanel(true);
    }
  }, []);

  const fitToScreen = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Calculate distance between two objects or from product center
  const getDistance = (obj: LayoutObject, target?: LayoutObject) => {
    const productCenterX = centerX;
    const productCenterY = centerY;
    
    if (target) {
      const dx = (obj.x - target.x) / scale;
      const dy = (obj.y - target.y) / scale;
      return Math.round(Math.sqrt(dx * dx + dy * dy));
    }
    
    const dx = (obj.x - productCenterX) / scale;
    const dy = (obj.y - productCenterY) / scale;
    return Math.round(Math.sqrt(dx * dx + dy * dy));
  };

  const selectedObj = objects.find(o => o.id === selectedId);
  const secondObj = objects.find(o => o.id === secondSelectedId);
  const enabledMechanisms = getEnabledMechanisms();

  // Get mechanism image URL for current view - prioritize local assets
  const mechViewForImage: StandardViewType = currentView === 'isometric' ? 'front' : currentView;
  const getMechanismImageForObject = (obj: LayoutObject) => {
    if (obj.mechanismType) {
      const localImage = getMechanismImage(obj.mechanismType, mechViewForImage);
      if (localImage) return localImage;
    }
    
    const mech = mechanisms.find(m => m.id === obj.mechanismId);
    if (!mech) return null;
    
    const localImage = getMechanismImage(mech.type, mechViewForImage);
    if (localImage) return localImage;
    
    switch (mechViewForImage) {
      case 'front': return mech.front_view_image_url;
      case 'side': return mech.side_view_image_url;
      case 'top': return mech.top_view_image_url;
      default: return mech.front_view_image_url;
    }
  };

  // Isometric cube helper: project a 3D point to isometric 2D
  const isoProject = useCallback((px: number, py: number, pz: number) => {
    const cos30 = Math.cos(Math.PI / 6);
    const sin30 = Math.sin(Math.PI / 6);
    return {
      x: centerX + (px - py) * cos30 * scale,
      y: centerY - ((px + py) * sin30 + pz) * scale
    };
  }, [centerX, centerY, scale]);

  if (!workstation) return null;

  // Current product dimensions based on view
  const currentProductW = currentView === 'side' ? productD : productW;
  const currentProductH = currentView === 'top' ? productD : productH;

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      {/* Toolbar - Main Row: Views + Save buttons only */}
      <div className="flex items-center justify-between gap-3 px-4 py-2 bg-card border-b border-border">
        {/* Left: View tabs */}
        <div className="flex gap-1">
          {(['front', 'side', 'top'] as ViewType[]).map(view => (
            <button
              key={view}
              onClick={() => setCurrentView(view)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5',
                currentView === view 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              )}
            >
              {view === 'front' ? '正视图 (X-Z)' : view === 'side' ? '左视图 (Y-Z)' : '俯视图 (X-Y)'}
              {viewSaveStatus[view] && (
                <Check className="h-3 w-3 text-green-500" />
              )}
            </button>
          ))}
          <div className="h-6 w-px bg-border self-center mx-1" />
          <button
            onClick={() => setCurrentView('isometric')}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5',
              currentView === 'isometric'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            )}
          >
            🧊 2.5D 预览
          </button>
        </div>
        
        {/* Right: Quality selector, Save buttons and settings toggle */}
        <div className="flex items-center gap-2">
          {/* Quality Preset Selector */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Select value={saveQuality} onValueChange={(v) => setSaveQuality(v as QualityPreset)}>
                  <SelectTrigger className="w-20 h-8 text-xs">
                    <Zap className={cn("h-3 w-3 mr-1", saveQuality === 'fast' ? "text-green-500" : saveQuality === 'high' ? "text-amber-500" : "text-blue-500")} />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fast">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        快速
                      </span>
                    </SelectItem>
                    <SelectItem value="standard">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        标准
                      </span>
                    </SelectItem>
                    <SelectItem value="high">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        高清
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <div className="text-xs">
                  <p className="font-medium mb-1">保存质量设置</p>
                  <p>快速: 更快的保存速度，较小文件</p>
                  <p>标准: 平衡质量和速度</p>
                  <p>高清: 最佳质量，较大文件</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="sm" 
                  onClick={handleSaveAll} 
                  disabled={isSaving || isSavingAllViews}
                  className="gap-1.5 h-8 min-w-[120px] relative overflow-hidden"
                >
                  {isSavingAllViews && saveProgress > 0 && (
                    <div 
                      className="absolute left-0 top-0 bottom-0 bg-primary-foreground/20 transition-all duration-300"
                      style={{ width: `${saveProgress}%` }}
                    />
                  )}
                  <span className="relative flex items-center gap-1.5">
                    {isSaving || isSavingAllViews ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    {isSavingAllViews ? `保存中 ${saveProgress}%` : '保存'}
                    {!isSaving && !isSavingAllViews && viewSaveStatus.front && viewSaveStatus.side && viewSaveStatus.top && (
                      <Check className="h-3 w-3 text-green-500" />
                    )}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>一键保存布局数据 + 三视图截图</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <div className="h-5 w-px bg-border" />
          
          <Button 
            variant={settingsCollapsed ? "outline" : "secondary"}
            size="sm" 
            onClick={() => setSettingsCollapsed(!settingsCollapsed)}
            className="gap-1.5 h-8"
          >
            <Settings2 className="h-3.5 w-3.5" />
            工具
            {settingsCollapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
          </Button>
        </div>
      </div>
      
      {/* Collapsible Tools Panel */}
      <Collapsible open={!settingsCollapsed} onOpenChange={(open) => setSettingsCollapsed(!open)}>
        <CollapsibleContent>
          <div className="bg-muted/30 border-b border-border px-4 py-3 space-y-3">
            {/* Row 1: Object Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-muted-foreground w-14 shrink-0">添加对象</span>
              <Button variant="default" size="sm" onClick={addCamera} className="gap-1.5 h-7 text-xs">
                <Camera className="h-3 w-3" />
                添加相机
              </Button>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs">
                    <Plus className="h-3 w-3" />
                    添加机构
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-2" align="start">
                  <div className="space-y-1 max-h-72 overflow-y-auto">
                    {enabledMechanisms.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-3 text-center">暂无可用机构</p>
                    ) : (() => {
                      const CAMERA_TYPES = ['camera_mount', 'robot_arm'];
                      const cameraMechs = enabledMechanisms.filter(m => CAMERA_TYPES.includes(m.type));
                      const productMechs = enabledMechanisms.filter(m => !CAMERA_TYPES.includes(m.type));
                      const renderItem = (mech: any) => (
                        <button
                          key={mech.id}
                          onClick={() => addMechanism(mech)}
                          className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted text-left transition-colors"
                        >
                          <MechanismThumbnail type={mech.type} databaseUrl={mech.front_view_image_url} />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{mech.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {mechanismCounts[mech.id] ? `已添加 ${mechanismCounts[mech.id]} 个` : '点击添加'}
                            </div>
                          </div>
                        </button>
                      );
                      return (
                        <>
                          {cameraMechs.length > 0 && (
                            <>
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">📷 相机交互</div>
                              {cameraMechs.map(renderItem)}
                            </>
                          )}
                          {cameraMechs.length > 0 && productMechs.length > 0 && (
                            <div className="my-1 h-px bg-border" />
                          )}
                          {productMechs.length > 0 && (
                            <>
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">📦 产品交互</div>
                              {productMechs.map(renderItem)}
                            </>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </PopoverContent>
              </Popover>
              
              <div className="h-4 w-px bg-border" />
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={autoArrangeObjects} className="gap-1.5 h-7 text-xs">
                      <LayoutGrid className="h-3 w-3" />
                      自动排布
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>一键重新排列所有对象</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <Button variant="ghost" size="sm" onClick={resetLayout} className="gap-1.5 h-7 text-xs">
                <RotateCcw className="h-3 w-3" />
                重置布局
              </Button>
            </div>
            
            {/* Row 2: Grid Settings */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-medium text-muted-foreground w-14 shrink-0">网格设置</span>
              <Select value={gridSize.toString()} onValueChange={(v) => setGridSize(parseInt(v))}>
                <SelectTrigger className="w-20 h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10px</SelectItem>
                  <SelectItem value="20">20px</SelectItem>
                  <SelectItem value="40">40px</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex items-center gap-1.5">
                <Switch checked={gridEnabled} onCheckedChange={setGridEnabled} id="grid" className="scale-75" />
                <Label htmlFor="grid" className="text-xs cursor-pointer">显示网格</Label>
              </div>
              
              <div className="flex items-center gap-1.5">
                <Switch checked={snapEnabled} onCheckedChange={setSnapEnabled} id="snap" className="scale-75" />
                <Label htmlFor="snap" className="text-xs cursor-pointer">网格吸附</Label>
              </div>
              
              <div className="flex items-center gap-1.5">
                <Switch checked={smartSnapEnabled} onCheckedChange={setSmartSnapEnabled} id="smartsnap" className="scale-75" />
                <Label htmlFor="smartsnap" className="text-xs cursor-pointer">智能对齐</Label>
              </div>
            </div>
            
            {/* Row 3: Display Settings */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-medium text-muted-foreground w-14 shrink-0">显示选项</span>
              <div className="flex items-center gap-1.5">
                <Switch checked={showDistances} onCheckedChange={setShowDistances} id="dist" className="scale-75" />
                <Label htmlFor="dist" className="text-xs cursor-pointer">尺寸标注</Label>
              </div>
              
              
              <div className="flex items-center gap-1.5">
                <Switch checked={showObjectList} onCheckedChange={setShowObjectList} id="table" className="scale-75" />
                <Label htmlFor="table" className="text-xs cursor-pointer">对象清单</Label>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
      
      {/* Objects count summary */}
      <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 border-b border-border text-sm">
        <span className="text-muted-foreground">当前布局:</span>
        <Badge variant="secondary" className="gap-1">
          <Camera className="h-3 w-3" />
          {objects.filter(o => o.type === 'camera').length} 相机
        </Badge>
        {Object.entries(mechanismCounts).map(([mechId, count]) => {
          const mech = mechanisms.find(m => m.id === mechId);
          return mech ? (
            <Badge key={mechId} variant="outline" className="gap-1">
              {mech.name} ×{count}
            </Badge>
          ) : null;
        })}
        {selectedId && (
          <span className="ml-auto text-xs text-muted-foreground">
            已选中: {selectedObj?.name} | 按 Delete 删除 | Ctrl+D 复制
          </span>
        )}
      </div>
      
      {/* Canvas Container */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-hidden relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
      >
        {/* Canvas */}
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <svg
              ref={canvasRef}
              viewBox={`${-pan.x / zoom} ${-pan.y / zoom} ${canvasWidth / zoom} ${canvasHeight / zoom}`}
              className={cn(
                "w-full h-full",
                panMode ? "cursor-grab" : "cursor-default",
                isPanning && "cursor-grabbing"
              )}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onMouseDown={handleCanvasMouseDown}
              onWheel={handleWheel}
            >
              <defs>
                {/* Grid pattern */}
                <pattern id="grid-pattern" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
                  <path 
                    d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`} 
                    fill="none" 
                    stroke="rgba(148, 163, 184, 0.15)" 
                    strokeWidth="0.5" 
                  />
                </pattern>
                <pattern id="grid-pattern-major" width={gridSize * 5} height={gridSize * 5} patternUnits="userSpaceOnUse">
                  <path 
                    d={`M ${gridSize * 5} 0 L 0 0 0 ${gridSize * 5}`} 
                    fill="none" 
                    stroke="rgba(148, 163, 184, 0.3)" 
                    strokeWidth="1" 
                  />
                </pattern>
                
                {/* Product gradient */}
                <linearGradient id="product-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#0891b2" stopOpacity="0.6" />
                </linearGradient>
                
                {/* Camera gradient */}
                <linearGradient id="camera-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#1d4ed8" />
                </linearGradient>
                
                {/* Selected camera gradient */}
                <linearGradient id="camera-selected-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
                
                {/* Mechanism gradient */}
                <linearGradient id="mech-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#ea580c" />
                </linearGradient>
                
                {/* Shadow filter */}
                <filter id="drop-shadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="2" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.3" />
                </filter>
                
                {/* Glow filter for selected */}
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              
              {/* Grid */}
              {gridEnabled && (
                <>
                  <rect x={-pan.x / zoom} y={-pan.y / zoom} width={canvasWidth * 2} height={canvasHeight * 2} fill="url(#grid-pattern)" />
                  <rect x={-pan.x / zoom} y={-pan.y / zoom} width={canvasWidth * 2} height={canvasHeight * 2} fill="url(#grid-pattern-major)" />
                </>
              )}
              
              {/* Axis lines */}
              <line x1={0} y1={centerY} x2={canvasWidth} y2={centerY} stroke="rgba(148, 163, 184, 0.2)" strokeWidth="1" strokeDasharray="8 4" />
              <line x1={centerX} y1={0} x2={centerX} y2={canvasHeight} stroke="rgba(148, 163, 184, 0.2)" strokeWidth="1" strokeDasharray="8 4" />
              
              {/* View label with axis indicators */}
              <g transform={`translate(${centerX}, 40)`}>
                <rect x={-120} y={-16} width={240} height={32} rx={8} fill="rgba(30, 41, 59, 0.95)" />
                <text x={0} y={6} textAnchor="middle" fill="#e2e8f0" fontSize="14" fontWeight="600">
                  {currentView === 'front' 
                    ? '🎯 正视图 | X↔ Z↕' 
                    : currentView === 'side' 
                      ? '📐 左视图 | Y↔ Z↕' 
                      : currentView === 'isometric'
                        ? '🧊 2.5D 等轴测预览（只读）'
                        : '🔍 俯视图 | X↔ Y↕'}
                </text>
              </g>
              
              {/* Axis legend moved to viewport-fixed overlay below */}
              
              {/* Isometric ground grid and XYZ axes */}
              {isIsometric && (() => {
                const gridSize = 500; // mm extent in each direction
                const gridStep = 100; // mm per grid line
                const lines: JSX.Element[] = [];
                
                // Ground plane grid (Z=0, X-Y plane) - diamond pattern in isometric
                for (let i = -gridSize; i <= gridSize; i += gridStep) {
                  // Lines parallel to X axis (varying Y)
                  const xStart = isoProject(-gridSize, i, 0);
                  const xEnd = isoProject(gridSize, i, 0);
                  lines.push(
                    <line key={`gx-${i}`} x1={xStart.x} y1={xStart.y} x2={xEnd.x} y2={xEnd.y}
                      stroke="#475569" strokeWidth={i === 0 ? 1.2 : 0.5} strokeDasharray={i === 0 ? undefined : "3 4"}
                      opacity={i === 0 ? 0.5 : 0.2} />
                  );
                  // Lines parallel to Y axis (varying X)
                  const yStart = isoProject(i, -gridSize, 0);
                  const yEnd = isoProject(i, gridSize, 0);
                  lines.push(
                    <line key={`gy-${i}`} x1={yStart.x} y1={yStart.y} x2={yEnd.x} y2={yEnd.y}
                      stroke="#475569" strokeWidth={i === 0 ? 1.2 : 0.5} strokeDasharray={i === 0 ? undefined : "3 4"}
                      opacity={i === 0 ? 0.5 : 0.2} />
                  );
                }
                
                // XYZ axis arrows from origin
                const origin = isoProject(0, 0, 0);
                const axisLen = 200;
                const xTip = isoProject(axisLen, 0, 0);
                const yTip = isoProject(0, axisLen, 0);
                const zTip = isoProject(0, 0, axisLen);
                
                // Arrow head helper
                const arrowHead = (tip: {x:number, y:number}, from: {x:number, y:number}, color: string) => {
                  const dx = tip.x - from.x;
                  const dy = tip.y - from.y;
                  const len = Math.sqrt(dx*dx + dy*dy);
                  if (len === 0) return null;
                  const nx = dx/len, ny = dy/len;
                  const px = -ny, py = nx;
                  const hs = 8; // head size
                  return (
                    <polygon
                      points={`${tip.x},${tip.y} ${tip.x - nx*hs + px*hs*0.4},${tip.y - ny*hs + py*hs*0.4} ${tip.x - nx*hs - px*hs*0.4},${tip.y - ny*hs - py*hs*0.4}`}
                      fill={color}
                    />
                  );
                };
                
                return (
                  <g className="isometric-grid-axes">
                    {/* Ground grid */}
                    <g opacity={0.8}>{lines}</g>
                    
                    {/* X axis (red) */}
                    <line x1={origin.x} y1={origin.y} x2={xTip.x} y2={xTip.y} stroke="#ef4444" strokeWidth={2.5} />
                    {arrowHead(xTip, origin, '#ef4444')}
                    <text x={xTip.x + 10} y={xTip.y + 4} fill="#ef4444" fontSize="14" fontWeight="bold">X</text>
                    
                    {/* Y axis (green) */}
                    <line x1={origin.x} y1={origin.y} x2={yTip.x} y2={yTip.y} stroke="#22c55e" strokeWidth={2.5} />
                    {arrowHead(yTip, origin, '#22c55e')}
                    <text x={yTip.x - 20} y={yTip.y + 4} fill="#22c55e" fontSize="14" fontWeight="bold">Y</text>
                    
                    {/* Z axis (blue, pointing up) */}
                    <line x1={origin.x} y1={origin.y} x2={zTip.x} y2={zTip.y} stroke="#3b82f6" strokeWidth={2.5} />
                    {arrowHead(zTip, origin, '#3b82f6')}
                    <text x={zTip.x + 8} y={zTip.y + 4} fill="#3b82f6" fontSize="14" fontWeight="bold">Z</text>
                    
                    {/* Origin dot */}
                    <circle cx={origin.x} cy={origin.y} r={4} fill="#f8fafc" stroke="#475569" strokeWidth={1.5} />
                    <text x={origin.x - 18} y={origin.y + 16} fill="#94a3b8" fontSize="10" fontWeight="500">O (0,0,0)</text>
                    
                    {/* Grid scale labels on X axis */}
                    {[100, 200, 300, 400].map(v => {
                      const p = isoProject(v, 0, 0);
                      return <text key={`xl-${v}`} x={p.x} y={p.y + 16} textAnchor="middle" fill="#64748b" fontSize="9">{v}</text>;
                    })}
                    {/* Grid scale labels on Y axis */}
                    {[100, 200, 300, 400].map(v => {
                      const p = isoProject(0, v, 0);
                      return <text key={`yl-${v}`} x={p.x} y={p.y + 16} textAnchor="middle" fill="#64748b" fontSize="9">{v}</text>;
                    })}
                    {/* Grid scale labels on Z axis */}
                    {[100, 200, 300].map(v => {
                      const p = isoProject(0, 0, v);
                      return <text key={`zl-${v}`} x={p.x - 14} y={p.y + 4} textAnchor="end" fill="#64748b" fontSize="9">{v}</text>;
                    })}
                  </g>
                );
              })()}
              
              {/* Product isometric 3D cube - moved below, rendered after mechanisms */}
              
              {/* Connection lines between cameras and mounted mechanisms */}
              {objects.filter(obj => obj.type === 'camera' && obj.mountedToMechanismId).map(cam => {
                const mech = objects.find(o => o.id === cam.mountedToMechanismId);
                if (!mech) return null;
                return (
                  <g key={`conn-${cam.id}`}>
                    <line
                      x1={cam.x}
                      y1={cam.y}
                      x2={mech.x}
                      y2={mech.y}
                      stroke="#3b82f6"
                      strokeWidth={2}
                      strokeDasharray="8 4"
                      opacity={0.6}
                    />
                    <circle cx={cam.x} cy={cam.y} r={4} fill="#3b82f6" opacity={0.8} />
                    <circle cx={mech.x} cy={mech.y} r={4} fill="#ea580c" opacity={0.8} />
                    {/* Link icon at midpoint */}
                    <text
                      x={(cam.x + mech.x) / 2}
                      y={(cam.y + mech.y) / 2 - 6}
                      textAnchor="middle"
                      fontSize="12"
                      style={{ pointerEvents: 'none' }}
                    >🔗</text>
                  </g>
                );
              })}
              
              {/* Connection lines between products and mounted mechanisms */}
              {objects.filter(obj => obj.type === 'product' && obj.mountedToMechanismId).map(prod => {
                const mech = objects.find(o => o.id === prod.mountedToMechanismId);
                if (!mech) return null;
                return (
                  <g key={`conn-product-${prod.id}`}>
                    <line
                      x1={prod.x}
                      y1={prod.y}
                      x2={mech.x}
                      y2={mech.y}
                      stroke="#22c55e"
                      strokeWidth={2}
                      strokeDasharray="8 4"
                      opacity={0.6}
                    />
                    <circle cx={prod.x} cy={prod.y} r={4} fill="#06b6d4" opacity={0.8} />
                    <circle cx={mech.x} cy={mech.y} r={4} fill="#ea580c" opacity={0.8} />
                    <text
                      x={(prod.x + mech.x) / 2}
                      y={(prod.y + mech.y) / 2 - 6}
                      textAnchor="middle"
                      fontSize="12"
                      style={{ pointerEvents: 'none' }}
                    >📦</text>
                  </g>
                );
              })}

              {/* Draggable objects: render mechanisms first, then products on top, then cameras on top */}
              {/* Mechanism objects */}
              {objects.filter(obj => obj.type === 'mechanism').map(obj => {
                const isSelected = obj.id === selectedId;
                const isSecondSelected = obj.id === secondSelectedId;
                const mechImage = getMechanismImageForObject(obj);
                
                return (
                  <g 
                    key={obj.id}
                    transform={`translate(${obj.x}, ${obj.y}) rotate(${obj.rotation})`}
                    onMouseDown={(e) => handleMouseDown(e, obj)}
                    style={{ cursor: obj.locked ? 'not-allowed' : panMode ? 'inherit' : 'move' }}
                    filter={isSelected ? "url(#glow)" : "url(#drop-shadow)"}
                  >
                    {(isSelected || isSecondSelected) && (
                      <rect
                        x={-obj.width / 2 - 6}
                        y={-obj.height / 2 - 6}
                        width={obj.width + 12}
                        height={obj.height + 12}
                        fill="none"
                        stroke={isSecondSelected ? '#22c55e' : '#60a5fa'}
                        strokeWidth="2"
                        strokeDasharray="6 3"
                        rx={8}
                        className="animate-pulse"
                      />
                    )}
                    
                    {mechImage ? (
                      <>
                        <rect
                          x={-obj.width / 2 - 2}
                          y={-obj.height / 2 - 2}
                          width={obj.width + 4}
                          height={obj.height + 4}
                          fill="rgba(30, 41, 59, 0.9)"
                          stroke={isSelected ? '#fb923c' : '#ea580c'}
                          strokeWidth={isSelected ? 3 : 2}
                          rx={6}
                        />
                        <image
                          href={mechImage}
                          x={-obj.width / 2}
                          y={-obj.height / 2}
                          width={obj.width}
                          height={obj.height}
                          preserveAspectRatio="xMidYMid meet"
                          style={{ pointerEvents: 'none' }}
                        />
                      </>
                    ) : (
                      <rect
                        x={-obj.width / 2}
                        y={-obj.height / 2}
                        width={obj.width}
                        height={obj.height}
                        fill={isSelected ? 'url(#mech-grad)' : '#ea580c'}
                        stroke={isSelected ? '#fdba74' : '#c2410c'}
                        strokeWidth={isSelected ? 3 : 2}
                        rx={6}
                      />
                    )}
                    <rect x={-obj.width / 2} y={obj.height / 2 + 4} width={obj.width} height={18} rx={4} fill="rgba(30, 41, 59, 0.95)" />
                    <text x={0} y={obj.height / 2 + 16} textAnchor="middle" fill="#fdba74" fontSize="10" fontWeight="600">
                      {obj.name}
                    </text>
                    
                    {obj.locked && (
                      <g transform={`translate(${obj.width / 2 - 6}, ${-obj.height / 2 - 6})`}>
                        <circle r={10} fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />
                        <Lock x={-5} y={-5} width={10} height={10} className="text-amber-400" />
                      </g>
                    )}
                    
                    {isSelected && obj.rotation !== 0 && (
                      <text x={obj.width / 2 + 8} y={0} fill="#94a3b8" fontSize="9">
                        {obj.rotation}°
                      </text>
                    )}
                    
                    <ResizeHandles
                      object={obj}
                      isSelected={isSelected}
                      onResize={handleResize}
                    />
                  </g>
                );
              })}

              {/* Product isometric 3D cube - rendered AFTER mechanisms so it appears on top */}
              {isIsometric && (() => {
                const productObj = objects.find(o => o.type === 'product');
                const isMounted = !!productObj?.mountedToMechanismId;
                const parentMech = isMounted ? objects.find(o => o.id === productObj?.mountedToMechanismId) : null;
                
                // If mounted, position product on top of the mechanism's 3D position
                const pPosX = isMounted && parentMech ? (parentMech.posX ?? 0) : (productObj?.posX ?? 0);
                const pPosY = isMounted && parentMech ? (parentMech.posY ?? 0) : (productObj?.posY ?? 0);
                const mechHeight = isMounted && parentMech ? (parentMech.depth ?? 80) : 0;
                const pPosZ = isMounted && parentMech ? (parentMech.posZ ?? 0) + mechHeight / 2 + productDimensions.height / 2 : (productObj?.posZ ?? 0);
                
                const hL = productDimensions.length / 2;
                const hW = productDimensions.width / 2;
                const hH = productDimensions.height / 2;
                const p = (x: number, y: number, z: number) => isoProject(pPosX + x, pPosY + y, pPosZ + z);
                const t0 = p(-hL, -hW, hH);
                const t1 = p(hL, -hW, hH);
                const t2 = p(hL, hW, hH);
                const t3 = p(-hL, hW, hH);
                const b0 = p(-hL, -hW, -hH);
                const b1 = p(hL, -hW, -hH);
                const b2 = p(hL, hW, -hH);
                const b3 = p(-hL, hW, -hH);
                
                const topFace = `${t0.x},${t0.y} ${t1.x},${t1.y} ${t2.x},${t2.y} ${t3.x},${t3.y}`;
                const frontFace = `${t0.x},${t0.y} ${t1.x},${t1.y} ${b1.x},${b1.y} ${b0.x},${b0.y}`;
                const rightFace = `${t1.x},${t1.y} ${t2.x},${t2.y} ${b2.x},${b2.y} ${b1.x},${b1.y}`;
                const leftFace = `${t0.x},${t0.y} ${t3.x},${t3.y} ${b3.x},${b3.y} ${b0.x},${b0.y}`;
                
                // Colors: mounted = green, unmounted = cyan
                const fillLeft = isMounted ? '#15803d' : '#0891b2';
                const fillFront = isMounted ? '#16a34a' : '#06b6d4';
                const fillRight = isMounted ? '#166534' : '#0e7490';
                const fillTop = isMounted ? '#4ade80' : '#67e8f9';
                const strokeColor = isMounted ? '#22c55e' : '#22d3ee';
                const textColor = isMounted ? '#bbf7d0' : '#e0f2fe';
                const labelColor = isMounted ? '#86efac' : '#94a3b8';
                
                // Connection line from product to mounted mechanism in isometric view
                const connectionLine = isMounted && parentMech ? (() => {
                  const prodCenter = isoProject(pPosX, pPosY, pPosZ);
                  const mechCenter = isoProject(parentMech.posX ?? 0, parentMech.posY ?? 0, parentMech.posZ ?? 0);
                  return (
                    <g>
                      <line
                        x1={prodCenter.x} y1={prodCenter.y}
                        x2={mechCenter.x} y2={mechCenter.y}
                        stroke="#22c55e" strokeWidth={2} strokeDasharray="6 3" opacity={0.5}
                      />
                      <circle cx={mechCenter.x} cy={mechCenter.y} r={3} fill="#ea580c" opacity={0.8} />
                    </g>
                  );
                })() : null;
                
                return (
                  <g opacity={isMounted ? 0.7 : 1}>
                    {connectionLine}
                    <g filter="url(#drop-shadow)">
                      <polygon points={leftFace} fill={fillLeft} fillOpacity="0.3" stroke={strokeColor} strokeWidth="1" strokeDasharray="4 2" />
                      <polygon points={frontFace} fill={fillFront} fillOpacity="0.5" stroke={strokeColor} strokeWidth="2" />
                      <polygon points={rightFace} fill={fillRight} fillOpacity="0.5" stroke={strokeColor} strokeWidth="2" />
                      <polygon points={topFace} fill={fillTop} fillOpacity="0.4" stroke={strokeColor} strokeWidth="2" />
                      <text x={(t0.x + t1.x + b1.x + b0.x) / 4} y={(t0.y + t1.y + b1.y + b0.y) / 4 + 4} textAnchor="middle" fill={textColor} fontSize="10" fontWeight="500" opacity="0.8">正面</text>
                      <text x={(t1.x + t2.x + b2.x + b1.x) / 4} y={(t1.y + t2.y + b2.y + b1.y) / 4 + 4} textAnchor="middle" fill={textColor} fontSize="10" fontWeight="500" opacity="0.8">侧面</text>
                      <text x={(t0.x + t1.x + t2.x + t3.x) / 4} y={(t0.y + t1.y + t2.y + t3.y) / 4 + 4} textAnchor="middle" fill={textColor} fontSize="10" fontWeight="500" opacity="0.8">顶面</text>
                      <text
                        x={(t0.x + t1.x + t2.x + t3.x) / 4}
                        y={Math.max(b0.y, b1.y, b2.y) + 25}
                        textAnchor="middle"
                        fill={labelColor}
                        fontSize="11"
                      >
                        {isMounted ? '📦 ' : ''}产品 {productDimensions.length}×{productDimensions.width}×{productDimensions.height}mm
                      </text>
                    </g>
                  </g>
                );
              })()}

              {/* Product objects rendered on top of mechanisms, with mounted styling */}
              {!isIsometric && objects.filter(obj => obj.type === 'product').map(obj => {
                const isSelected = obj.id === selectedId;
                const isSecondSelected = obj.id === secondSelectedId;
                const isMounted = !!obj.mountedToMechanismId;
                const pW = currentView === 'side' ? productD : productW;
                const pH = currentView === 'top' ? productD : productH;
                
                return (
                  <g 
                    key={obj.id}
                    transform={`translate(${obj.x}, ${obj.y}) rotate(${obj.rotation})`}
                    onMouseDown={(e) => handleMouseDown(e, obj)}
                    style={{ cursor: obj.locked ? 'not-allowed' : panMode ? 'inherit' : 'move' }}
                    filter={isSelected ? "url(#glow)" : "url(#drop-shadow)"}
                    opacity={isMounted ? 0.7 : 1}
                  >
                    {(isSelected || isSecondSelected) && (
                      <rect
                        x={-pW / 2 - 6}
                        y={-pH / 2 - 6}
                        width={pW + 12}
                        height={pH + 12}
                        fill="none"
                        stroke={isMounted ? '#22c55e' : '#22d3ee'}
                        strokeWidth="2"
                        strokeDasharray="6 3"
                        rx={8}
                        className="animate-pulse"
                      />
                    )}
                    <rect
                      x={-pW / 2}
                      y={-pH / 2}
                      width={pW}
                      height={pH}
                      fill={isMounted ? '#16a34a' : 'url(#product-grad)'}
                      stroke={isMounted ? '#22c55e' : '#22d3ee'}
                      strokeWidth={isSelected ? 3 : 2}
                      rx={6}
                    />
                    {/* Cross-hair */}
                    <line x1={-15} y1={0} x2={15} y2={0} stroke="#fff" strokeWidth="1" opacity="0.5" />
                    <line x1={0} y1={-15} x2={0} y2={15} stroke="#fff" strokeWidth="1" opacity="0.5" />
                    <circle cx={0} cy={0} r={4} fill="#fff" opacity="0.7" />
                    
                    {/* Label */}
                    <text
                      x={0}
                      y={pH / 2 + 20}
                      textAnchor="middle"
                      fill={isMounted ? '#86efac' : '#94a3b8'}
                      fontSize="11"
                    >
                      {isMounted ? '📦 ' : ''}产品 {productDimensions.length}×{productDimensions.width}×{productDimensions.height}mm
                    </text>
                    
                    <ResizeHandles
                      object={{ ...obj, width: pW, height: pH }}
                      isSelected={isSelected}
                      onResize={handleResize}
                    />
                  </g>
                );
              })}

              {/* Cameras rendered on top layer, with semi-transparency when mounted */}
              {objects.filter(obj => obj.type === 'camera').map(obj => {
                const isSelected = obj.id === selectedId;
                const isSecondSelected = obj.id === secondSelectedId;
                const isMounted = !!(obj as any).mountedToMechanismId;
                
                return (
                  <g 
                    key={obj.id}
                    transform={`translate(${obj.x}, ${obj.y}) rotate(${obj.rotation})`}
                    onMouseDown={(e) => handleMouseDown(e, obj)}
                    style={{ cursor: obj.locked ? 'not-allowed' : panMode ? 'inherit' : 'move' }}
                    filter={isSelected ? "url(#glow)" : "url(#drop-shadow)"}
                    opacity={isMounted ? 0.7 : 1}
                  >
                    {/* Selection outline */}
                    {(isSelected || isSecondSelected) && (
                      <rect
                        x={-obj.width / 2 - 6}
                        y={-obj.height / 2 - 6}
                        width={obj.width + 12}
                        height={obj.height + 12}
                        fill="none"
                        stroke={isSecondSelected ? '#22c55e' : '#60a5fa'}
                        strokeWidth="2"
                        strokeDasharray="6 3"
                        rx={8}
                        className="animate-pulse"
                      />
                    )}
                    
                    {/* Camera body - green when mounted, blue when free */}
                    <rect
                      x={-obj.width / 2}
                      y={-obj.height / 2}
                      width={obj.width}
                      height={obj.height}
                      fill={isSelected ? 'url(#camera-grad)' : (isMounted ? '#16a34a' : '#2563eb')}
                      stroke={isSelected ? '#93c5fd' : (isMounted ? '#22c55e' : '#3b82f6')}
                      strokeWidth={isSelected ? 3 : 2}
                      rx={6}
                    />
                    {/* Camera lens circle */}
                    <circle
                      cx={0}
                      cy={-4}
                      r={Math.min(obj.width, obj.height) * 0.22}
                      fill="rgba(0,0,0,0.4)"
                      stroke={isMounted ? '#4ade80' : '#93c5fd'}
                      strokeWidth={2}
                    />
                    <circle
                      cx={0}
                      cy={-4}
                      r={Math.min(obj.width, obj.height) * 0.12}
                      fill={isMounted ? '#4ade80' : '#60a5fa'}
                      opacity={0.8}
                    />
                    {/* Camera name label */}
                    <rect x={-obj.width / 2} y={obj.height / 2 + 4} width={obj.width} height={18} rx={4} fill="rgba(30, 41, 59, 0.95)" />
                    <text x={0} y={obj.height / 2 + 16} textAnchor="middle" fill={isMounted ? '#86efac' : '#93c5fd'} fontSize="10" fontWeight="600">
                      {obj.name}
                    </text>
                    
                    {/* Lock indicator */}
                    {obj.locked && (
                      <g transform={`translate(${obj.width / 2 - 6}, ${-obj.height / 2 - 6})`}>
                        <circle r={10} fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />
                        <Lock x={-5} y={-5} width={10} height={10} className="text-amber-400" />
                      </g>
                    )}
                    
                    {/* Rotation indicator for selected */}
                    {isSelected && obj.rotation !== 0 && (
                      <text x={obj.width / 2 + 8} y={0} fill="#94a3b8" fontSize="9">
                        {obj.rotation}°
                      </text>
                    )}
                    
                    {/* Resize handles for selected object */}
                    <ResizeHandles
                      object={obj}
                      isSelected={isSelected}
                      onResize={handleResize}
                    />
                  </g>
                );
              })}

              {isDragging && draggingObject && smartSnapEnabled && (
                <AlignmentGuides
                  objects={objects}
                  draggingObject={draggingObject}
                  centerX={centerX}
                  centerY={centerY}
                  snapThreshold={15}
                />
              )}
              
              {/* Coordinate system with axes and rulers - hidden in isometric */}
              {!isIsometric && (
                <CoordinateSystem
                  centerX={centerX}
                  centerY={centerY}
                  canvasWidth={canvasWidth}
                  canvasHeight={canvasHeight}
                  scale={scale}
                  currentView={currentView as StandardViewType}
                  gridSize={gridSize}
                />
              )}
              
              
              {/* Camera mount points - show when dragging a camera */}
              {isDragging && !isIsometric && draggingObject?.type === 'camera' && objects
                .filter(o => o.type === 'mechanism' && CAMERA_INTERACTION_TYPES.includes(o.mechanismType || ''))
                .map(mech => (
                <g key={`mount-${mech.id}`} transform={`translate(${mech.x}, ${mech.y})`}>
                  <CameraMountPoints
                    mechanismObject={mech}
                    currentView={currentView as StandardViewType}
                    cameras={objects.filter(o => o.type === 'camera')}
                    onSnapCamera={(cameraId, mountPoint, mechanismId) => {
                      const mp = getMountPointWorldPosition(mech, mountPoint.id, currentView as StandardViewType);
                      if (mp) {
                        updateObject(cameraId, {
                          x: mp.x,
                          y: mp.y,
                          mountedToMechanismId: mechanismId,
                          mountPointId: mountPoint.id,
                        });
                      }
                    }}
                    draggingCameraId={draggingObject.id}
                    scale={scale}
                  />
                </g>
              ))}
              
              {/* Product mount points - show when dragging a product */}
              {isDragging && !isIsometric && draggingObject?.type === 'product' && objects
                .filter(o => o.type === 'mechanism' && PRODUCT_INTERACTION_TYPES.includes(o.mechanismType || ''))
                .map(mech => (
                <g key={`product-mount-${mech.id}`} transform={`translate(${mech.x}, ${mech.y})`}>
                  <ProductMountPoints
                    mechanismObject={mech}
                    currentView={currentView as StandardViewType}
                    productObject={draggingObject}
                    draggingProductId={draggingObject.id}
                    scale={scale}
                  />
                </g>
              ))}

              {/* Operation hints moved to viewport-fixed overlay below */}
            </svg>
          </ContextMenuTrigger>
          
          <ContextMenuContent className="w-48">
            <ContextMenuItem onClick={addCamera} className="gap-2">
              <Camera className="h-4 w-4" />
              添加相机
            </ContextMenuItem>
            <ContextMenuSeparator />
            {selectedId && (
              <>
                <ContextMenuItem onClick={() => duplicateObject(selectedId)} className="gap-2">
                  <Copy className="h-4 w-4" />
                  复制对象
                </ContextMenuItem>
                <ContextMenuItem 
                  onClick={() => updateObject(selectedId, { locked: !selectedObj?.locked })}
                  className="gap-2"
                >
                  {selectedObj?.locked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  {selectedObj?.locked ? '解锁' : '锁定'}
                </ContextMenuItem>
                <ContextMenuItem 
                  onClick={() => deleteObject(selectedId)}
                  className="gap-2 text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  删除
                </ContextMenuItem>
                <ContextMenuSeparator />
              </>
            )}
            <ContextMenuItem onClick={fitToScreen} className="gap-2">
              <Crosshair className="h-4 w-4" />
              适应屏幕
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
        
        {/* Viewport-fixed HUD overlays */}

        {/* Bottom-right: Legend */}
        <div className="absolute bottom-20 right-4 pointer-events-none z-10">
          <div className="bg-slate-800/90 rounded-lg px-3 py-2.5 border border-slate-600/30">
            <div className="text-[11px] text-slate-400 font-semibold mb-1.5">图例说明</div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3.5 h-3.5 rounded-sm bg-blue-600 border border-blue-500" />
              <span className="text-[10px] text-slate-300">相机（未吸附）</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3.5 h-3.5 rounded-sm bg-green-600 border border-green-500 opacity-70" />
              <span className="text-[10px] text-slate-300">相机（已吸附）</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3.5 h-3.5 rounded-sm bg-amber-600 border border-amber-500" />
              <span className="text-[10px] text-slate-300">执行机构</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3.5 h-3.5 rounded-sm bg-cyan-600 border border-cyan-500" />
              <span className="text-[10px] text-slate-300">产品（未吸附）</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-sm bg-cyan-600 border border-green-500" />
              <span className="text-[10px] text-slate-300">产品（已吸附）</span>
            </div>
          </div>
        </div>

        {/* Bottom-right: Plane indicator */}
        <div className="absolute bottom-4 right-4 pointer-events-none z-10">
          <div className="bg-slate-800/95 rounded-lg px-4 py-2 border border-slate-600/30 text-center">
            <div className="text-[11px] text-slate-400">当前平面</div>
            <div className="text-sm font-semibold text-white">
              {currentView === 'front' ? 'X-Z' : currentView === 'side' ? 'Y-Z' : currentView === 'isometric' ? '等轴测' : 'X-Y'}
            </div>
          </div>
        </div>

        {/* Isometric read-only badge */}
        {isIsometric && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <div className="bg-violet-600/90 text-white text-xs font-semibold px-4 py-1.5 rounded-full border border-violet-400/40 shadow-lg">
              🔒 只读预览 — 切换到三视图进行编辑
            </div>
          </div>
        )}
        
        {/* Object List Panel */}
        {showObjectList && (
          <ObjectListPanel
            objects={objects.filter(o => !hiddenIds.has(o.id) || selectedIds.includes(o.id))}
            selectedIds={selectedIds}
            onSelectObject={handleSelectObject}
            onToggleVisibility={toggleObjectVisibility}
            onToggleLock={toggleObjectLock}
            onFocusObject={focusObject}
            onDeleteObject={deleteObject}
            onDuplicateObject={duplicateObject}
            onReorderObject={reorderObject}
            onAutoArrange={autoArrangeObjects}
            onSelectAll={selectAllObjects}
            onDeselectAll={deselectAllObjects}
            hiddenIds={hiddenIds}
            centerX={centerX}
            centerY={centerY}
            scale={scale}
            currentView={currentView as StandardViewType}
          />
        )}
        
        {/* Property Panel */}
        {showPropertyPanel && selectedObj && (
          <ObjectPropertyPanel
            object={selectedObj}
            onUpdate={updateObject}
            onDelete={deleteObject}
            onClose={() => {
              setShowPropertyPanel(false);
              setSelectedIds([]);
            }}
            scale={scale}
            canvasCenter={{ x: centerX, y: centerY }}
            currentView={currentView as StandardViewType}
            allObjects={objects}
          />
        )}
        
        {/* Zoom Controls */}
        <CanvasControls
          zoom={zoom}
          onZoomChange={setZoom}
          onFitToScreen={fitToScreen}
          onResetView={resetView}
          panMode={panMode}
          onPanModeChange={setPanMode}
        />
      </div>
    </div>
  );
}
