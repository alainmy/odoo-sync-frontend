import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BarChart, CheckCircle2, XCircle, Clock, TrendingUp } from 'lucide-react'
import { useState } from 'react'

interface TaskSummaryStats {
  time_range_hours: number
  status_breakdown: {
    success: number
    failure: number
    retry: number
    pending: number
  }
  task_breakdown: Record<string, number>
  average_duration_seconds: number | null
  total_tasks: number
}

export default function TaskStatsCard() {
  const [timeRange, setTimeRange] = useState('24')

  const { data, isLoading } = useQuery<TaskSummaryStats>({
    queryKey: ['task-summary-stats', timeRange],
    queryFn: async () => {
      const response = await api.get(
        `/api/v1/sync/tasks/summary/stats?hours=${timeRange}`
      )
      return response.data
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  const successRate = data
    ? data.total_tasks > 0
      ? ((data.status_breakdown.success / data.total_tasks) * 100).toFixed(1)
      : '0.0'
    : '0.0'

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900">
              <BarChart className="h-4 w-4 text-indigo-600" />
            </div>
            <CardTitle className="text-base">Task Statistics</CardTitle>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last hour</SelectItem>
              <SelectItem value="24">Last 24h</SelectItem>
              <SelectItem value="168">Last week</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-8 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : data ? (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold">{data.total_tasks}</div>
                <p className="text-xs text-muted-foreground">Total Tasks</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {successRate}%
                </div>
                <p className="text-xs text-muted-foreground">Success Rate</p>
              </div>
            </div>

            {/* Status breakdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-muted-foreground">Success</span>
                </div>
                <span className="font-mono">{data.status_breakdown.success}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-muted-foreground">Failed</span>
                </div>
                <span className="font-mono">{data.status_breakdown.failure}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                  <span className="text-muted-foreground">Retry</span>
                </div>
                <span className="font-mono">{data.status_breakdown.retry}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-muted-foreground">Pending</span>
                </div>
                <span className="font-mono">{data.status_breakdown.pending}</span>
              </div>
            </div>

            {/* Average duration */}
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Avg Duration</span>
                <span className="text-sm font-mono">
                  {data.average_duration_seconds !== null
                    ? `${data.average_duration_seconds.toFixed(1)}s`
                    : '—'}
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
