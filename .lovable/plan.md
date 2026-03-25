

# 表单字段 vs PPT 输出对比分析

以下列出所有在表单中可填写、但在 PPT 中**未展示**的字段。

---

## 一、项目级字段（ProjectForm）

| 表单字段 | 中文名 | PPT 中是否展示 |
|----------|--------|---------------|
| `sales_responsible` | 销售负责人 | ❌ 未展示 |
| `vision_responsible` | 视觉负责人 | ❌ 未展示 |
| `production_line` | 产线编号 | ❌ 未展示 |
| `main_camera_brand` | 主力相机品牌 | ❌ 未展示 |
| `spec_version` | 方案版本号 | ❌ 未展示 |
| `cycle_time_target` | 目标节拍 | ❌ 未展示（仅工位级节拍展示） |
| `notes` | 项目备注 | ❌ 未展示 |

---

## 二、工位级字段（WorkstationForm）

| 表单字段 | 中文名 | PPT 中是否展示 |
|----------|--------|---------------|
| `install_space` | 安装空间限制 | ❌ 未展示 |
| `description` | 工位描述 | ⚠️ 仅在旧版 basicInfoSlide 中展示，合并后的新版中不显示 |
| `enclosed` | 是否封闭 | ❌ 未展示（basicInfoAndRequirements 表中无此项） |
| `acceptance_criteria.compatible_sizes` | 兼容尺寸规格 | ❌ 未展示（仅用 accuracy） |
| `acceptance_criteria.cycle_time` | 验收节拍 | ❌ 未展示 |

---

## 三、模块通用字段

| 表单字段 | 中文名 | PPT 中是否展示 |
|----------|--------|---------------|
| `detectionObject` | 检测对象/内容描述 | ❌ 未展示 |
| `judgmentStrategy` | 判定策略 | ❌ 未展示 |
| `outputAction` | 输出动作（报警/停机/剔除等） | ❌ 未展示（output_types 有部分展示） |
| `communicationMethod` | 通讯方式 | ❌ 未展示 |
| `signalDefinition` | 信号定义 | ❌ 未展示 |
| `dataRetentionDays` | 数据留存天数 | ❌ 未展示 |
| `dataRetention` | 数据留存策略 | ❌ 未展示 |
| `qualityStrategy` | 质量策略 | ❌ 未展示 |
| `roiDefinition` | ROI 定义方式 | ❌ 未展示 |
| `roiRect` | ROI 区域坐标 | ❌ 未展示 |
| `inspectionSurfaces` | 检测面 | ❌ 未展示 |
| `remarks` | 备注 | ❌ 未展示 |

---

## 四、成像/光学参数（所有模块类型通用）

| 表单字段 | 中文名 | PPT 中是否展示 |
|----------|--------|---------------|
| `exposure` | 曝光时间 | ❌ 未展示 |
| `gain` | 增益 | ❌ 未展示 |
| `triggerDelay` | 触发延时 | ❌ 未展示 |
| `lightMode` | 光源模式（常亮/频闪） | ❌ 未展示 |
| `lightAngle` | 光源角度 | ❌ 未展示（光学方案页写死"需现场确定"） |
| `lightDistance` | 光源距离 | ❌ 未展示（同上） |
| `lightDistanceHorizontal` | 光源水平距离 | ❌ 未展示 |
| `lightDistanceVertical` | 光源垂直距离 | ❌ 未展示 |
| `lensAperture` | 镜头光圈 F 值 | ❌ 未展示 |
| `depthOfField` | 景深要求 | ❌ 未展示 |
| `workingDistanceTolerance` | 工作距离公差 | ❌ 未展示 |
| `cameraInstallNote` | 相机安装说明 | ❌ 未展示 |
| `lightNote` | 光源备注 | ❌ 未展示 |

---

## 五、缺陷检测专属字段

