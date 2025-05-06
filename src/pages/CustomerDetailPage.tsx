
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDataStore, OrderProduct, Product } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, User, Phone, Mail, MapPin, ShoppingCart, Plus, ShoppingBag } from 'lucide-react';

export const CustomerDetailPage = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const { customers, products, updateCustomer, addOrder, updateOrderStatus } = useDataStore();
  const customer = customers.find(c => c.id === customerId);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedCustomer, setEditedCustomer] = useState(customer ? {
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    address: customer.address || '',
  } : { name: '', email: '', phone: '', address: '' });
  
  const [isAddingOrder, setIsAddingOrder] = useState(false);
  const [orderProducts, setOrderProducts] = useState<OrderProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  
  const [viewingOrder, setViewingOrder] = useState<string | null>(null);
  
  if (!customer) {
    return (
      <div className="text-center p-10">
        <h1 className="text-2xl font-bold mb-4">Cliente não encontrado</h1>
        <Button onClick={() => navigate('/dashboard/customers')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para lista de clientes
        </Button>
      </div>
    );
  }
  
  const handleEditCustomer = () => {
    if (editedCustomer.name && editedCustomer.email && editedCustomer.phone) {
      updateCustomer(customer.id, editedCustomer);
      setIsEditing(false);
      toast.success('Cliente atualizado com sucesso');
    } else {
      toast.error('Preencha todos os campos obrigatórios');
    }
  };
  
  const handleAddProduct = () => {
    if (!selectedProductId || quantity <= 0) {
      toast.error('Selecione um produto e quantidade válida');
      return;
    }
    
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;
    
    // Verificar se o produto já está na lista
    const existingProduct = orderProducts.find(p => p.productId === selectedProductId);
    if (existingProduct) {
      setOrderProducts(orderProducts.map(p => 
        p.productId === selectedProductId 
          ? { ...p, quantity: p.quantity + quantity } 
          : p
      ));
    } else {
      setOrderProducts([...orderProducts, {
        productId: product.id,
        productName: product.name,
        quantity,
        price: product.price,
        images: product.images,
      }]);
    }
    
    setSelectedProductId('');
    setQuantity(1);
  };
  
  const handleRemoveProduct = (productId: string) => {
    setOrderProducts(orderProducts.filter(p => p.productId !== productId));
  };
  
  const calculateTotal = () => {
    return orderProducts.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };
  
  const handleCreateOrder = () => {
    if (orderProducts.length === 0) {
      toast.error('Adicione ao menos um produto ao pedido');
      return;
    }
    
    addOrder({
      customerId: customer.id,
      products: orderProducts,
      status: 'pending',
      total: calculateTotal(),
    });
    
    setOrderProducts([]);
    setIsAddingOrder(false);
    toast.success('Pedido criado com sucesso');
  };
  
  const handleUpdateOrderStatus = (orderId: string, newStatus: 'pending' | 'completed' | 'cancelled') => {
    updateOrderStatus(customer.id, orderId, newStatus);
    toast.success('Status do pedido atualizado');
  };

  const viewingOrderDetails = viewingOrder 
    ? customer.orders.find(order => order.id === viewingOrder) 
    : null;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate('/dashboard/customers')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>Editar Cliente</Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancelar</Button>
            <Button onClick={handleEditCustomer}>Salvar Alterações</Button>
          </div>
        )}
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" /> Detalhes do Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome *</Label>
                  <Input 
                    id="name" 
                    value={editedCustomer.name} 
                    onChange={(e) => setEditedCustomer({...editedCustomer, name: e.target.value})} 
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={editedCustomer.email} 
                    onChange={(e) => setEditedCustomer({...editedCustomer, email: e.target.value})} 
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input 
                    id="phone" 
                    value={editedCustomer.phone} 
                    onChange={(e) => setEditedCustomer({...editedCustomer, phone: e.target.value})} 
                  />
                </div>
                <div>
                  <Label htmlFor="address">Endereço</Label>
                  <Textarea 
                    id="address" 
                    value={editedCustomer.address} 
                    onChange={(e) => setEditedCustomer({...editedCustomer, address: e.target.value})} 
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start">
                  <User className="h-4 w-4 mr-2 mt-1" />
                  <div>
                    <strong>Nome:</strong>
                    <p>{customer.name}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Mail className="h-4 w-4 mr-2 mt-1" />
                  <div>
                    <strong>Email:</strong>
                    <p>{customer.email}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Phone className="h-4 w-4 mr-2 mt-1" />
                  <div>
                    <strong>Telefone:</strong>
                    <p>{customer.phone}</p>
                  </div>
                </div>
                {customer.address && (
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 mr-2 mt-1" />
                    <div>
                      <strong>Endereço:</strong>
                      <p>{customer.address}</p>
                    </div>
                  </div>
                )}
                <div className="pt-2">
                  <p className="text-sm text-muted-foreground">
                    Cliente desde: {new Date(customer.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2" /> Pedidos
              </CardTitle>
              <Button size="sm" onClick={() => setIsAddingOrder(true)}>
                <Plus className="h-4 w-4 mr-2" /> Novo Pedido
              </Button>
            </CardHeader>
            <CardContent>
              {customer.orders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingBag className="h-16 w-16 mx-auto mb-3 opacity-20" />
                  <p>Este cliente ainda não possui pedidos.</p>
                  <Button variant="outline" className="mt-4" onClick={() => setIsAddingOrder(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Criar Primeiro Pedido
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-3 px-4 text-left">ID</th>
                        <th className="py-3 px-4 text-left">Data</th>
                        <th className="py-3 px-4 text-left">Itens</th>
                        <th className="py-3 px-4 text-left">Total</th>
                        <th className="py-3 px-4 text-left">Status</th>
                        <th className="py-3 px-4 text-left">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customer.orders.map((order) => (
                        <tr key={order.id} className="border-b hover:bg-slate-50">
                          <td className="py-3 px-4 font-mono text-xs">{order.id}</td>
                          <td className="py-3 px-4">
                            {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="py-3 px-4">{order.products.length} produtos</td>
                          <td className="py-3 px-4">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(order.total)}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              order.status === 'completed' ? 'bg-green-100 text-green-800' :
                              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {order.status === 'completed' ? 'Concluído' :
                               order.status === 'pending' ? 'Pendente' : 'Cancelado'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline" onClick={() => setViewingOrder(order.id)}>
                                Detalhes
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Modal para adicionar pedido */}
      <Dialog open={isAddingOrder} onOpenChange={setIsAddingOrder}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Novo Pedido</DialogTitle>
            <DialogDescription>
              Selecione os produtos para o pedido de {customer.name}
            </DialogDescription>
          </DialogHeader>
          
          <div>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Label htmlFor="product">Produto</Label>
                <Select
                  value={selectedProductId}
                  onValueChange={setSelectedProductId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(product.price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-24">
                <Label htmlFor="quantity">Quant.</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                />
              </div>
              
              <div className="self-end">
                <Button onClick={handleAddProduct}>
                  <Plus className="h-4 w-4 mr-2" /> Adicionar
                </Button>
              </div>
            </div>
            
            <div className="border rounded-md overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-2">Produto</th>
                    <th className="text-center p-2">Quantidade</th>
                    <th className="text-right p-2">Preço</th>
                    <th className="text-right p-2">Subtotal</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {orderProducts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-muted-foreground">
                        Nenhum produto adicionado ao pedido
                      </td>
                    </tr>
                  ) : (
                    orderProducts.map((item) => (
                      <tr key={item.productId} className="border-t">
                        <td className="p-2">{item.productName}</td>
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
                        <td className="p-2 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveProduct(item.productId)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                  {orderProducts.length > 0 && (
                    <tr className="border-t">
                      <td colSpan={3} className="p-2 text-right font-bold">
                        Total:
                      </td>
                      <td className="p-2 text-right font-bold">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(calculateTotal())}
                      </td>
                      <td></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingOrder(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateOrder} disabled={orderProducts.length === 0}>
              Criar Pedido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal para ver detalhes do pedido */}
      <Dialog open={!!viewingOrder} onOpenChange={() => setViewingOrder(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido</DialogTitle>
            <DialogDescription>
              Pedido realizado em {viewingOrderDetails && new Date(viewingOrderDetails.createdAt).toLocaleString('pt-BR')}
            </DialogDescription>
          </DialogHeader>
          
          {viewingOrderDetails && (
            <>
              <div className="flex flex-col md:flex-row justify-between mb-6">
                <div>
                  <p className="font-medium">ID do Pedido:</p>
                  <p className="font-mono text-sm">{viewingOrderDetails.id}</p>
                </div>
                <div>
                  <p className="font-medium">Status:</p>
                  <Select
                    value={viewingOrderDetails.status}
                    onValueChange={(value) => handleUpdateOrderStatus(
                      viewingOrderDetails.id, 
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
                      {viewingOrderDetails.products.map((item) => (
                        <tr key={item.productId} className="border-t">
                          <td className="p-2">{item.productName}</td>
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
                      <tr className="border-t">
                        <td colSpan={3} className="p-2 text-right font-bold">
                          Total:
                        </td>
                        <td className="p-2 text-right font-bold">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(viewingOrderDetails.total)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
          
          <DialogFooter>
            <Button onClick={() => setViewingOrder(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
