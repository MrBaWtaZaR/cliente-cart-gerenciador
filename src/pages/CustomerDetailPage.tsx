
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDataStore, Customer } from '@/stores';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Edit, ArrowLeft, Trash, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AddOrderForm } from '@/components/AddOrderForm';
import { OrderCard } from '@/components/OrderCard';
import { PhoneFormatter } from '@/components/PhoneFormatter';
import { TimeFormatter } from '@/components/TimeFormatter';
import { BrazilStateSelector } from '@/components/BrazilStateSelector';

export const CustomerDetailPage = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const { customers, updateCustomer, deleteCustomer } = useDataStore();
  const [customer, setCustomer] = useState<Customer | undefined>(undefined);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCustomer, setEditedCustomer] = useState<Partial<Customer>>({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddingOrder, setIsAddingOrder] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (customerId) {
      const foundCustomer = customers.find(c => c.id === customerId);
      setCustomer(foundCustomer);
      setEditedCustomer(foundCustomer || {});
    }
  }, [customerId, customers]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedCustomer(prev => ({ ...prev, [name]: value }));
  };

  const handleStateChange = (value: string) => {
    setEditedCustomer(prev => ({ ...prev, tourState: value }));
  };

  const handleSaveChanges = () => {
    if (customerId) {
      updateCustomer(customerId, editedCustomer);
      setIsEditing(false);
      toast.success('Cliente atualizado com sucesso!');
    }
  };

  const handleOpenDeleteDialog = () => {
    setIsDeleting(true);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleting(false);
  };

  const handleOpenAddOrderDialog = () => {
    setIsAddingOrder(true);
  };

  const handleCloseAddOrderDialog = () => {
    setIsAddingOrder(false);
  };

  const confirmDelete = () => {
    if (customerId) {
      deleteCustomer(customerId);
      handleCloseDeleteDialog();
      navigate('/dashboard/customers');
      toast.success('Cliente excluído com sucesso!');
    }
  };

  const formatDate = (date: Date) => {
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  if (!customer) {
    return <div>Cliente não encontrado.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button asChild variant="ghost">
          <Link to="/dashboard/customers" className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Link>
        </Button>
        
        <div>
          {isEditing ? (
            <>
              <Button variant="secondary" className="mr-2" onClick={() => setIsEditing(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveChanges}>Salvar</Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" /> Editar
            </Button>
          )}
        </div>
      </div>

      <Card className="overflow-visible">
        <CardHeader>
          <CardTitle>
            {isEditing ? (
              <Input
                name="name"
                value={editedCustomer.name || ''}
                onChange={handleInputChange}
                placeholder="Nome do cliente"
              />
            ) : (
              customer.name
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Email</Label>
              {isEditing ? (
                <Input
                  name="email"
                  type="email"
                  value={editedCustomer.email || ''}
                  onChange={handleInputChange}
                  placeholder="Email do cliente"
                />
              ) : (
                <p>{customer.email}</p>
              )}
            </div>
            
            <div>
              <Label>Telefone</Label>
              {isEditing ? (
                <Input
                  name="phone"
                  value={editedCustomer.phone || ''}
                  onChange={handleInputChange}
                  placeholder="Telefone do cliente"
                />
              ) : (
                <PhoneFormatter phone={customer.phone} />
              )}
            </div>
          </div>
          
          <div>
            <Label>Endereço</Label>
            {isEditing ? (
              <Input
                name="address"
                value={editedCustomer.address || ''}
                onChange={handleInputChange}
                placeholder="Endereço do cliente"
              />
            ) : (
              <p>{customer.address || 'Não informado'}</p>
            )}
          </div>

          <div>
            <Label>Data de Cadastro</Label>
            <p>{formatDate(customer.createdAt)}</p>
          </div>
          
          {/* Informações de Excursão */}
          <div className="border-t pt-4 mt-4">
            <h3 className="text-lg font-semibold mb-4">Informações de Excursão</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nome da Excursão</Label>
                {isEditing ? (
                  <Input
                    name="tourName"
                    value={editedCustomer.tourName || ''}
                    onChange={handleInputChange}
                    placeholder="Nome da excursão"
                  />
                ) : (
                  <p>{customer.tourName || 'Não informado'}</p>
                )}
              </div>
              
              <div>
                <Label>Setor</Label>
                {isEditing ? (
                  <Input
                    name="tourSector"
                    value={editedCustomer.tourSector || ''}
                    onChange={handleInputChange}
                    placeholder="Setor da excursão"
                  />
                ) : (
                  <p>{customer.tourSector || 'Não informado'}</p>
                )}
              </div>
              
              <div>
                <Label>Número do Assento</Label>
                {isEditing ? (
                  <Input
                    name="tourSeatNumber"
                    value={editedCustomer.tourSeatNumber || ''}
                    onChange={handleInputChange}
                    placeholder="Número do assento"
                  />
                ) : (
                  <p>{customer.tourSeatNumber || 'Não informado'}</p>
                )}
              </div>
              
              <div>
                <Label>Cidade</Label>
                {isEditing ? (
                  <Input
                    name="tourCity"
                    value={editedCustomer.tourCity || ''}
                    onChange={handleInputChange}
                    placeholder="Cidade da excursão"
                  />
                ) : (
                  <p>{customer.tourCity || 'Não informado'}</p>
                )}
              </div>
              
              <div>
                <Label>Estado</Label>
                {isEditing ? (
                  <BrazilStateSelector 
                    value={editedCustomer.tourState || ''} 
                    onChange={handleStateChange}
                  />
                ) : (
                  <p>{customer.tourState || 'Não informado'}</p>
                )}
              </div>
              
              <div>
                <Label>Horário de Partida</Label>
                {isEditing ? (
                  <Input
                    name="tourDepartureTime"
                    value={editedCustomer.tourDepartureTime || ''}
                    onChange={handleInputChange}
                    placeholder="Horário de partida"
                  />
                ) : (
                  <TimeFormatter time={customer.tourDepartureTime || ''} />
                )}
              </div>
            </div>
          </div>

          {customer.orders.length > 0 && (
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Pedidos</h3>
                <Button 
                  size="sm" 
                  onClick={handleOpenAddOrderDialog}
                  className="ml-auto"
                >
                  <Plus className="h-4 w-4 mr-2" /> Adicionar Pedido
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customer.orders.map(order => {
                  // Prepare order with customer information for OrderCard
                  const orderWithCustomer = {
                    ...order,
                    customerName: customer.name
                  };
                  return (
                    <OrderCard 
                      key={order.id} 
                      order={orderWithCustomer} 
                      customerName={customer.name} 
                    />
                  );
                })}
              </div>
            </div>
          )}
          
          {customer.orders.length === 0 && (
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Pedidos</h3>
                <Button 
                  size="sm" 
                  onClick={handleOpenAddOrderDialog}
                >
                  <Plus className="h-4 w-4 mr-2" /> Adicionar Pedido
                </Button>
              </div>
              <p className="text-muted-foreground mt-2">Nenhum pedido encontrado.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Trash className="h-5 w-5 mr-2 text-destructive" /> Confirmar Exclusão
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este cliente?
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDeleteDialog}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Excluir Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isAddingOrder} onOpenChange={setIsAddingOrder}>
        <DialogContent className="sm:max-w-lg" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Plus className="h-5 w-5 mr-2" /> Adicionar Pedido
            </DialogTitle>
            <DialogDescription>
              Adicione um novo pedido para {customer.name}
            </DialogDescription>
          </DialogHeader>
          
          <AddOrderForm 
            customerId={customer.id} 
            onSuccess={handleCloseAddOrderDialog} 
          />
        </DialogContent>
      </Dialog>

      <Button variant="destructive" onClick={handleOpenDeleteDialog}>
        <Trash className="h-4 w-4 mr-2" /> Excluir Cliente
      </Button>
    </div>
  );
};
