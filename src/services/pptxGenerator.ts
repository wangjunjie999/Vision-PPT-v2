import pptxgen from 'pptxgenjs';
import type PptxGenJS from 'pptxgenjs';
import { 
  fetchImageAsDataUri, 
  collectAllImageUrls, 
  preloadImagesInBatches 
} from './pptx/imagePreloader';
import {
  generateBasicInfoAndRequirementsSlide,
  generateProductSchematicSlide,
  generateLayoutAndOpticalSlide,
  generateModuleOpticalSlide,
  generateBOMSlide,
} from './pptx/workstationSlides';
import {
  COLORS,
  SLIDE_LAYOUT,
  MODULE_TYPE_LABELS,
  WS_TYPE_LABELS,
  TRIGGER_LABELS,
  PROCESS_STAGE_LABELS,
  COMPANY_NAME_ZH,
  COMPANY_NAME_EN,
  getWorkstationCode,
  getModuleDisplayName,
} from './pptx/slideLabels';

// Type definitions for pptxgenjs
type TableCell = { text: string; options?: Record<string, unknown> };
type TableRow = TableCell[];

// ==================== DATA INTERFACES ====================

interface RevisionHistoryItem {
  version: string;
  date: string;
  author: string;
  content: string;
}

interface AcceptanceCriteria {
  accuracy?: string;
  cycle_time?: string;
  compatible_sizes?: string;
}

interface ProjectData {
  id: string;
  code: string;
  name: string;
  customer: string;
  date: string | null;
  responsible: string | null;
  product_process: string | null;
  quality_strategy: string | null;
  environment: string[] | null;
  notes: string | null;
  revision_history?: RevisionHistoryItem[];
}

interface WorkstationData {
  id: string;
  code: string;
  name: string;
  type: string;
  cycle_time: number | null;
  product_dimensions: { length: number; width: number; height: number } | null;
  enclosed: boolean | null;
  process_stage?: string | null;
  observation_target?: string | null;
  acceptance_criteria?: AcceptanceCriteria | null;
  motion_description?: string | null;
  shot_count?: number | null;
  risk_notes?: string | null;
  action_script?: string | null;
}

interface LayoutData {
  workstation_id: string;
  conveyor_type: string | null;
  camera_count: number | null;
  lens_count: number | null;
  light_count: number | null;
  camera_mounts: string[] | null;
  mechanisms: string[] | null;
  selected_cameras: Array<{ id: string; brand: string; model: string; image_url?: string | null }> | null;
  selected_lenses: Array<{ id: string; brand: string; model: string; image_url?: string | null }> | null;
  selected_lights: Array<{ id: string; brand: string; model: string; image_url?: string | null }> | null;
  selected_controller: { id: string; brand: string; model: string; image_url?: string | null } | null;
  front_view_image_url?: string | null;
  side_view_image_url?: string | null;
  top_view_image_url?: string | null;
  front_view_saved?: boolean | null;
  side_view_saved?: boolean | null;
  top_view_saved?: boolean | null;
  width?: number | null;
  height?: number | null;
  depth?: number | null;
}

interface ModuleData {
  id: string;
  name: string;
  type: string;
  description?: string | null;
  workstation_id: string;
  trigger_type: string | null;
  roi_strategy: string | null;
  processing_time_limit: number | null;
  output_types: string[] | null;
  selected_camera: string | null;
  selected_lens: string | null;
  selected_light: string | null;
  selected_controller: string | null;
  schematic_image_url?: string | null;
  positioning_config?: Record<string, unknown> | null;
  defect_config?: Record<string, unknown> | null;
  ocr_config?: Record<string, unknown> | null;
  deep_learning_config?: Record<string, unknown> | null;
  measurement_config?: Record<string, unknown> | null;
}

interface HardwareData {
  cameras: Array<{
    id: string;
    brand: string;
    model: string;
    resolution: string;
    frame_rate: number;
    interface: string;
    sensor_size: string;
    image_url: string | null;
  }>;
  lenses: Array<{
    id: string;
    brand: string;
    model: string;
    focal_length: string;
    aperture: string;
    mount: string;
    image_url: string | null;
  }>;
  lights: Array<{
    id: string;
    brand: string;
    model: string;
    type: string;
    color: string;
    power: string;
    image_url: string | null;
  }>;
  controllers: Array<{
    id: string;
    brand: string;
    model: string;
    cpu: string;
    gpu: string | null;
    memory: string;
    storage: string;
    performance: string;
    image_url: string | null;
  }>;
}

interface AnnotationItem {
  id: string;
  type: 'rect' | 'circle' | 'arrow' | 'text' | 'point' | 'number';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  text?: string;
  color?: string;
  labelNumber?: number;
  label?: string;
  // New fields from AnnotationCanvas
  number?: number;
  name?: string;
  category?: string;
  description?: string;
}

interface AnnotationData {
  id: string;
  snapshot_url: string;
  annotations_json: AnnotationItem[];
  remark?: string | null;
  scope_type: 'workstation' | 'module';
  workstation_id?: string;
  module_id?: string;
}

interface ProductAssetData {
  id: string;
  workstation_id?: string | null;
  module_id?: string | null;
  scope_type: 'workstation' | 'module';
  preview_images: Array<{ url: string; name?: string }> | null;
  model_file_url?: string | null;
  detection_method?: string | null;
  product_models?: Array<{ name: string; spec: string }> | null;
  detection_requirements?: Array<{ content: string; highlight?: string | null }> | null;
}

interface ProductModelItem {
  name: string;
  spec: string;
}

interface DetectionRequirementItem {
  content: string;
  highlight?: string | null;
}

interface LogoInfo {
  data: string;
  width?: number;
  height?: number;
  position?: { x: number; y: number };
}

interface FooterInfo {
  hasPageNumber: boolean;
  hasDate: boolean;
  hasFooterText: boolean;
  footerText?: string;
}

interface ExtractedTemplateStyles {
  background?: { color?: string; data?: string };
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    text?: string;
  };
  fonts?: {
    title?: string;
    body?: string;
    titleEA?: string;
    bodyEA?: string;
  };
  logo?: LogoInfo;
  footer?: FooterInfo;
}

interface GenerationOptions {
  language: 'zh' | 'en';
  quality: 'standard' | 'high' | 'ultra';
  mode?: 'draft' | 'final';
}

type ProgressCallback = (progress: number, step: string, log: string) => void;

// Helper to create table cell
const cell = (text: string, opts?: Partial<TableCell>): TableCell => ({ text, options: opts });

// Helper to create table row from strings
const row = (cells: string[]): TableRow => cells.map(t => cell(t));

// Helper to create auto-page table options
function createAutoPageTableOptions(
  startY: number,
  masterName: string = 'MASTER_SLIDE'
): Record<string, unknown> {
  return {
    autoPage: true,
    autoPageRepeatHeader: true,
    autoPageHeaderRows: 1,
    autoPageCharWeight: -0.1,
    autoPageLineWeight: 0.1,
    newSlideStartY: SLIDE_LAYOUT.contentTop + 0.3,
    masterName,
  };
}

// ==================== MODULE PARAMETER HELPERS ====================

