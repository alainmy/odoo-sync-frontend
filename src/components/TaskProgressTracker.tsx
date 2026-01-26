import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { X, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react'

interface TaskInfo {
  task_id: string
  task_name: string
  instance_id: number | null
  celery_state: string
  db_status: string
  result: any
  error: string | null
  created_at: string
  started_at: string | null
  completed_at: string | null
  duration_seconds: number | null
  found_in_db: boolean
}

interface TaskProgressTrackerProps {
  taskId: string
  onClose?: () => void
}

export default function TaskProgressTracker({
  taskId,
  onClose,
}: TaskProgressTrackerProps) {
  const [isActive, setIsActive] = useState(true)

  const { data: task, isLoading } = useQuery<TaskInfo>({
    queryKey: ['task-info', taskId],
    queryFn: async () => {
      const response = await api.get(`/api/v1/sync/tasks/${taskId}`)
      return response.data
    },
    enabled: isActive && !!taskId,
    refetchInterval: (data) => {
      // Stop polling if task is complete
      if (
        data &&
        ['SUCCESS', 'FAILURE', 'REVOKED'].includes(data.celery_state)
      ) {
        setIsActive(false)
        return false
      }
      return 2000 // Poll every 2 seconds
    },
  })

  const handleCancel = async () => {
    try {
      await api.delete(`/api/v1/sync/tasks/${taskId}/cancel`)
      setIsActive(false)
    } catch (error) {
      console.error('Failed to cancel task:', error)
    }
  }

  if (isLoading && !task) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Loading task...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!task) return null

  const getStatusBadge = () => {
    const variants: Record<string, any> = {
      SUCCESS: { variant: 'default', className: 'bg-green-600' },
      FAILURE: { variant: 'destructive', className: '' },
      PROGRESS: { variant: 'default', className: 'bg-blue-600' },
      STARTED: { variant: 'default', className: 'bg-blue-600' },
      PENDING: { variant: 'secondary', className: '' },
      RETRY: { variant: 'default', className: 'bg-orange-600' },
      REVOKED: { variant: 'outline', className: '' },
    }
    const config = variants[task.celery_state] || { variant: 'secondary' }
    return (
      <Badge variant={config.variant} className={config.className}>
        {task.celery_state}
      </Badge>
    )
  }

  const getStatusIcon = () => {
    switch (task.celery_state) {
      case 'SUCCESS':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'FAILURE':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'PROGRESS':
      case 'STARTED':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <CardTitle className="text-base">
                {task.task_name?.split('.').pop() || 'Task'}
              </CardTitle>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                {taskId.substring(0, 8)}...
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {task.celery_state === 'PROGRESS' && task.result && (
          <div className="space-y-2">
            <Progress value={task.result.percentage || 0} className="h-2" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {task.result.message || 'Processing...'}
              </span>
              <span className="font-mono text-xs">
                {task.result.current || 0} / {task.result.total || 0}
              </span>
            </div>
          </div>
        )}

        {/* Success Result */}
        {task.celery_state === 'SUCCESS' && (
          <div className="rounded-lg bg-green-50 dark:bg-green-950 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-900 dark:text-green-100">
                Completed successfully
              </span>
            </div>
            {task.duration_seconds && (
              <p className="text-xs text-green-700 dark:text-green-300">
                Duration: {task.duration_seconds.toFixed(2)}s
              </p>
            )}
            {task.result && typeof task.result === 'object' && (
              <details className="text-xs">
                <summary className="cursor-pointer text-green-700 dark:text-green-300">
                  View result
                </summary>
                <pre className="mt-2 p-2 bg-green-100 dark:bg-green-900 rounded text-xs overflow-x-auto">
                  {JSON.stringify(task.result, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}

        {/* Error */}
        {task.celery_state === 'FAILURE' && (
          <div className="rounded-lg bg-red-50 dark:bg-red-950 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-900 dark:text-red-100">
                Task failed
              </span>
            </div>
            {task.error && (
              <p className="text-xs text-red-700 dark:text-red-300 font-mono">
                {task.error}
              </p>
            )}
          </div>
        )}

        {/* Pending/Started */}
        {['PENDING', 'STARTED'].includes(task.celery_state) && (
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {task.celery_state === 'PENDING' ? 'Queued' : 'Running...'}
              </span>
            </div>
          </div>
        )}

        {/* Cancel button */}
        {['PENDING', 'STARTED', 'PROGRESS'].includes(task.celery_state) && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            className="w-full"
          >
            Cancel Task
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
