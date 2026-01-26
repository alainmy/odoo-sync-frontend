import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Check, X, DollarSign, Zap } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';

interface PricelistSync {
  id: number;
  odoo_pricelist_id: number;
  odoo_pricelist_name: string | null;
  instance_id: number;
  active: boolean;
  price_type: 'regular' | 'sale' | 'meta';
  meta_key: string | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
  message: string | null;
}

interface OdooPricelist {
  id: number;
  name: string;
  active: boolean;
  currency_id: [number, string] | null;
}

interface FormData {
  odoo_pricelist_id: number | null;
  odoo_pricelist_name: string;
  instance_id?: number;
  active: boolean;
  price_type: 'regular' | 'sale' | 'meta';
  meta_key: string;
}

export default function PricelistsSync() {
  const instanceId = parseInt(localStorage.getItem('active_instance_id') || '1');
  const [configs, setConfigs] = useState<PricelistSync[]>([]);
  const [odooPricelists, setOdooPricelists] = useState<OdooPricelist[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<PricelistSync | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState<FormData>({
    odoo_pricelist_id: null,
    odoo_pricelist_name: '',
    active: true,
    price_type: 'regular',
    meta_key: '',
  });

  useEffect(() => {
    fetchConfigs();
    fetchOdooPricelists();
  }, [instanceId]);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/v1/pricelists/config?instance_id=${instanceId}`);
      setConfigs(response.data);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load pricelist configurations',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOdooPricelists = async () => {
    try {
      const response = await api.get('/api/v1/pricelists/odoo/pricelists');
      console.log('Odoo Pricelists Response:', response.data);
      console.log('Is Array?', Array.isArray(response.data));
      console.log('Length:', response.data?.length);
      setOdooPricelists(response.data);
      console.log('State updated');
    } catch (error) {
      console.error('Error fetching Odoo pricelists:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load Odoo pricelists',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.odoo_pricelist_id) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please select an Odoo pricelist',
      });
      return;
    }

    if (formData.price_type === 'meta' && !formData.meta_key) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Meta key is required for custom price type',
      });
      return;
    }

    try {
      const payload = {
        ...formData,
        instance_id: instanceId,
      };

      if (editingConfig) {
        await api.put(`/api/v1/pricelists/config/${editingConfig.id}`, payload);
        toast({
          title: 'Success',
          description: 'Pricelist configuration updated successfully',
        });
      } else {
        await api.post('/api/v1/pricelists/config', payload);
        toast({
          title: 'Success',
          description: 'Pricelist configuration created successfully',
        });
      }

      fetchConfigs();
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to save configuration',
      });
    }
  };

  const handleEdit = (config: PricelistSync) => {
    setEditingConfig(config);
    setFormData({
      odoo_pricelist_id: config.odoo_pricelist_id,
      odoo_pricelist_name: config.odoo_pricelist_name || '',
      instance_id: config.instance_id,
      active: config.active,
      price_type: config.price_type,
      meta_key: config.meta_key || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this pricelist configuration?')) {
      return;
    }

    try {
      await api.delete(`/api/v1/pricelists/config/${id}`);
      toast({
        title: 'Success',
        description: 'Pricelist configuration deleted successfully',
      });
      fetchConfigs();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete configuration',
      });
    }
  };

  const handleSyncAllPrices = async () => {
    try {
      toast({
        title: 'Sync Started',
        description: 'Bulk price synchronization has been started in the background',
      });

      await api.post('/api/v1/pricelists/sync/bulk', {
        instance_id: instanceId,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to start price synchronization',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      odoo_pricelist_id: null,
      odoo_pricelist_name: '',
      active: true,
      price_type: 'regular',
      meta_key: '',
    });
    setEditingConfig(null);
  };

  const handlePricelistSelect = (pricelistId: string) => {
    const pricelist = odooPricelists.find(p => p.id === parseInt(pricelistId));
    if (pricelist) {
      setFormData({
        ...formData,
        odoo_pricelist_id: pricelist.id,
        odoo_pricelist_name: pricelist.name,
      });
    }
  };

  const getPriceTypeBadge = (type: string) => {
    switch (type) {
      case 'regular':
        return <Badge className="bg-blue-600">Regular Price</Badge>;
      case 'sale':
        return <Badge className="bg-green-600">Sale Price</Badge>;
      case 'meta':
        return <Badge className="bg-purple-600">Custom Field</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pricelist Synchronization</h1>
          <p className="text-muted-foreground mt-2">
            Configure and manage price synchronization from Odoo to WooCommerce
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSyncAllPrices} variant="outline">
            <Zap className="mr-2 h-4 w-4" />
            Sync All Prices
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }} key={odooPricelists.length}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Pricelist
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingConfig ? 'Edit Pricelist Configuration' : 'Add Pricelist Configuration'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="pricelist">Odoo Pricelist ({odooPricelists.length} available)</Label>
                  <Select
                    key={`pricelist-select-${odooPricelists.length}`}
                    value={formData.odoo_pricelist_id?.toString() || ''}
                    onValueChange={handlePricelistSelect}
                    disabled={editingConfig !== null}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={odooPricelists.length === 0 ? "Loading..." : "Select a pricelist"} />
                    </SelectTrigger>
                    <SelectContent>
                      {odooPricelists.map((pricelist) => (
                        <SelectItem key={pricelist.id} value={pricelist.id.toString()}>
                          {pricelist.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="price_type">Price Type in WooCommerce</Label>
                  <Select
                    value={formData.price_type}
                    onValueChange={(value: any) => setFormData({ ...formData, price_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">Regular Price</SelectItem>
                      <SelectItem value="sale">Sale Price</SelectItem>
                      <SelectItem value="meta">Custom Meta Field</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.price_type === 'regular' && 'Standard product price'}
                    {formData.price_type === 'sale' && 'Discounted/promotional price'}
                    {formData.price_type === 'meta' && 'Store in custom meta field (for plugins)'}
                  </p>
                </div>

                {formData.price_type === 'meta' && (
                  <div>
                    <Label htmlFor="meta_key">Meta Field Key</Label>
                    <Input
                      id="meta_key"
                      value={formData.meta_key}
                      onChange={(e) => setFormData({ ...formData, meta_key: e.target.value })}
                      placeholder="_wholesale_price"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Example: _wholesale_price, _vip_price
                    </p>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked as boolean })}
                  />
                  <Label htmlFor="active" className="cursor-pointer">
                    Active (sync prices automatically)
                  </Label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingConfig ? 'Update' : 'Create'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Loading configurations...
            </CardContent>
          </Card>
        ) : configs.length > 0 ? (
          configs.map((config) => (
            <Card key={config.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-lg">
                        {config.odoo_pricelist_name || `Pricelist #${config.odoo_pricelist_id}`}
                      </CardTitle>
                    </div>
                    <CardDescription className="mt-2">
                      Odoo Pricelist ID: {config.odoo_pricelist_id}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {config.active ? (
                      <Badge variant="default" className="bg-green-600">
                        <Check className="mr-1 h-3 w-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <X className="mr-1 h-3 w-3" />
                        Inactive
                      </Badge>
                    )}
                    {getPriceTypeBadge(config.price_type)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-muted-foreground">WooCommerce Field</p>
                    <p className="mt-1">
                      {config.price_type === 'regular' && 'regular_price'}
                      {config.price_type === 'sale' && 'sale_price'}
                      {config.price_type === 'meta' && (config.meta_key || 'N/A')}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Last Synced</p>
                    <p className="mt-1">{formatDate(config.last_synced_at)}</p>
                  </div>
                  {config.message && (
                    <div className="col-span-2">
                      <p className="font-medium text-muted-foreground">Message</p>
                      <p className="mt-1 text-xs">{config.message}</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(config)}
                  >
                    <Pencil className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(config.id)}
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <DollarSign className="mx-auto h-12 w-12 mb-4 opacity-20" />
              <p className="text-lg font-medium">No pricelist configurations</p>
              <p className="text-sm mt-2">
                Click "Add Pricelist" to configure price synchronization
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
