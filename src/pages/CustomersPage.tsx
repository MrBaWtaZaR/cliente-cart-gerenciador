
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDataStore, Customer } from '@/stores';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Search, Plus, Users, X, UserPlus, Edit, Trash, Truck, Eye } from 'lucide-react';
import { PhoneFormatter } from '@/components/PhoneFormatter';
import { BrazilStateSelector } from '@/components/BrazilStateSelector';

export const CustomersPage = () => {
  const { customers, addCustomer, deleteCustomer } = useDataStore();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    tourName: '',
    tourSector: '',
    tourSeatNumber: '',
    tourCity: '',
    tourState: '',
    tourDepartureTime: '',
  });
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState('info');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewCustomer(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setNewCustomer(prev => ({ ...prev, [name]: value }));
  };

  const handleAddCustomer = () => {
    if (!newCustomer.name || !newCustomer.email || !newCustomer.phone) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    
    addCustomer(newCustomer);
    setNewCustomer({
      name: '',
      email: '',
      phone: '',
      address: '',
      tourName: '',
      tourSector: '',
      tourSeatNumber: '',
      tourCity: '',
      tourState: '',
      tourDepartureTime: '',
    });
    setIsAddingCustomer(false);
  };

  const confirmDeleteCustomer = () => {
    if (customerToDelete) {
      deleteCustomer(customerToDelete.id);
      setCustomerToDelete(null);
    }
  };

  const handleCustomerCardClick = (customerId: string) => {
    navigate(`/dashboard/customers/${customerId}`);
  };

  // Filtrar clientes de acordo com a pesquisa
  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchTerm.toLowerCase();
    return (
      customer.name.toLowerCase().includes(searchLower) ||
      customer.email.toLowerCase().includes(searchLower) ||
      customer.phone.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center">
          <Users className="h-6 w-6 mr-2" /> Clientes
        </h1>

        <Button onClick={() => setIsAddingCustomer(true)}>
          <Plus className="h-4 w-4 mr-2" /> Novo Cliente
        </Button>
      </div>

      <div className="relative w-full md:max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar clientes..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">Todos os Clientes</TabsTrigger>
          <TabsTrigger value="with-orders">Com Pedidos</TabsTrigger>
          <TabsTrigger value="without-orders">Sem Pedidos</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map(customer => (
                <CustomerCard 
                  key={customer.id} 
                  customer={customer} 
                  onClick={() => handleCustomerCardClick(customer.id)}
                  onDelete={() => setCustomerToDelete(customer)} 
                />
              ))
            ) : (
              <div className="col-span-3 text-center py-10 text-muted-foreground">
                {searchTerm ? "Nenhum cliente encontrado com esses termos." : "Nenhum cliente cadastrado."}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="with-orders">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCustomers.filter(c => c.orders.length > 0).length > 0 ? (
              filteredCustomers
                .filter(c => c.orders.length > 0)
                .map(customer => (
                  <CustomerCard 
                    key={customer.id} 
                    customer={customer} 
                    onClick={() => handleCustomerCardClick(customer.id)}
                    onDelete={() => setCustomerToDelete(customer)} 
                  />
                ))
            ) : (
              <div className="col-span-3 text-center py-10 text-muted-foreground">
                Nenhum cliente com pedidos.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="without-orders">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCustomers.filter(c => c.orders.length === 0).length > 0 ? (
              filteredCustomers
                .filter(c => c.orders.length === 0)
                .map(customer => (
                  <CustomerCard 
                    key={customer.id} 
                    customer={customer} 
                    onClick={() => handleCustomerCardClick(customer.id)}
                    onDelete={() => setCustomerToDelete(customer)} 
                  />
                ))
            ) : (
              <div className="col-span-3 text-center py-10 text-muted-foreground">
                Nenhum cliente sem pedidos.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal para adicionar cliente */}
      <Dialog open={isAddingCustomer} onOpenChange={setIsAddingCustomer}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <UserPlus className="h-5 w-5 mr-2" /> Adicionar Cliente
            </DialogTitle>
            <DialogDescription>
              Preencha as informações do novo cliente
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="info">Informações Pessoais</TabsTrigger>
              <TabsTrigger value="delivery" className="flex items-center">
                <Truck className="h-4 w-4 mr-2" /> Entrega/Excursão
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="info" className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Nome do cliente"
                  value={newCustomer.name}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={newCustomer.email}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="(00) 00000-0000"
                  value={newCustomer.phone}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="Endereço completo"
                  value={newCustomer.address}
                  onChange={handleInputChange}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="delivery" className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="tourName">Nome da Excursão</Label>
                <Input
                  id="tourName"
                  name="tourName"
                  placeholder="Nome da excursão"
                  value={newCustomer.tourName}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tourSector">Setor da Excursão</Label>
                <Select
                  value={newCustomer.tourSector}
                  onValueChange={(value) => handleSelectChange('tourSector', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um setor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="azul">Azul</SelectItem>
                    <SelectItem value="vermelho">Vermelho</SelectItem>
                    <SelectItem value="amarelo">Amarelo</SelectItem>
                    <SelectItem value="laranja">Laranja</SelectItem>
                    <SelectItem value="verde">Verde</SelectItem>
                    <SelectItem value="branco">Branco</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tourSeatNumber">Número da Vaga</Label>
                <Input
                  id="tourSeatNumber"
                  name="tourSeatNumber"
                  placeholder="Número da vaga"
                  value={newCustomer.tourSeatNumber}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tourCity">Cidade</Label>
                  <Input
                    id="tourCity"
                    name="tourCity"
                    placeholder="Cidade"
                    value={newCustomer.tourCity}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tourState">Estado</Label>
                  <BrazilStateSelector
                    value={newCustomer.tourState}
                    onChange={(value) => handleSelectChange('tourState', value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tourDepartureTime">Horário de Saída</Label>
                <Input
                  id="tourDepartureTime"
                  name="tourDepartureTime"
                  placeholder="Ex: 08:30"
                  value={newCustomer.tourDepartureTime}
                  onChange={handleInputChange}
                />
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingCustomer(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddCustomer}>
              Adicionar Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmação de exclusão */}
      <Dialog open={!!customerToDelete} onOpenChange={() => setCustomerToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Trash className="h-5 w-5 mr-2 text-destructive" /> Confirmar Exclusão
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este cliente?{" "}
              {customerToDelete?.orders.length ? (
                <span className="font-semibold text-destructive">
                  Todos os pedidos associados também serão excluídos.
                </span>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          
          {customerToDelete && (
            <div className="py-4">
              <p><strong>Nome:</strong> {customerToDelete.name}</p>
              <p><strong>Email:</strong> {customerToDelete.email}</p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomerToDelete(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDeleteCustomer}>
              Excluir Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface CustomerCardProps {
  customer: Customer;
  onClick: () => void;
  onDelete: () => void;
}

const CustomerCard = ({ customer, onClick, onDelete }: CustomerCardProps) => (
  <Card className="overflow-hidden hover:shadow-md transition-all cursor-pointer" onClick={(e) => {
    // Prevent card click when clicking on buttons
    if ((e.target as HTMLElement).closest('button')) {
      e.stopPropagation();
      return;
    }
    onClick();
  }}>
    <CardHeader className="pb-2">
      <CardTitle>{customer.name}</CardTitle>
      <CardDescription>{customer.email}</CardDescription>
    </CardHeader>
    <CardContent className="pb-2">
      <p className="text-sm"><strong>Telefone:</strong> <span>{customer.phone}</span></p>
      {customer.address && (
        <p className="text-sm"><strong>Endereço:</strong> {customer.address}</p>
      )}
      <p className="text-sm mt-2">
        <strong>Pedidos:</strong>{" "}
        <span className={`font-medium ${customer.orders.length ? "text-primary" : "text-muted-foreground"}`}>
          {customer.orders.length || "Nenhum"}
        </span>
      </p>
    </CardContent>
    <CardFooter className="flex justify-between">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <Trash className="h-4 w-4 mr-2" /> Excluir
      </Button>
      <Button 
        size="sm" 
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <Eye className="h-4 w-4 mr-2" /> Detalhes
      </Button>
    </CardFooter>
  </Card>
);
