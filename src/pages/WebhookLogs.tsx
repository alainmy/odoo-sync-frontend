import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Sliders, Webhook } from 'lucide-react'
import { format } from 'date-fns'
import { useState } from 'react'

interface WebhookLog {
  id: number
  webhook_id: string
  event_type: string
  payload_hash: string
  status: string
  retry_count: number
  error_message: string | null
  created_at: string
  processed_at: string | null
  updated_at: string | null
}

const statusColors: Record<string, string> = {
  completed: 'bg-green-600',
  failed: 'bg-red-600',
  pending: 'bg-yellow-600',
  processing: 'bg-blue-600',
}

export default function WebhookLogs() {
  const [status, setStatus] = useState<string | null>(null)

  const { data: webhooks, isLoading, refetch } = useQuery<WebhookLog[]>({
    queryKey: ['webhook-logs', status],
    queryFn: async () => {
      const params = status ? { status } : {}
      const response = await api.get('/api/v1/sync/webhooks', { params })
      return response.data
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Webhook Logs</h1>
          <p className="text-muted-foreground mt-2">
            Monitor incoming webhooks from WooCommerce
          </p>
        </div>
        <Button onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          variant={status === null ? 'default' : 'outline'}
          onClick={() => setStatus(null)}
        >
          All
        </Button>
        <Button
          variant={status === 'pending' ? 'default' : 'outline'}
          onClick={() => setStatus('pending')}
        >
          Pending
        </Button>
        <Button
          variant={status === 'completed' ? 'default' : 'outline'}
          onClick={() => setStatus('completed')}
        >
          Completed
        </Button>
        <Button
          variant={status === 'failed' ? 'default' : 'outline'}
          onClick={() => setStatus('failed')}
        >
          Failed
        </Button>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Loading webhooks...
            </CardContent>
          </Card>
        ) : webhooks && webhooks.length > 0 ? (
          webhooks.map((webhook) => (
            <Card key={webhook.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Webhook className="h-5 w-5 text-purple-600 mt-1" />
                    <div>
                      <CardTitle className="text-lg">
                        {webhook.event_type}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        ID: {webhook.webhook_id}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(webhook.created_at), 'PPpp')}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge
                      variant="default"
                      className={statusColors[webhook.status] || 'bg-gray-600'}
                    >
                      {webhook.status}
                    </Badge>
                    {webhook.retry_count > 0 && (
                      <span className="text-xs text-muted-foreground">
                        Retries: {webhook.retry_count}
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              {webhook.error_message && (
                <CardContent>
                  <div className="p-3 bg-destructive/10 rounded-md">
                    <p className="text-sm text-destructive font-mono">
                      {webhook.error_message}
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Sliders className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No webhooks found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
