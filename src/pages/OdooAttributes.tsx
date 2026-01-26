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
import { Loader2, RefreshCw, Search, Filter, Sliders, ChevronDown, ChevronUp } from 'lucide-react';

interface AttributeValue {
  id: number;
  name: string;
  display_name: string;
  html_color: string | null;
  display_type: string;
}

interface AttributeSyncStatus {
  odoo_id: number;
  name: string;
  display_name: string;
  value_count: number;
  values: AttributeValue[];
  sync_status: 'never_synced' | 'synced' | 'error';
  woocommerce_id: number | null;
  last_synced_at: string | null;
  has_error: boolean;
  error_message: string | null;
}

interface AttributeListResponse {
  total_count: number;
  attributes: AttributeSyncStatus[];
  filters_applied: {
    status: string | null;
    search: string | null;
    limit: number;
    offset: number;
  };
}

interface SyncStatsResponse {
  total: number;
  synced: number;
  never_synced: number;
  errors: number;
}

const statusVariants = {
  never_synced: { variant: 'secondary' as const, label: 'Never Synced', color: 'bg-gray-500' },
  synced: { variant: 'default' as const, label: 'Synced', color: 'bg-green-600' },
  error: { variant: 'destructive' as const, label: 'Error', color: 'bg-red-600' },
};

export default function OdooAttributes() {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [expandedAttribute, setExpandedAttribute] = useState<number | null>(null);
  const pageSize = 50;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch attributes with sync status
  const { data, isLoading, refetch, isFetching } = useQuery<AttributeListResponse>({
    queryKey: ['odoo-attributes-sync', search, filterStatus, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: (page * pageSize).toString(),
      });
      
      if (search) params.append('search', search);
      if (filterStatus !== 'all') params.append('filter_status', filterStatus);

      const response = await api.get(`/api/v1/attribute-management/attributes?${params}`);
      return response.data;
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Fetch statistics
  const { data: stats } = useQuery<SyncStatsResponse>({
    queryKey: ['attribute-sync-stats'],
    queryFn: async () => {
      const response = await api.get('/api/v1/attribute-management/attributes/statistics');
      return response.data;
    },
    refetchInterval: 30000,
  });

  // Batch sync mutation
  const batchSyncMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const response = await api.post('/api/v1/attribute-management/attributes/batch-sync', {
        ids,
      });
      return response.data;
    },
    onSuccess: (data: any) => {
      toast({
        title: 'Sync Started',
        description: `${data.queued} attributes queued for synchronization`,
      });
      setSelectedIds([]);
      // Refetch after a delay to see updated status
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['odoo-attributes-sync'] });
        queryClient.invalidateQueries({ queryKey: ['attribute-sync-stats'] });
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Sync Failed',
        description: error.response?.data?.detail || 'Failed to start synchronization',
      });
    },
  });

  const toggleSelectAll = () => {
    if (!data?.attributes) return;
    
    if (selectedIds.length === data.attributes.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.attributes.map((a: AttributeSyncStatus) => a.odoo_id));
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
        title: 'No Attributes Selected',
        description: 'Please select at least one attribute to sync',
      });
      return;
    }

    batchSyncMutation.mutate(selectedIds);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const attributes = data?.attributes || [];
  const totalCount = data?.total_count || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Odoo Attributes Sync</h1>
          <p className="text-muted-foreground">
            Manage synchronization of product attributes from Odoo to WooCommerce
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
              <CardTitle className="text-sm font-medium">Total Attributes</CardTitle>
              <Sliders className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
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
          <CardTitle>Attributes</CardTitle>
          <CardDescription>
            Total: {totalCount} attributes | Selected: {selectedIds.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search attributes..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                className="pl-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={(value) => {
              setFilterStatus(value);
              setPage(0);
            }}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Attributes</SelectItem>
                <SelectItem value="never_synced">Never Synced</SelectItem>
                <SelectItem value="synced">Synced</SelectItem>
                <SelectItem value="error">Errors</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleSync}
              disabled={selectedIds.length === 0 || batchSyncMutation.isPending}
            >
              {batchSyncMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Sync Selected ({selectedIds.length})
            </Button>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedIds.length === attributes.length && attributes.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Attribute Name</TableHead>
                      <TableHead>Odoo ID</TableHead>
                      <TableHead>Values</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>WC ID</TableHead>
                      <TableHead>Last Synced</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attributes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground">
                          No attributes found
                        </TableCell>
                      </TableRow>
                    ) : (
                      <>
                        {attributes.map((attribute: AttributeSyncStatus) => (
                          <>
                            <TableRow key={attribute.odoo_id}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedIds.includes(attribute.odoo_id)}
                                  onCheckedChange={() => toggleSelect(attribute.odoo_id)}
                                />
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setExpandedAttribute(
                                    expandedAttribute === attribute.odoo_id ? null : attribute.odoo_id
                                  )}
                                  className="h-8 w-8 p-0"
                                >
                                  {expandedAttribute === attribute.odoo_id ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </Button>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">{attribute.display_name}</div>
                                {attribute.has_error && attribute.error_message && (
                                  <div className="text-xs text-destructive mt-1">
                                    {attribute.error_message}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {attribute.odoo_id}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {attribute.value_count} values
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={statusVariants[attribute.sync_status].variant}
                                  className={statusVariants[attribute.sync_status].color}
                                >
                                  {statusVariants[attribute.sync_status].label}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {attribute.woocommerce_id || '-'}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatDate(attribute.last_synced_at)}
                              </TableCell>
                            </TableRow>
                            {expandedAttribute === attribute.odoo_id && (
                              <TableRow>
                                <TableCell colSpan={8} className="bg-muted/30">
                                  <div className="p-4">
                                    <p className="text-sm font-medium mb-2">Attribute Values ({attribute.value_count}):</p>
                                    <div className="flex flex-wrap gap-2">
                                      {attribute.values && attribute.values.length > 0 ? (
                                        attribute.values.map((value) => (
                                          <Badge key={value.id} variant="outline" className="flex items-center gap-2">
                                            {value.html_color && (
                                              <div
                                                className="w-3 h-3 rounded-full border"
                                                style={{ backgroundColor: value.html_color }}
                                              />
                                            )}
                                            {value.display_name}
                                          </Badge>
                                        ))
                                      ) : (
                                        <span className="text-sm text-muted-foreground">No values found</span>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        ))}
                      </>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, totalCount)} of {totalCount}
                </div>
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