// Get defect detection parameters
function getDefectParams(config: Record<string, unknown>, isZh: boolean): TableRow[] {
  const rows: TableRow[] = [];
  
  if (config.defectClasses && Array.isArray(config.defectClasses) && config.defectClasses.length > 0) {
    rows.push(row([isZh ? '缺陷类别' : 'Defect Classes', (config.defectClasses as string[]).join('、')]));
  }
  if (config.minDefectSize) {
    rows.push(row([isZh ? '最小缺陷尺寸' : 'Min Defect Size', `${config.minDefectSize} mm`]));
  }
  if (config.missTolerance) {
    const toleranceLabels: Record<string, Record<string, string>> = {
      zero: { zh: '零容忍', en: 'Zero Tolerance' },
      low: { zh: '低容忍', en: 'Low' },
      medium: { zh: '中容忍', en: 'Medium' },
      high: { zh: '高容忍', en: 'High' },
    };
    rows.push(row([isZh ? '漏检容忍度' : 'Miss Tolerance', toleranceLabels[config.missTolerance as string]?.[isZh ? 'zh' : 'en'] || String(config.missTolerance)]));
  }
  if (config.detectionAreaLength || config.detectionAreaWidth) {
    rows.push(row([isZh ? '检测区域' : 'Detection Area', `${config.detectionAreaLength || '-'} × ${config.detectionAreaWidth || '-'} mm`]));
  }
  if (config.conveyorType) {
    const conveyorLabels: Record<string, Record<string, string>> = {
      belt: { zh: '皮带线', en: 'Belt' },
      roller: { zh: '滚筒线', en: 'Roller' },
      chain: { zh: '链条线', en: 'Chain' },
      static: { zh: '静态', en: 'Static' },
    };
    rows.push(row([isZh ? '输送方式' : 'Conveyor Type', conveyorLabels[config.conveyorType as string]?.[isZh ? 'zh' : 'en'] || String(config.conveyorType)]));
  }
  if (config.lineSpeed) {
    rows.push(row([isZh ? '线速度' : 'Line Speed', `${config.lineSpeed} m/min`]));
  }
  if (config.cameraCount || config.defectCameraCount) {
    rows.push(row([isZh ? '相机数量' : 'Camera Count', `${config.cameraCount || config.defectCameraCount} ${isZh ? '台' : ''}`]));
  }
  if (config.defectContrast) {
    const contrastLabels: Record<string, Record<string, string>> = {
      high: { zh: '高对比', en: 'High' },
      medium: { zh: '中对比', en: 'Medium' },
      low: { zh: '低对比', en: 'Low' },
    };
    rows.push(row([isZh ? '缺陷对比度' : 'Defect Contrast', contrastLabels[config.defectContrast as string]?.[isZh ? 'zh' : 'en'] || String(config.defectContrast)]));
  }
  if (config.materialReflectionLevel) {
    const reflectionLabels: Record<string, Record<string, string>> = {
      matte: { zh: '哑光', en: 'Matte' },
      semi: { zh: '半光泽', en: 'Semi-gloss' },
      glossy: { zh: '高光', en: 'Glossy' },
      mirror: { zh: '镜面', en: 'Mirror' },
    };
    rows.push(row([isZh ? '材质反光等级' : 'Reflection Level', reflectionLabels[config.materialReflectionLevel as string]?.[isZh ? 'zh' : 'en'] || String(config.materialReflectionLevel)]));
  }
  if (config.allowedMissRate !== undefined) {
    rows.push(row([isZh ? '允许漏检率' : 'Allowed Miss Rate', `${config.allowedMissRate}%`]));
  }
  if (config.allowedFalseRate !== undefined) {
    rows.push(row([isZh ? '允许误检率' : 'Allowed False Rate', `${config.allowedFalseRate}%`]));
  }
  if (config.confidenceThreshold !== undefined) {
    rows.push(row([isZh ? '置信度阈值' : 'Confidence Threshold', `${config.confidenceThreshold}%`]));
  }
  
  return rows;
}

// Get measurement parameters
function getMeasurementParams(config: Record<string, unknown>, isZh: boolean): TableRow[] {
  const rows: TableRow[] = [];
  
  // Measurement items
  if (config.measurementItems && Array.isArray(config.measurementItems) && config.measurementItems.length > 0) {
    rows.push(row([isZh ? '【测量项目】' : '[Measurement Items]', '']));
    (config.measurementItems as Array<{ name: string; dimType: string; nominal: number; upperTol: number; lowerTol: number; unit: string }>).forEach((item, idx) => {
      const dimTypeLabels: Record<string, string> = {
        length: isZh ? '长度' : 'Length',
        diameter: isZh ? '直径' : 'Diameter',
        radius: isZh ? '半径' : 'Radius',
        angle: isZh ? '角度' : 'Angle',
        distance: isZh ? '距离' : 'Distance',
        gap: isZh ? '间隙' : 'Gap',
      };
      rows.push(row([
        `${idx + 1}. ${item.name || (isZh ? '测量项' : 'Item')}`,
        `${dimTypeLabels[item.dimType] || item.dimType}: ${item.nominal} (+${item.upperTol}/-${item.lowerTol}) ${item.unit || 'mm'}`
      ]));
    });
  }
  
  if (config.measurementFieldOfView) {
    rows.push(row([isZh ? '视野大小' : 'Field of View', `${config.measurementFieldOfView} mm`]));
  }
  if (config.measurementResolution) {
    rows.push(row([isZh ? '分辨率' : 'Resolution', `${config.measurementResolution} mm/pixel`]));
  }
  if (config.targetAccuracy) {
    rows.push(row([isZh ? '目标精度' : 'Target Accuracy', `±${config.targetAccuracy} mm`]));
  }
  if (config.systemAccuracy) {
    rows.push(row([isZh ? '系统精度' : 'System Accuracy', `±${config.systemAccuracy} mm`]));
  }
  if (config.calibrationMethod) {
    const calibrationLabels: Record<string, Record<string, string>> = {
      plane: { zh: '平面标定', en: 'Plane' },
      multipoint: { zh: '多点标定', en: 'Multi-point' },
      ruler: { zh: '标尺标定', en: 'Ruler' },
    };
    rows.push(row([isZh ? '标定方式' : 'Calibration Method', calibrationLabels[config.calibrationMethod as string]?.[isZh ? 'zh' : 'en'] || String(config.calibrationMethod)]));
  }
  if (config.grr) {
    rows.push(row(['GR&R', `${config.grr}%`]));
  }
  
  return rows;
}

