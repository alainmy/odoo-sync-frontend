import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw, Search, Sliders, Filter } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { DialogTitle } from '@radix-ui/react-dialog';
import { Label } from '@/components/ui/label';

interface ProductSyncStatus {
  odoo_id: number;
  name: string;
  sku: string | null;
  price: number | null;
  odoo_write_date: string | null;
  sync_status: 'never_synced' | 'synced' | 'modified' | 'error';
  woocommerce_id: number | null;
  last_synced_at: string | null;
  needs_sync: boolean;
  published: boolean;
  has_error: boolean;
  error_message: string | null;
}

interface ProductListResponse {
  total_count: number;
  products: ProductSyncStatus[];
  filters_applied: {
    status: string | null;
    search: string | null;
    category_id: number | null;
    limit: number;
    offset: number;
  };
}

interface SyncStatsResponse {
  total_products: number;
  synced: number;
  never_synced: number;
  modifed: number;
  errors: number;
}

interface BatchSyncParams {
  odoo_ids: number[];
  publishProduct: boolean;
  force_sync?: boolean;
  create_if_not_exists?: boolean;
  update_existing?: boolean;
}

const statusVariants = {
  never_synced: { variant: 'secondary' as const, label: 'Never Synced' },
  synced: { variant: 'success' as const, label: 'Synced' },
  modified: { variant: 'warning' as const, label: 'Modified' },
  error: { variant: 'destructive' as const, label: 'Error' },
};

export default function OdooProductsSync() {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [page, setPage] = useState(0);
  // const pageSize = 50;
  const [pageSize, setPageSize] = useState(50);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [publishProduct, setPublishProduct] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // Fetch statistics
  const { data: stats } = useQuery<SyncStatsResponse>({
    queryKey: ['attribute-sync-stats'],
    queryFn: async () => {
      const response = await api.get('/api/v1/sync-management/statistics');
      return response.data;
    },
    refetchInterval: 30000,
  });
  // Fetch products with sync status
  const { data, isLoading, refetch, isFetching } = useQuery<ProductListResponse>({
    queryKey: ['odoo-products-sync', search, filterStatus, page, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: (page).toString(),
      });

      if (search) params.append('search', search);
      if (filterStatus !== 'all') params.append('filter_status', filterStatus);
      try {

        const response = await api.get(`/api/v1/sync-management/products?${params}`);
        return response.data;
      } catch (error: any) {
        console.error('Error fetching products:', error);
        toast({
          variant: 'destructive',
          title: 'Error fetching products',
          description: error.response?.data?.detail || 'Failed to fetch products',
        });
        throw error;
      }
    },
    staleTime: 5000, // Consider data fresh for 5 seconds
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

  // Batch sync mutation
  const batchSyncMutation = useMutation({
    mutationFn: async (params: BatchSyncParams) => {
      const response = await api.post('/api/v1/sync-management/products/batch-sync', {
        odoo_ids: params.odoo_ids,
        force_sync: false,
        create_if_not_exists: true,
        update_existing: true,
        publish_roduct: params.publishProduct
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Sync Started',
        description: `${data.total_products} products queued for synchronization`,
      });
      setSelectedIds([]);
      // Refetch after a delay to see updated status
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['odoo-products-sync'] });
      }, 2000);
    },
    onError: (error: any) => {
      let message = '';
      if (error.response?.data?.detail) {
        message = error.response?.data?.detail.map((d: any) => d.msg).join(', ');
      }
      toast({
        variant: 'destructive',
        title: 'Sync Failed',
        description: message || 'Failed to start synchronization',
      });
    },
  });

  const toggleSelectAll = () => {
    if (!data?.products) return;

    if (selectedIds.length === data.products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.products.map(p => p.odoo_id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSync = () => {
    if (selectedIds.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Products Selected',
        description: 'Please select at least one product to sync',
      });
      return;
    }
    setIsDialogOpen(true);
    // batchSyncMutation.mutate(selectedIds);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const products = data?.products || [];
  const totalCount = data?.total_count || 0;

  // Debug logging
  console.log('Products data:', {
    totalCount,
    pageSize,
    productsLength: products.length,
    showPagination: totalCount > 0
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Odoo Products Sync</h1>
          <p className="text-muted-foreground">
            Manage synchronization of products from Odoo to WooCommerce
          </p>
        </div>
        <Button
          onClick={() => refetch()}
          variant="outline"
          size="sm"
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Sliders className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_products}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Synced</CardTitle>
              <div className="h-3 w-3 rounded-full bg-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.synced}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Never Synced</CardTitle>
              <div className="h-3 w-3 rounded-full bg-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.never_synced}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Errors</CardTitle>
              <div className="h-3 w-3 rounded-full bg-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.errors}</div>
            </CardContent>
          </Card>
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>
            Total: {totalCount} products | Selected: {selectedIds.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or SKU..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                className="pl-9"
              />
            </div>
            <Select value={pageSize.toString()} onValueChange={(value) => {
              setPageSize(parseInt(value));
              setPage(0);
            }}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Items per page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
                <SelectItem value="100">100 per page</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={(value) => {
              setFilterStatus(value);
              setPage(0);
            }}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="never_synced">Never Synced</SelectItem>
                <SelectItem value="modified">Modified</SelectItem>
                <SelectItem value="synced">Synced</SelectItem>
                <SelectItem value="error">Errors</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mb-4">
            <Button
              onClick={handleSync}
              disabled={selectedIds.length === 0 || batchSyncMutation.isPending}
            >
              {batchSyncMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Sync Selected ({selectedIds.length})
            </Button>
            {selectedIds.length > 0 && (
              <Button variant="outline" onClick={() => setSelectedIds([])}>
                Clear Selection
              </Button>
            )}
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
            }} key={selectedIds.length}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    Sync Configuration
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  batchSyncMutation.mutate({
                    odoo_ids: selectedIds,
                    publishProduct: publishProduct
                  });
                  setIsDialogOpen(false);
                }}>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="active"
                        checked={publishProduct}
                        onCheckedChange={() => setPublishProduct(true)}
                      />
                      <Label htmlFor="active" className="cursor-pointer">
                        Publish or not the products
                      </Label>
                    </div>

                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1">
                      Sync
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <p className="text-lg font-medium">No products found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedIds.length === products.length && products.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>WC ID</TableHead>
                    <TableHead>Last Synced</TableHead>
                    <TableHead>Published</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.odoo_id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(product.odoo_id)}
                          onCheckedChange={() => toggleSelect(product.odoo_id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {product.name}
                        {product.has_error && (
                          <p className="text-xs text-destructive mt-1">
                            {product.error_message}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {product.sku || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {product.price ? `$${product.price.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariants[product.sync_status].variant}>
                          {statusVariants[product.sync_status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {product.woocommerce_id || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(product.last_synced_at)}
                      </TableCell>
                      <TableCell>
                        {product.published ? (
                          <Badge variant="success">Published</Badge>
                        ) : (
                          <Badge variant="secondary">Draft</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalCount > 0 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, totalCount)} of {totalCount}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={(page + 1) * pageSize >= totalCount}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
