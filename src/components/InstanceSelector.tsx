import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { api } from '../lib/api';

interface WooCommerceInstance {
  id: number;
  name: string;
  woocommerce_url: string;
  odoo_url: string;
  is_active: boolean;
}

export function InstanceSelector() {
  const [open, setOpen] = useState(false);
  const [instances, setInstances] = useState<WooCommerceInstance[]>([]);
  const [activeInstance, setActiveInstance] = useState<WooCommerceInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchInstances();
  }, []);

  const fetchInstances = async () => {
    try {
      const response = await api.get('/api/v1/instances');
      setInstances(response.data);
      
      // Find active instance
      const active = response.data.find((i: WooCommerceInstance) => i.is_active);
      if (active) {
        setActiveInstance(active);
        localStorage.setItem('active_instance_id', active.id.toString());
      }
    } catch (error) {
      console.error('Error fetching instances:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectInstance = async (instance: WooCommerceInstance) => {
    if (instance.id === activeInstance?.id) {
      setOpen(false);
      return;
    }

    try {
      await api.patch(
        `/api/v1/instances/${instance.id}/activate`
      );

      setActiveInstance(instance);
      localStorage.setItem('active_instance_id', instance.id.toString());
      setOpen(false);

      toast({
        title: 'Instancia activada',
        description: `Ahora estás trabajando con: ${instance.name}`
      });

      // Recargar la página para actualizar todos los datos
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo activar la instancia',
        variant: 'destructive'
      });
      console.error('Error activating instance:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
        <Server className="h-4 w-4" />
        Cargando...
      </div>
    );
  }

  if (!activeInstance) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-destructive">
        <Server className="h-4 w-4" />
        Sin instancia activa
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[280px] justify-between"
        >
          <div className="flex items-center gap-2 truncate">
            <Server className="h-4 w-4 shrink-0" />
            <span className="truncate">{activeInstance.name}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0">
        <Command>
          <CommandInput placeholder="Buscar instancia..." />
          <CommandEmpty>No se encontraron instancias.</CommandEmpty>
          <CommandGroup>
            {instances.map((instance) => (
              <CommandItem
                key={instance.id}
                value={instance.name}
                onSelect={() => handleSelectInstance(instance)}
              >
                <Check
                  className={`mr-2 h-4 w-4 ${
                    instance.id === activeInstance?.id ? 'opacity-100' : 'opacity-0'
                  }`}
                />
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-medium truncate">{instance.name}</span>
                  <span className="text-xs text-muted-foreground truncate">
                    {instance.woocommerce_url}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
