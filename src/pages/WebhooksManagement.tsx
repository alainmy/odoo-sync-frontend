import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Check, X, RefreshCw, Webhook, PlayCircle, Zap } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';

interface WebhookConfig {
  id: number;
  instance_id: number;
  topic: string;
  delivery_url: string;
  name: string | null;
  secret: string | null;
  wc_webhook_id: number | null;
  status: 'active' | 'paused' | 'disabled';
  active: boolean;
  api_version: string;
  delivery_count: number;
  last_delivery_at: string | null;
  created_at: string;
  updated_at: string;
}

interface FormData {
  topic: string;
  delivery_url: string;
  name: string;
  secret: string;
  status: 'active' | 'paused' | 'disabled';
  active: boolean;
}

const WEBHOOK_TOPICS = [
  { value: 'product.created', label: 'Product Created' },
  { value: 'product.updated', label: 'Product Updated' },
  { value: 'product.deleted', label: 'Product Deleted' },
  { value: 'product.restored', label: 'Product Restored' },
  { value: 'order.created', label: 'Order Created' },
  { value: 'order.updated', label: 'Order Updated' },
  { value: 'order.deleted', label: 'Order Deleted' },
  { value: 'order.restored', label: 'Order Restored' },
  { value: 'customer.created', label: 'Customer Created' },
  { value: 'customer.updated', label: 'Customer Updated' },
  { value: 'customer.deleted', label: 'Customer Deleted' },
  { value: 'coupon.created', label: 'Coupon Created' },
  { value: 'coupon.updated', label: 'Coupon Updated' },
  { value: 'coupon.deleted', label: 'Coupon Deleted' },
  { value: 'coupon.restored', label: 'Coupon Restored' },
];

