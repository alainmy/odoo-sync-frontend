import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateActiveInstance } from '../services/instanceService';
import { useInstanceStore } from '@/stores/instanceStore';

export default function Settings() {
  const { activeInstance, fetchActiveInstance } = useInstanceStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({
    woocommerce_url: '',
    woocommerce_consumer_key: '',
    woocommerce_consumer_secret: '',
    odoo_url: '',
    odoo_db: '',
    odoo_username: '',
    odoo_password: '',
    sync_interval_minutes: 15,
    auto_sync_products: false,
    auto_sync_orders: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await fetchActiveInstance();
      if (activeInstance) {
        setForm({
          woocommerce_url: activeInstance.woocommerce_url || '',
          woocommerce_consumer_key: activeInstance.woocommerce_consumer_key || '',
          woocommerce_consumer_secret: activeInstance.woocommerce_consumer_secret || '',
          odoo_url: activeInstance.odoo_url || '',
          odoo_db: activeInstance.odoo_db || '',
          odoo_username: activeInstance.odoo_username || '',
          odoo_password: activeInstance.odoo_password || '',
          sync_interval_minutes: (activeInstance as any).sync_interval_minutes || 15,
          auto_sync_products: (activeInstance as any).auto_sync_products || false,
          auto_sync_orders: (activeInstance as any).auto_sync_orders || false,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar la configuración',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.id]: e.target.value });
  };

  const handleSaveConnection = async () => {
    if (!activeInstance) return;
    setSaving(true);
    try {
      await updateActiveInstance(activeInstance.id, {
        woocommerce_url: form.woocommerce_url,
        woocommerce_consumer_key: form.woocommerce_consumer_key,
        woocommerce_consumer_secret: form.woocommerce_consumer_secret,
        odoo_url: form.odoo_url,
        odoo_db: form.odoo_db,
        odoo_username: form.odoo_username,
        odoo_password: form.odoo_password,
      });
      toast({
        title: 'Éxito',
        description: 'Configuración guardada correctamente'
      });
      fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo guardar la configuración',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSync = async () => {
    if (!activeInstance) return;
    setSaving(true);
    try {
      await updateActiveInstance(activeInstance.id, {
        sync_interval_minutes: parseInt(form.sync_interval_minutes),
        auto_sync_products: form.auto_sync_products,
        auto_sync_orders: form.auto_sync_orders,
      });
      toast({
        title: 'Éxito',
        description: 'Configuración de sincronización guardada'
      });
      fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo guardar la configuración',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Cargando configuración...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure WooCommerce and Odoo connections
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              WooCommerce Configuration
            </CardTitle>
            <CardDescription>
              Configure your WooCommerce store connection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="woocommerce_url">Store URL</Label>
              <Input
                id="woocommerce_url"
                placeholder="https://yourstore.com"
                value={form.woocommerce_url}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="woocommerce_consumer_key">Consumer Key</Label>
              <Input
                id="woocommerce_consumer_key"
                type="password"
                placeholder="ck_..."
                value={form.woocommerce_consumer_key}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="woocommerce_consumer_secret">Consumer Secret</Label>
              <Input
                id="woocommerce_consumer_secret"
                type="password"
                placeholder="cs_..."
                value={form.woocommerce_consumer_secret}
                onChange={handleChange}
              />
            </div>
            <Button className="w-full" onClick={handleSaveConnection} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              Guardar WooCommerce
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Odoo Configuration
            </CardTitle>
            <CardDescription>
              Configure your Odoo instance connection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="odoo_url">Odoo URL</Label>
              <Input
                id="odoo_url"
                placeholder="https://yourinstance.odoo.com"
                value={form.odoo_url}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="odoo_db">Database</Label>
              <Input
                id="odoo_db"
                placeholder="database_name"
                value={form.odoo_db}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="odoo_username">Username</Label>
              <Input
                id="odoo_username"
                placeholder="admin"
                value={form.odoo_username}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="odoo_password">Password</Label>
              <Input
                id="odoo_password"
                type="password"
                placeholder="••••••••"
                value={form.odoo_password}
                onChange={handleChange}
              />
            </div>
            <Button className="w-full" onClick={handleSaveConnection} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              Guardar Odoo
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Synchronization Settings</CardTitle>
          <CardDescription>
            Configure automatic synchronization intervals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-1">
            <div className="space-y-2">
              <Label htmlFor="sync_interval_minutes">Sync Interval (minutes)</Label>
              <Input
                id="sync_interval_minutes"
                type="number"
                placeholder="15"
                value={form.sync_interval_minutes}
                onChange={handleChange}
              />
            </div>
          </div>
          <Button onClick={handleSaveSync} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            Guardar Sync Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
