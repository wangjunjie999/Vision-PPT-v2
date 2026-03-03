/**
 * Per-Workstation Slide Generators
 * Generates slides in the correct order as specified:
 * 0. Workstation Title (DB号 + 工位名 + 负责人)
 * 1. Basic Information (基本信息)
 * 2. Product Schematic (产品示意图)
 * 3. Technical Requirements (技术要求)
 * 4. Mechanical Layout Three Views (机械布局三视图 - 等比例)
 * 5. Schematic Diagram (示意图/布置图)
 * 6. Motion / Detection Method (运动/检测方式)
 * 7. Optical Solution (光学方案)
 * 8. Measurement & Vision List (测量方法及视觉清单)
 * 9. BOM List & Review (BOM清单及审核)
 */

import type PptxGenJS from 'pptxgenjs';
import { fetchImageAsDataUri } from './imagePreloader';
import { calculateContainFit, getImageDimensions, calculateThreeViewLayout } from './imageLayoutUtils';
import { 
  COLORS, 
  SLIDE_LAYOUT, 
  MODULE_TYPE_LABELS, 
  WS_TYPE_LABELS, 
  TRIGGER_LABELS,
  PROCESS_STAGE_LABELS 
} from './slideLabels';
import { 
  MECHANISM_LABELS, 
  CAMERA_MOUNT_LABELS, 
  getLabel 
} from '@/services/labelMaps';

// Type definitions
type TableCell = { text: string; options?: Record<string, unknown> };
type TableRow = TableCell[];

const cell = (text: string, opts?: Partial<TableCell>): TableCell => ({ text, options: opts });
const row = (cells: string[]): TableRow => cells.map(t => cell(t));

// ===== Hardware Data Types for Complete Info =====
interface FullCameraData {
  id: string;
  brand: string;
  model: string;
  resolution?: string | null;
  sensor_size?: string | null;
  interface?: string | null;
  frame_rate?: number | null;
  image_url?: string | null;
}

interface FullLensData {
  id: string;
  brand: string;
  model: string;
  focal_length?: string | null;
  aperture?: string | null;
  mount?: string | null;
  image_url?: string | null;
}

interface FullLightData {
  id: string;
  brand: string;
  model: string;
  type?: string | null;
  color?: string | null;
  power?: string | null;
  image_url?: string | null;
}

interface FullControllerData {
  id: string;
  brand: string;
  model: string;
  cpu?: string | null;
  gpu?: string | null;
  memory?: string | null;
  storage?: string | null;
  image_url?: string | null;
}

/**
 * Add image placeholder with emoji indicator
 * Used when image fails to load or is missing
 */
function addImagePlaceholder(
  slide: ReturnType<PptxGenJS['addSlide']>,
  container: { x: number; y: number; width: number; height: number },
  message: string,
  emoji: string
): void {
  slide.addShape('rect', {
    x: container.x, 
    y: container.y, 
    w: container.width, 
    h: container.height,
    fill: { color: COLORS.border },
  });
  slide.addText(`${emoji} ${message}`, {
    x: container.x, 
    y: container.y + container.height / 2 - 0.15,
    w: container.width, 
    h: 0.3,
    fontSize: 9, 
    color: COLORS.secondary, 
    align: 'center',
  });
}

/**
 * Unified slide title with Tech-Shine corporate style
 * Deep blue accent bar on left + dark gray text
 */
function addSlideTitle(
  slide: ReturnType<PptxGenJS['addSlide']>,
  ctx: SlideContext,
  subtitle: string
): void {
  // Title text overlaid on the navy header bar (white text, matches master deep blue bar)
  slide.addText(`${ctx.wsCode} ${ctx.wsName} - ${subtitle}`, {
    x: 0.4, y: 0.05, w: 7.5, h: 0.38,
    fontSize: 16, color: COLORS.white, bold: true,
  });
}

interface SlideContext {
  pptx: PptxGenJS;
  isZh: boolean;
  wsCode: string;
  wsName: string;
  responsible: string | null;
}

interface WorkstationSlideData {
  ws: {
    id: string;
    name: string;
    type: string;
    cycle_time: number | null;
    product_dimensions: { length: number; width: number; height: number } | null;
    enclosed: boolean | null;
    process_stage?: string | null;
    observation_target?: string | null;
    acceptance_criteria?: { accuracy?: string; cycle_time?: string; compatible_sizes?: string } | null;
    motion_description?: string | null;
    shot_count?: number | null;
    risk_notes?: string | null;
    action_script?: string | null;
    description?: string | null;
  };
  layout: {
    workstation_id: string;
    conveyor_type: string | null;
    camera_count: number | null;
    camera_mounts: string[] | null;
    mechanisms: string[] | null;
    front_view_image_url?: string | null;
    side_view_image_url?: string | null;
    top_view_image_url?: string | null;
    width?: number | null;
    height?: number | null;
    depth?: number | null;
    selected_cameras?: Array<{ id: string; brand: string; model: string; image_url?: string | null }> | null;
    selected_lenses?: Array<{ id: string; brand: string; model: string; image_url?: string | null }> | null;
    selected_lights?: Array<{ id: string; brand: string; model: string; image_url?: string | null }> | null;
    selected_controller?: { id: string; brand: string; model: string; image_url?: string | null } | null;
  } | null;
  modules: Array<{
    id: string;
    name: string;
    type: string;
    description?: string | null;
    trigger_type: string | null;
    processing_time_limit: number | null;
    schematic_image_url?: string | null;
    positioning_config?: Record<string, unknown> | null;
    defect_config?: Record<string, unknown> | null;
    measurement_config?: Record<string, unknown> | null;
    ocr_config?: Record<string, unknown> | null;
    deep_learning_config?: Record<string, unknown> | null;
    output_types?: string[] | null;
    roi_strategy?: string | null;
  }>;
  annotation?: {
    snapshot_url: string;
    annotations_json: Array<{ labelNumber?: number; label?: string; number?: number; name?: string; category?: string; description?: string }>;
    remark?: string | null;
  };
  productAsset?: {
    preview_images: Array<{ url: string; name?: string }> | null;
    detection_method?: string | null;
    product_models?: Array<{ name: string; spec: string }> | null;
    detection_requirements?: Array<{ content: string; highlight?: string | null }> | null;
  };
  // NEW: Complete hardware data for detailed parameters
  hardware?: {
    cameras: FullCameraData[];
    lenses: FullLensData[];
    lights: FullLightData[];
    controllers: FullControllerData[];
  };
}

export type { WorkstationSlideData, FullCameraData, FullLensData, FullLightData, FullControllerData };

/**
 * Slide 0: Workstation Title
 * DB号 + 工位名 + 负责人
 * Tech-Shine corporate style: Clean with orange accent
 */
export function generateWorkstationTitleSlide(
  ctx: SlideContext,
  _data: WorkstationSlideData
): void {
  const slide = ctx.pptx.addSlide({ masterName: 'MASTER_SLIDE' });
  
  // Large title with workstation code - using primary orange color
  slide.addText(ctx.wsCode, {
    x: 0.5, y: 1.6, w: 9, h: 0.6,
    fontSize: 36, color: COLORS.primary, bold: true, align: 'center',
  });
  
  // Workstation name - dark text
  slide.addText(ctx.wsName, {
    x: 0.5, y: 2.3, w: 9, h: 0.5,
    fontSize: 24, color: COLORS.dark, bold: true, align: 'center',
  });
  
  // Responsible person - secondary gray
  if (ctx.responsible) {
    slide.addText(`${ctx.isZh ? '负责人' : 'Responsible'}: ${ctx.responsible}`, {
      x: 0.5, y: 3.0, w: 9, h: 0.4,
      fontSize: 14, color: COLORS.secondary, align: 'center',
    });
  }
  
  // Decorative elements - orange accent line
  slide.addShape('rect', {
    x: 4, y: 3.6, w: 2, h: 0.04,
    fill: { color: COLORS.primary },
  });
  
  // Subtle side decorations (optional - adds visual interest)
  slide.addShape('rect', {
    x: 0, y: 1.4, w: 0.08, h: 1.6,
    fill: { color: COLORS.primary },
  });
}

/**
 * Slide 1: Basic Information (基本信息)
 */
