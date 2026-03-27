import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Plus, Edit, Trash2, FileText, Copy, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface ActivityLog {
  id: string;
  action_type: string;
  entity_type: string;
  entity_name: string | null;
  description: string;
  created_at: string;
}

const actionIcons: Record<string, typeof Plus> = {
  create: Plus,
  update: Edit,
  delete: Trash2,
  generate: FileText,
  duplicate: Copy,
};

const actionColors: Record<string, string> = {
  create: 'text-success bg-success/10',
  update: 'text-primary bg-primary/10',
  delete: 'text-destructive bg-destructive/10',
  generate: 'text-accent bg-accent/10',
  duplicate: 'text-secondary bg-secondary/10',
};

export function ActivityTimeline({ projectId }: { projectId: string }) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('activity_logs' as any)
        .select('id, action_type, entity_type, entity_name, description, created_at')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(20);
      
      setActivities((data as any as ActivityLog[]) || []);
      setLoading(false);
    };

    fetchActivities();
  }, [projectId]);

  return (
    <Card variant="elevated">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4" />
          活动时间线
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground text-sm">
            加载中...
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-muted-foreground text-sm">
            <Clock className="h-8 w-8 mb-2 opacity-30" />
            <p>暂无活动记录</p>
            <p className="text-xs mt-1">项目操作将自动记录在此</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />
            
            <div className="space-y-3">
              <AnimatePresence>
                {activities.map((activity, i) => {
                  const Icon = actionIcons[activity.action_type] || Edit;
                  const colorClass = actionColors[activity.action_type] || 'text-muted-foreground bg-muted';
                  
                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-start gap-3 pl-1"
                    >
                      <div className={`relative z-10 p-1.5 rounded-full shrink-0 ${colorClass}`}>
                        <Icon className="h-3 w-3" />
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p className="text-xs leading-tight">{activity.description}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: zhCN })}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
