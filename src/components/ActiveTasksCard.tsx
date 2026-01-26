import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Activity, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

interface ActiveTask {
  id: string
  name: string
  worker: string
  args: any[]
  kwargs: any
}

interface ActiveTasksData {
  active_count: number
  tasks: ActiveTask[]
}

export default function ActiveTasksCard() {
  const { data, isLoading } = useQuery<ActiveTasksData>({
    queryKey: ['active-tasks'],
    queryFn: async () => {
      const response = await api.get('/api/v1/sync/tasks/active/all')
      return response.data
    },
    refetchInterval: 3000, // Refresh every 3 seconds
  })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
            <Activity className="h-4 w-4 text-blue-600" />
          </div>
          <CardTitle className="text-base">Active Tasks</CardTitle>
        </div>
        <Badge variant={data?.active_count ? 'default' : 'secondary'}>
          {data?.active_count || 0} running
        </Badge>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : data && data.tasks.length > 0 ? (
          <div className="space-y-3 max-h-[200px] overflow-y-auto">
            {data.tasks.slice(0, 5).map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-3 p-2 rounded-lg bg-muted/50"
              >
                <div className="mt-0.5">
                  <Clock className="h-4 w-4 text-muted-foreground animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {task.name.split('.').pop()}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {task.worker}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            No active tasks
          </div>
        )}
      </CardContent>
    </Card>
  )
}