export function generateBasicInfoSlide(
  ctx: SlideContext,
  data: WorkstationSlideData
): void {
  const slide = ctx.pptx.addSlide({ masterName: 'MASTER_SLIDE' });
  const { ws, layout, modules } = data;
  
  addSlideTitle(slide, ctx, ctx.isZh ? '基本信息' : 'Basic Info');

  // Workstation description (NEW - shows workstation description if available)
  if (ws.description) {
    slide.addText(ctx.isZh ? '【工位描述】' : '[Workstation Description]', {
      x: 0.5, y: 1.1, w: 9, h: 0.25,
      fontSize: 10, color: COLORS.secondary, bold: true,
    });
    slide.addText(ws.description, {
      x: 0.5, y: 1.38, w: 9, h: 0.35,
      fontSize: 9, color: COLORS.dark,
    });
  }

  const startY = ws.description ? 1.8 : 1.2;

  // Detection method summary
  const detectionMethods = modules.map(m => {
    const typeLabel = MODULE_TYPE_LABELS[m.type]?.[ctx.isZh ? 'zh' : 'en'] || m.type;
    return typeLabel;
  });
  const cameraCount = layout?.camera_count || modules.length;
  const methodSummary = `${cameraCount}${ctx.isZh ? '相机' : ' cameras'} - ${detectionMethods.join('/')}`;
  
  slide.addText(ctx.isZh ? '【检测方式】' : '[Detection Method]', {
    x: 0.5, y: startY, w: 9, h: 0.25,
    fontSize: 11, color: COLORS.primary, bold: true,
  });
  slide.addText(methodSummary, {
    x: 0.5, y: startY + 0.28, w: 9, h: 0.25,
    fontSize: 11, color: COLORS.dark,
  });

  // Compatible sizes / Key dimensions
  const dims = ws.product_dimensions;
  slide.addText(ctx.isZh ? '【兼容/蓝本尺寸】' : '[Compatible/Model Dimensions]', {
    x: 0.5, y: startY + 0.65, w: 4.3, h: 0.25,
    fontSize: 11, color: COLORS.primary, bold: true,
  });
  slide.addText(dims ? `${dims.length} × ${dims.width} × ${dims.height} mm` : '-', {
    x: 0.5, y: startY + 0.93, w: 4.3, h: 0.25,
    fontSize: 10, color: COLORS.dark,
  });

  // Detection requirements (show module names)
  slide.addText(ctx.isZh ? '【检测要求】' : '[Detection Requirements]', {
    x: 5, y: startY + 0.65, w: 4.5, h: 0.25,
    fontSize: 11, color: COLORS.primary, bold: true,
  });
  const moduleNames = modules.map(m => m.name).join('、');
  const detectionReq = moduleNames || detectionMethods.join('、') || (ws.observation_target || '-');
  slide.addText(detectionReq, {
    x: 5, y: startY + 0.93, w: 4.5, h: 0.25,
    fontSize: 10, color: COLORS.dark,
  });

  // Precision/Resolution/Pixels
  const accuracy = ws.acceptance_criteria?.accuracy || '±0.1mm';
  slide.addText(ctx.isZh ? '【精度/分辨率/像素】' : '[Accuracy/Resolution/Pixels]', {
    x: 0.5, y: startY + 1.3, w: 4.3, h: 0.25,
    fontSize: 11, color: COLORS.primary, bold: true,
  });
  slide.addText(accuracy, {
    x: 0.5, y: startY + 1.58, w: 4.3, h: 0.25,
    fontSize: 10, color: COLORS.dark,
  });

  // Cycle time
  slide.addText(ctx.isZh ? '【节拍】' : '[Cycle Time]', {
    x: 5, y: startY + 1.3, w: 4.5, h: 0.25,
    fontSize: 11, color: COLORS.primary, bold: true,
  });
  slide.addText(ws.cycle_time ? `${ws.cycle_time} s/pcs` : '-', {
    x: 5, y: startY + 1.58, w: 4.5, h: 0.25,
    fontSize: 10, color: COLORS.dark,
  });

  // Key notes
  slide.addText(ctx.isZh ? '【关键备注】' : '[Key Notes]', {
    x: 0.5, y: startY + 2.0, w: 9, h: 0.25,
    fontSize: 11, color: COLORS.warning, bold: true,
  });
  
  const notes = ws.risk_notes || (ctx.isZh 
    ? '• 精度需以实际样品验证\n• 视野评估需现场确认' 
    : '• Accuracy to be verified with samples\n• FOV evaluation on-site');
  
  slide.addShape('rect', {
    x: 0.5, y: startY + 2.28, w: 9, h: 0.95,
    fill: { color: 'FFF8E1' },
    line: { color: COLORS.warning, width: 0.5 },
  });
  slide.addText(notes, {
    x: 0.7, y: startY + 2.35, w: 8.6, h: 0.8,
    fontSize: 9, color: COLORS.dark,
  });
}

/**
 * Slide 2: Product Schematic (产品示意图)
 */
export async function generateProductSchematicSlide(
  ctx: SlideContext,
  data: WorkstationSlideData
): Promise<void> {
  const slide = ctx.pptx.addSlide({ masterName: 'MASTER_SLIDE' });
  const { annotation, productAsset } = data;
  
  addSlideTitle(slide, ctx, ctx.isZh ? '产品示意图' : 'Product Schematic');

  // Main image area
  const imageUrl = annotation?.snapshot_url || productAsset?.preview_images?.[0]?.url;
  
  if (imageUrl) {
    try {
      const dataUri = await fetchImageAsDataUri(imageUrl);
      if (dataUri) {
        // Calculate proportional fit
        const dims = await getImageDimensions(dataUri).catch(() => ({ width: 800, height: 600 }));
        const fit = calculateContainFit(dims.width, dims.height, {
          x: 0.5, y: 1.2, width: 5.5, height: 3.8
        });
        
        slide.addImage({
          data: dataUri,
          x: fit.x, y: fit.y, w: fit.width, h: fit.height,
        });
      }
    } catch (e) {
      slide.addShape('rect', {
        x: 0.5, y: 1.2, w: 5.5, h: 3.8,
        fill: { color: COLORS.border },
      });
      slide.addText(ctx.isZh ? '待上传产品图片' : 'Upload product image', {
        x: 0.5, y: 2.9, w: 5.5, h: 0.4,
        fontSize: 12, color: COLORS.secondary, align: 'center',
      });
    }
  } else {
    slide.addShape('rect', {
      x: 0.5, y: 1.2, w: 5.5, h: 3.8,
      fill: { color: COLORS.border },
    });
    slide.addText(ctx.isZh ? '待上传产品图片' : 'Upload product image', {
      x: 0.5, y: 2.9, w: 5.5, h: 0.4,
      fontSize: 12, color: COLORS.secondary, align: 'center',
    });
  }

  // Annotation legend (right side)
  slide.addText(ctx.isZh ? '标注说明' : 'Annotation Legend', {
    x: 6.2, y: 1.2, w: 3.3, h: 0.3,
    fontSize: 11, color: COLORS.dark, bold: true,
  });

  // Defensive array check for annotations_json
  // Support both legacy (labelNumber/label) and new (number/name/category/description) formats
  const annotItems = Array.isArray(annotation?.annotations_json) ? annotation.annotations_json : [];
  const legendRows: TableRow[] = annotItems
    .filter(item => (item.labelNumber || item.number) && (item.label || item.name))
    .map(item => {
      const num = item.labelNumber || item.number || 0;
      const label = item.label || item.name || '';
      const detail = item.category ? `[${item.category}] ${label}` : label;
      return row([`#${num}`, detail]);
    });

  if (legendRows.length > 0) {
    slide.addTable(legendRows, {
      x: 6.2, y: 1.55, w: 3.3, h: Math.min(legendRows.length * 0.32 + 0.1, 2.8),
      fontFace: 'Arial',
      fontSize: 9,
      colW: [0.6, 2.7],
      border: { pt: 0.5, color: COLORS.border },
      fill: { color: COLORS.white },
    });
  }

  if (annotation?.remark) {
    slide.addText(annotation.remark, {
      x: 6.2, y: 4.5, w: 3.3, h: 0.5,
      fontSize: 9, color: COLORS.secondary,
    });
  }
}

/**
 * Slide 3: Technical Requirements (技术要求)
 * Enhanced to show all module configuration parameters
 */
