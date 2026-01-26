import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Layers, TrendingUp } from 'lucide-react'

interface QueueStats {
  queues: Record<string, { reserved: number; scheduled: number }>
}

export default function QueueStatsCard() {
  const { data, isLoading } = useQuery<QueueStats>({
    queryKey: ['queue-stats'],
    queryFn: async () => {
      const response = await api.get('/api/v1/sync/queues/stats')
      return response.data
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  })

  const totalReserved = Object.values(data?.queues || {}).reduce(
    (sum, q) => sum + q.reserved,
    0
  )
  const totalScheduled = Object.values(data?.queues || {}).reduce(
    (sum, q) => sum + q.scheduled,
    0
  )

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900">
            <Layers className="h-4 w-4 text-purple-600" />
          </div>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Queue Status
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <div className="text-2xl font-bold">{totalReserved + totalScheduled}</div>
            <p className="text-xs text-muted-foreground">
              {totalReserved} processing, {totalScheduled} queued
            </p>
          </div>

          {!isLoading && data && Object.keys(data.queues).length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              {Object.entries(data.queues).map(([queue, stats]) => (
                <div key={queue} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground truncate flex-1">
                    {queue.replace('_queue', '')}
                  </span>
                  <span className="font-mono">
                    {stats.reserved + stats.scheduled}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
