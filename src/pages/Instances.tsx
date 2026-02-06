import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { api } from '../lib/api';
import { useInstanceStore, WooCommerceInstance } from '@/stores/instanceStore';
import { Select, SelectContent, SelectItem, SelectTrig, SelectTrigger, SelectValue, } from '@/components/ui/select';

interface FormData {
  name: string;
  woocommerce_url: string;
  woocommerce_consumer_key: string;
  woocommerce_consumer_secret: string;
  odoo_url: string;
  odoo_db: string;
  odoo_username: string;
  odoo_password: string;
  is_active: boolean;
  odoo_language: string;
}

export default function Instances() {
  const { instances, isLoading, fetchInstances, activateInstance, languages,fetchLanguages } = useInstanceStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInstance, setEditingInstance] = useState<WooCommerceInstance | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    woocommerce_url: '',
    woocommerce_consumer_key: '',
    woocommerce_consumer_secret: '',
    odoo_url: '',
    odoo_db: '',
    odoo_username: '',
    odoo_password: '',
    is_active: false,
    odoo_language: 'en_US'
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchInstances();
    fetchLanguages();
  }, [fetchInstances, fetchLanguages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {

      if (editingInstance) {
        // Actualizar
        await api.put(
          `/api/v1/instances/${editingInstance.id}`,
          formData
        );
        toast({
          title: 'Éxito',
          description: 'Instancia actualizada correctamente'
        });
      } else {
        // Crear
        await api.post(
          '/api/v1/instances',
          formData
        );
        toast({
          title: 'Éxito',
          description: 'Instancia creada correctamente'
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchInstances();
    } catch (error) {
      toast({
        title: 'Error',
        description: editingInstance
          ? 'Error al actualizar la instancia'
          : 'Error al crear la instancia',
        variant: 'destructive'
      });
      console.error('Error saving instance:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta instancia?')) return;

    try {
      await api.delete(`/api/v1/instances/${id}`);
      toast({
        title: 'Éxito',
        description: 'Instancia eliminada correctamente'
      });
      fetchInstances();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al eliminar la instancia',
        variant: 'destructive'
      });
      console.error('Error deleting instance:', error);
    }
  };

  const handleActivate = async (id: number) => {
    try {
      await activateInstance(id);
      toast({
        title: 'Éxito',
        description: 'Instancia activada correctamente'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al activar la instancia',
        variant: 'destructive'
      });
      console.error('Error activating instance:', error);
    }
  };

  const openEditDialog = (instance: WooCommerceInstance) => {
    console.log('Editing instance:', instance);
    setEditingInstance(instance);
    setFormData({
      name: instance.name,
      woocommerce_url: instance.woocommerce_url,
      woocommerce_consumer_key: instance.woocommerce_consumer_key,
      woocommerce_consumer_secret: instance.woocommerce_consumer_secret,
      odoo_url: instance.odoo_url,
      odoo_db: instance.odoo_db,
      odoo_username: instance.odoo_username,
      odoo_password: instance.odoo_password,
      is_active: instance.is_active,
      odoo_language: instance.odoo_language
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingInstance(null);
    setFormData({
      name: '',
      woocommerce_url: '',
      woocommerce_consumer_key: '',
      woocommerce_consumer_secret: '',
      odoo_url: '',
      odoo_db: '',
      odoo_username: '',
      odoo_password: '',
      is_active: false,
      odoo_language: 'en_US'
    });
  };

  const openNewDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Instancias</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona tus configuraciones de WooCommerce y Odoo
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Instancia
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingInstance ? 'Editar Instancia' : 'Nueva Instancia'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Mi tienda principal"
                  required
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Configuración WooCommerce</h3>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="wc_url">URL de la tienda</Label>
                    <Input
                      id="wc_url"
                      value={formData.woocommerce_url}
                      onChange={(e) => setFormData({ ...formData, woocommerce_url: e.target.value })}
                      placeholder="https://mitienda.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wc_key">Consumer Key</Label>
                    <Input
                      id="wc_key"
                      value={formData.woocommerce_consumer_key}
                      onChange={(e) => setFormData({ ...formData, woocommerce_consumer_key: e.target.value })}
                      placeholder="ck_..."
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wc_secret">Consumer Secret</Label>
                    <Input
                      id="wc_secret"
                      type="password"
                      value={formData.woocommerce_consumer_secret}
                      onChange={(e) => setFormData({ ...formData, woocommerce_consumer_secret: e.target.value })}
                      placeholder="cs_..."
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Configuración Odoo</h3>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="odoo_url">URL de Odoo</Label>
                    <Input
                      id="odoo_url"
                      value={formData.odoo_url}
                      onChange={(e) => setFormData({ ...formData, odoo_url: e.target.value })}
                      placeholder="https://miodoo.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="odoo_db">Base de datos</Label>
                    <Input
                      id="odoo_db"
                      value={formData.odoo_db}
                      onChange={(e) => setFormData({ ...formData, odoo_db: e.target.value })}
                      placeholder="nombre_db"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="odoo_user">Usuario</Label>
                    <Input
                      id="odoo_user"
                      value={formData.odoo_username}
                      onChange={(e) => setFormData({ ...formData, odoo_username: e.target.value })}
                      placeholder="admin@miodoo.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="odoo_pass">Contraseña</Label>
                    <Input
                      id="odoo_pass"
                      type="password"
                      value={formData.odoo_password}
                      onChange={(e) => setFormData({ ...formData, odoo_password: e.target.value })}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="odoo_language">Language</Label>
                    <Select
                      value={formData.odoo_language}
                      onValueChange={(value) => setFormData({ ...formData, odoo_language: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar idioma" />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((lang) => (
                          <SelectItem  key={lang.code} value={lang.code}>
                            {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div> 
                </div>
              </div>

              <div className="flex items-center space-x-2 border-t pt-4">
                <Checkbox
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked as boolean })}
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  Marcar como instancia activa
                </Label>
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingInstance ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-10">
            <p className="text-center text-muted-foreground">Cargando instancias...</p>
          </CardContent>
        </Card>
      ) : instances.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <p className="text-center text-muted-foreground">
              No hay instancias configuradas. Crea una nueva para empezar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {instances.map((instance) => (
            <Card key={instance.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {instance.name}
                      {instance.is_active && (
                        <Badge variant="default" className="ml-2">
                          <Check className="h-3 w-3 mr-1" />
                          Activa
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      WC: {instance.woocommerce_url}
                      <br />
                      Odoo: {instance.odoo_url} ({instance.odoo_db})
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  {!instance.is_active && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleActivate(instance.id)}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Activar
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(instance)}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(instance.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