export function generateTechnicalRequirementsSlide(
  ctx: SlideContext,
  data: WorkstationSlideData
): void {
  const slide = ctx.pptx.addSlide({ masterName: 'MASTER_SLIDE' });
  const { ws, modules, productAsset } = data;
  
  addSlideTitle(slide, ctx, ctx.isZh ? '技术要求' : 'Technical Requirements');

  // Detection items with module description
  slide.addText(ctx.isZh ? '【检测项/缺陷项】' : '[Detection/Defect Items]', {
    x: 0.5, y: 1.15, w: 4.3, h: 0.25,
    fontSize: 11, color: COLORS.primary, bold: true,
  });

  const detectionItems: TableRow[] = [];
  modules.forEach(mod => {
    const typeLabel = MODULE_TYPE_LABELS[mod.type]?.[ctx.isZh ? 'zh' : 'en'] || mod.type;
    // Include module description if available
    const modDesc = mod.description ? ` - ${mod.description.slice(0, 30)}...` : '';
    detectionItems.push(row([typeLabel, mod.name + (modDesc ? '' : '')]));
    
    // Add specific config details based on module type
    const cfg = (mod.defect_config || mod.measurement_config || mod.positioning_config || mod.ocr_config || mod.deep_learning_config) as Record<string, unknown> | null;
    if (cfg) {
      // Defect detection specific
      if (mod.defect_config) {
        const defCfg = mod.defect_config as Record<string, unknown>;
        if (defCfg.defectClasses && Array.isArray(defCfg.defectClasses)) {
          detectionItems.push(row([ctx.isZh ? '缺陷类别' : 'Defect Types', (defCfg.defectClasses as string[]).slice(0, 3).join('、')]));
        }
      }
      // OCR specific
      if (mod.ocr_config) {
        const ocrCfg = mod.ocr_config as Record<string, unknown>;
        if (ocrCfg.charType) {
          const charTypeLabels: Record<string, string> = {
            printed: ctx.isZh ? '印刷字符' : 'Printed',
            laser: ctx.isZh ? '激光雕刻' : 'Laser Engraved',
            engraved: ctx.isZh ? '雕刻字符' : 'Engraved',
            dotMatrix: ctx.isZh ? '点阵字符' : 'Dot Matrix',
          };
          detectionItems.push(row([ctx.isZh ? '字符类型' : 'Char Type', charTypeLabels[ocrCfg.charType as string] || String(ocrCfg.charType)]));
        }
        if (ocrCfg.charCount) {
          detectionItems.push(row([ctx.isZh ? '字符数量' : 'Char Count', String(ocrCfg.charCount)]));
        }
      }
      // Measurement specific
      if (mod.measurement_config) {
        const measCfg = mod.measurement_config as Record<string, unknown>;
        if (measCfg.systemAccuracy) {
          detectionItems.push(row([ctx.isZh ? '系统精度' : 'System Acc.', `±${measCfg.systemAccuracy} mm`]));
        }
        if (measCfg.measurementItems && Array.isArray(measCfg.measurementItems)) {
          const items = measCfg.measurementItems as Array<{ name: string }>;
          items.slice(0, 2).forEach(item => {
            detectionItems.push(row([ctx.isZh ? '测量项' : 'Measure Item', item.name || '-']));
          });
        }
      }
      // Deep learning specific
      if (mod.deep_learning_config) {
        const dlCfg = mod.deep_learning_config as Record<string, unknown>;
        if (dlCfg.taskType) {
          const taskLabels: Record<string, string> = {
            classification: ctx.isZh ? '分类' : 'Classification',
            detection: ctx.isZh ? '目标检测' : 'Detection',
            segmentation: ctx.isZh ? '语义分割' : 'Segmentation',
            anomaly: ctx.isZh ? '异常检测' : 'Anomaly',
          };
          detectionItems.push(row([ctx.isZh ? 'AI任务类型' : 'AI Task', taskLabels[dlCfg.taskType as string] || String(dlCfg.taskType)]));
        }
        if (dlCfg.targetClasses && Array.isArray(dlCfg.targetClasses)) {
          detectionItems.push(row([ctx.isZh ? '目标类别' : 'Target Classes', (dlCfg.targetClasses as string[]).slice(0, 3).join('、')]));
        }
      }
    }
  });

  // Add detection requirements from product asset
  productAsset?.detection_requirements?.forEach((req, idx) => {
    detectionItems.push(row([`${idx + 1}. ${ctx.isZh ? '检测项' : 'Item'}`, req.content]));
  });

  if (detectionItems.length === 0) {
    detectionItems.push(row(['-', '-']));
  }

  slide.addTable(detectionItems.slice(0, 8), {
    x: 0.5, y: 1.45, w: 4.3, h: Math.min(detectionItems.length * 0.28 + 0.1, 2.2),
    fontFace: 'Arial',
    fontSize: 8,
    colW: [1.4, 2.9],
    border: { pt: 0.5, color: COLORS.border },
    fill: { color: COLORS.white },
  });

  // Minimum defect / Tolerance / Configuration details
  slide.addText(ctx.isZh ? '【配置参数/允许偏差】' : '[Config Parameters/Tolerance]', {
    x: 5, y: 1.15, w: 4.5, h: 0.25,
    fontSize: 11, color: COLORS.primary, bold: true,
  });

  const toleranceRows: TableRow[] = [];
  modules.forEach(mod => {
    const cfg = (mod.defect_config || mod.measurement_config || mod.positioning_config || mod.ocr_config) as Record<string, unknown> | null;
    if (cfg) {
      // Common imaging config
      const imaging = cfg.imaging as Record<string, unknown> | undefined;
      
      if (cfg.minDefectSize) toleranceRows.push(row([ctx.isZh ? '最小缺陷' : 'Min Defect', `${cfg.minDefectSize} mm`]));
      if (cfg.targetAccuracy) toleranceRows.push(row([ctx.isZh ? '目标精度' : 'Target Acc.', `±${cfg.targetAccuracy} mm`]));
      if (cfg.accuracyRequirement) toleranceRows.push(row([ctx.isZh ? '定位精度' : 'Position Acc.', `±${cfg.accuracyRequirement} mm`]));
      if (cfg.systemAccuracy) toleranceRows.push(row([ctx.isZh ? '系统精度' : 'System Acc.', `±${cfg.systemAccuracy} mm`]));
      if (cfg.allowedMissRate) toleranceRows.push(row([ctx.isZh ? '允许漏检率' : 'Miss Rate', String(cfg.allowedMissRate)]));
      if (cfg.allowedFalseRate) toleranceRows.push(row([ctx.isZh ? '允许误检率' : 'False Rate', String(cfg.allowedFalseRate)]));
      if (cfg.confidenceThreshold) toleranceRows.push(row([ctx.isZh ? '置信度阈值' : 'Confidence', String(cfg.confidenceThreshold)]));
      if (cfg.lineSpeed) toleranceRows.push(row([ctx.isZh ? '线速度' : 'Line Speed', `${cfg.lineSpeed} m/min`]));
      if (cfg.detectionAreaLength && cfg.detectionAreaWidth) {
        toleranceRows.push(row([ctx.isZh ? '检测区域' : 'Detection Area', `${cfg.detectionAreaLength}×${cfg.detectionAreaWidth} mm`]));
      }
      
      // Imaging parameters
      if (imaging) {
        if (imaging.workingDistance) toleranceRows.push(row([ctx.isZh ? '工作距离' : 'WD', `${imaging.workingDistance} mm`]));
        if (imaging.fieldOfView) toleranceRows.push(row([ctx.isZh ? '视场' : 'FOV', `${imaging.fieldOfView}`]));
        if (imaging.resolutionPerPixel) toleranceRows.push(row([ctx.isZh ? '分辨率' : 'Resolution', `${imaging.resolutionPerPixel} mm/px`]));
        if (imaging.exposure) toleranceRows.push(row([ctx.isZh ? '曝光' : 'Exposure', `${imaging.exposure} μs`]));
      }
    }
    
    // Output types - with defensive array check
    const outputTypes = Array.isArray(mod.output_types) ? mod.output_types : [];
    if (outputTypes.length > 0) {
      const outputLabels: Record<string, string> = {
        '报警': ctx.isZh ? '报警' : 'Alarm',
        '停机': ctx.isZh ? '停机' : 'Stop',
        '分拣': ctx.isZh ? '分拣' : 'Sort',
        '标记': ctx.isZh ? '标记' : 'Mark',
      };
      const outputs = outputTypes.map(o => outputLabels[o] || o).join('、');
      toleranceRows.push(row([ctx.isZh ? '输出动作' : 'Output Action', outputs]));
    }
  });

  if (toleranceRows.length === 0) {
    toleranceRows.push(row([ctx.isZh ? '精度要求' : 'Accuracy', ws.acceptance_criteria?.accuracy || '±0.1mm']));
  }

  slide.addTable(toleranceRows.slice(0, 10), {
    x: 5, y: 1.45, w: 4.5, h: Math.min(toleranceRows.length * 0.26 + 0.1, 2.4),
    fontFace: 'Arial',
    fontSize: 8,
    colW: [1.8, 2.7],
    border: { pt: 0.5, color: COLORS.border },
    fill: { color: COLORS.white },
  });

  // Risk notes section
  slide.addText(ctx.isZh ? '【风险口径/备注】' : '[Risk Notes / Remarks]', {
    x: 0.5, y: 3.95, w: 9, h: 0.25,
    fontSize: 11, color: COLORS.warning, bold: true,
  });

  const riskText = ws.risk_notes || (ctx.isZh 
    ? '• 缺陷检测能力需以实际样品测试为准\n• 精度验收需现场调试后确认' 
    : '• Detection capability subject to actual sample testing\n• Accuracy acceptance to be confirmed after on-site commissioning');

  slide.addShape('rect', {
    x: 0.5, y: 4.25, w: 9, h: 0.9,
    fill: { color: 'FFF3CD' },
    line: { color: COLORS.warning, width: 1 },
  });
  slide.addText(riskText, {
    x: 0.7, y: 4.32, w: 8.6, h: 0.75,
    fontSize: 9, color: COLORS.dark,
  });
}