| 表单字段 | 中文名 | PPT 中是否展示 |
|----------|--------|---------------|
| `missTolerance` | 漏检容忍度 | ❌ 未展示 |
| `falseRejectTolerance` | 误检容忍度 | ❌ 未展示 |
| `judgmentRule` | 判定规则 | ❌ 未展示 |
| `materialProperties` | 材质属性 | ❌ 未展示 |
| `defectGrading` | 缺陷分级 | ❌ 未展示 |
| `defectGradingRules` | 分级规则 | ❌ 未展示 |
| `recheckStrategy` | 复检策略 | ❌ 未展示 |
| `recheckCount` | 复检次数 | ❌ 未展示 |
| `ngRetentionType` | NG 存图类型 | ❌ 未展示 |
| `allowedContamination` | 允许污染 | ❌ 未展示 |
| `areaDescription` | 区域描述 | ❌ 未展示 |
| `conveyorType` | 传送带类型 | ❌ 未展示（layout 层有，模块层未用） |
| `defectCameraCount` | 缺陷相机数 | ❌ 未展示 |
| `defectCamera1/2/3Config` | 各相机配置（WD/FOV/重叠率/分辨率） | ❌ 未展示 |
| `defectContrast` | 缺陷对比度 | ❌ 未展示 |
| `materialReflectionLevel` | 材质反光等级 | ❌ 未展示 |
| `allowedFalseRate` | 允许误检率 | ✅ 已展示 |
| `allowedMissRate` | 允许漏检率 | ✅ 已展示 |

---

## 六、定位专属字段

| 表单字段 | 中文名 | PPT 中是否展示 |
|----------|--------|---------------|
| `targetType` | 定位目标类型 | ❌ 未展示 |
| `outputCoordinate` | 输出坐标系 | ❌ 未展示 |
| `repeatabilityRequirement` | 重复性要求 | ❌ 未展示 |
| `coordinateDescription` | 坐标描述 | ❌ 未展示 |
| `postureChanges` | 姿态变化 | ❌ 未展示 |
| `calibrationMethod` | 标定方法 | ❌ 未展示 |
| `failureHandling` | 失败处理 | ❌ 未展示 |
| `retryCount` | 重试次数 | ❌ 未展示 |
| `regionRestriction` | 区域限制 | ❌ 未展示 |
| `guidingMode` | 引导模式 | ❌ 未展示 |
| `guidingMechanism` | 引导机构 | ❌ 未展示 |
| `grabOffsetX/Y` | 抓取偏移 | ❌ 未展示 |
| `toleranceX/Y` | 定位容差 | ❌ 未展示 |
| `cameraCount` | 相机数量 | ❌ 未展示 |
| `camera1/2Config` | 各相机配置 | ❌ 未展示 |
| `coordinateSystem` | 坐标系 | ❌ 未展示 |
| `shotCountAndTakt` | 拍照次数与节拍 | ❌ 未展示 |
| `toleranceRange` | 公差范围 | ❌ 未展示 |
| `siteConstraints` | 现场约束 | ❌ 未展示 |
| `outputCoordinateSystem` | 输出坐标系 | ❌ 未展示 |
| `calibrationCycle` | 标定周期 | ❌ 未展示 |
| `accuracyAcceptanceMethod` | 精度验收方法 | ❌ 未展示 |
| `targetFeatureType` | 目标特征类型 | ❌ 未展示 |
| `targetCount` | 目标数量 | ❌ 未展示 |
| `occlusionTolerance` | 遮挡容忍 | ❌ 未展示 |

---

## 七、OCR 专属字段