export default function WebhooksManagement() {
  const instanceId = parseInt(localStorage.getItem('active_instance_id') || '1');
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookConfig | null>(null);
  const [testingUrl, setTestingUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState<FormData>({
    topic: '',
    delivery_url: '',
    name: '',
    secret: '',
    status: 'active',
    active: true,
  });

  useEffect(() => {
    fetchWebhooks();
  }, [instanceId]);

  const fetchWebhooks = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/v1/webhooks/config?instance_id=${instanceId}`);
      setWebhooks(response.data);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load webhooks',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.topic || !formData.delivery_url) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Topic and delivery URL are required',
      });
      return;
    }

    try {
      if (editingWebhook) {
        await api.put(`/api/v1/webhooks/config/${editingWebhook.id}`, formData);
        toast({
          title: 'Success',
          description: 'Webhook updated successfully',
        });
      } else {
        await api.post('/api/v1/webhooks/config', {
          ...formData,
          instance_id: instanceId,
        });
        toast({
          title: 'Success',
          description: 'Webhook created successfully',
        });
      }
      fetchWebhooks();
      resetForm();
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to save webhook',
      });
    }
  };

  const handleEdit = (webhook: WebhookConfig) => {
    setEditingWebhook(webhook);
    setFormData({
      topic: webhook.topic,
      delivery_url: webhook.delivery_url,
      name: webhook.name || '',
      secret: webhook.secret || '',
      status: webhook.status,
      active: webhook.active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this webhook? It will also be removed from WooCommerce.')) {
      return;
    }

    try {
      await api.delete(`/api/v1/webhooks/config/${id}?delete_from_wc=true`);
      toast({
        title: 'Success',
        description: 'Webhook deleted successfully',
      });
      fetchWebhooks();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete webhook',
      });
    }
  };

  const handleSyncToWooCommerce = async (id: number) => {
    try {
      const response = await api.post(`/api/v1/webhooks/sync/${id}`);
      toast({
        title: 'Success',
        description: response.data.message,
      });
      fetchWebhooks();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to sync webhook',
      });
    }
  };

  const handleTestWebhook = async (deliveryUrl: string) => {
    setTestingUrl(deliveryUrl);
    try {
      const response = await api.post(`/api/v1/webhooks/test?delivery_url=${encodeURIComponent(deliveryUrl)}`);
      const result = response.data;

      toast({
        variant: result.success ? 'default' : 'destructive',
        title: result.success ? 'Test Successful' : 'Test Failed',
        description: `${result.message}${result.response_time_ms ? ` (${result.response_time_ms}ms)` : ''}`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Test Error',
        description: error.response?.data?.detail || 'Failed to test webhook',
      });
    } finally {
      setTestingUrl(null);
    }
  };

  const resetForm = () => {
    setFormData({
      topic: '',
      delivery_url: '',
      name: '',
      secret: '',
      status: 'active',
      active: true,
    });
    setEditingWebhook(null);
  };

  const getStatusBadge = (status: string, active: boolean) => {
    if (!active) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-600">Active</Badge>;
      case 'paused':
        return <Badge variant="secondary">Paused</Badge>;
      case 'disabled':
        return <Badge variant="destructive">Disabled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTopicLabel = (topic: string) => {
    return WEBHOOK_TOPICS.find(t => t.value === topic)?.label || topic;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Webhooks Management</h2>
          <p className="text-muted-foreground">
            Configure WooCommerce webhooks for real-time event notifications
          </p>
        </div>
        <Dialog 
          open={isDialogOpen} 
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}
          key={webhooks.length}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingWebhook ? 'Edit Webhook' : 'Add New Webhook'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="topic">Topic *</Label>
                  <Select
                    value={formData.topic}
                    onValueChange={(value) => setFormData({ ...formData, topic: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select webhook topic" />
                    </SelectTrigger>
                    <SelectContent>
                      {WEBHOOK_TOPICS.map((topic) => (
                        <SelectItem key={topic.value} value={topic.value}>
                          {topic.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="delivery_url">Delivery URL *</Label>
                  <Input
                    id="delivery_url"
                    type="url"
                    placeholder="https://your-app.com/webhook"
                    value={formData.delivery_url}
                    onChange={(e) => setFormData({ ...formData, delivery_url: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="name">Name (Optional)</Label>
                  <Input
                    id="name"
                    placeholder="My Webhook"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="secret">Secret (Optional)</Label>
                  <Input
                    id="secret"
                    type="password"
                    placeholder="webhook_secret_key"
                    value={formData.secret}
                    onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Used to verify webhook signatures
                  </p>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked as boolean })}
                  />
                  <Label htmlFor="active" className="cursor-pointer">
                    Enable this webhook
                  </Label>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    setIsDialogOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingWebhook ? 'Update' : 'Create'} Webhook
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Loading webhooks...
            </CardContent>
          </Card>
        ) : webhooks.length > 0 ? (
          webhooks.map((webhook) => (
            <Card key={webhook.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Webhook className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-lg">
                        {webhook.name || getTopicLabel(webhook.topic)}
                      </CardTitle>
                    </div>
                    <CardDescription className="mt-2">
                      Topic: <span className="font-mono text-xs">{webhook.topic}</span>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {getStatusBadge(webhook.status, webhook.active)}
                    {webhook.wc_webhook_id && (
                      <Badge variant="outline">WC #{webhook.wc_webhook_id}</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Delivery URL:</span>
                      <div className="font-mono text-xs mt-1 break-all">{webhook.delivery_url}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Deliveries:</span>
                      <div className="mt-1">{webhook.delivery_count} times</div>
                    </div>
                  </div>

                  {webhook.last_delivery_at && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Last delivery:</span>
                      <span className="ml-2">{new Date(webhook.last_delivery_at).toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(webhook)}>
                      <Pencil className="mr-1 h-3 w-3" />
                      Edit
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSyncToWooCommerce(webhook.id)}
                    >
                      <RefreshCw className="mr-1 h-3 w-3" />
                      {webhook.wc_webhook_id ? 'Update in WC' : 'Sync to WC'}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTestWebhook(webhook.delivery_url)}
                      disabled={testingUrl === webhook.delivery_url}
                    >
                      <PlayCircle className="mr-1 h-3 w-3" />
                      {testingUrl === webhook.delivery_url ? 'Testing...' : 'Test'}
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(webhook.id)}
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Webhook className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No webhooks configured yet</p>
              <p className="text-sm mt-2">Click "Add Webhook" to create your first webhook</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