// Get OCR parameters
function getOCRParams(config: Record<string, unknown>, isZh: boolean): TableRow[] {
  const rows: TableRow[] = [];
  
  if (config.charTypes && Array.isArray(config.charTypes)) {
    const typeLabels: Record<string, string> = {
      printed: isZh ? '印刷字符' : 'Printed',
      engraved: isZh ? '雕刻字符' : 'Engraved',
      dotMatrix: isZh ? '点阵字符' : 'Dot Matrix',
      handwritten: isZh ? '手写字符' : 'Handwritten',
    };
    rows.push(row([isZh ? '字符类型' : 'Char Types', (config.charTypes as string[]).map(t => typeLabels[t] || t).join('、')]));
  }
  if (config.charType) {
    const typeLabels: Record<string, string> = {
      printed: isZh ? '印刷字符' : 'Printed',
      engraved: isZh ? '雕刻字符' : 'Engraved',
      dotMatrix: isZh ? '点阵字符' : 'Dot Matrix',
      handwritten: isZh ? '手写字符' : 'Handwritten',
    };
    rows.push(row([isZh ? '字符类型' : 'Char Type', typeLabels[config.charType as string] || String(config.charType)]));
  }
  if (config.minCharHeight) {
    rows.push(row([isZh ? '最小字符高度' : 'Min Char Height', `${config.minCharHeight} mm`]));
  }
  if (config.charWidth) {
    rows.push(row([isZh ? '字符宽度' : 'Char Width', `${config.charWidth} mm`]));
  }
  if (config.expectedCharCount || config.charCount) {
    rows.push(row([isZh ? '预期字符数' : 'Expected Char Count', String(config.expectedCharCount || config.charCount)]));
  }
  if (config.charSet) {
    const charSetLabels: Record<string, string> = {
      numeric: isZh ? '纯数字' : 'Numeric',
      alpha: isZh ? '纯字母' : 'Alpha',
      alphanumeric: isZh ? '字母数字混合' : 'Alphanumeric',
      custom: isZh ? '自定义' : 'Custom',
    };
    rows.push(row([isZh ? '字符集' : 'Char Set', charSetLabels[config.charSet as string] || String(config.charSet)]));
  }
  if (config.contentRule) {
    rows.push(row([isZh ? '内容规则' : 'Content Rule', String(config.contentRule)]));
  }
  if (config.charContrast) {
    rows.push(row([isZh ? '字符对比度' : 'Char Contrast', String(config.charContrast)]));
  }
  if (config.charFormat) {
    rows.push(row([isZh ? '字符格式' : 'Char Format', String(config.charFormat)]));
  }
  if (config.validationRules) {
    rows.push(row([isZh ? '校验规则' : 'Validation Rules', String(config.validationRules)]));
  }
  if (config.charAreaWidth || config.charAreaHeight) {
    rows.push(row([isZh ? '字符区域' : 'Char Area', `${config.charAreaWidth || '-'} × ${config.charAreaHeight || '-'} mm`]));
  }
  if (config.minStrokeWidth) {
    rows.push(row([isZh ? '最小笔画宽度' : 'Min Stroke Width', `${config.minStrokeWidth} mm`]));
  }
  if (config.allowedRotation) {
    rows.push(row([isZh ? '允许旋转角度' : 'Allowed Rotation', `±${config.allowedRotation}°`]));
  }
  if (config.allowedDamage) {
    const damageLabels: Record<string, string> = {
      none: isZh ? '无损坏' : 'None',
      slight: isZh ? '轻微' : 'Slight',
      moderate: isZh ? '中等' : 'Moderate',
      severe: isZh ? '严重' : 'Severe',
    };
    rows.push(row([isZh ? '允许损坏程度' : 'Allowed Damage', damageLabels[config.allowedDamage as string] || String(config.allowedDamage)]));
  }
  
  return rows;
}

// Get positioning parameters
function getPositioningParams(config: Record<string, unknown>, isZh: boolean): TableRow[] {
  const rows: TableRow[] = [];
  
  if (config.guidingMode) {
    const modeLabels: Record<string, string> = {
      '2d': isZh ? '2D定位' : '2D',
      '2.5d': isZh ? '2.5D定位' : '2.5D',
      '3d': isZh ? '3D定位' : '3D',
    };
    rows.push(row([isZh ? '引导模式' : 'Guiding Mode', modeLabels[config.guidingMode as string] || String(config.guidingMode)]));
  }
  if (config.guidingMechanism) {
    const mechLabels: Record<string, string> = {
      robot: isZh ? '机器人' : 'Robot',
      gantry: isZh ? '龙门架' : 'Gantry',
      scara: isZh ? 'SCARA' : 'SCARA',
      delta: isZh ? 'Delta' : 'Delta',
    };
    rows.push(row([isZh ? '引导机构' : 'Guiding Mechanism', mechLabels[config.guidingMechanism as string] || String(config.guidingMechanism)]));
  }
  if (config.targetType) {
    const typeLabels: Record<string, string> = {
      edge: isZh ? '边缘' : 'Edge',
      corner: isZh ? '角点' : 'Corner',
      center: isZh ? '中心' : 'Center',
      hole: isZh ? '孔' : 'Hole',
      pattern: isZh ? '图案' : 'Pattern',
    };
    rows.push(row([isZh ? '定位目标类型' : 'Target Type', typeLabels[config.targetType as string] || String(config.targetType)]));
  }
  if (config.accuracyRequirement) {
    rows.push(row([isZh ? '定位精度要求' : 'Accuracy Requirement', `±${config.accuracyRequirement} mm`]));
  }
  if (config.repeatability) {
    rows.push(row([isZh ? '重复精度' : 'Repeatability', `±${config.repeatability} mm`]));
  }
  if (config.errorToleranceX || config.errorToleranceY) {
    rows.push(row([isZh ? '误差容忍(X/Y)' : 'Error Tolerance (X/Y)', `±${config.errorToleranceX || '-'} / ±${config.errorToleranceY || '-'} mm`]));
  }
  if (config.calibrationMethod) {
    const calibLabels: Record<string, string> = {
      '9point': isZh ? '九点标定' : '9-Point',
      '4point': isZh ? '四点标定' : '4-Point',
      handeye: isZh ? '手眼标定' : 'Hand-Eye',
    };
    rows.push(row([isZh ? '标定方式' : 'Calibration Method', calibLabels[config.calibrationMethod as string] || String(config.calibrationMethod)]));
  }
  if (config.outputCoordinate) {
    rows.push(row([isZh ? '输出坐标系' : 'Output Coordinate', String(config.outputCoordinate)]));
  }
  if (config.calibrationCycle) {
    rows.push(row([isZh ? '标定周期' : 'Calibration Cycle', String(config.calibrationCycle)]));
  }
  if (config.accuracyAcceptance) {
    rows.push(row([isZh ? '精度验收标准' : 'Accuracy Acceptance', String(config.accuracyAcceptance)]));
  }
  if (config.targetFeatures) {
    rows.push(row([isZh ? '目标特征' : 'Target Features', String(config.targetFeatures)]));
  }
  if (config.targetCount) {
    rows.push(row([isZh ? '目标数量' : 'Target Count', String(config.targetCount)]));
  }
  if (config.occlusionTolerance) {
    rows.push(row([isZh ? '遮挡容忍' : 'Occlusion Tolerance', `${config.occlusionTolerance}%`]));
  }
  
  return rows;
}

// Get deep learning parameters
function getDeepLearningParams(config: Record<string, unknown>, isZh: boolean): TableRow[] {
  const rows: TableRow[] = [];
  
  if (config.taskType) {
    const taskLabels: Record<string, string> = {
      classification: isZh ? '分类' : 'Classification',
      detection: isZh ? '目标检测' : 'Detection',
      segmentation: isZh ? '语义分割' : 'Segmentation',
      instance: isZh ? '实例分割' : 'Instance Segmentation',
      anomaly: isZh ? '异常检测' : 'Anomaly Detection',
    };
    rows.push(row([isZh ? '任务类型' : 'Task Type', taskLabels[config.taskType as string] || String(config.taskType)]));
  }
  if (config.targetClasses && Array.isArray(config.targetClasses) && config.targetClasses.length > 0) {
    rows.push(row([isZh ? '目标类别' : 'Target Classes', (config.targetClasses as string[]).join('、')]));
  }
  if (config.detectionClasses && Array.isArray(config.detectionClasses)) {
    rows.push(row([isZh ? '检测类别' : 'Detection Classes', (config.detectionClasses as string[]).join('、')]));
  }
  if (config.modelType) {
    rows.push(row([isZh ? '模型类型' : 'Model Type', String(config.modelType)]));
  }
  if (config.roiWidth || config.roiHeight) {
    rows.push(row([isZh ? 'ROI尺寸' : 'ROI Size', `${config.roiWidth || '-'} × ${config.roiHeight || '-'} px`]));
  }
  if (config.deployTarget) {
    const targetLabels: Record<string, string> = {
      cpu: 'CPU',
      gpu: 'GPU',
      edge: isZh ? '边缘设备' : 'Edge Device',
    };
    rows.push(row([isZh ? '部署目标' : 'Deploy Target', targetLabels[config.deployTarget as string] || String(config.deployTarget)]));
  }
  if (config.inferenceTimeLimit) {
    rows.push(row([isZh ? '推理时限' : 'Inference Time Limit', `${config.inferenceTimeLimit} ms`]));
  }
  if (config.confidenceThreshold !== undefined) {
    rows.push(row([isZh ? '置信度阈值' : 'Confidence Threshold', `${config.confidenceThreshold}%`]));
  }
  if (config.trainingSampleCount || config.sampleEstimate) {
    rows.push(row([isZh ? '训练样本量' : 'Training Samples', String(config.trainingSampleCount || config.sampleEstimate)]));
  }
  
  return rows;
}

