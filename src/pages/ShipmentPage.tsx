import React, { useState, useEffect, useRef } from 'react';
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

  const tableRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  // Fetch shipments when component mounts or when dependencies change
  useEffect(() => {
    const fetchShipments = async () => {
      try {
        await getShipments();
      } catch (error) {
        console.error("Error fetching shipments:", error);
        toast.error("Falha ao carregar envios. Por favor, recarregue a página.");
      }
    };
    
    fetchShipments();
  }, [getShipments]);

  const handlePrintTable = useReactToPrint({
    documentTitle: `Tabela_de_Envio_${format(new Date(), 'dd-MM-yyyy')}`,
    onBeforePrint: () => {
      return new Promise<void>((resolve) => {
        setTimeout(resolve, 250);
      });
    },
    onAfterPrint: () => {
      toast.success('PDF da tabela gerado com sucesso');
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
      toast.success('PDF dos cards gerado com sucesso');
    },
    contentRef: cardsRef,
  });

  const handleCreateShipment = async () => {
    if (selectedCustomers.length === 0) {
      toast.error('Selecione pelo menos um cliente para criar um envio');
      return;
    }

    setIsLoading(true);
    try {
      const shipment = await addShipment(selectedCustomers);
      if (!shipment) {
        throw new Error("Falha ao criar envio");
      }
      
      setSelectedShipment(shipment);
      setIsSelectingCustomers(false);
      setIsCreatingShipment(true);
      
      // Reset selection
      setSelectedCustomers([]);
      
      // Fetch updated shipments
      await getShipments();
      toast.success('Envio criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar envio:', error);
      toast.error('Erro ao criar envio. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowShipmentDetails = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setShowShipmentDetails(true);
  };

  const handleGeneratePDFs = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setIsCreatingShipment(true);
  };

  const handleDeleteShipment = async () => {
    if (!selectedShipment) return;
    
    setIsLoading(true);
    try {
      await deleteShipment(selectedShipment.id);
      setShowDeleteConfirm(false);
      setShowShipmentDetails(false);
      await getShipments(); // Refresh the shipments list after deletion
      toast.success('Envio excluído com sucesso');
    } catch (error) {
      console.error('Erro ao excluir envio:', error);
      toast.error('Erro ao excluir envio');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditShipment = () => {
    if (!selectedShipment) return;
    
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

    setIsLoading(true);
    try {
      await updateShipment(selectedShipment.id, selectedCustomers);
      
      setIsSelectingCustomers(false);
      setIsEditing(false);
      setSelectedCustomers([]);
      
      // Fetch updated shipments
      await getShipments();
      toast.success('Envio atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar envio:', error);
      toast.error('Erro ao atualizar envio. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleCustomer = (customerId: string) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId)
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const handleCloseAll = () => {
    setIsCreatingShipment(false);
    setShowShipmentDetails(false);
    setIsSelectingCustomers(false);
    setIsEditing(false);
    setSelectedShipment(null);
  };

  return (
    <div className="container space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Preparando Envio</h1>
        <Button onClick={() => {
          setIsEditing(false);
          setSelectedCustomers([]);
          setIsSelectingCustomers(true);
        }}>
          <Plus className="mr-2 h-4 w-4" /> Fazer um novo envio
        </Button>
      </div>

      {/* Histórico de Envios */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Histórico de Envios</h2>
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
      </section>

      {/* Dialog para seleção de clientes */}
      <Dialog open={isSelectingCustomers} onOpenChange={(open) => {
        if (!open) {
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
                : 'Selecione os clientes que deseja incluir neste envio.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <span>Total selecionado: {selectedCustomers.length} clientes</span>
              <Button
                size="sm"
                onClick={() => setSelectedCustomers(
                  selectedCustomers.length === customers.length 
                    ? [] 
                    : customers.map(c => c.id)
                )}
              >
                {selectedCustomers.length === customers.length ? 'Desmarcar todos' : 'Selecionar todos'}
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
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsSelectingCustomers(false);
              if (isEditing) {
                setIsEditing(false);
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
      <Dialog open={showShipmentDetails} onOpenChange={setShowShipmentDetails}>
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
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Excluir
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleEditShipment}
                >
                  <Edit className="mr-2 h-4 w-4" /> Editar
                </Button>
                <Button variant="outline" onClick={() => setShowShipmentDetails(false)}>
                  Fechar
                </Button>
                <Button onClick={() => {
                  handleGeneratePDFs(selectedShipment);
                  setShowShipmentDetails(false);
                }}>
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
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteShipment} className="bg-destructive text-destructive-foreground">
              {isLoading ? 'Excluindo...' : 'Excluir'}
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
