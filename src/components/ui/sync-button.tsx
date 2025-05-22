import React, { useState } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useDataStore } from '@/stores';
import { toast } from 'sonner';

interface SyncButtonProps extends ButtonProps {
  syncType?: 'all' | 'orders';
  children?: React.ReactNode;
}

// Utilitário para disparar eventos globais de forma segura
const dispatchGlobalEvent = (() => {
  const lastEvents: Record<string, number> = {};
  return (eventName: string, minInterval = 100) => {
    const now = Date.now();
    if (!lastEvents[eventName] || now - lastEvents[eventName] > minInterval) {
      window.dispatchEvent(new CustomEvent(eventName));
      lastEvents[eventName] = now;
    }
  };
})();

export function SyncButton({ syncType = 'all', children, ...props }: SyncButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const { refreshAll, syncOrders, isLoading } = useDataStore();
  
  // Prevent multiple clicks
  const disabled = isSyncing || isLoading || props.disabled;
  
  const handleSync = async () => {
    try {
      setIsSyncing(true);
      
      if (syncType === 'orders') {
        await syncOrders();
      } else {
        await refreshAll();
      }
      
      // Trigger UI updates
      dispatchGlobalEvent('data-updated');
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Erro na sincronização');
    } finally {
      setIsSyncing(false);
    }
  };
  
  return (
    <Button 
      variant="outline" 
      onClick={handleSync} 
      disabled={disabled}
      {...props}
    >
      {isSyncing ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Sincronizando...
        </>
      ) : (
        children || 'Sincronizar'
      )}
    </Button>
  );
}