// Get imaging parameters (common to all module types)
function getImagingParams(config: Record<string, unknown>, isZh: boolean): TableRow[] {
  const rows: TableRow[] = [];
  
  if (config.workingDistance) {
    rows.push(row([isZh ? '工作距离' : 'Working Distance', `${config.workingDistance} mm`]));
  }
  if (config.fieldOfView) {
    rows.push(row([isZh ? '视场范围' : 'Field of View', `${config.fieldOfView} mm`]));
  }
  if (config.fieldOfViewWidth && config.fieldOfViewHeight) {
    rows.push(row([isZh ? '视场范围(宽×高)' : 'FOV (W×H)', `${config.fieldOfViewWidth} × ${config.fieldOfViewHeight} mm`]));
  }
  if (config.resolutionPerPixel) {
    rows.push(row([isZh ? '分辨率' : 'Resolution', `${config.resolutionPerPixel} mm/pixel`]));
  }
  if (config.depthOfField) {
    rows.push(row([isZh ? '景深' : 'Depth of Field', `${config.depthOfField} mm`]));
  }
  if (config.exposure) {
    rows.push(row([isZh ? '曝光时间' : 'Exposure', `${config.exposure} μs`]));
  }
  if (config.gain) {
    rows.push(row([isZh ? '增益' : 'Gain', `${config.gain} dB`]));
  }
  if (config.triggerDelay) {
    rows.push(row([isZh ? '触发延迟' : 'Trigger Delay', `${config.triggerDelay} ms`]));
  }
  if (config.lightAngle) {
    rows.push(row([isZh ? '光源角度' : 'Light Angle', `${config.lightAngle}°`]));
  }
  if (config.lightDistance) {
    rows.push(row([isZh ? '光源距离' : 'Light Distance', `${config.lightDistance} mm`]));
  }
  if (config.lightMode) {
    const modeLabels: Record<string, string> = {
      continuous: isZh ? '常亮' : 'Continuous',
      strobe: isZh ? '频闪' : 'Strobe',
    };
    rows.push(row([isZh ? '光源模式' : 'Light Mode', modeLabels[config.lightMode as string] || String(config.lightMode)]));
  }
  if (config.lensAperture) {
    rows.push(row([isZh ? '镜头光圈' : 'Lens Aperture', `F${config.lensAperture}`]));
  }
  
  return rows;
}

// ==================== MAIN GENERATOR ====================

