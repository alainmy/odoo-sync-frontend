import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, CheckCircle, XCircle, AlertCircle, Sliders } from 'lucide-react'
import { useState } from 'react'

interface TagSync {
  id: number
  odoo_id: number
  odoo_name: string | null
  woocommerce_id: number
  created: boolean
  updated: boolean
  skipped: boolean
  error: boolean
  message: string
  error_details: string | null
}

export default function TagsSync() {
  const [filter, setFilter] = useState<'all' | 'errors'>('all')

  const { data: tags, isLoading, refetch } = useQuery<TagSync[]>({
    queryKey: ['tags-sync', filter],
    queryFn: async () => {
      const params = filter === 'errors' ? { has_error: true } : {}
      const response = await api.get('/api/v1/sync/tags', { params })
      return response.data
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tags Synchronization</h1>
          <p className="text-muted-foreground mt-2">
            View and manage tag sync status between Odoo and WooCommerce
          </p>
        </div>
        <Button onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          All Tags
        </Button>
        <Button
          variant={filter === 'errors' ? 'default' : 'outline'}
          onClick={() => setFilter('errors')}
        >
          Errors Only
        </Button>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Loading tags...
            </CardContent>
          </Card>
        ) : tags && tags.length > 0 ? (
          tags.map((tag) => (
            <Card key={tag.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {tag.odoo_name ? tag.odoo_name : `Tag #${tag.odoo_id}`}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Odoo ID: {tag.odoo_id} | WooCommerce ID: {tag.woocommerce_id}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {tag.created && (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Created
                      </Badge>
                    )}
                    {tag.updated && (
                      <Badge variant="default" className="bg-blue-600">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Updated
                      </Badge>
                    )}
                    {tag.skipped && (
                      <Badge variant="secondary">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Skipped
                      </Badge>
                    )}
                    {tag.error && (
                      <Badge variant="destructive">
                        <XCircle className="mr-1 h-3 w-3" />
                        Error
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{tag.message}</p>
                {tag.error_details && (
                  <div className="mt-3 p-3 bg-destructive/10 rounded-md">
                    <p className="text-sm text-destructive font-mono">
                      {tag.error_details}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Sliders className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No tags synced yet</p>
              <p className="text-sm mt-1">
                Go to Odoo → Tags to load and sync tags from Odoo
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
