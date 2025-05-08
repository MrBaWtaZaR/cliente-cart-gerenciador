import { useState } from 'react';
import { useDataStore } from '@/stores';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Package, Plus, Trash } from 'lucide-react';

interface AddOrderFormProps {
  customerId: string;
  onSuccess: () => void;
}

export const AddOrderForm = ({ customerId, onSuccess }: AddOrderFormProps) => {
  const { products, addOrder } = useDataStore();
  const [orderItems, setOrderItems] = useState<Array<{
    productId: string;
    quantity: number;
  }>>([{ productId: '', quantity: 1 }]);
  const [status, setStatus] = useState<'pending' | 'completed' | 'cancelled'>('pending');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    }
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);
  };

  // Função para calcular o subtotal de um item específico
  const calculateItemSubtotal = (productId: string, quantity: number) => {
    const product = products.find(p => p.id === productId);
    return product ? (product.price * quantity) : 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevenir múltiplos envios
    if (isSubmitting) {
      return;
    }
    
    // Validar se todos os itens têm produtos selecionados
    if (orderItems.some(item => !item.productId)) {
      toast.error('Selecione um produto para todos os itens');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const orderProducts = orderItems.map(item => {
        const product = products.find(p => p.id === item.productId);
        if (!product) {
          throw new Error(`Produto não encontrado: ${item.productId}`);
        }
        return {
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          price: product.price,
          images: product.images || []
        };
      });

      const total = calculateTotal();

      addOrder({
        customerId,
        products: orderProducts,
        status,
        total
      });

      toast.success('Pedido adicionado com sucesso!');
      
      // Reset form
      setOrderItems([{ productId: '', quantity: 1 }]);
      setStatus('pending');
      
      // Notify parent component
      onSuccess();
    } catch (error) {
      console.error("Erro ao adicionar pedido:", error);
      toast.error("Erro ao adicionar pedido. Por favor, tente novamente.");
    } finally {
      setIsSubmitting(false);
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
              {orderItems.length > 1 && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0" 
                  onClick={() => removeItem(index)}
                >
                  <Trash className="h-4 w-4 text-destructive" />
                </Button>
              )}
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
                  onChange={(e) => handleQuantityChange(index, parseInt(e.target.value))}
                />
              </div>
            </div>

            {item.productId && (
              <div className="text-sm text-right">
                Subtotal: R$ {calculateItemSubtotal(item.productId, item.quantity).toFixed(2)}
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
        <Label>Status do Pedido</Label>
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
      
      <div className="border-t pt-4 flex justify-between items-center">
        <div className="text-lg font-bold">
          Total: R$ {calculateTotal().toFixed(2)}
        </div>
        
        <Button type="submit">Adicionar Pedido</Button>
      </div>
    </form>
  );
};
