
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  createdAt: Date;
  orders: Order[];
  // Campos para informações de excursão
  tourName?: string;
  tourSector?: string;
  tourSeatNumber?: string;
  tourCity?: string;
  tourState?: string;
  tourDepartureTime?: string;
}

export interface Order {
  id: string;
  customerId: string;
  products: OrderProduct[];
  status: 'pending' | 'completed' | 'cancelled';
  total: number;
  createdAt: Date;
}

export interface OrderProduct {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  images: string[]; // Remove the initializer
}
