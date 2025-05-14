import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useCustomerStore } from '@/stores';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Search, Filter, Printer, Edit, Trash2, RefreshCw } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { OrderPDF } from '@/components/OrderPDF';
import { PrintablePDFRef } from '@/components/PrintablePDF';
import { DateFilter } from '@/components/DateFilter';
import { OrderCard } from '@/components/OrderCard';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { EditOrderForm } from '@/components/EditOrderForm';
import { SyncButton } from '@/components/ui/sync-button';
import { toast } from '@/components/ui/use-toast';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const OrdersPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { customers, updateOrderStatus, deleteOrder } = useCustomerStore();
  const navigate = useNavigate();
  
  // State variables
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [viewingOrder, setViewingOrder] = useState<any | null>(null);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [showPDFPreview, setShowPDFPreview] = useState<boolean>(false);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [isPdfLoading, setIsPdfLoading] = useState<boolean>(false);
  
  // Prevent state updates after component unmounts
  const isMounted = useRef(true);
  const pdfRef = useRef<PrintablePDFRef>(null);
  
  // Setup cleanup on component unmount
  useEffect(() => {
    return () => {
      console.log("OrdersPage desmontando, limpando recursos...");
      isMounted.current = false;
      
      // Ensure dialogs are closed
      setDialogOpen(false);
      setDeleteDialogOpen(false);
      setShowPDFPreview(false);
      
      // Clear states to free memory
      setViewingOrder(null);
      setCustomerInfo(null);
    };
  }, []);

  // Get all orders with memoization to prevent unnecessary recalculations
  const allOrders = React.useMemo(() => {
    return customers.flatMap(customer => 
      (customer.orders || []).map(order => ({
        ...order,
        customerName: customer.name,
        customerId: customer.id,
      }))
    );
  }, [customers]);

  // Check if we should open a specific order from URL parameters
  useEffect(() => {
    const viewOrderId = searchParams.get('view');
    if (viewOrderId && !dialogOpen) {
      console.log("Tentando abrir pedido do URL:", viewOrderId);
      const orderToView = allOrders.find(order => order.id === viewOrderId);
      if (orderToView && isMounted.current) {
        handleViewOrder(orderToView, orderToView.customerName);
        setDialogOpen(true);
      }
    }
  }, [searchParams, allOrders, dialogOpen]);

  // Filter orders based on applied filters - memoized to avoid recalculation
  const filteredOrders = React.useMemo(() => {
    return allOrders
      .filter(order => {
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          order.id.toLowerCase().includes(searchLower) ||
          order.customerName.toLowerCase().includes(searchLower);
        
        // Filter by date if date filter is applied
        const matchesDate = !dateFilter || 
          (new Date(order.createdAt).toDateString() === dateFilter.toDateString());
        
        return matchesStatus && matchesSearch && matchesDate;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [allOrders, statusFilter, searchTerm, dateFilter]);

  const handleUpdateOrderStatus = useCallback((customerId: string, orderId: string, newStatus: 'pending' | 'completed' | 'cancelled') => {
    updateOrderStatus(customerId, orderId, newStatus);
    
    // Update status in current view if it's open
    if (viewingOrder && viewingOrder.id === orderId && isMounted.current) {
      setViewingOrder(prevState => ({ ...prevState, status: newStatus }));
    }
  }, [updateOrderStatus, viewingOrder]);

  // Improved view order function
  const handleViewOrder = useCallback((order: any, customerName: string) => {
    try {
      console.log("Visualizando pedido:", order.id);
      const customer = customers.find(c => c.id === order.customerId);
      
      if (!isMounted.current) return;
      
      // Create a new order object without the customerName property
      const orderForState = {
        id: order.id,
        customerId: order.customerId,
        products: order.products || [], 
        status: order.status,
        total: order.total,
        createdAt: order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt)
      };
      
      // Separately set the customer name state
      setCustomerName(customerName);
      
      setCustomerInfo({
        email: customer?.email || '',
        phone: customer?.phone || '',
        address: customer?.address,
        tourName: customer?.tourName,
        tourSector: customer?.tourSector,
        tourSeatNumber: customer?.tourSeatNumber,
        tourCity: customer?.tourCity,
        tourState: customer?.tourState,
        tourDepartureTime: customer?.tourDepartureTime
      });
      
      // Set viewingOrder with the correct Order type
      setViewingOrder(orderForState);
      
      // Update URL to include the order ID for direct linking
      setSearchParams({ view: order.id });
    } catch (error) {
      console.error('Error in handleViewOrder:', error);
      toast.error("Erro ao carregar detalhes do pedido");
      // In case of error, clear the state to avoid rendering with invalid data
      if (isMounted.current) {
        setViewingOrder(null);
        setCustomerName('');
        setCustomerInfo(null);
      }
    }
  }, [customers, setSearchParams]);
  
  // Fixed PDF printing with improved timing and error handling
  const handlePrintPDF = useReactToPrint({
    // Use contentRef property instead of content
    contentRef: pdfRef,
    documentTitle: `Pedido-${viewingOrder?.id?.substring(0, 8) || ''}`,
    onBeforePrint: () => {
      return new Promise<void>((resolve) => {
        try {
          if (isMounted.current) {
            console.log("Preparando para impressão...");
            setIsPdfLoading(true);
            setShowPDFPreview(true);
            
            // Notify the PDF component about printing and add protection
            if (pdfRef.current) {
              pdfRef.current.notifyPrinting();
            }
            
            // Ensure elements are set to print-optimized state
            if (pdfRef.current) {
              pdfRef.current.classList.add('actively-printing');
              pdfRef.current.classList.add('protected-element');
              pdfRef.current.setAttribute('data-no-cleanup', 'true');
            }
          }
          // Increased delay to ensure content is fully rendered
          setTimeout(resolve, 500);
        } catch (error) {
          console.error('Error in onBeforePrint:', error);
          resolve(); // Resolve anyway to avoid hanging
        }
      });
    },
    onAfterPrint: () => {
      try {
        console.log("Impressão concluída");
        if (isMounted.current) {
          // Remove the protection classes after print is complete
          if (pdfRef.current) {
            pdfRef.current.classList.remove('actively-printing');
            // Reset loading state immediately
            setIsPdfLoading(false);
            
            // Keep as protected for a little longer
            setTimeout(() => {
              if (pdfRef.current) {
                pdfRef.current.classList.remove('protected-element');
              }
              
              if (isMounted.current) {
                // Keep the preview visible a bit longer to ensure full rendering
                setTimeout(() => {
                  if (isMounted.current) {
                    setShowPDFPreview(false);
                  }
                }, 100);
              }
            }, 200);
          } else {
            setIsPdfLoading(false);
            setShowPDFPreview(false);
          }
        }
      } catch (error) {
        console.error('Error in onAfterPrint:', error);
        if (isMounted.current) {
          setIsPdfLoading(false);
          setShowPDFPreview(false);
        }
      }
    },
    // Retries for print initialization
    onPrintError: (error) => {
      console.error("Print error:", error);
      // Correto uso do toast
      toast.error("Houve um problema ao preparar o documento. Tente novamente.");
      
      if (isMounted.current) {
        setIsPdfLoading(false);
        setShowPDFPreview(false);
      }
    }
  });

  // Improved dialog close handling
  const handleDialogClose = useCallback(() => {
    try {
      console.log("Fechando diálogo de pedido");
      if (!isMounted.current) return;
      
      // First close the dialog UI
      setDialogOpen(false);
      setShowPDFPreview(false);
      setIsEditing(false);
      
      // Then clean up the URL and state after a short delay
      setTimeout(() => {
        if (!isMounted.current) return;
        
        // Clear states to prevent issues when reopening
        setViewingOrder(null);
        setCustomerInfo(null);
        setCustomerName('');
        setSearchParams({});
        console.log("Estado de visualização limpo");
      }, 300);
    } catch (error) {
      console.error('Error in handleDialogClose:', error);
      // Try to clear everything at once if there's an error
      if (isMounted.current) {
        setDialogOpen(false);
        setShowPDFPreview(false);
        setIsEditing(false);
        setViewingOrder(null);
        setSearchParams({});
      }
    }
  }, [setSearchParams]);

  const handleDeleteOrder = useCallback(() => {
    if (viewingOrder && viewingOrder.customerId) {
      deleteOrder(viewingOrder.customerId, viewingOrder.id);
      setDeleteDialogOpen(false);
      handleDialogClose();
      toast.success("Pedido excluído com sucesso");
    }
  }, [deleteOrder, viewingOrder, handleDialogClose]);

  const handleStartEditing = useCallback(() => {
    if (isMounted.current) {
      setIsEditing(true);
    }
  }, []);

  const handleCancelEditing = useCallback(() => {
    if (isMounted.current) {
      setIsEditing(false);
    }
  }, []);

  // Improved order update handling
  const handleOrderUpdated = useCallback(() => {
    try {
      if (!isMounted.current) return;
      
      setIsEditing(false);
      toast.success("Pedido atualizado com sucesso");
      
      // Update the view with the latest order data
      if (viewingOrder) {
        const updatedOrder = customers.find(c => c.id === viewingOrder.customerId)
          ?.orders?.find(o => o.id === viewingOrder.id);
        
        if (updatedOrder && isMounted.current) {
          // Create a proper Order object without customerName property
          const updatedOrderForState = {
            id: updatedOrder.id,
            customerId: viewingOrder.customerId,
            products: updatedOrder.products || [],
            status: updatedOrder.status,
            total: updatedOrder.total,
            createdAt: updatedOrder.createdAt instanceof Date ? 
              updatedOrder.createdAt : new Date(updatedOrder.createdAt)
          };
          
          setViewingOrder(updatedOrderForState);
        }
      }
    } catch (error) {
      console.error('Error in handleOrderUpdated:', error);
      if (isMounted.current) {
        setIsEditing(false);
        toast.error("Erro ao atualizar pedido");
      }
    }
  }, [customers, viewingOrder]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center">
          <ShoppingCart className="h-6 w-6 mr-2" /> Pedidos
        </h1>
        
        <div className="flex items-center space-x-2">
          <SyncButton 
            syncType="orders" 
            className="flex items-center text-xs sm:text-sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Sincronizar Pedidos
          </SyncButton>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] bg-white shadow-sm">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Status</SelectLabel>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="completed">Concluídos</SelectItem>
                <SelectItem value="cancelled">Cancelados</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Search and filter section */}
      <div className="flex flex-col md:flex-row gap-4 items-start justify-between">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar pedidos..."
            className="pl-8 bg-white shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <DateFilter onDateChange={setDateFilter} />
      </div>

      <Card className="card-gradient">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div>Lista de Pedidos</div>
            <div className="text-sm font-normal text-muted-foreground">
              {filteredOrders.length} pedidos encontrados
              {dateFilter && ` para ${dateFilter.toLocaleDateString('pt-BR')}`}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredOrders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  customerName={order.customerName || ''}
                  onClick={() => {
                    handleViewOrder(order, order.customerName || '');
                    if (isMounted.current) {
                      setDialogOpen(true);
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-muted-foreground">
              {searchTerm || statusFilter !== 'all' || dateFilter ? 
                "Nenhum pedido corresponde aos filtros aplicados." : 
                "Nenhum pedido registrado ainda."
              }
            </div>
          )}
        </CardContent>
      </Card>

      {/* Improved order dialog with better focus management */}
      <Dialog 
        open={dialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            handleDialogClose();
          } else if (isMounted.current) {
            setDialogOpen(open);
          }
        }}
      >
        <DialogContent 
          className="max-w-3xl" 
          onInteractOutside={(e) => {
            // No longer aggressively blocking clicks 
            e.preventDefault();
            // Only prevent closing while editing or printing
            if (isEditing || showPDFPreview) {
              console.log("Dialog click outside blocked - editing or printing in progress");
            } else {
              handleDialogClose();
            }
          }}
          onEscapeKeyDown={(e) => {
            // Only prevent escape while editing or printing
            if (isEditing || showPDFPreview) {
              console.log("Dialog escape blocked - editing or printing in progress");
              e.preventDefault();
            } else {
              handleDialogClose();
            }
          }}
        >
          {isEditing && viewingOrder ? (
            <>
              <DialogHeader>
                <DialogTitle>Editar Pedido</DialogTitle>
                <DialogDescription>
                  Editar pedido de {customerName} realizado em {
                    viewingOrder.createdAt instanceof Date ?
                      viewingOrder.createdAt.toLocaleString('pt-BR') :
                      new Date(viewingOrder.createdAt).toLocaleString('pt-BR')
                  }
                </DialogDescription>
              </DialogHeader>
              
              <EditOrderForm 
                customerId={viewingOrder.customerId}
                order={viewingOrder}
                onSuccess={handleOrderUpdated}
                onCancel={handleCancelEditing}
              />
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Detalhes do Pedido</DialogTitle>
                <DialogDescription>
                  Pedido de {customerName} realizado em {viewingOrder && (
                    viewingOrder.createdAt instanceof Date ?
                      viewingOrder.createdAt.toLocaleString('pt-BR') :
                      new Date(viewingOrder.createdAt).toLocaleString('pt-BR')
                  )}
                </DialogDescription>
              </DialogHeader>
              
              {viewingOrder ? (
                <>
                  <div className="flex flex-col md:flex-row justify-between mb-6">
                    <div>
                      <p className="font-medium">ID do Pedido:</p>
                      <p className="font-mono text-sm">{viewingOrder.id}</p>
                    </div>
                    <div>
                      <p className="font-medium">Status:</p>
                      <Select
                        value={viewingOrder.status}
                        onValueChange={(value) => handleUpdateOrderStatus(
                          viewingOrder.customerId, 
                          viewingOrder.id, 
                          value as 'pending' | 'completed' | 'cancelled'
                        )}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="completed">Concluído</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Produtos no Pedido</h3>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleStartEditing}
                        className="flex items-center"
                      >
                        <Edit className="h-4 w-4 mr-2" /> Editar Pedido
                      </Button>
                    </div>
                    <div className="border rounded-md overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="text-left p-2">Produto</th>
                            <th className="text-center p-2">Quantidade</th>
                            <th className="text-right p-2">Preço</th>
                            <th className="text-right p-2">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {viewingOrder.products && viewingOrder.products.map((item: any, index: number) => (
                            <tr key={`${item.productId}-${index}`} className="border-t">
                              <td className="p-2">
                                <div className="flex items-center">
                                  {item.images && item.images[0] && (
                                    <div className="w-10 h-10 mr-3 bg-muted rounded overflow-hidden flex-shrink-0">
                                      <img
                                        src={item.images[0]}
                                        alt={item.productName}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          // If the image fails, use a placeholder
                                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                                        }}
                                      />
                                    </div>
                                  )}
                                  {item.productName}
                                </div>
                              </td>
                              <td className="p-2 text-center">{item.quantity}</td>
                              <td className="p-2 text-right">
                                {new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL'
                                }).format(item.price)}
                              </td>
                              <td className="p-2 text-right">
                                {new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL'
                                }).format(item.price * item.quantity)}
                              </td>
                            </tr>
                          ))}
                          <tr className="border-t bg-muted/30">
                            <td colSpan={3} className="p-2 text-right font-bold">
                              Total:
                            </td>
                            <td className="p-2 text-right font-bold">
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                              }).format(viewingOrder.total)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-10 text-center">
                  <p>Carregando detalhes do pedido...</p>
                </div>
              )}
              
              <DialogFooter className="flex justify-between items-center sm:space-x-2 flex-col sm:flex-row gap-2 sm:gap-0">
                <Button 
                  variant="destructive" 
                  onClick={() => setDeleteDialogOpen(true)}
                  className="flex items-center"
                  disabled={isPdfLoading || !viewingOrder}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Excluir Pedido
                </Button>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={handleDialogClose}
                  >
                    Fechar
                  </Button>
                  <div className="flex space-x-2">
                    <Button 
                      variant="secondary"
                      onClick={handleStartEditing}
                      className="flex items-center"
                      disabled={isPdfLoading || !viewingOrder}
                    >
                      <Edit className="h-4 w-4 mr-2" /> Editar
                    </Button>
                    <Button 
                      variant="default"
                      onClick={handlePrintPDF}
                      className="flex items-center"
                      disabled={isPdfLoading || !viewingOrder}
                    >
                      {isPdfLoading ? (
                        <>Preparando...</>
                      ) : (
                        <>
                          <Printer className="h-4 w-4 mr-2" /> Imprimir
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Alert Dialog for delete confirmation */}
      <AlertDialog 
        open={deleteDialogOpen} 
        onOpenChange={(open) => {
          if (isMounted.current) {
            setDeleteDialogOpen(open);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Pedido</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o pedido
              {viewingOrder && ` de ${customerName}`}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOrder} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Improved PDF container that renders better for printing */}
      {showPDFPreview && viewingOrder && customerInfo && (
        <div 
          className="shipment-print-container protected-element"
          data-no-cleanup="true"
        >
          <OrderPDF 
            ref={pdfRef}
            order={viewingOrder} 
            customerName={customerName} 
            customerInfo={customerInfo} 
          />
        </div>
      )}
    </div>
  );
};