/**
 * Slide 4: Layout & Optical Solution (布局与光学方案)
 * Merges former three-view, schematic, and optical slides into one.
 * Shows simplified layout overview image + key hardware specs table.
 */
export async function generateLayoutAndOpticalSlide(
  ctx: SlideContext,
  data: WorkstationSlideData
): Promise<void> {
  const slide = ctx.pptx.addSlide({ masterName: 'MASTER_SLIDE' });
  const { layout, modules, hardware } = data;
  
  addSlideTitle(slide, ctx, ctx.isZh ? '布局与光学方案' : 'Layout & Optical Solution');

  // Left side: Layout overview image (simplified diagram)
  const layoutImageUrl = layout?.front_view_image_url;
  
  if (layoutImageUrl) {
    try {
      const dataUri = await fetchImageAsDataUri(layoutImageUrl);
      if (dataUri) {
        const dims = await getImageDimensions(dataUri).catch(() => ({ width: 900, height: 500 }));
        const fit = calculateContainFit(dims.width, dims.height, {
          x: 0.4, y: 1.1, width: 5.6, height: 3.6
        });
        slide.addImage({
          data: dataUri,
          x: fit.x, y: fit.y, w: fit.width, h: fit.height,
        });
      } else {
        throw new Error('Failed to fetch image');
      }
    } catch (e) {
      console.error('[PPT] Failed to load layout overview:', e);
      addImagePlaceholder(slide, { x: 0.4, y: 1.1, width: 5.6, height: 3.6 },
        ctx.isZh ? '请先保存布局概览图' : 'Please save layout overview',
        '📐'
      );
    }
  } else {
    addImagePlaceholder(slide, { x: 0.4, y: 1.1, width: 5.6, height: 3.6 },
      ctx.isZh ? '请先保存布局概览图' : 'Please save layout overview',
      '📐'
    );
  }

  // Right side: Hardware specs
  slide.addText(ctx.isZh ? '光学配置' : 'Optical Configuration', {
    x: 6.2, y: 1.1, w: 3.3, h: 0.28,
    fontSize: 11, color: COLORS.dark, bold: true,
  });

  // Camera table
  const cameraRows: TableRow[] = layout?.selected_cameras?.filter((c: any) => c).map((cam: any) => {
    const fullCam = hardware?.cameras?.find((c: { id: string }) => c.id === cam.id);
    return row([`${cam.brand} ${cam.model}`, fullCam?.resolution || '-']);
  }) || [row(['-', '-'])];

  slide.addTable(cameraRows, {
    x: 6.2, y: 1.42, w: 3.3, h: Math.min(cameraRows.length * 0.26 + 0.05, 0.9),
    fontFace: 'Arial', fontSize: 8,
    colW: [2.1, 1.2],
    border: { pt: 0.5, color: COLORS.border },
    fill: { color: COLORS.white },
  });

  // Lens + Light compact
  const opticsY = 1.42 + Math.min(cameraRows.length * 0.26 + 0.05, 0.9) + 0.15;
  const opticsRows: TableRow[] = [];
  
  layout?.selected_lenses?.filter((l: any) => l).forEach((lens: any) => {
    const fullLens = hardware?.lenses?.find((l: { id: string }) => l.id === lens.id);
    opticsRows.push(row([ctx.isZh ? '镜头' : 'Lens', `${lens.brand} ${lens.model}${fullLens?.focal_length ? ` ${fullLens.focal_length}` : ''}`]));
  });
  
  layout?.selected_lights?.filter((l: any) => l).forEach((light: any) => {
    const fullLight = hardware?.lights?.find((l: { id: string }) => l.id === light.id);
    opticsRows.push(row([ctx.isZh ? '光源' : 'Light', `${light.brand} ${light.model}${fullLight?.type ? ` (${fullLight.type})` : ''}`]));
  });
  
  if (layout?.selected_controller) {
    opticsRows.push(row([ctx.isZh ? '工控机' : 'IPC', `${layout.selected_controller.brand} ${layout.selected_controller.model}`]));
  }

  if (opticsRows.length > 0) {
    slide.addTable(opticsRows, {
      x: 6.2, y: opticsY, w: 3.3, h: Math.min(opticsRows.length * 0.24 + 0.05, 1.2),
      fontFace: 'Arial', fontSize: 8,
      colW: [0.8, 2.5],
      border: { pt: 0.5, color: COLORS.border },
      fill: { color: COLORS.white },
    });
  }

  // Layout info section
  const layoutInfoY = opticsY + Math.min(opticsRows.length * 0.24 + 0.05, 1.2) + 0.2;
  const cameraMounts = Array.isArray(layout?.camera_mounts) ? layout.camera_mounts : [];
  const mechanisms = Array.isArray(layout?.mechanisms) ? layout.mechanisms : [];

  const translatedMounts = cameraMounts.map((m: string) => 
    getLabel(m, CAMERA_MOUNT_LABELS, ctx.isZh ? 'zh' : 'en')
  ).join('/') || (ctx.isZh ? '顶部' : 'Top');
  
  const translatedMechanisms = mechanisms.map((m: string) => 
    getLabel(m, MECHANISM_LABELS, ctx.isZh ? 'zh' : 'en')
  ).join('、') || '-';

  const layoutInfoRows: TableRow[] = [
    row([ctx.isZh ? '安装方式' : 'Mount', translatedMounts]),
    row([ctx.isZh ? '执行机构' : 'Mechanisms', translatedMechanisms]),
    row([ctx.isZh ? '相机数量' : 'Cameras', `${layout?.camera_count || modules.length}`]),
  ];

  // Working distance from modules
  modules.forEach(mod => {
    const cfg = (mod.defect_config || mod.measurement_config || mod.positioning_config) as Record<string, unknown> | null;
    if (cfg?.workingDistance) {
      layoutInfoRows.push(row([ctx.isZh ? '工作距离' : 'WD', `${cfg.workingDistance} mm`]));
    }
    if (cfg?.fieldOfView) {
      layoutInfoRows.push(row([ctx.isZh ? '视场' : 'FOV', `${cfg.fieldOfView} mm`]));
    }
  });

  slide.addTable(layoutInfoRows.slice(0, 7), {
    x: 6.2, y: layoutInfoY, w: 3.3, h: Math.min(layoutInfoRows.length * 0.24 + 0.05, 1.6),
    fontFace: 'Arial', fontSize: 8,
    colW: [1.1, 2.2],
    border: { pt: 0.5, color: COLORS.border },
    fill: { color: COLORS.white },
  });

  // Layout dimensions at bottom
  if (layout?.width || layout?.height || layout?.depth) {
    slide.addText(
      `${ctx.isZh ? '布局尺寸' : 'Layout Size'}: ${layout.width || '-'} × ${layout.height || '-'} × ${layout.depth || '-'} mm`, 
      {
        x: 0.4, y: 4.85, w: 5.6, h: 0.22,
        fontSize: 8, color: COLORS.secondary,
      }
    );
  }
}

// Keep old functions as exports for backward compatibility but mark deprecated
/** @deprecated Use generateLayoutAndOpticalSlide instead */
export async function generateThreeViewSlide(
  ctx: SlideContext,
  data: WorkstationSlideData
): Promise<void> {
  return generateLayoutAndOpticalSlide(ctx, data);
}

/** @deprecated Use generateLayoutAndOpticalSlide instead */
export async function generateDiagramSlide(
  ctx: SlideContext,
  data: WorkstationSlideData
): Promise<void> {
  // No-op: merged into generateLayoutAndOpticalSlide
}

/**
 * Slide 6: Motion / Detection Method (运动/检测方式)
 */