| 表单字段 | 中文名 | PPT 中是否展示 |
|----------|--------|---------------|
| `contentRule` | 内容规则 | ❌ 未展示 |
| `minCharHeight` | 最小字符高度 | ❌ 未展示 |
| `charset` | 字符集 | ❌ 未展示 |
| `customCharset` | 自定义字符集 | ❌ 未展示 |
| `codeCount` | 条码数量 | ❌ 未展示 |
| `charDirection` | 字符方向 | ❌ 未展示 |
| `qualificationStrategy` | 合格策略 | ❌ 未展示 |
| `unclearHandling` | 模糊处理 | ❌ 未展示 |
| `multiROI` | 多 ROI | ❌ 未展示 |
| `ocrOutputFields` | OCR 输出字段 | ❌ 未展示 |
| `ocrAreaWidth/Height` | OCR 区域尺寸 | ❌ 未展示 |
| `singleCharHeight` | 单字符高度 | ❌ 未展示 |
| `ocrCameraFieldOfView` | OCR 相机视野 | ❌ 未展示 |
| `ocrWorkingDistance` | OCR 工作距离 | ❌ 未展示 |
| `ocrResolution` | OCR 分辨率 | ❌ 未展示 |
| `charWidth` | 字符宽度 | ❌ 未展示 |
| `minStrokeWidth` | 最小笔画 | ❌ 未展示 |
| `allowedRotationAngle` | 允许旋转角度 | ❌ 未展示 |
| `allowedDamageLevel` | 允许污损等级 | ❌ 未展示 |
| `charRuleExample` | 字符规则示例 | ❌ 未展示 |

---

## 八、测量专属字段

| 表单字段 | 中文名 | PPT 中是否展示 |
|----------|--------|---------------|
| `measurementItems` | 测量项（名义值/公差/判定） | ⚠️ 仅展示名称，不展示公差等详细数据 |
| `measurementObjectDescription` | 测量对象描述 | ❌ 未展示 |
| `measurementFieldOfView` | 测量视野 | ❌ 未展示 |
| `measurementResolution` | 测量分辨率 | ❌ 未展示 |
| `calibrationPlateSpec` | 标定板规格 | ❌ 未展示 |
| `targetAccuracy` | 目标精度 | ✅ 已展示 |
| `measurementOutputFormat` | 输出格式 | ❌ 未展示 |
| `measurementDatum` | 测量基准 | ❌ 未展示 |
| `samplingStrategy` | 采样策略 | ❌ 未展示 |
| `measurementRepeatability` | 重复性要求 | ❌ 未展示 |
| `environmentRisks` | 环境风险 | ❌ 未展示 |
| `traceabilityField` | 追溯字段 | ❌ 未展示 |
| `grr` | GRR | ❌ 未展示 |
| `calibrationCycleMeasurement` | 标定周期 | ❌ 未展示 |
| `calibrationBlockType` | 量块类型 | ❌ 未展示 |
| `edgeExtractionMethod` | 边缘提取方式 | ❌ 未展示 |

---

## 九、深度学习专属字段

| 表单字段 | 中文名 | PPT 中是否展示 |
|----------|--------|---------------|
| `inferenceTimeTarget` | 推理时间目标 | ❌ 未展示 |
| `deployTarget` | 部署目标 | ❌ 未展示 |
| `updateStrategy` | 更新策略 | ❌ 未展示 |
| `dataSource` | 数据来源 | ❌ 未展示 |
| `sampleSize` | 样本数量 | ❌ 未展示 |
| `annotationMethod` | 标注方法 | ❌ 未展示 |
| `evaluationMetrics` | 评估指标 | ❌ 未展示 |
| `noMissStrategy` | 零漏检策略 | ❌ 未展示 |
| `coldStartStrategy` | 冷启动策略 | ❌ 未展示 |
| `dlRoiWidth/Height/Count` | DL ROI 参数 | ❌ 未展示 |
| `dlClassCount` | 分类数量 | ❌ 未展示 |
| `dlFieldOfView` | DL 视野 | ❌ 未展示 |

---

## 统计总结

| 类别 | 总字段数 | 已展示 | 未展示 |
|------|---------|--------|--------|
| 项目级 | 7 | 0 | **7** |
| 工位级 | 5 | ~1 | **~4** |
| 模块通用 | 12 | 0 | **12** |
| 成像/光学 | 13 | 0 | **13** |
| 缺陷检测 | 15 | 2 | **13** |
| 定位 | 23 | 1 | **22** |
| OCR | 16 | 2 | **14** |
| 测量 | 13 | 1 | **12** |
| 深度学习 | 13 | 2 | **11** |
| **合计** | **~117** | **~9** | **~108** |

约 **92%** 的详细配置字段在 PPT 中没有展示。

