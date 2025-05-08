
import { useEffect, useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useDataStore } from "@/stores";

export const SyncStatusIndicator = () => {
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const { syncAllOrders } = useDataStore();
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Clear any pending timeouts on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);
  
  const handleSync = async () => {
    if (syncState === 'syncing') return;
    
    try {
      setSyncState('syncing');
      
      await syncAllOrders();
      
      setSyncState('success');
      toast.success('Pedidos sincronizados com sucesso');
      
      // Reset status after a delay
      syncTimeoutRef.current = setTimeout(() => {
        setSyncState('idle');
      }, 3000);
    } catch (error) {
      console.error('Error syncing orders:', error);
      setSyncState('error');
      toast.error('Erro ao sincronizar pedidos');
      
      // Reset status after a delay
      syncTimeoutRef.current = setTimeout(() => {
        setSyncState('idle');
      }, 3000);
    }
  };
  
  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleSync}
        disabled={syncState === 'syncing'}
        className="flex items-center gap-2"
      >
        {syncState === 'syncing' && <Loader2 className="h-4 w-4 animate-spin" />}
        {syncState === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
        {syncState === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
        {syncState === 'idle' ? 'Sincronizar Pedidos' : 
          syncState === 'syncing' ? 'Sincronizando...' :
          syncState === 'success' ? 'Sincronizado' : 'Erro'}
      </Button>
    </div>
  );
};
