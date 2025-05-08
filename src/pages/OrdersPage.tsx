import React, { useState, useEffect, useRef } from 'react';
import { useCustomerStore } from '@/stores';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Search, Filter, Printer, Edit, Trash2 } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { OrderPDF } from '@/components/OrderPDF';
import { DateFilter } from '@/components/DateFilter';
import { OrderCard } from '@/components/OrderCard';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { EditOrderForm } from '@/components/EditOrderForm';
import { toast } from 'sonner';
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
import { useSafeUnmount, safeRemoveElement } from '@/components/DOMCleanupUtils';

export const OrdersPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { customers, updateOrderStatus, deleteOrder } = useCustomerStore();
  const navigate = useNavigate();
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
  
  // Use our improved safe unmount hook with better DOM cleanup
  const { isMounted, setPrintableContent, cleanupDOM } = useSafeUnmount();
  const pdfRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  
  // Setup cleanup on component unmount and for navigation
  useEffect(() => {
    // Clean up immediately when component mounts to remove any leftover elements
    cleanupDOM();
    
    const handleBeforeUnload = () => {
      cleanupDOM();
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Register for cleanup events
    const cleanupHandler = () => {
      console.log("OrdersPage cleanup event triggered");
      if (isMounted()) {
        setDialogOpen(false);
        setDeleteDialogOpen(false);
        setShowPDFPreview(false);
        setViewingOrder(null); 
        cleanupDOM();
      }
    };
    
    window.addEventListener('app-cleanup', cleanupHandler);
    window.addEventListener('route-changed', cleanupHandler);
    
    return () => {
      console.log("OrdersPage unmounting, cleaning resources...");
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('app-cleanup', cleanupHandler);
      window.removeEventListener('route-changed', cleanupHandler);
      
      // Force close all dialogs
      setDialogOpen(false);
      setDeleteDialogOpen(false);
      setShowPDFPreview(false);
      
      // Clear states to free memory
      setViewingOrder(null);
      setCustomerInfo(null);
      
      // Run the DOM cleanup several times with increasing delays
      cleanupDOM();
      setTimeout(cleanupDOM, 50);
      setTimeout(cleanupDOM, 150);
    };
  }, [cleanupDOM, isMounted]);

  // Update the printable content status when PDF ref changes
  useEffect(() => {
    setPrintableContent(pdfRef.current !== null);
  }, [pdfRef.current, setPrintableContent]);

  // Get all orders
  const allOrders = React.useMemo(() => customers.flatMap(customer => 
    (customer.orders || []).map(order => ({
      ...order,
      customerName: customer.name,
      customerId: customer.id,
    }))
  ), [customers]);

  // Check if we should open a specific order from URL parameters
  useEffect(() => {
    try {
      const viewOrderId = searchParams.get('view');
      if (viewOrderId && !dialogOpen && isMounted()) {
        console.log("Trying to open order from URL:", viewOrderId);
        const orderToView = allOrders.find(order => order.id === viewOrderId);
        if (orderToView) {
          handleViewOrder(orderToView, orderToView.customerName || '');
        } else {
          console.log(`Order ${viewOrderId} not found`);
          toast.error("Order not found");
        }
      }
    } catch (error) {
      console.error("Error processing URL parameters:", error);
    }
  }, [searchParams, allOrders, dialogOpen, isMounted]);

  // Filter orders based on applied filters
  const filteredOrders = React.useMemo(() => {
    return allOrders.filter(order => {
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        order.id.toLowerCase().includes(searchLower) ||
        order.customerName.toLowerCase().includes(searchLower);
      
      // Filter by date if date filter is applied
      const matchesDate = !dateFilter || 
        (new Date(order.createdAt).toDateString() === dateFilter.toDateString());
      
      return matchesStatus && matchesSearch && matchesDate;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [allOrders, statusFilter, searchTerm, dateFilter]);

  const handleUpdateOrderStatus = (customerId: string, orderId: string, newStatus: 'pending' | 'completed' | 'cancelled') => {
    updateOrderStatus(customerId, orderId, newStatus);
    
    // Update status in current view if it's open
    if (viewingOrder && viewingOrder.id === orderId && isMounted()) {
      setViewingOrder({ ...viewingOrder, status: newStatus });
    }
  };

  // Improved view order function
  const handleViewOrder = (order: any, customerName: string) => {
    try {
      console.log("Viewing order:", order.id);
      if (!order || !order.customerId) {
        console.error('Invalid order data:', order);
        toast.error("Invalid order data");
        return;
      }

      const customer = customers.find(c => c.id === order.customerId);
      
      if (!isMounted()) return;
      
      if (!customer) {
        console.error(`Customer not found for ID: ${order.customerId}`);
        toast.error("Customer not found for this order");
        return;
      }
      
      // Clean up DOM before opening new dialog to prevent element conflicts
      cleanupDOM();
      
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
      setCustomerName(customerName || customer.name || "Customer");
      
      setCustomerInfo({
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        tourName: customer.tourName || '',
        tourSector: customer.tourSector || '',
        tourSeatNumber: customer.tourSeatNumber || '',
        tourCity: customer.tourCity || '',
        tourState: customer.tourState || '',
        tourDepartureTime: customer.tourDepartureTime || ''
      });
      
      // Set viewingOrder with the correct Order type
      setViewingOrder(orderForState);
      
      // Update URL to include the order ID for direct linking
      setSearchParams({ view: order.id });
      
      // Make sure the dialog is opened
      if (isMounted()) {
        setDialogOpen(true);
      }
    } catch (error) {
      console.error('Error in handleViewOrder:', error);
      // In case of error, clear the state to avoid rendering with invalid data
      if (isMounted()) {
        setViewingOrder(null);
        setCustomerName('');
        setCustomerInfo(null);
        toast.error("Error loading order details");
      }
    }
  };
  
  // Updated PDF printing with cleanup
  const handlePrintPDF = useReactToPrint({
    documentTitle: `Order-${viewingOrder?.id || ''}`,
    onBeforePrint: () => {
      return new Promise<void>((resolve) => {
        try {
          if (isMounted()) {
            console.log("Preparing for printing...");
            setShowPDFPreview(true);
          }
          setTimeout(resolve, 500);
        } catch (error) {
          console.error('Error in onBeforePrint:', error);
          resolve();
        }
      });
    },
    onAfterPrint: () => {
      try {
        console.log("Printing completed");
        if (isMounted()) {
          // Do DOM cleanup after print
          setTimeout(() => {
            setShowPDFPreview(false);
            cleanupDOM();
          }, 100);
        }
      } catch (error) {
        console.error('Error in onAfterPrint:', error);
      }
    },
    contentRef: pdfRef,
  });

  // Pre-render the PDF content when viewing order changes
  useEffect(() => {
    if (viewingOrder && !showPDFPreview && isMounted()) {
      try {
        console.log("Pre-rendering PDF");
        setShowPDFPreview(true);
        // Small timeout to ensure the content is rendered
        const timer = setTimeout(() => {
          if (isMounted()) {
            setShowPDFPreview(false);
            console.log("Pre-rendering complete");
          }
        }, 500);
        
        return () => {
          clearTimeout(timer);
          console.log("Clearing pre-rendering timer");
        };
      } catch (error) {
        console.error('Error in PDF preview effect:', error);
        if (isMounted()) {
          setShowPDFPreview(false);
        }
      }
    }
  }, [viewingOrder, showPDFPreview, isMounted]);

  // Improved dialog close handling with DOM cleanup
  const handleDialogClose = () => {
    try {
      console.log("Closing order dialog");
      if (!isMounted()) return;
      
      // First clean up DOM to prevent React errors
      cleanupDOM();
      
      // Then close the dialog UI
      setDialogOpen(false);
      setShowPDFPreview(false);
      setIsEditing(false);
      
      // Then clean up the URL and state after a delay
      setTimeout(() => {
        if (!isMounted()) return;
        
        // Clear states to avoid issues when reopening
        setViewingOrder(null);
        setCustomerInfo(null);
        setCustomerName('');
        setSearchParams({});
        console.log("View state cleared");
        
        // Final cleanup to catch any elements React might have missed
        cleanupDOM();
      }, 300);
    } catch (error) {
      console.error('Error in handleDialogClose:', error);
      // Try to clean everything at once if there's an error
      if (isMounted()) {
        cleanupDOM();
        setDialogOpen(false);
        setShowPDFPreview(false);
        setIsEditing(false);
        setViewingOrder(null);
        setSearchParams({});
      }
    }
  };

  // Handle dialog's escape key or outside click with safer cleanup
  const handleDialogOpenChange = (open: boolean) => {
    if (!open && isMounted()) {
      handleDialogClose();
    } else if (open && isMounted()) {
      // Clean up before opening new dialog
      cleanupDOM();
      setDialogOpen(true);
    }
  };

  const handleDeleteOrder = () => {
    if (viewingOrder && viewingOrder.customerId) {
      deleteOrder(viewingOrder.customerId, viewingOrder.id);
      setDeleteDialogOpen(false);
      handleDialogClose();
      toast.success("Order deleted successfully");
    }
  };

  const handleStartEditing = () => {
    if (isMounted()) {
      cleanupDOM(); // Clean DOM before switching views
      setIsEditing(true);
    }
  };

  const handleCancelEditing = () => {
    if (isMounted()) {
      cleanupDOM(); // Clean DOM when switching back
      setIsEditing(false);
    }
  };

  // Improved order update handling
  const handleOrderUpdated = () => {
    try {
      if (!isMounted()) return;
      
      setIsEditing(false);
      // Update the view with the latest order data
      if (viewingOrder) {
        const updatedOrder = customers.find(c => c.id === viewingOrder.customerId)
          ?.orders?.find(o => o.id === viewingOrder.id);
        
        if (updatedOrder && isMounted()) {
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
          toast.success("Order updated successfully");
        }
      }
    } catch (error) {
      console.error('Error in handleOrderUpdated:', error);
      if (isMounted()) {
        setIsEditing(false);
        toast.error("Failed to update view with new order data");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center">
          <ShoppingCart className="h-6 w-6 mr-2" /> Pedidos
        </h1>
        
        <div className="flex items-center space-x-2">
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
              {filteredOrders.map((order, index) => (
                <OrderCard
                  key={`${order.id}-${index}`} // Using index to ensure uniqueness
                  order={order}
                  customerName={order.customerName || ''}
                  onClick={() => {
                    handleViewOrder(order, order.customerName || '');
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
        onOpenChange={handleDialogOpenChange}
      >
        <DialogContent 
          className="max-w-3xl" 
          ref={dialogRef}
          onInteractOutside={(e) => {
            console.log("Dialog outside click blocked");
            e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            console.log("Dialog escape blocked");
            e.preventDefault();
            handleDialogClose();
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
              
              {viewingOrder && (
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
                            <tr key={`${item.productId || 'unknown'}-${index}`} className="border-t">
                              <td className="p-2">
                                <div className="flex items-center">
                                  {item.images && item.images[0] && (
                                    <div className="w-10 h-10 mr-3 bg-muted rounded overflow-hidden flex-shrink-0">
                                      <img
                                        src={item.images[0]}
                                        alt={item.productName}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                        onError={(e) => {
                                          // If image fails, use placeholder
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
              )}
              
              <DialogFooter className="flex justify-between items-center sm:space-x-2 flex-col sm:flex-row gap-2 sm:gap-0">
                <Button 
                  variant="destructive" 
                  onClick={() => setDeleteDialogOpen(true)}
                  className="flex items-center"
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
                    >
                      <Edit className="h-4 w-4 mr-2" /> Editar
                    </Button>
                    <Button 
                      variant="default"
                      onClick={handlePrintPDF}
                      className="flex items-center"
                    >
                      <Printer className="h-4 w-4 mr-2" /> Imprimir
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
          if (isMounted()) {
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
      
      {/* Improved PDF container with safer positioning */}
      {viewingOrder && customerInfo && (
        <div 
          style={{ 
            display: showPDFPreview ? 'block' : 'none', 
            position: 'fixed',
            top: '-9999px',
            left: '-9999px',
            width: '100%',
            height: '0',
            overflow: 'hidden',
            visibility: showPDFPreview ? 'visible' : 'hidden',
            pointerEvents: 'none',
            zIndex: -1
          }}
          className="shipment-print-container"
          aria-hidden="true"
        >
          <div ref={pdfRef}>
            <OrderPDF 
              order={viewingOrder} 
              customerName={customerName} 
              customerInfo={customerInfo} 
            />
          </div>
        </div>
      )}
    </div>
  );
};