export function generateMotionMethodSlide(
  ctx: SlideContext,
  data: WorkstationSlideData
): void {
  const slide = ctx.pptx.addSlide({ masterName: 'MASTER_SLIDE' });
  const { ws, layout, modules } = data;
  
  addSlideTitle(slide, ctx, ctx.isZh ? '运动方式/检测方式' : 'Motion/Detection Method');

  slide.addText(ctx.isZh ? '本页为"落地核心"，现场最看这一页' : 'Core execution page for on-site implementation', {
    x: 0.5, y: 1.0, w: 9, h: 0.25,
    fontSize: 9, color: COLORS.secondary, italic: true,
  });

  // Left column: FOV and Installation
  slide.addText(ctx.isZh ? '【视野范围/像素精度】' : '[FOV / Pixel Precision]', {
    x: 0.5, y: 1.35, w: 4.3, h: 0.25,
    fontSize: 10, color: COLORS.primary, bold: true,
  });

  const fovRows: TableRow[] = [];
  modules.forEach(mod => {
    const cfg = (mod.defect_config || mod.measurement_config || mod.positioning_config) as Record<string, unknown> | null;
    if (cfg) {
      if (cfg.fieldOfView) fovRows.push(row([mod.name, `FOV: ${cfg.fieldOfView} mm`]));
      if (cfg.resolutionPerPixel) fovRows.push(row([ctx.isZh ? '分辨率' : 'Resolution', `${cfg.resolutionPerPixel} mm/px`]));
    }
  });
  if (fovRows.length === 0) {
    fovRows.push(row([ctx.isZh ? '待定' : 'TBD', '-']));
  }

  slide.addTable(fovRows.slice(0, 4), {
    x: 0.5, y: 1.65, w: 4.3, h: Math.min(fovRows.length * 0.28 + 0.1, 1.2),
    fontFace: 'Arial',
    fontSize: 9,
    colW: [2, 2.3],
    border: { pt: 0.5, color: COLORS.border },
    fill: { color: COLORS.white },
  });

  // Right column: Installation requirements
  slide.addText(ctx.isZh ? '【相机安装要求】' : '[Camera Installation]', {
    x: 5, y: 1.35, w: 4.5, h: 0.25,
    fontSize: 10, color: COLORS.primary, bold: true,
  });

  const installMounts = Array.isArray(layout?.camera_mounts) ? layout.camera_mounts : [];
  const translatedInstallMounts = installMounts.map(m => 
    getLabel(m, CAMERA_MOUNT_LABELS, ctx.isZh ? 'zh' : 'en')
  ).join('/') || (ctx.isZh ? '顶部安装' : 'Top Mount');
  
  const installRows: TableRow[] = [
    row([ctx.isZh ? '安装方式' : 'Mount', translatedInstallMounts]),
    row([ctx.isZh ? '相机朝向' : 'Direction', ctx.isZh ? '垂直向下' : 'Vertical down']),
    row([ctx.isZh ? '长边方向' : 'Long Edge', ctx.isZh ? '沿运动方向' : 'Along motion']),
  ];

  slide.addTable(installRows, {
    x: 5, y: 1.65, w: 4.5, h: 1.0,
    fontFace: 'Arial',
    fontSize: 9,
    colW: [1.8, 2.7],
    border: { pt: 0.5, color: COLORS.border },
    fill: { color: COLORS.white },
  });

  // Cycle and shot count
  slide.addText(ctx.isZh ? '【节拍/拍照次数】' : '[Cycle / Shot Count]', {
    x: 0.5, y: 3.0, w: 9, h: 0.25,
    fontSize: 10, color: COLORS.primary, bold: true,
  });

  const cycleRows: TableRow[] = [
    row([ctx.isZh ? '目标节拍' : 'Target Cycle', `${ws.cycle_time || '-'} s/pcs`]),
    row([ctx.isZh ? '拍照次数' : 'Shot Count', `${ws.shot_count || modules.length || '-'} ${ctx.isZh ? '次' : ''}`]),
    row([ctx.isZh ? '触发方式' : 'Trigger', TRIGGER_LABELS[modules[0]?.trigger_type || 'io']?.[ctx.isZh ? 'zh' : 'en'] || 'IO']),
  ];

  slide.addTable(cycleRows, {
    x: 0.5, y: 3.3, w: 4.3, h: 1.0,
    fontFace: 'Arial',
    fontSize: 9,
    colW: [1.8, 2.5],
    border: { pt: 0.5, color: COLORS.border },
    fill: { color: COLORS.white },
  });

  // Measurement method / Action flow
  slide.addText(ctx.isZh ? '【测量方法/动作流程】' : '[Measurement Method / Action Flow]', {
    x: 5, y: 3.0, w: 4.5, h: 0.25,
    fontSize: 10, color: COLORS.primary, bold: true,
  });

  const actionScript = ws.action_script || (ctx.isZh 
    ? '1. 产品到位触发\n2. 相机采集图像\n3. 算法处理\n4. 结果输出PLC' 
    : '1. Trigger on position\n2. Camera capture\n3. Algorithm process\n4. Output to PLC');

  slide.addShape('rect', {
    x: 5, y: 3.3, w: 4.5, h: 1.5,
    fill: { color: COLORS.white },
    line: { color: COLORS.border, width: 0.5 },
  });
  slide.addText(actionScript, {
    x: 5.1, y: 3.4, w: 4.3, h: 1.3,
    fontSize: 9, color: COLORS.dark,
  });
}

/**
 * Slide 7: Optical Solution (光学方案)
 */
export function generateOpticalSolutionSlide(
  ctx: SlideContext,
  data: WorkstationSlideData
): void {
  const slide = ctx.pptx.addSlide({ masterName: 'MASTER_SLIDE' });
  const { layout, modules, hardware } = data;
  
  addSlideTitle(slide, ctx, ctx.isZh ? '光学方案' : 'Optical Solution');

  // Camera configuration
  slide.addText(ctx.isZh ? '【相机型号/像素/靶面】' : '[Camera Model/Resolution/Sensor]', {
    x: 0.5, y: 1.1, w: 9, h: 0.25,
    fontSize: 10, color: COLORS.primary, bold: true,
  });

  const cameraHeader: TableRow = row([
    ctx.isZh ? '型号' : 'Model', 
    ctx.isZh ? '分辨率' : 'Resolution', 
    ctx.isZh ? '靶面' : 'Sensor', 
    ctx.isZh ? '接口' : 'Interface'
  ]);
  
  const cameraRows: TableRow[] = layout?.selected_cameras?.filter(c => c).map(cam => {
    const fullCam = hardware?.cameras?.find(c => c.id === cam.id);
    return row([
      `${cam.brand} ${cam.model}`,
      fullCam?.resolution || '-',
      fullCam?.sensor_size || '-',
      fullCam?.interface || '-'
    ]);
  }) || [row(['-', '-', '-', '-'])];

  slide.addTable([cameraHeader, ...cameraRows], {
    x: 0.5, y: 1.4, w: 9, h: Math.min((cameraRows.length + 1) * 0.3 + 0.1, 1.5),
    fontFace: 'Arial',
    fontSize: 9,
    colW: [3.5, 2, 1.5, 2],
    border: { pt: 0.5, color: COLORS.border },
    fill: { color: COLORS.white },
    valign: 'middle',
    align: 'center',
  });

  // Lens configuration
  slide.addText(ctx.isZh ? '【镜头焦距/光圈】' : '[Lens Focal Length/Aperture]', {
    x: 0.5, y: 3.0, w: 4.3, h: 0.25,
    fontSize: 10, color: COLORS.primary, bold: true,
  });

  const lensHeader: TableRow = row([
    ctx.isZh ? '型号' : 'Model', 
    ctx.isZh ? '焦距' : 'Focal', 
    ctx.isZh ? '光圈' : 'Aperture'
  ]);

  const lensRows: TableRow[] = layout?.selected_lenses?.filter(l => l).map(lens => {
    const fullLens = hardware?.lenses?.find(l => l.id === lens.id);
    return row([
      `${lens.brand} ${lens.model}`,
      fullLens?.focal_length || '-',
      fullLens?.aperture || '-'
    ]);
  }) || [row(['-', '-', '-'])];

  slide.addTable([lensHeader, ...lensRows], {
    x: 0.5, y: 3.3, w: 4.3, h: Math.min((lensRows.length + 1) * 0.28 + 0.1, 1.2),
    fontFace: 'Arial',
    fontSize: 9,
    colW: [2.3, 1, 1],
    border: { pt: 0.5, color: COLORS.border },
    fill: { color: COLORS.white },
  });

  // Working distance
  slide.addText(ctx.isZh ? '【工作距离(±范围)】' : '[Working Distance (±Range)]', {
    x: 5, y: 3.0, w: 4.5, h: 0.25,
    fontSize: 10, color: COLORS.primary, bold: true,
  });

  const wdRows: TableRow[] = [];
  modules.forEach(mod => {
    const cfg = (mod.defect_config || mod.measurement_config || mod.positioning_config) as Record<string, unknown> | null;
    if (cfg?.workingDistance) {
      wdRows.push(row([mod.name, `${cfg.workingDistance} mm`]));
    }
  });
  if (wdRows.length === 0) {
    wdRows.push(row([ctx.isZh ? '待定' : 'TBD', '-']));
  }

  slide.addTable(wdRows.slice(0, 4), {
    x: 5, y: 3.3, w: 4.5, h: Math.min(wdRows.length * 0.28 + 0.1, 1),
    fontFace: 'Arial',
    fontSize: 9,
    colW: [2.5, 2],
    border: { pt: 0.5, color: COLORS.border },
    fill: { color: COLORS.white },
  });
}