export async function generatePPTX(
  project: ProjectData,
  workstations: WorkstationData[],
  layouts: LayoutData[],
  modules: ModuleData[],
  options: GenerationOptions,
  onProgress: ProgressCallback,
  hardware?: HardwareData,
  readinessResult?: { missing: Array<{ level: string; name: string; missing: string[] }>; warnings: Array<{ level: string; name: string; warning: string }> },
  annotations?: AnnotationData[],
  productAssets?: ProductAssetData[]
): Promise<Blob> {
  const pptx = new pptxgen();
  const isZh = options.language === 'zh';

  // Use hardcoded corporate colors directly
  const activeColors = { ...COLORS };

  // Set presentation properties
  pptx.author = project.responsible || 'Vision System';
  pptx.title = `${project.name} - ${isZh ? '视觉系统方案' : 'Vision System Proposal'}`;
  pptx.subject = isZh ? '机器视觉系统技术方案' : 'Machine Vision System Technical Proposal';
  pptx.company = isZh ? COMPANY_NAME_ZH : COMPANY_NAME_EN;

  // Explicitly set 16:9 layout
  pptx.layout = SLIDE_LAYOUT.name;

  // Define master slide with hardcoded corporate style
  type MasterObject = NonNullable<PptxGenJS.SlideMasterProps['objects']>[number];
  const footerY = SLIDE_LAYOUT.height - SLIDE_LAYOUT.margin.bottom;
  
  const masterObjects: MasterObject[] = [];
  
  // Load company logo for header
  let companyLogoData: string | null = null;
  const logoUrl = `${window.location.origin}/ppt-covers/tech-shine-logo.png`;
  try {
    companyLogoData = await fetchImageAsDataUri(logoUrl);
  } catch (err) {
    console.warn('Failed to load company logo:', err);
  }
  
  // === Corporate VI Style: Deep navy header bar + white background ===
  masterObjects.push(
    // Header: full-width deep navy blue bar (0.45" tall)
    { rect: { x: 0, y: 0, w: '100%', h: 0.45, fill: { color: activeColors.primary } } },
    // Footer: white bar
    { rect: { x: 0, y: footerY, w: '100%', h: SLIDE_LAYOUT.margin.bottom, fill: { color: activeColors.white } } },
    // Footer: thin deep blue accent line
    { rect: { x: 0, y: footerY, w: '100%', h: 0.02, fill: { color: activeColors.primary } } },
    // Company name in footer
    { text: { text: isZh ? COMPANY_NAME_ZH : COMPANY_NAME_EN, options: { x: 0.3, y: footerY + 0.06, w: 4, h: 0.18, fontSize: 7, color: activeColors.dark } } },
    // Customer name in footer (right aligned)
    { text: { text: project.customer, options: { x: SLIDE_LAYOUT.width - 2.5, y: footerY + 0.06, w: 2.2, h: 0.18, fontSize: 7, color: activeColors.dark, align: 'right' } } },
    // Content area border frame — thin dark blue outline (matching template)
    { rect: { x: 0.25, y: 0.52, w: SLIDE_LAYOUT.width - 0.5, h: footerY - 0.57, fill: { type: 'none' } as any, line: { color: activeColors.primary, width: 0.75 } } },
  );
  
  // Add company logo to header bar (right side, white logo on navy)
  if (companyLogoData) {
    masterObjects.push({
      image: { 
        x: SLIDE_LAYOUT.width - 1.8,
        y: 0.05,
        w: 1.5,
        h: 0.35,
        data: companyLogoData,
      }
    });
  }

  pptx.defineSlideMaster({
    title: 'MASTER_SLIDE',
    background: { color: activeColors.background },
    objects: masterObjects,
  });

  let progress = 5;
  onProgress(progress, isZh ? '初始化生成器...' : 'Initializing generator...', isZh ? '开始PPT生成' : 'Starting PPT generation');

  // ========== SLIDE 1: Cover - Full image, no modifications ==========
  progress = 8;
  onProgress(progress, isZh ? '生成封面页...' : 'Generating cover slide...', isZh ? '生成封面页' : 'Cover slide');
  
  const coverSlide = pptx.addSlide();
  
  // Use Tech-Shine cover background image - display as-is, no text overlay
  const coverBgUrl = `${window.location.origin}/ppt-covers/tech-shine-cover.png`;
  let coverBgData: string | null = null;
  try {
    coverBgData = await fetchImageAsDataUri(coverBgUrl);
  } catch (err) {
    console.warn('Failed to load cover background image:', err);
  }
  
  if (coverBgData) {
    // Full slide background with company cover image - no modifications
    coverSlide.addImage({
      data: coverBgData,
      x: 0, y: 0, w: '100%', h: '100%',
      sizing: { type: 'cover', w: 10, h: 5.625 },
    });
  } else {
    // Fallback: simple cover with company name if image fails to load
    coverSlide.addShape('rect', {
      x: 0, y: 0, w: '100%', h: '100%',
      fill: { color: COLORS.background },
    });
    
    coverSlide.addText(isZh ? '德星云智能' : 'TECH-SHINE', {
      x: 0.5, y: 1.5, w: 9, h: 0.6,
      fontSize: 36, color: COLORS.primary, bold: true, align: 'center',
    });
    
    coverSlide.addText(isZh ? COMPANY_NAME_ZH : COMPANY_NAME_EN, {
      x: 0.5, y: 2.2, w: 9, h: 0.4,
      fontSize: 14, color: COLORS.dark, align: 'center',
    });
  }

  // ========== SLIDE 2: Project Description (项目说明) ==========
  progress = 8;
  onProgress(progress, isZh ? '生成项目说明页...' : 'Generating project description...', isZh ? '项目说明页' : 'Project description');

  const descSlide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
  
  // Title overlaid on navy header bar
  descSlide.addText(isZh ? '项目说明' : 'Project Description', {
    x: 0.4, y: 0.05, w: 5, h: 0.38,
    fontSize: 18, color: COLORS.white, bold: true,
  });
  // Sub-header bar (medium blue)
  descSlide.addShape('rect', {
    x: 0, y: 0.45, w: '100%', h: 0.22,
    fill: { color: '2E75B6' },
  });
  descSlide.addText(isZh ? '项目基本信息' : 'Project Information', {
    x: 0, y: 0.45, w: '100%', h: 0.22,
    fontSize: 10, color: COLORS.white, align: 'center', valign: 'middle',
  });

  // Project basic info table
  const projectExt = project as ProjectData & { production_line?: string; description?: string };
  
  const projectInfoRows: TableRow[] = [
    row([isZh ? '项目编号' : 'Project Code', project.code]),
    row([isZh ? '项目名称' : 'Project Name', project.name]),
    row([isZh ? '客户名称' : 'Customer', project.customer]),
    row([isZh ? '产线名称' : 'Production Line', projectExt.production_line || '-']),
    row([isZh ? '负责人' : 'Responsible', project.responsible || '-']),
    row([isZh ? '项目日期' : 'Date', project.date || '-']),
  ];

  descSlide.addTable(projectInfoRows, {
    x: SLIDE_LAYOUT.contentLeft, y: SLIDE_LAYOUT.contentTop + 0.45, w: SLIDE_LAYOUT.contentWidth,
    fontFace: 'Arial',
    fontSize: 9,
    colW: [1.5, 7.7],
    border: { pt: 0.5, color: COLORS.border },
    fill: { color: COLORS.white },
    valign: 'middle',
  });

  // Project description
  const projectDesc = projectExt.description || '';
  if (projectDesc) {
    descSlide.addText(isZh ? '【项目简介】' : '[Project Overview]', {
      x: SLIDE_LAYOUT.contentLeft, y: 2.55, w: SLIDE_LAYOUT.contentWidth, h: 0.28,
      fontSize: 11, color: COLORS.primary, bold: true,
    });
    descSlide.addShape('rect', {
      x: SLIDE_LAYOUT.contentLeft, y: 2.88, w: SLIDE_LAYOUT.contentWidth, h: 0.9,
      fill: { color: 'F5F5F5' },
      line: { color: COLORS.border, width: 0.5 },
    });
    descSlide.addText(projectDesc, {
      x: SLIDE_LAYOUT.contentLeft + 0.1, y: 2.95, w: SLIDE_LAYOUT.contentWidth - 0.2, h: 0.75,
      fontSize: 9, color: COLORS.dark,
    });
  }

  // Workstation overview table (merged from former Project Overview slide)
  const wsOverviewY = projectDesc ? 4.0 : 2.55;
  descSlide.addText(isZh ? '工位清单' : 'Workstation List', {
    x: SLIDE_LAYOUT.contentLeft, y: wsOverviewY, w: SLIDE_LAYOUT.contentWidth, h: 0.28,
    fontSize: 11, color: COLORS.dark, bold: true,
  });

  const wsTableHeader: TableRow = row([
    isZh ? '编号' : 'Code',
    isZh ? '名称' : 'Name',
    isZh ? '类型' : 'Type',
    isZh ? '节拍(s)' : 'Cycle(s)',
    isZh ? '模块数' : 'Modules',
  ]);

  const wsTableRows: TableRow[] = workstations.map((ws, index) => row([
    getWorkstationCode(project.code, index),
    ws.name,
    WS_TYPE_LABELS[ws.type]?.[options.language] || ws.type,
    ws.cycle_time?.toString() || '-',
    modules.filter(m => m.workstation_id === ws.id).length.toString(),
  ]));

  descSlide.addTable([wsTableHeader, ...wsTableRows], {
    x: SLIDE_LAYOUT.contentLeft, y: wsOverviewY + 0.32, w: SLIDE_LAYOUT.contentWidth,
    fontFace: 'Arial',
    fontSize: 8,
    colW: [1.1, 3.2, 1.4, 1.1, 1.1],
    border: { pt: 0.5, color: COLORS.border },
    fill: { color: COLORS.white },
    valign: 'middle',
    align: 'center',
    ...createAutoPageTableOptions(wsOverviewY + 0.32),
  });

  // ========== SLIDE 3: Revision History ==========
  progress = 10;
  onProgress(progress, isZh ? '生成变更履历页...' : 'Generating revision history...', isZh ? '变更履历页' : 'Revision History');
  
  const revisionSlide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
  
  // Title text overlaid on the navy header bar (white text)
  revisionSlide.addText(isZh ? '变更履历' : 'Revision History', {
    x: 0.4, y: 0.05, w: 5, h: 0.38,
    fontSize: 18, color: COLORS.white, bold: true,
  });

  // Subtitle bar below header (medium blue)
  revisionSlide.addShape('rect', {
    x: 0, y: 0.45, w: '100%', h: 0.22,
    fill: { color: '2E75B6' },
  });
  revisionSlide.addText(isZh ? '变更表' : 'Change Log', {
    x: 0, y: 0.45, w: '100%', h: 0.22,
    fontSize: 10, color: COLORS.white, align: 'center', valign: 'middle',
  });

  // Table title row
  const tableTitleRow: TableRow = [
    { text: isZh ? '发行/变更履历表' : 'Release/Change History', options: { colspan: 6, align: 'center', bold: true, fill: { color: '2E75B6' }, color: COLORS.white, fontSize: 10 } as any },
  ];

  const revisionHeader: TableRow = [
    cell(isZh ? '编号' : 'No.', { fill: { color: '2E75B6' }, color: COLORS.white, bold: true, align: 'center', fontSize: 9 } as any),
    cell(isZh ? '版本' : 'Version', { fill: { color: '2E75B6' }, color: COLORS.white, bold: true, align: 'center', fontSize: 9 } as any),
    cell(isZh ? '发行/变更描述' : 'Description', { fill: { color: '2E75B6' }, color: COLORS.white, bold: true, align: 'center', fontSize: 9 } as any),
    cell(isZh ? '客户规格书版本' : 'Customer Spec', { fill: { color: '2E75B6' }, color: COLORS.white, bold: true, align: 'center', fontSize: 9 } as any),
    cell(isZh ? '日期' : 'Date', { fill: { color: '2E75B6' }, color: COLORS.white, bold: true, align: 'center', fontSize: 9 } as any),
    cell(isZh ? '发行/变更人' : 'Author', { fill: { color: '2E75B6' }, color: COLORS.white, bold: true, align: 'center', fontSize: 9 } as any),
  ];

  const revisionHistory = project.revision_history || [];
  const revisionRows: TableRow[] = revisionHistory.length > 0
    ? revisionHistory.map((item, idx) => row([
        String(idx + 1),
        item.version,
        item.content,
        '——',
        item.date,
        item.author,
      ]))
    : [
        row(['1', 'V1.0', isZh ? '原始版本发行' : 'Initial release', '——', project.date || '-', project.responsible || '-']),
        row(['2', '', '', '', '', '']),
        row(['3', '', '', '', '', '']),
      ];

  revisionSlide.addTable([tableTitleRow, revisionHeader, ...revisionRows], {
    x: SLIDE_LAYOUT.contentLeft, 
    y: 0.85, 
    w: SLIDE_LAYOUT.contentWidth,
    fontFace: 'Arial',
    fontSize: 9,
    colW: [0.6, 0.7, 3.2, 1.6, 1.2, 1.2],
    border: { pt: 0.5, color: COLORS.border },
    fill: { color: COLORS.white },
    valign: 'middle',
    align: 'center',
    ...createAutoPageTableOptions(0.85),
  });

  // ========== SLIDE 4: Camera Installation Direction Guide ==========
  progress = 12;
  onProgress(progress, isZh ? '生成相机安装说明页...' : 'Generating camera mount guide...', isZh ? '相机安装方向说明' : 'Camera Mount Guide');
  
  const mountGuideSlide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
  
  mountGuideSlide.addText(isZh ? '相机安装方向说明' : 'Camera Installation Direction Guide', {
    x: 0.4, y: 0.05, w: 7.5, h: 0.38,
    fontSize: 18, color: COLORS.white, bold: true,
  });
  // Sub-header bar (medium blue, empty decorative bar like 图92)
  mountGuideSlide.addShape('rect', {
    x: 0, y: 0.45, w: '100%', h: 0.22,
    fill: { color: '2E75B6' },
  });

  // Draw three camera mount diagrams
  const mountTypes = [
    { name: isZh ? '顶视 (Top)' : 'Top View', desc: isZh ? '相机垂直向下拍摄，适用于平面检测、尺寸测量' : 'Camera facing down, for surface inspection', icon: '⬇️', color: COLORS.primary },
    { name: isZh ? '侧视 (Side)' : 'Side View', desc: isZh ? '相机水平拍摄，适用于侧面检测、高度测量' : 'Camera horizontal, for side inspection', icon: '➡️', color: COLORS.accent },
    { name: isZh ? '斜视 (Angled)' : 'Angled View', desc: isZh ? '相机倾斜拍摄，适用于立体特征、反光表面' : 'Camera tilted, for 3D features', icon: '↘️', color: COLORS.warning },
  ];

  const cardWidth = 2.9;
  const cardHeight = 1.8;
  const cardY = SLIDE_LAYOUT.contentTop + 0.5;

  mountTypes.forEach((mount, i) => {
    const x = SLIDE_LAYOUT.contentLeft + i * 3.1;
    mountGuideSlide.addShape('rect', {
      x, y: cardY, w: cardWidth, h: cardHeight,
      fill: { color: COLORS.white },
      shadow: { type: 'outer', blur: 3, offset: 2, angle: 45, opacity: 0.15 },
    });
    mountGuideSlide.addText(mount.icon, {
      x, y: cardY + 0.1, w: cardWidth, h: 0.5,
      fontSize: 24, align: 'center',
    });
    mountGuideSlide.addText(mount.name, {
      x, y: cardY + 0.65, w: cardWidth, h: 0.28,
      fontSize: 11, bold: true, color: mount.color, align: 'center',
    });
    mountGuideSlide.addText(mount.desc, {
      x: x + 0.1, y: cardY + 0.95, w: cardWidth - 0.2, h: 0.7,
      fontSize: 7, color: COLORS.secondary, align: 'center',
    });
  });

  // Project mount summary
  const allMounts = layouts.flatMap(l => {
    const mounts = l.camera_mounts;
    return Array.isArray(mounts) ? mounts : [];
  });
  const mountCounts = {
    top: allMounts.filter(m => m === 'top').length,
    side: allMounts.filter(m => m === 'side').length,
    angled: allMounts.filter(m => m === 'angled').length,
  };

  const summaryY = cardY + cardHeight + 0.3;
  mountGuideSlide.addText(isZh ? '本项目相机安装汇总' : 'Project Camera Mount Summary', {
    x: SLIDE_LAYOUT.contentLeft, y: summaryY, w: SLIDE_LAYOUT.contentWidth, h: 0.3,
    fontSize: 11, color: COLORS.dark, bold: true,
  });

  const mountSummaryRows: TableRow[] = [
    row([isZh ? '安装方式' : 'Mount Type', isZh ? '数量' : 'Count', isZh ? '占比' : 'Ratio']),
    row([isZh ? '顶视' : 'Top', mountCounts.top.toString(), allMounts.length > 0 ? `${Math.round(mountCounts.top / allMounts.length * 100)}%` : '-']),
    row([isZh ? '侧视' : 'Side', mountCounts.side.toString(), allMounts.length > 0 ? `${Math.round(mountCounts.side / allMounts.length * 100)}%` : '-']),
    row([isZh ? '斜视' : 'Angled', mountCounts.angled.toString(), allMounts.length > 0 ? `${Math.round(mountCounts.angled / allMounts.length * 100)}%` : '-']),
  ];

  mountGuideSlide.addTable(mountSummaryRows, {
    x: SLIDE_LAYOUT.contentLeft, y: summaryY + 0.35, w: 4, h: 1.1,
    fontFace: 'Arial',
    fontSize: 9,
    colW: [1.3, 1.3, 1.4],
    border: { pt: 0.5, color: COLORS.border },
    fill: { color: COLORS.white },
    valign: 'middle',
    align: 'center',
  });

  // (Old slides 4.5+5+6 removed - content merged into slide 2 above)

  // ========== WORKSTATION SLIDES (Dynamic pages per workstation) ==========
  // Order: a.基本信息+检测要求 → b.产品截图标注 → c.机械三视图 → d.光学方案×N → e.BOM
  const totalWsProgress = 65;
  const progressPerWs = totalWsProgress / Math.max(workstations.length, 1);
  
  for (let i = 0; i < workstations.length; i++) {
    const ws = workstations[i];
    const wsLayout = layouts.find(l => l.workstation_id === ws.id) || null;
    const wsModules = modules.filter(m => m.workstation_id === ws.id);
    const wsCode = getWorkstationCode(project.code, i);
    
    const wsAnnotations = annotations?.filter(a => a.scope_type === 'workstation' && a.workstation_id === ws.id) || [];
    const wsProductAsset = productAssets?.find(a => a.scope_type === 'workstation' && a.workstation_id === ws.id);

    const wsBaseProgress = 20 + i * progressPerWs;
    const moduleCount = Math.max(wsModules.length, 1);
    const totalSteps = 3 + moduleCount + 1; // basic+product+threeview + N modules + BOM
    const stepIncrement = progressPerWs / totalSteps;
    
    onProgress(
      wsBaseProgress, 
      `${isZh ? '处理工位' : 'Processing workstation'} (${i + 1}/${workstations.length}): ${ws.name}`,
      `[WORKSTATION:${ws.name}:${i + 1}/${workstations.length}] ${isZh ? '开始生成工位页' : 'Starting workstation slides'}`
    );

    const ctx = {
      pptx,
      isZh,
      wsCode,
      wsName: ws.name,
      responsible: project.responsible,
    };

    const slideData = {
      ws: {
        id: ws.id,
        name: ws.name,
        type: ws.type,
        cycle_time: ws.cycle_time,
        product_dimensions: ws.product_dimensions,
        enclosed: ws.enclosed,
        process_stage: ws.process_stage,
        observation_target: ws.observation_target,
        acceptance_criteria: ws.acceptance_criteria,
        motion_description: ws.motion_description,
        shot_count: ws.shot_count,
        risk_notes: ws.risk_notes,
        action_script: ws.action_script,
        description: (ws as unknown as Record<string, unknown>).description as string | null,
      },
      layout: wsLayout ? {
        workstation_id: wsLayout.workstation_id,
        conveyor_type: wsLayout.conveyor_type,
        camera_count: wsLayout.camera_count,
        camera_mounts: wsLayout.camera_mounts,
        mechanisms: wsLayout.mechanisms,
        front_view_image_url: wsLayout.front_view_image_url,
        side_view_image_url: wsLayout.side_view_image_url,
        top_view_image_url: wsLayout.top_view_image_url,
        primary_view: (wsLayout as any).primary_view || 'front',
        auxiliary_view: (wsLayout as any).auxiliary_view || 'side',
        layout_description: (wsLayout as any).layout_description || '',
        width: wsLayout.width,
        height: wsLayout.height,
        depth: wsLayout.depth,
        selected_cameras: wsLayout.selected_cameras,
        selected_lenses: wsLayout.selected_lenses,
        selected_lights: wsLayout.selected_lights,
        selected_controller: wsLayout.selected_controller,
      } : null,
      modules: wsModules.map(m => ({
        id: m.id,
        name: m.name,
        type: m.type,
        description: m.description,
        trigger_type: m.trigger_type,
        processing_time_limit: m.processing_time_limit,
        schematic_image_url: m.schematic_image_url,
        positioning_config: m.positioning_config,
        defect_config: m.defect_config,
        measurement_config: m.measurement_config,
        ocr_config: m.ocr_config,
        deep_learning_config: m.deep_learning_config,
        output_types: m.output_types,
        roi_strategy: m.roi_strategy,
      })),
      annotations: wsAnnotations.map(a => ({
        snapshot_url: a.snapshot_url,
        annotations_json: a.annotations_json,
        remark: a.remark,
      })),
      productAsset: wsProductAsset ? {
        preview_images: wsProductAsset.preview_images,
        detection_method: wsProductAsset.detection_method,
        product_models: wsProductAsset.product_models as Array<{ name: string; spec: string }> | null,
        detection_requirements: wsProductAsset.detection_requirements as Array<{ content: string; highlight?: string | null }> | null,
      } : undefined,
      hardware: hardware ? {
        cameras: hardware.cameras,
        lenses: hardware.lenses,
        lights: hardware.lights,
        controllers: hardware.controllers,
      } : undefined,
    };

    // a. 基本信息+检测要求 (Combined)
    let step = 0;
    onProgress(wsBaseProgress + stepIncrement * step, `${ws.name} - ${isZh ? '基本信息+检测要求' : 'Basic Info & Requirements'}`, `[SLIDE:${ws.name}:a] ${isZh ? '基本信息+检测要求' : 'Basic Info & Requirements'}`);
    generateBasicInfoAndRequirementsSlide(ctx, slideData);
    
    // b. 产品截图标注 (Product Schematic - variable pages)
    step++;
    onProgress(wsBaseProgress + stepIncrement * step, `${ws.name} - ${isZh ? '产品示意图' : 'Product'}`, `[SLIDE:${ws.name}:b] ${isZh ? '产品示意图' : 'Product schematic'}`);
    await generateProductSchematicSlide(ctx, slideData);
    
    // c. 机械布局 (主辅视图 + 布局说明)
    step++;
    onProgress(wsBaseProgress + stepIncrement * step, `${ws.name} - ${isZh ? '机械布局' : 'Mechanical Layout'}`, `[SLIDE:${ws.name}:c] ${isZh ? '机械布局' : 'Mechanical Layout'}`);
    await generateLayoutAndOpticalSlide(ctx, slideData);
    
    // d. 光学方案 × N (One page per module)
    for (let mi = 0; mi < wsModules.length; mi++) {
      step++;
      const modName = wsModules[mi].name;
      onProgress(wsBaseProgress + stepIncrement * step, `${ws.name} - ${isZh ? '光学方案' : 'Optical'}: ${modName}`, `[SLIDE:${ws.name}:d${mi + 1}] ${isZh ? '光学方案' : 'Optical'}: ${modName}`);
      await generateModuleOpticalSlide(ctx, slideData, mi);
    }
    
    // e. BOM清单+审核
    step++;
    onProgress(wsBaseProgress + stepIncrement * step, `${ws.name} - ${isZh ? 'BOM清单' : 'BOM'}`, `[SLIDE:${ws.name}:e] ${isZh ? 'BOM清单' : 'BOM list'}`);
    generateBOMSlide(ctx, slideData);
  }

  // Hardware detail slides removed - only summary table is generated

  // ========== HARDWARE SUMMARY SLIDE (16:9) ==========
  progress = 92;
  onProgress(progress, isZh ? '生成硬件清单...' : 'Generating hardware list...', isZh ? '硬件清单汇总' : 'Hardware summary');

  const hwSlide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
  
  hwSlide.addText(isZh ? '硬件清单汇总' : 'Hardware Summary', {
    x: 0.4, y: 0.05, w: 7.5, h: 0.38,
    fontSize: 18, color: COLORS.white, bold: true,
  });
  // Sub-header bar (medium blue)
  hwSlide.addShape('rect', {
    x: 0, y: 0.45, w: '100%', h: 0.22,
    fill: { color: '2E75B6' },
  });
  hwSlide.addText(isZh ? '设备清单' : 'Equipment List', {
    x: 0, y: 0.45, w: '100%', h: 0.22,
    fontSize: 10, color: COLORS.white, align: 'center', valign: 'middle',
  });

  // Aggregate hardware by brand+model across all modules
  const hwCountMap = new Map<string, { type: string; brand: string; model: string; count: number }>();

  const addToMap = (type: string, brand: string, model: string) => {
    const key = `${type}||${brand}||${model}`;
    const existing = hwCountMap.get(key);
    if (existing) {
      existing.count++;
    } else {
      hwCountMap.set(key, { type, brand, model, count: 1 });
    }
  };

  // Count from modules
  if (hardware) {
    for (const m of modules) {
      if (m.selected_camera) {
        const cam = hardware.cameras.find(c => c.id === m.selected_camera);
        if (cam) addToMap(isZh ? '工业相机' : 'Industrial Camera', cam.brand, cam.model);
      }
      if (m.selected_lens) {
        const lens = hardware.lenses.find(l => l.id === m.selected_lens);
        if (lens) addToMap(isZh ? '工业镜头' : 'Industrial Lens', lens.brand, lens.model);
      }
      if (m.selected_light) {
        const light = hardware.lights.find(l => l.id === m.selected_light);
        if (light) addToMap(isZh ? '光源' : 'Light Source', light.brand, light.model);
      }
      if (m.selected_controller) {
        const ctrl = hardware.controllers.find(c => c.id === m.selected_controller);
        if (ctrl) addToMap(isZh ? '工控机' : 'Industrial PC', ctrl.brand, ctrl.model);
      }
    }
  }

  const hwItems = Array.from(hwCountMap.values());
  let totalDevices = hwItems.reduce((sum, item) => sum + item.count, 0);

  // Header row
  const hwHeader: TableRow[] = [
    row([
      isZh ? '序号' : 'No.',
      isZh ? '设备类型' : 'Device Type',
      isZh ? '品牌' : 'Brand',
      isZh ? '型号' : 'Model',
      isZh ? '数量' : 'Qty',
      isZh ? '备注' : 'Notes',
    ]),
  ];

  // Data rows
  const hwDataRows: TableRow[] = hwItems.map((item, idx) =>
    row([
      String(idx + 1),
      item.type,
      item.brand,
      item.model,
      String(item.count),
      '',
    ])
  );

  // Total row
  const hwTotalRow: TableRow[] = [
    row(['', '', '', isZh ? '总计' : 'Total', `${totalDevices}${isZh ? '台' : ''}`, '']),
  ];

  const hwAllRows = [...hwHeader, ...hwDataRows, ...hwTotalRow];

  hwSlide.addTable(hwAllRows, {
    x: SLIDE_LAYOUT.contentLeft, y: 0.85, w: SLIDE_LAYOUT.contentWidth,
    fontFace: 'Arial',
    fontSize: 8,
    colW: [0.5, 1.4, 1.2, 2.0, 0.6, 1.8],
    border: { pt: 0.5, color: COLORS.border },
    fill: { color: COLORS.white },
    valign: 'middle',
    align: 'center',
  });

  // ========== APPENDIX: EXTRA FIELDS SLIDE (if any) ==========
  // Safe helper to check if object has extra_fields
  const hasExtraFields = (obj: any): boolean => {
    if (!obj || typeof obj !== 'object') return false;
    const extra = obj.extra_fields;
    if (!extra || typeof extra !== 'object') return false;
    return Object.keys(extra).length > 0;
  };

  // Safe helper to get extra fields with null checks
  const safeGetExtraFields = (obj: any): Record<string, { key: string; label: string; value: string }> => {
    if (!obj?.extra_fields || typeof obj.extra_fields !== 'object') return {};
    return obj.extra_fields;
  };

  // Safe helper to truncate string
  const safeTruncate = (val: any, maxLen: number = 50): string => {
    const str = val != null ? String(val) : '';
    return str.length > maxLen ? str.substring(0, maxLen - 3) + '...' : str;
  };

  const projectHasExtra = hasExtraFields(project);
  const wsWithExtra = workstations.filter(ws => hasExtraFields(ws));
  const layoutsWithExtra = layouts.filter(l => hasExtraFields(l));
  const modulesWithExtra = modules.filter(m => hasExtraFields(m));

  if (projectHasExtra || wsWithExtra.length > 0 || layoutsWithExtra.length > 0 || modulesWithExtra.length > 0) {
    progress = 96;
    onProgress(progress, isZh ? '生成附录...' : 'Generating appendix...', isZh ? '附录：补充字段' : 'Appendix');

    const appendixSlide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
    
    appendixSlide.addText(isZh ? '附录：补充字段' : 'Appendix: Additional Fields', {
      x: SLIDE_LAYOUT.contentLeft, y: SLIDE_LAYOUT.contentTop, w: SLIDE_LAYOUT.contentWidth, h: 0.4,
      fontSize: 18, color: COLORS.dark, bold: true,
    });

    let appendixY = SLIDE_LAYOUT.contentTop + 0.5;

    // Collect all extra fields into a summary table
    const allExtraRows: TableRow[] = [];

    // Project extra fields
    if (projectHasExtra) {
      allExtraRows.push(row([isZh ? '【项目】' : '[Project]', '', '']));
      const extraFields = safeGetExtraFields(project);
      Object.values(extraFields).forEach(f => {
        if (f?.label && f?.value != null) {
          allExtraRows.push(row(['', f.label || '', safeTruncate(f.value)]));
        }
      });
    }

    // Workstation extra fields
    for (const ws of wsWithExtra) {
      allExtraRows.push(row([`${isZh ? '【工位】' : '[WS]'} ${ws.name || ''}`, '', '']));
      const extraFields = safeGetExtraFields(ws);
      Object.values(extraFields).forEach(f => {
        if (f?.label && f?.value != null) {
          allExtraRows.push(row(['', f.label || '', safeTruncate(f.value)]));
        }
      });
    }

    // Layout extra fields
    for (const layout of layoutsWithExtra) {
      const ws = workstations.find(w => w.id === (layout as any).workstation_id);
      allExtraRows.push(row([`${isZh ? '【布局】' : '[Layout]'} ${ws?.name || 'N/A'}`, '', '']));
      const extraFields = safeGetExtraFields(layout);
      Object.values(extraFields).forEach(f => {
        if (f?.label && f?.value != null) {
          allExtraRows.push(row(['', f.label || '', safeTruncate(f.value)]));
        }
      });
    }

    // Module extra fields
    for (const mod of modulesWithExtra) {
      allExtraRows.push(row([`${isZh ? '【模块】' : '[Module]'} ${mod.name || ''}`, '', '']));
      const extraFields = safeGetExtraFields(mod);
      Object.values(extraFields).forEach(f => {
        if (f?.label && f?.value != null) {
          allExtraRows.push(row(['', f.label || '', safeTruncate(f.value)]));
        }
      });
    }

    if (allExtraRows.length > 0) {
      appendixSlide.addTable(allExtraRows, {
        x: SLIDE_LAYOUT.contentLeft, 
        y: appendixY, 
        w: SLIDE_LAYOUT.contentWidth,
        fontFace: 'Arial',
        fontSize: 8,
        colW: [2.2, 2.5, 4.5],
        border: { pt: 0.5, color: COLORS.border },
        fill: { color: COLORS.white },
        valign: 'middle',
        ...createAutoPageTableOptions(appendixY),
      });
    }
  }

  // ========== END SLIDE (16:9 optimized) ==========
  progress = 98;
  onProgress(progress, isZh ? '生成结束页...' : 'Generating end slide...', isZh ? '生成结束页' : 'End slide');

  const endSlide = pptx.addSlide();
  
  endSlide.addShape('rect', {
    x: 0, y: 0, w: '100%', h: '100%',
    fill: { color: COLORS.dark },
  });

  endSlide.addText(isZh ? COMPANY_NAME_ZH : COMPANY_NAME_EN, {
    x: 0.5, y: 1.2, w: 9, h: 0.4,
    fontSize: 14, color: COLORS.white, align: 'center',
  });

  endSlide.addText(isZh ? '感谢您的关注' : 'Thank You', {
    x: 0.5, y: 1.9, w: 9, h: 0.8,
    fontSize: 32, color: COLORS.white, bold: true, align: 'center',
  });

  endSlide.addText(project.customer, {
    x: 0.5, y: 2.9, w: 9, h: 0.4,
    fontSize: 16, color: COLORS.white, align: 'center',
  });

  endSlide.addText(`${project.responsible || ''} | ${project.date || ''}`, {
    x: 0.5, y: 3.5, w: 9, h: 0.35,
    fontSize: 11, color: COLORS.secondary, align: 'center',
  });

  // Generate blob
  progress = 100;
  onProgress(progress, isZh ? '完成' : 'Complete', isZh ? 'PPT生成完成' : 'PPT generation complete');

  const blob = await pptx.write({ outputType: 'blob' }) as Blob;
  return blob;
}
