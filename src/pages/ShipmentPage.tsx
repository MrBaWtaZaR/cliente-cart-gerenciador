import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDataStore, Customer, Shipment } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ShipmentTablePDF, ShipmentCardsPDF } from '@/components/ShipmentPDF';
import { Plus, FileText, CreditCard, Calendar, Download, Eye, Trash2, Edit, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useReactToPrint } from 'react-to-print';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useShipmentSafeUnmount } from '@/components/ShipmentSafeUnmount';

export const ShipmentPage = () => {
  const { customers, shipments, addShipment, getShipments, deleteShipment, updateShipment } = useDataStore();
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [isCreatingShipment, setIsCreatingShipment] = useState(false);
  const [isSelectingCustomers, setIsSelectingCustomers] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [showShipmentDetails, setShowShipmentDetails] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingShipment, setIsDeletingShipment] = useState(false);
  const isUpdatingRef = useRef(false);
  
  // Use our safe unmount utility
  const { isMounted, setPrintRefsExist } = useShipmentSafeUnmount();

  const tableRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  // Filter customers with pending orders only
  const customersWithPendingOrders = useMemo(() => {
    return customers.filter(customer => {
      // Check if customer has at least one pending order
      return customer.orders && customer.orders.some(order => order.status === 'pending');
    });
  }, [customers]);
  
  // Update the print refs status
  useEffect(() => {
    setPrintRefsExist(tableRef.current !== null || cardsRef.current !== null);
  }, [tableRef.current, cardsRef.current, setPrintRefsExist]);

  // Fetch shipments when component mounts or when dependencies change
  useEffect(() => {
    const fetchShipments = async () => {
      // If we're already updating or component has unmounted, don't proceed
      if (isUpdatingRef.current || !isMounted()) return;
      
      isUpdatingRef.current = true;
      if (isMounted()) setIsLoading(true);
      
      try {
        console.log("Fetching shipments on mount...");
        const fetchedShipments = await getShipments();
        console.log("Retrieved", fetchedShipments?.length || 0, "shipments");
      } catch (error) {
        console.error("Error fetching shipments:", error);
        if (isMounted()) {
          toast.error("Falha ao carregar envios. Por favor, recarregue a página.");
        }
      } finally {
        if (isMounted()) {
          setIsLoading(false);
        }
        // Add a small delay before allowing updates again
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 300);
      }
    };
    
    fetchShipments();
  }, [getShipments, isMounted]);

  // Set up separate listener effect, with debounce
  useEffect(() => {
    let updateTimer: ReturnType<typeof setTimeout>;
    
    const handleOrderUpdate = () => {
      // Clear any pending update
      clearTimeout(updateTimer);
      
      // If we're already updating or the component has unmounted, don't proceed
      if (isUpdatingRef.current || !isMounted()) return;
      
      // Debounce the updates with a timeout
      updateTimer = setTimeout(async () => {
        console.log("Handling data update event...");
        
        isUpdatingRef.current = true;
        if (isMounted()) setIsLoading(true);
        
        try {
          await getShipments();
        } catch (error) {
          console.error("Error refreshing shipments on update:", error);
        } finally {
          if (isMounted()) {
            setIsLoading(false);
          }
          
          // Add a delay before allowing updates again
          setTimeout(() => {
            isUpdatingRef.current = false;
          }, 300);
        }
      }, 500); // Add significant debounce time
    };
    
    window.addEventListener('order-updated', handleOrderUpdate);
    window.addEventListener('data-updated', handleOrderUpdate);
    
    return () => {
      clearTimeout(updateTimer);
      window.removeEventListener('order-updated', handleOrderUpdate);
      window.removeEventListener('data-updated', handleOrderUpdate);
    };
  }, [getShipments, isMounted]);

  const handlePrintTable = useReactToPrint({
    documentTitle: `Tabela_de_Envio_${format(new Date(), 'dd-MM-yyyy')}`,
    onBeforePrint: () => {
      return new Promise<void>((resolve) => {
        setTimeout(resolve, 250);
      });
    },
    onAfterPrint: () => {
      if (isMounted()) {
        toast.success('PDF da tabela gerado com sucesso');
      }
    },
    contentRef: tableRef,
  });

  const handlePrintCards = useReactToPrint({
    documentTitle: `Cards_de_Envio_${format(new Date(), 'dd-MM-yyyy')}`,
    onBeforePrint: () => {
      return new Promise<void>((resolve) => {
        setTimeout(resolve, 250);
      });
    },
    onAfterPrint: () => {
      if (isMounted()) {
        toast.success('PDF dos cards gerado com sucesso');
      }
    },
    contentRef: cardsRef,
  });

  const handleCreateShipment = async () => {
    if (selectedCustomers.length === 0) {
      toast.error('Selecione pelo menos um cliente para criar um envio');
      return;
    }

    if (isMounted()) setIsLoading(true);
    
    try {
      const shipment = await addShipment(selectedCustomers);
      if (!shipment) {
        throw new Error("Falha ao criar envio");
      }
      
      if (isMounted()) {
        setSelectedShipment(shipment);
        setIsSelectingCustomers(false);
        setIsCreatingShipment(true);
        
        // Reset selection
        setSelectedCustomers([]);
      }
      
      // Explicitly fetch updated shipments to ensure UI is up to date
      await getShipments();
      console.log("Shipment created and shipments refreshed");
      
      if (isMounted()) {
        toast.success('Envio criado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao criar envio:', error);
      
      if (isMounted()) {
        toast.error('Erro ao criar envio. Por favor, tente novamente.');
      }
    } finally {
      if (isMounted()) {
        setIsLoading(false);
      }
    }
  };

  const handleShowShipmentDetails = (shipment: Shipment) => {
    if (isMounted()) {
      setSelectedShipment(shipment);
      setShowShipmentDetails(true);
    }
  };

  const handleGeneratePDFs = (shipment: Shipment) => {
    if (isMounted()) {
      setSelectedShipment(shipment);
      setIsCreatingShipment(true);
    }
  };

  const handleDeleteShipment = async () => {
    if (!selectedShipment) return;
    
    if (isMounted()) {
      setIsDeletingShipment(true);
      setShowDeleteConfirm(false);
    }
    
    try {
      console.log("Iniciando processo de exclusão do envio:", selectedShipment.id);
      
      // Wait for the deletion to complete
      await deleteShipment(selectedShipment.id);
      
      // Close the details modal only if deletion was successful
      if (isMounted()) {
        setShowShipmentDetails(false);
        setSelectedShipment(null);
      }
      
      // Explicitly refresh
      await getShipments();
      
      // Reset state after successful deletion
      if (isMounted()) {
        setIsDeletingShipment(false);
        toast.success('Envio excluído com sucesso');
      }
      
      console.log("Processo de exclusão concluído com sucesso");
    } catch (error) {
      console.error('Erro ao excluir envio:', error);
      
      if (isMounted()) {
        toast.error('Erro ao excluir envio');
        setIsDeletingShipment(false);
      }
    }
  };

  const handleEditShipment = () => {
    if (!selectedShipment || !isMounted()) return;
    
    // Pre-select customers
    const customerIds = selectedShipment.customers.map(customer => customer.id);
    
    setSelectedCustomers(customerIds);
    setIsEditing(true);
    setShowShipmentDetails(false);
    setIsSelectingCustomers(true);
  };

  const handleSaveEditedShipment = async () => {
    if (!selectedShipment || selectedCustomers.length === 0) {
      toast.error('Selecione pelo menos um cliente para atualizar o envio');
      return;
    }

    if (isMounted()) setIsLoading(true);
    
    try {
      await updateShipment(selectedShipment.id, selectedCustomers);
      
      if (isMounted()) {
        setIsSelectingCustomers(false);
        setIsEditing(false);
        setSelectedCustomers([]);
      }
      
      // Explicitly refresh
      await getShipments();
      console.log("Shipment updated and shipments refreshed");
      
      if (isMounted()) {
        toast.success('Envio atualizado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao atualizar envio:', error);
      
      if (isMounted()) {
        toast.error('Erro ao atualizar envio. Por favor, tente novamente.');
      }
    } finally {
      if (isMounted()) {
        setIsLoading(false);
      }
    }
  };

  const handleToggleCustomer = (customerId: string) => {
    if (isMounted()) {
      setSelectedCustomers(prev => 
        prev.includes(customerId)
          ? prev.filter(id => id !== customerId)
          : [...prev, customerId]
      );
    }
  };

  const handleCloseAll = () => {
    if (isMounted()) {
      setIsCreatingShipment(false);
      setShowShipmentDetails(false);
      setIsSelectingCustomers(false);
      setIsEditing(false);
      setSelectedShipment(null);
    }
  };

  const handleManualRefresh = async () => {
    // If we're already updating, don't proceed
    if (isUpdatingRef.current || !isMounted()) return;
    
    isUpdatingRef.current = true;
    if (isMounted()) setIsLoading(true);
    
    try {
      console.log("Manual refresh requested...");
      const fetchedShipments = await getShipments();
      console.log("Manual refresh completed, found", fetchedShipments?.length || 0, "shipments");
      
      if (isMounted()) {
        toast.success('Dados atualizados com sucesso');
      }
    } catch (error) {
      console.error("Error during manual refresh:", error);
      
      if (isMounted()) {
        toast.error("Falha ao atualizar dados");
      }
    } finally {
      if (isMounted()) {
        setIsLoading(false);
      }
      
      // Add a delay before allowing updates again
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 300);
    }
  };

  useEffect(() => {
    console.log("Current shipments in state:", shipments?.length || 0);
  }, [shipments]);

  // Calculate if "new shipment" button should be disabled
  const isNewShipmentButtonDisabled = isLoading;

  return (
    <div className="container space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Preparando Envio</h1>
        <Button 
          onClick={() => {
            setIsEditing(false);
            setSelectedCustomers([]);
            setIsSelectingCustomers(true);
          }}
          disabled={isNewShipmentButtonDisabled}
        >
          <Plus className="mr-2 h-4 w-4" /> Fazer um novo envio
        </Button>
      </div>

      {/* Histórico de Envios com indicador de carregamento */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Histórico de Envios</h2>
          <Button 
            variant="outline" 
            size="sm"
            disabled={isLoading}
            onClick={handleManualRefresh}
          >
            {isLoading ? 'Atualizando...' : 'Atualizar dados'}
          </Button>
        </div>
        
        {isLoading ? (
          <div className="py-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            <p className="mt-2 text-sm text-muted-foreground">Carregando dados...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shipments && shipments.length > 0 ? (
              shipments.map((shipment) => (
                <Card key={shipment.id} className="transition-all duration-200 hover:shadow-md">
                  <CardHeader>
                    <CardTitle>Envio de {format(shipment.createdAt, "dd 'de' MMMM", { locale: ptBR })}</CardTitle>
                    <CardDescription>
                      {shipment.customers && shipment.customers.length || 0} clientes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>{format(shipment.createdAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleShowShipmentDetails(shipment)}>
                      <Eye className="mr-2 h-4 w-4" /> Detalhes
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleGeneratePDFs(shipment)}>
                      <Download className="mr-2 h-4 w-4" /> Baixar PDFs
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <p>Nenhum envio encontrado. Crie um novo envio para começar.</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Dialog para seleção de clientes */}
      <Dialog open={isSelectingCustomers} onOpenChange={(open) => {
        if (!open && isMounted()) {
          setIsSelectingCustomers(false);
          if (isEditing) {
            setIsEditing(false);
          }
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Editar Clientes do Envio' : 'Selecionar Clientes para Envio'}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? 'Modifique os clientes que deseja incluir neste envio.' 
                : 'Selecione os clientes que deseja incluir neste envio. Apenas clientes com pedidos pendentes são exibidos.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <span>Total selecionado: {selectedCustomers.length} clientes</span>
              <Button
                size="sm"
                onClick={() => {
                  // Use filtered list for "select all" functionality when creating new shipment
                  const availableCustomers = isEditing ? customers : customersWithPendingOrders;
                  setSelectedCustomers(
                    selectedCustomers.length === availableCustomers.length 
                      ? [] 
                      : availableCustomers.map(c => c.id)
                  );
                }}
              >
                {selectedCustomers.length === (isEditing ? customers.length : customersWithPendingOrders.length) 
                  ? 'Desmarcar todos' 
                  : 'Selecionar todos'}
              </Button>
            </div>

            <div className="border rounded-md">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3 text-left">Selecionar</th>
                    <th className="p-3 text-left">Nome</th>
                    <th className="p-3 text-left">Excursão</th>
                    <th className="p-3 text-left">Vaga</th>
                    <th className="p-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {/* When editing, show all customers; when creating new, show only those with pending orders */}
                  {(isEditing ? customers : customersWithPendingOrders).map((customer) => {
                    // Find latest order status for display
                    const latestOrder = customer.orders && customer.orders.length > 0 
                      ? customer.orders.reduce((latest, current) => 
                          new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
                        ) 
                      : null;
                    
                    return (
                      <tr key={customer.id} className="border-t">
                        <td className="p-3">
                          <Checkbox 
                            checked={selectedCustomers.includes(customer.id)} 
                            onCheckedChange={() => handleToggleCustomer(customer.id)}
                          />
                        </td>
                        <td className="p-3">{customer.name}</td>
                        <td className="p-3">{customer.tourName || '-'}</td>
                        <td className="p-3">{customer.tourSeatNumber || '-'}</td>
                        <td className="p-3">
                          {latestOrder ? (
                            <span className={
                              latestOrder.status === 'pending' 
                                ? 'text-yellow-600 font-medium' 
                                : latestOrder.status === 'completed' 
                                  ? 'text-green-600 font-medium' 
                                  : 'text-red-600 font-medium'
                            }>
                              {latestOrder.status === 'pending' ? 'Pendente' : 
                               latestOrder.status === 'completed' ? 'Confirmado' : 'Cancelado'}
                            </span>
                          ) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              if (isMounted()) {
                setIsSelectingCustomers(false);
                if (isEditing) {
                  setIsEditing(false);
                }
              }
            }}>
              Cancelar
            </Button>
            {isEditing ? (
              <Button onClick={handleSaveEditedShipment} disabled={selectedCustomers.length === 0 || isLoading}>
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            ) : (
              <Button onClick={handleCreateShipment} disabled={selectedCustomers.length === 0 || isLoading}>
                {isLoading ? 'Processando...' : 'Criar Envio'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para visualizar detalhes do envio */}
      <Dialog open={showShipmentDetails} onOpenChange={(open) => {
        if (!isDeletingShipment && isMounted()) {
          setShowShipmentDetails(open);
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Detalhes do Envio
            </DialogTitle>
            <DialogDescription>
              {selectedShipment && format(selectedShipment.createdAt, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </DialogDescription>
          </DialogHeader>

          {selectedShipment && (
            <div className="space-y-4">
              <div className="border rounded-md">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-3 text-left">Nome</th>
                      <th className="p-3 text-left">Excursão</th>
                      <th className="p-3 text-right">V. da Compra</th>
                      <th className="p-3 text-right">10% Serviço</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedShipment.customers && selectedShipment.customers.map((customer) => {
                      const latestOrder = customer.orders && customer.orders.length > 0 
                        ? customer.orders.reduce((latest, current) => 
                            new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
                          ) 
                        : null;
                      
                      const orderTotal = latestOrder?.total || 0;
                      const serviceFee = Math.max(60, orderTotal * 0.1);

                      return (
                        <tr key={customer.id} className="border-t">
                          <td className="p-3">{customer.name}</td>
                          <td className="p-3">{customer.tourName || '-'}</td>
                          <td className="p-3 text-right">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(orderTotal)}
                          </td>
                          <td className="p-3 text-right">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(serviceFee)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              <DialogFooter className="gap-2">
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isDeletingShipment}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> 
                  {isDeletingShipment ? 'Excluindo...' : 'Excluir'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleEditShipment}
                  disabled={isDeletingShipment}
                >
                  <Edit className="mr-2 h-4 w-4" /> Editar
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowShipmentDetails(false)}
                  disabled={isDeletingShipment}
                >
                  Fechar
                </Button>
                <Button 
                  onClick={() => {
                    if (isMounted()) {
                      handleGeneratePDFs(selectedShipment);
                      setShowShipmentDetails(false);
                    }
                  }}
                  disabled={isDeletingShipment}
                >
                  <Download className="mr-2 h-4 w-4" /> Gerar PDFs
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para gerar PDFs */}
      <Dialog open={isCreatingShipment} onOpenChange={handleCloseAll}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gerar PDFs de Envio</DialogTitle>
            <DialogDescription>
              Selecione o formato de PDF que deseja gerar
            </DialogDescription>
          </DialogHeader>

          {selectedShipment && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="cursor-pointer hover:shadow-md transition-all duration-200" onClick={handlePrintTable}>
                  <CardContent className="p-6 flex flex-col items-center justify-center">
                    <FileText size={48} className="mb-2 text-primary" />
                    <h3 className="font-semibold text-lg">Tabela de Envio</h3>
                    <p className="text-sm text-muted-foreground text-center mt-2">
                      Gera uma tabela com todos os clientes e valores
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:shadow-md transition-all duration-200" onClick={handlePrintCards}>
                  <CardContent className="p-6 flex flex-col items-center justify-center">
                    <CreditCard size={48} className="mb-2 text-primary" />
                    <h3 className="font-semibold text-lg">Cards para Recorte</h3>
                    <p className="text-sm text-muted-foreground text-center mt-2">
                      Gera cards individuais para cada cliente
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={handleCloseAll}>
                  Fechar
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmar exclusão */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este envio? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingShipment}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteShipment} 
              className="bg-destructive text-destructive-foreground"
              disabled={isDeletingShipment}
            >
              {isDeletingShipment ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Componentes invisíveis para impressão */}
      <div className="hidden">
        {selectedShipment && (
          <>
            <ShipmentTablePDF 
              ref={tableRef} 
              shipmentCustomers={selectedShipment.customers} 
              date={selectedShipment.createdAt} 
            />
            <ShipmentCardsPDF 
              ref={cardsRef} 
              shipmentCustomers={selectedShipment.customers} 
              date={selectedShipment.createdAt} 
            />
          </>
        )}
      </div>
    </div>
  );
};
