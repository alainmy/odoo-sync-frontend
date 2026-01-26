import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import api from '@/lib/api'

interface TaskResponse {
  task_id: string
  status: string
  instance_id: number | null
  created_at: string
  check_url: string
}

export function useTaskTracking() {
  const [taskId, setTaskId] = useState<string | null>(null)
  const [showTracker, setShowTracker] = useState(false)

  const startTracking = (response: TaskResponse) => {
    if (response.task_id) {
      setTaskId(response.task_id)
      setShowTracker(true)
    }
  }

  const stopTracking = () => {
    setShowTracker(false)
    setTaskId(null)
  }

  return {
    taskId,
    showTracker,
    startTracking,
    stopTracking,
  }
}

export function useSyncMutation(
  endpoint: string,
  onSuccessCallback?: (data: any) => void
) {
  const { taskId, showTracker, startTracking, stopTracking } = useTaskTracking()

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await api.post(endpoint, payload)
      return response.data
    },
    onSuccess: (data) => {
      startTracking(data)
      onSuccessCallback?.(data)
    },
  })

  return {
    ...mutation,
    taskId,
    showTracker,
    stopTracking,
  }
}
