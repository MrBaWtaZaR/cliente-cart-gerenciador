
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Order } from '@/lib/data';
import { ShoppingCart, Calendar, Clock } from 'lucide-react';
import { useState } from 'react';

interface OrderCardProps {
  order: Order;
  customerName: string;
  onClick?: () => void; // Make onClick optional
}

export const OrderCard = ({ order, customerName, onClick }: OrderCardProps) => {
  const navigate = useNavigate();
  // Track images with loading errors
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/dashboard/orders?view=${order.id}`);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 border-green-200 text-green-800';
      case 'pending':
        return 'bg-yellow-100 border-yellow-200 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 border-red-200 text-red-800';
      default:
        return 'bg-gray-100 border-gray-200 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluído';
      case 'pending': return 'Pendente';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  // Handle image errors
  const handleImageError = (productId: string, index: number) => {
    setFailedImages(prev => ({ ...prev, [`${productId}-${index}`]: true }));
  };

  return (
    <Card 
      className="h-full hover:shadow-md transition-all cursor-pointer"
      onClick={handleClick}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex justify-between">
          <span className="text-primary truncate">{customerName}</span>
          <Badge variant="outline" className={`${getStatusColor(order.status)} border px-2 py-1`}>
            {getStatusText(order.status)}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-2">
        <div className="flex items-center space-x-2 text-sm">
          <Calendar size={16} className="text-muted-foreground" />
          <span>{formatDate(order.createdAt)}</span>
          <Clock size={16} className="text-muted-foreground ml-2" />
          <span>{formatTime(order.createdAt)}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <ShoppingCart size={16} className="text-muted-foreground" />
          <span className="text-sm">{order.products.length} produto(s)</span>
        </div>

        {order.products.slice(0, 2).map((product, index) => (
          <div key={`${product.productId}-${index}`} className="flex justify-between text-xs text-muted-foreground">
            <span className="truncate flex-1">{product.productName}</span>
            <span>x{product.quantity}</span>
          </div>
        ))}
        {order.products.length > 2 && (
          <div className="text-xs text-muted-foreground italic">
            + {order.products.length - 2} mais produto(s)
          </div>
        )}
      </CardContent>
      
      <CardFooter className="border-t pt-3 mt-2">
        <div className="font-bold text-lg text-primary">
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(order.total)}
        </div>
      </CardFooter>
    </Card>
  );
};
