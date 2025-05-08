
import { useState, useEffect } from 'react';
import { useCustomerStore } from '@/stores';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Package, Plus, Trash, Save, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface EditOrderFormProps {
  customerId: string;
  order: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditOrderForm = ({ customerId, order, onSuccess, onCancel }: EditOrderFormProps) => {
  const { products, updateOrder } = useCustomerStore();
  const [orderItems, setOrderItems] = useState<Array<{
    productId: string;
    quantity: number;
    originalIndex?: number; // To track original items
  }>>([]);
  const [status, setStatus] = useState<'pending' | 'completed' | 'cancelled'>(order.status);
  
  // Initialize form with existing order data
  useEffect(() => {
    if (order && Array.isArray(order.products)) {
      setOrderItems(
        order.products.map((item: any, index: number) => ({
          productId: item.productId || "",
          quantity: item.quantity || 1,
          originalIndex: index
        }))
      );
      setStatus(order.status || 'pending');
    } else {
      // Initialize with empty item if no products
      setOrderItems([{ productId: '', quantity: 1 }]);
    }
  }, [order]);

  const handleProductChange = (index: number, productId: string) => {
    const newItems = [...orderItems];
    newItems[index].productId = productId;
    setOrderItems(newItems);
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const newItems = [...orderItems];
    newItems[index].quantity = Math.max(1, quantity);
    setOrderItems(newItems);
  };

  const addItem = () => {
    setOrderItems([...orderItems, { productId: '', quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter((_, i) => i !== index));
    } else {
      toast.error('Um pedido deve ter pelo menos um item');
    }
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate if all items have selected products
    if (orderItems.some(item => !item.productId)) {
      toast.error('Selecione um produto para todos os itens');
      return;
    }
    
    // Create updated order products list
    const orderProducts = orderItems.map(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        toast.error(`Produto não encontrado para o item: ${item.productId}`);
        return null;
      }
      return {
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        price: product.price,
        images: product.images
      };
    }).filter(p => p !== null);

    if (orderProducts.some(p => p === null)) {
      return; // Don't proceed if any products weren't found
    }

    const total = calculateTotal();

    // Update the order with new data
    try {
      updateOrder(customerId, order.id, {
        products: orderProducts,
        status,
        total
      });

      toast.success('Pedido atualizado com sucesso!');
      onSuccess();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Erro ao atualizar pedido');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="space-y-4">
        {orderItems.map((item, index) => (
          <div key={index} className="flex flex-col space-y-2 p-3 border rounded-md">
            <div className="flex justify-between items-center">
              <h4 className="font-medium flex items-center">
                <Package className="h-4 w-4 mr-2" />
                Item {index + 1}
              </h4>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0" 
                onClick={() => removeItem(index)}
                disabled={orderItems.length <= 1}
              >
                <Trash className="h-4 w-4 text-destructive" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor={`product-${index}`}>Produto</Label>
                <Select
                  value={item.productId}
                  onValueChange={(value) => handleProductChange(index, value)}
                >
                  <SelectTrigger id={`product-${index}`}>
                    <SelectValue placeholder="Selecione um produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - R$ {product.price.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor={`quantity-${index}`}>Quantidade</Label>
                <Input
                  id={`quantity-${index}`}
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                />
              </div>
            </div>

            {item.productId && (
              <div className="text-sm text-right">
                Subtotal: R$ {((products.find(p => p.id === item.productId)?.price || 0) * item.quantity).toFixed(2)}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <Button 
        type="button" 
        variant="outline" 
        size="sm" 
        className="w-full" 
        onClick={addItem}
      >
        <Plus className="h-4 w-4 mr-2" /> Adicionar Item
      </Button>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label>Status do Pedido</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Você pode alterar o status do pedido mesmo após finalizado</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Select
          value={status}
          onValueChange={(value: 'pending' | 'completed' | 'cancelled') => setStatus(value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="completed">Concluído</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="border-t pt-4 flex justify-between items-center sm:space-x-2 flex-col sm:flex-row gap-2 sm:gap-0">
        <div className="text-lg font-bold">
          Total: R$ {calculateTotal().toFixed(2)}
        </div>
        
        <div className="flex space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">
            <Save className="h-4 w-4 mr-2" /> Salvar Alterações
          </Button>
        </div>
      </div>
    </form>
  );
};
