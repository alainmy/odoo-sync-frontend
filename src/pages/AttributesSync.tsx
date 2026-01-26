import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, CheckCircle, XCircle, AlertCircle, Sliders } from 'lucide-react'
import { useState } from 'react'

interface AttributeSync {
  id: number
  odoo_attribute_id: number
  odoo_name: string | null
  woocommerce_id: number
  slug: string
  woo_type: string
  created: boolean
  updated: boolean
  skipped: boolean
  error: boolean
  message: string
  error_details: string | null
  sync_date: string | null
  last_exported_date: string | null
}

export default function AttributesSync() {
  const [filter, setFilter] = useState<'all' | 'errors'>('all')

  const { data: attributes, isLoading, refetch } = useQuery<AttributeSync[]>({
    queryKey: ['attributes-sync', filter],
    queryFn: async () => {
      const params = filter === 'errors' ? { error: true } : {}
      const response = await api.get('/api/v1/attributes/syncs', { params })
      return response.data
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sliders className="h-8 w-8" />
            Attributes Synchronization
          </h1>
          <p className="text-muted-foreground mt-2">
            View synced product attributes between Odoo and WooCommerce
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
          All Attributes
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
              Loading attributes...
            </CardContent>
          </Card>
        ) : attributes && attributes.length > 0 ? (
          attributes.map((attribute: AttributeSync) => (
            <Card key={attribute.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sliders className="h-5 w-5 text-muted-foreground" />
                      {attribute.odoo_name ? attribute.odoo_name : `Attribute #${attribute.odoo_attribute_id}`}
                      {attribute.slug && (
                        <span className="text-sm font-normal text-muted-foreground">
                          ({attribute.slug})
                        </span>
                      )}
                    </CardTitle>
                    <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                      <span>Odoo ID: {attribute.odoo_attribute_id}</span>
                      <span>WooCommerce ID: {attribute.woocommerce_id || 'N/A'}</span>
                      <span>Type: {attribute.woo_type}</span>
                      {attribute.last_exported_date && (
                        <span>
                          Last Sync: {new Date(attribute.last_exported_date).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {attribute.created && (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Created
                      </Badge>
                    )}
                    {attribute.updated && (
                      <Badge variant="default" className="bg-blue-600">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Updated
                      </Badge>
                    )}
                    {attribute.skipped && (
                      <Badge variant="secondary">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Skipped
                      </Badge>
                    )}
                    {attribute.error && (
                      <Badge variant="destructive">
                        <XCircle className="mr-1 h-3 w-3" />
                        Error
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{attribute.message}</p>
                {attribute.error_details && (
                  <div className="mt-3 p-3 bg-destructive/10 rounded-md">
                    <p className="text-sm text-destructive font-mono">
                      {attribute.error_details}
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
              <p>No attributes synced yet</p>
              <p className="text-sm mt-1">
                Go to Odoo → Attributes to load and sync attributes from Odoo
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
