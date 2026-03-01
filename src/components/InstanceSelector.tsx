import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { useInstanceStore } from '@/stores/instanceStore';

export function InstanceSelector() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const {
    activeInstance,
    instances,
    isLoading,
    fetchInstances,
    activateInstance
  } = useInstanceStore();

  useEffect(() => {
    fetchInstances();
    console.log('Fetched instances:', activeInstance);
  }, [fetchInstances]);

  const handleSelectInstance = async (instanceId: number, instanceName: string) => {
    console.log('Selected instance ID:', instanceId);
    console.log('Current active instance ID:', activeInstance?.id);
    if (instanceId === activeInstance?.id) {
      setOpen(false);
      return;
    }

    try {
      await activateInstance(instanceId);
      setOpen(false);
      window.location.reload(); // Recargar la página para reflejar el cambio de instancia
      toast({
        title: 'Instance Activated',
        description: `Now you are working with: ${instanceName}`
      });

    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to activate instance',
        variant: 'destructive'
      });
      console.error('Error activating instance:', error);
    }
  };

  if (isLoading && !activeInstance) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
        <Server className="h-4 w-4" />
        Loading...
      </div>
    );
  }

  if (!activeInstance) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-destructive">
        <Server className="h-4 w-4" />
        No active instance
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
          {instances.length === 0 && (
            <CommandEmpty>No instances found.</CommandEmpty>
          )}
          <CommandList>
            <CommandGroup>
              {instances.map((instance) => (
                <div
                  className="flex items-center w-full cursor-pointer"
                  onClick={() => {
                    handleSelectInstance(instance.id, instance.name)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${instance.id === Number(activeInstance?.id)
                        ? 'opacity-100'
                        : 'opacity-0'
                      }`}
                  />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-medium truncate">{instance.name}</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {instance.woocommerce_url}
                    </span>
                  </div>
                </div>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
