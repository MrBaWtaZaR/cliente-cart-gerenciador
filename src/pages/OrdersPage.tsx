import { useState, useRef, useEffect } from 'react';
import { useDataStore, Order } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Search, Filter, Printer } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { OrderPDF } from '@/components/OrderPDF';
import { DateFilter } from '@/components/DateFilter';
import { OrderCard } from '@/components/OrderCard';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { TimeFormatter } from '@/components/TimeFormatter';
import { PhoneFormatter } from '@/components/PhoneFormatter';

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

  // Obter todos os pedidos
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
        setDialogOpen(true);
      }
    }
  }, [searchParams, allOrders, dialogOpen]);

  // Filtrar pedidos com base nos filtros
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
    
    // Atualizar o status na visualização atual se estiver aberta
    if (viewingOrder && viewingOrder.id === orderId) {
      setViewingOrder({ ...viewingOrder, status: newStatus });
    }
  };

  const handleViewOrder = (order: Order, customerName: string) => {
    const customer = customers.find(c => c.id === order.customerId);
    
    setViewingOrder(order);
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
  
  // Fix the useReactToPrint hook
  const handlePrintPDF = useReactToPrint({
    documentTitle: `Pedido-${viewingOrder?.id || ''}`,
    onBeforePrint: () => {
      return new Promise<void>((resolve) => {
        setShowPDFPreview(true);
        setTimeout(() => {
          resolve();
        }, 100);
      });
    },
    onAfterPrint: () => {
      setShowPDFPreview(false);
    },
    contentRef: pdfRef,
  });

  // Pre-render the PDF content when viewing order changes
  useEffect(() => {
    if (viewingOrder && !showPDFPreview) {
      setShowPDFPreview(true);
      // Small timeout to ensure the content is rendered
      setTimeout(() => {
        setShowPDFPreview(false);
      }, 100);
    }
  }, [viewingOrder]);

  // Handle dialog close - completely rewritten for simplicity and reliability
  const handleDialogClose = () => {
    // First close the dialog UI
    setDialogOpen(false);
    
    // Then clean up the URL and state after a short delay
    setTimeout(() => {
      setViewingOrder(null);
      setSearchParams({});
    }, 300);
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

      {/* Modal para ver detalhes do pedido - completely rewritten for reliability */}
      <Dialog 
        open={dialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            handleDialogClose();
          }
        }}
      >
        <DialogContent className="max-w-3xl">
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
                <h3 className="font-medium">Produtos no Pedido</h3>
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
            <Button 
              variant="default"
              onClick={handlePrintPDF}
              className="flex items-center"
            >
              <Printer className="h-4 w-4 mr-2" /> Imprimir Pedido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Container escondido para o PDF */}
      {viewingOrder && customerInfo && (
        <div style={{ display: showPDFPreview ? 'block' : 'none', position: 'absolute', left: '-9999px' }}>
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
