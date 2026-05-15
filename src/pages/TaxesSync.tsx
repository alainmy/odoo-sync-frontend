import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, CheckCircle, XCircle, AlertCircle, Percent } from 'lucide-react'
import { useState } from 'react'

interface TaxSync {
  id: number
  odoo_id: number
  odoo_name: string | null
  odoo_description: string | null
  woocommerce_id: number
  rate: number | null
  amount: number | null
  price_include: boolean
  tax_scope: string | null
  type_tax_use: string | null
  created: boolean
  updated: boolean
  skipped: boolean
  error: boolean
  message: string
  error_details: string | null
  last_synced_at: string | null
}

export default function TaxesSync() {
  const [filter, setFilter] = useState<'all' | 'errors'>('all')

  const { data: taxes, isLoading, refetch } = useQuery<TaxSync[]>({
    queryKey: ['taxes-sync', filter],
    queryFn: async () => {
      const params = filter === 'errors' ? { has_error: true } : {}
      const response = await api.get('/api/v1/sync/taxes', { params })
      return response.data
    },
  })

  const formatRate = (rate: number | null) => {
    if (rate === null || rate === undefined) return '-'
    return `${rate.toFixed(2)}%`
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Taxes Synchronization</h1>
          <p className="text-muted-foreground mt-2">
            View and manage tax sync status between Odoo and WooCommerce
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
          All Taxes
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
              Loading taxes...
            </CardContent>
          </Card>
        ) : taxes && taxes.length > 0 ? (
          taxes.map((tax) => (
            <Card key={tax.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {tax.odoo_name ? tax.odoo_name : `Tax #${tax.odoo_id}`}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Odoo ID: {tax.odoo_id} | WooCommerce ID: {tax.woocommerce_id}
                    </p>
                    <div className="flex gap-3 mt-2 text-sm text-muted-foreground">
                      <span>Rate: {formatRate(tax.rate)}</span>
                      {tax.tax_scope && <span>Scope: {tax.tax_scope}</span>}
                      <span>Price Include: {tax.price_include ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {tax.created && (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Created
                      </Badge>
                    )}
                    {tax.updated && (
                      <Badge variant="default" className="bg-blue-600">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Updated
                      </Badge>
                    )}
                    {tax.skipped && (
                      <Badge variant="secondary">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Skipped
                      </Badge>
                    )}
                    {tax.error && (
                      <Badge variant="destructive">
                        <XCircle className="mr-1 h-3 w-3" />
                        Error
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{tax.message}</p>
                {tax.last_synced_at && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Last synced: {formatDate(tax.last_synced_at)}
                  </p>
                )}
                {tax.error_details && (
                  <div className="mt-3 p-3 bg-destructive/10 rounded-md">
                    <p className="text-sm text-destructive font-mono">
                      {tax.error_details}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Percent className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No taxes synced yet</p>
              <p className="text-sm mt-1">
                Go to Odoo → Taxes to load and sync taxes from Odoo
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}