import { useConfigValidation, type ValidationIssue } from '@/hooks/useConfigValidation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CircularProgress } from '@/components/ui/circular-progress';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, AlertCircle, Info, CheckCircle2, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

const severityConfig = {
  error: { icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: '错误' },
  warning: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', label: '警告' },
  info: { icon: Info, color: 'text-muted-foreground', bg: 'bg-muted', label: '提示' },
};

export function ConfigHealthCard({ projectId }: { projectId: string }) {
  const { issues, healthScore } = useConfigValidation(projectId);
  const [expanded, setExpanded] = useState(false);

  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;

  const healthColor = healthScore >= 80 ? 'success' : healthScore >= 50 ? 'warning' : 'destructive';

  return (
    <Card variant="elevated" className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" />
          配置健康度
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-3">
          <CircularProgress
            value={healthScore}
            size="lg"
            color={healthColor as any}
            animated
          />
          <div className="flex-1">
            {issues.length === 0 ? (
              <div className="flex items-center gap-1.5 text-sm text-success">
                <CheckCircle2 className="h-4 w-4" />
                <span>所有配置正常</span>
              </div>
            ) : (
              <div className="space-y-1">
                {errorCount > 0 && (
                  <div className="flex items-center gap-1.5 text-sm text-destructive">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>{errorCount} 个错误</span>
                  </div>
                )}
                {warningCount > 0 && (
                  <div className="flex items-center gap-1.5 text-sm text-warning">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>{warningCount} 个警告</span>
                  </div>
                )}
              </div>
            )}
            {issues.length > 0 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-primary hover:underline mt-1"
              >
                {expanded ? '收起详情' : `查看全部 ${issues.length} 项`}
              </button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-2 pt-2 border-t">
                {issues.map((issue, i) => {
                  const config = severityConfig[issue.severity];
                  const Icon = config.icon;
                  return (
                    <div key={i} className={`flex items-start gap-2 p-2 rounded-md ${config.bg}`}>
                      <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${config.color}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs">{issue.message}</p>
                        {issue.fix && (
                          <p className="text-xs text-muted-foreground mt-0.5">💡 {issue.fix}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {config.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