/**
 * Slide 8: Measurement Method & Vision List (测量方法及视觉清单)
 */
export function generateVisionListSlide(
  ctx: SlideContext,
  data: WorkstationSlideData
): void {
  const slide = ctx.pptx.addSlide({ masterName: 'MASTER_SLIDE' });
  const { layout, modules } = data;
  
  addSlideTitle(slide, ctx, ctx.isZh ? '测量方法及视觉清单' : 'Measurement & Vision List');

  // Light source configuration
  slide.addText(ctx.isZh ? '【光源型号/数量】' : '[Light Model/Quantity]', {
    x: 0.5, y: 1.1, w: 4.3, h: 0.25,
    fontSize: 10, color: COLORS.primary, bold: true,
  });

  const lightRows: TableRow[] = layout?.selected_lights?.filter(l => l).map(light => 
    row([`${light.brand} ${light.model}`, '1'])
  ) || [row(['-', '-'])];

  slide.addTable(lightRows, {
    x: 0.5, y: 1.4, w: 4.3, h: Math.min(lightRows.length * 0.28 + 0.1, 1.2),
    fontFace: 'Arial',
    fontSize: 9,
    colW: [3.3, 1],
    border: { pt: 0.5, color: COLORS.border },
    fill: { color: COLORS.white },
  });

  // Light distance and angle
  slide.addText(ctx.isZh ? '【光源距离/角度】' : '[Light Distance/Angle]', {
    x: 5, y: 1.1, w: 4.5, h: 0.25,
    fontSize: 10, color: COLORS.primary, bold: true,
  });

  slide.addText(ctx.isZh ? '需根据实际调试确定' : 'To be determined on-site', {
    x: 5, y: 1.4, w: 4.5, h: 0.3,
    fontSize: 9, color: COLORS.secondary,
  });

  // Vision equipment list
  slide.addText(ctx.isZh ? '【视觉清单】' : '[Vision Equipment List]', {
    x: 0.5, y: 2.7, w: 9, h: 0.25,
    fontSize: 10, color: COLORS.primary, bold: true,
  });

  const visionListRows: TableRow[] = [
    row([ctx.isZh ? '相机' : 'Camera', `${layout?.camera_count || 0} ${ctx.isZh ? '台' : ''}`]),
    row([ctx.isZh ? '镜头' : 'Lens', `${layout?.selected_lenses?.filter(l => l).length || 0} ${ctx.isZh ? '个' : ''}`]),
    row([ctx.isZh ? '光源' : 'Light', `${layout?.selected_lights?.filter(l => l).length || 0} ${ctx.isZh ? '个' : ''}`]),
    row([ctx.isZh ? '工控机' : 'IPC', layout?.selected_controller ? `${layout.selected_controller.brand} ${layout.selected_controller.model}` : '1 台']),
    row([ctx.isZh ? '触发器/编码器' : 'Trigger/Encoder', modules.some(m => m.trigger_type === 'encoder') ? (ctx.isZh ? '需要' : 'Required') : 'IO']),
    row([ctx.isZh ? '支架/线缆' : 'Bracket/Cable', ctx.isZh ? '按需配置' : 'As needed']),
  ];

  slide.addTable(visionListRows, {
    x: 0.5, y: 3.0, w: 4.3, h: 2.0,
    fontFace: 'Arial',
    fontSize: 9,
    colW: [1.8, 2.5],
    border: { pt: 0.5, color: COLORS.border },
    fill: { color: COLORS.white },
  });

  // Module summary
  slide.addText(ctx.isZh ? '功能模块' : 'Function Modules', {
    x: 5, y: 2.7, w: 4.5, h: 0.25,
    fontSize: 10, color: COLORS.dark, bold: true,
  });

  const modRows: TableRow[] = modules.map(mod => row([
    MODULE_TYPE_LABELS[mod.type]?.[ctx.isZh ? 'zh' : 'en'] || mod.type,
    mod.name
  ]));

  if (modRows.length > 0) {
    slide.addTable(modRows.slice(0, 6), {
      x: 5, y: 3.0, w: 4.5, h: Math.min(modRows.length * 0.3 + 0.1, 2),
      fontFace: 'Arial',
      fontSize: 9,
      colW: [1.5, 3],
      border: { pt: 0.5, color: COLORS.border },
      fill: { color: COLORS.white },
    });
  }
}

/**
 * Slide 9: BOM List & Review (BOM清单及审核)
 */
export function generateBOMSlide(
  ctx: SlideContext,
  data: WorkstationSlideData
): void {
  const slide = ctx.pptx.addSlide({ masterName: 'MASTER_SLIDE' });
  const { layout } = data;
  
  addSlideTitle(slide, ctx, ctx.isZh ? 'BOM清单与审核' : 'BOM List & Review');

  // BOM table
  const bomHeader: TableRow = row([
    ctx.isZh ? '序号' : 'No.',
    ctx.isZh ? '设备名称' : 'Device',
    ctx.isZh ? '型号' : 'Model',
    ctx.isZh ? '数量' : 'Qty',
    ctx.isZh ? '单价' : 'Price',
    ctx.isZh ? '备注' : 'Notes'
  ]);

  const bomRows: TableRow[] = [];
  let bomIdx = 1;

  // Cameras
  layout?.selected_cameras?.filter(c => c).forEach(cam => {
    bomRows.push(row([String(bomIdx++), ctx.isZh ? '工业相机' : 'Camera', `${cam.brand} ${cam.model}`, '1', 'TBD', '']));
  });

  // Lenses
  layout?.selected_lenses?.filter(l => l).forEach(lens => {
    bomRows.push(row([String(bomIdx++), ctx.isZh ? '工业镜头' : 'Lens', `${lens.brand} ${lens.model}`, '1', 'TBD', '']));
  });

  // Lights
  layout?.selected_lights?.filter(l => l).forEach(light => {
    bomRows.push(row([String(bomIdx++), ctx.isZh ? 'LED光源' : 'Light', `${light.brand} ${light.model}`, '1', 'TBD', '']));
  });

  // Controller
  if (layout?.selected_controller) {
    bomRows.push(row([String(bomIdx++), ctx.isZh ? '工控机' : 'IPC', `${layout.selected_controller.brand} ${layout.selected_controller.model}`, '1', 'TBD', ctx.isZh ? '含GPU' : 'w/ GPU']));
  }

  if (bomRows.length === 0) {
    bomRows.push(row(['1', '-', '-', '-', '-', '-']));
  }

  slide.addTable([bomHeader, ...bomRows.slice(0, 10)], {
    x: 0.5, y: 1.1, w: 9, h: Math.min((bomRows.length + 1) * 0.32 + 0.1, 3.0),
    fontFace: 'Arial',
    fontSize: 9,
    colW: [0.6, 1.5, 2.8, 0.8, 1, 2.3],
    border: { pt: 0.5, color: COLORS.border },
    fill: { color: COLORS.white },
    valign: 'middle',
    align: 'center',
  });

  // Review section
  slide.addText(ctx.isZh ? '【审核】' : '[Review]', {
    x: 0.5, y: 4.4, w: 9, h: 0.25,
    fontSize: 10, color: COLORS.dark, bold: true,
  });

  slide.addShape('rect', {
    x: 0.5, y: 4.7, w: 9, h: 0.65,
    fill: { color: COLORS.white },
    line: { color: COLORS.border, width: 0.5 },
  });
  
  slide.addText(
    `☐ ${ctx.isZh ? '技术确认' : 'Technical'}     ☐ ${ctx.isZh ? '采购确认' : 'Procurement'}     ☐ ${ctx.isZh ? '客户确认' : 'Customer'}`, 
    {
      x: 0.7, y: 4.85, w: 8.6, h: 0.35,
      fontSize: 11, color: COLORS.dark,
    }
  );
}

// ==================== NEW SLIDES: Plan Refactoring ====================

/**
 * Combined: Basic Info + Technical Requirements (基本信息+检测要求)
 * Merges generateBasicInfoSlide and generateTechnicalRequirementsSlide into one page
 */
