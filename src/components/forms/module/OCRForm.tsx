import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { ModuleFormState, CharType, Charset } from './types';

interface OCRFormProps {
  form: ModuleFormState;
  setForm: React.Dispatch<React.SetStateAction<ModuleFormState>>;
}

const charTypeOptions: { value: CharType; label: string; lightHint: string }[] = [
  { value: 'inkjet', label: '喷码', lightHint: '同轴/环形光' },
  { value: 'laser', label: '激光刻印', lightHint: '同轴/条形光' },
  { value: 'silkscreen', label: '丝印', lightHint: '环形漫射光' },
  { value: 'label', label: '标签', lightHint: '条形光' },
  { value: 'qrcode', label: '二维码', lightHint: '环形光' },
  { value: 'barcode', label: '条码', lightHint: '条形光' },
  { value: 'dot_matrix', label: '点阵字符', lightHint: '同轴光' },
];

const charsetOptions: { value: Charset; label: string }[] = [
  { value: 'numeric', label: '纯数字' },
  { value: 'alpha', label: '纯英文' },
  { value: 'mixed', label: '混合' },
  { value: 'custom', label: '自定义' },
];

export function OCRForm({ form, setForm }: OCRFormProps) {
  return (
    <div className="form-section">
      <h3 className="form-section-title">
        <span className="w-1 h-4 bg-success rounded-full" />
        OCR识别配置
      </h3>
      
      <div className="space-y-4">
        {/* 码制/字符类型 */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">码制/字符类型 <span className="text-destructive ml-0.5">*</span></Label>
          <div className="grid grid-cols-2 gap-2">
            {charTypeOptions.map(opt => (
              <label
                key={opt.value}
                className={cn(
                  "flex flex-col p-3 border rounded-lg cursor-pointer transition-all",
                  form.charType === opt.value
                    ? "bg-primary/10 border-primary"
                    : "hover:bg-secondary"
                )}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="charType"
                    value={opt.value}
                    checked={form.charType === opt.value}
                    onChange={() => setForm(p => ({ ...p, charType: opt.value }))}
                    className="w-3 h-3"
                  />
                  <span className="text-sm font-medium">{opt.label}</span>
                </div>
                <span className="text-xs text-muted-foreground ml-5">{opt.lightHint}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 内容规则 */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">内容格式规则 <span className="text-destructive ml-0.5">*</span></Label>
          <Input
            value={form.contentRule}
            onChange={e => setForm(p => ({ ...p, contentRule: e.target.value }))}
            placeholder="例如: YYYYMMDD+8位序列号"
            className="h-9"
          />
        </div>

        {/* 字符区域和高度 */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">字符区域宽 (mm)</Label>
            <Input
              type="number"
              value={form.ocrAreaWidth}
              onChange={e => setForm(p => ({ ...p, ocrAreaWidth: e.target.value }))}
              placeholder="50"
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">字符区域高 (mm)</Label>
            <Input
              type="number"
              value={form.ocrAreaHeight}
              onChange={e => setForm(p => ({ ...p, ocrAreaHeight: e.target.value }))}
              placeholder="10"
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">字符高度 (mm) <span className="text-destructive ml-0.5">*</span></Label>
            <Input
              type="number"
              step="0.1"
              value={form.minCharHeight}
              onChange={e => setForm(p => ({ ...p, minCharHeight: e.target.value }))}
              className="h-9"
            />
          </div>
        </div>

        {/* 字符集和数量 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">字符集 <span className="text-destructive ml-0.5">*</span></Label>
            <Select 
              value={form.charset} 
              onValueChange={v => setForm(p => ({ ...p, charset: v as Charset }))}
            >
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {charsetOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">字符数量</Label>
            <Input
              type="number"
              min="1"
              value={form.charCount}
              onChange={e => setForm(p => ({ ...p, charCount: e.target.value }))}
              placeholder="例如: 16"
              className="h-9"
            />
          </div>
        </div>

        {/* 相机视野 */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">相机视野 (mm)</Label>
          <Input
            type="number"
            value={form.ocrCameraFieldOfView}
            onChange={e => setForm(p => ({ ...p, ocrCameraFieldOfView: e.target.value }))}
            placeholder="例如: 80"
            className="h-9"
          />
        </div>

        {/* 工业级参数 */}
        <div className="space-y-4 pt-2 border-t">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">工业级参数（可选）</Label>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">字符宽度 (mm)</Label>
              <Input
                value={form.charWidth}
                onChange={e => setForm(p => ({ ...p, charWidth: e.target.value }))}
                placeholder="例如: 2"
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">最小笔画 (mm)</Label>
              <Input
                value={form.minStrokeWidth}
                onChange={e => setForm(p => ({ ...p, minStrokeWidth: e.target.value }))}
                placeholder="例如: 0.1"
                className="h-9"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">允许旋转角度 (°)</Label>
              <Input
                type="number"
                value={form.allowedRotationAngle}
                onChange={e => setForm(p => ({ ...p, allowedRotationAngle: e.target.value }))}
                placeholder="例如: ±5"
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">允许污损等级</Label>
              <Select 
                value={form.allowedDamageLevel} 
                onValueChange={v => setForm(p => ({ ...p, allowedDamageLevel: v }))}
              >
                <SelectTrigger className="h-9"><SelectValue placeholder="请选择" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="无污损">无污损</SelectItem>
                  <SelectItem value="轻微">轻微</SelectItem>
                  <SelectItem value="中等">中等</SelectItem>
                  <SelectItem value="严重">严重</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">字符规则示例/正则</Label>
            <Input
              value={form.charRuleExample}
              onChange={e => setForm(p => ({ ...p, charRuleExample: e.target.value }))}
              placeholder="例如: ^[0-9]{8}$ 或 YYYYMMDD"
              className="h-9"
            />
          </div>
        </div>
      </div>
    </div>
  );
}