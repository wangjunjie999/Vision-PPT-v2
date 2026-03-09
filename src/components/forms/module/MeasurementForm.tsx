import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import type { 
  ModuleFormState, 
  MeasurementItem, 
  MeasurementDimType,
  MeasurementJudgment,
  CalibrationMethod
} from './types';

interface MeasurementFormProps {
  form: ModuleFormState;
  setForm: React.Dispatch<React.SetStateAction<ModuleFormState>>;
}

const dimTypeOptions: { value: MeasurementDimType; label: string }[] = [
  { value: 'length', label: '长度' },
  { value: 'diameter', label: '直径' },
  { value: 'angle', label: '角度' },
  { value: 'distance', label: '间距' },
  { value: 'radius', label: '半径' },
  { value: 'height', label: '高度' },
  { value: 'area', label: '面积' },
  { value: 'concentricity', label: '同心度' },
];

const calibrationOptions: { value: CalibrationMethod; label: string }[] = [
  { value: 'plane', label: '平面标定' },
  { value: 'multipoint', label: '多点标定' },
  { value: 'fixture', label: '治具标定' },
];

// Use strings for number inputs to prevent parsing issues during typing
interface NewItemState {
  name: string;
  dimType: MeasurementDimType;
  nominalValue: string;
  upperTolerance: string;
  lowerTolerance: string;
  unit: 'mm' | 'deg';
  judgment: MeasurementJudgment;
}

const defaultNewItem: NewItemState = {
  name: '',
  dimType: 'length',
  nominalValue: '0',
  upperTolerance: '0.1',
  lowerTolerance: '-0.1',
  unit: 'mm',
  judgment: 'tolerance_ng',
};

export function MeasurementForm({ form, setForm }: MeasurementFormProps) {
  const [newItem, setNewItem] = useState<NewItemState>(defaultNewItem);

  const addMeasurementItem = () => {
    if (!newItem.name.trim()) return;
    
    const item: MeasurementItem = {
      id: Date.now().toString(),
      name: newItem.name.trim(),
      dimType: newItem.dimType,
      nominalValue: parseFloat(newItem.nominalValue) || 0,
      upperTolerance: parseFloat(newItem.upperTolerance) || 0.1,
      lowerTolerance: parseFloat(newItem.lowerTolerance) || -0.1,
      unit: newItem.unit,
      judgment: newItem.judgment,
    };
    
    setForm(p => ({
      ...p,
      measurementItems: [...p.measurementItems, item]
    }));
    
    setNewItem(defaultNewItem);
  };

  const removeMeasurementItem = (id: string) => {
    setForm(p => ({
      ...p,
      measurementItems: p.measurementItems.filter(item => item.id !== id)
    }));
  };

  return (
    <div className="form-section">
      <h3 className="form-section-title">
        <span className="w-1 h-4 bg-chart-3 rounded-full" />
        尺寸测量配置
      </h3>
      
      <div className="space-y-4">
        {/* 测量项目列表 */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">
            测量项目 <span className="text-destructive ml-0.5">*</span>
            {form.measurementItems.length === 0 && (
              <span className="text-destructive text-xs ml-2">(至少添加1项)</span>
            )}
          </Label>
          
          {/* 已添加项目 */}
          {form.measurementItems.length > 0 && (
            <div className="space-y-2">
              {form.measurementItems.map((item, index) => (
                <div 
                  key={item.id}
                  className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg border"
                >
                  <Badge variant="outline" className="text-xs shrink-0">
                    {index + 1}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span className="truncate">{item.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {dimTypeOptions.find(d => d.value === item.dimType)?.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {item.nominalValue}{item.unit} ({item.lowerTolerance > 0 ? '+' : ''}{item.lowerTolerance} ~ +{item.upperTolerance})
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMeasurementItem(item.id)}
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          {/* 添加新项目 */}
          <div className="p-3 border-2 border-dashed rounded-lg space-y-4 bg-muted/30">
            <p className="text-xs text-muted-foreground font-medium">添加测量项目</p>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">项目名称</Label>
                <Input
                  value={newItem.name}
                  onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))}
                  placeholder="例如: 孔径D1"
                  className="h-9"
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addMeasurementItem())}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">尺寸类型</Label>
                <Select 
                  value={newItem.dimType} 
                  onValueChange={v => setNewItem(p => ({ ...p, dimType: v as MeasurementDimType }))}
                >
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {dimTypeOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">名义值</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newItem.nominalValue}
                  onChange={e => setNewItem(p => ({ ...p, nominalValue: e.target.value }))}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">上公差</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newItem.upperTolerance}
                  onChange={e => setNewItem(p => ({ ...p, upperTolerance: e.target.value }))}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">下公差</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newItem.lowerTolerance}
                  onChange={e => setNewItem(p => ({ ...p, lowerTolerance: e.target.value }))}
                  className="h-9"
                />
              </div>
            </div>
            
            <Button
              type="button"
              variant={newItem.name?.trim() ? "default" : "outline"}
              onClick={addMeasurementItem}
              disabled={!newItem.name?.trim()}
              className="w-full h-9"
            >
              <Plus className="h-4 w-4 mr-2" />
              添加测量项
            </Button>
          </div>
        </div>

        {/* 视野和分辨率 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">视野大小 (mm) <span className="text-destructive ml-0.5">*</span></Label>
            <Input
              value={form.measurementFieldOfView}
              onChange={e => setForm(p => ({ ...p, measurementFieldOfView: e.target.value }))}
              placeholder="例如: 50x40"
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">分辨率 (px)</Label>
            <Input
              value={form.measurementResolution}
              onChange={e => setForm(p => ({ ...p, measurementResolution: e.target.value }))}
              placeholder="例如: 2448x2048"
              className="h-9"
            />
          </div>
        </div>

        {/* 精度要求 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">目标精度 (mm) <span className="text-destructive ml-0.5">*</span></Label>
            <Input
              type="number"
              step="0.001"
              value={form.targetAccuracy}
              onChange={e => setForm(p => ({ ...p, targetAccuracy: e.target.value }))}
              placeholder="例如: 0.05"
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">系统精度 (mm)</Label>
            <Input
              type="number"
              step="0.001"
              value={form.systemAccuracy}
              onChange={e => setForm(p => ({ ...p, systemAccuracy: e.target.value }))}
              className="h-9"
            />
          </div>
        </div>

        {/* 标定方式 */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">标定方式</Label>
          <Select 
            value={form.measurementCalibrationMethod} 
            onValueChange={v => setForm(p => ({ ...p, measurementCalibrationMethod: v as CalibrationMethod }))}
          >
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {calibrationOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}