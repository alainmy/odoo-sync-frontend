import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import TaskProgressTracker from '@/components/TaskProgressTracker'
import { RefreshCw, ListChecks, Eye, Sliders } from 'lucide-react'
import { format } from 'date-fns'
import { useState } from 'react'

interface TaskLog {
  id: number
  task_id: string
  task_name: string
  status: string
  error_message: string | null
  created_at: string
  started_at: string | null
  completed_at: string | null
  result: any
}

const statusColors: Record<string, string> = {
  success: 'bg-green-600',
  failure: 'bg-red-600',
  pending: 'bg-yellow-600',
  started: 'bg-blue-600',
  retry: 'bg-orange-600',
}

export default function TaskLogs() {
  const [status, setStatus] = useState<string | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  const { data: tasks, isLoading, refetch } = useQuery<TaskLog[]>({
    queryKey: ['task-logs', status],
    queryFn: async () => {
      const params = status ? { status } : {}
      const response = await api.get('/api/v1/sync/tasks', { params })
      return response.data
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Task Logs</h1>
          <p className="text-muted-foreground mt-2">
            Monitor Celery task execution history
          </p>
        </div>
        <Button onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button
          variant={status === null ? 'default' : 'outline'}
          onClick={() => setStatus(null)}
        >
          All
        </Button>
        <Button
          variant={status === 'success' ? 'default' : 'outline'}
          onClick={() => setStatus('success')}
        >
          Success
        </Button>
        <Button
          variant={status === 'failure' ? 'default' : 'outline'}
          onClick={() => setStatus('failure')}
        >
          Failed
        </Button>
        <Button
          variant={status === 'retry' ? 'default' : 'outline'}
          onClick={() => setStatus('retry')}
        >
          Retry
        </Button>
        <Button
          variant={status === 'pending' ? 'default' : 'outline'}
          onClick={() => setStatus('pending')}
        >
          Pending
        </Button>
      </div>
{/* Selected Task Tracker */}
      {selectedTaskId && (
        <TaskProgressTracker
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
        />
      )}

      
      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Loading tasks...
            </CardContent>
          </Card>
        ) : tasks && tasks.length > 0 ? (
          tasks.map((task) => (
            <Card key={task.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <ListChecks className="h-5 w-5 text-orange-600 mt-1" />
                    <div className="flex-1">
                      <CardTitle className="text-sm font-mono">
                        {task.task_name.split('.').pop()}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1 font-mono">
                        {task.task_id}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Created: {format(new Date(task.created_at), 'PPpp')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="default"
                      className={statusColors[task.status] || 'bg-gray-600'}
                    >
                      {task.status}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTaskId(task.task_id)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {task.error_message ? (
                <CardContent>
                  <div className="p-3 bg-destructive/10 rounded-md">
                    <p className="text-sm text-destructive font-mono">
                      {task.error_message}
                    </p>
                  </div>
                </CardContent>
              ) : (
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {task.result?.data?.message || 'No additional details available.'}
                  </p>
                </CardContent>
              )}
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Sliders className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No tasks found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