export function generateBasicInfoAndRequirementsSlide(
  ctx: SlideContext,
  data: WorkstationSlideData
): void {
  const slide = ctx.pptx.addSlide({ masterName: 'MASTER_SLIDE' });
  const { ws, layout, modules, productAsset } = data;
  
  addSlideTitle(slide, ctx, ctx.isZh ? '基本信息与检测要求' : 'Basic Info & Requirements');

  // === TOP HALF: Basic Info ===
  const startY = 1.1;
  
  // Left: Workstation info table
  const wsTypeLabel = WS_TYPE_LABELS[ws.type]?.[ctx.isZh ? 'zh' : 'en'] || ws.type;
  const processLabel = ws.process_stage ? (PROCESS_STAGE_LABELS[ws.process_stage]?.[ctx.isZh ? 'zh' : 'en'] || ws.process_stage) : '-';
  const dims = ws.product_dimensions;
  const dimsText = dims ? `${dims.length} × ${dims.width} × ${dims.height} mm` : '-';
  
  const basicInfoRows: TableRow[] = [
    row([ctx.isZh ? '工位编号' : 'Code', ctx.wsCode]),
    row([ctx.isZh ? '工位名称' : 'Name', ctx.wsName]),
    row([ctx.isZh ? '工位类型' : 'Type', wsTypeLabel]),
    row([ctx.isZh ? '工序阶段' : 'Process', processLabel]),
    row([ctx.isZh ? '节拍' : 'Cycle Time', ws.cycle_time ? `${ws.cycle_time} s/pcs` : '-']),
    row([ctx.isZh ? '兼容尺寸' : 'Product Dims', dimsText]),
  ];

  slide.addTable(basicInfoRows, {
    x: 0.4, y: startY, w: 4.5, h: 1.8,
    fontFace: 'Arial',
    fontSize: 8,
    colW: [1.2, 3.3],
    border: { pt: 0.5, color: COLORS.border },
    fill: { color: COLORS.white },
    valign: 'middle',
  });

  // Right: Detection method summary + camera info
  const detectionMethods = modules.map(m => {
    const typeLabel = MODULE_TYPE_LABELS[m.type]?.[ctx.isZh ? 'zh' : 'en'] || m.type;
    return typeLabel;
  });
  const cameraCount = layout?.camera_count || modules.length;

  const rightInfoRows: TableRow[] = [
    row([ctx.isZh ? '检测方式' : 'Detection', `${cameraCount}${ctx.isZh ? '相机' : ' cam'} - ${detectionMethods.join('/')}`]),
    row([ctx.isZh ? '精度要求' : 'Accuracy', ws.acceptance_criteria?.accuracy || '±0.1mm']),
    row([ctx.isZh ? '拍照次数' : 'Shots', `${ws.shot_count || modules.length || '-'}`]),
    row([ctx.isZh ? '观测对象' : 'Target', ws.observation_target || '-']),
  ];

  // Add module names
  modules.forEach(mod => {
    const typeLabel = MODULE_TYPE_LABELS[mod.type]?.[ctx.isZh ? 'zh' : 'en'] || mod.type;
    rightInfoRows.push(row([typeLabel, mod.name]));
  });

  slide.addTable(rightInfoRows.slice(0, 8), {
    x: 5.1, y: startY, w: 4.5, h: 1.8,
    fontFace: 'Arial',
    fontSize: 8,
    colW: [1.4, 3.1],
    border: { pt: 0.5, color: COLORS.border },
    fill: { color: COLORS.white },
    valign: 'middle',
  });

  // === BOTTOM HALF: Detection Requirements ===
  const bottomY = 3.1;

  slide.addText(ctx.isZh ? '【检测项/缺陷项】' : '[Detection/Defect Items]', {
    x: 0.4, y: bottomY, w: 4.5, h: 0.25,
    fontSize: 10, color: COLORS.primary, bold: true,
  });

  const detectionItems: TableRow[] = [];
  modules.forEach(mod => {
    const typeLabel = MODULE_TYPE_LABELS[mod.type]?.[ctx.isZh ? 'zh' : 'en'] || mod.type;
    detectionItems.push(row([typeLabel, mod.name]));
    
    // Add key config details
    if (mod.defect_config) {
      const defCfg = mod.defect_config as Record<string, unknown>;
      if (defCfg.defectClasses && Array.isArray(defCfg.defectClasses)) {
        detectionItems.push(row([ctx.isZh ? '  缺陷类别' : '  Defects', (defCfg.defectClasses as string[]).slice(0, 3).join('、')]));
      }
    }
    if (mod.measurement_config) {
      const measCfg = mod.measurement_config as Record<string, unknown>;
      if (measCfg.systemAccuracy) {
        detectionItems.push(row([ctx.isZh ? '  系统精度' : '  Sys Acc.', `±${measCfg.systemAccuracy} mm`]));
      }
    }
  });

  // Add detection requirements from product asset
  productAsset?.detection_requirements?.forEach((req, idx) => {
    detectionItems.push(row([`${idx + 1}.`, req.content]));
  });

  if (detectionItems.length === 0) {
    detectionItems.push(row(['-', '-']));
  }

  slide.addTable(detectionItems.slice(0, 7), {
    x: 0.4, y: bottomY + 0.3, w: 4.5, h: Math.min(detectionItems.length * 0.26 + 0.05, 1.8),
    fontFace: 'Arial',
    fontSize: 8,
    colW: [1.4, 3.1],
    border: { pt: 0.5, color: COLORS.border },
    fill: { color: COLORS.white },
  });

  // Right: Config parameters / tolerances
  slide.addText(ctx.isZh ? '【配置参数/允许偏差】' : '[Config / Tolerance]', {
    x: 5.1, y: bottomY, w: 4.5, h: 0.25,
    fontSize: 10, color: COLORS.primary, bold: true,
  });

  const toleranceRows: TableRow[] = [];
  modules.forEach(mod => {
    const cfg = (mod.defect_config || mod.measurement_config || mod.positioning_config || mod.ocr_config) as Record<string, unknown> | null;
    if (cfg) {
      if (cfg.minDefectSize) toleranceRows.push(row([ctx.isZh ? '最小缺陷' : 'Min Defect', `${cfg.minDefectSize} mm`]));
      if (cfg.targetAccuracy) toleranceRows.push(row([ctx.isZh ? '目标精度' : 'Target Acc.', `±${cfg.targetAccuracy} mm`]));
      if (cfg.accuracyRequirement) toleranceRows.push(row([ctx.isZh ? '定位精度' : 'Pos. Acc.', `±${cfg.accuracyRequirement} mm`]));
      if (cfg.systemAccuracy) toleranceRows.push(row([ctx.isZh ? '系统精度' : 'Sys. Acc.', `±${cfg.systemAccuracy} mm`]));
      if (cfg.allowedMissRate) toleranceRows.push(row([ctx.isZh ? '允许漏检率' : 'Miss Rate', `${cfg.allowedMissRate}%`]));
      if (cfg.confidenceThreshold) toleranceRows.push(row([ctx.isZh ? '置信度阈值' : 'Confidence', `${cfg.confidenceThreshold}%`]));
    }
  });
  if (toleranceRows.length === 0) {
    toleranceRows.push(row([ctx.isZh ? '精度要求' : 'Accuracy', ws.acceptance_criteria?.accuracy || '±0.1mm']));
  }

  slide.addTable(toleranceRows.slice(0, 7), {
    x: 5.1, y: bottomY + 0.3, w: 4.5, h: Math.min(toleranceRows.length * 0.26 + 0.05, 1.8),
    fontFace: 'Arial',
    fontSize: 8,
    colW: [1.6, 2.9],
    border: { pt: 0.5, color: COLORS.border },
    fill: { color: COLORS.white },
  });

  // Risk notes at very bottom
  if (ws.risk_notes) {
    slide.addShape('rect', {
      x: 0.4, y: 5.0, w: 9.2, h: 0.4,
      fill: { color: 'FFF8E1' },
      line: { color: COLORS.warning, width: 0.5 },
    });
    slide.addText(`⚠ ${ws.risk_notes}`, {
      x: 0.5, y: 5.05, w: 9, h: 0.3,
      fontSize: 7, color: COLORS.dark,
    });
  }
}

/**
 * Mechanical Three-View Layout (机械布局三视图)
 * Pure image page: front, side, top views with dimension annotations
 */
