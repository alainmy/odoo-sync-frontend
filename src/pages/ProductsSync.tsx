import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, CheckCircle, XCircle, AlertCircle, Sliders } from 'lucide-react'
import { useState } from 'react'

interface ProductSync {
  id: number
  odoo_id: number
  woocommerce_id: number
  odoo_name: string
  created: boolean
  updated: boolean
  skipped: boolean
  error: boolean
  message: string
  error_details: string | null
  created_at: string
  updated_at: string
}

export default function ProductsSync() {
  const [filter, setFilter] = useState<'all' | 'errors'>('all')

  const { data: products, isLoading, refetch } = useQuery<ProductSync[]>({
    queryKey: ['products-sync', filter],
    queryFn: async () => {
      const params = filter === 'errors' ? { has_error: true } : {}
      const response = await api.get('/api/v1/sync/products', { params })
      return response.data
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products Synchronization</h1>
          <p className="text-muted-foreground mt-2">
            View and manage product sync status between Odoo and WooCommerce
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
          All Products
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
              Loading products...
            </CardContent>
          </Card>
        ) : products && products.length > 0 ? (
          products.map((product) => (
            <Card key={product.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {product.odoo_name} ({product.odoo_id})
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      WooCommerce ID: {product.woocommerce_id}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {product.created && !product.updated && (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Created
                      </Badge>
                    )}
                    {product.updated && (
                      <Badge variant="default" className="bg-blue-600">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Updated
                      </Badge>
                    )}
                    {product.skipped && (
                      <Badge variant="secondary">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Skipped
                      </Badge>
                    )}
                    {product.error && (
                      <Badge variant="destructive">
                        <XCircle className="mr-1 h-3 w-3" />
                        Error
                      </Badge>
                    )}
                    {
                      product.created_at && !product.updated && (
                        <Badge variant="info">
                          Created: {new Date(product.created_at).toLocaleString()}
                        </Badge>
                      )
                    }
                    {
                      product.updated_at  && (
                        <Badge variant="info">
                          Last Updated: {new Date(product.updated_at).toLocaleString()}
                        </Badge>
                      )
                    }
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{product.message}</p>
                {product.error_details && (
                  <div className="mt-3 p-3 bg-destructive/10 rounded-md">
                    <p className="text-sm text-destructive font-mono">
                      {product.error_details}
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
              <p>No products synced yet</p>
              <p className="text-sm mt-1">
                Go to Odoo → Products to load and sync products from Odoo
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
