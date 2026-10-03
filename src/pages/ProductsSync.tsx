import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { RefreshCw, CheckCircle, XCircle, AlertCircle, Sliders, Trash2, Server } from 'lucide-react'
import { useState } from 'react'
import { useSyncDeletion } from '@/hooks/use-sync-deletion'
import { useInstanceStore } from '@/stores/instanceStore'

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
  instance_id: number | null
  instance_name: string | null
}

export default function ProductsSync() {
  const [filter, setFilter] = useState<'all' | 'errors'>('all')
  const activeInstance = useInstanceStore(state => state.activeInstance)
  const {
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    handleDeleteSelected,
    handleDeleteAll,
    handleDeleteOne,
    isDeleting,
  } = useSyncDeletion({
    basePath: '/api/v1/sync/products',
    queryKeys: ['products-sync'],
  })

  const { data: products, isLoading, refetch } = useQuery<ProductSync[]>({
    queryKey: ['products-sync', filter],
    queryFn: async () => {
      const params = filter === 'errors' ? { has_error: true } : {}
      const response = await api.get('/api/v1/sync/products', { params })
      return response.data
    },
  })

  const productIds = products?.map(p => p.id) ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products Synchronization</h1>
          <p className="text-muted-foreground mt-2">
            View and manage product sync status between Odoo and WooCommerce
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="destructive"
            onClick={() => handleDeleteAll('product', activeInstance?.name)}
            disabled={isDeleting}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete All
          </Button>
          <Button onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex gap-2 items-center">
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
        {products && products.length > 0 && (
          <>
            <Button
              variant="outline"
              onClick={() => toggleSelectAll(productIds)}
            >
              {selectedIds.length === productIds.length ? 'Deselect All' : 'Select All'}
            </Button>
            <Button
              variant="destructive"
              disabled={selectedIds.length === 0 || isDeleting}
              onClick={() => handleDeleteSelected('product')}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected ({selectedIds.length})
            </Button>
          </>
        )}
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
            <Card key={product.id} className={selectedIds.includes(product.id) ? 'border-primary' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <Checkbox
                      checked={selectedIds.includes(product.id)}
                      onCheckedChange={() => toggleSelect(product.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {product.odoo_name} ({product.odoo_id})
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        WooCommerce ID: {product.woocommerce_id}
                      </p>
                      {product.instance_name && (
                        <Badge variant="outline" className="mt-2">
                          <Server className="mr-1 h-3 w-3" />
                          {product.instance_name}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
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
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      disabled={isDeleting}
                      onClick={() => handleDeleteOne(product.id, product.odoo_name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
