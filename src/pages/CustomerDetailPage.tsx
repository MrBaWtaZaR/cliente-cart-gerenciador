
import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDataStore, Customer, Order } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Edit, ArrowLeft, Printer, Trash } from 'lucide-react';
import { toast } from 'sonner';
import { useReactToPrint } from 'react-to-print';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';

export const CustomerDetailPage = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const { customers, updateCustomer, deleteCustomer } = useDataStore();
  const [customer, setCustomer] = useState<Customer | undefined>(undefined);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCustomer, setEditedCustomer] = useState<Partial<Customer>>({});
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (customerId) {
      const foundCustomer = customers.find(c => c.id === customerId);
      setCustomer(foundCustomer);
      setEditedCustomer(foundCustomer || {});
    }
  }, [customerId, customers]);

  const order = customer?.orders[0];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedCustomer(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = () => {
    if (customerId) {
      updateCustomer(customerId, editedCustomer);
      setIsEditing(false);
      toast.success('Cliente atualizado com sucesso!');
    }
  };

  const confirmDelete = () => {
    if (customerId) {
      deleteCustomer(customerId);
      setIsDeleting(false);
      navigate('/dashboard/customers');
      toast.success('Cliente excluído com sucesso!');
    }
  };

  const formatDate = (date: Date) => {
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const formatDateTime = (date: Date) => {
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    documentTitle: `Pedido-${order?.id || 'Detalhes'}`,
    onPrintError: (error) => console.error('Erro ao imprimir', error),
    contentRef: printRef
  });

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
          <Button variant="outline" className="mr-2" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" /> Imprimir
          </Button>
          
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

      <Card ref={printRef} className="overflow-visible">
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
                <p>{customer.phone}</p>
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

          {order && (
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold">Pedido Recente</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>ID do Pedido</Label>
                  <p>{order.id}</p>
                </div>
                
                <div>
                  <Label>Data do Pedido</Label>
                  <p>{formatDateTime(order.createdAt)}</p>
                </div>
                
                <div>
                  <Label>Status</Label>
                  <Badge variant="secondary">{order.status}</Badge>
                </div>
                
                <div>
                  <Label>Total</Label>
                  <p>R$ {order.total.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Trash className="h-5 w-5 mr-2 text-destructive" /> Confirmar Exclusão
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este cliente?
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleting(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Excluir Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button variant="destructive" onClick={() => setIsDeleting(true)}>
        <Trash className="h-4 w-4 mr-2" /> Excluir Cliente
      </Button>
    </div>
  );
};