export async function generateMechanicalThreeViewSlide(
  ctx: SlideContext,
  data: WorkstationSlideData
): Promise<void> {
  const slide = ctx.pptx.addSlide({ masterName: 'MASTER_SLIDE' });
  const { layout } = data;
  
  addSlideTitle(slide, ctx, ctx.isZh ? '机械布局三视图' : 'Mechanical Layout - Three Views');

  const viewUrls = [
    { url: layout?.front_view_image_url, label: ctx.isZh ? '正视图' : 'Front View' },
    { url: layout?.side_view_image_url, label: ctx.isZh ? '侧视图' : 'Side View' },
    { url: layout?.top_view_image_url, label: ctx.isZh ? '俯视图' : 'Top View' },
  ];

  // Calculate three-view layout slots
  const slots = calculateThreeViewLayout(1.15, 3.2, 0.4, 9.2, 0.15);

  for (let i = 0; i < 3; i++) {
    const { url, label } = viewUrls[i];
    const slot = slots[i];

    // View label above
    slide.addText(label, {
      x: slot.x, y: slot.y - 0.02, w: slot.width, h: 0.2,
      fontSize: 8, color: COLORS.secondary, align: 'center', bold: true,
    });

    const imageContainer = { x: slot.x, y: slot.y + 0.2, width: slot.width, height: slot.height - 0.2 };

    if (url) {
      try {
        const dataUri = await fetchImageAsDataUri(url);
        if (dataUri) {
          const dims = await getImageDimensions(dataUri).catch(() => ({ width: 600, height: 400 }));
          const fit = calculateContainFit(dims.width, dims.height, imageContainer);
          slide.addImage({
            data: dataUri,
            x: fit.x, y: fit.y, w: fit.width, h: fit.height,
          });
        } else {
          throw new Error('Failed');
        }
      } catch {
        addImagePlaceholder(slide, imageContainer, label, '📐');
      }
    } else {
      addImagePlaceholder(slide, imageContainer, ctx.isZh ? '待保存' : 'Not saved', '📐');
    }
  }

  // Dimension annotation at bottom
  if (layout?.width || layout?.height || layout?.depth) {
    slide.addText(
      `${ctx.isZh ? '总体尺寸' : 'Overall'}: ${layout.width || '-'} × ${layout.height || '-'} × ${layout.depth || '-'} mm (${ctx.isZh ? '宽×高×深' : 'W×H×D'})`,
      {
        x: 0.4, y: 4.55, w: 9.2, h: 0.25,
        fontSize: 9, color: COLORS.dark, align: 'center', bold: true,
      }
    );
  }
}

/**
 * Per-Module Optical Solution (光学方案 - 按模块)
 * Left: Optical diagram (camera/lens/light/working distance)
 * Right: Measurement method & vision checklist
 */
export async function generateModuleOpticalSlide(
  ctx: SlideContext,
  data: WorkstationSlideData,
  moduleIndex: number
): Promise<void> {
  const slide = ctx.pptx.addSlide({ masterName: 'MASTER_SLIDE' });
  const { modules, layout, hardware } = data;
  const mod = modules[moduleIndex];
  if (!mod) return;

  const typeLabel = MODULE_TYPE_LABELS[mod.type]?.[ctx.isZh ? 'zh' : 'en'] || mod.type;
  const triggerLabel = TRIGGER_LABELS[mod.trigger_type || 'io']?.[ctx.isZh ? 'zh' : 'en'] || mod.trigger_type || 'IO';

  // Title: DB code + module name
  addSlideTitle(slide, ctx, `${typeLabel} - ${mod.name}`);

  // ===== LEFT HALF: Optical Diagram (use schematic screenshot) =====
  const leftX = 0.4;
  const leftW = 4.6;
  const imgContainerY = 1.1;
  const imgContainerH = 3.8;

  slide.addText(ctx.isZh ? '光学方案' : 'Optical Solution', {
    x: leftX, y: imgContainerY, w: leftW, h: 0.25,
    fontSize: 11, color: COLORS.primary, bold: true,
  });

  const imageArea = { x: leftX, y: imgContainerY + 0.35, width: leftW, height: imgContainerH - 0.35 };

  if (mod.schematic_image_url) {
    try {
      const dataUri = await fetchImageAsDataUri(mod.schematic_image_url);
      if (dataUri) {
        const dims = await getImageDimensions(dataUri);
        const fit = calculateContainFit(dims.width, dims.height, imageArea);
        slide.addImage({ data: dataUri, x: fit.x, y: fit.y, w: fit.width, h: fit.height });
      } else {
        throw new Error('Failed to fetch image');
      }
    } catch (err) {
      console.warn('[PPT] 光学方案图片加载失败，使用占位符', err);
      slide.addShape('rect', {
        x: imageArea.x, y: imageArea.y, w: imageArea.width, h: imageArea.height,
        fill: { color: COLORS.lightGray }, line: { color: COLORS.border, width: 0.5 },
      });
      slide.addText(ctx.isZh ? '请先在系统中保存光路示意图' : 'Please save the optical diagram first', {
        x: imageArea.x, y: imageArea.y, w: imageArea.width, h: imageArea.height,
        fontSize: 10, color: COLORS.secondary, align: 'center', valign: 'middle',
      });
    }
  } else {
    // No schematic_image_url — show placeholder
    slide.addShape('rect', {
      x: imageArea.x, y: imageArea.y, w: imageArea.width, h: imageArea.height,
      fill: { color: COLORS.lightGray }, line: { color: COLORS.border, width: 0.5 },
    });
    slide.addText(ctx.isZh ? '请先在系统中保存光路示意图' : 'Please save the optical diagram first', {
      x: imageArea.x, y: imageArea.y, w: imageArea.width, h: imageArea.height,
      fontSize: 10, color: COLORS.secondary, align: 'center', valign: 'middle',
    });
  }

  // ===== RIGHT HALF: Measurement Method & Vision Checklist =====
  const rightX = 5.2;
  const rightW = 4.4;

  slide.addText(ctx.isZh ? '测量方法及视觉清单' : 'Method & Vision Checklist', {
    x: rightX, y: 1.1, w: rightW, h: 0.25,
    fontSize: 11, color: COLORS.primary, bold: true,
  });

  // Numbered checklist
  const cfg = (mod.defect_config || mod.measurement_config || mod.positioning_config || mod.ocr_config) as Record<string, unknown> | null;
  const wd = cfg?.workingDistance ? `${cfg.workingDistance} mm` : (ctx.isZh ? '待定' : 'TBD');
  const cameraMounts = Array.isArray(layout?.camera_mounts) ? layout.camera_mounts : [];
  const mountText = cameraMounts.map(m => 
    getLabel(m, CAMERA_MOUNT_LABELS, ctx.isZh ? 'zh' : 'en')
  ).join('/') || (ctx.isZh ? '顶部' : 'Top');

  const fov = cfg?.fieldOfView || cfg?.fieldOfViewWidth 
    ? (cfg?.fieldOfViewWidth && cfg?.fieldOfViewHeight 
        ? `${cfg.fieldOfViewWidth}×${cfg.fieldOfViewHeight} mm`
        : `${cfg?.fieldOfView} mm`)
    : '-';
  const resolution = cfg?.resolutionPerPixel ? `${cfg.resolutionPerPixel} mm/pixel` : '-';

  const checklistItems = [
    `1. ${ctx.isZh ? '运动方式' : 'Motion'}: ${triggerLabel}`,
    `2. ${ctx.isZh ? '视野范围' : 'FOV'}: ${fov}`,
    `3. ${ctx.isZh ? '像素精度' : 'Resolution'}: ${resolution}`,
    `4. ${ctx.isZh ? '相机安装' : 'Camera Mount'}: ${mountText}`,
    `5. ${ctx.isZh ? '节拍' : 'Cycle'}: ${data.ws.cycle_time || '-'} s/${ctx.isZh ? '次' : 'shot'}`,
    `6. ${ctx.isZh ? '工作距离' : 'WD'}: ${wd}`,
  ];

  slide.addText(checklistItems.join('\n'), {
    x: rightX, y: 1.45, w: rightW, h: 1.8,
    fontSize: 9, color: COLORS.dark, lineSpacingMultiple: 1.5,
  });

  // Measurement method description
  slide.addText(ctx.isZh ? '测量方法:' : 'Measurement Method:', {
    x: rightX, y: 3.4, w: rightW, h: 0.25,
    fontSize: 10, color: COLORS.primary, bold: true,
  });

  const methodDesc = mod.description || data.ws.motion_description || data.ws.action_script || (ctx.isZh
    ? '1. 产品到位，触发拍照\n2. 图像采集与处理\n3. 结果判定与输出'
    : '1. Product arrives, trigger capture\n2. Image acquisition & processing\n3. Result judgment & output');

  slide.addShape('rect', {
    x: rightX, y: 3.7, w: rightW, h: 1.4,
    fill: { color: COLORS.white },
    line: { color: COLORS.border, width: 0.5 },
  });
  slide.addText(methodDesc, {
    x: rightX + 0.1, y: 3.75, w: rightW - 0.2, h: 1.3,
    fontSize: 8, color: COLORS.dark,
  });
}
