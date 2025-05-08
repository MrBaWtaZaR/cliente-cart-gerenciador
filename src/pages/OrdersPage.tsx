import React from 'react';
import { useDataStore, Customer, Order } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Search, Filter, Printer, Edit } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { OrderPDF } from '@/components/OrderPDF';
import { DateFilter } from '@/components/DateFilter';
import { OrderCard } from '@/components/OrderCard';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { TimeFormatter } from '@/components/TimeFormatter';
import { PhoneFormatter } from '@/components/PhoneFormatter';
import { EditOrderForm } from '@/components/EditOrderForm';

export const OrdersPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { customers, updateOrderStatus } = useDataStore();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [showPDFPreview, setShowPDFPreview] = useState<boolean>(false);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  
  // Prevent state updates after component unmounts
  const isMounted = useRef(true);
  
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Get all orders
  const allOrders = customers.flatMap(customer => 
    customer.orders.map(order => ({
      ...order,
      customerName: customer.name,
      customerId: customer.id,
    }))
  );

  // Check if we should open a specific order from URL parameters
  useEffect(() => {
    const viewOrderId = searchParams.get('view');
    if (viewOrderId && !dialogOpen) {
      const orderToView = allOrders.find(order => order.id === viewOrderId);
      if (orderToView) {
        handleViewOrder(orderToView, orderToView.customerName);
        if (isMounted.current) {
          setDialogOpen(true);
        }
      }
    }
  }, [searchParams, allOrders, dialogOpen]);

  // Filter orders based on applied filters
  const filteredOrders = allOrders.filter(order => {
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

  const handleUpdateOrderStatus = (customerId: string, orderId: string, newStatus: 'pending' | 'completed' | 'cancelled') => {
    updateOrderStatus(customerId, orderId, newStatus);
    
    // Update status in current view if it's open
    if (viewingOrder && viewingOrder.id === orderId && isMounted.current) {
      setViewingOrder({ ...viewingOrder, status: newStatus });
    }
  };

  // Improved view order function
  const handleViewOrder = (order: Order & { customerName?: string }, customerName: string) => {
    const customer = customers.find(c => c.id === order.customerId);
    
    if (!isMounted.current) return;
    
    // Create a new order object without the customerName property
    const orderForState: Order = {
      id: order.id,
      customerId: order.customerId,
      products: order.products,
      status: order.status,
      total: order.total,
      createdAt: order.createdAt
    };
    
    // Set viewingOrder with the correct Order type
    setViewingOrder(orderForState);
    
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

    // Update URL to include the order ID for direct linking
    setSearchParams({ view: order.id });
  };
  
  const pdfRef = useRef<HTMLDivElement>(null);
  
  // Improved PDF printing
  const handlePrintPDF = useReactToPrint({
    documentTitle: `Pedido-${viewingOrder?.id || ''}`,
    onBeforePrint: () => {
      return new Promise<void>((resolve) => {
        if (isMounted.current) {
          setShowPDFPreview(true);
        }
        setTimeout(() => {
          resolve();
        }, 200); // Increased delay for better reliability
      });
    },
    onAfterPrint: () => {
      if (isMounted.current) {
        setShowPDFPreview(false);
      }
    },
    contentRef: pdfRef,
  });

  // Pre-render the PDF content when viewing order changes
  useEffect(() => {
    if (viewingOrder && !showPDFPreview && isMounted.current) {
      setShowPDFPreview(true);
      // Small timeout to ensure the content is rendered
      const timer = setTimeout(() => {
        if (isMounted.current) {
          setShowPDFPreview(false);
        }
      }, 200); // Increased delay for better reliability
      
      return () => clearTimeout(timer);
    }
  }, [viewingOrder, showPDFPreview]);

  // Improved dialog close handling
  const handleDialogClose = () => {
    if (!isMounted.current) return;
    
    // First close the dialog UI
    setDialogOpen(false);
    setShowPDFPreview(false);
    setIsEditing(false);
    
    // Then clean up the URL and state after a short delay
    setTimeout(() => {
      if (!isMounted.current) return;
      
      setViewingOrder(null);
      setSearchParams({});
    }, 300);
  };

  const handleStartEditing = () => {
    if (isMounted.current) {
      setIsEditing(true);
    }
  };

  const handleCancelEditing = () => {
    if (isMounted.current) {
      setIsEditing(false);
    }
  };

  // Improved order update handling
  const handleOrderUpdated = () => {
    if (!isMounted.current) return;
    
    setIsEditing(false);
    // Update the view with the latest order data
    if (viewingOrder) {
      const updatedOrder = customers.find(c => c.id === viewingOrder.customerId)
        ?.orders.find(o => o.id === viewingOrder.id);
      
      if (updatedOrder && isMounted.current) {
        // Create a proper Order object without customerName property
        const updatedOrderForState: Order = {
          id: updatedOrder.id,
          customerId: viewingOrder.customerId,
          products: updatedOrder.products,
          status: updatedOrder.status,
          total: updatedOrder.total,
          createdAt: updatedOrder.createdAt
        };
        
        setViewingOrder(updatedOrderForState);
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
                  customerName={order.customerName}
                  onClick={() => {
                    handleViewOrder(order, order.customerName);
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
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => {
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
                  Pedido de {customerName} realizado em {viewingOrder && 
                    new Date(viewingOrder.createdAt).toLocaleString('pt-BR')
                  }
                </DialogDescription>
              </DialogHeader>
              
              {viewingOrder && (
                <>
                  {/* ... keep existing code (order header) */}
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
                  
                  {/* ... keep existing code (products table) */}
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
                          {viewingOrder.products.map((item, index) => (
                            <tr key={`${item.productId}-${index}`} className="border-t">
                              <td className="p-2">
                                <div className="flex items-center">
                                  {item.images && item.images[0] && (
                                    <div className="w-10 h-10 mr-3 bg-muted rounded overflow-hidden flex-shrink-0">
                                      <img
                                        src={item.images[0]}
                                        alt={item.productName}
                                        className="w-full h-full object-cover"
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
              
              <DialogFooter className="flex justify-between items-center space-x-2">
                <Button variant="outline" onClick={handleDialogClose}>
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
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Improved PDF container */}
      {viewingOrder && customerInfo && (
        <div style={{ 
          display: showPDFPreview ? 'block' : 'none', 
          position: 'absolute', 
          left: '-9999px', 
          visibility: showPDFPreview ? 'visible' : 'hidden' 
        }}>
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
